"""Panel colorizer job management API endpoints."""

import logging

from fastapi import APIRouter, HTTPException, status

from app.api.deps import AuthenticatedUser
from app.models.job import (
    JobError,
    JobStatus,
    JobSubmitResponse,
    JobType,
    PanelColorizerJobStatusResponse,
    PanelColorizerJobSubmitRequest,
)
from app.services.firestore import get_job_queue_service
from app.workers.tasks import process_panel_colorizer_job

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/panel-colorizer-jobs", tags=["panel-colorizer-jobs"])


@router.post("/submit", response_model=JobSubmitResponse)
async def submit_panel_colorizer_job(
    request: PanelColorizerJobSubmitRequest,
    user: AuthenticatedUser,
) -> JobSubmitResponse:
    """
    Submit a single panel colorizer job.

    The job will be queued for processing by background workers.
    Use the returned job_id to check status.
    """
    logger.info(f"[PANEL-COLORIZER-API] ========== Received panel colorizer job ==========")
    logger.info(f"[PANEL-COLORIZER-API] User: {user.uid}, Session: {request.session_id}")
    logger.info(f"[PANEL-COLORIZER-API] Panel: {request.panel_id}, File: {request.file_name}")
    logger.info(f"[PANEL-COLORIZER-API] Aspect ratio: {request.target_aspect_ratio}")
    logger.info(f"[PANEL-COLORIZER-API] References: {len(request.reference_images)}")
    logger.info(f"[PANEL-COLORIZER-API] Image size: {len(request.image_base64)} chars (base64)")

    job_queue_service = get_job_queue_service()

    # Create job in Firestore
    job = await job_queue_service.create_panel_colorizer_job(request, user.uid)
    logger.info(f"[PANEL-COLORIZER-API] Job created: {job.id}")

    # Serialize reference images for task queue
    reference_images_data = [
        {"base64": ref.base64, "mime_type": ref.mime_type}
        for ref in request.reference_images
    ]

    # Queue for processing (pass image + references through task queue, not in DB)
    await process_panel_colorizer_job.kiq(
        job.id, request.image_base64, reference_images_data, request.api_key
    )
    logger.info(f"[PANEL-COLORIZER-API] Job {job.id} queued successfully")

    return JobSubmitResponse(
        job_id=job.id,
        status=job.status,
        created_at=job.created_at,
    )


@router.get("/{job_id}/status", response_model=PanelColorizerJobStatusResponse)
async def get_panel_colorizer_job_status(
    job_id: str,
    user: AuthenticatedUser,
) -> PanelColorizerJobStatusResponse:
    """Get the current status of a panel colorizer job."""
    job_queue_service = get_job_queue_service()

    job = await job_queue_service.get_job(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job {job_id} not found",
        )

    if job.type != JobType.PANEL_COLORIZER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Job {job_id} is not a panel colorizer job",
        )

    if job.user_id != user.uid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this job",
        )

    error = None
    if job.error_code:
        error = JobError(
            code=job.error_code,
            message=job.error_message or "Unknown error",
            retryable=job.error_retryable or False,
        )

    return PanelColorizerJobStatusResponse(
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
async def cancel_panel_colorizer_job(
    job_id: str,
    user: AuthenticatedUser,
) -> dict:
    """Request cancellation of a panel colorizer job."""
    job_queue_service = get_job_queue_service()

    job = await job_queue_service.get_job(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job {job_id} not found",
        )

    if job.type != JobType.PANEL_COLORIZER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Job {job_id} is not a panel colorizer job",
        )

    if job.user_id != user.uid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this job",
        )

    cancelled = await job_queue_service.mark_cancellation_requested(job_id)

    if not cancelled:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Job {job_id} cannot be cancelled (status: {job.status.value})",
        )

    logger.info(f"Cancellation requested for panel colorizer job {job_id} by user {user.uid}")

    return {
        "job_id": job_id,
        "message": "Cancellation requested",
        "previous_status": job.status.value,
    }
