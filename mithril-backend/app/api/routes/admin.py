"""Admin API endpoints for DLQ management."""

import logging
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel

from app.api.deps import AuthenticatedUser
from app.services.firestore import get_job_queue_service
from app.workers.tasks import process_dlq_job

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"])


class DLQEntry(BaseModel):
    """Dead letter queue entry."""

    id: str
    original_job_id: str
    project_id: str
    scene_index: int
    clip_index: int
    final_error_code: str
    final_error_message: str
    total_attempts: int
    status: str
    created_at: str


class DLQListResponse(BaseModel):
    """Response for DLQ listing."""

    entries: list[DLQEntry]
    total_count: int


@router.get("/dlq", response_model=DLQListResponse)
async def list_dlq_entries(
    user: AuthenticatedUser,
    status_filter: Annotated[str | None, Query(alias="status")] = None,
    limit: int = Query(default=50, le=100),
) -> DLQListResponse:
    """
    List entries in the dead letter queue.

    Admin access only - returns DLQ entries across all projects.
    """
    job_queue_service = get_job_queue_service()
    db = job_queue_service.db

    query = db.collection(job_queue_service.DLQ_COLLECTION)

    if status_filter:
        query = query.where("status", "==", status_filter)

    query = query.limit(limit)

    docs = await query.get()

    entries = []
    for doc in docs:
        data = doc.to_dict()
        entries.append(
            DLQEntry(
                id=data["id"],
                original_job_id=data["original_job_id"],
                project_id=data["project_id"],
                scene_index=data["scene_index"],
                clip_index=data["clip_index"],
                final_error_code=data["final_error_code"],
                final_error_message=data["final_error_message"],
                total_attempts=data["total_attempts"],
                status=data["status"],
                created_at=data["created_at"],
            )
        )

    return DLQListResponse(entries=entries, total_count=len(entries))


@router.post("/dlq/{dlq_id}/retry")
async def retry_dlq_entry(
    dlq_id: str,
    user: AuthenticatedUser,
) -> dict:
    """
    Retry a job from the dead letter queue.

    This will recreate the job and queue it for processing.
    """
    job_queue_service = get_job_queue_service()
    db = job_queue_service.db

    # Get DLQ entry
    dlq_ref = db.collection(job_queue_service.DLQ_COLLECTION).document(dlq_id)
    dlq_doc = await dlq_ref.get()

    if not dlq_doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"DLQ entry {dlq_id} not found",
        )

    dlq_data = dlq_doc.to_dict()

    # Mark as retrying
    await dlq_ref.update({"status": "retrying"})

    # Queue for processing
    await process_dlq_job.kiq(dlq_id)

    logger.info(f"DLQ entry {dlq_id} queued for retry by user {user.uid}")

    return {
        "dlq_id": dlq_id,
        "original_job_id": dlq_data["original_job_id"],
        "status": "retrying",
        "message": "Job queued for retry",
    }


@router.post("/dlq/{dlq_id}/abandon")
async def abandon_dlq_entry(
    dlq_id: str,
    user: AuthenticatedUser,
) -> dict:
    """
    Mark a DLQ entry as abandoned.

    This acknowledges the failure and removes it from the active DLQ.
    """
    job_queue_service = get_job_queue_service()
    db = job_queue_service.db

    dlq_ref = db.collection(job_queue_service.DLQ_COLLECTION).document(dlq_id)
    dlq_doc = await dlq_ref.get()

    if not dlq_doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"DLQ entry {dlq_id} not found",
        )

    # Mark as abandoned
    await dlq_ref.update({"status": "abandoned"})

    logger.info(f"DLQ entry {dlq_id} abandoned by user {user.uid}")

    return {
        "dlq_id": dlq_id,
        "status": "abandoned",
        "message": "DLQ entry marked as abandoned",
    }


@router.get("/dlq/stats")
async def get_dlq_stats(
    user: AuthenticatedUser,
) -> dict:
    """
    Get DLQ statistics.

    Returns counts by status and error type.
    """
    job_queue_service = get_job_queue_service()
    db = job_queue_service.db

    # Get all DLQ entries
    docs = await db.collection(job_queue_service.DLQ_COLLECTION).get()

    stats = {
        "total": 0,
        "by_status": {},
        "by_error_code": {},
    }

    for doc in docs:
        data = doc.to_dict()
        stats["total"] += 1

        # Count by status
        status_val = data.get("status", "unknown")
        stats["by_status"][status_val] = stats["by_status"].get(status_val, 0) + 1

        # Count by error code
        error_code = data.get("final_error_code", "unknown")
        stats["by_error_code"][error_code] = stats["by_error_code"].get(error_code, 0) + 1

    return stats