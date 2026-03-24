"""Storyboard generation task handler."""

import json
import logging
import re
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
PIXAI_PROMPT_SUFFIX = "Maintain the original eyes and hair color. Do not change cultural nuance, don't render random Japanese elements that didn't exist"
VIDEO_PROMPT_SUFFIX = "Don't generate random Japanese element"

BATCH_SIZE = 200  # Max panels per Gemini call; above this, batch automatically


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


def _split_source_into_batches(source_text: str, batch_size: int) -> list[str]:
    """Split source text into batches of at most batch_size [PANEL XXX] blocks."""
    parts = re.split(r'(?=\[PANEL \d+\])', source_text)
    if parts and not re.match(r'\[PANEL \d+\]', parts[0].strip()):
        header = parts[0]
        panel_parts = parts[1:]
    else:
        header = ""
        panel_parts = parts

    batches = []
    for i in range(0, len(panel_parts), batch_size):
        group = panel_parts[i : i + batch_size]
        batch_header = re.sub(
            r'총 분석된 패널 수:\s*\d+개',
            f'총 분석된 패널 수: {len(group)}개',
            header,
        )
        batches.append(batch_header + "".join(group))
    return batches


def _extract_continuation_context(result: dict) -> dict:
    """Extract state from a completed batch result needed by the next batch."""
    scenes = result.get("scenes", [])
    last_background_id = ""
    last_accumulated_time = "00:00"
    last_scene_title = ""

    for scene in scenes:
        if scene.get("sceneTitle"):
            last_scene_title = scene["sceneTitle"]
        for clip in scene.get("clips", []):
            if clip.get("backgroundId", "").strip():
                last_background_id = clip["backgroundId"].strip()
            if clip.get("accumulatedTime", "").strip():
                last_accumulated_time = clip["accumulatedTime"].strip()

    return {
        "last_background_id": last_background_id,
        "last_accumulated_time": last_accumulated_time,
        "last_scene_title": last_scene_title,
        "scene_count": len(scenes),
        "character_id_summary": result.get("characterIdSummary", []),
    }


