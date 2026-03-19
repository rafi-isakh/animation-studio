"""Credits API endpoints for querying AI provider usage costs."""

import logging
from typing import Annotated

from fastapi import APIRouter, Query

from app.api.deps import AuthenticatedUser
from app.services.credits import get_credits_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/credits", tags=["credits"])


@router.get("/me")
async def get_my_usage(
    user: AuthenticatedUser,
    project_id: Annotated[str | None, Query()] = None,
    start_date: Annotated[str | None, Query()] = None,
    end_date: Annotated[str | None, Query()] = None,
) -> dict:
    """Return total credit usage summary for the authenticated user."""
    credits_service = get_credits_service()
    if project_id:
        transactions = await credits_service.get_project_usage(
            user.uid, project_id, start_date=start_date, end_date=end_date
        )
        total_usd = sum(t.get("cost_usd", 0.0) for t in transactions)
        return {
            "user_id": user.uid,
            "project_id": project_id,
            "total_used_usd": round(total_usd, 6),
            "transaction_count": len(transactions),
        }
    return await credits_service.get_user_summary(user.uid, start_date=start_date, end_date=end_date)


@router.get("/project/{project_id}")
async def get_project_usage(
    project_id: str,
    user: AuthenticatedUser,
    start_date: Annotated[str | None, Query()] = None,
    end_date: Annotated[str | None, Query()] = None,
) -> dict:
    """Return credit transactions for a specific project."""
    credits_service = get_credits_service()
    transactions = await credits_service.get_project_usage(
        user.uid, project_id, start_date=start_date, end_date=end_date
    )

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


@router.get("/me/stages")
async def get_my_stage_breakdown(
    user: AuthenticatedUser,
    project_id: Annotated[str | None, Query()] = None,
    start_date: Annotated[str | None, Query()] = None,
    end_date: Annotated[str | None, Query()] = None,
) -> dict:
    """Return credit usage grouped by stage (job_type) for the authenticated user."""
    credits_service = get_credits_service()
    stages = await credits_service.get_stage_breakdown(
        user_id=user.uid, project_id=project_id, start_date=start_date, end_date=end_date
    )
    total_usd = sum(s["total_usd"] for s in stages)
    return {"stages": stages, "total_usd": round(total_usd, 6)}


@router.get("/project/{project_id}/stages")
async def get_project_stage_breakdown(
    project_id: str,
    user: AuthenticatedUser,
    start_date: Annotated[str | None, Query()] = None,
    end_date: Annotated[str | None, Query()] = None,
) -> dict:
    """Return credit usage grouped by stage (job_type) for a specific project."""
    credits_service = get_credits_service()
    stages = await credits_service.get_stage_breakdown(
        user_id=user.uid, project_id=project_id, start_date=start_date, end_date=end_date
    )
    total_usd = sum(s["total_usd"] for s in stages)
    return {"project_id": project_id, "stages": stages, "total_usd": round(total_usd, 6)}


@router.get("/me/providers")
async def get_my_provider_breakdown(
    user: AuthenticatedUser,
    project_id: Annotated[str | None, Query()] = None,
    start_date: Annotated[str | None, Query()] = None,
    end_date: Annotated[str | None, Query()] = None,
) -> dict:
    """Return credit usage grouped by provider for the authenticated user."""
    credits_service = get_credits_service()
    providers = await credits_service.get_provider_breakdown(
        user_id=user.uid, project_id=project_id, start_date=start_date, end_date=end_date
    )
    total_usd = sum(p["total_usd"] for p in providers)
    return {"providers": providers, "total_usd": round(total_usd, 6)}


@router.get("/usage/summary")
async def get_usage_summary(
    user: AuthenticatedUser,
    user_id: Annotated[str | None, Query()] = None,
    project_id: Annotated[str | None, Query()] = None,
    start_date: Annotated[str | None, Query()] = None,
    end_date: Annotated[str | None, Query()] = None,
) -> dict:
    """Admin: aggregate usage summary across all users, with optional filters."""
    credits_service = get_credits_service()
    return await credits_service.get_all_summary(
        user_id=user_id, project_id=project_id, start_date=start_date, end_date=end_date
    )


@router.get("/usage/providers")
async def get_usage_provider_breakdown(
    user: AuthenticatedUser,
    user_id: Annotated[str | None, Query()] = None,
    project_id: Annotated[str | None, Query()] = None,
    start_date: Annotated[str | None, Query()] = None,
    end_date: Annotated[str | None, Query()] = None,
) -> dict:
    """Admin: cross-user provider breakdown with optional filters."""
    credits_service = get_credits_service()
    providers = await credits_service.get_provider_breakdown(
        user_id=user_id, project_id=project_id, start_date=start_date, end_date=end_date
    )
    total_usd = sum(p["total_usd"] for p in providers)
    return {"providers": providers, "total_usd": round(total_usd, 6)}


@router.get("/usage/stages")
async def get_usage_stage_breakdown(
    user: AuthenticatedUser,
    user_id: Annotated[str | None, Query()] = None,
    project_id: Annotated[str | None, Query()] = None,
    start_date: Annotated[str | None, Query()] = None,
    end_date: Annotated[str | None, Query()] = None,
) -> dict:
    """Admin: cross-user stage breakdown with optional filters."""
    credits_service = get_credits_service()
    stages = await credits_service.get_stage_breakdown(
        user_id=user_id,
        project_id=project_id,
        start_date=start_date,
        end_date=end_date,
    )
    total_usd = sum(s["total_usd"] for s in stages)
    return {"stages": stages, "total_usd": round(total_usd, 6)}


@router.get("/usage")
async def get_usage_breakdown(
    user: AuthenticatedUser,
    user_id: Annotated[str | None, Query()] = None,
    provider_id: Annotated[str | None, Query()] = None,
    job_type: Annotated[str | None, Query()] = None,
    start_date: Annotated[str | None, Query()] = None,
    end_date: Annotated[str | None, Query()] = None,
    limit: int = Query(default=100, le=500),
) -> dict:
    """Admin: filterable usage breakdown across all users."""
    credits_service = get_credits_service()
    transactions = await credits_service.get_usage_breakdown(
        user_id=user_id,
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
