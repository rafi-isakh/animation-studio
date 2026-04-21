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

BATCH_SIZE = 50  # Max panels per Gemini call; above this, batch automatically


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


def _repair_json(text: str) -> str:
    """Attempt to repair common JSON issues from LLM output."""
    # Remove trailing commas before } or ]
    text = re.sub(r',\s*([}\]])', r'\1', text)
    # Fix escaped line continuations inside string values
    text = text.replace('\\\n', '\\n')
    # If extra text trails after a valid object, trim it
    last_brace = text.rfind('}')
    if last_brace != -1 and last_brace < len(text) - 1:
        trailing = text[last_brace + 1 :].strip()
        if trailing and not trailing.startswith(']') and not trailing.startswith(','):
            text = text[: last_brace + 1]
    # Balance unterminated strings/brackets that commonly happen on truncation.
    in_string = False
    escape = False
    stack: list[str] = []
    for ch in text:
        if in_string:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == '"':
                in_string = False
            continue
        if ch == '"':
            in_string = True
        elif ch in "{[":
            stack.append(ch)
        elif ch == "}" and stack and stack[-1] == "{":
            stack.pop()
        elif ch == "]" and stack and stack[-1] == "[":
            stack.pop()

    if in_string and escape:
        text += "\\"
    if in_string:
        text += '"'
    while stack:
        opener = stack.pop()
        text += "}" if opener == "{" else "]"
    return text


