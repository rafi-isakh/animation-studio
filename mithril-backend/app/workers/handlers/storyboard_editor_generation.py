"""Storyboard editor generation task handler (generate + remix)."""

import asyncio
import base64
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
from app.core.retry import RetryState
from app.core.state_machine import JobStateMachine
from app.models.job import JobDocument, JobStatus
from app.services.firestore import get_job_queue_service
from app.services.s3 import download_image, upload_image

logger = logging.getLogger(__name__)
settings = get_settings()

IMAGE_PROMPT_SUFFIX = "No vfx or visual effects, no dust particles"


class CancellationRequested(Exception):
    """Raised when job cancellation is detected."""
    pass


async def check_cancellation(job_id: str) -> None:
    """Check if cancellation has been requested for a job."""
    job_queue_service = get_job_queue_service()
    job = await job_queue_service.get_job(job_id)
    if job and job.cancellation_requested:
        logger.info(f"Cancellation detected for storyboard editor job {job_id}")
        raise CancellationRequested(f"Job {job_id} was cancelled by user")


def _append_suffix(prompt: str) -> str:
    """Append the standard suffix to an image prompt if not already present."""
    if not prompt:
        return prompt
    trimmed = prompt.strip()
    suffix_lower = IMAGE_PROMPT_SUFFIX.lower()
    prompt_lower = trimmed.lower()

    if prompt_lower.endswith(suffix_lower) or prompt_lower.endswith(suffix_lower + '.'):
        return trimmed

    connector = " " if (trimmed.endswith('.') or trimmed.endswith(',')) else ", "
    return f"{trimmed}{connector}{IMAGE_PROMPT_SUFFIX}"


def _get_api_key(job: JobDocument, custom_api_key: str | None = None) -> str:
    """Get API key. Priority: custom key > env variable."""
    if custom_api_key:
        return custom_api_key
    if not settings.gemini_api_key:
        raise VideoJobError.invalid_request("No Gemini API key configured")
    return settings.gemini_api_key


async def process_storyboard_editor_generation(
    job_id: str,
    worker_id: str = "worker-1",
    custom_api_key: str | None = None,
) -> dict:
    """
    Main storyboard editor generation pipeline.

    Handles both 'generate' and 'remix' operations.

    Pipeline stages:
    1. PENDING -> PREPARING: Fetch reference/asset images from S3
    2. PREPARING -> GENERATING: Call Gemini API
    3. GENERATING -> UPLOADING: Upload result to S3
    4. UPLOADING -> COMPLETED: Update Firestore

    Args:
        job_id: The job ID to process
        worker_id: ID of the worker processing this job
        custom_api_key: Optional custom API key (passed through task queue)

    Returns:
        dict with status and result information
    """
    job_queue_service = get_job_queue_service()

    logger.info(f"[STORYBOARD-EDITOR] ========== Starting job {job_id} ==========")

    # Fetch job from Firestore
    job = await job_queue_service.get_job(job_id)
    if not job:
        logger.error(f"[STORYBOARD-EDITOR] Job {job_id} not found in Firestore")
        return {"job_id": job_id, "status": "error", "error": "Job not found"}

    logger.info(
        f"[STORYBOARD-EDITOR] Job {job_id}: operation={job.operation}, "
        f"frame_type={job.frame_type}, scene={job.scene_index}, clip={job.clip_index}"
    )

    # Initialize state machine
    state_machine = JobStateMachine(job_id, job.status)

    # Mark job as being processed by this worker
    await job_queue_service.update_job(job_id, worker_id=worker_id)

    try:
        # === CHECKPOINT 1: Before preparing ===
        await check_cancellation(job_id)

        api_key = _get_api_key(job, custom_api_key)

        # === Stage 1: Prepare - fetch images from S3 ===
        asset_images, reference_image, original_image = await _stage_prepare(
            job, state_machine
        )

        # === CHECKPOINT 2: Before generating ===
        await check_cancellation(job_id)

        # === Stage 2: Generate/Remix image ===
        image_bytes = await _stage_generate(
            job, asset_images, reference_image, original_image, api_key, state_machine
        )

        # === CHECKPOINT 3: Before upload ===
        await check_cancellation(job_id)

        # === Stage 3: Upload to S3 ===
        result = await _stage_upload(job, image_bytes, state_machine)

        # === Stage 4: Complete ===
        await _stage_complete(job, result, state_machine)

        logger.info(f"[STORYBOARD-EDITOR] {job_id} ========== JOB COMPLETED ==========")
        return {
            "job_id": job_id,
            "status": "completed",
            "image_url": result["image_url"],
            "s3_file_name": result["s3_file_name"],
        }

    except CancellationRequested:
        logger.warning(f"[STORYBOARD-EDITOR] {job_id} - Job was cancelled")
        await _handle_cancellation(job_id, state_machine)
        return {"job_id": job_id, "status": "cancelled"}

    except VideoJobError as e:
        logger.error(f"[STORYBOARD-EDITOR] {job_id} - VideoJobError: {e.code.value} - {e.message}")
        return await _handle_error(job, e, state_machine, custom_api_key)

    except Exception as e:
        logger.exception(f"[STORYBOARD-EDITOR] {job_id} - Unexpected error: {type(e).__name__}: {str(e)}")
        video_error = classify_exception(e)
        return await _handle_error(job, video_error, state_machine, custom_api_key)


