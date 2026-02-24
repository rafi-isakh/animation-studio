"""ModelsLab WAN image-to-video-ultra generation providers (2.1 and 2.2)."""

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

WAN_VIDEO_URL = "https://modelslab.com/api/v6/video/img2video_ultra"

# "immediate:" prefix signals that the video was returned synchronously —
# no polling needed; the rest of the string is the video URL.
IMMEDIATE_PREFIX = "immediate:"

# WAN 2.1 — 480p @ 16 FPS
_WAN21_CONSTRAINTS = ProviderConstraints(
    durations=[5, 10],
    sizes={
        "16:9": "1280x720",
        "9:16": "720x1280",
    },
    polling=PollingConfig(
        interval_ms=10000,
        max_attempts=90,  # 15 min max
    ),
    supports_image_to_video=True,
)
_WAN21_FRAMES = {5: 81, 10: 161}

# WAN 2.2 — 720p @ 24 FPS
_WAN22_CONSTRAINTS = ProviderConstraints(
    durations=[5, 10],
    sizes={
        "16:9": "1280x720",
        "9:16": "720x1280",
    },
    polling=PollingConfig(
        interval_ms=10000,
        max_attempts=90,  # 15 min max
    ),
    supports_image_to_video=True,
)
_WAN22_FRAMES = {5: 120, 10: 240}


class _WanI2VBase(VideoProvider):
    """Shared implementation for WAN 2.1 / 2.2 providers."""

    # Subclasses override these
    _provider_id: str
    _provider_name: str
    _provider_description: str
    _model_id: str
    _constraints: ProviderConstraints
    _duration_frames: dict[int, int]
    _fps: int
    _resolution: int
    _log_tag: str

    @property
    def id(self) -> str:
        return self._provider_id

    @property
    def name(self) -> str:
        return self._provider_name

    @property
    def description(self) -> str:
        return self._provider_description

    @property
    def model_name(self) -> str:
        return self._model_id

    def get_constraints(self) -> ProviderConstraints:
        return self._constraints

    async def submit_job(
        self,
        request: VideoSubmitRequest,
        api_key: str,
    ) -> VideoSubmitResult:
        """Submit an image-to-video job to ModelsLab WAN."""
        validation_error = self.validate_request(request)
        if validation_error:
            raise ValueError(validation_error)

        duration = self.map_duration(request.duration)
        num_frames = self._duration_frames.get(duration, list(self._duration_frames.values())[0])
        portrait = request.aspect_ratio == "9:16"
        init_image = await self._resolve_image_url(request)

        payload = {
            "key": api_key,
            "model_id": self._model_id,
            "init_image": init_image,
            "prompt": request.prompt,
            "portrait": portrait,
            "num_frames": num_frames,
            "fps": self._fps,
            "resolution": self._resolution,
            "num_inference_steps": 25,
        }

        if request.image_end_url:
            payload["end_image"] = await self._resolve_end_image_url(request.image_end_url)

        logger.info(f"[{self._log_tag}] Submitting to ModelsLab, duration={duration}s, frames={num_frames}")

        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(WAN_VIDEO_URL, json=payload)
            resp.raise_for_status()
            data = resp.json()

        status = data.get("status")
        logger.info(f"[{self._log_tag}] Submit response status: {status}")

        if status == "error":
            raise RuntimeError(f"ModelsLab WAN API error: {data.get('message', data)}")

        if status == "success" and data.get("output"):
            output = data["output"]
            video_url = output[0] if isinstance(output, list) else output
            logger.info(f"[{self._log_tag}] Immediate success, video URL: {video_url[:60]}...")
            return VideoSubmitResult(
                job_id=f"{IMMEDIATE_PREFIX}{video_url}",
                status="pending",
            )

        if status == "processing":
            fetch_url = data.get("fetch_result")
            if not fetch_url:
                raise RuntimeError(
                    f"ModelsLab WAN returned 'processing' but no fetch_result URL"
                )
            logger.info(f"[{self._log_tag}] Processing async, fetch URL: {fetch_url}")
            return VideoSubmitResult(job_id=fetch_url, status="pending")

        raise RuntimeError(f"Unexpected ModelsLab WAN response: {data}")

    async def check_status(
        self,
        job_id: str,
        api_key: str,
    ) -> VideoStatusResult:
        """Poll ModelsLab for job completion."""
        if job_id.startswith(IMMEDIATE_PREFIX):
            video_url = job_id[len(IMMEDIATE_PREFIX):]
            return VideoStatusResult(
                job_id=job_id,
                status="completed",
                video_url=video_url,
            )

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(job_id, json={"key": api_key})
            resp.raise_for_status()
            data = resp.json()

        status = data.get("status")
        logger.info(f"[{self._log_tag}] Poll status: {status}")

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
                error=data.get("message", "ModelsLab WAN generation failed"),
            )

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
            result = await self.check_status(job_id, api_key)
            if not result.video_url:
                raise RuntimeError("No video URL available for download")
            video_url = result.video_url

        async with httpx.AsyncClient(timeout=120.0) as client:
            logger.info(f"[{self._log_tag}] Downloading video from {video_url[:80]}...")
            resp = await client.get(video_url)
            resp.raise_for_status()
            logger.info(f"[{self._log_tag}] Downloaded {len(resp.content)} bytes")
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

        if "," in raw:
            raw = raw.split(",", 1)[1]
        image_bytes = base64.b64decode(raw)
        timestamp = int(time.time() * 1000)
        s3_key = f"mithril/temp/{self._provider_id}-source/{timestamp}.jpg"
        url = await upload_image(image_bytes, s3_key, "image/jpeg")
        logger.info(f"[{self._log_tag}] Uploaded source frame to S3: {url}")
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
        s3_key = f"mithril/temp/{self._provider_id}-end/{timestamp}.jpg"
        url = await upload_image(image_bytes, s3_key, "image/jpeg")
        logger.info(f"[{self._log_tag}] Uploaded end frame to S3: {url}")
        return url


class WanI2VProvider(_WanI2VBase):
    """ModelsLab WAN 2.1 image-to-video-ultra provider (480p @ 16 FPS)."""

    _provider_id = "wan_i2v"
    _provider_name = "WAN 2.1"
    _provider_description = "ModelsLab's WAN 2.1 image-to-video ultra model (480p)"
    _model_id = "wan2.1"
    _constraints = _WAN21_CONSTRAINTS
    _duration_frames = _WAN21_FRAMES
    _fps = 16
    _resolution = 480
    _log_tag = "WAN21_I2V"


class Wan22I2VProvider(_WanI2VBase):
    """ModelsLab WAN 2.2 image-to-video-ultra provider (720p @ 24 FPS)."""

    _provider_id = "wan22_i2v"
    _provider_name = "WAN 2.2"
    _provider_description = "ModelsLab's WAN 2.2 image-to-video ultra model (720p)"
    _model_id = "wan-2.2-i2v"
    _constraints = _WAN22_CONSTRAINTS
    _duration_frames = _WAN22_FRAMES
    _fps = 24
    _resolution = 480
    _log_tag = "WAN22_I2V"


# Singleton instances
wan_i2v_provider = WanI2VProvider()
wan22_i2v_provider = Wan22I2VProvider()
