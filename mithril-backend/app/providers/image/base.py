"""Abstract base class for image providers."""

from abc import ABC, abstractmethod
from typing import Literal

from pydantic import BaseModel


class ImageProviderConstraints(BaseModel):
    """Constraints for an image generation provider."""

    aspect_ratios: list[Literal["16:9", "9:16", "1:1"]] = ["16:9", "9:16", "1:1"]
    max_reference_images: int = 10
    supports_reference_images: bool = True


class ImageGenerateRequest(BaseModel):
    """Request model for image generation."""

    prompt: str
    style_prompt: str | None = None
    reference_images: list[bytes] = []  # Raw image bytes
    aspect_ratio: Literal["16:9", "9:16", "1:1"] = "16:9"


class ImageProvider(ABC):
    """
    Abstract base class for image generation providers.

    Image generation is typically synchronous (unlike video),
    so there's no need for polling methods.
    """

    @property
    @abstractmethod
    def id(self) -> str:
        """Provider ID (e.g., 'gemini')."""
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
        """Model name/version."""
        ...

    @abstractmethod
    def get_constraints(self) -> ImageProviderConstraints:
        """Get provider constraints."""
        ...

    def validate_request(self, request: ImageGenerateRequest) -> str | None:
        """
        Validate an image generation request.

        Returns:
            None if valid, or an error message string if invalid.
        """
        constraints = self.get_constraints()

        if not request.prompt and not request.reference_images:
            return "Prompt or reference images are required"

        if request.aspect_ratio not in constraints.aspect_ratios:
            return f"Invalid aspect ratio: {request.aspect_ratio}"

        if len(request.reference_images) > constraints.max_reference_images:
            return f"Too many reference images (max {constraints.max_reference_images})"

        if request.reference_images and not constraints.supports_reference_images:
            return "Reference images are not supported by this provider"

        return None

    @abstractmethod
    async def generate_image(
        self,
        request: ImageGenerateRequest,
        api_key: str,
    ) -> bytes:
        """
        Generate an image.

        Args:
            request: Image generation request
            api_key: Provider API key

        Returns:
            Image bytes (PNG or JPEG)
        """
        ...
