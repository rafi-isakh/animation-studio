"""Prop design sheet generation task handler."""

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
from app.services.firestore import get_job_queue_service, get_prop_design_sheet_service
from app.services.s3 import download_image, generate_prop_design_sheet_filename, upload_image

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
        logger.info(f"Cancellation detected for prop design sheet job {job_id}")
        raise CancellationRequested(f"Job {job_id} was cancelled by user")


async def process_prop_design_sheet_generation(
    job_id: str,
    worker_id: str = "worker-1",
    custom_api_key: str | None = None,
) -> dict:
    """
    Main prop design sheet generation pipeline.

    Pipeline stages:
    1. PENDING -> PREPARING: Fetch reference images from S3
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

    logger.info(f"[{worker_id}] ========== Starting prop design sheet generation for job {job_id} ==========")

    # Fetch job from Firestore
    job = await job_queue_service.get_job(job_id)
    if not job:
        logger.error(f"[PROP-GEN] Job {job_id} not found in Firestore")
        return {"job_id": job_id, "status": "error", "error": "Job not found"}

    logger.info(f"[PROP-GEN] Job {job_id} loaded: type={job.type}, project={job.project_id}, prop={job.prop_id}, status={job.status}")
    logger.info(f"[PROP-GEN] Prop name: {job.prop_name}, Category: {job.prop_category}")
    logger.info(f"[PROP-GEN] Prompt: {job.prompt[:100]}...")
    logger.info(f"[PROP-GEN] Reference URLs: {len(job.reference_urls or [])} images")
    logger.info(f"[PROP-GEN] Aspect ratio: {job.aspect_ratio}")

    # Initialize state machine
    state_machine = JobStateMachine(job_id, job.status)

    # Mark job as being processed by this worker
    await job_queue_service.update_job(job_id, worker_id=worker_id)

    # Update prop status to generating
    prop_design_sheet_service = get_prop_design_sheet_service()
    if job.prop_id:
        await prop_design_sheet_service.update_prop_design_sheet(
            project_id=job.project_id,
            prop_id=job.prop_id,
            status="generating",
            jobId=job_id,
        )

    try:
        # === CHECKPOINT 1: Before preparing ===
        await check_cancellation(job_id)

        # Get API key
        api_key = _get_api_key(job, custom_api_key)

        # === Stage 1: Prepare - fetch reference images ===
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

        logger.info(f"[PROP-GEN] {job_id} ========== JOB COMPLETED SUCCESSFULLY ==========")
        logger.info(f"[PROP-GEN] {job_id} - Image URL: {result['image_url']}")
        logger.info(f"[PROP-GEN] {job_id} - S3 File: {result['s3_file_name']}")
        return {
            "job_id": job_id,
            "status": "completed",
            "image_url": result["image_url"],
            "s3_file_name": result["s3_file_name"],
        }

    except CancellationRequested:
        logger.warning(f"[PROP-GEN] {job_id} - Job was cancelled")
        await _handle_cancellation(job_id, job, state_machine)
        return {"job_id": job_id, "status": "cancelled"}

    except VideoJobError as e:
        logger.error(f"[PROP-GEN] {job_id} - VideoJobError: {e.code.value} - {e.message}")
        return await _handle_error(job, e, state_machine, custom_api_key)

    except Exception as e:
        logger.exception(f"[PROP-GEN] {job_id} - Unexpected error: {type(e).__name__}: {str(e)}")
        video_error = classify_exception(e)
        return await _handle_error(job, video_error, state_machine, custom_api_key)


def _get_api_key(job: JobDocument, custom_api_key: str | None = None) -> str:
    """Get API key for image generation.

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
    """Stage 1: Fetch reference images from S3."""
    job_queue_service = get_job_queue_service()

    logger.info(f"[PROP-GEN] {job.id} - Stage 1: PREPARING (fetching reference images)")

    state_machine.transition_to(JobStatus.PREPARING)
    await job_queue_service.update_job_status(job.id, JobStatus.PREPARING, progress=0.1)
    logger.debug(f"[PROP-GEN] {job.id} - Status updated to PREPARING in Firestore")

    reference_images: list[bytes] = []

    if job.reference_urls:
        logger.info(f"[PROP-GEN] {job.id} - Fetching {len(job.reference_urls)} reference images from S3")
        for i, url in enumerate(job.reference_urls):
            logger.debug(f"[PROP-GEN] {job.id} - Fetching reference {i+1}/{len(job.reference_urls)}: {url}")
            try:
                img_bytes = await download_image(url)
                reference_images.append(img_bytes)
                logger.info(f"[PROP-GEN] {job.id} - ✓ Fetched reference {i+1}: {len(img_bytes)} bytes")
            except Exception as e:
                logger.warning(f"[PROP-GEN] {job.id} - ✗ Failed to fetch reference image {url}: {e}")
                # Continue without this reference
    else:
        logger.info(f"[PROP-GEN] {job.id} - No reference images to fetch")

    await job_queue_service.update_job(job.id, progress=0.2)
    logger.info(f"[PROP-GEN] {job.id} - Stage 1 complete: {len(reference_images)} references loaded")
    return reference_images


