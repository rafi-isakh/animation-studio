"""Story Splitter job management API endpoints."""

import logging
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status

from app.api.deps import AuthenticatedUser
from app.models.job import (
    JobDocument,
    JobError,
    JobStatus,
    JobSubmitResponse,
    JobType,
    StorySplitterJobSubmitRequest,
    StorySplitterJobStatusResponse,
    StorySplitterPart,
)
from app.services.firestore import get_job_queue_service, get_story_splits_service
from app.workers.tasks import process_story_splitter_job

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/story-splitter-jobs", tags=["story-splitter-jobs"])


@router.post("/submit", response_model=JobSubmitResponse)
async def submit_story_splitter_job(
    request: StorySplitterJobSubmitRequest,
    user: AuthenticatedUser,
) -> JobSubmitResponse:
    """
    Submit a story splitter job.

    Splits the provided story text into multiple parts with cliffhanger analysis.
    The job will be queued for processing by background workers.
    """
    logger.info(f"[STORY-SPLITTER-API] ========== Received story splitter job ==========")
    logger.info(f"[STORY-SPLITTER-API] User: {user.uid}, Project: {request.project_id}")
    logger.info(f"[STORY-SPLITTER-API] Text length: {len(request.text)} chars")
    logger.info(f"[STORY-SPLITTER-API] Num parts: {request.num_parts}")
    logger.info(f"[STORY-SPLITTER-API] Has guidelines: {bool(request.guidelines)}")
    logger.info(f"[STORY-SPLITTER-API] Has custom API key: {bool(request.api_key)}")

    job_queue_service = get_job_queue_service()

    # Create job in Firestore
    logger.debug(f"[STORY-SPLITTER-API] Creating story splitter job in Firestore...")
    job = await job_queue_service.create_story_splitter_job(request, user.uid)
    logger.info(f"[STORY-SPLITTER-API] Job created: {job.id}")

    # Queue for processing (pass API key through task queue, not stored in DB)
    logger.debug(f"[STORY-SPLITTER-API] Queuing job {job.id} for processing...")
    await process_story_splitter_job.kiq(job.id, request.api_key)
    logger.info(f"[STORY-SPLITTER-API] Job {job.id} queued successfully")

    return JobSubmitResponse(
        job_id=job.id,
        status=job.status,
        created_at=job.created_at,
    )


@router.get("/{job_id}/status", response_model=StorySplitterJobStatusResponse)
async def get_story_splitter_job_status(
    job_id: str,
    user: AuthenticatedUser,
) -> StorySplitterJobStatusResponse:
    """
    Get the current status of a story splitter job.

    Returns detailed status including progress, split parts,
    and error information (if failed).
    """
    job_queue_service = get_job_queue_service()

    job = await job_queue_service.get_job(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job {job_id} not found",
        )

    # Verify this is a story splitter job
    if job.type != JobType.STORY_SPLITTER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Job {job_id} is not a story splitter job",
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

    # Read parts from storySplits document (not job_queue, to avoid 1MB limit)
    parts = None
    if job.status == JobStatus.COMPLETED:
        story_splits = await get_story_splits_service().get_story_splits(job.project_id)
        if story_splits and story_splits.get("parts"):
            parts = [StorySplitterPart(**part) for part in story_splits["parts"]]

    return StorySplitterJobStatusResponse(
        job_id=job.id,
        status=job.status,
        progress=job.progress,
        parts=parts,
        parts_count=len(parts) if parts else None,
        error=error,
        created_at=job.created_at,
        updated_at=job.updated_at,
        completed_at=job.completed_at,
    )


@router.post("/{job_id}/cancel")
async def cancel_story_splitter_job(
    job_id: str,
    user: AuthenticatedUser,
) -> dict:
    """
    Request cancellation of a story splitter job.

    The job will be cancelled if still in progress.
    Jobs that have already completed or failed cannot be cancelled.
    """
    job_queue_service = get_job_queue_service()

    job = await job_queue_service.get_job(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job {job_id} not found",
        )

    # Verify this is a story splitter job
    if job.type != JobType.STORY_SPLITTER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Job {job_id} is not a story splitter job",
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

    logger.info(f"Cancellation requested for story splitter job {job_id} by user {user.uid}")

    return {
        "job_id": job_id,
        "message": "Cancellation requested",
        "previous_status": job.status.value,
    }


@router.get("/project/{project_id}", response_model=list[StorySplitterJobStatusResponse])
async def get_project_story_splitter_jobs(
    project_id: str,
    user: AuthenticatedUser,
    status_filter: Annotated[list[str] | None, Query(alias="status")] = None,
    limit: int = Query(default=50, le=100),
) -> list[StorySplitterJobStatusResponse]:
    """
    Get all story splitter jobs for a project.

    Optionally filter by status.
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

    # Get jobs from Firestore
    db = job_queue_service.db
    query = (
        db.collection(job_queue_service.COLLECTION)
        .where("project_id", "==", project_id)
        .where("type", "==", JobType.STORY_SPLITTER.value)
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

        parts = None
        if job.split_result:
            parts = [StorySplitterPart(**part) for part in job.split_result]

        responses.append(
            StorySplitterJobStatusResponse(
                job_id=job.id,
                status=job.status,
                progress=job.progress,
                parts=parts,
                parts_count=len(parts) if parts else None,
                error=error,
                created_at=job.created_at,
                updated_at=job.updated_at,
                completed_at=job.completed_at,
            )
        )

    return responses
