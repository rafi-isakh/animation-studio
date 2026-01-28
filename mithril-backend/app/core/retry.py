"""Retry logic with exponential backoff for video generation jobs."""

import asyncio
import logging
import random
from dataclasses import dataclass
from typing import Callable, TypeVar, Awaitable

from app.core.errors import (
    ErrorCode,
    ERROR_RETRY_CONFIG,
    RETRYABLE_ERRORS,
    VideoJobError,
)

logger = logging.getLogger(__name__)

T = TypeVar("T")


@dataclass
class RetryConfig:
    """Configuration for retry behavior."""

    max_retries: int = 3
    base_delay: float = 10.0  # seconds
    max_delay: float = 300.0  # seconds
    jitter: float = 5.0  # seconds of random jitter


def get_retry_config(error_code: ErrorCode) -> RetryConfig:
    """
    Get retry configuration for a specific error code.

    Args:
        error_code: The error code

    Returns:
        RetryConfig for this error type
    """
    config = ERROR_RETRY_CONFIG.get(error_code, {})
    return RetryConfig(
        max_retries=config.get("max_retries", 3),
        base_delay=config.get("base_delay", 10),
        max_delay=config.get("max_delay", 300),
    )


def calculate_backoff(
    attempt: int,
    config: RetryConfig,
) -> float:
    """
    Calculate exponential backoff delay with jitter.

    Formula: min(base_delay * 2^attempt + random_jitter, max_delay)

    Args:
        attempt: Current attempt number (0-indexed)
        config: Retry configuration

    Returns:
        Delay in seconds
    """
    exponential_delay = config.base_delay * (2 ** attempt)
    jitter = random.uniform(0, config.jitter)
    delay = min(exponential_delay + jitter, config.max_delay)

    return delay


def should_retry(
    error: VideoJobError,
    attempt: int,
    max_retries: int | None = None,
) -> bool:
    """
    Determine if a job should be retried based on error and attempt count.

    Args:
        error: The error that occurred
        attempt: Current attempt number (0-indexed)
        max_retries: Override max retries (uses error config if None)

    Returns:
        True if job should be retried
    """
    # Non-retryable errors never retry
    if error.code not in RETRYABLE_ERRORS:
        return False

    # Get max retries from config or parameter
    if max_retries is None:
        config = get_retry_config(error.code)
        max_retries = config.max_retries

    # Check if we've exceeded max retries
    return attempt < max_retries


async def with_retry(
    func: Callable[[], Awaitable[T]],
    config: RetryConfig | None = None,
    on_retry: Callable[[int, Exception, float], Awaitable[None]] | None = None,
) -> T:
    """
    Execute an async function with retry logic.

    Args:
        func: Async function to execute
        config: Retry configuration (uses defaults if None)
        on_retry: Optional callback called before each retry with (attempt, error, delay)

    Returns:
        Result of the function

    Raises:
        The last exception if all retries are exhausted
    """
    if config is None:
        config = RetryConfig()

    last_error: Exception | None = None

    for attempt in range(config.max_retries + 1):
        try:
            return await func()
        except Exception as e:
            last_error = e

            # Classify the error
            if isinstance(e, VideoJobError):
                video_error = e
            else:
                video_error = VideoJobError.provider_error(str(e))

            # Check if we should retry
            if not should_retry(video_error, attempt, config.max_retries):
                logger.warning(
                    f"Not retrying: {video_error.code.value} - {video_error.message}"
                )
                raise

            # Calculate delay
            delay = calculate_backoff(attempt, config)

            logger.info(
                f"Retry {attempt + 1}/{config.max_retries} after {delay:.1f}s: {e}"
            )

            # Call retry callback if provided
            if on_retry:
                await on_retry(attempt, e, delay)

            # Wait before retry
            await asyncio.sleep(delay)

    # Should never reach here, but just in case
    if last_error:
        raise last_error

    raise RuntimeError("Retry loop completed without result or error")


class RetryState:
    """
    Track retry state for a job.

    Used to persist retry information across task executions.
    """

    def __init__(
        self,
        max_retries: int = 3,
        retry_count: int = 0,
    ):
        self.max_retries = max_retries
        self.retry_count = retry_count
        self.failure_history: list[dict] = []

    def record_failure(
        self,
        error_code: str,
        error_message: str,
    ) -> None:
        """Record a failure attempt."""
        from datetime import datetime, timezone

        self.failure_history.append({
            "attempt": self.retry_count + 1,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "error_code": error_code,
            "error_message": error_message,
        })
        self.retry_count += 1

    def can_retry(self) -> bool:
        """Check if more retries are allowed."""
        return self.retry_count < self.max_retries

    def get_next_delay(self, error_code: ErrorCode) -> float:
        """Get the delay before the next retry."""
        config = get_retry_config(error_code)
        return calculate_backoff(self.retry_count, config)

    @property
    def attempts_remaining(self) -> int:
        """Number of retry attempts remaining."""
        return max(0, self.max_retries - self.retry_count)