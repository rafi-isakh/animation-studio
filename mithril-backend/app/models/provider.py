"""Provider request/response models."""

from typing import Literal

from pydantic import BaseModel


AspectRatio = Literal["16:9", "9:16"]


class PollingConfig(BaseModel):
    """Polling configuration for status checks."""

    interval_ms: int
    max_attempts: int


class ProviderConstraints(BaseModel):
    """Provider-specific constraints and configuration."""

    durations: list[int]
    sizes: dict[str, str]  # AspectRatio -> "1280x720"
    polling: PollingConfig
    supports_image_to_video: bool = True


class VideoSubmitRequest(BaseModel):
    """Request to submit a video generation job."""

    prompt: str
    image_base64: str | None = None
    image_url: str | None = None  # Alternative to base64
    image_end_url: str | None = None  # Optional end frame
    duration: int
    aspect_ratio: AspectRatio


class VideoSubmitResult(BaseModel):
    """Result of submitting a video generation job."""

    job_id: str
    status: Literal["pending"] = "pending"


class VideoStatusResult(BaseModel):
    """Result of checking video generation status."""

    job_id: str
    status: Literal["pending", "running", "completed", "failed"]
    video_url: str | None = None
    s3_file_name: str | None = None
    error: str | None = None