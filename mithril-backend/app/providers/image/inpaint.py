"""ModelsLab inpaint image editing via v6 API."""

import asyncio
import logging

import httpx

from app.core.rate_limiter import distributed_rate_limit

logger = logging.getLogger(__name__)

MODELSLAB_V6_INPAINT_URL = "https://modelslab.com/api/v6/images/inpaint"
POLL_INTERVAL = 5  # seconds between polls
MAX_POLL_ATTEMPTS = 24  # 24 × 5s = 2 min max wait


async def generate_inpaint_panel(
    source_url: str,
    mask_url: str,
    prompt: str,
    negative_prompt: str,
    width: int,
    height: int,
    strength: float,
    api_key: str,
) -> bytes:
    """
    Generate an inpainted panel image using ModelsLab's inpaint API.

    Args:
        source_url: Public S3/CloudFront URL of source image.
        mask_url: Public S3/CloudFront URL of mask image (white = inpaint, black = keep).
        prompt: Description of desired content in masked area.
        negative_prompt: Negative prompt.
        width: Output width in pixels.
        height: Output height in pixels.
        strength: Inpaint strength (0.0–1.0).
        api_key: ModelsLab API key.

    Returns:
        Generated image as raw bytes.
    """
    payload = {
        "key": api_key,
        "prompt": prompt,
        "negative_prompt": negative_prompt,
        "init_image": source_url,
        "mask_image": mask_url,
        "model_id": "lazymixv4-inpaint",
        "width": str(width),
        "height": str(height),
        "strength": str(strength),
        "samples": "1",
        "steps": "30",
        "num_inference_steps": "30",
        "guidance_scale": "5",
        "scheduler": "DPMSolverMultistepScheduler",
        "safety_checker": "no",
        "base64": "no",
        "Seed": "0",
        "webhook": None,
        "track_id": "0",
    }

    async with distributed_rate_limit("modelslab"):
        async with httpx.AsyncClient(timeout=60.0) as client:
            logger.info(f"[INPAINT] Calling ModelsLab v6 inpaint, source={source_url[:60]}...")
            response = await client.post(MODELSLAB_V6_INPAINT_URL, json=payload)
            response.raise_for_status()
            data = response.json()

        status = data.get("status")
        logger.info(f"[INPAINT] Initial response status: {status}")

        if status == "error":
            raise RuntimeError(f"ModelsLab API error: {data.get('message', data)}")

        if status == "success" and data.get("output"):
            output = data["output"]
            image_url = output[0] if isinstance(output, list) else output
            return await _download_image(image_url)

        if status == "processing":
            fetch_url = data.get("fetch_result")
            if not fetch_url:
                raise RuntimeError("ModelsLab returned 'processing' but no fetch_result URL")
            logger.info(f"[INPAINT] Processing async, polling: {fetch_url}")
            return await _poll_for_result(fetch_url, api_key)

        raise RuntimeError(f"Unexpected ModelsLab response: {data}")


async def _poll_for_result(fetch_url: str, api_key: str) -> bytes:
    """Poll ModelsLab fetch_result URL until the image is ready."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        for attempt in range(1, MAX_POLL_ATTEMPTS + 1):
            await asyncio.sleep(POLL_INTERVAL)
            logger.info(f"[INPAINT] Poll attempt {attempt}/{MAX_POLL_ATTEMPTS}")

            resp = await client.post(fetch_url, json={"key": api_key})
            resp.raise_for_status()
            data = resp.json()

            status = data.get("status")
            logger.info(f"[INPAINT] Poll status: {status}")

            if status == "success" and data.get("output"):
                output = data["output"]
                image_url = output[0] if isinstance(output, list) else output
                return await _download_image(image_url)

            if status == "error":
                raise RuntimeError(f"ModelsLab inpaint failed: {data.get('message', data)}")

            # status "processing" or "pending" → keep polling

    raise RuntimeError(
        f"ModelsLab timed out after {MAX_POLL_ATTEMPTS * POLL_INTERVAL}s"
    )


async def _download_image(url: str) -> bytes:
    """Download a generated image from URL, retrying on 404 for CDN propagation delay."""
    max_attempts = 8
    retry_delay = 5.0

    async with httpx.AsyncClient(timeout=60.0) as client:
        for attempt in range(1, max_attempts + 1):
            logger.info(f"[INPAINT] Downloading result from {url[:80]}... (attempt {attempt}/{max_attempts})")
            resp = await client.get(url)
            if resp.status_code == 404 and attempt < max_attempts:
                logger.warning(f"[INPAINT] Got 404, CDN not ready yet — retrying in {retry_delay}s")
                await asyncio.sleep(retry_delay)
                continue
            resp.raise_for_status()
            logger.info(f"[INPAINT] Downloaded {len(resp.content)} bytes")
            return resp.content

    raise RuntimeError(f"Failed to download image after {max_attempts} attempts: {url}")