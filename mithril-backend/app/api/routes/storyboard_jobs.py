"""Storyboard generation job management API endpoints."""

import json
import logging
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status
from google import genai
from google.genai import types
from pydantic import BaseModel

from app.api.deps import AuthenticatedUser
from app.config import get_settings
from app.models.job import (
    JobDocument,
    JobError,
    JobStatus,
    JobSubmitResponse,
    JobType,
    StoryboardCharacterIdSummary,
    StoryboardClip,
    StoryboardJobSubmitRequest,
    StoryboardJobStatusResponse,
    StoryboardScene,
    StoryboardVoicePrompt,
)
from app.services.firestore import get_job_queue_service
from app.workers.tasks import process_storyboard_job, process_storyboard_reference_job

logger = logging.getLogger(__name__)
settings = get_settings()

TRAILER_OPTIONS_MODEL = "gemini-2.5-pro"

TRAILER_OPTIONS_PROMPT_TEMPLATE = """다음 웹소설 텍스트를 기반으로 트레일러 더빙 스크립트 옵션 3가지를 생성해주세요.

옵션 1: Input 텍스트상 chronological 흐름을 따라가되, 긴박함/초조 -> 일상 -> 긴박함/초조 이렇게 alternate 하는식으로 대사, 나레이션 발췌해서 Reel 형식으로 발췌기반 출력해줘. 초반에 일상적인 부분에서, '나중에 비극으로 변할' 현재 행복한 장면, 사망 플래그 혹은 비극 플래그가 되는 대사/나레이션 발췌일수록 좋음.
옵션 2: 대사 및 나레이션 중 "왜 이런 말을 하지?" "왜 이런 행동을 하지"? 등 상식과 도덕 선에서 수용하거나 이해하기 어려운 대사/나레이션을 Highlight Reel 형식으로 발췌
옵션 3: 주인공이 독백하는 스크립트 형식, 감정의 변화가 명확하며 끝에가서 더는 가만히 있지 않겠다, 바꾸겠다, 뭐 하겠다는 결의가 마무리부분에서 표출되어야 함. 그리고 주인공이 누군지 정도는 시청자에게 정보적으로 제공되어야함.

**[CRITICAL: 전체 텍스트 분석 및 캐릭터 반영 규칙]**
- 제공된 원본 텍스트 전체(처음부터 끝까지)를 반드시 모두 읽고 분석하십시오. 초반부(예: 1~2화) 내용에만 편중되지 않도록 주의하며, 중후반부의 핵심 사건과 대사도 트레일러에 골고루 발췌해야 합니다.
- 텍스트 내에서 2번 이상 등장하거나 서사에 영향을 미치는 조연 및 주요 캐릭터들을 절대 임의로 누락하지 마십시오. 다양한 인물들의 대사와 시점이 트레일러 스크립트에 고르게 반영되도록 구성하십시오.

**[CRITICAL: 스크립트 분량 및 분할 규칙]**
- 각 옵션의 전체 길이는 영상으로 제작했을 때 약 1분 15초(75초) 분량이 되어야 합니다.
- 각 대사/나레이션 라인(배열의 한 요소)은 영상에서 약 4초 길이의 한 클립에 해당한다고 가정하십시오.
- 따라서 1분 15초 분량을 채우기 위해 각 옵션당 약 18~20개의 라인(배열 요소)이 생성되어야 합니다.
- 하나의 긴 대사나 나레이션이 있다면, 4초 분량(읽는 속도 기준)에 맞게 여러 개의 라인(배열 요소)으로 쪼개어 분리하십시오.

**[CRITICAL: 스크립트 출력 형식 규칙]**
- 각 대사 및 나레이션은 반드시 개별 문자열(배열의 요소)로 분리되어야 하며, 화면에 출력될 때 줄바꿈으로 구분될 수 있도록 해야 합니다.
- 각 대사/나레이션은 반드시 누가 말하는지, 어떤 감정/톤으로 말하는지 명시하는 다음 형식을 엄격히 따라야 합니다:
  캐릭터이름: [감정/톤] 대사 내용
  캐릭터이름(독백): [감정/톤] 독백 내용
- 예시:
  레온: [울먹이며] 어마어마, 왜 저를 나으셨습니까?
  엘리사(독백): [슬프게] 왜 이렇게 돼 버린걸까?

각 옵션마다, 다음 3개의 무음 화면 스크립트 라인이 반드시 포함되어야 합니다:
- [무음] Revell 회사로고 기입화면
- [무음] 원작 작가 크레딧 기입화면
- [무음] 작품로고 타이틀 화면

원본 텍스트:
---
{source_text}
---
"""

