"""xAI Grok image-to-video generation provider."""

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

logger = logging.getLogger(__name__)

XAI_VIDEO_MODEL = "grok-imagine-video"

XAI_VIDEO_CONSTRAINTS = ProviderConstraints(
    durations=[4, 8],
    sizes={
        "16:9": "1280x720",
        "9:16": "720x1280",
    },
    polling=PollingConfig(
        interval_ms=5000,
        max_attempts=120,  # 10 min max
    ),
    supports_image_to_video=True,
)


class XAIVideoProvider(VideoProvider):
    """xAI Grok image-to-video provider."""

    @property
    def id(self) -> str:
        return "grok_i2v"

    @property
    def name(self) -> str:
        return "Grok Aurora"

    @property
    def description(self) -> str:
        return "xAI Grok image-to-video model"

    @property
    def model_name(self) -> str:
        return XAI_VIDEO_MODEL

    def get_constraints(self) -> ProviderConstraints:
        return XAI_VIDEO_CONSTRAINTS

    async def submit_job(
        self,
        request: VideoSubmitRequest,
        api_key: str,
    ) -> VideoSubmitResult:
        """Submit an image-to-video job to xAI."""
        import xai_sdk

        validation_error = self.validate_request(request)
        if validation_error:
            raise ValueError(validation_error)

        duration = self.map_duration(request.duration)
        image_url = self._resolve_image_url(request)

        client = xai_sdk.Client(api_key=api_key)

        logger.info(
            f"[XAI-VIDEO] Starting generation, model={XAI_VIDEO_MODEL}, "
            f"duration={duration}s, aspect_ratio={request.aspect_ratio}"
        )

        try:
            # xAI SDK is synchronous — run in thread pool
            start_response = await asyncio.to_thread(
                client.video.start,
                prompt=request.prompt,
                model=XAI_VIDEO_MODEL,
                image_url=image_url,
                duration=duration,
                aspect_ratio=request.aspect_ratio,
            )
        except Exception as e:
            logger.error(
                f"[XAI-VIDEO] submit_job failed: {type(e).__name__}: {e}",
                exc_info=True,
            )
            raise

        job_id = start_response.request_id
        logger.info(f"[XAI-VIDEO] Job submitted, request_id={job_id}")
        return VideoSubmitResult(job_id=job_id, status="pending")

    async def check_status(
        self,
        job_id: str,
        api_key: str,
    ) -> VideoStatusResult:
        """Poll xAI for job completion."""
        import xai_sdk
        from xai_sdk.proto import deferred_pb2

        client = xai_sdk.Client(api_key=api_key)

        try:
            result = await asyncio.to_thread(client.video.get, job_id)
        except Exception as e:
            logger.error(
                f"[XAI-VIDEO] check_status failed for {job_id}: {type(e).__name__}: {e}",
                exc_info=True,
            )
            raise

        logger.info(f"[XAI-VIDEO] Poll result for {job_id}: status={result.status}, raw={result}")

        if result.status == deferred_pb2.DeferredStatus.DONE:
            video_url = result.response.video.url
            logger.info(f"[XAI-VIDEO] Job {job_id} completed, url={video_url}")
            return VideoStatusResult(
                job_id=job_id,
                status="completed",
                video_url=video_url,
            )

        # PENDING or any unrecognised status → still running
        return VideoStatusResult(job_id=job_id, status="running")

    async def download_video(
        self,
        job_id: str,
        api_key: str,
    ) -> bytes:
        """Download the completed video from its URL."""
        import xai_sdk
        from xai_sdk.proto import deferred_pb2

        client = xai_sdk.Client(api_key=api_key)

        try:
            result = await asyncio.to_thread(client.video.get, job_id)
        except Exception as e:
            logger.error(
                f"[XAI-VIDEO] download_video get failed for {job_id}: {type(e).__name__}: {e}",
                exc_info=True,
            )
            raise

        if result.status != deferred_pb2.DeferredStatus.DONE:
            raise RuntimeError(f"Video not ready for download (status={result.status})")

        video_url = result.response.video.url
        if not video_url:
            raise RuntimeError("No video URL in completed xAI response")

        async with httpx.AsyncClient(timeout=120.0) as http:
            logger.info(f"[XAI-VIDEO] Downloading from {video_url[:80]}...")
            resp = await http.get(video_url)
            resp.raise_for_status()
            logger.info(f"[XAI-VIDEO] Downloaded {len(resp.content)} bytes")
            return resp.content

    def _resolve_image_url(self, request: VideoSubmitRequest) -> str:
        """Return an image URL for xAI.

        Uses image_url (CloudFront) directly when available.
        Falls back to wrapping image_base64 in a data URI.
        """
        if request.image_url:
            return request.image_url

        if request.image_base64:
            # Default to JPEG — frames from the pipeline are JPEG/PNG
            return f"data:image/jpeg;base64,{request.image_base64}"

        raise ValueError("No source image provided (image_url or image_base64 required)")


# Singleton instance
xai_video_provider = XAIVideoProvider()
