#!/usr/bin/env python
"""Test script to verify Phase 3 (Worker Logic) setup."""

import sys
from pathlib import Path

# Add parent directory to Python path
sys.path.insert(0, str(Path(__file__).parent.parent))


def test_imports():
    """Test that all Phase 3 modules can be imported."""
    print("Testing imports...")

    try:
        from app.core.state_machine import (
            JobStateMachine,
            InvalidStateTransition,
            can_transition,
            is_terminal_state,
        )
        print("  [OK] app.core.state_machine")
    except ImportError as e:
        print(f"  [FAIL] app.core.state_machine: {e}")
        return False

    try:
        from app.core.errors import (
            ErrorCode,
            JobError,
            VideoJobError,
            RETRYABLE_ERRORS,
            classify_exception,
        )
        print("  [OK] app.core.errors")
    except ImportError as e:
        print(f"  [FAIL] app.core.errors: {e}")
        return False

    try:
        from app.core.retry import (
            RetryConfig,
            RetryState,
            calculate_backoff,
            should_retry,
            get_retry_config,
        )
        print("  [OK] app.core.retry")
    except ImportError as e:
        print(f"  [FAIL] app.core.retry: {e}")
        return False

    try:
        from app.workers.handlers.video_generation import (
            process_video_generation,
            CancellationRequested,
        )
        print("  [OK] app.workers.handlers.video_generation")
    except ImportError as e:
        print(f"  [FAIL] app.workers.handlers.video_generation: {e}")
        return False

    try:
        from app.workers.tasks import (
            process_video_job,
            retry_failed_job,
            cleanup_stale_jobs,
        )
        print("  [OK] app.workers.tasks")
    except ImportError as e:
        print(f"  [FAIL] app.workers.tasks: {e}")
        return False

    return True


def test_state_machine():
    """Test job state machine transitions."""
    print("\nTesting state machine...")

    from app.models.job import JobStatus
    from app.core.state_machine import (
        JobStateMachine,
        InvalidStateTransition,
        can_transition,
        is_terminal_state,
        is_active_state,
        can_cancel,
    )

    # Test valid transitions
    assert can_transition(JobStatus.PENDING, JobStatus.SUBMITTED), "PENDING → SUBMITTED should be valid"
    assert can_transition(JobStatus.SUBMITTED, JobStatus.POLLING), "SUBMITTED → POLLING should be valid"
    assert can_transition(JobStatus.POLLING, JobStatus.UPLOADING), "POLLING → UPLOADING should be valid"
    assert can_transition(JobStatus.UPLOADING, JobStatus.COMPLETED), "UPLOADING → COMPLETED should be valid"
    print("  [OK] Valid transitions work")

    # Test invalid transitions
    assert not can_transition(JobStatus.PENDING, JobStatus.COMPLETED), "PENDING → COMPLETED should be invalid"
    assert not can_transition(JobStatus.COMPLETED, JobStatus.PENDING), "COMPLETED → PENDING should be invalid"
    print("  [OK] Invalid transitions blocked")

    # Test terminal states
    assert is_terminal_state(JobStatus.COMPLETED), "COMPLETED should be terminal"
    assert is_terminal_state(JobStatus.CANCELLED), "CANCELLED should be terminal"
    assert not is_terminal_state(JobStatus.PENDING), "PENDING should not be terminal"
    print("  [OK] Terminal state detection works")

    # Test active states
    assert is_active_state(JobStatus.POLLING), "POLLING should be active"
    assert is_active_state(JobStatus.UPLOADING), "UPLOADING should be active"
    assert not is_active_state(JobStatus.PENDING), "PENDING should not be active"
    print("  [OK] Active state detection works")

    # Test cancellation eligibility
    assert can_cancel(JobStatus.PENDING), "PENDING should be cancellable"
    assert can_cancel(JobStatus.POLLING), "POLLING should be cancellable"
    assert not can_cancel(JobStatus.COMPLETED), "COMPLETED should not be cancellable"
    print("  [OK] Cancellation eligibility works")

    # Test state machine class
    sm = JobStateMachine("test-job-1", JobStatus.PENDING)
    assert sm.status == JobStatus.PENDING
    sm.transition_to(JobStatus.SUBMITTED)
    assert sm.status == JobStatus.SUBMITTED
    print("  [OK] JobStateMachine class works")

    # Test invalid transition raises exception
    try:
        sm2 = JobStateMachine("test-job-2", JobStatus.COMPLETED)
        sm2.transition_to(JobStatus.PENDING)
        print("  [FAIL] Should have raised InvalidStateTransition")
        return False
    except InvalidStateTransition:
        print("  [OK] InvalidStateTransition raised correctly")

    return True


