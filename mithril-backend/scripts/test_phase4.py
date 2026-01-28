#!/usr/bin/env python
"""Test script to verify Phase 4 (API Endpoints) setup."""

import sys
from pathlib import Path

# Add parent directory to Python path
sys.path.insert(0, str(Path(__file__).parent.parent))


def test_imports():
    """Test that all Phase 4 modules can be imported."""
    print("Testing imports...")

    try:
        from app.api.routes.jobs import router as jobs_router
        print("  [OK] app.api.routes.jobs")
    except ImportError as e:
        print(f"  [FAIL] app.api.routes.jobs: {e}")
        return False

    try:
        from app.api.routes.admin import router as admin_router
        print("  [OK] app.api.routes.admin")
    except ImportError as e:
        print(f"  [FAIL] app.api.routes.admin: {e}")
        return False

    try:
        from app.main import app
        print("  [OK] app.main")
    except ImportError as e:
        print(f"  [FAIL] app.main: {e}")
        return False

    return True


def test_app_routes():
    """Test that all routes are registered in the FastAPI app."""
    print("\nTesting app routes...")

    from app.main import app

    # Get all routes
    routes = [route.path for route in app.routes]
    print(f"  Found {len(routes)} routes")

    # Check required routes
    required_routes = [
        "/health",
        "/health/ready",
        "/api/v1/jobs/submit",
        "/api/v1/jobs/submit-batch",
        "/api/v1/jobs/{job_id}/status",
        "/api/v1/jobs/{job_id}/cancel",
        "/api/v1/jobs/project/{project_id}",
        "/api/v1/jobs/batch/{batch_id}/retry-failed",
        "/api/v1/admin/dlq",
        "/api/v1/admin/dlq/{dlq_id}/retry",
        "/api/v1/admin/dlq/{dlq_id}/abandon",
        "/api/v1/admin/dlq/stats",
    ]

    all_found = True
    for route in required_routes:
        if route in routes:
            print(f"  [OK] {route}")
        else:
            print(f"  [FAIL] {route} not found")
            all_found = False

    return all_found


def test_endpoint_handlers():
    """Test that endpoint handlers are properly defined."""
    print("\nTesting endpoint handlers...")

    from app.api.routes.jobs import (
        submit_job,
        submit_batch,
        get_job_status,
        cancel_job,
        get_project_jobs,
        retry_failed_batch_jobs,
    )
    import inspect

    handlers = [
        ("submit_job", submit_job),
        ("submit_batch", submit_batch),
        ("get_job_status", get_job_status),
        ("cancel_job", cancel_job),
        ("get_project_jobs", get_project_jobs),
        ("retry_failed_batch_jobs", retry_failed_batch_jobs),
    ]

    for name, handler in handlers:
        if inspect.iscoroutinefunction(handler):
            print(f"  [OK] {name} is async")
        else:
            print(f"  [FAIL] {name} is not async")
            return False

    return True


def test_request_models():
    """Test that request models validate correctly."""
    print("\nTesting request models...")

    from app.models.job import (
        JobSubmitRequest,
        BatchSubmitRequest,
        JobStatusResponse,
        JobError,
    )
    from pydantic import ValidationError

    # Test valid JobSubmitRequest
    try:
        request = JobSubmitRequest(
            project_id="test-project",
            scene_index=0,
            clip_index=0,
            provider_id="sora",
            prompt="A cat walking",
            duration=8,
            aspect_ratio="16:9",
        )
        assert request.provider_id == "sora"
        print("  [OK] JobSubmitRequest with valid data")
    except Exception as e:
        print(f"  [FAIL] JobSubmitRequest: {e}")
        return False

    # Test invalid provider_id
    try:
        request = JobSubmitRequest(
            project_id="test-project",
            scene_index=0,
            clip_index=0,
            provider_id="invalid",  # Should fail
            prompt="A cat walking",
            duration=8,
            aspect_ratio="16:9",
        )
        print("  [FAIL] JobSubmitRequest should reject invalid provider_id")
        return False
    except ValidationError:
        print("  [OK] JobSubmitRequest rejects invalid provider_id")

    # Test invalid duration
    try:
        request = JobSubmitRequest(
            project_id="test-project",
            scene_index=0,
            clip_index=0,
            provider_id="sora",
            prompt="A cat walking",
            duration=100,  # Should fail (max 12)
            aspect_ratio="16:9",
        )
        print("  [FAIL] JobSubmitRequest should reject invalid duration")
        return False
    except ValidationError:
        print("  [OK] JobSubmitRequest rejects invalid duration")

    # Test BatchSubmitRequest
    try:
        batch = BatchSubmitRequest(
            project_id="test-project",
            jobs=[
                JobSubmitRequest(
                    project_id="test-project",
                    scene_index=0,
                    clip_index=0,
                    provider_id="sora",
                    prompt="Scene 1",
                    duration=4,
                    aspect_ratio="16:9",
                ),
                JobSubmitRequest(
                    project_id="test-project",
                    scene_index=0,
                    clip_index=1,
                    provider_id="veo3",
                    prompt="Scene 2",
                    duration=6,
                    aspect_ratio="9:16",
                ),
            ],
            api_key="test-key",
        )
        assert len(batch.jobs) == 2
        print("  [OK] BatchSubmitRequest with multiple jobs")
    except Exception as e:
        print(f"  [FAIL] BatchSubmitRequest: {e}")
        return False

    return True


