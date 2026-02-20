"""Panel editor generation task handler."""

import base64
import logging
from datetime import datetime, timezone

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
from app.services.s3 import generate_panel_filename, upload_image

logger = logging.getLogger(__name__)
settings = get_settings()


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
        logger.info(f"Cancellation detected for panel job {job_id}")
        raise CancellationRequested(f"Job {job_id} was cancelled by user")


def build_panel_prompt(target_aspect_ratio: str, refinement_mode: str) -> str:
    """
    Build the prompt for panel transformation.

    Args:
        target_aspect_ratio: Target aspect ratio (e.g., "16:9", "1:1")
        refinement_mode: "default", "zoom", or "expand"

    Returns:
        The complete prompt string
    """
    prompt = f"""
Transform this comic panel into a pure, text-free, high-quality illustration that completely fills a {target_aspect_ratio} canvas.

CRITICAL INSTRUCTIONS (ZERO TOLERANCE FOR CHANGES):
1. **IDENTITY PRESERVATION:** The characters MUST look exactly as they do in the original. Do not change their facial features, hair style, clothing details, or expression even by one pixel if possible.
2. **CLEANUP:** Remove ALL speech bubbles, text boxes, sound effects, and panel borders. Inpaint gaps seamlessly using the surrounding texture.
"""

    if refinement_mode == "zoom":
        prompt += """
3. **ZOOM FILL STRATEGY:**
   - The output MUST contain NO empty space.
   - **ZOOM IN** on the focal point until the image touches all four edges.
   - CROP the background if necessary, but keep the character's face and key actions visible.
"""
    elif refinement_mode == "expand":
        prompt += """
3. **EXPAND FILL STRATEGY:**
   - The output MUST contain NO empty space.
   - **EXPAND** the scene by IN-PAINTING new background content to fill the empty areas.
   - Do NOT crop the original central content or characters.
"""
    else:
        # Default behavior
        prompt += """
3. **FILL STRATEGY:** If the original panel has negative space, ZOOM to fill the canvas.
4. **FRAMING:** Maintain existing crops (e.g., if a head is cut off, keep it cut off).
"""

    prompt += """
STRICT NEGATIVE CONSTRAINTS (YOU MUST NOT DO THESE):
- **NEVER CHANGE CHARACTER DETAILS:** Do not "fix", "improve", or "style" the character. The face, eyes, and design must be an exact replica of the source.
- **NEVER LEAVE TEXT:** All text bubbles must be removed.
- **NEVER LEAVE BORDERS:** The image must extend to the very edge of the canvas.
- **NO LETTERBOXING:** Do not leave white/black bars.
"""

    return prompt


async def _generate_panel_image_gemini(
    image_base64: str,
    mime_type: str,
    prompt: str,
    aspect_ratio: str,
    api_key: str,
) -> bytes:
    """Generate panel image using Gemini API."""
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=api_key)
    model = "gemini-2.0-flash-exp-image-generation"

    contents = [
        types.Part.from_bytes(
            data=base64.b64decode(image_base64),
            mime_type=mime_type,
        ),
        types.Part.from_text(text=prompt),
    ]

    generate_config = types.GenerateContentConfig(
        response_modalities=["IMAGE", "TEXT"],
    )

    response = await client.aio.models.generate_content(
        model=model,
        contents=contents,
        config=generate_config,
    )

    if response.candidates and response.candidates[0].content.parts:
        for part in response.candidates[0].content.parts:
            if part.inline_data and part.inline_data.data:
                return part.inline_data.data

    raise VideoJobError.provider_error("No image data found in Gemini response")