TRAILER_OPTIONS_RESPONSE_SCHEMA = {
    "type": "ARRAY",
    "items": {
        "type": "OBJECT",
        "properties": {
            "id": {"type": "INTEGER"},
            "title": {"type": "STRING"},
            "script": {
                "type": "ARRAY",
                "items": {"type": "STRING"},
            },
        },
        "required": ["id", "title", "script"],
    },
}


class GenerateTrailerOptionsRequest(BaseModel):
    source_text: str
    project_id: str = ""


router = APIRouter(prefix="/storyboard-jobs", tags=["storyboard-jobs"])


@router.post("/generate-trailer-options")
async def generate_trailer_options(
    request: GenerateTrailerOptionsRequest,
    user: AuthenticatedUser,
) -> list[dict]:
    """
    Generate 3 trailer dubbing script options from source text.

    Each option contains a list of script lines in the format:
    - Dialogue: `캐릭터명: [감정] 대사`
    - Monologue: `캐릭터명(독백): [감정] 대사`
    """
    if not settings.gemini_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Gemini API key not configured",
        )

    prompt = TRAILER_OPTIONS_PROMPT_TEMPLATE.format(source_text=request.source_text)
    client = genai.Client(api_key=settings.gemini_api_key)

    try:
        response = await client.aio.models.generate_content(
            model=TRAILER_OPTIONS_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=TRAILER_OPTIONS_RESPONSE_SCHEMA,
                max_output_tokens=16384,
            ),
        )
    except Exception as e:
        logger.exception(f"[TRAILER-OPTIONS] Gemini call failed for user {user.uid}: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to generate trailer options: {e}",
        )

    response_text = response.text.strip() if response.text else ""
    if not response_text:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Empty response from Gemini API",
        )

    try:
        result = json.loads(response_text)
    except json.JSONDecodeError as e:
        logger.error(f"[TRAILER-OPTIONS] Invalid JSON from Gemini: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Invalid JSON response from Gemini API",
        )

    logger.info(f"[TRAILER-OPTIONS] Generated {len(result)} options for user {user.uid}")
    return result


@router.post("/submit", response_model=JobSubmitResponse)
async def submit_storyboard_job(
    request: StoryboardJobSubmitRequest,
    user: AuthenticatedUser,
) -> JobSubmitResponse:
    """
    Submit a storyboard generation job.

    Generates a storyboard with scenes, clips, and voice prompts from source text.
    The job will be queued for processing by background workers.
    """
    logger.info(f"[STORYBOARD-API] ========== Received storyboard job ==========")
    logger.info(f"[STORYBOARD-API] User: {user.uid}, Project: {request.project_id}")
    logger.info(f"[STORYBOARD-API] Text length: {len(request.source_text)} chars")
    logger.info(f"[STORYBOARD-API] Target time: {request.target_time}")
    logger.info(f"[STORYBOARD-API] Part index: {request.part_index}")
    logger.info(f"[STORYBOARD-API] Has custom API key: {bool(request.api_key)}")

    job_queue_service = get_job_queue_service()

    # Create job in Firestore
    logger.debug(f"[STORYBOARD-API] Creating storyboard job in Firestore...")
    job = await job_queue_service.create_storyboard_job(request, user.uid)
    logger.info(f"[STORYBOARD-API] Job created: {job.id}")

    # Queue for processing (pass API key through task queue, not stored in DB)
    logger.debug(f"[STORYBOARD-API] Queuing job {job.id} for processing...")
    await process_storyboard_job.kiq(job.id, request.api_key)
    logger.info(f"[STORYBOARD-API] Job {job.id} queued successfully")

    return JobSubmitResponse(
        job_id=job.id,
        status=job.status,
        created_at=job.created_at,
    )


