"""Health check endpoints."""

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check() -> dict:
    """Basic health check endpoint."""
    return {"status": "healthy"}


@router.get("/health/ready")
async def readiness_check() -> dict:
    """Readiness check - verifies dependencies are available."""
    # TODO: Add Redis and Firestore connectivity checks
    return {"status": "ready"}