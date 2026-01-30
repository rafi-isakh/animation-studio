"""Taskiq task definitions."""

import logging
import socket

from app.workers.broker import broker

logger = logging.getLogger(__name__)


def get_worker_id() -> str:
    """Generate a unique worker ID."""
    hostname = socket.gethostname()
    return f"worker-{hostname}"


@broker.task
async def process_video_job(job_id: str, api_key: str | None = None) -> dict:
    """
    Main video generation task.

    This task handles the full lifecycle:
    1. Validate and prepare request
    2. Submit to provider (Sora/Veo3)
    3. Poll for completion
    4. Upload to S3
    5. Update Firestore

    Args:
        job_id: The job ID in Firestore job_queue collection
        api_key: Optional custom API key (passed through task queue, not stored)

    Returns:
        dict with status and result information
    """
    from app.workers.handlers.video_generation import process_video_generation

    worker_id = get_worker_id()
    logger.info(f"[{worker_id}] Processing video job: {job_id} (custom_key: {bool(api_key)})")

    try:
        result = await process_video_generation(job_id, worker_id, api_key)
        logger.info(f"[{worker_id}] Job {job_id} finished with status: {result.get('status')}")
        return result

    except Exception as e:
        logger.exception(f"[{worker_id}] Unhandled error in job {job_id}")
        return {
            "job_id": job_id,
            "status": "error",
            "error": str(e),
        }


@broker.task
async def retry_failed_job(
    job_id: str,
    delay_seconds: float = 0,
    api_key: str | None = None,
) -> dict:
    """
    Retry a failed job after a delay.

    Args:
        job_id: The job ID to retry
        delay_seconds: Delay before processing
        api_key: Optional API key (if not provided, uses settings fallback)

    Returns:
        dict with status and result information
    """
    import asyncio

    if delay_seconds > 0:
        logger.info(f"Waiting {delay_seconds}s before retrying job {job_id}")
        await asyncio.sleep(delay_seconds)

    return await process_video_job(job_id, api_key)


# ============================================================================
# Image Generation Tasks
# ============================================================================


@broker.task
async def process_image_job(job_id: str, api_key: str | None = None) -> dict:
    """
    Main image generation task.

    This task handles the full lifecycle:
    1. Fetch reference images from S3
    2. Call Gemini API to generate image
    3. Upload result to S3
    4. Update Firestore

    Args:
        job_id: The job ID in Firestore job_queue collection
        api_key: Optional custom API key (passed through task queue, not stored)

    Returns:
        dict with status and result information
    """
    from app.workers.handlers.image_generation import process_image_generation

    worker_id = get_worker_id()
    logger.info(f"[{worker_id}] Processing image job: {job_id} (custom_key: {bool(api_key)})")

    try:
        result = await process_image_generation(job_id, worker_id, api_key)
        logger.info(f"[{worker_id}] Image job {job_id} finished with status: {result.get('status')}")
        return result

    except Exception as e:
        logger.exception(f"[{worker_id}] Unhandled error in image job {job_id}")
        return {
            "job_id": job_id,
            "status": "error",
            "error": str(e),
        }


@broker.task
async def retry_failed_image_job(
    job_id: str,
    delay_seconds: float = 0,
    api_key: str | None = None,
) -> dict:
    """
    Retry a failed image job after a delay.

    Args:
        job_id: The job ID to retry
        delay_seconds: Delay before processing
        api_key: Optional API key (if not provided, uses settings fallback)

    Returns:
        dict with status and result information
    """
    import asyncio

    if delay_seconds > 0:
        logger.info(f"Waiting {delay_seconds}s before retrying image job {job_id}")
        await asyncio.sleep(delay_seconds)

    return await process_image_job(job_id, api_key)


# ============================================================================
# Background Generation Tasks
# ============================================================================


@broker.task
async def process_bg_job(job_id: str, api_key: str | None = None) -> dict:
    """
    Main background generation task.

    This task handles the full lifecycle:
    1. Validate job
    2. Call Gemini API to generate background image (text-only)
    3. Upload result to S3
    4. Update Firestore

    Args:
        job_id: The job ID in Firestore job_queue collection
        api_key: Optional custom API key (passed through task queue, not stored)

    Returns:
        dict with status and result information
    """
    from app.workers.handlers.bg_generation import process_bg_generation

    worker_id = get_worker_id()
    logger.info(f"[{worker_id}] Processing bg job: {job_id} (custom_key: {bool(api_key)})")

    try:
        result = await process_bg_generation(job_id, worker_id, api_key)
        logger.info(f"[{worker_id}] BG job {job_id} finished with status: {result.get('status')}")
        return result

    except Exception as e:
        logger.exception(f"[{worker_id}] Unhandled error in bg job {job_id}")
        return {
            "job_id": job_id,
            "status": "error",
            "error": str(e),
        }


@broker.task
async def retry_failed_bg_job(
    job_id: str,
    delay_seconds: float = 0,
    api_key: str | None = None,
) -> dict:
    """
    Retry a failed background job after a delay.

    Args:
        job_id: The job ID to retry
        delay_seconds: Delay before processing
        api_key: Optional API key (if not provided, uses settings fallback)

    Returns:
        dict with status and result information
    """
    import asyncio

    if delay_seconds > 0:
        logger.info(f"Waiting {delay_seconds}s before retrying bg job {job_id}")
        await asyncio.sleep(delay_seconds)

    return await process_bg_job(job_id, api_key)


# ============================================================================
# Maintenance Tasks
# ============================================================================


@broker.task
async def cleanup_stale_jobs() -> dict:
    """
    Periodic task to clean up stale jobs.

    Finds jobs stuck in active states for too long and moves them to failed/DLQ.
    """
    from datetime import datetime, timezone, timedelta
    from app.models.job import JobStatus
    from app.services.firestore import get_job_queue_service

    logger.info("Running stale job cleanup")

    # Define stale threshold (jobs stuck for more than 30 minutes)
    stale_threshold = datetime.now(timezone.utc) - timedelta(minutes=30)

    # This is a simplified implementation
    # In production, you'd query Firestore for stale jobs
    cleaned = 0

    logger.info(f"Stale job cleanup completed: {cleaned} jobs cleaned")
    return {"cleaned": cleaned}


@broker.task
async def process_dlq_job(dlq_id: str) -> dict:
    """
    Process a job from the dead letter queue.

    This allows manual retry of failed jobs.

    Args:
        dlq_id: The DLQ entry ID

    Returns:
        dict with status information
    """
    logger.info(f"Processing DLQ entry: {dlq_id}")

    # TODO: Implement DLQ processing
    # 1. Fetch DLQ entry
    # 2. Recreate job in job_queue
    # 3. Process the job
    # 4. Update DLQ entry status

    return {"dlq_id": dlq_id, "status": "not_implemented"}