@router.post("/submit-reference", response_model=JobSubmitResponse)
async def submit_storyboard_reference_job(
    request: StoryboardJobSubmitRequest,
    user: AuthenticatedUser,
) -> JobSubmitResponse:
    """
    Submit a storyboard generation job using the reference-style prompt variant.

    This is intended for A/B comparison against the default `/submit` pipeline.
    """
    logger.info(f"[STORYBOARD-API-REF] ========== Received storyboard reference job ==========")
    logger.info(f"[STORYBOARD-API-REF] User: {user.uid}, Project: {request.project_id}")
    logger.info(f"[STORYBOARD-API-REF] Text length: {len(request.source_text)} chars")
    logger.info(f"[STORYBOARD-API-REF] Target time: {request.target_time}")
    logger.info(f"[STORYBOARD-API-REF] Part index: {request.part_index}")
    logger.info(f"[STORYBOARD-API-REF] Has custom API key: {bool(request.api_key)}")

    job_queue_service = get_job_queue_service()
    job = await job_queue_service.create_storyboard_job(request, user.uid)
    logger.info(f"[STORYBOARD-API-REF] Job created: {job.id}")

    await process_storyboard_reference_job.kiq(job.id, request.api_key)
    logger.info(f"[STORYBOARD-API-REF] Job {job.id} queued successfully")

    return JobSubmitResponse(
        job_id=job.id,
        status=job.status,
        created_at=job.created_at,
    )


@router.get("/{job_id}/status", response_model=StoryboardJobStatusResponse)
async def get_storyboard_job_status(
    job_id: str,
    user: AuthenticatedUser,
) -> StoryboardJobStatusResponse:
    """
    Get the current status of a storyboard generation job.

    Returns detailed status including progress, scenes, clips, voice prompts,
    and error information (if failed).
    """
    job_queue_service = get_job_queue_service()

    job = await job_queue_service.get_job(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job {job_id} not found",
        )

    # Verify this is a storyboard job
    if job.type != JobType.STORYBOARD:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Job {job_id} is not a storyboard job",
        )

    # Verify user owns this job
    if job.user_id != user.uid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this job",
        )

    # Build error object if job has error
    error = None
    if job.error_code:
        error = JobError(
            code=job.error_code,
            message=job.error_message or "Unknown error",
            retryable=job.error_retryable or False,
        )

    # Convert storyboard_result to typed objects
    scenes = None
    voice_prompts = None
    character_id_summary = None
    genre = None
    scene_count = None
    clip_count = None

    if job.storyboard_result:
        result = job.storyboard_result
        if "scenes" in result:
            scenes = [
                StoryboardScene(
                    sceneTitle=s.get("sceneTitle", ""),
                    clips=[StoryboardClip(**c) for c in s.get("clips", [])],
                )
                for s in result["scenes"]
            ]
            scene_count = len(scenes)
            clip_count = sum(len(s.clips) for s in scenes)

        if "voicePrompts" in result:
            voice_prompts = [
                StoryboardVoicePrompt(**vp)
                for vp in result["voicePrompts"]
            ]

        if "characterIdSummary" in result:
            character_id_summary = [
                StoryboardCharacterIdSummary(**c)
                for c in result["characterIdSummary"]
            ]

        genre = result.get("genre")

    return StoryboardJobStatusResponse(
        job_id=job.id,
        status=job.status,
        progress=job.progress,
        scenes=scenes,
        voice_prompts=voice_prompts,
        character_id_summary=character_id_summary,
        genre=genre,
        scene_count=scene_count,
        clip_count=clip_count,
        error=error,
        created_at=job.created_at,
        updated_at=job.updated_at,
        completed_at=job.completed_at,
    )


