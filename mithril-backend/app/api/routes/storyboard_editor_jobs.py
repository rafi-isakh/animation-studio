"""Storyboard Editor job management API endpoints."""

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
    StoryboardEditorJobStatusResponse,
    StoryboardEditorJobSubmitRequest,
)
from app.services.firestore import get_job_queue_service
from app.workers.tasks import process_storyboard_editor_job

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/storyboard-editor-jobs", tags=["storyboard-editor-jobs"])


@router.post("/submit", response_model=JobSubmitResponse)
async def submit_storyboard_editor_job(
    request: StoryboardEditorJobSubmitRequest,
    user: AuthenticatedUser,
) -> JobSubmitResponse:
    """
    Submit a storyboard editor job (generate or remix).

    The job will be queued for processing by background workers.
    """
    logger.info(f"[STORYBOARD-EDITOR-API] ========== Received job ==========")
    logger.info(
        f"[STORYBOARD-EDITOR-API] User: {user.uid}, Project: {request.project_id}"
    )
    logger.info(
        f"[STORYBOARD-EDITOR-API] Operation: {request.operation}, "
        f"Frame: {request.frame_type}, Scene: {request.scene_index}, Clip: {request.clip_index}"
    )
    logger.info(f"[STORYBOARD-EDITOR-API] Has custom API key: {bool(request.api_key)}")

    job_queue_service = get_job_queue_service()

    # Create job in Firestore
    job = await job_queue_service.create_storyboard_editor_job(request, user.uid)
    logger.info(f"[STORYBOARD-EDITOR-API] Job created: {job.id}")

    # Queue for processing (pass API key through task queue, not stored in DB)
    await process_storyboard_editor_job.kiq(job.id, request.api_key)
    logger.info(f"[STORYBOARD-EDITOR-API] Job {job.id} queued successfully")

    return JobSubmitResponse(
        job_id=job.id,
        status=job.status,
        created_at=job.created_at,
    )


@router.get("/{job_id}/status", response_model=StoryboardEditorJobStatusResponse)
async def get_storyboard_editor_job_status(
    job_id: str,
    user: AuthenticatedUser,
) -> StoryboardEditorJobStatusResponse:
    """Get the current status of a storyboard editor job."""
    job_queue_service = get_job_queue_service()

    job = await job_queue_service.get_job(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job {job_id} not found",
        )

    if job.type != JobType.STORYBOARD_EDITOR:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Job {job_id} is not a storyboard editor job",
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

    return StoryboardEditorJobStatusResponse(
        job_id=job.id,
        scene_index=job.scene_index,
        clip_index=job.clip_index,
        frame_type=job.frame_type or "start",
        operation=job.operation or "generate",
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
async def cancel_storyboard_editor_job(
    job_id: str,
    user: AuthenticatedUser,
) -> dict:
    """Request cancellation of a storyboard editor job."""
    job_queue_service = get_job_queue_service()

    job = await job_queue_service.get_job(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job {job_id} not found",
        )

    if job.type != JobType.STORYBOARD_EDITOR:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Job {job_id} is not a storyboard editor job",
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

    logger.info(f"Cancellation requested for storyboard editor job {job_id} by user {user.uid}")

    return {
        "job_id": job_id,
        "message": "Cancellation requested",
        "previous_status": job.status.value,
    }


@router.get("/project/{project_id}", response_model=list[StoryboardEditorJobStatusResponse])
async def get_project_storyboard_editor_jobs(
    project_id: str,
    user: AuthenticatedUser,
    status_filter: Annotated[list[str] | None, Query(alias="status")] = None,
    limit: int = Query(default=50, le=100),
) -> list[StoryboardEditorJobStatusResponse]:
    """Get all storyboard editor jobs for a project."""
    job_queue_service = get_job_queue_service()

    status_enums = None
    if status_filter:
        try:
            status_enums = [JobStatus(s) for s in status_filter]
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status filter: {e}",
            )

    db = job_queue_service.db
    query_ref = (
        db.collection(job_queue_service.COLLECTION)
        .where("project_id", "==", project_id)
        .where("type", "==", JobType.STORYBOARD_EDITOR.value)
    )

    if status_enums:
        status_values = [s.value for s in status_enums]
        query_ref = query_ref.where("status", "in", status_values)

    query_ref = query_ref.order_by("created_at", direction="DESCENDING")
    query_ref = query_ref.limit(limit)

    docs = await query_ref.get()
    jobs = [JobDocument(**doc.to_dict()) for doc in docs]

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
            StoryboardEditorJobStatusResponse(
                job_id=job.id,
                scene_index=job.scene_index,
                clip_index=job.clip_index,
                frame_type=job.frame_type or "start",
                operation=job.operation or "generate",
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