async def _generate_panel_image_grok(
    image_base64: str,
    mime_type: str,
    prompt: str,
    aspect_ratio: str,
    api_key: str,
) -> bytes:
    """Generate panel image using ModelsLab grok-imagine-image-i2i.

    ModelsLab requires a publicly accessible URL for the source image,
    so we upload the source panel to S3 first to obtain a CloudFront URL.
    """
    import time
    from app.providers.image.grok import generate_grok_panel
    from app.services.s3 import upload_image

    source_bytes = base64.b64decode(image_base64)

    # Derive file extension from MIME type
    ext_map = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}
    ext = ext_map.get(mime_type, "png")

    # Upload source image to S3 so ModelsLab can fetch it via URL
    timestamp = int(time.time() * 1000)
    source_s3_key = f"mithril/temp/grok-source/{timestamp}.{ext}"
    source_url = await upload_image(source_bytes, source_s3_key, mime_type)
    logger.info(f"[GROK] Uploaded source panel to S3: {source_url}")

    return await generate_grok_panel(
        source_url=source_url,
        prompt=prompt,
        aspect_ratio=aspect_ratio,
        api_key=api_key,
    )


async def generate_panel_image_for_provider(
    provider_id: str,
    image_base64: str,
    mime_type: str,
    prompt: str,
    aspect_ratio: str,
    api_key: str,
) -> bytes:
    """Dispatch panel image generation to the appropriate provider."""
    if provider_id == "grok":
        return await _generate_panel_image_grok(image_base64, mime_type, prompt, aspect_ratio, api_key)
    return await _generate_panel_image_gemini(image_base64, mime_type, prompt, aspect_ratio, api_key)