@router.post("/{job_id}/cancel")
async def cancel_storyboard_job(
    job_id: str,
    user: AuthenticatedUser,
) -> dict:
    """
    Request cancellation of a storyboard generation job.

    The job will be cancelled if still in progress.
    Jobs that have already completed or failed cannot be cancelled.
    """
    job_queue_service = get_job_queue_service()

    job = await job_queue_service.get_job(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job {job_id} not found",
        )

    # Verify this is a storyboard job
    if job.type != JobType.STORYBOARD:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Job {job_id} is not a storyboard job",
        )

    # Verify user owns this job
    if job.user_id != user.uid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this job",
        )

    # Request cancellation
    cancelled = await job_queue_service.mark_cancellation_requested(job_id)

    if not cancelled:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Job {job_id} cannot be cancelled (status: {job.status.value})",
        )

    logger.info(f"Cancellation requested for storyboard job {job_id} by user {user.uid}")

    return {
        "job_id": job_id,
        "message": "Cancellation requested",
        "previous_status": job.status.value,
    }


@router.get("/project/{project_id}", response_model=list[StoryboardJobStatusResponse])
async def get_project_storyboard_jobs(
    project_id: str,
    user: AuthenticatedUser,
    status_filter: Annotated[list[str] | None, Query(alias="status")] = None,
    limit: int = Query(default=50, le=100),
) -> list[StoryboardJobStatusResponse]:
    """
    Get all storyboard generation jobs for a project.

    Optionally filter by status.
    """
    job_queue_service = get_job_queue_service()

    # Convert status strings to enum
    status_enums = None
    if status_filter:
        try:
            status_enums = [JobStatus(s) for s in status_filter]
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status filter: {e}",
            )

    # Get jobs from Firestore
    db = job_queue_service.db
    query = (
        db.collection(job_queue_service.COLLECTION)
        .where("project_id", "==", project_id)
        .where("type", "==", JobType.STORYBOARD.value)
    )

    if status_enums:
        status_values = [s.value for s in status_enums]
        query = query.where("status", "in", status_values)

    query = query.order_by("created_at", direction="DESCENDING")
    query = query.limit(limit)

    docs = await query.get()
    jobs = [JobDocument(**doc.to_dict()) for doc in docs]

    # Filter to only jobs owned by this user
    user_jobs = [j for j in jobs if j.user_id == user.uid]

    responses = []
    for job in user_jobs:
        error = None
        if job.error_code:
            error = JobError(
                code=job.error_code,
                message=job.error_message or "Unknown error",
                retryable=job.error_retryable or False,
            )

        scenes = None
        voice_prompts = None
        character_id_summary = None
        genre = None
        scene_count = None
        clip_count = None

        if job.storyboard_result:
            result = job.storyboard_result
            if "scenes" in result:
                scenes = [
                    StoryboardScene(
                        sceneTitle=s.get("sceneTitle", ""),
                        clips=[StoryboardClip(**c) for c in s.get("clips", [])],
                    )
                    for s in result["scenes"]
                ]
                scene_count = len(scenes)
                clip_count = sum(len(s.clips) for s in scenes)

            if "voicePrompts" in result:
                voice_prompts = [
                    StoryboardVoicePrompt(**vp)
                    for vp in result["voicePrompts"]
                ]

            if "characterIdSummary" in result:
                character_id_summary = [
                    StoryboardCharacterIdSummary(**c)
                    for c in result["characterIdSummary"]
                ]

            genre = result.get("genre")

        responses.append(
            StoryboardJobStatusResponse(
                job_id=job.id,
                status=job.status,
                progress=job.progress,
                scenes=scenes,
                voice_prompts=voice_prompts,
                character_id_summary=character_id_summary,
                genre=genre,
                scene_count=scene_count,
                clip_count=clip_count,
                error=error,
                created_at=job.created_at,
                updated_at=job.updated_at,
                completed_at=job.completed_at,
            )
        )

    return responses
