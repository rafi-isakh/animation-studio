"""Background job management API endpoints."""

import logging
import uuid
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status

from app.api.deps import AuthenticatedUser
from app.models.job import (
    BgBatchSubmitRequest,
    BgBatchSubmitResponse,
    BgJobStatusResponse,
    BgJobSubmitRequest,
    JobDocument,
    JobError,
    JobStatus,
    JobSubmitResponse,
    JobType,
)
from app.services.firestore import get_job_queue_service
from app.workers.tasks import process_bg_job

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/bg-jobs", tags=["bg-jobs"])


@router.post("/submit", response_model=JobSubmitResponse)
async def submit_bg_job(
    request: BgJobSubmitRequest,
    user: AuthenticatedUser,
) -> JobSubmitResponse:
    """
    Submit a single background angle generation job.

    The job will be queued for processing by background workers.
    Use the returned job_id to check status.
    """
    logger.info(f"[BG-API] ========== Received bg job submission ==========")
    logger.info(f"[BG-API] User: {user.uid}, Project: {request.project_id}")
    logger.info(f"[BG-API] BG: {request.bg_id}, Angle: {request.bg_angle}")
    logger.info(f"[BG-API] Name: {request.bg_name}")
    logger.info(f"[BG-API] Prompt: {request.prompt[:100]}...")
    logger.info(f"[BG-API] Aspect ratio: {request.aspect_ratio}")
    logger.info(f"[BG-API] Has custom API key: {bool(request.api_key)}")

    job_queue_service = get_job_queue_service()

    # Create job in Firestore
    logger.debug(f"[BG-API] Creating job in Firestore...")
    job = await job_queue_service.create_bg_job(request, user.uid)
    logger.info(f"[BG-API] Job created: {job.id}")

    # Queue for processing (pass API key through task queue, not stored in DB)
    logger.debug(f"[BG-API] Queuing job {job.id} for processing...")
    await process_bg_job.kiq(job.id, request.api_key)
    logger.info(f"[BG-API] Job {job.id} queued successfully")

    return JobSubmitResponse(
        job_id=job.id,
        status=job.status,
        created_at=job.created_at,
    )


@router.post("/submit-batch", response_model=BgBatchSubmitResponse)
async def submit_bg_batch(
    request: BgBatchSubmitRequest,
    user: AuthenticatedUser,
) -> BgBatchSubmitResponse:
    """
    Submit multiple background generation jobs as a batch.

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
        job = await job_queue_service.create_bg_job(job_request, user.uid, batch_id)

        # Queue for processing (pass API key through task queue)
        await process_bg_job.kiq(job.id, job_request.api_key)

        job_responses.append(
            JobSubmitResponse(
                job_id=job.id,
                status=job.status,
                created_at=job.created_at,
            )
        )

    logger.info(
        f"BG batch {batch_id} with {len(job_responses)} jobs submitted by user {user.uid}"
    )

    return BgBatchSubmitResponse(
        batch_id=batch_id,
        jobs=job_responses,
        total_count=len(job_responses),
    )


@router.get("/{job_id}/status", response_model=BgJobStatusResponse)
async def get_bg_job_status(
    job_id: str,
    user: AuthenticatedUser,
) -> BgJobStatusResponse:
    """
    Get the current status of a background job.

    Returns detailed status including progress, image URL (if completed),
    and error information (if failed).
    """
    job_queue_service = get_job_queue_service()

    job = await job_queue_service.get_job(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job {job_id} not found",
        )

    # Verify this is a background job
    if job.type != JobType.BACKGROUND:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Job {job_id} is not a background job",
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

    return BgJobStatusResponse(
        job_id=job.id,
        bg_id=job.bg_id or "",
        bg_angle=job.bg_angle or "",
        bg_name=job.bg_name or "",
        status=job.status,
        progress=job.progress,
        image_url=job.image_url,
        s3_file_name=job.s3_file_name,
        error=error,
        created_at=job.created_at,
        updated_at=job.updated_at,
        completed_at=job.completed_at,
    )


@router.post("/{job_id}/cancel")
async def cancel_bg_job(
    job_id: str,
    user: AuthenticatedUser,
) -> dict:
    """
    Request cancellation of a background job.

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

    # Verify this is a background job
    if job.type != JobType.BACKGROUND:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Job {job_id} is not a background job",
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

    logger.info(f"Cancellation requested for bg job {job_id} by user {user.uid}")

    return {
        "job_id": job_id,
        "message": "Cancellation requested",
        "previous_status": job.status.value,
    }


@router.get("/project/{project_id}", response_model=list[BgJobStatusResponse])
async def get_project_bg_jobs(
    project_id: str,
    user: AuthenticatedUser,
    status_filter: Annotated[list[str] | None, Query(alias="status")] = None,
    limit: int = Query(default=50, le=100),
) -> list[BgJobStatusResponse]:
    """
    Get all background jobs for a project.

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

    # Get jobs from Firestore (filter by type=background in the query)
    db = job_queue_service.db
    query = (
        db.collection(job_queue_service.COLLECTION)
        .where("project_id", "==", project_id)
        .where("type", "==", JobType.BACKGROUND.value)
    )

    if status_enums:
        status_values = [s.value for s in status_enums]
        query = query.where("status", "in", status_values)

    query = query.order_by("created_at", direction="DESCENDING")
    query = query.limit(limit)

    docs = await query.get()
    jobs = [JobDocument(**doc.to_dict()) for doc in docs]

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
            BgJobStatusResponse(
                job_id=job.id,
                bg_id=job.bg_id or "",
                bg_angle=job.bg_angle or "",
                bg_name=job.bg_name or "",
                status=job.status,
                progress=job.progress,
                image_url=job.image_url,
                s3_file_name=job.s3_file_name,
                error=error,
                created_at=job.created_at,
                updated_at=job.updated_at,
                completed_at=job.completed_at,
            )
        )

    return responses
