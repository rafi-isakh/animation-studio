"""ID Converter job management API endpoints."""

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
    IdConverterGlossaryJobSubmitRequest,
    IdConverterBatchJobSubmitRequest,
    IdConverterJobStatusResponse,
)
from app.services.firestore import get_job_queue_service
from app.workers.tasks import (
    process_id_converter_glossary_job,
    process_id_converter_batch_job,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/id-converter-jobs", tags=["id-converter-jobs"])


@router.post("/submit-glossary", response_model=JobSubmitResponse)
async def submit_glossary_analysis_job(
    request: IdConverterGlossaryJobSubmitRequest,
    user: AuthenticatedUser,
) -> JobSubmitResponse:
    """
    Submit a glossary analysis job.

    Analyzes the provided text to extract entities (characters, items, locations)
    with their variants. The job will be queued for processing by background workers.
    """
    logger.info(f"[ID-CONVERTER-API] ========== Received glossary analysis job ==========")
    logger.info(f"[ID-CONVERTER-API] User: {user.uid}, Project: {request.project_id}")
    logger.info(f"[ID-CONVERTER-API] Text length: {len(request.original_text)} chars")
    logger.info(f"[ID-CONVERTER-API] Has file URI: {bool(request.file_uri)}")
    logger.info(f"[ID-CONVERTER-API] Has custom API key: {bool(request.api_key)}")

    job_queue_service = get_job_queue_service()

    # Create job in Firestore
    logger.debug(f"[ID-CONVERTER-API] Creating glossary job in Firestore...")
    job = await job_queue_service.create_id_converter_glossary_job(request, user.uid)
    logger.info(f"[ID-CONVERTER-API] ✓ Job created: {job.id}")

    # Queue for processing (pass API key through task queue, not stored in DB)
    logger.debug(f"[ID-CONVERTER-API] Queuing job {job.id} for processing...")
    await process_id_converter_glossary_job.kiq(job.id, request.api_key)
    logger.info(f"[ID-CONVERTER-API] ✓ Job {job.id} queued successfully")

    return JobSubmitResponse(
        job_id=job.id,
        status=job.status,
        created_at=job.created_at,
    )


@router.post("/submit-batch", response_model=JobSubmitResponse)
async def submit_batch_conversion_job(
    request: IdConverterBatchJobSubmitRequest,
    user: AuthenticatedUser,
) -> JobSubmitResponse:
    """
    Submit a batch chunk conversion job.

    Converts all text chunks sequentially using the provided glossary.
    Each chunk is processed with context from the previous chunk.
    The job will be queued for processing by background workers.
    """
    logger.info(f"[ID-CONVERTER-API] ========== Received batch conversion job ==========")
    logger.info(f"[ID-CONVERTER-API] User: {user.uid}, Project: {request.project_id}")
    logger.info(f"[ID-CONVERTER-API] Glossary entities: {len(request.glossary)}")
    logger.info(f"[ID-CONVERTER-API] Chunks to convert: {len(request.chunks)}")
    logger.info(f"[ID-CONVERTER-API] Has custom API key: {bool(request.api_key)}")

    job_queue_service = get_job_queue_service()

    # Create job in Firestore
    logger.debug(f"[ID-CONVERTER-API] Creating batch job in Firestore...")
    job = await job_queue_service.create_id_converter_batch_job(request, user.uid)
    logger.info(f"[ID-CONVERTER-API] ✓ Job created: {job.id}")

    # Queue for processing (pass API key through task queue, not stored in DB)
    logger.debug(f"[ID-CONVERTER-API] Queuing job {job.id} for processing...")
    await process_id_converter_batch_job.kiq(job.id, request.api_key)
    logger.info(f"[ID-CONVERTER-API] ✓ Job {job.id} queued successfully")

    return JobSubmitResponse(
        job_id=job.id,
        status=job.status,
        created_at=job.created_at,
    )


@router.get("/{job_id}/status", response_model=IdConverterJobStatusResponse)
async def get_id_converter_job_status(
    job_id: str,
    user: AuthenticatedUser,
) -> IdConverterJobStatusResponse:
    """
    Get the current status of an ID converter job.

    Returns detailed status including progress, entities (for glossary jobs),
    chunk progress (for batch jobs), and error information (if failed).
    """
    job_queue_service = get_job_queue_service()

    job = await job_queue_service.get_job(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job {job_id} not found",
        )

    # Verify this is an ID converter job
    if job.type not in (JobType.ID_CONVERTER_GLOSSARY, JobType.ID_CONVERTER_BATCH):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Job {job_id} is not an ID converter job",
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

    # Determine job type for response
    job_type = "glossary" if job.type == JobType.ID_CONVERTER_GLOSSARY else "batch"

    return IdConverterJobStatusResponse(
        job_id=job.id,
        job_type=job_type,
        status=job.status,
        progress=job.progress,
        # Glossary results
        entities=job.glossary_result,
        entities_count=len(job.glossary_result) if job.glossary_result else None,
        # Batch results
        total_chunks=job.total_chunks,
        completed_chunks=job.completed_chunks,
        current_chunk_index=job.current_chunk_index,
        error=error,
        created_at=job.created_at,
        updated_at=job.updated_at,
        completed_at=job.completed_at,
    )


@router.post("/{job_id}/cancel")
async def cancel_id_converter_job(
    job_id: str,
    user: AuthenticatedUser,
) -> dict:
    """
    Request cancellation of an ID converter job.

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

    # Verify this is an ID converter job
    if job.type not in (JobType.ID_CONVERTER_GLOSSARY, JobType.ID_CONVERTER_BATCH):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Job {job_id} is not an ID converter job",
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

    logger.info(f"Cancellation requested for ID converter job {job_id} by user {user.uid}")

    return {
        "job_id": job_id,
        "message": "Cancellation requested",
        "previous_status": job.status.value,
    }


@router.get("/project/{project_id}", response_model=list[IdConverterJobStatusResponse])
async def get_project_id_converter_jobs(
    project_id: str,
    user: AuthenticatedUser,
    job_type_filter: Annotated[str | None, Query(alias="type")] = None,
    status_filter: Annotated[list[str] | None, Query(alias="status")] = None,
    limit: int = Query(default=50, le=100),
) -> list[IdConverterJobStatusResponse]:
    """
    Get all ID converter jobs for a project.

    Optionally filter by job type (glossary, batch) and status.
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

    # Determine job types to query
    job_types = [JobType.ID_CONVERTER_GLOSSARY, JobType.ID_CONVERTER_BATCH]
    if job_type_filter:
        if job_type_filter == "glossary":
            job_types = [JobType.ID_CONVERTER_GLOSSARY]
        elif job_type_filter == "batch":
            job_types = [JobType.ID_CONVERTER_BATCH]
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid type filter: {job_type_filter}. Must be 'glossary' or 'batch'",
            )

    # Get jobs from Firestore
    db = job_queue_service.db
    query = (
        db.collection(job_queue_service.COLLECTION)
        .where("project_id", "==", project_id)
        .where("type", "in", [jt.value for jt in job_types])
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

        job_type = "glossary" if job.type == JobType.ID_CONVERTER_GLOSSARY else "batch"

        responses.append(
            IdConverterJobStatusResponse(
                job_id=job.id,
                job_type=job_type,
                status=job.status,
                progress=job.progress,
                entities=job.glossary_result,
                entities_count=len(job.glossary_result) if job.glossary_result else None,
                total_chunks=job.total_chunks,
                completed_chunks=job.completed_chunks,
                current_chunk_index=job.current_chunk_index,
                error=error,
                created_at=job.created_at,
                updated_at=job.updated_at,
                completed_at=job.completed_at,
            )
        )

    return responses
