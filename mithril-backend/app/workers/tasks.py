"""Taskiq task definitions."""

import logging

from app.workers.broker import broker

logger = logging.getLogger(__name__)


@broker.task
async def process_video_job(job_id: str) -> dict:
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

    Returns:
        dict with status and result information
    """
    logger.info(f"Processing video job: {job_id}")

    # TODO: Implement full video generation pipeline
    # 1. Fetch job from Firestore
    # 2. Check for cancellation
    # 3. Submit to provider
    # 4. Poll status with checkpoints
    # 5. Download and upload to S3
    # 6. Update Firestore with result

    return {"job_id": job_id, "status": "completed"}


@broker.task
async def cleanup_stale_jobs() -> dict:
    """
    Periodic task to clean up stale jobs.

    Moves jobs stuck in processing state to failed/DLQ.
    """
    logger.info("Running stale job cleanup")

    # TODO: Implement cleanup logic

    return {"cleaned": 0}