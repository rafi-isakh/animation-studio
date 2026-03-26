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
from app.workers.tasks import process_storyboard_job

logger = logging.getLogger(__name__)
settings = get_settings()

TRAILER_OPTIONS_MODEL = "gemini-2.5-pro"

TRAILER_OPTIONS_PROMPT_TEMPLATE = """아래 웹소설 원문 전체를 처음부터 끝까지 빠짐없이 정독한 뒤, 트레일러 더빙용 스크립트 옵션 3가지를 생성하세요.

**[STEP 1: 전체 텍스트 캐릭터 분석 — 스크립트 작성 전 반드시 수행]**
원문 전체(1화~마지막 화)를 순서대로 읽으며 아래를 파악하세요:
1. 원문에서 **2회 이상 등장하는 모든 캐릭터**를 빠짐없이 목록화하세요.
2. 각 캐릭터의 주요 감정선, 핵심 대사, 다른 캐릭터와의 관계를 파악하세요.
3. **1화 또는 2화에만 집중하지 마세요.** 전체 화에 걸쳐 고르게 장면을 발췌해야 합니다.

**[STEP 2: 스크립트 작성 규칙]**
- 각 옵션은 약 18~20줄(각 클립 약 4초 기준 총 약 1분 15초)의 스크립트입니다.
- STEP 1에서 파악한 **2회 이상 등장 캐릭터**는 각 옵션에 최소 1회 이상 등장해야 합니다. 캐릭터를 임의로 생략하지 마세요.
- 장면 발췌는 전체 화에 걸쳐 고르게 분포되어야 합니다. 앞부분에만 치우치지 마세요.
- 각 줄은 반드시 다음 형식을 따르세요:
  - 일반 대사: `캐릭터명: [감정] 대사`
  - 독백/내면의 소리: `캐릭터명(독백): [감정] 대사`
  - 예시: `레온: [울먹이며] 어마아마, 왜 저를 나으셨습니까?`
  - 예시: `엘리사(독백): [슬프게] 왜 이렇게 돼 버린걸까?`
- 대사는 원문에서 직접 발췌하거나 원문 내용을 바탕으로 자연스럽게 작성하세요.
- 각 줄이 하나의 스크립트 라인이며, script 배열의 원소 하나입니다.

**[옵션 1: 크로니컬 감성 릴]**
텍스트의 시간순 흐름을 따라가되 긴박함/초조 ↔ 일상을 교차하며 대사·나레이션을 발췌합니다.
초반에 '나중에 비극으로 변할' 행복한 장면과 사망·비극 플래그 대사를 우선 발췌합니다.

**[옵션 2: 하이라이트 릴 (의문/충격 장면)]**
'왜 이런 말을 하지?', '왜 이런 행동을 하지?' 등 상식·도덕 선에서 이해하기 어려운 대사·나레이션을 발췌합니다.
시청자의 호기심과 충격을 극대화하는 장면 위주로 구성합니다.

**[옵션 3: 주인공 독백 스크립트]**
주인공의 독백 스크립트 형식. 감정 변화가 명확하며, 마무리에서 결의('더는 가만히 있지 않겠다' 등)가 표출됩니다.
주인공 정보가 시청자에게 전달되도록 구성합니다. 모든 줄을 `캐릭터명(독백): [감정] 대사` 형식으로 작성합니다.

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