async def _stage_generate(
    job: JobDocument,
    reference_images: list[bytes],
    api_key: str,
    state_machine: JobStateMachine,
) -> bytes:
    """Stage 2: Generate image using Gemini."""
    job_queue_service = get_job_queue_service()

    logger.info(f"[PROP-GEN] {job.id} - Stage 2: GENERATING design sheet with Gemini")

    state_machine.transition_to(JobStatus.GENERATING)
    await job_queue_service.update_job_status(job.id, JobStatus.GENERATING, progress=0.3)
    logger.debug(f"[PROP-GEN] {job.id} - Status updated to GENERATING in Firestore")

    # Build request - no style prompt for design sheets, use full prompt
    request = ImageGenerateRequest(
        prompt=job.prompt,
        style_prompt=None,  # Design sheet prompts include style
        reference_images=reference_images,
        aspect_ratio=job.aspect_ratio,
    )
    logger.info(f"[PROP-GEN] {job.id} - Request built: prompt_len={len(job.prompt)}, refs={len(reference_images)}, ratio={job.aspect_ratio}")

    # Validate
    validation_error = gemini_image_provider.validate_request(request)
    if validation_error:
        logger.error(f"[PROP-GEN] {job.id} - Validation failed: {validation_error}")
        raise VideoJobError.invalid_request(validation_error)
    logger.debug(f"[PROP-GEN] {job.id} - Request validation passed")

    # Generate image
    logger.info(f"[PROP-GEN] {job.id} - Calling Gemini API...")
    try:
        image_bytes = await gemini_image_provider.generate_image(request, api_key)
        logger.info(f"[PROP-GEN] {job.id} - ✓ Design sheet generated successfully: {len(image_bytes)} bytes")
    except Exception as e:
        logger.error(f"[PROP-GEN] {job.id} - ✗ Gemini API error: {type(e).__name__}: {str(e)}")
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

    logger.info(f"[PROP-GEN] {job.id} - Stage 3: UPLOADING to S3")

    state_machine.transition_to(JobStatus.UPLOADING)
    await job_queue_service.update_job_status(job.id, JobStatus.UPLOADING, progress=0.8)
    logger.debug(f"[PROP-GEN] {job.id} - Status updated to UPLOADING in Firestore")

    # Generate S3 filename
    s3_file_name = generate_prop_design_sheet_filename(job.project_id, job.prop_id or job.id)
    logger.debug(f"[PROP-GEN] {job.id} - Generated S3 filename: {s3_file_name}")

    # Upload to S3
    logger.info(f"[PROP-GEN] {job.id} - Uploading {len(image_bytes)} bytes to S3...")
    try:
        image_url = await upload_image(image_bytes, s3_file_name, "image/png")
        logger.info(f"[PROP-GEN] {job.id} - ✓ Uploaded to S3: {s3_file_name}")
        logger.debug(f"[PROP-GEN] {job.id} - Image URL: {image_url}")
    except Exception as e:
        logger.error(f"[PROP-GEN] {job.id} - ✗ S3 upload failed: {e}")
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
    prop_design_sheet_service = get_prop_design_sheet_service()

    logger.info(f"[PROP-GEN] {job.id} - Stage 4: COMPLETING")

    state_machine.transition_to(JobStatus.COMPLETED)

    # Update job queue
    logger.debug(f"[PROP-GEN] {job.id} - Updating job_queue status to COMPLETED")
    await job_queue_service.update_job_status(
        job.id,
        JobStatus.COMPLETED,
        image_url=result["image_url"],
        s3_file_name=result["s3_file_name"],
        progress=1.0,
    )
    logger.info(f"[PROP-GEN] {job.id} - ✓ Job queue updated")

    # Update prop design sheet in project Firestore
    if job.prop_id:
        logger.debug(f"[PROP-GEN] {job.id} - Updating prop design sheet in project/{job.project_id}/mithril/propDesignerResult")
        await prop_design_sheet_service.update_prop_design_sheet(
            project_id=job.project_id,
            prop_id=job.prop_id,
            status="completed",
            designSheetImageRef=result["image_url"],
            designSheetPrompt=job.prompt,
            s3FileName=result["s3_file_name"],
            jobId=job.id,
            error=None,  # Clear any previous errors
        )
        logger.info(f"[PROP-GEN] {job.id} - ✓ Prop design sheet updated")
    else:
        logger.warning(f"[PROP-GEN] {job.id} - No prop_id, skipping prop update")


async def _handle_cancellation(
    job_id: str,
    job: JobDocument,
    state_machine: JobStateMachine,
) -> None:
    """Handle job cancellation."""
    job_queue_service = get_job_queue_service()
    prop_design_sheet_service = get_prop_design_sheet_service()

    logger.info(f"[{job_id}] Handling cancellation")

    state_machine.transition_to(JobStatus.CANCELLED)
    await job_queue_service.update_job_status(
        job_id,
        JobStatus.CANCELLED,
        cancelled_at=datetime.now(timezone.utc).isoformat(),
    )

    # Update prop status
    if job.prop_id:
        await prop_design_sheet_service.update_prop_design_sheet(
            project_id=job.project_id,
            prop_id=job.prop_id,
            status="failed",
            error="Cancelled by user",
        )


async def _handle_error(
    job: JobDocument,
    error: VideoJobError,
    state_machine: JobStateMachine,
    custom_api_key: str | None = None,
) -> dict:
    """Handle job error with potential retry."""
    from app.workers.tasks import retry_failed_prop_design_sheet_job

    job_queue_service = get_job_queue_service()
    prop_design_sheet_service = get_prop_design_sheet_service()

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

        # Update prop status to show error (but still generating for retry)
        if job.prop_id:
            await prop_design_sheet_service.update_prop_design_sheet(
                project_id=job.project_id,
                prop_id=job.prop_id,
                status="generating",
                error=f"{error.message} (retrying {retry_state.retry_count}/{retry_state.max_retries})",
            )

        # Queue retry task with delay and API key
        await retry_failed_prop_design_sheet_job.kiq(job.id, delay, custom_api_key)

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

        # Update prop status
        if job.prop_id:
            await prop_design_sheet_service.update_prop_design_sheet(
                project_id=job.project_id,
                prop_id=job.prop_id,
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
