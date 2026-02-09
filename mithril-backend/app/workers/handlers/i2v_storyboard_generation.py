"""I2V (Image-to-Video) storyboard generation task handler."""

import asyncio
import json
import logging

import httpx
from google import genai
from google.genai import types

from app.config import get_settings
from app.core.errors import (
    VideoJobError,
    classify_exception,
)
from app.core.state_machine import JobStateMachine
from app.models.job import JobDocument, JobStatus
from app.services.firestore import get_job_queue_service

logger = logging.getLogger(__name__)
settings = get_settings()

MODEL_NAME = "gemini-2.5-flash"

IMAGE_PROMPT_SUFFIX = "No vfx or visual effects, no dust particles"

# Concurrency control
I2V_STORYBOARD_CONCURRENCY = 3
_i2v_storyboard_semaphore = asyncio.Semaphore(I2V_STORYBOARD_CONCURRENCY)


class CancellationRequested(Exception):
    """Raised when job cancellation is detected."""
    pass


async def check_cancellation(job_id: str) -> None:
    """Check if cancellation has been requested for a job."""
    job_queue_service = get_job_queue_service()
    job = await job_queue_service.get_job(job_id)
    if job and job.cancellation_requested:
        logger.info(f"Cancellation detected for I2V storyboard job {job_id}")
        raise CancellationRequested(f"Job {job_id} was cancelled by user")


def _get_api_key(job: JobDocument, custom_api_key: str | None = None) -> str:
    """Get API key for Gemini."""
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

    if prompt_lower.endswith(suffix_lower) or prompt_lower.endswith(suffix_lower + '.'):
        return trimmed

    connector = " " if (trimmed.endswith('.') or trimmed.endswith(',')) else ", "
    return f"{trimmed}{connector}{IMAGE_PROMPT_SUFFIX}"


def _parse_duration(duration: str) -> int:
    """Parse MM:SS duration string to seconds."""
    parts = duration.split(":")
    if len(parts) == 2:
        minutes = int(parts[0])
        seconds = int(parts[1])
        return minutes * 60 + seconds
    return 180  # Default 3 minutes


def _format_time(seconds: int) -> str:
    """Format seconds to MM:SS."""
    mins = seconds // 60
    secs = seconds % 60
    return f"{str(mins).zfill(2)}:{str(secs).zfill(2)}"


