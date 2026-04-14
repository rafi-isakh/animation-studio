"""Style converter (pixAI) job management API endpoints."""

import logging

from fastapi import APIRouter, HTTPException, status

from app.api.deps import AuthenticatedUser
from app.models.job import (
    JobError,
    JobStatus,
    JobSubmitResponse,
    JobType,
    StyleConverterJobStatusResponse,
    StyleConverterJobSubmitRequest,
)
from app.services.firestore import get_job_queue_service
from app.workers.tasks import process_style_converter_job

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/style-converter-jobs", tags=["style-converter-jobs"])


@router.post("/submit", response_model=JobSubmitResponse)
async def submit_style_converter_job(
    request: StyleConverterJobSubmitRequest,
    user: AuthenticatedUser,
) -> JobSubmitResponse:
    """Submit a style converter (pixAI) job."""
    logger.info(f"[STYLE-CONVERTER-API] User: {user.uid}, Session: {request.session_id}, Panel: {request.panel_id}")

    svc = get_job_queue_service()
    job = await svc.create_style_converter_job(request, user.uid)

    # Pass image_base64 and api_key through task queue — not stored in Firestore
    await process_style_converter_job.kiq(job.id, request.image_base64, request.api_key)
    logger.info(f"[STYLE-CONVERTER-API] Job {job.id} queued")

    return JobSubmitResponse(job_id=job.id, status=job.status, created_at=job.created_at)


@router.get("/{job_id}/status", response_model=StyleConverterJobStatusResponse)
async def get_style_converter_job_status(
    job_id: str,
    user: AuthenticatedUser,
) -> StyleConverterJobStatusResponse:
    """Get the current status of a style converter job."""
    svc = get_job_queue_service()

    job = await svc.get_job(job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Job {job_id} not found")

    if job.type != JobType.STYLE_CONVERTER:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Job {job_id} is not a style converter job")

    if job.user_id != user.uid:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this job")

    error = None
    if job.error_code:
        error = JobError(
            code=job.error_code,
            message=job.error_message or "",
            retryable=job.error_retryable or False,
        )

    return StyleConverterJobStatusResponse(
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
async def cancel_style_converter_job(
    job_id: str,
    user: AuthenticatedUser,
) -> dict:
    """Request cancellation of a style converter job."""
    svc = get_job_queue_service()

    job = await svc.get_job(job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Job {job_id} not found")

    if job.type != JobType.STYLE_CONVERTER:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Job {job_id} is not a style converter job")

    if job.user_id != user.uid:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this job")

    await svc.mark_cancellation_requested(job_id)
    return {"job_id": job_id, "message": "Cancellation requested", "previous_status": job.status}
