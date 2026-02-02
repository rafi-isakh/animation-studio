#!/usr/bin/env python
"""Quick test script to verify Phase 1 setup."""

import sys
from pathlib import Path

# Add parent directory to Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

import asyncio


def test_imports():
    """Test that all modules can be imported."""
    print("Testing imports...")

    try:
        from app.config import get_settings
        print("  [OK] app.config")
    except ImportError as e:
        print(f"  [FAIL] app.config: {e}")
        return False

    try:
        from app.main import app
        print("  [OK] app.main")
    except ImportError as e:
        print(f"  [FAIL] app.main: {e}")
        return False

    try:
        from app.models.job import JobDocument, JobStatus, JobSubmitRequest
        print("  [OK] app.models.job")
    except ImportError as e:
        print(f"  [FAIL] app.models.job: {e}")
        return False

    try:
        from app.api.deps import CurrentUser
        print("  [OK] app.api.deps")
    except ImportError as e:
        print(f"  [FAIL] app.api.deps: {e}")
        return False

    try:
        from app.workers.broker import broker
        print("  [OK] app.workers.broker")
    except ImportError as e:
        print(f"  [FAIL] app.workers.broker: {e}")
        return False

    try:
        from app.services.firestore import JobQueueService
        print("  [OK] app.services.firestore")
    except ImportError as e:
        print(f"  [FAIL] app.services.firestore: {e}")
        return False

    return True


def test_config():
    """Test configuration loading."""
    print("\nTesting configuration...")

    from app.config import get_settings
    settings = get_settings()

    print(f"  Redis URL: {settings.redis_url}")
    print(f"  Debug: {settings.debug}")
    print(f"  Log Level: {settings.log_level}")

    return True


def test_models():
    """Test Pydantic models."""
    print("\nTesting models...")

    from app.models.job import JobSubmitRequest, JobStatus

    # Create a test request
    request = JobSubmitRequest(
        project_id="test-project",
        scene_index=0,
        clip_index=0,
        provider_id="sora",
        prompt="A cat walking in the garden",
        duration=4,
        aspect_ratio="16:9",
    )

    print(f"  Created JobSubmitRequest: {request.project_id}")
    print(f"  Provider: {request.provider_id}")
    print(f"  Duration: {request.duration}s")

    # Test status enum
    assert JobStatus.PENDING.value == "pending"
    print("  [OK] JobStatus enum works")

    return True


def test_fastapi_app():
    """Test FastAPI app creation."""
    print("\nTesting FastAPI app...")

    from app.main import app

    print(f"  Title: {app.title}")
    print(f"  Version: {app.version}")

    # Check routes are registered
    routes = [route.path for route in app.routes]
    assert "/health" in routes, "Health route not found"
    print("  [OK] /health route registered")

    return True


async def test_health_endpoint():
    """Test health endpoint with test client."""
    print("\nTesting health endpoint...")

    try:
        from httpx import ASGITransport, AsyncClient
        from app.main import app

        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test"
        ) as client:
            response = await client.get("/health")

            assert response.status_code == 200
            assert response.json() == {"status": "healthy"}
            print("  [OK] GET /health returns 200")
            print(f"  Response: {response.json()}")

        return True
    except ImportError:
        print("  [SKIP] httpx not installed, skipping endpoint test")
        return True


def main():
    """Run all tests."""
    print("=" * 50)
    print("Mithril Backend - Phase 1 Verification")
    print("=" * 50)

    all_passed = True

    if not test_imports():
        all_passed = False

    if not test_config():
        all_passed = False

    if not test_models():
        all_passed = False

    if not test_fastapi_app():
        all_passed = False

    # Run async test
    if not asyncio.run(test_health_endpoint()):
        all_passed = False

    print("\n" + "=" * 50)
    if all_passed:
        print("ALL TESTS PASSED!")
        print("=" * 50)
        print("\nNext steps:")
        print("1. Run: uvicorn app.main:app --reload")
        print("2. Open: http://localhost:8000/docs")
        print("3. Test: curl http://localhost:8000/health")
        return 0
    else:
        print("SOME TESTS FAILED")
        print("=" * 50)
        return 1


if __name__ == "__main__":
    sys.exit(main())