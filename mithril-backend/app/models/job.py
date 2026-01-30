"""Job models for the video and image generation queue."""

from datetime import datetime
from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field


class JobType(str, Enum):
    """Job type enumeration."""

    VIDEO = "video"
    IMAGE = "image"
    BACKGROUND = "background"


class JobStatus(str, Enum):
    """Job status enumeration."""

    PENDING = "pending"
    SUBMITTED = "submitted"  # Video: submitted to provider
    POLLING = "polling"  # Video: polling provider for completion
    PREPARING = "preparing"  # Image: fetching reference images from S3
    GENERATING = "generating"  # Image: calling AI provider
    UPLOADING = "uploading"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ErrorCode(str, Enum):
    """Error code enumeration."""

    RATE_LIMIT = "rate_limit"
    QUOTA_EXCEEDED = "quota_exceeded"
    INVALID_REQUEST = "invalid_request"
    PROVIDER_ERROR = "provider_error"
    TIMEOUT = "timeout"
    INTERNAL_ERROR = "internal_error"
    CANCELLED = "cancelled"


class JobError(BaseModel):
    """Error information for failed jobs."""

    code: ErrorCode
    message: str
    retryable: bool = False
    retry_after: int | None = None  # Seconds to wait before retry


class JobSubmitRequest(BaseModel):
    """Request model for submitting a video generation job."""

    project_id: str
    scene_index: int
    clip_index: int
    provider_id: Literal["sora", "veo3"]
    prompt: str
    image_url: str | None = None
    duration: int = Field(ge=4, le=12)
    aspect_ratio: Literal["16:9", "9:16"]
    api_key: str | None = None  # Custom API key (optional)


class JobSubmitResponse(BaseModel):
    """Response model after submitting a job."""

    job_id: str
    status: JobStatus = JobStatus.PENDING
    created_at: datetime


class JobStatusResponse(BaseModel):
    """Response model for job status queries."""

    job_id: str
    status: JobStatus
    progress: float = 0.0
    provider_job_id: str | None = None
    video_url: str | None = None
    s3_file_name: str | None = None
    error: JobError | None = None
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None = None


class JobDocument(BaseModel):
    """Firestore document model for job_queue collection."""

    id: str
    type: JobType = JobType.VIDEO  # Job type (video or image)
    project_id: str
    scene_index: int
    clip_index: int
    provider_id: str

    # Request parameters
    prompt: str
    image_url: str | None = None  # Video: source image for video generation
    duration: int | None = None  # Video only
    aspect_ratio: str
    api_key_hash: str | None = None  # Hashed for audit

    # Image-specific fields
    frame_id: str | None = None
    frame_label: str | None = None
    style_prompt: str | None = None
    reference_urls: list[str] = []  # S3 URLs for reference images (backgrounds, characters)

    # Background-specific fields (for type=BACKGROUND)
    bg_id: str | None = None  # Background ID
    bg_angle: str | None = None  # Angle: "Front View", "Worm View", etc.
    bg_name: str | None = None  # Background name for display

    # Status tracking
    status: JobStatus = JobStatus.PENDING
    provider_job_id: str | None = None
    progress: float = 0.0

    # Results
    video_url: str | None = None  # Video result
    image_url: str | None = None  # Image result
    s3_file_name: str | None = None

    # Error handling
    error_code: str | None = None
    error_message: str | None = None
    error_retryable: bool | None = None
    retry_count: int = 0
    max_retries: int = 3

    # Cancellation
    cancellation_requested: bool = False
    cancelled_at: datetime | None = None

    # Cost tracking
    cost_usd: float = 0.0

    # Timestamps
    created_at: datetime
    updated_at: datetime
    submitted_at: datetime | None = None
    completed_at: datetime | None = None

    # Metadata
    user_id: str
    batch_id: str | None = None
    worker_id: str | None = None


class BatchSubmitRequest(BaseModel):
    """Request model for submitting multiple jobs."""

    project_id: str
    jobs: list[JobSubmitRequest]
    api_key: str | None = None


class BatchSubmitResponse(BaseModel):
    """Response model for batch job submission."""

    batch_id: str
    jobs: list[JobSubmitResponse]
    total_count: int
    status: str = "submitted"


# ============================================================================
# Image Job Models
# ============================================================================


class ImageJobSubmitRequest(BaseModel):
    """Request model for submitting an image generation job."""

    project_id: str
    frame_id: str
    scene_index: int
    clip_index: int
    frame_label: str
    prompt: str
    style_prompt: str | None = None
    reference_urls: list[str] = []  # Pre-uploaded S3 URLs for reference images
    aspect_ratio: Literal["16:9", "9:16", "1:1"] = "16:9"
    api_key: str | None = None  # Custom API key (optional)


class ImageJobStatusResponse(BaseModel):
    """Response model for image job status queries."""

    job_id: str
    status: JobStatus
    progress: float = 0.0
    image_url: str | None = None
    s3_file_name: str | None = None
    error: JobError | None = None
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None = None


class ImageBatchSubmitRequest(BaseModel):
    """Request model for submitting multiple image jobs."""

    project_id: str
    jobs: list[ImageJobSubmitRequest]
    api_key: str | None = None


class ImageBatchSubmitResponse(BaseModel):
    """Response model for batch image job submission."""

    batch_id: str
    jobs: list[JobSubmitResponse]
    total_count: int
    status: str = "submitted"


# ============================================================================
# Background Job Models
# ============================================================================


class BgJobSubmitRequest(BaseModel):
    """Request model for submitting a background angle generation job."""

    project_id: str
    bg_id: str
    bg_angle: str  # "Front View", "Worm View", etc.
    bg_name: str
    prompt: str
    aspect_ratio: Literal["16:9", "9:16", "1:1"] = "16:9"
    api_key: str | None = None


class BgJobStatusResponse(BaseModel):
    """Response model for background job status queries."""

    job_id: str
    bg_id: str
    bg_angle: str
    bg_name: str
    status: JobStatus
    progress: float = 0.0
    image_url: str | None = None
    s3_file_name: str | None = None
    error: JobError | None = None
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None = None


class BgBatchSubmitRequest(BaseModel):
    """Request model for submitting multiple background jobs."""

    project_id: str
    jobs: list[BgJobSubmitRequest]
    api_key: str | None = None  # Batch-level fallback


class BgBatchSubmitResponse(BaseModel):
    """Response model for batch background job submission."""

    batch_id: str
    jobs: list[JobSubmitResponse]
    total_count: int
    status: str = "submitted"