def _normalize_attention_fields(clip: dict) -> None:
    """Normalize attention fields from alternate key styles into canonical keys."""
    alias_map = {
        "attentionDevice": ["attentionDeviceA", "attention_device", "attention_device_a"],
        "attentionAction": ["attentionActionB", "attention_action", "attention_action_b"],
        "attentionExpression": ["attentionExpressionC", "attention_expression", "attention_expression_c"],
        "attentionMood": ["attentionMoodD", "attention_mood", "attention_mood_d"],
    }

    for canonical, aliases in alias_map.items():
        current = str(clip.get(canonical, "")).strip()
        if current:
            continue
        for alias in aliases:
            value = str(clip.get(alias, "")).strip()
            if value:
                clip[canonical] = value
                break


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
    prompt_variant: str = "default",
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

    logger.info(
        f"[{worker_id}] ========== Starting storyboard job {job_id} "
        f"(prompt_variant={prompt_variant}) =========="
    )

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
                    prompt_variant=prompt_variant,
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
                    provider_id="gemini_text", cost_usd=_cost,
                )
            except Exception:
                logger.warning(f"Failed to record credit for job {job_id}", exc_info=True)

            result = _merge_batch_results(batch_results)
            logger.info(f"[STORYBOARD] {job_id} - Merged: {len(result.get('scenes', []))} scenes total")

        else:
            # Single-call path (original behavior)
            logger.info(f"[STORYBOARD] {job_id} - Calling Gemini API for storyboard generation...")
            result, _usage = await _generate_storyboard_with_gemini(
                job, api_key, prompt_variant=prompt_variant
            )
            logger.info(f"[STORYBOARD] {job_id} - Generated {len(result.get('scenes', []))} scenes")

            try:
                from app.services.credits import get_credits_service, get_text_cost
                _cost = get_text_cost(MODEL_NAME, _usage.prompt_token_count or 0, _usage.candidates_token_count or 0)
                await get_credits_service().record_credit(
                    user_id=job.user_id, project_id=job.project_id,
                    job_id=job.id, job_type=job.type.value,
                    provider_id="gemini_text", cost_usd=_cost,
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
    prompt_variant: str = "default",
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
    image_prompt_qa = job.image_prompt_qa or ""
    selected_trailer_script = job.selected_trailer_script or ""
    is_trailer_mode = job.is_trailer_mode or False
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

    if prompt_variant == "reference":
        attention_guidance = """
    4-1. story를 분석하여 시선을 끄는 주요 요소 4가지를 다음 4개 필드로 나누어 한국어로 작성하십시오. 각 필드는 반드시 비어있지 않아야 합니다.
    - **attentionDevice**: 행동 및 인물 강조 (A유형). 단순 인물명 대신 구체적인 신체 부위/디테일을 포함하십시오.
      예: "전화를 쥔 엘리사의 떨리는 손"
    - **attentionAction**: 오브젝트/인서트컷 (B유형). 핵심 소품·사물을 짧고 명확하게 작성하십시오.
      예: "전화기", "깨진 찻잔"
    - **attentionExpression**: 표정/감정 반응 (C유형). 얼굴·눈·표정 중심으로 작성하십시오.
      예: "절망한 엘리사의 눈동자"
    - **attentionMood**: 장면의 핵심 감정/무드 (D유형). 한 단어나 짧은 구로 요약하십시오.
      예: "절망", "긴장", "허탈함"
    """
    else:
        attention_guidance = """
    4-1. story를 분석하여 시각적으로 주목할 요소 4가지를 각각 아래 필드에 한국어로 출력하십시오. 반드시 유형별로 1개씩 분리하여 출력해야 합니다. **빈 문자열은 절대 금지**하며, 각 필드는 최소 2단어 이상으로 구체적으로 작성하십시오:
    - **attentionDevice**: 오브젝트/인서트컷 유형 — 장면 속 핵심 소품·사물 (예: "전화기")
    - **attentionAction**: 행동 유형 — 인물이 취하는 구체적인 동작 (예: "전화를 받는 엘리사")
    - **attentionExpression**: 감정 유형 — 인물의 감정 상태·신체 반응 (예: "절망한 엘리사의 눈동자")
    - **attentionMood**: 분위기 유형 — 장면 전체의 감정적 톤·분위기를 한 단어나 짧은 구로 (예: "절망", "긴장감", "허탈함")
    - 레거시 스타일 키(`attentionDeviceA`, `attentionActionB`, `attentionExpressionC`, `attentionMoodD`)를 쓰지 말고, 위의 표준 키 이름만 사용하십시오.
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

    {attention_guidance}
    이 네 필드는 각각 imagePromptA(attention_device), imagePromptB(attention_action), imagePromptC(attention_expression), imagePromptD(attention_mood)의 핵심 소재로 사용됩니다.

    4-2. **imagePromptA**: 오브젝/인서트컷(attention_device) 타입 — attentionDevice 항목을 소재로 사용. 극단적 클로즈업. 인물의 얼굴/표정을 포함하지 않음. B-roll 또는 인서트컷 스타일로 작성.

    4-3. **imagePromptB**: 행동(attention_action) 타입 — attentionAction 항목을 소재로 사용. 첫 단어는 카메라 거리+각도 (예: Eye-level Full Shot, High angle Bird's eye view, Low angle Side Close Up).

    4-4. **imagePromptC**: 감정(attention_expression) 타입 — attentionExpression 항목을 소재로 사용. 캐릭터의 얼굴, 눈, 동공 극단적 클로즈업으로 감정 강조. 배경은 단색(검정, 빨강, 진한 파랑 등)으로 처리.

    4-5. **imagePromptD**: 감정 증폭 타입 — 장면의 감정 강도를 시각적으로 극대화. 방법론 자유 (오브젝트, 인물, 배경, 조명, 색감, 날씨, 카메라 무빙 등 어떤 요소든 활용 가능). attentionDevice/attentionAction/attentionExpression에 구애받지 않고 가장 강렬한 감정 임팩트를 줄 수 있는 방식을 자유롭게 선택.

    {f'이미지 가이드 패키지가 제공된 경우, 위 4-2~4-5 프롬프트는 아래 패키지의 스타일·구조·패턴을 분석하여 동일한 유형으로 작성하십시오.' if image_prompt_qa else ''}

    **[CRITICAL: 캐릭터 묘사 규칙]**
    - **명확한 캐릭터 지칭 (Vague terms 금지)**: 'two people', 'two characters', 'the baby', 'a man' 등 얼버무리는 표현을 절대 사용하지 마십시오. 갓난아기라도 반드시 각 캐릭터의 고유 ID(예: [LEON_BABY], [ELISA_PRESENT])를 사용하여 누구의 샷인지 명확히 밝히십시오.
    - **다중 캐릭터 위치 지정**: 클립에 두 명 이상의 캐릭터(ID)가 등장할 경우, 모든 이미지 프롬프트에 반드시 각 캐릭터의 상대적인 위치(왼쪽/오른쪽)를 명시하십시오. (예: "[CHARACTER_ID] is on the left side, and [CHARACTER_ID2] is right side next to [CHARACTER_ID]"). 이는 이미지 생성 시 캐릭터의 위치가 뒤바뀌는 것을 방지하기 위함입니다.
    - **캐릭터 자세 및 위치 명시**: 기본적으로 캐릭터들은 서 있는(standing) 상태로 간주합니다. 단, 스토리 정황상 캐릭터가 앉아있거나(sitting), 누워있는(lying down) 등 자세에 변수가 생기는 경우, 정확히 어디에 앉아있는지, 어디에 누워있는지 매번 구체적으로 명시하십시오. (예: "[ELISA_PRESENT] is sitting on a velvet sofa", "[LEON_BABY] is lying down in a wooden crib").

    {'**[CRITICAL: 씬 도입부 인서트컷 (Insert Cut)]**' if is_trailer_mode else ''}
    {'새로운 씬(Scene)이 시작될 때, 첫 번째 클립은 반드시 **인물이 없는 배경 인서트컷(Insert Cut)**이어야 합니다. 해당 장소를 암시하는 소품(Item)의 클로즈업(Close-up)이나, 배경의 분위기를 보여주는 정적인 샷으로 구성하십시오. 이 클립의 모든 이미지 프롬프트(imagePrompt, imagePromptA~D)에는 인물 묘사가 없어야 합니다.' if is_trailer_mode else ''}

    5. **videoPrompt**: 영어로 작성. 규칙: {video_condition}. 가이드: {video_guide or '없음'}
    스토리나 대사에서 캐릭터가 떨고있거나(shivering), 기침하거나(coughing), 눈물을 흘리거나(tears flowing) 등 신체적/감정적 상태가 암시되는 경우, 해당 키워드를 반드시 videoPrompt에 명시하십시오.

    6. **dialogue**: 한국어 대사. 규칙: {sound_condition}
    **[CRITICAL: 절대 창작 금지]**: 대사(dialogue)는 반드시 원본 텍스트(Source Text)에서 토씨 하나 틀리지 않고 그대로 발췌해야 합니다. AI가 임의로 대사를 지어내거나, 원문을 수정, 요약, 재해석해서는 절대 안 됩니다. 원본 텍스트에 캐릭터의 대사가 있는 경우에만 이 필드를 채우십시오.

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

    {f'''
    **[이미지 가이드 패키지 — A/B/C/D 프롬프트 스타일 분석용]**
    아래 패키지에 포함된 예시 프롬프트들을 분석하여 각 유형(A: 오브젝·인서트컷/attention_device, B: 행동/attention_action, C: 감정/attention_expression, D: 감정 증폭)의 스타일, 구조, 표현 패턴을 파악하십시오.
    imagePromptA, imagePromptB, imagePromptC, imagePromptD 생성 시 이 패키지의 패턴을 따르십시오.
    {image_prompt_qa}
    ''' if image_prompt_qa else ''}

    {f'''
    **[CRITICAL: 트레일러 스크립트 배치 규칙]**
    - 사용자가 선택한 트레일러 스크립트(Trailer Script)가 제공됩니다.
    - 이 스크립트의 각 라인을 적절한 클립의 `trailerScriptKo` 필드에 하나씩 배치하십시오.
    - 스크립트 라인 수보다 클립 수가 많을 수 있으므로, 내용과 어울리지 않거나 여백이 필요한 클립의 `trailerScriptKo` 필드는 비워두어도 됩니다.
    - `trailerScriptEn` 필드에는 `trailerScriptKo`에 배치된 스크립트의 영문 번역본을 작성하십시오.
    - 기존의 `dialogue`, `narration` 필드는 원본 텍스트와의 대조를 위해 유지되므로, 트레일러 스크립트와 별개로 위 규칙에 따라 작성하십시오.

    **[선택된 트레일러 스크립트]**
    {selected_trailer_script}
    ''' if selected_trailer_script else ''}

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
                                    "attentionDevice": {"type": "STRING"},
                                    "attentionAction": {"type": "STRING"},
                                    "attentionExpression": {"type": "STRING"},
                                    "attentionMood": {"type": "STRING"},
                                    "imagePromptA": {"type": "STRING"},
                                    "imagePromptB": {"type": "STRING"},
                                    "imagePromptC": {"type": "STRING"},
                                    "imagePromptD": {"type": "STRING"},
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
                                    "trailerScriptKo": {"type": "STRING"},
                                    "trailerScriptEn": {"type": "STRING"},
                                },
                                "required": [
                                    "story", "attentionDevice", "attentionAction", "attentionExpression", "attentionMood",
                                    "imagePromptA", "imagePromptB", "imagePromptC", "imagePromptD",
                                    "imagePrompt", "videoPrompt", "soraVideoPrompt", "veoVideoPrompt", "pixAiPrompt",
                                    "dialogue", "dialogueEn", "narration", "narrationEn",
                                    "sfx", "sfxEn", "bgm", "bgmEn",
                                    "length", "accumulatedTime", "backgroundPrompt", "backgroundId",
                                    "trailerScriptKo", "trailerScriptEn",
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

    # Prefer structured payload when available from Gemini SDK.
    parsed_payload = getattr(response, "parsed", None)
    if isinstance(parsed_payload, dict):
        result = parsed_payload
    else:
        # Clean up markdown code fences in case the model wraps JSON anyway.
        json_text = response_text.replace("```json", "").replace("```", "").strip()

        try:
            result = json.loads(json_text)
        except json.JSONDecodeError as parse_err:
            logger.warning(f"[STORYBOARD] JSON parse failed: {parse_err}. Attempting repair...")
            repaired = _repair_json(json_text)
            try:
                result = json.loads(repaired)
                logger.info("[STORYBOARD] JSON repair succeeded")
            except json.JSONDecodeError:
                logger.warning("[STORYBOARD] JSON repair failed, retrying Gemini call once...")
                retry_response = await client.aio.models.generate_content(
                    model=MODEL_NAME,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=response_schema,
                        max_output_tokens=65536,
                    ),
                )
                retry_parsed = getattr(retry_response, "parsed", None)
                if isinstance(retry_parsed, dict):
                    result = retry_parsed
                    logger.info("[STORYBOARD] Retry succeeded (structured payload)")
                else:
                    retry_text = retry_response.text.strip() if retry_response.text else ""
                    retry_json = retry_text.replace("```json", "").replace("```", "").strip()
                    retry_repaired = _repair_json(retry_json)
                    result = json.loads(retry_repaired)  # Let it raise if still broken
                    logger.info("[STORYBOARD] Retry succeeded")

    # Debug: log attention field presence on the first clip of the first scene
    first_scene = result.get("scenes", [{}])[0] if result.get("scenes") else {}
    first_clip = first_scene.get("clips", [{}])[0] if first_scene.get("clips") else {}
    logger.debug(
        "[STORYBOARD] First clip attention fields — "
        "attentionDevice=%r, attentionAction=%r, attentionExpression=%r, attentionMood=%r | "
        "imagePromptA present=%s, imagePromptB present=%s, imagePromptC present=%s, imagePromptD present=%s",
        first_clip.get("attentionDevice", ""),
        first_clip.get("attentionAction", ""),
        first_clip.get("attentionExpression", ""),
        first_clip.get("attentionMood", ""),
        bool(first_clip.get("imagePromptA")),
        bool(first_clip.get("imagePromptB")),
        bool(first_clip.get("imagePromptC")),
        bool(first_clip.get("imagePromptD")),
    )

    # Post-process: apply suffix to imagePrompt and append Background ID
    attention_filled = 0
    attention_empty = 0
    for scene in result.get("scenes", []):
        for clip in scene.get("clips", []):
            # Normalize alternate key styles before downstream processing.
            _normalize_attention_fields(clip)

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

            # Apply suffix to imagePromptA/B/C/D
            for letter in ("A", "B", "C", "D"):
                val = clip.get(f"imagePrompt{letter}", "")
                if val:
                    clip[f"imagePrompt{letter}"] = _append_suffix(val)

            # Count attention field coverage for summary log
            filled = sum(1 for f in ("attentionDevice", "attentionAction", "attentionExpression", "attentionMood") if clip.get(f))
            if filled == 4:
                attention_filled += 1
            else:
                attention_empty += 1

    total_clips = attention_filled + attention_empty
    logger.info(
        "[STORYBOARD] Attention fields coverage: %d/%d clips have all 4 fields populated (%d missing)",
        attention_filled, total_clips, attention_empty,
    )

    return result, response.usage_metadata


async def process_storyboard_reference(
    job_id: str,
    custom_api_key: str | None = None,
    worker_id: str = "worker-1",
) -> dict:
    """Storyboard handler using reference-style attention prompting for A/B comparison."""
    return await process_storyboard(
        job_id=job_id,
        custom_api_key=custom_api_key,
        worker_id=worker_id,
        prompt_variant="reference",
    )


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
