"""Error types and classification for video generation jobs."""

from enum import Enum
from typing import Optional

from pydantic import BaseModel


class ErrorCode(str, Enum):
    """Error code enumeration for job failures."""

    # Retryable errors
    RATE_LIMIT = "rate_limit"           # Provider rate limit (429)
    PROVIDER_ERROR = "provider_error"   # Transient provider error (502, 503)
    TIMEOUT = "timeout"                 # Operation timed out
    INTERNAL_ERROR = "internal_error"   # Internal server error

    # Non-retryable errors
    QUOTA_EXCEEDED = "quota_exceeded"   # API quota exhausted (402)
    INVALID_REQUEST = "invalid_request" # Bad request parameters (400)
    CANCELLED = "cancelled"             # User cancelled the job
    NOT_FOUND = "not_found"             # Job not found (404)


# Error classification
RETRYABLE_ERRORS = {
    ErrorCode.RATE_LIMIT,
    ErrorCode.PROVIDER_ERROR,
    ErrorCode.TIMEOUT,
    ErrorCode.INTERNAL_ERROR,
}

NON_RETRYABLE_ERRORS = {
    ErrorCode.QUOTA_EXCEEDED,
    ErrorCode.INVALID_REQUEST,
    ErrorCode.CANCELLED,
    ErrorCode.NOT_FOUND,
}

# Default retry configuration per error type
ERROR_RETRY_CONFIG = {
    ErrorCode.RATE_LIMIT: {
        "max_retries": 5,
        "base_delay": 60,   # 60 seconds
        "max_delay": 600,   # 10 minutes
    },
    ErrorCode.PROVIDER_ERROR: {
        "max_retries": 3,
        "base_delay": 30,
        "max_delay": 300,
    },
    ErrorCode.TIMEOUT: {
        "max_retries": 2,
        "base_delay": 60,
        "max_delay": 120,
    },
    ErrorCode.INTERNAL_ERROR: {
        "max_retries": 3,
        "base_delay": 10,
        "max_delay": 60,
    },
}

# HTTP status to error code mapping
HTTP_STATUS_TO_ERROR = {
    400: ErrorCode.INVALID_REQUEST,
    401: ErrorCode.INVALID_REQUEST,
    402: ErrorCode.QUOTA_EXCEEDED,
    403: ErrorCode.INVALID_REQUEST,
    404: ErrorCode.NOT_FOUND,
    429: ErrorCode.RATE_LIMIT,
    500: ErrorCode.INTERNAL_ERROR,
    502: ErrorCode.PROVIDER_ERROR,
    503: ErrorCode.PROVIDER_ERROR,
    504: ErrorCode.TIMEOUT,
}


class JobError(BaseModel):
    """Structured error information for failed jobs."""

    code: ErrorCode
    message: str
    retryable: bool
    retry_after: Optional[int] = None  # Seconds to wait before retry

    @classmethod
    def from_code(cls, code: ErrorCode, message: str) -> "JobError":
        """Create a JobError from an error code."""
        return cls(
            code=code,
            message=message,
            retryable=code in RETRYABLE_ERRORS,
            retry_after=ERROR_RETRY_CONFIG.get(code, {}).get("base_delay"),
        )

    @classmethod
    def from_http_status(cls, status: int, message: str) -> "JobError":
        """Create a JobError from an HTTP status code."""
        code = HTTP_STATUS_TO_ERROR.get(status, ErrorCode.PROVIDER_ERROR)
        return cls.from_code(code, message)


class VideoJobError(Exception):
    """Exception for video job processing errors."""

    def __init__(self, code: ErrorCode, message: str):
        self.code = code
        self.message = message
        self.retryable = code in RETRYABLE_ERRORS
        super().__init__(message)

    def to_job_error(self) -> JobError:
        """Convert to JobError model."""
        return JobError.from_code(self.code, self.message)

    @classmethod
    def rate_limit(cls, message: str = "Rate limit exceeded") -> "VideoJobError":
        return cls(ErrorCode.RATE_LIMIT, message)

    @classmethod
    def quota_exceeded(cls, message: str = "API quota exceeded") -> "VideoJobError":
        return cls(ErrorCode.QUOTA_EXCEEDED, message)

    @classmethod
    def invalid_request(cls, message: str) -> "VideoJobError":
        return cls(ErrorCode.INVALID_REQUEST, message)

    @classmethod
    def provider_error(cls, message: str) -> "VideoJobError":
        return cls(ErrorCode.PROVIDER_ERROR, message)

    @classmethod
    def timeout(cls, message: str = "Operation timed out") -> "VideoJobError":
        return cls(ErrorCode.TIMEOUT, message)

    @classmethod
    def cancelled(cls, message: str = "Job was cancelled") -> "VideoJobError":
        return cls(ErrorCode.CANCELLED, message)

    @classmethod
    def internal(cls, message: str) -> "VideoJobError":
        return cls(ErrorCode.INTERNAL_ERROR, message)


def classify_exception(exc: Exception) -> VideoJobError:
    """
    Classify a generic exception into a VideoJobError.

    Args:
        exc: The exception to classify

    Returns:
        Appropriate VideoJobError
    """
    message = str(exc)
    lower_message = message.lower()

    # Check for rate limit indicators
    if "rate limit" in lower_message or "rate_limit" in lower_message:
        return VideoJobError.rate_limit(message)

    # Check for quota indicators
    if "quota" in lower_message or "insufficient" in lower_message:
        return VideoJobError.quota_exceeded(message)

    # Check for timeout indicators
    if "timeout" in lower_message or "timed out" in lower_message:
        return VideoJobError.timeout(message)

    # Check for not found
    if "not found" in lower_message or "404" in message:
        return VideoJobError(ErrorCode.NOT_FOUND, message)

    # Default to provider error (retryable)
    return VideoJobError.provider_error(message)