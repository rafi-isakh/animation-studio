"""Panel Splitter job management API endpoints."""

import logging
import uuid
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status

from app.api.deps import AuthenticatedUser
from app.models.job import (
    DetectedPanel,
    JobDocument,
    JobError,
    JobStatus,
    JobSubmitResponse,
    JobType,
    PanelSplitterBatchSubmitRequest,
    PanelSplitterBatchSubmitResponse,
    PanelSplitterJobStatusResponse,
    PanelSplitterJobSubmitRequest,
)
from app.services.firestore import get_job_queue_service
from app.workers.tasks import process_panel_splitter_job

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/panel-splitter-jobs", tags=["panel-splitter-jobs"])


@router.post("/submit", response_model=JobSubmitResponse)
async def submit_panel_splitter_job(
    request: PanelSplitterJobSubmitRequest,
    user: AuthenticatedUser,
) -> JobSubmitResponse:
    """
    Submit a panel splitter job.

    Detects panels in the provided manga/comic page image.
    The job will be queued for processing by background workers.
    """
    logger.info(f"[PANEL-SPLITTER-API] ========== Received panel splitter job ==========")
    logger.info(f"[PANEL-SPLITTER-API] User: {user.uid}, Project: {request.project_id}")
    logger.info(f"[PANEL-SPLITTER-API] Page ID: {request.page_id}, Index: {request.page_index}")
    logger.info(f"[PANEL-SPLITTER-API] File: {request.file_name}")
    logger.info(f"[PANEL-SPLITTER-API] Reading direction: {request.reading_direction}")
    logger.info(f"[PANEL-SPLITTER-API] Has custom API key: {bool(request.api_key)}")

    job_queue_service = get_job_queue_service()

    # Create job in Firestore
    logger.debug(f"[PANEL-SPLITTER-API] Creating panel splitter job in Firestore...")
    job = await job_queue_service.create_panel_splitter_job(request, user.uid)
    logger.info(f"[PANEL-SPLITTER-API] Job created: {job.id}")

    # Queue for processing (pass image_url and API key through task queue, not stored in DB)
    logger.debug(f"[PANEL-SPLITTER-API] Queuing job {job.id} for processing...")
    await process_panel_splitter_job.kiq(job.id, request.image_url, request.api_key)
    logger.info(f"[PANEL-SPLITTER-API] Job {job.id} queued successfully")

    return JobSubmitResponse(
        job_id=job.id,
        status=job.status,
        created_at=job.created_at,
    )


@router.post("/submit-batch", response_model=PanelSplitterBatchSubmitResponse)
async def submit_panel_splitter_batch(
    request: PanelSplitterBatchSubmitRequest,
    user: AuthenticatedUser,
) -> PanelSplitterBatchSubmitResponse:
    """
    Submit multiple panel splitter jobs as a batch.

    All jobs in the batch will be queued for processing.
    """
    logger.info(f"[PANEL-SPLITTER-API] ========== Received batch panel splitter request ==========")
    logger.info(f"[PANEL-SPLITTER-API] User: {user.uid}, Project: {request.project_id}")
    logger.info(f"[PANEL-SPLITTER-API] Page count: {len(request.pages)}")
    logger.info(f"[PANEL-SPLITTER-API] Reading direction: {request.reading_direction}")

    job_queue_service = get_job_queue_service()
    batch_id = str(uuid.uuid4())

    # Build all page requests first
    page_requests = [
        PanelSplitterJobSubmitRequest(
            project_id=request.project_id,
            page_id=page.page_id,
            page_index=page.page_index,
            file_name=page.file_name,
            image_url=page.image_url,
            reading_direction=page.reading_direction or request.reading_direction,
            api_key=page.api_key or request.api_key,
        )
        for page in request.pages
    ]

    # Create ALL jobs in a single Firestore WriteBatch (1 RPC instead of N)
    jobs = await job_queue_service.create_panel_splitter_jobs_batch(
        [(pr, pr.image_url) for pr in page_requests],
        user.uid,
        batch_id=batch_id,
    )
    logger.info(f"[PANEL-SPLITTER-API] Batch {batch_id}: {len(jobs)} jobs written to Firestore in one commit")

    # Enqueue Redis tasks after all Firestore writes are committed
    for job, page_request in zip(jobs, page_requests):
        await process_panel_splitter_job.kiq(job.id, page_request.image_url, page_request.api_key)
        logger.info(f"[PANEL-SPLITTER-API] Queued job {job.id} for page {page_request.page_id}")

    job_responses = [
        JobSubmitResponse(job_id=job.id, status=job.status, created_at=job.created_at)
        for job in jobs
    ]

    logger.info(f"[PANEL-SPLITTER-API] Batch {batch_id} created with {len(job_responses)} jobs")

    return PanelSplitterBatchSubmitResponse(
        batch_id=batch_id,
        jobs=job_responses,
        total_count=len(job_responses),
        status="submitted",
    )


