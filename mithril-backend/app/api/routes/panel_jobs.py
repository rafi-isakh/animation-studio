"""Panel editor job management API endpoints."""

import logging

from fastapi import APIRouter, HTTPException, status

from app.api.deps import AuthenticatedUser
from app.models.job import (
    JobError,
    JobStatus,
    JobSubmitResponse,
    JobType,
    PanelJobStatusResponse,
    PanelJobSubmitRequest,
)
from app.services.firestore import get_job_queue_service
from app.workers.tasks import process_panel_job

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/panel-jobs", tags=["panel-jobs"])


@router.post("/submit", response_model=JobSubmitResponse)
async def submit_panel_job(
    request: PanelJobSubmitRequest,
    user: AuthenticatedUser,
) -> JobSubmitResponse:
    """
    Submit a single panel editor job.

    The job will be queued for processing by background workers.
    Use the returned job_id to check status.
    """
    logger.info(f"[PANEL-API] ========== Received panel job submission ==========")
    logger.info(f"[PANEL-API] User: {user.uid}, Session: {request.session_id}")
    logger.info(f"[PANEL-API] Panel: {request.panel_id}, File: {request.file_name}")
    logger.info(f"[PANEL-API] Aspect ratio: {request.target_aspect_ratio}")
    logger.info(f"[PANEL-API] Refinement mode: {request.refinement_mode}")
    logger.info(f"[PANEL-API] Image size: {len(request.image_base64)} chars (base64)")
    logger.info(f"[PANEL-API] Has custom API key: {bool(request.api_key)}")
    if request.refinement_mode == "inpaint":
        logger.info(f"[PANEL-API] Inpaint source URL: {request.inpaint_source_url}")
        logger.info(f"[PANEL-API] Inpaint mask base64 length: {len(request.inpaint_mask_base64 or '')}")
        logger.info(f"[PANEL-API] Inpaint dimensions: {request.inpaint_width}x{request.inpaint_height}, strength: {request.inpaint_strength}")
        logger.info(f"[PANEL-API] Inpaint prompt: {request.inpaint_prompt}")

    job_queue_service = get_job_queue_service()

    # Create job in Firestore
    logger.debug(f"[PANEL-API] Creating job in Firestore...")
    job = await job_queue_service.create_panel_job(request, user.uid)
    logger.info(f"[PANEL-API] Job created: {job.id}")

    # Queue for processing (pass image_base64, mask_base64, and API key through task queue, not stored in DB)
    logger.debug(f"[PANEL-API] Queuing job {job.id} for processing...")
    await process_panel_job.kiq(job.id, request.image_base64, request.api_key, request.inpaint_mask_base64)
    logger.info(f"[PANEL-API] Job {job.id} queued successfully")

    return JobSubmitResponse(
        job_id=job.id,
        status=job.status,
        created_at=job.created_at,
    )


@router.get("/{job_id}/status", response_model=PanelJobStatusResponse)
async def get_panel_job_status(
    job_id: str,
    user: AuthenticatedUser,
) -> PanelJobStatusResponse:
    """
    Get the current status of a panel job.

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

    # Verify this is a panel job
    if job.type != JobType.PANEL:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Job {job_id} is not a panel job",
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

    return PanelJobStatusResponse(
        job_id=job.id,
        panel_id=job.panel_id or "",
        session_id=job.session_id or "",
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
async def cancel_panel_job(
    job_id: str,
    user: AuthenticatedUser,
) -> dict:
    """
    Request cancellation of a panel job.

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

    # Verify this is a panel job
    if job.type != JobType.PANEL:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Job {job_id} is not a panel job",
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

    logger.info(f"Cancellation requested for panel job {job_id} by user {user.uid}")

    return {
        "job_id": job_id,
        "message": "Cancellation requested",
        "previous_status": job.status.value,
    }


@router.get("/session/{session_id}", response_model=list[PanelJobStatusResponse])
async def get_session_panel_jobs(
    session_id: str,
    user: AuthenticatedUser,
    limit: int = 50,
) -> list[PanelJobStatusResponse]:
    """
    Get all panel jobs for a session.

    Returns jobs ordered by creation time (newest first).
    """
    job_queue_service = get_job_queue_service()

    # Get jobs from Firestore (filter by type=panel and session_id)
    db = job_queue_service.db
    query = (
        db.collection(job_queue_service.COLLECTION)
        .where("session_id", "==", session_id)
        .where("type", "==", JobType.PANEL.value)
    )

    query = query.order_by("created_at", direction="DESCENDING")
    query = query.limit(limit)

    docs = await query.get()
    from app.models.job import JobDocument
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
            PanelJobStatusResponse(
                job_id=job.id,
                panel_id=job.panel_id or "",
                session_id=job.session_id or "",
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