def _merge_batch_results(batch_results: list[dict]) -> dict:
    """Merge multiple batch results into a single storyboard result dict."""
    merged_scenes: list[dict] = []
    seen_voice_prompts: set[str] = set()
    merged_voice_prompts: list[dict] = []

    for batch_result in batch_results:
        merged_scenes.extend(batch_result.get("scenes", []))
        for vp in batch_result.get("voicePrompts", []):
            key = vp.get("promptKo", "")
            if key and key not in seen_voice_prompts:
                seen_voice_prompts.add(key)
                merged_voice_prompts.append(vp)

    return {
        "scenes": merged_scenes,
        "voicePrompts": merged_voice_prompts,
        "characterIdSummary": batch_results[-1].get("characterIdSummary", []),
        "genre": batch_results[0].get("genre", ""),
    }


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
    logger.info(f"[STORYBOARD] Clip count: {job.clip_count}, Target time: {job.target_time}")

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

        # Detect panel count to decide batching
        source_text = job.source_text or ""
        panel_count = len(re.findall(r'\[PANEL \d+\]', source_text))
        logger.info(f"[STORYBOARD] {job_id} - Detected {panel_count} panels in source text")

        if panel_count > BATCH_SIZE:
            # Batched path: split into chunks, run sequential Gemini calls
            batches = _split_source_into_batches(source_text, BATCH_SIZE)
            total_batches = len(batches)
            logger.info(f"[STORYBOARD] {job_id} - Batching into {total_batches} calls (BATCH_SIZE={BATCH_SIZE})")

            batch_results = []
            total_usage_input = 0
            total_usage_output = 0
            continuation_context = None

            for batch_idx, batch_text in enumerate(batches):
                await check_cancellation(job_id)
                batch_progress = 0.2 + (0.7 * (batch_idx / total_batches))
                await job_queue_service.update_job_status(
                    job_id, JobStatus.GENERATING, progress=round(batch_progress, 2)
                )
                logger.info(f"[STORYBOARD] {job_id} - Batch {batch_idx + 1}/{total_batches}")

                batch_result, batch_usage = await _generate_storyboard_with_gemini(
                    job, api_key,
                    source_text_override=batch_text,
                    continuation_context=continuation_context,
                )
                total_usage_input += batch_usage.prompt_token_count or 0
                total_usage_output += batch_usage.candidates_token_count or 0
                batch_results.append(batch_result)
                continuation_context = _extract_continuation_context(batch_result)
                logger.info(
                    f"[STORYBOARD] {job_id} - Batch {batch_idx + 1} done: "
                    f"{sum(len(s.get('clips', [])) for s in batch_result.get('scenes', []))} clips"
                )

            try:
                from app.services.credits import get_credits_service, get_text_cost
                _cost = get_text_cost(MODEL_NAME, total_usage_input, total_usage_output)
                await get_credits_service().record_credit(
                    user_id=job.user_id, project_id=job.project_id,
                    job_id=job.id, job_type=job.type.value,
                    provider_id="gemini", cost_usd=_cost,
                )
            except Exception:
                logger.warning(f"Failed to record credit for job {job_id}", exc_info=True)

            result = _merge_batch_results(batch_results)
            logger.info(f"[STORYBOARD] {job_id} - Merged: {len(result.get('scenes', []))} scenes total")

        else:
            # Single-call path (original behavior)
            logger.info(f"[STORYBOARD] {job_id} - Calling Gemini API for storyboard generation...")
            result, _usage = await _generate_storyboard_with_gemini(job, api_key)
            logger.info(f"[STORYBOARD] {job_id} - Generated {len(result.get('scenes', []))} scenes")

            try:
                from app.services.credits import get_credits_service, get_text_cost
                _cost = get_text_cost(MODEL_NAME, _usage.prompt_token_count or 0, _usage.candidates_token_count or 0)
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
    source_text_override: str | None = None,
    continuation_context: dict | None = None,
) -> dict:
    """
    Call Gemini API to generate storyboard.

    Args:
        job: Job document with all parameters
        api_key: Gemini API key
        source_text_override: If provided, replaces job.source_text (used for batching)
        continuation_context: If provided, injects continuation state into the prompt

    Returns:
        dict with scenes and voicePrompts
    """
    client = genai.Client(api_key=api_key)

    # Determine exact clip count — clip_count takes priority over target_time
    if job.clip_count and job.clip_count > 0:
        exact_clip_count = job.clip_count
    else:
        # Fall back to target_time-based estimate for legacy jobs
        target_time = job.target_time or "03:00"
        parts = target_time.split(":")
        minutes = int(parts[0]) if len(parts) > 0 else 3
        seconds = int(parts[1]) if len(parts) > 1 else 0
        total_seconds = minutes * 60 + seconds
        exact_clip_count = round(total_seconds / 1.8)

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
    image_instruction = job.image_instruction or ""
    source_text = source_text_override if source_text_override is not None else (job.source_text or "")

    continuation_block = ""
    if continuation_context:
        char_summary_text = json.dumps(
            continuation_context.get("character_id_summary", []),
            ensure_ascii=False, indent=2
        )
        continuation_block = f"""
**[이전 배치에서 이어지는 콘티입니다 - 연속성 필수 유지]**
이 텍스트는 전체 원본의 일부입니다. 아래 이전 배치의 마지막 상태에서 자연스럽게 이어가야 합니다.

- **backgroundId 시작점**: "{continuation_context.get('last_background_id', '')}" 다음 번호부터 시작하십시오.
- **accumulatedTime 시작점**: "{continuation_context.get('last_accumulated_time', '00:00')}" 이후부터 누적 시간을 계산하십시오.
- **이전 마지막 씬 제목**: "{continuation_context.get('last_scene_title', '')}"
- **이전 씬 수**: {continuation_context.get('scene_count', 0)}개
- **캐릭터 ID 요약 (일관성 유지)**:
{char_summary_text}
"""

    prompt = f"""
    다음 원본 텍스트를 기반으로 애니메이션 콘티를 제작해 주세요.
    전체 클립의 수는 **정확히 {exact_clip_count}개**여야 합니다. 이 숫자는 절대적인 요구사항입니다 — 누적 시간에 관계없이 반드시 {exact_clip_count}개의 클립을 생성해야 합니다. 적게 생성하는 것은 허용되지 않습니다.
    각 '씬'에 포함될 클립의 수는 서사의 흐름에 따라 유동적으로 결정되어야 합니다.

    **[CRITICAL: 클립 길이 계산 규칙 (엄격 준수)]**
    모든 클립의 길이는 **절대로 4초를 넘을 수 없습니다.** 대사가 있는 경우, **'dialogueEn'의 단어 수를 직접 세어서** 아래 표에 따라 시간을 할당하십시오.

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
    스토리나 대사에서 캐릭터가 떨고있거나(shivering), 기침하거나(coughing), 눈물을 흘리거나(tears flowing) 등 신체적/감정적 상태가 암시되는 경우, 해당 키워드를 반드시 videoPrompt에 명시하십시오.

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

    20. **pixAiPrompt**: PixAI 애니메이션 스타일 이미지 생성 AI용 영어 프롬프트. imagePrompt의 핵심 시각 요소(캐릭터 ID, 동작, 카메라 앵글, 배경, 분위기)를 PixAI에 적합하게 간결하게 재작성합니다.

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

    {f'''
    **[이미지 프롬프트 패키지 지시사항]**
    {image_instruction}
    ''' if image_instruction else ''}

    {continuation_block}

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
                                    "pixAiPrompt": {"type": "STRING"},
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
                                    "story", "imagePrompt", "videoPrompt", "soraVideoPrompt", "veoVideoPrompt", "pixAiPrompt",
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
                    max_output_tokens=65536,
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

            # Append VIDEO_PROMPT_SUFFIX to videoPrompt
            vp = clip.get("videoPrompt", "").strip()
            if vp:
                connector = " " if (vp.endswith('.') or vp.endswith(',')) else ", "
                clip["videoPrompt"] = f"{vp}{connector}{VIDEO_PROMPT_SUFFIX}"
            else:
                clip["videoPrompt"] = VIDEO_PROMPT_SUFFIX

            # Append PIXAI_PROMPT_SUFFIX to pixAiPrompt
            raw = clip.get("pixAiPrompt", "").strip()
            clip["pixAiPrompt"] = f"{raw}, {PIXAI_PROMPT_SUFFIX}" if raw else PIXAI_PROMPT_SUFFIX

    return result, response.usage_metadata


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
