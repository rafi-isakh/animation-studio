"""Veo 3 (Google) video generation provider using google-genai SDK."""

import asyncio
import logging

import httpx
from google import genai

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

# Limit concurrent Veo3 API calls per worker to avoid rate-limit errors
_VEO3_SEMAPHORE = asyncio.Semaphore(2)

# Veo 3 API base URL (for status polling)
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
        return "veo-3.1-fast-generate-preview"

    def get_constraints(self) -> ProviderConstraints:
        return VEO3_CONSTRAINTS

    async def submit_job(
        self,
        request: VideoSubmitRequest,
        api_key: str,
    ) -> VideoSubmitResult:
        """Submit video generation job to Veo 3 using SDK."""
        # Validate request
        validation_error = self.validate_request(request)
        if validation_error:
            raise ValueError(validation_error)

        # Map duration to valid Veo 3 duration
        duration = self.map_duration(request.duration)

        logger.info(f"[veo3] Submitting video generation job...")
        logger.info(f"[veo3] Model: {self.model_name}")
        logger.info(f"[veo3] Duration: {duration} seconds")
        logger.info(f"[veo3] Aspect ratio: {request.aspect_ratio}")
        logger.info(f"[veo3] Has start image: {bool(request.image_base64 or request.image_url)}")
        logger.info(f"[veo3] Has end image: {bool(request.image_end_url)}")

        # Initialize the SDK client
        client = genai.Client(api_key=api_key)

        # Build config
        config = {
            "aspect_ratio": request.aspect_ratio,
            "duration_seconds": duration,
            "person_generation": "allow_adult",
        }

        # Prepare start image if provided
        image_data = None
        if request.image_base64 or request.image_url:
            resized_base64 = await prepare_image_for_provider(
                request.image_base64,
                request.image_url,
                request.aspect_ratio,
            )
            if resized_base64:
                image_data = {
                    "image_bytes": resized_base64,
                    "mime_type": "image/jpeg",
                }

        # Prepare end image if provided
        image_end_data = None
        if request.image_end_url:
            resized_end_base64 = await prepare_image_for_provider(
                None,
                request.image_end_url,
                request.aspect_ratio,
            )
            if resized_end_base64:
                image_end_data = {
                    "image_bytes": resized_end_base64,
                    "mime_type": "image/jpeg",
                }

        logger.info(f"[veo3] image_data present: {image_data is not None}")
        logger.info(f"[veo3] image_end_data present: {image_end_data is not None}")
        logger.info(f"[veo3] config before submit: { {k: v for k, v in config.items() if k != 'last_frame'} }")

        try:
            # Use the SDK to generate video (run sync SDK in thread pool)
            def _submit():
                kwargs = {
                    "model": self.model_name,
                    "prompt": request.prompt,
                    "config": config,
                }
                if image_data:
                    kwargs["image"] = image_data
                    # lastFrame requires image (start frame) — camelCase matches REST API
                    if image_end_data:
                        config["lastFrame"] = image_end_data
                logger.info(f"[veo3] generate_videos kwargs keys: {list(kwargs.keys())}")
                logger.info(f"[veo3] config keys: {list(config.keys())}")
                return client.models.generate_videos(**kwargs)

            async with _VEO3_SEMAPHORE:
                operation = await asyncio.to_thread(_submit)

            logger.info(f"[veo3] Operation response: {operation}")

            # Get the operation name (job ID)
            job_id = getattr(operation, 'name', None) or getattr(operation, 'operation_name', None)

            if not job_id:
                # Try to get from dict if it's a dict-like object
                if hasattr(operation, '__getitem__'):
                    job_id = operation.get('name') or operation.get('operationName')

            if not job_id:
                logger.error(f"[veo3] Operation object: {operation}")
                raise Exception("Failed to get operation ID from Veo 3 response")

            logger.info(f"[veo3] Job submitted successfully. Operation name: {job_id}")
            return VideoSubmitResult(job_id=job_id, status="pending")

        except Exception as e:
            error_msg = str(e)
            logger.error(f"[veo3] Exception type: {type(e).__name__}")
            logger.error(f"[veo3] Full error: {e}")
            if hasattr(e, '__dict__'):
                logger.error(f"[veo3] Error attrs: {e.__dict__}")
            if "rate limit" in error_msg.lower() or "429" in error_msg:
                raise Exception("Rate limit exceeded. Please try again later.")
            if "quota" in error_msg.lower() or "402" in error_msg:
                raise Exception("Quota exceeded. Please check your API usage.")
            logger.error(f"[veo3] Error submitting job: {e}")
            raise

    async def check_status(
        self,
        job_id: str,
        api_key: str,
    ) -> VideoStatusResult:
        """Check the status of a Veo 3 video generation job."""
        logger.info(f"[veo3] Checking status for operation: {job_id}")

        # Use REST API to poll operation status (SDK polling is unreliable)
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

        async with httpx.AsyncClient(timeout=120.0, follow_redirects=True) as client:
            video_response = await client.get(download_url)

            if not video_response.is_success:
                raise Exception(
                    f"Failed to download video: {video_response.status_code}"
                )

            logger.info(f"[veo3] Video downloaded, size: {len(video_response.content)} bytes")
            return video_response.content


# Create singleton instance
veo3_provider = Veo3Provider()