async def _stage_prepare(
    job: JobDocument,
    state_machine: JobStateMachine,
) -> tuple[list[bytes], bytes | None, bytes | None]:
    """
    Stage 1: Fetch reference and asset images from S3.

    Returns:
        (asset_images, reference_image, original_image)
    """
    job_queue_service = get_job_queue_service()

    logger.info(f"[STORYBOARD-EDITOR] {job.id} - Stage 1: PREPARING")

    state_machine.transition_to(JobStatus.PREPARING)
    await job_queue_service.update_job_status(job.id, JobStatus.PREPARING, progress=0.1)

    asset_images: list[bytes] = []
    reference_image: bytes | None = None
    original_image: bytes | None = None

    # Fetch asset images (color references)
    if job.asset_image_urls:
        logger.info(f"[STORYBOARD-EDITOR] {job.id} - Fetching {len(job.asset_image_urls)} asset images")
        for i, url in enumerate(job.asset_image_urls):
            try:
                img_bytes = await download_image(url)
                asset_images.append(img_bytes)
                logger.info(f"[STORYBOARD-EDITOR] {job.id} - Fetched asset {i+1}: {len(img_bytes)} bytes")
            except Exception as e:
                logger.warning(f"[STORYBOARD-EDITOR] {job.id} - Failed to fetch asset {url}: {e}")

    # Fetch reference manga panel (for generate operation)
    if job.reference_urls and len(job.reference_urls) > 0:
        try:
            reference_image = await download_image(job.reference_urls[0])
            logger.info(f"[STORYBOARD-EDITOR] {job.id} - Fetched reference image: {len(reference_image)} bytes")
        except Exception as e:
            logger.warning(f"[STORYBOARD-EDITOR] {job.id} - Failed to fetch reference: {e}")

    # Fetch original image (for remix operation)
    if job.operation == "remix" and job.original_image_url:
        try:
            original_image = await download_image(job.original_image_url)
            logger.info(f"[STORYBOARD-EDITOR] {job.id} - Fetched original image: {len(original_image)} bytes")
        except Exception as e:
            logger.warning(f"[STORYBOARD-EDITOR] {job.id} - Failed to fetch original image: {e}")
            raise VideoJobError.invalid_request("Failed to fetch original image for remix")

    await job_queue_service.update_job(job.id, progress=0.2)
    return asset_images, reference_image, original_image


async def _stage_generate(
    job: JobDocument,
    asset_images: list[bytes],
    reference_image: bytes | None,
    original_image: bytes | None,
    api_key: str,
    state_machine: JobStateMachine,
) -> bytes:
    """Stage 2: Generate or remix image using Gemini."""
    job_queue_service = get_job_queue_service()

    logger.info(f"[STORYBOARD-EDITOR] {job.id} - Stage 2: GENERATING ({job.operation})")

    state_machine.transition_to(JobStatus.GENERATING)
    await job_queue_service.update_job_status(job.id, JobStatus.GENERATING, progress=0.3)

    client = genai.Client(api_key=api_key)

    if job.operation == "generate":
        image_bytes = await _call_gemini_generate(
            client, job, asset_images, reference_image
        )
    else:  # remix
        image_bytes = await _call_gemini_remix(
            client, job, asset_images, original_image
        )

    await job_queue_service.update_job(job.id, progress=0.7)
    return image_bytes


