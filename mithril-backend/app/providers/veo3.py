"""Veo 3 (Google) video generation provider."""

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

# Veo 3 API base URL
VEO3_API_BASE = "https://generativelanguage.googleapis.com/v1beta"

# Veo 3 constraints
VEO3_CONSTRAINTS = ProviderConstraints(
    durations=[4, 6, 8],
    sizes={
        "16:9": "1280x720",
        "9:16": "720x1280",
    },
    polling=PollingConfig(
        interval_ms=10000,
        max_attempts=90,
    ),
    supports_image_to_video=True,
)


class Veo3Provider(VideoProvider):
    """Google Veo 3 video generation provider."""

    @property
    def id(self) -> str:
        return "veo3"

    @property
    def name(self) -> str:
        return "Veo 3"

    @property
    def description(self) -> str:
        return "Google's Veo 3 video generation model"

    @property
    def model_name(self) -> str:
        return "veo-3.1-generate-preview"

    def get_constraints(self) -> ProviderConstraints:
        return VEO3_CONSTRAINTS

    async def submit_job(
        self,
        request: VideoSubmitRequest,
        api_key: str,
    ) -> VideoSubmitResult:
        """Submit video generation job to Veo 3."""
        # Validate request
        validation_error = self.validate_request(request)
        if validation_error:
            raise ValueError(validation_error)

        # Map duration to valid Veo 3 duration
        duration = self.map_duration(request.duration)

        # Build request body
        request_body = {
            "model": self.model_name,
            "prompt": request.prompt,
            "config": {
                "aspectRatio": request.aspect_ratio,
                "durationSeconds": duration,
                "personGeneration": "allow_adult",
            },
        }

        # Add image if provided (image-to-video)
        if request.image_base64 or request.image_url:
            resized_base64 = await prepare_image_for_provider(
                request.image_base64,
                request.image_url,
                request.aspect_ratio,
            )
            if resized_base64:
                request_body["image"] = {
                    "imageBytes": resized_base64,
                    "mimeType": "image/jpeg",
                }

        logger.info(f"[veo3] Submitting video generation job...")
        logger.info(f"[veo3] Model: {self.model_name}")
        logger.info(f"[veo3] Duration: {duration} seconds")
        logger.info(f"[veo3] Aspect ratio: {request.aspect_ratio}")
        logger.info(f"[veo3] Has image: {bool(request.image_base64 or request.image_url)}")

        # Submit to Veo 3 API
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{VEO3_API_BASE}/models/{self.model_name}:generateVideos",
                params={"key": api_key},
                json=request_body,
                headers={"Content-Type": "application/json"},
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
                logger.error(f"[veo3] API Error: {response_data}")
                raise Exception(error_msg)

            # Get operation name (job ID)
            job_id = (
                response_data.get("name")
                or response_data.get("operationName")
                or response_data.get("id")
                or response_data.get("operationId")
            )

            if not job_id:
                logger.error(f"[veo3] Response keys: {response_data.keys()}")
                raise Exception("Failed to get operation ID from Veo 3 response")

            logger.info(f"[veo3] Job submitted successfully. Operation name: {job_id}")
            return VideoSubmitResult(job_id=job_id, status="pending")

    async def check_status(
        self,
        job_id: str,
        api_key: str,
    ) -> VideoStatusResult:
        """Check the status of a Veo 3 video generation job."""
        logger.info(f"[veo3] Checking status for operation: {job_id}")

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{VEO3_API_BASE}/{job_id}",
                params={"key": api_key},
                headers={"Content-Type": "application/json"},
            )

            if response.status_code == 404:
                raise Exception("Job not found. It may have expired.")

            response_data = response.json()

            if not response.is_success:
                error_msg = (
                    response_data.get("error", {}).get("message")
                    or f"Failed to check operation status: {response.status_code}"
                )
                logger.error(f"[veo3] REST API error: {response.status_code} {response_data}")
                raise Exception(error_msg)

            logger.debug(f"[veo3] Operation response: {response_data}")

            # Determine status
            if response_data.get("done"):
                if response_data.get("error"):
                    status = "failed"
                else:
                    status = "completed"
            else:
                status = "running"

            logger.info(f"[veo3] Operation status: {status}, done: {response_data.get('done')}")

            result = VideoStatusResult(job_id=job_id, status=status)

            # If failed, include error message
            if status == "failed":
                result.error = (
                    response_data.get("error", {}).get("message")
                    or "Video generation failed"
                )
                logger.error(f"[veo3] Video generation failed: {result.error}")

            return result

    async def download_video(
        self,
        job_id: str,
        api_key: str,
    ) -> bytes:
        """Download completed video from Veo 3."""
        # First, get the operation to find the video URI
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{VEO3_API_BASE}/{job_id}",
                params={"key": api_key},
                headers={"Content-Type": "application/json"},
            )

            if not response.is_success:
                raise Exception(f"Failed to get operation: {response.status_code}")

            operation = response.json()

            # Extract video URI from response
            generated_samples = (
                operation.get("response", {})
                .get("generateVideoResponse", {})
                .get("generatedSamples", [])
            )

            if not generated_samples:
                raise Exception("No generated samples in response")

            video_uri = generated_samples[0].get("video", {}).get("uri")
            if not video_uri:
                raise Exception("No video URI in response")

            logger.info(f"[veo3] Downloading video from: {video_uri}")

            # Download the video
            # Add API key if not already in URL
            download_url = (
                video_uri if "key=" in video_uri else f"{video_uri}&key={api_key}"
            )

        async with httpx.AsyncClient(timeout=120.0) as client:
            video_response = await client.get(download_url)

            if not video_response.is_success:
                raise Exception(
                    f"Failed to download video: {video_response.status_code}"
                )

            logger.info(f"[veo3] Video downloaded, size: {len(video_response.content)} bytes")
            return video_response.content


# Create singleton instance
veo3_provider = Veo3Provider()