async def process_panel_generation(
    job_id: str,
    worker_id: str = "worker-1",
    custom_api_key: str | None = None,
) -> dict:
    """
    Main panel generation pipeline.

    Pipeline stages:
    1. PENDING -> PREPARING: Load source image and build prompt
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

    logger.info(f"[{worker_id}] ========== Starting panel generation for job {job_id} ==========")

    # Fetch job from Firestore
    job = await job_queue_service.get_job(job_id)
    if not job:
        logger.error(f"[PANEL-GEN] Job {job_id} not found in Firestore")
        return {"job_id": job_id, "status": "error", "error": "Job not found"}

    logger.info(f"[PANEL-GEN] Job {job_id} loaded: type={job.type}, session={job.session_id}, panel={job.panel_id}, status={job.status}")
    logger.info(f"[PANEL-GEN] File: {job.file_name}, Aspect ratio: {job.aspect_ratio}")
    logger.info(f"[PANEL-GEN] Refinement mode: {job.refinement_mode}")

    # Initialize state machine
    state_machine = JobStateMachine(job_id, job.status)

    # Mark job as being processed by this worker
    await job_queue_service.update_job(job_id, worker_id=worker_id)

    try:
        # === CHECKPOINT 1: Before preparing ===
        await check_cancellation(job_id)

        # Get API key
        api_key = _get_api_key(job, custom_api_key)

        # === Stage 1: Prepare - build prompt ===
        prompt = await _stage_prepare(job, state_machine)

        # === CHECKPOINT 2: Before generating ===
        await check_cancellation(job_id)

        # === Stage 2: Generate image ===
        image_bytes = await _stage_generate(job, prompt, api_key, state_machine)

        # === CHECKPOINT 3: Before upload ===
        await check_cancellation(job_id)

        # === Stage 3: Upload to S3 ===
        result = await _stage_upload(job, image_bytes, state_machine)

        # === Stage 4: Complete ===
        await _stage_complete(job, result, state_machine)

        logger.info(f"[PANEL-GEN] {job_id} ========== JOB COMPLETED SUCCESSFULLY ==========")
        logger.info(f"[PANEL-GEN] {job_id} - Image URL: {result['image_url']}")
        logger.info(f"[PANEL-GEN] {job_id} - S3 File: {result['s3_file_name']}")
        return {
            "job_id": job_id,
            "status": "completed",
            "image_url": result["image_url"],
            "s3_file_name": result["s3_file_name"],
        }

    except CancellationRequested:
        logger.warning(f"[PANEL-GEN] {job_id} - Job was cancelled")
        await _handle_cancellation(job_id, state_machine)
        return {"job_id": job_id, "status": "cancelled"}

    except VideoJobError as e:
        logger.error(f"[PANEL-GEN] {job_id} - VideoJobError: {e.code.value} - {e.message}")
        return await _handle_error(job, e, state_machine, custom_api_key)

    except Exception as e:
        logger.exception(f"[PANEL-GEN] {job_id} - Unexpected error: {type(e).__name__}: {str(e)}")
        video_error = classify_exception(e)
        return await _handle_error(job, video_error, state_machine, custom_api_key)


def _get_api_key(job: JobDocument, custom_api_key: str | None = None) -> str:
    """Get API key for panel generation.

    Priority:
    1. Custom API key passed through task queue
    2. Fallback to environment variable settings (provider-specific)
    """
    if custom_api_key:
        return custom_api_key

    if job.provider_id == "grok":
        if not settings.grok_api_key:
            raise VideoJobError.invalid_request("No ModelsLab API key configured for Grok provider")
        return settings.grok_api_key

    if not settings.gemini_api_key:
        raise VideoJobError.invalid_request("No Gemini API key configured")
    return settings.gemini_api_key


async def _stage_prepare(
    job: JobDocument,
    state_machine: JobStateMachine,
) -> str:
    """Stage 1: Build prompt for panel transformation."""
    job_queue_service = get_job_queue_service()

    logger.info(f"[PANEL-GEN] {job.id} - Stage 1: PREPARING (building prompt)")

    state_machine.transition_to(JobStatus.PREPARING)
    await job_queue_service.update_job_status(job.id, JobStatus.PREPARING, progress=0.1)
    logger.debug(f"[PANEL-GEN] {job.id} - Status updated to PREPARING in Firestore")

    # Build the transformation prompt
    prompt = build_panel_prompt(
        target_aspect_ratio=job.aspect_ratio,
        refinement_mode=job.refinement_mode or "default",
    )

    await job_queue_service.update_job(job.id, progress=0.2)
    logger.info(f"[PANEL-GEN] {job.id} - Stage 1 complete: prompt built")
    return prompt


async def _stage_generate(
    job: JobDocument,
    prompt: str,
    api_key: str,
    state_machine: JobStateMachine,
) -> bytes:
    """Stage 2: Generate image using the selected provider."""
    job_queue_service = get_job_queue_service()

    provider_id = job.provider_id or "gemini"
    logger.info(f"[PANEL-GEN] {job.id} - Stage 2: GENERATING image with {provider_id}")

    state_machine.transition_to(JobStatus.GENERATING)
    await job_queue_service.update_job_status(job.id, JobStatus.GENERATING, progress=0.3)
    logger.debug(f"[PANEL-GEN] {job.id} - Status updated to GENERATING in Firestore")

    # Validate we have source image
    if not job.source_image_base64:
        raise VideoJobError.invalid_request("No source image provided")

    # Generate image
    logger.info(f"[PANEL-GEN] {job.id} - Calling {provider_id} API...")
    try:
        image_bytes = await generate_panel_image_for_provider(
            provider_id=provider_id,
            image_base64=job.source_image_base64,
            mime_type=job.source_mime_type or "image/png",
            prompt=prompt,
            aspect_ratio=job.aspect_ratio,
            api_key=api_key,
        )
        logger.info(f"[PANEL-GEN] {job.id} - Image generated successfully: {len(image_bytes)} bytes")
    except Exception as e:
        logger.error(f"[PANEL-GEN] {job.id} - {provider_id} API error: {type(e).__name__}: {str(e)}")
        raise classify_exception(e)

    await job_queue_service.update_job(job.id, progress=0.7)
    return image_bytes


async def _stage_upload(
    job: JobDocument,
    image_bytes: bytes,
    state_machine: JobStateMachine,
) -> dict:
    """Stage 3: Upload generated image to S3."""
    job_queue_service = get_job_queue_service()

    logger.info(f"[PANEL-GEN] {job.id} - Stage 3: UPLOADING to S3")

    state_machine.transition_to(JobStatus.UPLOADING)
    await job_queue_service.update_job_status(job.id, JobStatus.UPLOADING, progress=0.8)
    logger.debug(f"[PANEL-GEN] {job.id} - Status updated to UPLOADING in Firestore")

    # Generate S3 filename (uses project_id for consistent path with ImageSplitter)
    s3_file_name = generate_panel_filename(
        project_id=job.project_id,
        panel_id=job.panel_id or job.id,
        job_id=job.id,
    )
    logger.debug(f"[PANEL-GEN] {job.id} - Generated S3 filename: {s3_file_name}")

    # Upload to S3
    logger.info(f"[PANEL-GEN] {job.id} - Uploading {len(image_bytes)} bytes to S3...")
    try:
        image_url = await upload_image(image_bytes, s3_file_name, "image/png")
        logger.info(f"[PANEL-GEN] {job.id} - Uploaded to S3: {s3_file_name}")
        logger.debug(f"[PANEL-GEN] {job.id} - Image URL: {image_url}")
    except Exception as e:
        logger.error(f"[PANEL-GEN] {job.id} - S3 upload failed: {e}")
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

    logger.info(f"[PANEL-GEN] {job.id} - Stage 4: COMPLETING")

    state_machine.transition_to(JobStatus.COMPLETED)

    # Update job queue - also clear the source_image_base64 to save space
    logger.debug(f"[PANEL-GEN] {job.id} - Updating job_queue status to COMPLETED")
    await job_queue_service.update_job_status(
        job.id,
        JobStatus.COMPLETED,
        image_url=result["image_url"],
        s3_file_name=result["s3_file_name"],
        progress=1.0,
    )

    # Clear source image from Firestore to save space
    await job_queue_service.update_job(
        job.id,
        unset_fields=["source_image_base64"],
    )

    logger.info(f"[PANEL-GEN] {job.id} - Job queue updated")


async def _handle_cancellation(
    job_id: str,
    state_machine: JobStateMachine,
) -> None:
    """Handle job cancellation."""
    job_queue_service = get_job_queue_service()

    logger.info(f"[{job_id}] Handling cancellation")

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
    from app.workers.tasks import retry_failed_panel_job

    job_queue_service = get_job_queue_service()

    logger.error(f"[{job.id}] Error: {error.code.value} - {error.message}")

    # Create retry state from job
    retry_state = RetryState(
        max_retries=job.max_retries,
        retry_count=job.retry_count,
    )

    # Record this failure
    retry_state.record_failure(error.code.value, error.message)

    # Check if we should retry
    if error.retryable and retry_state.can_retry():
        # Schedule retry
        delay = retry_state.get_next_delay(error.code)
        logger.info(
            f"[{job.id}] Will retry in {delay:.1f}s "
            f"(attempt {retry_state.retry_count}/{retry_state.max_retries})"
        )

        # Update job for retry
        state_machine.transition_to(JobStatus.FAILED)
        await job_queue_service.update_job(
            job.id,
            status=JobStatus.PENDING.value,  # Back to pending for retry
            retry_count=retry_state.retry_count,
            error_code=error.code.value,
            error_message=error.message,
            error_retryable=True,
        )

        # Queue retry task with delay and API key
        await retry_failed_panel_job.kiq(job.id, delay, custom_api_key)

        return {
            "job_id": job.id,
            "status": "retry_scheduled",
            "retry_after": delay,
            "attempt": retry_state.retry_count,
        }

    else:
        # Move to DLQ
        logger.warning(f"[{job.id}] Moving to DLQ after {retry_state.retry_count} attempts")

        state_machine.transition_to(JobStatus.FAILED)
        await job_queue_service.update_job_status(
            job.id,
            JobStatus.FAILED,
            error_code=error.code.value,
            error_message=error.message,
            error_retryable=False,
        )

        # Move to dead letter queue
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
