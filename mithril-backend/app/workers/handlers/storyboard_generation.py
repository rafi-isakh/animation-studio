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

STORYBOARD_RESPONSE_SCHEMA = {
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
                                "backgroundIdA": {"type": "STRING"},
                                "backgroundIdB": {"type": "STRING"},
                                "backgroundIdC": {"type": "STRING"},
                                "backgroundIdD": {"type": "STRING"},
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
                                "backgroundIdA", "backgroundIdB", "backgroundIdC", "backgroundIdD",
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
        "genre": {"type": "STRING"},
    },
    "required": ["scenes", "voicePrompts", "characterIdSummary", "genre"],
    "propertyOrdering": ["scenes", "voicePrompts", "characterIdSummary", "genre"],
}


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


def _first_sentence(text: str) -> str:
    """Return the first sentence of a prompt (up to the first period), lowercased and stripped."""
    return text.split(".")[0].strip().lower()


def _fix_background_id_conflicts(result: dict) -> int:
    """
    Detect clips where the same backgroundId maps to a different physical location
    and reassign a new unique location number to the conflicting clip.

    Two prompts are considered the same location if their first sentences match,
    so atmosphere/vibe variations on the same space are not flagged as conflicts.

    Returns the number of conflicts fixed.
    """
    all_clips = [
        clip
        for scene in result.get("scenes", [])
        for clip in scene.get("clips", [])
    ]

    # Find the highest location number already in use
    max_location = 0
    for clip in all_clips:
        bg_id = clip.get("backgroundId", "").strip()
        if bg_id and "-" in bg_id:
            try:
                max_location = max(max_location, int(bg_id.split("-")[0]))
            except ValueError:
                pass

    # First pass: build canonical {bg_id -> first sentence of first-seen prompt}
    id_to_first_sentence: dict[str, str] = {}
    for clip in all_clips:
        bg_id = clip.get("backgroundId", "").strip()
        bg_prompt = clip.get("backgroundPrompt", "").strip()
        if bg_id and bg_prompt and bg_id not in id_to_first_sentence:
            id_to_first_sentence[bg_id] = _first_sentence(bg_prompt)

    # Second pass: detect conflicts and reassign IDs
    # remap[(old_bg_id, first_sentence)] -> new_bg_id so the same conflicting location reuses the same new ID
    remap: dict[tuple[str, str], str] = {}
    conflicts_fixed = 0

    for clip in all_clips:
        bg_id = clip.get("backgroundId", "").strip()
        bg_prompt = clip.get("backgroundPrompt", "").strip()

        if not bg_id or not bg_prompt:
            continue

        canonical_sentence = id_to_first_sentence.get(bg_id, "")
        clip_sentence = _first_sentence(bg_prompt)

        if not canonical_sentence or canonical_sentence == clip_sentence:
            continue

        # Conflict: same ID, different physical location
        key = (bg_id, clip_sentence)
        if key not in remap:
            max_location += 1
            angle = bg_id.split("-")[1] if "-" in bg_id else "1"
            remap[key] = f"{max_location}-{angle}"
            logger.warning(
                "[STORYBOARD] Background ID conflict on '%s': canonical='%s...' vs clip='%s...'. "
                "Reassigning to '%s'.",
                bg_id,
                canonical_sentence[:60],
                clip_sentence[:60],
                remap[key],
            )
            conflicts_fixed += 1

        new_bg_id = remap[key]
        old_loc = bg_id.split("-")[0]
        new_loc = new_bg_id.split("-")[0]

        clip["backgroundId"] = new_bg_id

        # Update angle variants so their location number stays in sync
        for letter in ("A", "B", "C", "D"):
            variant = clip.get(f"backgroundId{letter}", "").strip()
            if variant and "-" in variant:
                v_loc, v_angle = variant.split("-", 1)
                if v_loc == old_loc:
                    clip[f"backgroundId{letter}"] = f"{new_loc}-{v_angle}"

    return conflicts_fixed


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