async def _call_gemini_generate(
    client: genai.Client,
    job: JobDocument,
    asset_images: list[bytes],
    reference_image: bytes | None,
) -> bytes:
    """Call Gemini API for image generation (manga panel -> anime frame)."""
    final_prompt = _append_suffix(job.prompt)

    system_instruction = f"""
You are an expert anime production artist.
GOAL: Generate a clean, high-quality anime screenshot (GENGA style).

MANDATORY CLEANUP RULES:
1. **DELETE ALL TEXT**: Strictly remove any and all speech bubbles, narration boxes, on-screen text, and typography.
2. **DELETE SFX**: Remove all sound effect text (onomatopoeia).
3. **DELETE BORDERS**: Remove all manga panel borders and frame lines.
4. **COLOR CONSISTENCY**: Use the provided "Asset Reference" images for exact hair, skin, and outfit colors.
5. **COMPOSITION**: If a manga panel is provided, maintain the EXACT pose and camera angle, but convert the art style into a polished anime frame.

Output ONLY the clean visual frame.
Current Scene: {final_prompt}
"""

    parts: list = []

    # Add asset context images
    for i, img_bytes in enumerate(asset_images):
        mime_type = _detect_mime_type(img_bytes)
        parts.append(types.Part.from_text(text=f"Asset Reference {i + 1} (COLOR SOURCE):"))
        parts.append(types.Part.from_bytes(data=img_bytes, mime_type=mime_type))

    # Add reference manga panel
    if reference_image:
        mime_type = _detect_mime_type(reference_image)
        parts.append(types.Part.from_text(text="Source Manga Panel (CONVERT TO CLEAN ANIME FRAME):"))
        parts.append(types.Part.from_bytes(data=reference_image, mime_type=mime_type))

    parts.append(types.Part.from_text(text=system_instruction))

    logger.info(f"[STORYBOARD-EDITOR] Calling Gemini generate: model=gemini-2.5-flash-image, ratio={job.aspect_ratio}")

    def _generate():
        return client.models.generate_content(
            model="gemini-2.5-flash-image",
            contents=types.Content(role="user", parts=parts),
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE"],
                image_config=types.ImageConfig(aspect_ratio=job.aspect_ratio),
            ),
        )

    response = await asyncio.to_thread(_generate)
    return _extract_image_from_response(response)


async def _call_gemini_remix(
    client: genai.Client,
    job: JobDocument,
    asset_images: list[bytes],
    original_image: bytes | None,
) -> bytes:
    """Call Gemini API for image remix/modification."""
    if not original_image:
        raise VideoJobError.invalid_request("Original image is required for remix")

    system_msg = f"""
Modify the provided anime screenshot.
Instruction: {job.remix_prompt}
Context: {job.original_context}
STRICTLY maintain character colors from Asset References and overall style.
REMOVE all text, bubbles, and borders.
"""

    parts: list = []

    # Add asset context images
    for img_bytes in asset_images:
        mime_type = _detect_mime_type(img_bytes)
        parts.append(types.Part.from_bytes(data=img_bytes, mime_type=mime_type))

    # Add original image
    mime_type = _detect_mime_type(original_image)
    parts.append(types.Part.from_bytes(data=original_image, mime_type=mime_type))

    # Add instruction
    parts.append(types.Part.from_text(text=system_msg))

    logger.info(f"[STORYBOARD-EDITOR] Calling Gemini remix: model=gemini-2.5-flash-image, ratio={job.aspect_ratio}")

    def _generate():
        return client.models.generate_content(
            model="gemini-2.5-flash-image",
            contents=types.Content(role="user", parts=parts),
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE"],
                image_config=types.ImageConfig(aspect_ratio=job.aspect_ratio),
            ),
        )

    response = await asyncio.to_thread(_generate)
    return _extract_image_from_response(response)


def _detect_mime_type(img_bytes: bytes) -> str:
    """Detect MIME type from image bytes."""
    if img_bytes[:8] == b'\x89PNG\r\n\x1a\n':
        return "image/png"
    if img_bytes[:4] == b'RIFF' and img_bytes[8:12] == b'WEBP':
        return "image/webp"
    return "image/jpeg"


def _extract_image_from_response(response) -> bytes:
    """Extract image bytes from Gemini API response."""
    if response.candidates:
        candidate = response.candidates[0]
        if candidate.content and candidate.content.parts:
            for part in candidate.content.parts:
                if hasattr(part, "inline_data") and part.inline_data:
                    image_bytes = part.inline_data.data
                    if image_bytes:
                        logger.info(f"[STORYBOARD-EDITOR] Image extracted: {len(image_bytes)} bytes")
                        return image_bytes

    if response.prompt_feedback and response.prompt_feedback.block_reason:
        raise ValueError(f"Request blocked: {response.prompt_feedback.block_reason}")

    raise RuntimeError("No image returned from Gemini API")


