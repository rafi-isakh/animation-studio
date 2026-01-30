"""Background generation task handler."""

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
from app.providers.image import gemini_image_provider
from app.providers.image.base import ImageGenerateRequest
from app.services.firestore import get_job_queue_service, get_bg_angle_service
from app.services.s3 import generate_bg_filename, upload_image, download_image

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
        logger.info(f"Cancellation detected for bg job {job_id}")
        raise CancellationRequested(f"Job {job_id} was cancelled by user")


async def process_bg_generation(
    job_id: str,
    worker_id: str = "worker-1",
    custom_api_key: str | None = None,
) -> dict:
    """
    Main background generation pipeline.

    Pipeline stages (simplified - no reference images):
    1. PENDING -> PREPARING: Validate job
    2. PREPARING -> GENERATING: Call Gemini API (text-only)
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

    logger.info(f"[{worker_id}] ========== Starting bg generation for job {job_id} ==========")

    # Fetch job from Firestore
    job = await job_queue_service.get_job(job_id)
    if not job:
        logger.error(f"[BG-GEN] Job {job_id} not found in Firestore")
        return {"job_id": job_id, "status": "error", "error": "Job not found"}

    logger.info(f"[BG-GEN] Job {job_id} loaded: type={job.type}, project={job.project_id}")
    logger.info(f"[BG-GEN] BG: {job.bg_id}, Angle: {job.bg_angle}, Name: {job.bg_name}")
    logger.info(f"[BG-GEN] Prompt: {job.prompt[:100]}...")
    logger.info(f"[BG-GEN] Aspect ratio: {job.aspect_ratio}")

    # Initialize state machine
    state_machine = JobStateMachine(job_id, job.status)

    # Mark job as being processed by this worker
    await job_queue_service.update_job(job_id, worker_id=worker_id)

    try:
        # === CHECKPOINT 1: Before preparing ===
        await check_cancellation(job_id)

        # Get API key
        api_key = _get_api_key(job, custom_api_key)

        # === Stage 1: Prepare (validate and fetch reference images) ===
        reference_images = await _stage_prepare(job, state_machine)

        # === CHECKPOINT 2: Before generating ===
        await check_cancellation(job_id)

        # === Stage 2: Generate image ===
        image_bytes = await _stage_generate(job, reference_images, api_key, state_machine)

        # === CHECKPOINT 3: Before upload ===
        await check_cancellation(job_id)

        # === Stage 3: Upload to S3 ===
        result = await _stage_upload(job, image_bytes, state_machine)

        # === Stage 4: Complete ===
        await _stage_complete(job, result, state_machine)

        logger.info(f"[BG-GEN] {job_id} ========== JOB COMPLETED SUCCESSFULLY ==========")
        logger.info(f"[BG-GEN] {job_id} - Image URL: {result['image_url']}")
        logger.info(f"[BG-GEN] {job_id} - S3 File: {result['s3_file_name']}")
        return {
            "job_id": job_id,
            "status": "completed",
            "image_url": result["image_url"],
            "s3_file_name": result["s3_file_name"],
        }

    except CancellationRequested:
        logger.warning(f"[BG-GEN] {job_id} - Job was cancelled")
        await _handle_cancellation(job_id, state_machine)
        return {"job_id": job_id, "status": "cancelled"}

    except VideoJobError as e:
        logger.error(f"[BG-GEN] {job_id} - VideoJobError: {e.code.value} - {e.message}")
        return await _handle_error(job, e, state_machine, custom_api_key)

    except Exception as e:
        logger.exception(f"[BG-GEN] {job_id} - Unexpected error: {type(e).__name__}: {str(e)}")
        video_error = classify_exception(e)
        return await _handle_error(job, video_error, state_machine, custom_api_key)


def _get_api_key(job: JobDocument, custom_api_key: str | None = None) -> str:
    """Get API key for background generation.

    Priority:
    1. Custom API key passed through task queue
    2. Fallback to environment variable settings
    """
    if custom_api_key:
        return custom_api_key

    if not settings.gemini_api_key:
        raise VideoJobError.invalid_request("No Gemini API key configured")
    return settings.gemini_api_key


async def _stage_prepare(
    job: JobDocument,
    state_machine: JobStateMachine,
) -> list[bytes]:
    """Stage 1: Validate job and fetch reference images."""
    job_queue_service = get_job_queue_service()

    logger.info(f"[BG-GEN] {job.id} - Stage 1: PREPARING (validation + reference fetch)")

    state_machine.transition_to(JobStatus.PREPARING)
    await job_queue_service.update_job_status(job.id, JobStatus.PREPARING, progress=0.1)
    logger.debug(f"[BG-GEN] {job.id} - Status updated to PREPARING in Firestore")

    # Validate required fields
    if not job.bg_id:
        raise VideoJobError.invalid_request("Missing bg_id")
    if not job.bg_angle:
        raise VideoJobError.invalid_request("Missing bg_angle")
    if not job.prompt:
        raise VideoJobError.invalid_request("Missing prompt")

    # Fetch reference images if provided
    reference_images: list[bytes] = []
    if job.reference_urls:
        logger.info(f"[BG-GEN] {job.id} - Fetching {len(job.reference_urls)} reference images from S3")
        for i, url in enumerate(job.reference_urls):
            logger.debug(f"[BG-GEN] {job.id} - Fetching reference {i+1}/{len(job.reference_urls)}: {url}")
            try:
                img_bytes = await download_image(url)
                reference_images.append(img_bytes)
                logger.info(f"[BG-GEN] {job.id} - ✓ Fetched reference {i+1}: {len(img_bytes)} bytes")
            except Exception as e:
                logger.warning(f"[BG-GEN] {job.id} - ✗ Failed to fetch reference image {url}: {e}")
                # Continue without this reference
    else:
        logger.info(f"[BG-GEN] {job.id} - No reference images provided")

    await job_queue_service.update_job(job.id, progress=0.2)
    logger.info(f"[BG-GEN] {job.id} - Stage 1 complete: validation passed, {len(reference_images)} references loaded")
    return reference_images


async def _stage_generate(
    job: JobDocument,
    reference_images: list[bytes],
    api_key: str,
    state_machine: JobStateMachine,
) -> bytes:
    """Stage 2: Generate image using Gemini with optional reference images."""
    job_queue_service = get_job_queue_service()

    logger.info(f"[BG-GEN] {job.id} - Stage 2: GENERATING background with Gemini")

    state_machine.transition_to(JobStatus.GENERATING)
    await job_queue_service.update_job_status(job.id, JobStatus.GENERATING, progress=0.3)
    logger.debug(f"[BG-GEN] {job.id} - Status updated to GENERATING in Firestore")

    # Build request with reference images for style consistency
    request = ImageGenerateRequest(
        prompt=job.prompt,
        style_prompt=None,  # No style prompt for backgrounds
        reference_images=reference_images,  # Master reference for style consistency
        aspect_ratio=job.aspect_ratio,
    )
    logger.info(f"[BG-GEN] {job.id} - Request built: prompt_len={len(job.prompt)}, refs={len(reference_images)}, ratio={job.aspect_ratio}")

    # Validate
    validation_error = gemini_image_provider.validate_request(request)
    if validation_error:
        logger.error(f"[BG-GEN] {job.id} - Validation failed: {validation_error}")
        raise VideoJobError.invalid_request(validation_error)
    logger.debug(f"[BG-GEN] {job.id} - Request validation passed")

    # Generate image
    logger.info(f"[BG-GEN] {job.id} - Calling Gemini API...")
    try:
        image_bytes = await gemini_image_provider.generate_image(request, api_key)
        logger.info(f"[BG-GEN] {job.id} - Image generated successfully: {len(image_bytes)} bytes")
    except Exception as e:
        logger.error(f"[BG-GEN] {job.id} - Gemini API error: {type(e).__name__}: {str(e)}")
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

    logger.info(f"[BG-GEN] {job.id} - Stage 3: UPLOADING to S3")

    state_machine.transition_to(JobStatus.UPLOADING)
    await job_queue_service.update_job_status(job.id, JobStatus.UPLOADING, progress=0.8)
    logger.debug(f"[BG-GEN] {job.id} - Status updated to UPLOADING in Firestore")

    # Generate S3 filename for background
    # Format: mithril/{project_id}/backgrounds/{bg_id}/{angle}.png
    s3_file_name = generate_bg_filename(job.project_id, job.bg_id or "", job.bg_angle or "")
    logger.debug(f"[BG-GEN] {job.id} - Generated S3 filename: {s3_file_name}")

    # Upload to S3
    logger.info(f"[BG-GEN] {job.id} - Uploading {len(image_bytes)} bytes to S3...")
    try:
        image_url = await upload_image(image_bytes, s3_file_name, "image/png")
        logger.info(f"[BG-GEN] {job.id} - Uploaded to S3: {s3_file_name}")
        logger.debug(f"[BG-GEN] {job.id} - Image URL: {image_url}")
    except Exception as e:
        logger.error(f"[BG-GEN] {job.id} - S3 upload failed: {e}")
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
    bg_angle_service = get_bg_angle_service()

    logger.info(f"[BG-GEN] {job.id} - Stage 4: COMPLETING")

    state_machine.transition_to(JobStatus.COMPLETED)

    # Update job queue
    logger.debug(f"[BG-GEN] {job.id} - Updating job_queue status to COMPLETED")
    await job_queue_service.update_job_status(
        job.id,
        JobStatus.COMPLETED,
        image_url=result["image_url"],
        s3_file_name=result["s3_file_name"],
        progress=1.0,
    )
    logger.info(f"[BG-GEN] {job.id} - Job queue updated")

    # Update background angle in project Firestore
    if job.bg_id and job.bg_angle:
        logger.debug(f"[BG-GEN] {job.id} - Updating background angle in project/{job.project_id}/bgSheet/backgrounds/{job.bg_id}")
        await bg_angle_service.update_angle_status(
            project_id=job.project_id,
            bg_id=job.bg_id,
            angle=job.bg_angle,
            status="completed",
            imageRef=result["image_url"],
            s3FileName=result["s3_file_name"],
            jobId=job.id,
        )
        logger.info(f"[BG-GEN] {job.id} - Background angle updated")
    else:
        logger.warning(f"[BG-GEN] {job.id} - No bg_id/bg_angle, skipping angle update")


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
    from app.workers.tasks import retry_failed_bg_job

    job_queue_service = get_job_queue_service()
    bg_angle_service = get_bg_angle_service()

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

        # Update background angle status to show error
        if job.bg_id and job.bg_angle:
            await bg_angle_service.update_angle_status(
                project_id=job.project_id,
                bg_id=job.bg_id,
                angle=job.bg_angle,
                status="retrying",
                error=f"{error.message} (retrying {retry_state.retry_count}/{retry_state.max_retries})",
            )

        # Queue retry task with delay and API key
        await retry_failed_bg_job.kiq(job.id, delay, custom_api_key)

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

        # Update background angle status
        if job.bg_id and job.bg_angle:
            await bg_angle_service.update_angle_status(
                project_id=job.project_id,
                bg_id=job.bg_id,
                angle=job.bg_angle,
                status="failed",
                error=error.message,
            )

        return {
            "job_id": job.id,
            "status": "failed",
            "error_code": error.code.value,
            "error_message": error.message,
            "moved_to_dlq": True,
        }
