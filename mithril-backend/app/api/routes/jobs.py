"""Job management API endpoints."""

import logging
import uuid
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status

from app.api.deps import AuthenticatedUser
from app.models.job import (
    BatchSubmitRequest,
    BatchSubmitResponse,
    JobDocument,
    JobError,
    JobStatus,
    JobStatusResponse,
    JobSubmitRequest,
    JobSubmitResponse,
)
from app.services.firestore import get_job_queue_service
from app.workers.tasks import process_video_job

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.post("/submit", response_model=JobSubmitResponse)
async def submit_job(
    request: JobSubmitRequest,
    user: AuthenticatedUser,
) -> JobSubmitResponse:
    """
    Submit a single video generation job.

    The job will be queued for processing by background workers.
    Use the returned job_id to check status.
    """
    job_queue_service = get_job_queue_service()

    # Create job in Firestore
    job = await job_queue_service.create_job(request, user.uid)

    logger.info(f"Job {job.id} submitted by user {user.uid}")

    # Queue for processing
    await process_video_job.kiq(job.id)

    return JobSubmitResponse(
        job_id=job.id,
        status=job.status,
        created_at=job.created_at,
    )


@router.post("/submit-batch", response_model=BatchSubmitResponse)
async def submit_batch(
    request: BatchSubmitRequest,
    user: AuthenticatedUser,
) -> BatchSubmitResponse:
    """
    Submit multiple video generation jobs as a batch.

    All jobs in the batch share a batch_id for tracking.
    Jobs are processed in parallel by available workers.
    """
    job_queue_service = get_job_queue_service()

    batch_id = str(uuid.uuid4())
    job_responses: list[JobSubmitResponse] = []

    # Apply batch-level API key if individual jobs don't have one
    for job_request in request.jobs:
        if not job_request.api_key and request.api_key:
            job_request.api_key = request.api_key

        # Override project_id from batch request
        job_request.project_id = request.project_id

        # Create job in Firestore
        job = await job_queue_service.create_job(job_request, user.uid, batch_id)

        # Queue for processing
        await process_video_job.kiq(job.id)

        job_responses.append(
            JobSubmitResponse(
                job_id=job.id,
                status=job.status,
                created_at=job.created_at,
            )
        )

    logger.info(f"Batch {batch_id} with {len(job_responses)} jobs submitted by user {user.uid}")

    return BatchSubmitResponse(
        batch_id=batch_id,
        jobs=job_responses,
        total_count=len(job_responses),
    )


@router.get("/{job_id}/status", response_model=JobStatusResponse)
async def get_job_status(
    job_id: str,
    user: AuthenticatedUser,
) -> JobStatusResponse:
    """
    Get the current status of a job.

    Returns detailed status including progress, video URL (if completed),
    and error information (if failed).
    """
    job_queue_service = get_job_queue_service()

    job = await job_queue_service.get_job(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job {job_id} not found",
        )

    # Verify user owns this job
    if job.user_id != user.uid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this job",
        )

    # Build error object if job has error
    error = None
    if job.error_code:
        error = JobError(
            code=job.error_code,
            message=job.error_message or "Unknown error",
            retryable=job.error_retryable or False,
        )

    return JobStatusResponse(
        job_id=job.id,
        status=job.status,
        progress=job.progress,
        provider_job_id=job.provider_job_id,
        video_url=job.video_url,
        s3_file_name=job.s3_file_name,
        error=error,
        created_at=job.created_at,
        updated_at=job.updated_at,
        completed_at=job.completed_at,
    )


@router.post("/{job_id}/cancel")
async def cancel_job(
    job_id: str,
    user: AuthenticatedUser,
) -> dict:
    """
    Request cancellation of a job.

    The job will be cancelled at the next checkpoint if still in progress.
    Jobs that have already completed or failed cannot be cancelled.
    """
    job_queue_service = get_job_queue_service()

    job = await job_queue_service.get_job(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job {job_id} not found",
        )

    # Verify user owns this job
    if job.user_id != user.uid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this job",
        )

    # Request cancellation
    cancelled = await job_queue_service.mark_cancellation_requested(job_id)

    if not cancelled:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Job {job_id} cannot be cancelled (status: {job.status.value})",
        )

    logger.info(f"Cancellation requested for job {job_id} by user {user.uid}")

    return {
        "job_id": job_id,
        "message": "Cancellation requested",
        "previous_status": job.status.value,
    }


@router.get("/project/{project_id}", response_model=list[JobStatusResponse])
async def get_project_jobs(
    project_id: str,
    user: AuthenticatedUser,
    status_filter: Annotated[list[str] | None, Query(alias="status")] = None,
    limit: int = Query(default=50, le=100),
) -> list[JobStatusResponse]:
    """
    Get all jobs for a project.

    Optionally filter by status (e.g., ?status=pending&status=completed).
    """
    job_queue_service = get_job_queue_service()

    # Convert status strings to enum
    status_enums = None
    if status_filter:
        try:
            status_enums = [JobStatus(s) for s in status_filter]
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status filter: {e}",
            )

    jobs = await job_queue_service.get_project_jobs(
        project_id=project_id,
        status_filter=status_enums,
        limit=limit,
    )

    # Filter to only jobs owned by this user
    user_jobs = [j for j in jobs if j.user_id == user.uid]

    responses = []
    for job in user_jobs:
        error = None
        if job.error_code:
            error = JobError(
                code=job.error_code,
                message=job.error_message or "Unknown error",
                retryable=job.error_retryable or False,
            )

        responses.append(
            JobStatusResponse(
                job_id=job.id,
                status=job.status,
                progress=job.progress,
                provider_job_id=job.provider_job_id,
                video_url=job.video_url,
                s3_file_name=job.s3_file_name,
                error=error,
                created_at=job.created_at,
                updated_at=job.updated_at,
                completed_at=job.completed_at,
            )
        )

    return responses


@router.post("/batch/{batch_id}/retry-failed")
async def retry_failed_batch_jobs(
    batch_id: str,
    user: AuthenticatedUser,
) -> dict:
    """
    Retry all failed jobs in a batch.

    Only jobs that failed with retryable errors and haven't exceeded
    max retries will be requeued.
    """
    job_queue_service = get_job_queue_service()

    # Get all jobs in this batch
    # Note: This requires a Firestore query by batch_id
    # For now, we'll implement a basic version
    db = job_queue_service.db
    query = (
        db.collection(job_queue_service.COLLECTION)
        .where("batch_id", "==", batch_id)
        .where("status", "==", JobStatus.FAILED.value)
    )
    docs = await query.get()

    retried_jobs = []
    skipped_jobs = []

    for doc in docs:
        job = JobDocument(**doc.to_dict())

        # Verify user owns this job
        if job.user_id != user.uid:
            continue

        # Check if retry is possible
        if job.retry_count >= job.max_retries:
            skipped_jobs.append(job.id)
            continue

        if not job.error_retryable:
            skipped_jobs.append(job.id)
            continue

        # Reset job for retry
        await job_queue_service.update_job(
            job.id,
            status=JobStatus.PENDING.value,
            error_code=None,
            error_message=None,
            error_retryable=None,
        )

        # Requeue
        await process_video_job.kiq(job.id)
        retried_jobs.append(job.id)

    logger.info(f"Batch {batch_id} retry: {len(retried_jobs)} retried, {len(skipped_jobs)} skipped")

    return {
        "batch_id": batch_id,
        "retried_count": len(retried_jobs),
        "retried_jobs": retried_jobs,
        "skipped_count": len(skipped_jobs),
        "skipped_jobs": skipped_jobs,
    }