async def _download_panel_images(panel_urls: list[str]) -> list[bytes]:
    """Download panel images from S3 URLs."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        tasks = [client.get(url) for url in panel_urls]
        responses = await asyncio.gather(*tasks)

    images = []
    for i, resp in enumerate(responses):
        if resp.status_code != 200:
            raise ValueError(f"Failed to download panel {i} from {panel_urls[i]}: {resp.status_code}")
        images.append(resp.content)
    return images


async def process_i2v_storyboard(
    job_id: str,
    custom_api_key: str | None = None,
    worker_id: str = "worker-1",
) -> dict:
    """
    Generate a storyboard from manga panel images.

    This job:
    1. Downloads panel images from S3 URLs
    2. Calls Gemini to generate storyboard scenes and clips
    3. Saves result to Firestore i2vScript document
    4. Updates job status

    Args:
        job_id: The job ID to process
        custom_api_key: Optional custom API key
        worker_id: ID of the worker processing this job

    Returns:
        dict with status and result information
    """
    job_queue_service = get_job_queue_service()

    logger.info(f"[{worker_id}] ========== Starting I2V storyboard job {job_id} ==========")

    # Fetch job from Firestore
    job = await job_queue_service.get_job(job_id)
    if not job:
        logger.error(f"[I2V-STORYBOARD] Job {job_id} not found in Firestore")
        return {"job_id": job_id, "status": "error", "error": "Job not found"}

    logger.info(f"[I2V-STORYBOARD] Job {job_id} loaded: project={job.project_id}, panels={len(job.panel_urls)}")
    logger.info(f"[I2V-STORYBOARD] Target duration: {job.target_duration}")

    # Initialize state machine
    state_machine = JobStateMachine(job_id, job.status)

    # Mark job as being processed by this worker
    await job_queue_service.update_job(job_id, worker_id=worker_id)

    try:
        async with _i2v_storyboard_semaphore:
            # Get API key
            api_key = _get_api_key(job, custom_api_key)

            # Transition to PREPARING (downloading images)
            state_machine.transition_to(JobStatus.PREPARING)
            await job_queue_service.update_job_status(job_id, JobStatus.PREPARING, progress=0.1)
            logger.info(f"[I2V-STORYBOARD] {job_id} - Downloading panel images...")

            # Check for cancellation
            await check_cancellation(job_id)

            # Download panel images from S3
            panel_images = await _download_panel_images(job.panel_urls)
            logger.info(f"[I2V-STORYBOARD] {job_id} - Downloaded {len(panel_images)} panel images")

            # Transition to GENERATING
            state_machine.transition_to(JobStatus.GENERATING)
            await job_queue_service.update_job_status(job_id, JobStatus.GENERATING, progress=0.3)
            logger.info(f"[I2V-STORYBOARD] {job_id} - Calling Gemini API...")

            # Check for cancellation before AI call
            await check_cancellation(job_id)

            # Call Gemini for storyboard generation
            result = await _generate_i2v_storyboard_with_gemini(job, api_key, panel_images)
            logger.info(f"[I2V-STORYBOARD] {job_id} - Generated {len(result.get('scenes', []))} scenes")

            # Check for cancellation after AI call
            await check_cancellation(job_id)

            # Save to project's i2vScript document
            await job_queue_service.update_job_status(job_id, JobStatus.GENERATING, progress=0.8)
            logger.debug(f"[I2V-STORYBOARD] {job_id} - Saving to i2vScript subcollection...")
            await _save_i2v_storyboard(
                job.project_id,
                result,
                job,
                job_id,
            )
            logger.info(f"[I2V-STORYBOARD] {job_id} - i2vScript document updated")

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

            logger.info(f"[I2V-STORYBOARD] {job_id} ========== JOB COMPLETED SUCCESSFULLY ==========")
            return {
                "job_id": job_id,
                "status": "completed",
                "scene_count": scene_count,
                "clip_count": clip_count,
            }

    except CancellationRequested:
        logger.info(f"[I2V-STORYBOARD] {job_id} - Job was cancelled")
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
        logger.exception(f"[I2V-STORYBOARD] {job_id} - Error during processing: {e}")

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


async def _generate_i2v_storyboard_with_gemini(
    job: JobDocument,
    api_key: str,
    panel_images: list[bytes],
) -> dict:
    """
    Call Gemini API to generate storyboard from panel images.

    Args:
        job: Job document with all parameters
        api_key: Gemini API key
        panel_images: Downloaded panel image bytes

    Returns:
        dict with scenes and voicePrompts
    """
    client = genai.Client(api_key=api_key)

    # Parse target duration
    target_duration = job.target_duration or "03:00"
    total_seconds = _parse_duration(target_duration)
    total_panels = len(panel_images)

    # Build conditions
    story_condition = job.story_condition or "원본 텍스트의 내용을 충실히 반영하되, 애니메이션의 특성에 맞게 시각적 서사를 강화한다."
    image_condition = job.image_condition or "캐릭터의 외형적 특징을 고정한다. 샷의 앵글과 구도는 Background ID의 지침을 따른다."
    video_condition = job.video_condition or "카메라 앵글과 동작 위주로 간결하게 구성한다. 캐릭터 이름 대신 대명사를 사용하세요."
    sound_condition = job.sound_condition or "음향은 대사, 효과음, 배경음악으로 구분한다. 망가 패널의 텍스트가 있는 경우 이를 최우선으로 반영한다."
    image_guide = job.image_guide or "없음"
    video_guide = job.video_guide or "없음"
    source_text = job.source_text or ""

    # Build multimodal parts: images first, then prompt text
    content_parts: list[types.Part] = []

    # Add all panel images
    for image_bytes in panel_images:
        content_parts.append(types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"))

    # Build the Korean prompt (ported from route.ts)
    prompt = f"""