def test_error_types():
    """Test error classification and handling."""
    print("\nTesting error types...")

    from app.core.errors import (
        ErrorCode,
        JobError,
        VideoJobError,
        RETRYABLE_ERRORS,
        NON_RETRYABLE_ERRORS,
        classify_exception,
    )

    # Test error code classification
    assert ErrorCode.RATE_LIMIT in RETRYABLE_ERRORS, "RATE_LIMIT should be retryable"
    assert ErrorCode.PROVIDER_ERROR in RETRYABLE_ERRORS, "PROVIDER_ERROR should be retryable"
    assert ErrorCode.QUOTA_EXCEEDED in NON_RETRYABLE_ERRORS, "QUOTA_EXCEEDED should not be retryable"
    assert ErrorCode.INVALID_REQUEST in NON_RETRYABLE_ERRORS, "INVALID_REQUEST should not be retryable"
    print("  [OK] Error classification correct")

    # Test JobError creation
    error = JobError.from_code(ErrorCode.RATE_LIMIT, "Too many requests")
    assert error.code == ErrorCode.RATE_LIMIT
    assert error.retryable == True
    assert error.retry_after is not None
    print(f"  [OK] JobError created: {error.code.value}, retryable={error.retryable}")

    # Test VideoJobError factory methods
    rate_limit_error = VideoJobError.rate_limit("Rate limit hit")
    assert rate_limit_error.code == ErrorCode.RATE_LIMIT
    assert rate_limit_error.retryable == True
    print("  [OK] VideoJobError.rate_limit() works")

    quota_error = VideoJobError.quota_exceeded()
    assert quota_error.code == ErrorCode.QUOTA_EXCEEDED
    assert quota_error.retryable == False
    print("  [OK] VideoJobError.quota_exceeded() works")

    # Test exception classification
    exc1 = Exception("Rate limit exceeded")
    classified1 = classify_exception(exc1)
    assert classified1.code == ErrorCode.RATE_LIMIT
    print("  [OK] 'Rate limit' exception classified correctly")

    exc2 = Exception("Insufficient quota")
    classified2 = classify_exception(exc2)
    assert classified2.code == ErrorCode.QUOTA_EXCEEDED
    print("  [OK] 'quota' exception classified correctly")

    exc3 = Exception("Connection timed out")
    classified3 = classify_exception(exc3)
    assert classified3.code == ErrorCode.TIMEOUT
    print("  [OK] 'timed out' exception classified correctly")

    exc4 = Exception("Some random error")
    classified4 = classify_exception(exc4)
    assert classified4.code == ErrorCode.PROVIDER_ERROR  # Default
    print("  [OK] Unknown exception defaults to PROVIDER_ERROR")

    return True


