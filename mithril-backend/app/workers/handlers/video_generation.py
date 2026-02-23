"""Video generation task handler."""

import asyncio
import logging
from datetime import datetime, timezone

from app.config import get_settings
from app.core.errors import (
    ErrorCode,
    VideoJobError,
    classify_exception,
)
from app.core.retry import RetryState, get_retry_config
from app.core.state_machine import JobStateMachine
from app.models.job import JobDocument, JobStatus
from app.models.provider import VideoSubmitRequest
from app.providers import get_provider
from app.services.firestore import get_job_queue_service, get_video_clip_service
from app.services.s3 import generate_video_filename, upload_video

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
        logger.info(f"Cancellation detected for job {job_id}")
        raise CancellationRequested(f"Job {job_id} was cancelled by user")


async def process_video_generation(
    job_id: str,
    worker_id: str = "worker-1",
    custom_api_key: str | None = None,
) -> dict:
    """
    Main video generation pipeline.

    Pipeline stages:
    1. PENDING → SUBMITTED: Validate and submit to provider
    2. SUBMITTED → POLLING: Poll provider for completion
    3. POLLING → UPLOADING: Download video from provider
    4. UPLOADING → COMPLETED: Upload to S3 and update Firestore

    Args:
        job_id: The job ID to process
        worker_id: ID of the worker processing this job
        custom_api_key: Optional custom API key (passed through task queue)

    Returns:
        dict with status and result information
    """
    # Get services (lazy initialization)
    job_queue_service = get_job_queue_service()

    logger.info(f"[{worker_id}] Starting video generation for job {job_id}")

    # Fetch job from Firestore
    job = await job_queue_service.get_job(job_id)
    if not job:
        logger.error(f"Job {job_id} not found")
        return {"job_id": job_id, "status": "error", "error": "Job not found"}

    # Initialize state machine
    state_machine = JobStateMachine(job_id, job.status)

    # Mark job as being processed by this worker
    await job_queue_service.update_job(job_id, worker_id=worker_id)

    try:
        # === CHECKPOINT 1: Before submitting to provider ===
        await check_cancellation(job_id)

        # Get provider
        provider = get_provider(job.provider_id)
        if not provider:
            raise VideoJobError.invalid_request(f"Unknown provider: {job.provider_id}")

        # Get API key (custom key from task queue, or fallback to settings)
        api_key = _get_api_key(job, custom_api_key)

        # === Stage 1: Submit to provider ===
        result = await _stage_submit(job, provider, api_key, state_machine)
        provider_job_id = result["provider_job_id"]

        # === CHECKPOINT 2: Before polling ===
        await check_cancellation(job_id)

        # === Stage 2: Poll for completion ===
        await _stage_poll(job_id, provider, provider_job_id, api_key, state_machine)

        # === CHECKPOINT 3: Before download/upload ===
        await check_cancellation(job_id)

        # === Stage 3: Download and upload ===
        result = await _stage_upload(
            job, provider, provider_job_id, api_key, state_machine
        )

        # === Stage 4: Update Firestore and complete ===
        await _stage_complete(job, result, state_machine)

        logger.info(f"[{worker_id}] Job {job_id} completed successfully")
        return {
            "job_id": job_id,
            "status": "completed",
            "video_url": result["video_url"],
            "s3_file_name": result["s3_file_name"],
        }

    except CancellationRequested:
        await _handle_cancellation(job_id, state_machine)
        return {"job_id": job_id, "status": "cancelled"}

    except VideoJobError as e:
        return await _handle_error(job, e, state_machine, custom_api_key)

    except Exception as e:
        logger.exception(f"Unexpected error processing job {job_id}")
        video_error = classify_exception(e)
        return await _handle_error(job, video_error, state_machine, custom_api_key)


def _get_api_key(job: JobDocument, custom_api_key: str | None = None) -> str:
    """Get API key for the job's provider.

    Priority:
    1. Custom API key passed through task queue
    2. Fallback to environment variable settings
    """
    # Use custom API key if provided
    if custom_api_key:
        return custom_api_key

    # Fall back to settings
    if job.provider_id == "sora":
        if not settings.sora_api_key:
            raise VideoJobError.invalid_request("No Sora API key configured")
        return settings.sora_api_key
    elif job.provider_id == "veo3":
        if not settings.gemini_api_key:
            raise VideoJobError.invalid_request("No Gemini API key configured")
        return settings.gemini_api_key
    elif job.provider_id == "grok_i2v":
        if not settings.modelslab_api_key:
            raise VideoJobError.invalid_request("No ModelsLab API key configured")
        return settings.modelslab_api_key
    else:
        raise VideoJobError.invalid_request(f"Unknown provider: {job.provider_id}")