다음 원본 텍스트와 제공된 망가 패널 이미지들을 기반으로 총 5개의 '씬'으로 구성된, **정확히 {_format_time(total_seconds)} ({total_seconds}초)** 분량의 애니메이션 콘티를 제작해 주세요.
전체 누적 시간이 반드시 {_format_time(total_seconds)}이 되도록 설계해야 합니다.

**[이미지 패널 활용 및 인물/사물 ID 규칙]**
1. 제공된 이미지들은 망가(만화) 패널들입니다. 총 {total_panels}개의 패널이 제공됩니다 (0-indexed로 referenceImageIndex 사용).
2. 각 이미지에서 캐릭터의 표정, 구도, 대사를 분석하세요.
3. **[반복 요소 및 캐릭터 ID 관리]**:
   - **모든 등장인물 식별**: 한 컷 이상 등장하는 모든 인물(엑스트라 포함)의 이름을 파악하여 고유 CHARACTER_ID를 부여하세요.
   - **의상 버전 관리**: 이벤트나 상황에 따라 캐릭터의 의상이 바뀌는 경우, 버전별로 구분된 ID를 부여하세요 (예: KANIA_BATTLE_ARMOR, KANIA_CASUAL, CHENA_NIGHTGOWN).
   - **ID 형식**: 반드시 모든 문자를 **대문자**로 작성하고, 공백 대신 **언더바(_)**를 사용하세요.
   - 이름이 명시된 경우 이름을 ID로 사용 (KANIA, CHENA).
   - 이름 없는 경우 특징을 요약하여 ID를 생성하세요 (예: VILLAGER_A, TOWN_GUARD_1).
   - 소유물 표현 시 따옴표/어포스트로피 절대 금지 (예: KANIA_SWORD).
   - 모든 필드(`story`, `imagePrompt` 등)에서 이 ID를 일관되게 사용하세요.
4. 분석된 내용을 콘티의 'dialogue', 'sfx', 'imagePrompt' 등에 적극적으로 반영하세요.

**[CRITICAL: 필드별 언어 및 내용 규칙]**
- **story**: 반드시 **한국어**로 작성하세요. 인물/사물 ID를 사용하여 상황을 설명하세요.
- **imagePrompt**: 영어로 작성하되, **캐릭터의 의상(clothing)이나 색상(colors)은 절대 묘사하지 마세요.** (ID를 통해 캐릭터 시트에서 관리됨). 오직 구도, 동작, 인물 ID 위주로만 설명하세요.
- **backgroundId**: 반드시 **숫자-숫자[-숫자]** 형식을 유지하세요 (예: 1-1, 4-2).
  - 첫 번째 숫자는 **장소(Location)** 고유 번호입니다. **반드시 1부터 시작**하여 새로운 장소가 나올 때마다 1씩 증가시키세요. 같은 장소라면 항상 같은 첫 번째 숫자를 사용하세요.
  - 두 번째 숫자는 **구도/앵글(Angle)** 번호입니다.
  - **CRITICAL: 동일한 '장소-앵글' 조합이 두 번 이상 등장할 경우, 반드시 세 번째 숫자를 추가하여 각 클립을 고유하게 식별해야 합니다.**
    - 예: 4-2 (첫 번째 등장) -> 4-2-1 (두 번째 등장) -> 4-2-2 (세 번째 등장) 등.
    - **절대 ID가 중복되지 않도록 하세요.** 배경 이미지가 같더라도 샷이 다르면 ID 뒤에 고유 번호를 붙여야 합니다.

**[CRITICAL: 대사(Dialogue) 형식 규칙]**
- ElevenLabs 감정 반영을 위해: **[감정] 대사내용**
- 감정은 대괄호 [] 안에 한두 단어의 핵심 단어로 요약.
- 예시: [조심스럽게] "여기가 제 방인가요...?", [cautiously] "Is this my room...?"

**[CRITICAL: 클립 길이 및 총 시간 규칙]**
- 모든 클립의 길이는 **절대로 4초를 넘을 수 없습니다.**
- 마지막 클립의 'accumulatedTime'은 반드시 **{_format_time(total_seconds)}**이어야 합니다.

