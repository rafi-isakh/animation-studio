"""Storyboard generation task handler."""

import json
import logging
from datetime import datetime, timezone

from google import genai
from google.genai import types

from app.config import get_settings
from app.core.errors import (
    ErrorCode,
    VideoJobError,
    classify_exception,
)
from app.core.state_machine import JobStateMachine
from app.models.job import JobDocument, JobStatus
from app.services.firestore import get_job_queue_service

logger = logging.getLogger(__name__)
settings = get_settings()

MODEL_NAME = "gemini-2.5-pro"

IMAGE_PROMPT_SUFFIX = "No vfx or visual effects, no dust particles"


class CancellationRequested(Exception):
    """Raised when job cancellation is detected."""
    pass


async def check_cancellation(job_id: str) -> None:
    """
    Check if cancellation has been requested for a job.

    Args:
        job_id: The job ID to check

    Raises:
        CancellationRequested: If cancellation was requested
    """
    job_queue_service = get_job_queue_service()
    job = await job_queue_service.get_job(job_id)
    if job and job.cancellation_requested:
        logger.info(f"Cancellation detected for storyboard job {job_id}")
        raise CancellationRequested(f"Job {job_id} was cancelled by user")


def _get_api_key(job: JobDocument, custom_api_key: str | None = None) -> str:
    """Get API key for Gemini.

    Priority:
    1. Custom API key passed through task queue
    2. Fallback to environment variable settings
    """
    if custom_api_key:
        return custom_api_key

    if not settings.gemini_api_key:
        raise VideoJobError.invalid_request("No Gemini API key configured")
    return settings.gemini_api_key


def _append_suffix(prompt: str) -> str:
    """Append the image prompt suffix if not already present."""
    if not prompt:
        return prompt
    trimmed = prompt.strip()
    suffix_lower = IMAGE_PROMPT_SUFFIX.lower()
    prompt_lower = trimmed.lower()

    # Check if suffix is already included (with or without period)
    if prompt_lower.endswith(suffix_lower) or prompt_lower.endswith(suffix_lower + '.'):
        return trimmed

    # Connect naturally based on punctuation
    connector = " " if (trimmed.endswith('.') or trimmed.endswith(',')) else ", "
    return f"{trimmed}{connector}{IMAGE_PROMPT_SUFFIX}"


async def process_storyboard(
    job_id: str,
    custom_api_key: str | None = None,
    worker_id: str = "worker-1",
) -> dict:
    """
    Generate a storyboard from source text.

    This job:
    1. Calls Gemini to generate storyboard scenes and clips
    2. Saves result to Firestore storyboard document
    3. Updates job status

    Args:
        job_id: The job ID to process
        custom_api_key: Optional custom API key (passed through task queue)
        worker_id: ID of the worker processing this job

    Returns:
        dict with status and result information
    """
    job_queue_service = get_job_queue_service()

    logger.info(f"[{worker_id}] ========== Starting storyboard job {job_id} ==========")

    # Fetch job from Firestore
    job = await job_queue_service.get_job(job_id)
    if not job:
        logger.error(f"[STORYBOARD] Job {job_id} not found in Firestore")
        return {"job_id": job_id, "status": "error", "error": "Job not found"}

    logger.info(f"[STORYBOARD] Job {job_id} loaded: project={job.project_id}, status={job.status}")
    logger.info(f"[STORYBOARD] Text length: {len(job.source_text or '')} chars")
    logger.info(f"[STORYBOARD] Target time: {job.target_time}")

    # Initialize state machine
    state_machine = JobStateMachine(job_id, job.status)

    # Mark job as being processed by this worker
    await job_queue_service.update_job(job_id, worker_id=worker_id)

    try:
        # Get API key
        api_key = _get_api_key(job, custom_api_key)

        # Transition to GENERATING
        state_machine.transition_to(JobStatus.GENERATING)
        await job_queue_service.update_job_status(job_id, JobStatus.GENERATING, progress=0.2)
        logger.info(f"[STORYBOARD] {job_id} - Status updated to GENERATING")

        # Check for cancellation before AI call
        await check_cancellation(job_id)

        # Call Gemini for storyboard generation
        logger.info(f"[STORYBOARD] {job_id} - Calling Gemini API for storyboard generation...")
        result = await _generate_storyboard_with_gemini(job, api_key)
        logger.info(f"[STORYBOARD] {job_id} - Generated {len(result.get('scenes', []))} scenes")

        try:
            from app.services.credits import get_credit_cost, get_credits_service
            _cost = get_credit_cost(job.type.value, "gemini")
            await get_credits_service().record_credit(
                user_id=job.user_id, project_id=job.project_id,
                job_id=job.id, job_type=job.type.value,
                provider_id="gemini", cost_usd=_cost,
            )
        except Exception:
            logger.warning(f"Failed to record credit for job {job_id}", exc_info=True)

        # Check for cancellation after AI call
        await check_cancellation(job_id)

        # Save to project's storyboard document
        logger.debug(f"[STORYBOARD] {job_id} - Updating storyboard document in project")
        await _save_storyboard(
            job.project_id,
            result,
            job_id,
        )
        logger.info(f"[STORYBOARD] {job_id} - Storyboard document updated")

        # Update job with results
        state_machine.transition_to(JobStatus.COMPLETED)
        await job_queue_service.update_job_status(
            job_id,
            JobStatus.COMPLETED,
            progress=1.0,
            storyboard_result=result,
        )

        scene_count = len(result.get("scenes", []))
        clip_count = sum(len(s.get("clips", [])) for s in result.get("scenes", []))

        logger.info(f"[STORYBOARD] {job_id} ========== JOB COMPLETED SUCCESSFULLY ==========")
        return {
            "job_id": job_id,
            "status": "completed",
            "scene_count": scene_count,
            "clip_count": clip_count,
        }

    except CancellationRequested:
        logger.info(f"[STORYBOARD] {job_id} - Job was cancelled")
        await job_queue_service.update_job_status(
            job_id,
            JobStatus.CANCELLED,
            progress=0.0,
        )
        return {
            "job_id": job_id,
            "status": "cancelled",
        }

    except Exception as e:
        logger.exception(f"[STORYBOARD] {job_id} - Error during processing: {e}")

        # Classify the error
        error_info = classify_exception(e)

        # Update job status to failed
        await job_queue_service.update_job_status(
            job_id,
            JobStatus.FAILED,
            error_code=error_info.code.value,
            error_message=str(e),
            error_retryable=error_info.retryable,
        )

        return {
            "job_id": job_id,
            "status": "failed",
            "error": str(e),
            "error_code": error_info.code.value,
            "retryable": error_info.retryable,
        }


