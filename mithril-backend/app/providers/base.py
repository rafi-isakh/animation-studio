"""Abstract base class for video providers."""

from abc import ABC, abstractmethod

from app.models.provider import (
    ProviderConstraints,
    VideoSubmitRequest,
    VideoSubmitResult,
    VideoStatusResult,
)


class VideoProvider(ABC):
    """
    Abstract base class for video generation providers.

    All providers (Sora, Veo3, etc.) must implement this interface.
    """

    @property
    @abstractmethod
    def id(self) -> str:
        """Provider ID (e.g., 'sora', 'veo3')."""
        ...

    @property
    @abstractmethod
    def name(self) -> str:
        """Human-readable provider name."""
        ...

    @property
    @abstractmethod
    def description(self) -> str:
        """Provider description."""
        ...

    @property
    @abstractmethod
    def model_name(self) -> str:
        """Model name/version (e.g., 'sora-2', 'veo-3.1')."""
        ...

    @abstractmethod
    def get_constraints(self) -> ProviderConstraints:
        """Get provider constraints (durations, sizes, polling config)."""
        ...

    def validate_request(self, request: VideoSubmitRequest) -> str | None:
        """
        Validate a video generation request.

        Returns:
            None if valid, or an error message string if invalid.
        """
        constraints = self.get_constraints()

        if not request.prompt:
            return "Prompt is required"

        if request.aspect_ratio not in constraints.sizes:
            return f"Invalid aspect ratio: {request.aspect_ratio}"

        # Duration will be mapped, so just check it's positive
        if request.duration <= 0:
            return "Duration must be positive"

        return None

    def map_duration(self, requested_duration: int) -> int:
        """
        Map a requested duration to a valid provider duration.

        Returns the closest supported duration.
        """
        constraints = self.get_constraints()
        durations = constraints.durations

        if requested_duration in durations:
            return requested_duration

        # Find closest duration
        return min(durations, key=lambda d: abs(d - requested_duration))

    @abstractmethod
    async def submit_job(
        self,
        request: VideoSubmitRequest,
        api_key: str,
    ) -> VideoSubmitResult:
        """
        Submit a video generation job to the provider.

        Args:
            request: Video generation request
            api_key: Provider API key

        Returns:
            VideoSubmitResult with job ID
        """
        ...

    @abstractmethod
    async def check_status(
        self,
        job_id: str,
        api_key: str,
    ) -> VideoStatusResult:
        """
        Check the status of a video generation job.

        Args:
            job_id: Provider's job ID
            api_key: Provider API key

        Returns:
            VideoStatusResult with current status
        """
        ...

    @abstractmethod
    async def download_video(
        self,
        job_id: str,
        api_key: str,
    ) -> bytes:
        """
        Download the completed video from the provider.

        Args:
            job_id: Provider's job ID
            api_key: Provider API key

        Returns:
            Video file bytes
        """
        ...