@router.get("/{job_id}/status", response_model=PanelSplitterJobStatusResponse)
async def get_panel_splitter_job_status(
    job_id: str,
    user: AuthenticatedUser,
) -> PanelSplitterJobStatusResponse:
    """
    Get the current status of a panel splitter job.

    Returns detailed status including progress, detected panels,
    and error information (if failed).
    """
    job_queue_service = get_job_queue_service()

    job = await job_queue_service.get_job(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job {job_id} not found",
        )

    # Verify this is a panel splitter job
    if job.type != JobType.PANEL_SPLITTER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Job {job_id} is not a panel splitter job",
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

    # Convert detected_panels to DetectedPanel list
    panels = None
    if job.detected_panels:
        panels = [DetectedPanel(**panel) for panel in job.detected_panels]

    return PanelSplitterJobStatusResponse(
        job_id=job.id,
        page_id=job.page_id or "",
        page_index=job.page_index or 0,
        file_name=job.file_name or "",
        status=job.status,
        progress=job.progress,
        detected_panels=panels,
        panel_count=len(panels) if panels else None,
        image_url=job.image_url,
        error=error,
        created_at=job.created_at,
        updated_at=job.updated_at,
        completed_at=job.completed_at,
    )


@router.post("/{job_id}/cancel")
async def cancel_panel_splitter_job(
    job_id: str,
    user: AuthenticatedUser,
) -> dict:
    """
    Request cancellation of a panel splitter job.

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

    # Verify this is a panel splitter job
    if job.type != JobType.PANEL_SPLITTER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Job {job_id} is not a panel splitter job",
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

    logger.info(f"Cancellation requested for panel splitter job {job_id} by user {user.uid}")

    return {
        "job_id": job_id,
        "message": "Cancellation requested",
        "previous_status": job.status.value,
    }


@router.get("/project/{project_id}", response_model=list[PanelSplitterJobStatusResponse])
async def get_project_panel_splitter_jobs(
    project_id: str,
    user: AuthenticatedUser,
    status_filter: Annotated[list[str] | None, Query(alias="status")] = None,
    limit: int = Query(default=50, le=100),
) -> list[PanelSplitterJobStatusResponse]:
    """
    Get all panel splitter jobs for a project.

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
        .where("type", "==", JobType.PANEL_SPLITTER.value)
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

        panels = None
        if job.detected_panels:
            panels = [DetectedPanel(**panel) for panel in job.detected_panels]

        responses.append(
            PanelSplitterJobStatusResponse(
                job_id=job.id,
                page_id=job.page_id or "",
                page_index=job.page_index or 0,
                file_name=job.file_name or "",
                status=job.status,
                progress=job.progress,
                detected_panels=panels,
                panel_count=len(panels) if panels else None,
                image_url=job.image_url,
                error=error,
                created_at=job.created_at,
                updated_at=job.updated_at,
                completed_at=job.completed_at,
            )
        )

    return responses
