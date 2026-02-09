"""I2V storyboard generation job management API endpoints."""

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
    I2VStoryboardJobSubmitRequest,
    StoryboardClip,
    StoryboardJobStatusResponse,
    StoryboardScene,
    StoryboardVoicePrompt,
)
from app.services.firestore import get_job_queue_service
from app.workers.tasks import process_i2v_storyboard_job

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/i2v-storyboard-jobs", tags=["i2v-storyboard-jobs"])


@router.post("/submit", response_model=JobSubmitResponse)
async def submit_i2v_storyboard_job(
    request: I2VStoryboardJobSubmitRequest,
    user: AuthenticatedUser,
) -> JobSubmitResponse:
    """
    Submit an I2V storyboard generation job.

    Generates a storyboard with scenes, clips, and voice prompts from manga panel images.
    The job will be queued for processing by background workers.
    """
    logger.info(f"[I2V-STORYBOARD-API] ========== Received I2V storyboard job ==========")
    logger.info(f"[I2V-STORYBOARD-API] User: {user.uid}, Project: {request.project_id}")
    logger.info(f"[I2V-STORYBOARD-API] Panel count: {len(request.panel_urls)}")
    logger.info(f"[I2V-STORYBOARD-API] Target duration: {request.target_duration}")
    logger.info(f"[I2V-STORYBOARD-API] Has custom API key: {bool(request.api_key)}")

    job_queue_service = get_job_queue_service()

    # Create job in Firestore
    job = await job_queue_service.create_i2v_storyboard_job(request, user.uid)
    logger.info(f"[I2V-STORYBOARD-API] Job created: {job.id}")

    # Queue for processing (pass API key through task queue, not stored in DB)
    await process_i2v_storyboard_job.kiq(job.id, request.api_key)
    logger.info(f"[I2V-STORYBOARD-API] Job {job.id} queued successfully")

    return JobSubmitResponse(
        job_id=job.id,
        status=job.status,
        created_at=job.created_at,
    )


@router.get("/{job_id}/status", response_model=StoryboardJobStatusResponse)
async def get_i2v_storyboard_job_status(
    job_id: str,
    user: AuthenticatedUser,
) -> StoryboardJobStatusResponse:
    """
    Get the current status of an I2V storyboard generation job.
    """
    job_queue_service = get_job_queue_service()

    job = await job_queue_service.get_job(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job {job_id} not found",
        )

    if job.type != JobType.I2V_STORYBOARD:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Job {job_id} is not an I2V storyboard job",
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

    scenes = None
    voice_prompts = None
    scene_count = None
    clip_count = None

    if job.storyboard_result:
        result = job.storyboard_result
        if "scenes" in result:
            scenes = [
                StoryboardScene(
                    sceneTitle=s.get("sceneTitle", ""),
                    clips=[StoryboardClip(**c) for c in s.get("clips", [])],
                )
                for s in result["scenes"]
            ]
            scene_count = len(scenes)
            clip_count = sum(len(s.clips) for s in scenes)

        if "voicePrompts" in result:
            voice_prompts = [
                StoryboardVoicePrompt(**vp)
                for vp in result["voicePrompts"]
            ]

    return StoryboardJobStatusResponse(
        job_id=job.id,
        status=job.status,
        progress=job.progress,
        scenes=scenes,
        voice_prompts=voice_prompts,
        scene_count=scene_count,
        clip_count=clip_count,
        error=error,
        created_at=job.created_at,
        updated_at=job.updated_at,
        completed_at=job.completed_at,
    )


@router.post("/{job_id}/cancel")
async def cancel_i2v_storyboard_job(
    job_id: str,
    user: AuthenticatedUser,
) -> dict:
    """
    Request cancellation of an I2V storyboard generation job.
    """
    job_queue_service = get_job_queue_service()

    job = await job_queue_service.get_job(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job {job_id} not found",
        )

    if job.type != JobType.I2V_STORYBOARD:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Job {job_id} is not an I2V storyboard job",
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

    logger.info(f"Cancellation requested for I2V storyboard job {job_id} by user {user.uid}")

    return {
        "job_id": job_id,
        "message": "Cancellation requested",
        "previous_status": job.status.value,
    }


@router.get("/project/{project_id}", response_model=list[StoryboardJobStatusResponse])
async def get_project_i2v_storyboard_jobs(
    project_id: str,
    user: AuthenticatedUser,
    status_filter: Annotated[list[str] | None, Query(alias="status")] = None,
    limit: int = Query(default=50, le=100),
) -> list[StoryboardJobStatusResponse]:
    """
    Get all I2V storyboard generation jobs for a project.
    """
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
    query = (
        db.collection(job_queue_service.COLLECTION)
        .where("project_id", "==", project_id)
        .where("type", "==", JobType.I2V_STORYBOARD.value)
    )

    if status_enums:
        status_values = [s.value for s in status_enums]
        query = query.where("status", "in", status_values)

    query = query.order_by("created_at", direction="DESCENDING")
    query = query.limit(limit)

    docs = await query.get()
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

        scenes = None
        voice_prompts = None
        scene_count = None
        clip_count = None

        if job.storyboard_result:
            result = job.storyboard_result
            if "scenes" in result:
                scenes = [
                    StoryboardScene(
                        sceneTitle=s.get("sceneTitle", ""),
                        clips=[StoryboardClip(**c) for c in s.get("clips", [])],
                    )
                    for s in result["scenes"]
                ]
                scene_count = len(scenes)
                clip_count = sum(len(s.clips) for s in scenes)

            if "voicePrompts" in result:
                voice_prompts = [
                    StoryboardVoicePrompt(**vp)
                    for vp in result["voicePrompts"]
                ]

        responses.append(
            StoryboardJobStatusResponse(
                job_id=job.id,
                status=job.status,
                progress=job.progress,
                scenes=scenes,
                voice_prompts=voice_prompts,
                scene_count=scene_count,
                clip_count=clip_count,
                error=error,
                created_at=job.created_at,
                updated_at=job.updated_at,
                completed_at=job.completed_at,
            )
        )

    return responses
