"""Credits API endpoints for querying AI provider usage costs."""

import logging
from typing import Annotated

from fastapi import APIRouter, Query

from app.api.deps import AuthenticatedUser
from app.services.credits import get_credits_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/credits", tags=["credits"])


@router.get("/me")
async def get_my_usage(user: AuthenticatedUser) -> dict:
    """Return total credit usage summary for the authenticated user."""
    credits_service = get_credits_service()
    return await credits_service.get_user_summary(user.uid)


@router.get("/project/{project_id}")
async def get_project_usage(
    project_id: str,
    user: AuthenticatedUser,
) -> dict:
    """Return credit transactions for a specific project."""
    credits_service = get_credits_service()
    transactions = await credits_service.get_project_usage(user.uid, project_id)

    total_usd = sum(t.get("cost_usd", 0.0) for t in transactions)
    by_provider: dict[str, float] = {}
    by_job_type: dict[str, float] = {}
    for t in transactions:
        p = t.get("provider_id", "unknown")
        jt = t.get("job_type", "unknown")
        by_provider[p] = by_provider.get(p, 0.0) + t.get("cost_usd", 0.0)
        by_job_type[jt] = by_job_type.get(jt, 0.0) + t.get("cost_usd", 0.0)

    return {
        "project_id": project_id,
        "total_used_usd": round(total_usd, 6),
        "transaction_count": len(transactions),
        "by_provider": {k: round(v, 6) for k, v in by_provider.items()},
        "by_job_type": {k: round(v, 6) for k, v in by_job_type.items()},
        "transactions": transactions,
    }


@router.get("/usage")
async def get_usage_breakdown(
    user: AuthenticatedUser,
    provider_id: Annotated[str | None, Query()] = None,
    job_type: Annotated[str | None, Query()] = None,
    start_date: Annotated[str | None, Query()] = None,
    end_date: Annotated[str | None, Query()] = None,
    limit: int = Query(default=100, le=500),
) -> dict:
    """Admin: filterable usage breakdown across all users."""
    credits_service = get_credits_service()
    transactions = await credits_service.get_usage_breakdown(
        provider_id=provider_id,
        job_type=job_type,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
    )
    total_usd = sum(t.get("cost_usd", 0.0) for t in transactions)
    return {
        "total_used_usd": round(total_usd, 6),
        "transaction_count": len(transactions),
        "transactions": transactions,
    }