def _extract_continuation_context(result: dict, prev_context: dict | None = None) -> dict:
    """Extract state from a completed batch result needed by the next batch."""
    scenes = result.get("scenes", [])
    last_background_id = ""
    last_accumulated_time = "00:00"
    last_scene_title = ""

    # Carry forward the accumulated background registry from previous batches
    background_registry: dict[str, str] = dict(prev_context.get("background_registry", {})) if prev_context else {}

    for scene in scenes:
        if scene.get("sceneTitle"):
            last_scene_title = scene["sceneTitle"]
        for clip in scene.get("clips", []):
            bg_id = clip.get("backgroundId", "").strip()
            bg_prompt = clip.get("backgroundPrompt", "").strip()
            if bg_id:
                last_background_id = bg_id
                if bg_prompt and bg_id not in background_registry:
                    background_registry[bg_id] = bg_prompt
            if clip.get("accumulatedTime", "").strip():
                last_accumulated_time = clip["accumulatedTime"].strip()

    return {
        "last_background_id": last_background_id,
        "last_accumulated_time": last_accumulated_time,
        "last_scene_title": last_scene_title,
        "scene_count": len(scenes),
        "character_id_summary": result.get("characterIdSummary", []),
        "background_registry": background_registry,
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

        trailer_active = job.is_trailer_mode and bool(job.selected_trailer_script)
        if panel_count > BATCH_SIZE and not trailer_active:
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
                continuation_context = _extract_continuation_context(batch_result, continuation_context)
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
            # Single-call path
            if job.is_trailer_mode and job.selected_trailer_script:
                logger.info(f"[STORYBOARD] {job_id} - Trailer mode: non-sequential storyboard generation...")
                result, _usage = await _generate_trailer_storyboard_with_gemini(job, api_key)
            else:
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
    detected_locations = job.detected_locations or []
    source_text = source_text_override if source_text_override is not None else (job.source_text or "")

    # Build detected locations block for prompt injection
    if detected_locations:
        loc_lines = "\n".join(
            f'  [{loc.get("id", "")}] {loc.get("name", "")} — {loc.get("description", "")}'
            for loc in detected_locations
        )
        detected_locations_block = f"""
**[ID 컨버터에서 감지된 장소 전체 목록 — 필수 참조]**
아래는 원본 소설 전체에서 이미 식별·등록된 고유 장소 목록입니다. 콘티 작성 시 반드시 이 목록을 기준으로 backgroundId를 결정하십시오.

{loc_lines}

**[장소 재사용 판단 기준 — 엄격 준수]**
콘티를 클립 단위로 작성하기 전에, 원본 텍스트 전체의 타임라인을 먼저 훑어 각 장면의 물리적 장소를 위 목록에 매핑하십시오.
- 같은 물리 공간은 장면 묘사나 카메라 앵글, 텍스트 표현이 달라도 항상 동일한 backgroundId를 사용합니다.
- 특히 반복 등장 패턴에 주의하십시오:
  • 캐릭터가 잠에서 깨거나 침대에 누울 때 → 항상 같은 침실 ID
  • 귀가/퇴근 장면 → 항상 같은 집·아파트 ID
  • 같은 직장·학교에서 일어나는 일 → 항상 같은 장소 ID
  • "그 카페", "늘 가던 식당" 등 습관적 방문지 → 항상 같은 ID
- 위 목록에 없는 완전히 새로운 물리 공간만 새 backgroundId를 생성하십시오.
- 목록 ID를 직접 backgroundId로 사용하거나, 목록의 장소를 기반으로 번호 체계(1-1, 1-2 등)를 적용할 수 있습니다. 단, 한 번 부여한 ID는 해당 장소가 재등장할 때 절대 바꾸지 않습니다.
"""
    else:
        detected_locations_block = ""

    continuation_block = ""
    if continuation_context:
        char_summary_text = json.dumps(
            continuation_context.get("character_id_summary", []),
            ensure_ascii=False, indent=2
        )
        background_registry = continuation_context.get("background_registry", {})
        if background_registry:
            registry_lines = "\n".join(
                f'  "{bg_id}" → {desc}' for bg_id, desc in background_registry.items()
            )
            background_registry_block = f"""
- **기존 배경 레지스트리 (재사용 필수)**:
{registry_lines}
  위 목록의 장소와 동일한 배경이 등장하면 새 ID를 만들지 말고 해당 기존 ID를 그대로 사용하십시오.
"""
        else:
            background_registry_block = ""

        continuation_block = f"""
**[이전 배치에서 이어지는 콘티입니다 - 연속성 필수 유지]**
이 텍스트는 전체 원본의 일부입니다. 아래 이전 배치의 마지막 상태에서 자연스럽게 이어가야 합니다.

- **backgroundId 시작점**: "{continuation_context.get('last_background_id', '')}" 다음 번호부터 시작하십시오.
- **accumulatedTime 시작점**: "{continuation_context.get('last_accumulated_time', '00:00')}" 이후부터 누적 시간을 계산하십시오.
- **이전 마지막 씬 제목**: "{continuation_context.get('last_scene_title', '')}"
- **이전 씬 수**: {continuation_context.get('scene_count', 0)}개
- **캐릭터 ID 요약 (일관성 유지)**:
{char_summary_text}
{background_registry_block}"""

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

    {detected_locations_block}

    **[배경 ID 사전 등록 규칙 — 필수 준수]**
    콘티 클립을 작성하기 전에 다음 2단계를 반드시 거치십시오.

    **1단계 — 전체 타임라인 장소 분석**
    원본 텍스트 전체를 시간 순서대로 읽으며, 각 장면이 *어떤 물리적 공간*에서 일어나는지 파악합니다.
    - 캐릭터가 같은 공간으로 "돌아오는" 패턴을 식별하십시오. 등장인물이 하루를 보내고 집에 돌아와 침대에 눕는다면, 그 침실은 이야기 초반에 등장한 침실과 동일한 장소입니다.
    - 장소의 시간대(낮/밤), 날씨, 묘사 방식이 달라도 물리적 공간이 같으면 동일한 backgroundId입니다.
    - "그의 방", "침실", "아파트 방" 등 같은 공간을 가리키는 다양한 표현에 주의하십시오.

    **2단계 — backgroundId 사전 할당**
    1단계에서 파악한 고유 물리 공간 각각에 backgroundId를 부여합니다.
    - 위 ID 컨버터 목록이 제공된 경우 해당 ID를 우선 활용합니다.
    - 동일한 물리적 공간은 카메라 앵글이나 묘사 방식이 달라도 반드시 같은 backgroundId를 사용합니다.
      (예: "카페 입구"와 "카페 안쪽 창가"는 같은 카페 → 동일 ID)
    - 한 번 할당된 backgroundId는 해당 장소가 다시 등장할 때 절대 바꾸지 않습니다.
    - 클립 작성 시 사전 할당한 ID 목록만 참조하십시오. 새 ID를 즉흥적으로 생성하지 마십시오.

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

    3. **backgroundId**: 형식 "{{장소번호}}-{{앵글번호}}" (예: 1-3, 2-6)
    - **장소번호**: 물리적으로 고유한 장소를 나타내는 정수 (배경 ID 사전 등록 단계에서 할당)
    - **앵글번호**: 해당 클립에서 사용하는 카메라 앵글을 아래 9가지 중 하나로 고정 지정
      | 번호 | 앵글 이름 | 언제 사용 |
      | :--: | :--- | :--- |
      | 1 | Front View | 정면 구도, 장소 전경 소개 |
      | 2 | Worm View | 로우 앵글, 카메라가 바닥 근처에서 위를 향할 때 |
      | 3 | Character A View | 주요 캐릭터 A가 서 있을 위치의 오브젝트 클로즈업 |
      | 4 | Character B View | 주요 캐릭터 B가 서 있을 위치의 오브젝트 클로즈업 |
      | 5 | Rear View | 공간의 코너·후면 구도, 천장/하늘 일부 포함 |
      | 6 | Bird's Eye View | 하이 앵글, 위에서 공간 전체 레이아웃을 조망 |
      | 7 | Over-Shoulder A | 눈높이 오브젝트 클로즈업 A (천장/하늘 일부 포함) |
      | 8 | Over-Shoulder B | 눈높이 오브젝트 클로즈업 B (천장/하늘 일부 포함) |
      | 9 | Floor Close-up | 바닥/지면 표면 매크로샷 |
    - 같은 물리 장소라도 앵글이 다르면 postfix를 달리합니다 (예: `1-1`과 `1-6`은 같은 방, 다른 앵글).
    - 장소번호는 재등장 시 절대 바꾸지 않습니다. 앵글번호는 클립의 시각적 구도에 맞게 선택하십시오.

    3-a/b/c/d 규칙: 모든 backgroundIdA/B/C/D는 반드시 "{{장소번호}}-{{앵글번호}}" 형식이어야 합니다. "SOLID", "ABSTRACT", "NONE" 등 특수값은 절대 사용하지 마십시오. 항상 동일 장소번호에 해당 이미지 프롬프트의 구도에 가장 어울리는 앵글번호(1-9)를 선택하십시오.

    3-a. **backgroundIdA**: imagePromptA(오브젝트/인서트컷 극단 클로즈업)에 가장 어울리는 앵글 선택.
    예: 눈높이 소품 → 3 또는 4, 바닥 오브젝트 → 9, 테이블 위 오브젝트 부감 → 6

    3-b. **backgroundIdB**: imagePromptB(행동 샷)에 가장 어울리는 앵글 선택.
    imagePromptB의 첫 단어(카메라 기술어)를 기준으로 결정. 예: Eye-level → 1, Low angle → 2, Bird's eye → 6, Over-shoulder → 7 또는 8

    3-c. **backgroundIdC**: imagePromptC(감정/표정 극단 클로즈업)에 가장 어울리는 앵글 선택.
    얼굴 정면 클로즈업이면 → 1, 올려다보는 구도 → 2, 내려다보는 구도 → 6

    3-d. **backgroundIdD**: imagePromptD(감정 증폭)에 가장 어울리는 앵글 선택.
    드라마틱한 로우앵글 → 2, 압도적 하이앵글 → 6, 바닥·지면 강조 → 9

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

    15. **backgroundPrompt**: 영어로 AI 이미지 생성용 배경 환경 묘사 프롬프트를 작성합니다.
    - **반드시 다음 형식으로 시작**: `"2d anime background no characters. Wide shot. [장르 + setting — 예: Modern Contemporary setting, Western Fantasy setting, Sci-Fi Thriller setting]"`
    - **고유명사·캐릭터 ID·작품 내 고유 명칭 절대 금지**: `SPARTAN_HOSPITAL`, `LEON_APARTMENT`, `KAIDEN_OFFICE` 등 특정 ID나 고유명사를 사용하지 말고, 보편적인 장소 묘사로 대체하십시오. (예: `"a sterile hospital intern locker room"`, `"a cozy studio apartment"`, `"a corporate office lobby"`)
    - 접두사 이후, 다음 요소를 포함하여 **최소 2문장 이상** 구체적으로 작성하십시오:
      • 장소 유형 및 건축·인테리어 특성 (예: `"Metal lockers line the walls, and a large mirror hangs on one side"`)
      • 조명 조건 — 시간대(낮/밤/새벽), 광원 종류(자연광/형광등/촛불), 빛의 성질(따뜻함/차가움/역광 등) (예: `"Morning light streams through a window"`)
      • 분위기와 감정 톤 (예: `"melancholic and oppressive atmosphere"`, `"warm and intimate ambiance"`)
      • 주요 색감 또는 색 팔레트 (예: `"muted blues and grays"`, `"warm amber and ochre tones"`)
      • 핵심 환경 소품 및 세부사항
      • 날씨·계절 (야외 장면에 한함, 예: `"overcast winter sky, light snow dusting the ground"`)

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


    {continuation_block}

    원본 텍스트:
    ---
    {source_text}
    ---
    """

    result, usage_metadata = await _call_gemini_and_parse(client, prompt, STORYBOARD_RESPONSE_SCHEMA)
    _postprocess_storyboard_result(result)
    return result, usage_metadata


async def _call_gemini_and_parse(
    client: genai.Client,
    prompt: str,
    response_schema: dict,
) -> tuple[dict, object]:
    """Call Gemini with retry logic, parse and repair JSON, return (result, usage_metadata)."""
    max_retries = 3
    initial_delay = 2000
    delay = initial_delay
    response = None

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

    parsed_payload = getattr(response, "parsed", None)
    if isinstance(parsed_payload, dict):
        result = parsed_payload
    else:
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
                    result = json.loads(retry_repaired)
                    logger.info("[STORYBOARD] Retry succeeded")

    return result, response.usage_metadata


def _postprocess_storyboard_result(result: dict) -> None:
    """Apply prompt suffixes, background ID appending, and normalization to all clips in-place."""
    # Debug: log attention field presence on the first clip
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

    fixed_count = _fix_background_id_conflicts(result)
    if fixed_count:
        logger.info("[STORYBOARD] Fixed %d background ID conflict(s).", fixed_count)

    attention_filled = 0
    attention_empty = 0
    for scene in result.get("scenes", []):
        for clip in scene.get("clips", []):
            _normalize_attention_fields(clip)

            clip["imagePrompt"] = _append_suffix(clip.get("imagePrompt", ""))

            bg_id = clip.get("backgroundId", "")
            if bg_id and bg_id.strip():
                clip["imagePrompt"] = f"{clip['imagePrompt']}\n\nBackground ID: {bg_id}"

            vp = clip.get("videoPrompt", "").strip()
            if vp:
                connector = " " if (vp.endswith('.') or vp.endswith(',')) else ", "
                clip["videoPrompt"] = f"{vp}{connector}{VIDEO_PROMPT_SUFFIX}"
            else:
                clip["videoPrompt"] = VIDEO_PROMPT_SUFFIX

            raw = clip.get("pixAiPrompt", "").strip()
            clip["pixAiPrompt"] = f"{raw}, {PIXAI_PROMPT_SUFFIX}" if raw else PIXAI_PROMPT_SUFFIX

            for letter in ("A", "B", "C", "D"):
                val = clip.get(f"imagePrompt{letter}", "")
                if val:
                    val = _append_suffix(val)
                    bg_id_variant = clip.get(f"backgroundId{letter}", "").strip()
                    if bg_id_variant:
                        val = f"{val}\n\nBackground ID: {bg_id_variant}"
                    clip[f"imagePrompt{letter}"] = val

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


async def _generate_trailer_storyboard_with_gemini(
    job: JobDocument,
    api_key: str,
) -> tuple[dict, object]:
    """
    Generate a non-sequential trailer storyboard where each trailer script line
    anchors one scene. Scenes are ordered by the trailer script's dramatic arc,
    not the source text's chronological order.
    """
    client = genai.Client(api_key=api_key)

    exact_clip_count = job.clip_count if (job.clip_count and job.clip_count > 0) else 95

    # Parse trailer script lines to determine scene structure
    trailer_lines_raw: list[str] = []
    try:
        parsed = json.loads(job.selected_trailer_script or "[]")
        if isinstance(parsed, list):
            trailer_lines_raw = [str(line) for line in parsed if str(line).strip()]
    except (json.JSONDecodeError, TypeError):
        pass

    num_trailer_lines = len(trailer_lines_raw)
    clips_per_scene = max(1, round(exact_clip_count / num_trailer_lines)) if num_trailer_lines else 5
    trailer_script_text = "\n".join(
        f"{i + 1}. {line}" for i, line in enumerate(trailer_lines_raw)
    )

    # Job conditions
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
    source_text = job.source_text or ""

    prompt = f"""
    다음 원본 텍스트를 기반으로 **트레일러 콘티**를 제작해 주세요.
    이 콘티는 원본 스토리의 시간 순서를 따르지 않습니다. 아래 트레일러 스크립트의 극적 구조를 따릅니다.

    **[CRITICAL: 떡밥 식별 및 활용 원칙]**
    원본 텍스트를 분석하여 작품 내 '의도적으로 해소되지 않은 떡밥(미스터리, 숨겨진 정보, 불완전한 단서)'을 우선적으로 식별하십시오.
    다음 유형을 반드시 탐지하고 활용하십시오:
    - 정체가 다른 인물 / 동일 인물처럼 보이나 결정적 차이가 있는 존재 (예: 도플갱어 구조)
    - 회수되지 않은 복선 (행동, 대사, 시선, 오브젝트 등)
    - 사건의 원인/범인이 명확히 밝혀지지 않은 상태
    - 인물 간 관계의 진실이 감춰진 상태 (예: 배신, 이중 정체)
    - 초반에 의도적으로 감춰진 정보 (독자만 모르는 사실 포함)

    위 떡밥들은 절대 명확하게 해소하지 마십시오.
    대신, 트레일러에서는 다음 방식으로 활용하십시오:
    - 단서 단위로 분해하여 서로 다른 씬에 분산 배치
    - 원인 → 결과 순서를 의도적으로 파괴
    - 관객이 "이게 뭐지?"라고 느끼는 상태를 유지
    - 동일 대상이라도 서로 다른 맥락/톤으로 반복 노출하여 혼란 유도

    씬 구성은 반드시 다음 성질을 가져야 합니다:
    - 비선형 (Non-linear)
    - 정보 단편화 (Fragmented information)
    - 의미적 충돌 (Contradictory implication)
    - 해석 유도형 구조 (Interpretive gap)

    **[액션/연출 원칙]**
    - 정적인 설명 장면보다 **시각적으로 강한 순간 (폭력, 충돌, 감정 폭발, 급박한 움직임)**을 우선 선택
    - 떡밥 장면 + 액션 장면을 교차 편집하여 바이럴 영상처럼 구성

    **[CRITICAL: 트레일러 씬 구성 원칙 — 절대 준수]**
    - 트레일러 스크립트 라인 수: **{num_trailer_lines}개**
    - 각 라인은 하나의 씬(Scene)을 정의합니다. **씬의 순서는 트레일러 스크립트의 순서를 따릅니다.**
    - 각 씬은 해당 트레일러 스크립트 라인이 묘사하는 원본 텍스트 속 **특정 순간**을 찾아 시각화합니다.
    - 트레일러 스크립트가 다루지 않는 원본 텍스트의 나머지 부분은 **건너뜁니다(SKIP).**
    - 총 씬 수 = **{num_trailer_lines}개** (트레일러 스크립트 라인 수와 동일)
    - 씬당 클립 수: 각 씬은 **약 {clips_per_scene}개**의 클립으로 구성합니다.
    - 전체 클립의 수는 **정확히 {exact_clip_count}개**여야 합니다. 이 숫자는 절대적인 요구사항입니다.

    **[트레일러 스크립트 = 씬 목록]**
    각 번호가 씬 번호입니다. 이 순서대로 씬을 생성하십시오:

    {trailer_script_text}

    **[씬 생성 절차 — 반드시 이 순서를 따르십시오]**
    1. 트레일러 스크립트의 첫 번째 라인 → 씬 1
    2. 원본 텍스트에서 이 라인의 대사/나레이션이 등장하는 구체적인 순간을 찾는다
    3. 해당 순간을 중심으로 약 {clips_per_scene}개의 클립을 생성한다
    4. 씬의 첫 번째 클립의 `trailerScriptKo` 필드에 해당 스크립트 라인을 배치한다
    5. `trailerScriptEn` 필드에 해당 라인의 영문 번역을 작성한다
    6. 다음 트레일러 스크립트 라인으로 이동 → 씬 2를 동일하게 생성한다
    7. {num_trailer_lines}개 라인 모두 반복한다

    **[중요]** 씬의 순서는 원본 텍스트의 시간 순서가 아닌 **트레일러 스크립트의 순서**를 따른다.
    원본에서 더 뒤에 나오는 사건이 앞 씬에 등장할 수 있으며, 이것은 의도된 동작이다.
    `dialogue`와 `narration` 필드는 해당 클립이 묘사하는 순간의 원본 텍스트에서 발췌한다.

    **[CRITICAL: 씬 도입부 인서트컷 (Insert Cut)]**
    새로운 씬(Scene)이 시작될 때, 첫 번째 클립은 반드시 **인물이 없는 배경 인서트컷(Insert Cut)**이어야 합니다. 해당 장소를 암시하는 소품(Item)의 클로즈업(Close-up)이나, 배경의 분위기를 보여주는 정적인 샷으로 구성하십시오. 이 클립의 모든 이미지 프롬프트(imagePrompt, imagePromptA~D)에는 인물 묘사가 없어야 합니다.

    **[배경 ID 규칙]**
    원본 텍스트 전체를 훑어 물리적 장소 목록을 먼저 파악한 뒤, 각 장소에 고유 번호를 부여하십시오.
    backgroundId 형식: "{{장소번호}}-{{앵글번호}}" (예: 3-1, 7-6)
    - 장소번호: 물리적으로 고유한 공간 (동일 공간 재등장 시 반드시 동일 번호 사용)
    - 앵글번호 1~9: 1=Front, 2=Worm/Low, 3=Char A, 4=Char B, 5=Rear, 6=Bird's Eye, 7=OTS-A, 8=OTS-B, 9=Floor
    - backgroundIdA/B/C/D도 동일 형식, 각 이미지 프롬프트 구도에 맞는 앵글 선택

    **[CRITICAL: 클립 길이 계산 규칙]**
    모든 클립의 길이는 **절대로 4초를 넘을 수 없습니다.** dialogueEn 단어 수 기준: 0~5단어=2초, 6단어 이상=4초(최대).

    **[가장 중요한 규칙]**
    하나의 클립은 반드시 하나의 단일 동작이나 정지된 장면만을 묘사해야 합니다.

    각 필드에 대한 지침:

    1. **sceneTitle**: 각 씬의 주요 내용을 요약하는 제목을 한국어로 작성합니다.

    2. **story**: 규칙: {story_condition}

    3. **imagePrompt**: 영어로 작성. 규칙: {image_condition}. 가이드: {image_guide or '없음'}

    4. **attention 필드**: story를 분석하여 시각적으로 주목할 요소 4가지를 각각 아래 필드에 한국어로 출력하십시오.
    - **attentionDevice**: 오브젝트/인서트컷 유형 — 장면 속 핵심 소품·사물
    - **attentionAction**: 행동 유형 — 인물이 취하는 구체적인 동작
    - **attentionExpression**: 감정 유형 — 인물의 감정 상태·신체 반응
    - **attentionMood**: 분위기 유형 — 장면 전체의 감정적 톤·분위기를 한 단어나 짧은 구로

    4-2. **imagePromptA**: 오브젝/인서트컷(attentionDevice) 타입 — 극단적 클로즈업, 인물 얼굴/표정 제외.
    4-3. **imagePromptB**: 행동(attentionAction) 타입 — 첫 단어는 카메라 거리+각도.
    4-4. **imagePromptC**: 감정(attentionExpression) 타입 — 얼굴/눈/동공 극단적 클로즈업, 배경 단색 처리.
    4-5. **imagePromptD**: 감정 증폭 타입 — 장면의 감정 강도를 시각적으로 극대화, 방법론 자유.

    {f'이미지 가이드 패키지가 제공된 경우, 위 4-2~4-5 프롬프트는 아래 패키지의 스타일·구조·패턴을 분석하여 동일한 유형으로 작성하십시오.' if image_prompt_qa else ''}

    **[CRITICAL: 캐릭터 묘사 규칙]**
    - 'two people', 'two characters', 'a man' 등 모호한 표현 금지 — 반드시 고유 캐릭터 ID 사용.
    - 두 명 이상 등장 시 각 캐릭터의 상대적 위치(왼쪽/오른쪽) 명시.
    - 기본 자세는 standing. 앉거나 누울 경우 구체적 위치 명시.

    5. **videoPrompt**: 영어로 작성. 규칙: {video_condition}. 가이드: {video_guide or '없음'}

    6. **dialogue**: 한국어 대사. 반드시 원본 텍스트에서 토씨 하나 틀리지 않고 발췌. 규칙: {sound_condition}

    7. **dialogueEn**: dialogue의 영어 번역

    7-1. **narration**: 대사가 없는 클립의 한국어 나레이션 (원본 텍스트에서 발췌)

    7-2. **narrationEn**: narration의 영어 번역

    8. **sfx**: 한국어 효과음
    9. **sfxEn**: sfx의 영어 번역
    10. **bgm**: 한국어 배경음악
    11. **bgmEn**: bgm의 영어 번역

    12. **soraVideoPrompt**: Sora 비디오 AI용 영어 프롬프트

    19. **veoVideoPrompt**: Google Veo 비디오 AI용 영어 프롬프트. 템플릿:
      - 대사 있음: `Static shot of [imagePrompt 시각적 묘사], saying "[dialogueEn]"`
      - 배경만: `Fixed lo-fi static background wallpaper, slow dolly-in`
      - 나레이션 있음 (대사 없음): `Static storybook lofi wallpaper, narration says "[narrationEn]"`

    20. **pixAiPrompt**: PixAI 애니메이션 스타일 이미지 생성 AI용 영어 프롬프트.

    13. **length**: "1초", "2초", "4초" 형식
    14. **accumulatedTime**: "MM:SS" 형식 누적 시간
    15. **backgroundPrompt**: 영어로 AI 이미지 생성용 배경 환경 묘사 프롬프트를 작성합니다.
    - **반드시 다음 형식으로 시작**: `"2d anime background no characters. Wide shot. [장르 + setting — 예: Modern Contemporary setting, Western Fantasy setting, Sci-Fi Thriller setting]"`
    - **고유명사·캐릭터 ID·작품 내 고유 명칭 절대 금지**: `SPARTAN_HOSPITAL`, `LEON_APARTMENT` 등 특정 ID나 고유명사를 사용하지 말고, 보편적인 장소 묘사로 대체하십시오. (예: `"a sterile hospital intern locker room"`, `"a cozy studio apartment"`)
    - 접두사 이후, 다음 요소를 포함하여 **최소 2문장 이상** 구체적으로 작성하십시오:
      • 장소 유형 및 건축·인테리어 특성
      • 조명 조건 — 시간대, 광원 종류, 빛의 성질
      • 분위기와 감정 톤
      • 주요 색감 또는 색 팔레트
      • 핵심 환경 소품 및 세부사항
      • 날씨·계절 (야외 장면에 한함)

    16. **voicePrompts**: 주요 캐릭터의 보이스 프롬프트 (promptKo, promptEn)

    17. **characterIdSummary**: 모든 클립의 imagePrompt에 등장하는 모든 대문자 캐릭터 ID 요약 리스트.
      1. 현재 시점 주인공 가장 먼저, "Protagonist. Default"로 설명.
      2. 각 캐릭터 그룹에서 디폴트 버전 먼저 식별.
      3. 디폴트 캐릭터는 주인공과의 관계 + "Default" 추가.
      4. 변형(Variant) 캐릭터는 해당 디폴트 ID 기준으로 설명.

    18. **genre**: 원본 텍스트의 장르를 "한국어 장르명 (English Genre Name)" 형식으로.

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
    아래 패키지에 포함된 예시 프롬프트들을 분석하여 각 유형의 스타일, 구조, 표현 패턴을 파악하십시오.
    imagePromptA, imagePromptB, imagePromptC, imagePromptD 생성 시 이 패키지의 패턴을 따르십시오.
    {image_prompt_qa}
    ''' if image_prompt_qa else ''}

    원본 텍스트:
    ---
    {source_text}
    ---
    """

    result, usage_metadata = await _call_gemini_and_parse(client, prompt, STORYBOARD_RESPONSE_SCHEMA)
    _postprocess_storyboard_result(result)
    logger.info(
        "[STORYBOARD-TRAILER] Generated %d scenes (expected %d trailer lines)",
        len(result.get("scenes", [])),
        num_trailer_lines,
    )
    return result, usage_metadata


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