def test_response_models():
    """Test that response models serialize correctly."""
    print("\nTesting response models...")

    from datetime import datetime, timezone
    from app.models.job import (
        JobSubmitResponse,
        JobStatusResponse,
        BatchSubmitResponse,
        JobStatus,
        JobError,
    )

    now = datetime.now(timezone.utc)

    # Test JobSubmitResponse
    try:
        response = JobSubmitResponse(
            job_id="test-job-123",
            status=JobStatus.PENDING,
            created_at=now,
        )
        json_data = response.model_dump(mode="json")
        assert "job_id" in json_data
        assert json_data["status"] == "pending"
        print("  [OK] JobSubmitResponse serializes correctly")
    except Exception as e:
        print(f"  [FAIL] JobSubmitResponse: {e}")
        return False

    # Test JobStatusResponse with error
    try:
        response = JobStatusResponse(
            job_id="test-job-123",
            status=JobStatus.FAILED,
            progress=0.5,
            error=JobError(
                code="rate_limit",
                message="Too many requests",
                retryable=True,
            ),
            created_at=now,
            updated_at=now,
        )
        json_data = response.model_dump(mode="json")
        assert json_data["error"]["code"] == "rate_limit"
        assert json_data["error"]["retryable"] is True
        print("  [OK] JobStatusResponse with error serializes correctly")
    except Exception as e:
        print(f"  [FAIL] JobStatusResponse: {e}")
        return False

    # Test BatchSubmitResponse
    try:
        response = BatchSubmitResponse(
            batch_id="batch-123",
            jobs=[
                JobSubmitResponse(
                    job_id="job-1",
                    status=JobStatus.PENDING,
                    created_at=now,
                ),
                JobSubmitResponse(
                    job_id="job-2",
                    status=JobStatus.PENDING,
                    created_at=now,
                ),
            ],
            total_count=2,
        )
        json_data = response.model_dump(mode="json")
        assert json_data["total_count"] == 2
        assert len(json_data["jobs"]) == 2
        print("  [OK] BatchSubmitResponse serializes correctly")
    except Exception as e:
        print(f"  [FAIL] BatchSubmitResponse: {e}")
        return False

    return True


def test_auth_dependency():
    """Test that auth dependency is properly configured."""
    print("\nTesting auth dependency...")

    from app.api.deps import CurrentUser, AuthenticatedUser, get_current_user
    import inspect

    # Check CurrentUser model
    try:
        user = CurrentUser(uid="test-uid-123", email="test@example.com")
        assert user.uid == "test-uid-123"
        print("  [OK] CurrentUser model works")
    except Exception as e:
        print(f"  [FAIL] CurrentUser: {e}")
        return False

    # Check get_current_user is async
    if inspect.iscoroutinefunction(get_current_user):
        print("  [OK] get_current_user is async")
    else:
        print("  [FAIL] get_current_user should be async")
        return False

    return True


def test_admin_endpoints():
    """Test admin endpoint handlers."""
    print("\nTesting admin endpoints...")

    from app.api.routes.admin import (
        list_dlq_entries,
        retry_dlq_entry,
        abandon_dlq_entry,
        get_dlq_stats,
        DLQEntry,
        DLQListResponse,
    )
    import inspect

    # Check all handlers are async
    handlers = [
        ("list_dlq_entries", list_dlq_entries),
        ("retry_dlq_entry", retry_dlq_entry),
        ("abandon_dlq_entry", abandon_dlq_entry),
        ("get_dlq_stats", get_dlq_stats),
    ]

    for name, handler in handlers:
        if inspect.iscoroutinefunction(handler):
            print(f"  [OK] {name} is async")
        else:
            print(f"  [FAIL] {name} is not async")
            return False

    # Test DLQEntry model
    try:
        entry = DLQEntry(
            id="dlq-123",
            original_job_id="job-456",
            project_id="project-789",
            scene_index=0,
            clip_index=0,
            final_error_code="rate_limit",
            final_error_message="Too many requests",
            total_attempts=3,
            status="pending",
            created_at="2024-01-01T00:00:00Z",
        )
        assert entry.id == "dlq-123"
        print("  [OK] DLQEntry model works")
    except Exception as e:
        print(f"  [FAIL] DLQEntry: {e}")
        return False

    return True


def main():
    """Run all Phase 4 tests."""
    print("=" * 50)
    print("Mithril Backend - Phase 4 Verification")
    print("(API Endpoints)")
    print("=" * 50)

    all_passed = True

    if not test_imports():
        all_passed = False

    if not test_app_routes():
        all_passed = False

    if not test_endpoint_handlers():
        all_passed = False

    if not test_request_models():
        all_passed = False

    if not test_response_models():
        all_passed = False

    if not test_auth_dependency():
        all_passed = False

    if not test_admin_endpoints():
        all_passed = False

    print("\n" + "=" * 50)
    if all_passed:
        print("ALL PHASE 4 TESTS PASSED!")
        print("=" * 50)
        print("\nAPI endpoints are ready. Next: Phase 5 (Frontend Integration)")
        return 0
    else:
        print("SOME TESTS FAILED")
        print("=" * 50)
        return 1


if __name__ == "__main__":
    sys.exit(main())