def test_retry_logic():
    """Test retry configuration and backoff calculation."""
    print("\nTesting retry logic...")

    from app.core.errors import ErrorCode
    from app.core.retry import (
        RetryConfig,
        RetryState,
        calculate_backoff,
        should_retry,
        get_retry_config,
    )
    from app.core.errors import VideoJobError

    # Test default retry config
    config = RetryConfig()
    assert config.max_retries == 3
    assert config.base_delay == 10.0
    print(f"  [OK] Default config: max_retries={config.max_retries}, base_delay={config.base_delay}")

    # Test error-specific retry config
    rate_limit_config = get_retry_config(ErrorCode.RATE_LIMIT)
    assert rate_limit_config.max_retries == 5
    assert rate_limit_config.base_delay == 60
    print(f"  [OK] Rate limit config: max_retries={rate_limit_config.max_retries}, base_delay={rate_limit_config.base_delay}")

    # Test backoff calculation
    config = RetryConfig(base_delay=10, max_delay=300, jitter=0)  # No jitter for predictable test
    delay0 = calculate_backoff(0, config)
    delay1 = calculate_backoff(1, config)
    delay2 = calculate_backoff(2, config)
    print(f"  Backoff delays: attempt 0={delay0}s, 1={delay1}s, 2={delay2}s")
    assert delay0 <= 15, "Attempt 0 delay should be ~10s"  # base + small jitter
    assert delay1 <= 25, "Attempt 1 delay should be ~20s"
    assert delay2 <= 45, "Attempt 2 delay should be ~40s"
    print("  [OK] Exponential backoff calculation works")

    # Test should_retry
    retryable_error = VideoJobError.rate_limit()
    non_retryable_error = VideoJobError.quota_exceeded()

    assert should_retry(retryable_error, 0, 3) == True, "Should retry retryable error on attempt 0"
    assert should_retry(retryable_error, 2, 3) == True, "Should retry retryable error on attempt 2"
    assert should_retry(retryable_error, 3, 3) == False, "Should not retry after max attempts"
    assert should_retry(non_retryable_error, 0, 3) == False, "Should not retry non-retryable error"
    print("  [OK] should_retry() logic works")

    # Test RetryState
    state = RetryState(max_retries=3)
    assert state.can_retry() == True
    assert state.attempts_remaining == 3

    state.record_failure("rate_limit", "Too many requests")
    assert state.retry_count == 1
    assert state.can_retry() == True
    assert len(state.failure_history) == 1
    print("  [OK] RetryState tracking works")

    state.record_failure("rate_limit", "Still too many")
    state.record_failure("rate_limit", "Still too many")
    assert state.retry_count == 3
    assert state.can_retry() == False
    print("  [OK] RetryState max retries enforced")

    return True


def test_task_definitions():
    """Test Taskiq task definitions."""
    print("\nTesting task definitions...")

    from app.workers.tasks import (
        process_video_job,
        retry_failed_job,
        cleanup_stale_jobs,
        get_worker_id,
    )

    # Test worker ID generation
    worker_id = get_worker_id()
    assert worker_id.startswith("worker-")
    print(f"  [OK] Worker ID: {worker_id}")

    # Test that tasks are Taskiq tasks
    assert hasattr(process_video_job, "kiq"), "process_video_job should be a Taskiq task"
    assert hasattr(retry_failed_job, "kiq"), "retry_failed_job should be a Taskiq task"
    assert hasattr(cleanup_stale_jobs, "kiq"), "cleanup_stale_jobs should be a Taskiq task"
    print("  [OK] All tasks are Taskiq tasks")

    return True


def test_video_generation_handler():
    """Test video generation handler structure."""
    print("\nTesting video generation handler...")

    from app.workers.handlers.video_generation import (
        process_video_generation,
        check_cancellation,
        CancellationRequested,
    )
    import inspect

    # Check that process_video_generation is async
    assert inspect.iscoroutinefunction(process_video_generation), "Should be async function"
    print("  [OK] process_video_generation is async")

    # Check that check_cancellation is async
    assert inspect.iscoroutinefunction(check_cancellation), "Should be async function"
    print("  [OK] check_cancellation is async")

    # Check CancellationRequested exception
    try:
        raise CancellationRequested("Test cancellation")
    except CancellationRequested as e:
        assert "Test cancellation" in str(e)
        print("  [OK] CancellationRequested exception works")

    return True


def main():
    """Run all Phase 3 tests."""
    print("=" * 50)
    print("Mithril Backend - Phase 3 Verification")
    print("(Worker Logic)")
    print("=" * 50)

    all_passed = True

    if not test_imports():
        all_passed = False

    if not test_state_machine():
        all_passed = False

    if not test_error_types():
        all_passed = False

    if not test_retry_logic():
        all_passed = False

    if not test_task_definitions():
        all_passed = False

    if not test_video_generation_handler():
        all_passed = False

    print("\n" + "=" * 50)
    if all_passed:
        print("ALL PHASE 3 TESTS PASSED!")
        print("=" * 50)
        print("\nWorker logic is ready. Next: Phase 4 (API Endpoints)")
        return 0
    else:
        print("SOME TESTS FAILED")
        print("=" * 50)
        return 1


if __name__ == "__main__":
    sys.exit(main())