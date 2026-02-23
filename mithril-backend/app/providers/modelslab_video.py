"""ModelsLab Grok image-to-video generation provider."""

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

MODELSLAB_VIDEO_URL = "https://modelslab.com/api/v7/video-fusion/image-to-video"
MODEL_ID = "grok-imagine-video-i2v"

# "immediate:" prefix signals that the video was returned synchronously —
# no polling needed; the rest of the string is the video URL.
IMMEDIATE_PREFIX = "immediate:"

GROK_I2V_CONSTRAINTS = ProviderConstraints(
    durations=[4, 8],
    sizes={
        "16:9": "1280x720",
        "9:16": "720x1280",
    },
    polling=PollingConfig(
        interval_ms=10000,
        max_attempts=60,  # 10 min max
    ),
    supports_image_to_video=True,
)


class GrokI2VProvider(VideoProvider):
    """ModelsLab grok-imagine-video-i2v provider."""

    @property
    def id(self) -> str:
        return "grok_i2v"

    @property
    def name(self) -> str:
        return "Grok Aurora"

    @property
    def description(self) -> str:
        return "ModelsLab's xAI Grok image-to-video model"

    @property
    def model_name(self) -> str:
        return MODEL_ID

    def get_constraints(self) -> ProviderConstraints:
        return GROK_I2V_CONSTRAINTS

    async def submit_job(
        self,
        request: VideoSubmitRequest,
        api_key: str,
    ) -> VideoSubmitResult:
        """Submit an image-to-video job to ModelsLab."""
        validation_error = self.validate_request(request)
        if validation_error:
            raise ValueError(validation_error)

        duration = self.map_duration(request.duration)
        init_image = await self._resolve_image_url(request)

        payload = {
            "key": api_key,
            "model_id": MODEL_ID,
            "init_image": init_image,
            "prompt": request.prompt,
            "duration": str(duration),
            "resolution": "720P",
        }

        if request.image_end_url:
            payload["end_image"] = await self._resolve_end_image_url(request.image_end_url)

        async with httpx.AsyncClient(timeout=60.0) as client:
            logger.info(f"[GROK_I2V] Submitting to ModelsLab, duration={duration}s")
            resp = await client.post(MODELSLAB_VIDEO_URL, json=payload)
            resp.raise_for_status()
            data = resp.json()

        status = data.get("status")
        logger.info(f"[GROK_I2V] Submit response status: {status}")

        if status == "error":
            raise RuntimeError(f"ModelsLab API error: {data.get('message', data)}")

        if status == "success" and data.get("output"):
            output = data["output"]
            video_url = output[0] if isinstance(output, list) else output
            logger.info(f"[GROK_I2V] Immediate success, video URL: {video_url[:60]}...")
            return VideoSubmitResult(
                job_id=f"{IMMEDIATE_PREFIX}{video_url}",
                status="pending",
            )

        if status == "processing":
            fetch_url = data.get("fetch_result")
            if not fetch_url:
                raise RuntimeError("ModelsLab returned 'processing' but no fetch_result URL")
            logger.info(f"[GROK_I2V] Processing async, fetch URL: {fetch_url}")
            return VideoSubmitResult(job_id=fetch_url, status="pending")

        raise RuntimeError(f"Unexpected ModelsLab response: {data}")

    async def check_status(
        self,
        job_id: str,
        api_key: str,
    ) -> VideoStatusResult:
        """Poll ModelsLab for job completion."""
        # Immediate success — video was already ready at submit time
        if job_id.startswith(IMMEDIATE_PREFIX):
            video_url = job_id[len(IMMEDIATE_PREFIX):]
            return VideoStatusResult(
                job_id=job_id,
                status="completed",
                video_url=video_url,
            )

        # Async job — poll fetch_result URL
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(job_id, json={"key": api_key})
            resp.raise_for_status()
            data = resp.json()

        status = data.get("status")
        logger.info(f"[GROK_I2V] Poll status: {status}")

        if status == "success" and data.get("output"):
            output = data["output"]
            video_url = output[0] if isinstance(output, list) else output
            return VideoStatusResult(
                job_id=job_id,
                status="completed",
                video_url=video_url,
            )

        if status == "error":
            return VideoStatusResult(
                job_id=job_id,
                status="failed",
                error=data.get("message", "ModelsLab generation failed"),
            )

        # "processing" / "pending" → still running
        return VideoStatusResult(job_id=job_id, status="running")

    async def download_video(
        self,
        job_id: str,
        api_key: str,
    ) -> bytes:
        """Download the completed video from its URL."""
        if job_id.startswith(IMMEDIATE_PREFIX):
            video_url = job_id[len(IMMEDIATE_PREFIX):]
        else:
            # Get final URL from one last status check
            result = await self.check_status(job_id, api_key)
            if not result.video_url:
                raise RuntimeError("No video URL available for download")
            video_url = result.video_url

        async with httpx.AsyncClient(timeout=120.0) as client:
            logger.info(f"[GROK_I2V] Downloading video from {video_url[:80]}...")
            resp = await client.get(video_url)
            resp.raise_for_status()
            logger.info(f"[GROK_I2V] Downloaded {len(resp.content)} bytes")
            return resp.content

    async def _resolve_image_url(self, request: VideoSubmitRequest) -> str:
        """Return a publicly accessible URL for the source image.

        Uses image_url directly when available (CloudFront URL from S3).
        Falls back to uploading image_base64 or data URL to S3 if needed.
        """
        if request.image_url and not request.image_url.startswith("data:"):
            return request.image_url

        import base64
        import time
        from app.services.s3 import upload_image

        raw = request.image_base64 or request.image_url
        if not raw:
            raise ValueError("No source image provided (image_url or image_base64 required)")

        # Strip data URI prefix if present
        if "," in raw:
            raw = raw.split(",", 1)[1]
        image_bytes = base64.b64decode(raw)
        timestamp = int(time.time() * 1000)
        s3_key = f"mithril/temp/grok-i2v-source/{timestamp}.jpg"
        url = await upload_image(image_bytes, s3_key, "image/jpeg")
        logger.info(f"[GROK_I2V] Uploaded source frame to S3: {url}")
        return url

    async def _resolve_end_image_url(self, image_end_url: str) -> str:
        """Upload a data URL end frame to S3 and return a public URL."""
        if not image_end_url.startswith("data:"):
            return image_end_url

        import base64
        import time
        from app.services.s3 import upload_image

        raw = image_end_url.split(",", 1)[1] if "," in image_end_url else image_end_url
        image_bytes = base64.b64decode(raw)
        timestamp = int(time.time() * 1000)
        s3_key = f"mithril/temp/grok-i2v-end/{timestamp}.jpg"
        url = await upload_image(image_bytes, s3_key, "image/jpeg")
        logger.info(f"[GROK_I2V] Uploaded end frame to S3: {url}")
        return url


# Singleton instance
grok_i2v_provider = GrokI2VProvider()
