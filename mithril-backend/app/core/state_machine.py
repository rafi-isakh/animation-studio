"""Job state machine for video generation pipeline."""

import logging
from typing import Set

from app.models.job import JobStatus

logger = logging.getLogger(__name__)

# Valid state transitions
# Format: {current_state: {allowed_next_states}}
VALID_TRANSITIONS: dict[JobStatus, Set[JobStatus]] = {
    # === Common/Video job transitions ===
    JobStatus.PENDING: {
        JobStatus.SUBMITTED,  # Video: Job picked up by worker
        JobStatus.PREPARING,  # Image: Job picked up, fetching references
        JobStatus.GENERATING, # ID Converter: Direct to generating (no preparation needed)
        JobStatus.FAILED,     # Validation failed
        JobStatus.CANCELLED,  # Cancelled before start
    },
    JobStatus.SUBMITTED: {
        JobStatus.POLLING,    # Video: Provider accepted job
        JobStatus.FAILED,     # Video: Provider rejected job
        JobStatus.CANCELLED,  # Cancelled after submit
    },
    JobStatus.POLLING: {
        JobStatus.POLLING,    # Still polling (self-transition)
        JobStatus.UPLOADING,  # Video: Provider completed, downloading video
        JobStatus.FAILED,     # Provider failed or timeout
        JobStatus.CANCELLED,  # Cancelled during polling
    },
    # === Image job transitions ===
    JobStatus.PREPARING: {
        JobStatus.GENERATING,  # Image: References fetched, calling AI
        JobStatus.FAILED,      # Failed to fetch references
        JobStatus.CANCELLED,   # Cancelled during preparation
    },
    JobStatus.GENERATING: {
        JobStatus.UPLOADING,  # Image: Generation complete, uploading
        JobStatus.COMPLETED,  # ID Converter: Direct to completed (no upload needed)
        JobStatus.FAILED,     # Generation failed
        JobStatus.CANCELLED,  # Cancelled during generation
    },
    # === Common transitions ===
    JobStatus.UPLOADING: {
        JobStatus.COMPLETED,  # S3 upload success
        JobStatus.FAILED,     # S3 upload failed
        JobStatus.CANCELLED,  # Cancelled during upload (rare)
    },
    JobStatus.COMPLETED: set(),  # Terminal state
    JobStatus.FAILED: {
        JobStatus.PENDING,    # Retry - back to pending
    },
    JobStatus.CANCELLED: set(),  # Terminal state
}


class InvalidStateTransition(Exception):
    """Raised when an invalid state transition is attempted."""

    def __init__(self, current: JobStatus, target: JobStatus):
        self.current = current
        self.target = target
        super().__init__(
            f"Invalid state transition: {current.value} → {target.value}"
        )


def can_transition(current: JobStatus, target: JobStatus) -> bool:
    """
    Check if a state transition is valid.

    Args:
        current: Current job status
        target: Target job status

    Returns:
        True if transition is allowed
    """
    allowed = VALID_TRANSITIONS.get(current, set())
    return target in allowed


def validate_transition(current: JobStatus, target: JobStatus) -> None:
    """
    Validate a state transition, raising an exception if invalid.

    Args:
        current: Current job status
        target: Target job status

    Raises:
        InvalidStateTransition: If transition is not allowed
    """
    if not can_transition(current, target):
        raise InvalidStateTransition(current, target)


def is_terminal_state(status: JobStatus) -> bool:
    """
    Check if a status is a terminal state (no further transitions).

    Args:
        status: Job status to check

    Returns:
        True if status is terminal
    """
    return status in (JobStatus.COMPLETED, JobStatus.CANCELLED)


def is_active_state(status: JobStatus) -> bool:
    """
    Check if a status indicates active processing.

    Args:
        status: Job status to check

    Returns:
        True if job is actively being processed
    """
    return status in (
        JobStatus.SUBMITTED,
        JobStatus.POLLING,
        JobStatus.PREPARING,
        JobStatus.GENERATING,
        JobStatus.UPLOADING,
    )


def can_cancel(status: JobStatus) -> bool:
    """
    Check if a job in the given status can be cancelled.

    Args:
        status: Current job status

    Returns:
        True if cancellation is possible
    """
    return JobStatus.CANCELLED in VALID_TRANSITIONS.get(status, set())


def can_retry(status: JobStatus) -> bool:
    """
    Check if a job in the given status can be retried.

    Args:
        status: Current job status

    Returns:
        True if retry is possible
    """
    return status == JobStatus.FAILED


class JobStateMachine:
    """
    State machine for managing job status transitions.

    Provides logging and validation for all state changes.
    """

    def __init__(self, job_id: str, initial_status: JobStatus = JobStatus.PENDING):
        self.job_id = job_id
        self._status = initial_status

    @property
    def status(self) -> JobStatus:
        """Current job status."""
        return self._status

    def transition_to(self, target: JobStatus) -> None:
        """
        Transition to a new status.

        Args:
            target: Target status

        Raises:
            InvalidStateTransition: If transition is not allowed
        """
        validate_transition(self._status, target)

        old_status = self._status
        self._status = target

        logger.info(
            f"Job {self.job_id}: {old_status.value} → {target.value}"
        )

    def can_transition_to(self, target: JobStatus) -> bool:
        """Check if transition to target is allowed."""
        return can_transition(self._status, target)

    @property
    def is_terminal(self) -> bool:
        """Check if current status is terminal."""
        return is_terminal_state(self._status)

    @property
    def is_active(self) -> bool:
        """Check if job is actively being processed."""
        return is_active_state(self._status)

    @property
    def can_be_cancelled(self) -> bool:
        """Check if job can be cancelled."""
        return can_cancel(self._status)

    @property
    def can_be_retried(self) -> bool:
        """Check if job can be retried."""
        return can_retry(self._status)