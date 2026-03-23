"""Monitoring API endpoints for Firestore billable metrics."""

import logging
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query

from app.api.deps import AuthenticatedUser
from app.services.monitoring import RANGE_CONFIG, get_monitoring_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/monitoring", tags=["monitoring"])

VALID_RANGES = list(RANGE_CONFIG.keys())


@router.get("/firestore-metrics")
async def get_firestore_metrics(
    user: AuthenticatedUser,
    range: Annotated[str, Query()] = "60m",
) -> dict:
    """Return Firestore billable metrics (reads, writes, deletes) as time-series data."""
    if range not in VALID_RANGES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid range '{range}'. Must be one of: {VALID_RANGES}",
        )

    try:
        service = get_monitoring_service()
        return await service.get_firestore_metrics(range)
    except Exception as e:
        import traceback
        logger.error(f"Failed to fetch Firestore metrics: {type(e).__name__}: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=502,
            detail=f"Failed to fetch metrics from Google Cloud Monitoring: {type(e).__name__}: {e}",
        )