각 필드 가이드라인:
- **story**: 규칙: {story_condition}. (한국어 필수)
- **imagePrompt**: 규칙: {image_condition}. 가이드: {image_guide}. (의상/색상 묘사 금지)
- **videoPrompt**: 규칙: {video_condition}. 가이드: {video_guide}.
- **dialogue/sfx/bgm**: 규칙: {sound_condition}.

{f'원본 텍스트:\\n---\\n{source_text}\\n---' if source_text else '망가 패널 이미지를 기반으로 스토리를 구성하세요.'}
"""

    content_parts.append(types.Part.from_text(text=prompt))

    # Response schema (includes referenceImageIndex)
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
                                    "dialogue": {"type": "STRING"},
                                    "dialogueEn": {"type": "STRING"},
                                    "sfx": {"type": "STRING"},
                                    "sfxEn": {"type": "STRING"},
                                    "bgm": {"type": "STRING"},
                                    "bgmEn": {"type": "STRING"},
                                    "length": {"type": "STRING"},
                                    "accumulatedTime": {"type": "STRING"},
                                    "backgroundPrompt": {"type": "STRING"},
                                    "backgroundId": {"type": "STRING"},
                                    "referenceImageIndex": {
                                        "type": "NUMBER",
                                        "description": "0-indexed reference to source panel",
                                    },
                                },
                                "required": [
                                    "story", "imagePrompt", "videoPrompt", "soraVideoPrompt",
                                    "dialogue", "dialogueEn",
                                    "sfx", "sfxEn", "bgm", "bgmEn",
                                    "length", "accumulatedTime",
                                    "backgroundPrompt", "backgroundId",
                                    "referenceImageIndex",
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
        },
        "required": ["scenes", "voicePrompts"],
    }

    # Call Gemini with retry logic
    max_retries = 3
    initial_delay = 2000
    delay = initial_delay

    for attempt in range(max_retries):
        try:
            response = await client.aio.models.generate_content(
                model=MODEL_NAME,
                contents=types.Content(
                    parts=content_parts,
                ),
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=response_schema,
                ),
            )
            break
        except Exception as e:
            error_msg = str(e)
            if ("503" in error_msg or "overloaded" in error_msg or "UNAVAILABLE" in error_msg or "RESOURCE_EXHAUSTED" in error_msg) and attempt < max_retries - 1:
                logger.warning(f"Attempt {attempt + 1} failed due to model overload. Retrying in {delay}ms...")
                await asyncio.sleep(delay / 1000)
                delay *= 2
            else:
                raise

    response_text = response.text.strip() if response.text else ""
    if not response_text:
        raise ValueError("Empty response from Gemini API")

    # Clean up markdown code blocks if present
    json_text = response_text.replace("```json", "").replace("```", "").strip()
    result = json.loads(json_text)

    # Post-process: append suffix to all imagePrompts
    for scene in result.get("scenes", []):
        for clip in scene.get("clips", []):
            clip["imagePrompt"] = _append_suffix(clip.get("imagePrompt", ""))

    return result


async def _save_i2v_storyboard(
    project_id: str,
    result: dict,
    job: JobDocument,
    job_id: str,
) -> None:
    """
    Save I2V storyboard results to Firestore.

    Args:
        project_id: The project ID
        result: Storyboard generation result
        job: The job document (for metadata)
        job_id: The job ID
    """
    from app.services.firestore import get_i2v_script_service

    i2v_script_service = get_i2v_script_service()

    # Build metadata from job fields
    metadata = {
        "targetDuration": job.target_duration or "03:00",
        "sourceText": job.source_text or "",
        "storyCondition": job.story_condition or "",
        "imageCondition": job.image_condition or "",
        "videoCondition": job.video_condition or "",
        "soundCondition": job.sound_condition or "",
    }

    await i2v_script_service.save_i2v_storyboard(
        project_id=project_id,
        scenes=result.get("scenes", []),
        voice_prompts=result.get("voicePrompts", []),
        metadata=metadata,
        job_id=job_id,
    )