async def _generate_storyboard_with_gemini(
    job: JobDocument,
    api_key: str,
) -> dict:
    """
    Call Gemini API to generate storyboard.

    Args:
        job: Job document with all parameters
        api_key: Gemini API key

    Returns:
        dict with scenes and voicePrompts
    """
    client = genai.Client(api_key=api_key)

    # Parse target time
    target_time = job.target_time or "03:00"
    parts = target_time.split(":")
    minutes = int(parts[0]) if len(parts) > 0 else 3
    seconds = int(parts[1]) if len(parts) > 1 else 0
    total_seconds = minutes * 60 + seconds
    estimated_clip_count = round(total_seconds / 1.8)  # ~1.8 seconds per clip average

    # Build conditions
    story_condition = job.story_condition or ""
    image_condition = job.image_condition or ""
    video_condition = job.video_condition or ""
    sound_condition = job.sound_condition or ""
    image_guide = job.image_guide or ""
    video_guide = job.video_guide or ""
    custom_instruction = job.custom_instruction or ""
    background_instruction = job.background_instruction or ""
    negative_instruction = job.negative_instruction or ""
    video_instruction = job.video_instruction or ""
    source_text = job.source_text or ""

    prompt = f"""
    다음 원본 텍스트를 기반으로 총 5개의 '씬'과 반드시 {estimated_clip_count}개의 클립으로 구성된, 정확히 {total_seconds}초({target_time}) 분량의 애니메이션 콘티를 제작해 주세요.
    각 '씬'에 포함될 클립의 수는 서사의 흐름에 따라 유동적으로 결정되어야 합니다. 어떤 씬은 20개보다 많을 수도, 적을 수도 있습니다.

    **[CRITICAL: 클립 길이 계산 규칙 (엄격 준수)]**
    모든 클립의 길이는 **절대로 4초를 넘을 수 없습니다.** 대사가 있는 경우, **'dialogueEn'의 단어 수를 직접 세어서** 아래 표에 따라 시간을 할당하십시오. 대사가 있는 경우, "1~2초 역동성 규칙"은 **무시**하고 아래 규칙이 **최우선**입니다.

    | dialogueEn 단어 수 | 할당 시간 | 비고 |
    | :--- | :--- | :--- |
    | **0 ~ 5 단어** | **2초** | 짧은 감탄사, 단답 |
    | **6 단어 이상** | **4초** | **최대 길이**. 만약 4초 안에 대사를 다 칠 수 없을 정도로 길다면, **반드시 대사를 쪼개어 B-roll 클립과 함께 여러 클립으로 나누세요.** |

    **[가장 중요한 규칙]**
    - 하나의 클립은 반드시 하나의 단일 동작이나 정지된 장면만을 묘사해야 합니다.
    - 출력은 반드시 유효한 JSON 객체여야 하며, 'scenes', 'voicePrompts', 'characterIdSummary', 'genre'라는 네 개의 키를 가져야 합니다.

    각 필드에 대한 지침:

    1. **sceneTitle**: 각 씬의 주요 내용을 요약하는 제목을 한국어로 작성합니다.

    2. **story**: 규칙: {story_condition}

    3. **backgroundId**: 형식 "#-#[ -#]" (예: 1-1, 1-2, 1-1-1)

    4. **imagePrompt**: 영어로 작성. 규칙: {image_condition}. 가이드: {image_guide or '없음'}

    5. **videoPrompt**: 영어로 작성. 규칙: {video_condition}. 가이드: {video_guide or '없음'}

    6. **dialogue**: 한국어 대사. 규칙: {sound_condition}

    7. **dialogueEn**: dialogue의 영어 번역

    7-1. **narration**: 대사가 없는 클립의 한국어 나레이션

    7-2. **narrationEn**: narration의 영어 번역

    8. **sfx**: 한국어 효과음

    9. **sfxEn**: sfx의 영어 번역

    10. **bgm**: 한국어 배경음악

    11. **bgmEn**: bgm의 영어 번역

    12. **soraVideoPrompt**: Sora 비디오 AI용 영어 프롬프트

    19. **veoVideoPrompt**: Google Veo 비디오 AI용 영어 프롬프트. 다음 3가지 템플릿 중 하나를 선택하여 생성합니다:
      - **캐릭터 + 대사가 있는 클립**: `Static shot of [imagePrompt의 시각적 묘사], saying "[dialogueEn 내용]"`
      - **배경만 있는 클립 (캐릭터 없음)**: `Fixed lo-fi static background wallpaper, slow dolly-in`
      - **캐릭터 + 나레이션이 있는 클립 (대사 없음)**: `Static storybook lofi wallpaper, narration says "[narrationEn 내용]"`

    13. **length**: "1초", "2초", "4초" 형식

    14. **accumulatedTime**: "MM:SS" 형식 누적 시간

    15. **backgroundPrompt**: 영어 배경 묘사

    16. **voicePrompts**: 주요 캐릭터의 보이스 프롬프트 (promptKo, promptEn)

    17. **characterIdSummary**: **모든 클립의 imagePrompt에 등장하는 모든 대문자 캐릭터 ID**를 분석하여 생성한 요약 리스트입니다. 각 객체는 'characterId'와 'description' 키를 가져야 합니다.
      **[characterIdSummary 생성 규칙]**:
      1. **현재 시점의 주인공을 식별하고 가장 먼저 나열하되, "Protagonist. Default"라고 설명합니다.**
      2. **각 캐릭터 그룹(예: LEON_*, KAIDEN_*, ELISA_*)에서 디폴트 버전을 먼저 식별합니다.** 디폴트는 가장 자주 등장하거나 현재 시점의 버전입니다.
      3. **디폴트 캐릭터는 주인공과의 관계를 설명하고 "Default"를 추가합니다** (예: "Son of Protagonist. Default").
      4. **변형(Variant) 캐릭터는 반드시 해당 캐릭터의 디폴트 ID를 기준으로 설명합니다:**
         - 나이 변형: "6 year old version of [DEFAULT_ID]"
         - 의상/상황 변형: "wearing [clothing description]"
      5. **각 설명은 한 줄로 간결하게 작성합니다.**

    18. **genre**: 원본 텍스트의 장르를 분석하여 한국어와 영어로 모두 표기한 문자열입니다.
      **형식: "한국어 장르명 (English Genre Name)"** (예: "서양 판타지 (Western Fantasy)", "현대 로맨스 (Modern Romance)")

    {f'''
    **[사용자 특별 지시사항]**
    {custom_instruction}
    ''' if custom_instruction else ''}

    {f'''
    **[배경 ID 지시사항]**
    {background_instruction}
    ''' if background_instruction else ''}

    {f'''
    **[Negative Prompt]**
    {negative_instruction}
    ''' if negative_instruction else ''}

    {f'''
    **[비디오 프롬프트 규칙]**
    {video_instruction}
    ''' if video_instruction else ''}

    원본 텍스트:
    ---
    {source_text}
    ---
    """

    # Define response schema
    response_schema = {
        "type": "OBJECT",
        "properties": {
            "scenes": {
                "type": "ARRAY",
                "items": {
                    "type": "OBJECT",
                    "properties": {
                        "sceneTitle": {"type": "STRING"},
                        "clips": {
                            "type": "ARRAY",
                            "items": {
                                "type": "OBJECT",
                                "properties": {
                                    "story": {"type": "STRING"},
                                    "imagePrompt": {"type": "STRING"},
                                    "videoPrompt": {"type": "STRING"},
                                    "soraVideoPrompt": {"type": "STRING"},
                                    "veoVideoPrompt": {"type": "STRING"},
                                    "dialogue": {"type": "STRING"},
                                    "dialogueEn": {"type": "STRING"},
                                    "narration": {"type": "STRING"},
                                    "narrationEn": {"type": "STRING"},
                                    "sfx": {"type": "STRING"},
                                    "sfxEn": {"type": "STRING"},
                                    "bgm": {"type": "STRING"},
                                    "bgmEn": {"type": "STRING"},
                                    "length": {"type": "STRING"},
                                    "accumulatedTime": {"type": "STRING"},
                                    "backgroundPrompt": {"type": "STRING"},
                                    "backgroundId": {"type": "STRING"},
                                },
                                "required": [
                                    "story", "imagePrompt", "videoPrompt", "soraVideoPrompt", "veoVideoPrompt",
                                    "dialogue", "dialogueEn", "narration", "narrationEn",
                                    "sfx", "sfxEn", "bgm", "bgmEn",
                                    "length", "accumulatedTime", "backgroundPrompt", "backgroundId",
                                ],
                            },
                        },
                    },
                    "required": ["sceneTitle", "clips"],
                },
            },
            "voicePrompts": {
                "type": "ARRAY",
                "items": {
                    "type": "OBJECT",
                    "properties": {
                        "promptKo": {"type": "STRING"},
                        "promptEn": {"type": "STRING"},
                    },
                    "required": ["promptKo", "promptEn"],
                },
            },
            "characterIdSummary": {
                "type": "ARRAY",
                "items": {
                    "type": "OBJECT",
                    "properties": {
                        "characterId": {"type": "STRING"},
                        "description": {"type": "STRING"},
                    },
                    "required": ["characterId", "description"],
                },
            },
            "genre": {
                "type": "STRING",
            },
        },
        "required": ["scenes", "voicePrompts", "characterIdSummary", "genre"],
        "propertyOrdering": ["scenes", "voicePrompts", "characterIdSummary", "genre"],
    }

    # Call Gemini with retry logic
    max_retries = 3
    initial_delay = 2000
    delay = initial_delay

    for attempt in range(max_retries):
        try:
            response = await client.aio.models.generate_content(
                model=MODEL_NAME,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=response_schema,
                ),
            )
            break
        except Exception as e:
            error_msg = str(e)
            if ("503" in error_msg or "overloaded" in error_msg or "UNAVAILABLE" in error_msg) and attempt < max_retries - 1:
                logger.warning(f"Attempt {attempt + 1} failed due to model overload. Retrying in {delay}ms...")
                import asyncio
                await asyncio.sleep(delay / 1000)
                delay *= 2
            else:
                raise

    response_text = response.text.strip() if response.text else ""
    if not response_text:
        raise ValueError("Empty response from Gemini API")

    result = json.loads(response_text)

    # Post-process: apply suffix to imagePrompt and append Background ID
    for scene in result.get("scenes", []):
        for clip in scene.get("clips", []):
            # Apply suffix to imagePrompt
            clip["imagePrompt"] = _append_suffix(clip.get("imagePrompt", ""))

            # Append Background ID to imagePrompt
            bg_id = clip.get("backgroundId", "")
            if bg_id and bg_id.strip():
                clip["imagePrompt"] = f"{clip['imagePrompt']}\n\nBackground ID: {bg_id}"

    return result


async def _save_storyboard(
    project_id: str,
    result: dict,
    job_id: str,
) -> None:
    """
    Save storyboard results to Firestore.

    Args:
        project_id: The project ID
        result: Storyboard generation result
        job_id: The job ID
    """
    from app.services.firestore import get_storyboard_service

    storyboard_service = get_storyboard_service()
    await storyboard_service.save_storyboard(
        project_id=project_id,
        scenes=result.get("scenes", []),
        voice_prompts=result.get("voicePrompts", []),
        character_id_summary=result.get("characterIdSummary", []),
        genre=result.get("genre", ""),
        job_id=job_id,
    )