async def _stage_submit(
    job: JobDocument,
    provider,
    api_key: str,
    state_machine: JobStateMachine,
) -> dict:
    """Stage 1: Submit job to provider."""
    job_queue_service = get_job_queue_service()

    logger.info(f"[{job.id}] Stage 1: Submitting to {provider.id}")

    # Build request
    request = VideoSubmitRequest(
        prompt=job.prompt,
        image_url=job.image_url,
        image_end_url=job.image_end_url,
        duration=job.duration,
        aspect_ratio=job.aspect_ratio,
    )

    # Validate
    validation_error = provider.validate_request(request)
    if validation_error:
        raise VideoJobError.invalid_request(validation_error)

    # Submit to provider
    try:
        result = await provider.submit_job(request, api_key)
    except Exception as e:
        raise classify_exception(e)

    # Update state
    state_machine.transition_to(JobStatus.SUBMITTED)
    await job_queue_service.update_job_status(
        job.id,
        JobStatus.SUBMITTED,
        provider_job_id=result.job_id,
    )

    logger.info(f"[{job.id}] Submitted to provider, job_id: {result.job_id}")
    return {"provider_job_id": result.job_id}


async def _stage_poll(
    job_id: str,
    provider,
    provider_job_id: str,
    api_key: str,
    state_machine: JobStateMachine,
) -> None:
    """Stage 2: Poll provider for completion."""
    job_queue_service = get_job_queue_service()

    logger.info(f"[{job_id}] Stage 2: Polling for completion")

    state_machine.transition_to(JobStatus.POLLING)
    await job_queue_service.update_job_status(job_id, JobStatus.POLLING)

    constraints = provider.get_constraints()
    poll_interval = constraints.polling.interval_ms / 1000  # Convert to seconds
    max_attempts = constraints.polling.max_attempts

    for attempt in range(max_attempts):
        # Check for cancellation periodically
        if attempt > 0 and attempt % 5 == 0:
            await check_cancellation(job_id)

        # Check status
        try:
            status_result = await provider.check_status(provider_job_id, api_key)
        except Exception as e:
            raise classify_exception(e)

        logger.debug(
            f"[{job_id}] Poll {attempt + 1}/{max_attempts}: {status_result.status}"
        )

        # Update progress
        progress = min(0.1 + (attempt / max_attempts) * 0.6, 0.7)
        await job_queue_service.update_job(job_id, progress=progress)

        if status_result.status == "completed":
            logger.info(f"[{job_id}] Provider job completed")
            return

        if status_result.status == "failed":
            raise VideoJobError.provider_error(
                status_result.error or "Provider job failed"
            )

        # Wait before next poll
        await asyncio.sleep(poll_interval)

    # Max attempts reached
    raise VideoJobError.timeout(
        f"Polling timed out after {max_attempts} attempts"
    )


async def _stage_upload(
    job: JobDocument,
    provider,
    provider_job_id: str,
    api_key: str,
    state_machine: JobStateMachine,
) -> dict:
    """Stage 3: Download from provider and upload to S3."""
    job_queue_service = get_job_queue_service()

    logger.info(f"[{job.id}] Stage 3: Downloading and uploading")

    state_machine.transition_to(JobStatus.UPLOADING)
    await job_queue_service.update_job_status(job.id, JobStatus.UPLOADING, progress=0.8)

    # Download video from provider
    try:
        video_bytes = await provider.download_video(provider_job_id, api_key)
    except Exception as e:
        raise classify_exception(e)

    logger.info(f"[{job.id}] Downloaded video: {len(video_bytes)} bytes")

    # Generate S3 filename
    s3_file_name = generate_video_filename(job.provider_id, provider_job_id)

    # Upload to S3
    try:
        video_url = await upload_video(video_bytes, s3_file_name)
    except Exception as e:
        raise VideoJobError.internal(f"S3 upload failed: {e}")

    logger.info(f"[{job.id}] Uploaded to S3: {s3_file_name}")

    return {
        "video_url": video_url,
        "s3_file_name": s3_file_name,
    }


async def _stage_complete(
    job: JobDocument,
    result: dict,
    state_machine: JobStateMachine,
) -> None:
    """Stage 4: Update Firestore and mark complete."""
    job_queue_service = get_job_queue_service()
    video_clip_service = get_video_clip_service()

    logger.info(f"[{job.id}] Stage 4: Completing")

    state_machine.transition_to(JobStatus.COMPLETED)

    # Update job queue
    await job_queue_service.update_job_status(
        job.id,
        JobStatus.COMPLETED,
        video_url=result["video_url"],
        s3_file_name=result["s3_file_name"],
        progress=1.0,
    )

    # Update video clip in project Firestore (error="" clears previous errors)
    await video_clip_service.update_clip_status(
        project_id=job.project_id,
        scene_index=job.scene_index,
        clip_index=job.clip_index,
        status="completed",
        videoRef=result["video_url"],
        s3FileName=result["s3_file_name"],
        jobId=job.id,
        providerId=job.provider_id,
        error="",
    )


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
    from app.workers.tasks import retry_failed_job

    job_queue_service = get_job_queue_service()
    video_clip_service = get_video_clip_service()

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

        # Update video clip status to show error (so frontend can see it)
        await video_clip_service.update_clip_status(
            project_id=job.project_id,
            scene_index=job.scene_index,
            clip_index=job.clip_index,
            status="failed",
            error=f"{error.message} (retrying {retry_state.retry_count}/{retry_state.max_retries})",
        )

        # Queue retry task with delay and API key
        await retry_failed_job.kiq(job.id, delay, custom_api_key)

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

        # Update video clip status
        await video_clip_service.update_clip_status(
            project_id=job.project_id,
            scene_index=job.scene_index,
            clip_index=job.clip_index,
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