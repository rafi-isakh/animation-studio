"""Tests for core modules (errors, retry, state machine)."""

import pytest
from datetime import datetime, timezone

from app.core.errors import ErrorCode, VideoJobError, classify_exception
from app.core.retry import RetryState, get_retry_config
from app.core.state_machine import JobStateMachine, InvalidStateTransition
from app.models.job import JobStatus


class TestErrorClassification:
    """Tests for error classification."""

    def test_rate_limit_error(self):
        """Rate limit error should be classified correctly."""
        error = VideoJobError.rate_limit("Too many requests")

        assert error.code == ErrorCode.RATE_LIMIT
        assert error.retryable is True
        assert "Too many requests" in error.message

    def test_quota_exceeded_error(self):
        """Quota exceeded error should be classified correctly."""
        error = VideoJobError.quota_exceeded("Quota exceeded")

        assert error.code == ErrorCode.QUOTA_EXCEEDED
        assert error.retryable is False

    def test_invalid_request_error(self):
        """Invalid request error should be classified correctly."""
        error = VideoJobError.invalid_request("Invalid prompt")

        assert error.code == ErrorCode.INVALID_REQUEST
        assert error.retryable is False

    def test_provider_error(self):
        """Provider error should be classified correctly."""
        error = VideoJobError.provider_error("Provider unavailable")

        assert error.code == ErrorCode.PROVIDER_ERROR
        assert error.retryable is True

    def test_timeout_error(self):
        """Timeout error should be classified correctly."""
        error = VideoJobError.timeout("Request timed out")

        assert error.code == ErrorCode.TIMEOUT
        assert error.retryable is True

    def test_classify_generic_exception(self):
        """Generic exceptions should be classified as provider errors (retryable)."""
        exc = Exception("Something went wrong")
        error = classify_exception(exc)

        # Default classification is provider_error (retryable)
        assert error.code == ErrorCode.PROVIDER_ERROR
        assert error.retryable is True


class TestRetryState:
    """Tests for retry state management."""

    def test_initial_state(self):
        """Initial retry state should have zero retries."""
        state = RetryState(max_retries=3)

        assert state.retry_count == 0
        assert state.can_retry() is True

    def test_record_failure_increments_count(self):
        """Recording failure should increment retry count."""
        state = RetryState(max_retries=3)

        state.record_failure("rate_limit", "Too many requests")

        assert state.retry_count == 1
        assert len(state.failure_history) == 1

    def test_max_retries_reached(self):
        """Should not allow retry after max retries."""
        state = RetryState(max_retries=2, retry_count=2)

        assert state.can_retry() is False

    def test_get_next_delay_exponential(self):
        """Delay should increase exponentially."""
        state = RetryState(max_retries=5)

        delay1 = state.get_next_delay(ErrorCode.RATE_LIMIT)
        state.record_failure("rate_limit", "error")

        delay2 = state.get_next_delay(ErrorCode.RATE_LIMIT)

        # Second delay should be greater (exponential backoff)
        assert delay2 > delay1

    def test_failure_history_tracks_errors(self):
        """Failure history should track all errors."""
        state = RetryState(max_retries=5)

        state.record_failure("rate_limit", "Error 1")
        state.record_failure("provider_error", "Error 2")

        assert len(state.failure_history) == 2
        assert state.failure_history[0]["error_code"] == "rate_limit"
        assert state.failure_history[1]["error_code"] == "provider_error"


class TestRetryConfig:
    """Tests for retry configuration."""

    def test_rate_limit_config(self):
        """Rate limit should have specific retry config."""
        config = get_retry_config(ErrorCode.RATE_LIMIT)

        assert config is not None
        assert config.base_delay >= 30  # At least 30 seconds
        assert config.max_retries >= 3

    def test_quota_exceeded_not_retryable(self):
        """Quota exceeded errors should not be retryable."""
        from app.core.errors import RETRYABLE_ERRORS

        # QUOTA_EXCEEDED should not be in retryable errors
        assert ErrorCode.QUOTA_EXCEEDED not in RETRYABLE_ERRORS

    def test_provider_error_config(self):
        """Provider error should have retry config."""
        config = get_retry_config(ErrorCode.PROVIDER_ERROR)

        assert config is not None
        assert config.max_retries >= 2


class TestJobStateMachine:
    """Tests for job state machine."""

    def test_initial_state(self):
        """State machine should start in correct state."""
        sm = JobStateMachine("job-123", JobStatus.PENDING)

        assert sm.status == JobStatus.PENDING
        assert sm.job_id == "job-123"

    def test_valid_transition_pending_to_submitted(self):
        """Should allow valid transition from PENDING to SUBMITTED."""
        sm = JobStateMachine("job-123", JobStatus.PENDING)

        sm.transition_to(JobStatus.SUBMITTED)

        assert sm.status == JobStatus.SUBMITTED

    def test_valid_transition_submitted_to_polling(self):
        """Should allow valid transition from SUBMITTED to POLLING."""
        sm = JobStateMachine("job-123", JobStatus.SUBMITTED)

        sm.transition_to(JobStatus.POLLING)

        assert sm.status == JobStatus.POLLING

    def test_valid_transition_polling_to_uploading(self):
        """Should allow valid transition from POLLING to UPLOADING."""
        sm = JobStateMachine("job-123", JobStatus.POLLING)

        sm.transition_to(JobStatus.UPLOADING)

        assert sm.status == JobStatus.UPLOADING

    def test_valid_transition_uploading_to_completed(self):
        """Should allow valid transition from UPLOADING to COMPLETED."""
        sm = JobStateMachine("job-123", JobStatus.UPLOADING)

        sm.transition_to(JobStatus.COMPLETED)

        assert sm.status == JobStatus.COMPLETED

    def test_transition_to_failed_from_any_state(self):
        """Should allow transition to FAILED from any active state."""
        for status in [JobStatus.PENDING, JobStatus.SUBMITTED, JobStatus.POLLING, JobStatus.UPLOADING]:
            sm = JobStateMachine("job-123", status)
            sm.transition_to(JobStatus.FAILED)
            assert sm.status == JobStatus.FAILED

    def test_transition_to_cancelled_from_any_state(self):
        """Should allow transition to CANCELLED from any active state."""
        for status in [JobStatus.PENDING, JobStatus.SUBMITTED, JobStatus.POLLING, JobStatus.UPLOADING]:
            sm = JobStateMachine("job-123", status)
            sm.transition_to(JobStatus.CANCELLED)
            assert sm.status == JobStatus.CANCELLED

    def test_invalid_transition_raises_error(self):
        """Should raise error for invalid transitions."""
        sm = JobStateMachine("job-123", JobStatus.COMPLETED)

        with pytest.raises(InvalidStateTransition):
            sm.transition_to(JobStatus.PENDING)

    def test_cannot_transition_from_terminal_state(self):
        """Should not allow transitions from terminal states (except FAILED->PENDING for retry)."""
        # COMPLETED and CANCELLED are true terminal states
        for terminal in [JobStatus.COMPLETED, JobStatus.CANCELLED]:
            sm = JobStateMachine("job-123", terminal)

            with pytest.raises(InvalidStateTransition):
                sm.transition_to(JobStatus.PENDING)

    def test_failed_can_retry_to_pending(self):
        """FAILED state should allow transition back to PENDING for retry."""
        sm = JobStateMachine("job-123", JobStatus.FAILED)

        sm.transition_to(JobStatus.PENDING)

        assert sm.status == JobStatus.PENDING