async def _stage_upload(
    job: JobDocument,
    image_bytes: bytes,
    state_machine: JobStateMachine,
) -> dict:
    """Stage 3: Upload generated image to S3."""
    job_queue_service = get_job_queue_service()

    logger.info(f"[STORYBOARD-EDITOR] {job.id} - Stage 3: UPLOADING to S3")

    state_machine.transition_to(JobStatus.UPLOADING)
    await job_queue_service.update_job_status(job.id, JobStatus.UPLOADING, progress=0.8)

    # Generate S3 filename
    frame_suffix = "start" if job.frame_type == "start" else "end"
    s3_file_name = (
        f"mithril/{job.project_id}/storyboard-editor/"
        f"s{job.scene_index}_c{job.clip_index}_{frame_suffix}_{job.id}.png"
    )

    try:
        image_url = await upload_image(image_bytes, s3_file_name, "image/png")
        logger.info(f"[STORYBOARD-EDITOR] {job.id} - Uploaded to S3: {s3_file_name}")
    except Exception as e:
        logger.error(f"[STORYBOARD-EDITOR] {job.id} - S3 upload failed: {e}")
        raise VideoJobError.internal(f"S3 upload failed: {e}")

    return {
        "image_url": image_url,
        "s3_file_name": s3_file_name,
    }


async def _stage_complete(
    job: JobDocument,
    result: dict,
    state_machine: JobStateMachine,
) -> None:
    """Stage 4: Update Firestore and mark complete."""
    job_queue_service = get_job_queue_service()

    logger.info(f"[STORYBOARD-EDITOR] {job.id} - Stage 4: COMPLETING")

    state_machine.transition_to(JobStatus.COMPLETED)
    await job_queue_service.update_job_status(
        job.id,
        JobStatus.COMPLETED,
        image_url=result["image_url"],
        s3_file_name=result["s3_file_name"],
        progress=1.0,
    )


async def _handle_cancellation(
    job_id: str,
    state_machine: JobStateMachine,
) -> None:
    """Handle job cancellation."""
    job_queue_service = get_job_queue_service()

    state_machine.transition_to(JobStatus.CANCELLED)
    await job_queue_service.update_job_status(
        job_id,
        JobStatus.CANCELLED,
        cancelled_at=datetime.now(timezone.utc).isoformat(),
    )


async def _handle_error(
    job: JobDocument,
    error: VideoJobError,
    state_machine: JobStateMachine,
    custom_api_key: str | None = None,
) -> dict:
    """Handle job error with potential retry."""
    from app.workers.tasks import retry_failed_storyboard_editor_job

    job_queue_service = get_job_queue_service()

    logger.error(f"[STORYBOARD-EDITOR] {job.id} - Error: {error.code.value} - {error.message}")

    retry_state = RetryState(
        max_retries=job.max_retries,
        retry_count=job.retry_count,
    )
    retry_state.record_failure(error.code.value, error.message)

    if error.retryable and retry_state.can_retry():
        delay = retry_state.get_next_delay(error.code)
        logger.info(
            f"[STORYBOARD-EDITOR] {job.id} - Will retry in {delay:.1f}s "
            f"(attempt {retry_state.retry_count}/{retry_state.max_retries})"
        )

        state_machine.transition_to(JobStatus.FAILED)
        await job_queue_service.update_job(
            job.id,
            status=JobStatus.PENDING.value,
            retry_count=retry_state.retry_count,
            error_code=error.code.value,
            error_message=error.message,
            error_retryable=True,
        )

        await retry_failed_storyboard_editor_job.kiq(job.id, delay, custom_api_key)

        return {
            "job_id": job.id,
            "status": "retry_scheduled",
            "retry_after": delay,
            "attempt": retry_state.retry_count,
        }
    else:
        logger.warning(f"[STORYBOARD-EDITOR] {job.id} - Moving to DLQ after {retry_state.retry_count} attempts")

        state_machine.transition_to(JobStatus.FAILED)
        await job_queue_service.update_job_status(
            job.id,
            JobStatus.FAILED,
            error_code=error.code.value,
            error_message=error.message,
            error_retryable=False,
        )

        await job_queue_service.move_to_dlq(
            job.id,
            error.code.value,
            error.message,
            retry_state.failure_history,
        )

        return {
            "job_id": job.id,
            "status": "failed",
            "error_code": error.code.value,
            "error_message": error.message,
            "moved_to_dlq": True,
        }
