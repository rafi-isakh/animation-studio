"""Sora (OpenAI) video generation provider."""

import asyncio
import logging

import httpx

from app.models.provider import (
    PollingConfig,
    ProviderConstraints,
    VideoSubmitRequest,
    VideoSubmitResult,
    VideoStatusResult,
)
from app.providers.base import VideoProvider
from app.services.image_processor import prepare_image_for_provider

logger = logging.getLogger(__name__)

# Limit concurrent Sora API calls per worker to avoid rate-limit errors
_SORA_SEMAPHORE = asyncio.Semaphore(3)

# Sora API endpoints
SORA_API_BASE = "https://api.openai.com/v1/videos"

# Sora constraints
SORA_CONSTRAINTS = ProviderConstraints(
    durations=[4, 8, 12],
    sizes={
        "16:9": "1280x720",
        "9:16": "720x1280",
    },
    polling=PollingConfig(
        interval_ms=5000,
        max_attempts=120,
    ),
    supports_image_to_video=True,
)


class SoraProvider(VideoProvider):
    """OpenAI Sora video generation provider."""

    @property
    def id(self) -> str:
        return "sora"

    @property
    def name(self) -> str:
        return "Sora"

    @property
    def description(self) -> str:
        return "OpenAI's Sora video generation model"

    @property
    def model_name(self) -> str:
        return "sora-2"

    def get_constraints(self) -> ProviderConstraints:
        return SORA_CONSTRAINTS

    async def submit_job(
        self,
        request: VideoSubmitRequest,
        api_key: str,
    ) -> VideoSubmitResult:
        """Submit video generation job to Sora."""
        # Validate request
        validation_error = self.validate_request(request)
        if validation_error:
            raise ValueError(validation_error)

        # Map duration to valid Sora duration
        duration = self.map_duration(request.duration)

        # Get size for aspect ratio
        size = SORA_CONSTRAINTS.sizes[request.aspect_ratio]

        # Prepare multipart form data
        data = {
            "model": self.model_name,
            "prompt": request.prompt,
            "seconds": str(duration),
            "size": size,
        }

        files = {}

        # Add start image if provided (image-to-video)
        if request.image_base64 or request.image_url:
            resized_base64 = await prepare_image_for_provider(
                request.image_base64,
                request.image_url,
                request.aspect_ratio,
            )
            if resized_base64:
                import base64
                image_bytes = base64.b64decode(resized_base64)
                files["input_reference"] = ("input.jpg", image_bytes, "image/jpeg")

        # Submit to Sora API
        async with _SORA_SEMAPHORE:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    SORA_API_BASE,
                    headers={"Authorization": f"Bearer {api_key}"},
                    data=data,
                    files=files if files else None,
                )

                if response.status_code == 429:
                    raise Exception("Rate limit exceeded. Please try again later.")

                if response.status_code == 402:
                    raise Exception("Quota exceeded. Please check your API usage.")

                response_data = response.json()

                if not response.is_success:
                    error_msg = (
                        response_data.get("error", {}).get("message")
                        or response_data.get("error")
                        or "Failed to create video job"
                    )
                    logger.error(f"Sora API Error: {response_data}")
                    raise Exception(error_msg)

                job_id = response_data.get("id")
                if not job_id:
                    raise Exception("No job ID returned from Sora API")

                logger.info(f"Sora job submitted: {job_id}")
                return VideoSubmitResult(job_id=job_id, status="pending")

    async def check_status(
        self,
        job_id: str,
        api_key: str,
    ) -> VideoStatusResult:
        """Check the status of a Sora video generation job."""
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{SORA_API_BASE}/{job_id}",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
            )

            if response.status_code == 404:
                raise Exception("Job not found. It may have expired.")

            response_data = response.json()

            if not response.is_success:
                error_msg = (
                    response_data.get("error", {}).get("message")
                    or response_data.get("error")
                    or "Failed to check job status"
                )
                logger.error(f"Sora Status API Error: {response_data}")
                raise Exception(error_msg)

            # Map Sora status to our status format
            sora_status = response_data.get("status", "")
            status = self._map_status(sora_status)

            result = VideoStatusResult(job_id=job_id, status=status)

            # Include error message if failed
            if status == "failed":
                result.error = (
                    response_data.get("error", {}).get("message")
                    or response_data.get("failure_reason")
                    or "Video generation failed"
                )

            return result

    async def download_video(
        self,
        job_id: str,
        api_key: str,
    ) -> bytes:
        """Download completed video from Sora."""
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.get(
                f"{SORA_API_BASE}/{job_id}/content",
                headers={"Authorization": f"Bearer {api_key}"},
            )

            if not response.is_success:
                raise Exception(
                    f"Failed to download video from OpenAI: {response.status_code}"
                )

            logger.info(f"Downloaded video for job {job_id}")
            return response.content

    def _map_status(
        self, sora_status: str
    ) -> str:
        """Map Sora status to our standard status."""
        status_map = {
            "pending": "pending",
            "queued": "pending",
            "in_progress": "running",
            "processing": "running",
            "completed": "completed",
            "succeeded": "completed",
            "failed": "failed",
            "cancelled": "failed",
        }
        return status_map.get(sora_status, "pending")


# Create singleton instance
sora_provider = SoraProvider()