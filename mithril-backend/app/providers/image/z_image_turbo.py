"""Z-Image Turbo image-to-image generation via ModelsLab v6 API."""

import asyncio
import logging

import httpx

from app.core.rate_limiter import distributed_rate_limit

logger = logging.getLogger(__name__)

MODELSLAB_V6_I2I_URL = "https://modelslab.com/api/v6/images/img2img"
MODEL_ID = "z-image-turbo"
POLL_INTERVAL = 5  # seconds between polls
MAX_POLL_ATTEMPTS = 24  # 24 × 5s = 2 min max wait


async def generate_z_image_turbo_panel(
    source_url: str,
    prompt: str,
    aspect_ratio: str,
    api_key: str,
) -> bytes:
    """
    Generate a panel image using ModelsLab's z-image-turbo model.

    Args:
        source_url: Publicly accessible URL of the source panel image.
        prompt: Transformation prompt describing the desired output.
        aspect_ratio: Target aspect ratio, e.g. "16:9", "9:16", "1:1" (informational only;
                      the v6 img2img endpoint preserves the init_image dimensions).
        api_key: ModelsLab API key (sent in request body as "key").

    Returns:
        Generated image as raw bytes.
    """
    payload = {
        "key": api_key,
        "model_id": MODEL_ID,
        "prompt": prompt,
        "negative_prompt": "text, speech bubbles, word balloons, captions, watermarks, borders, panel borders, letterbox bars",
        "init_image": source_url,
        "samples": "1",
        "num_inference_steps": "31",
        "guidance_scale": 7.5,
        "strength": 0.7,
        "safety_checker": False,
        "base64": False,
    }

    async with distributed_rate_limit("modelslab"):
        async with httpx.AsyncClient(timeout=60.0) as client:
            logger.info(f"[Z-IMAGE-TURBO] Calling ModelsLab v6 img2img ({MODEL_ID}), source={source_url[:60]}...")
            response = await client.post(MODELSLAB_V6_I2I_URL, json=payload)
            response.raise_for_status()
            data = response.json()

    status = data.get("status")
    logger.info(f"[Z-IMAGE-TURBO] Initial response status: {status}")

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
        logger.info(f"[Z-IMAGE-TURBO] Processing async, polling: {fetch_url}")
        return await _poll_for_result(fetch_url, api_key)

    raise RuntimeError(f"Unexpected ModelsLab response: {data}")


async def _poll_for_result(fetch_url: str, api_key: str) -> bytes:
    """Poll ModelsLab fetch_result URL until the image is ready."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        for attempt in range(1, MAX_POLL_ATTEMPTS + 1):
            await asyncio.sleep(POLL_INTERVAL)
            logger.info(f"[Z-IMAGE-TURBO] Poll attempt {attempt}/{MAX_POLL_ATTEMPTS}")

            resp = await client.post(fetch_url, json={"key": api_key})
            resp.raise_for_status()
            data = resp.json()

            status = data.get("status")
            logger.info(f"[Z-IMAGE-TURBO] Poll status: {status}")

            if status == "success" and data.get("output"):
                output = data["output"]
                image_url = output[0] if isinstance(output, list) else output
                return await _download_image(image_url)

            if status == "error":
                raise RuntimeError(f"ModelsLab generation failed: {data.get('message', data)}")

            # status "processing" or "pending" → keep polling

    raise RuntimeError(
        f"ModelsLab timed out after {MAX_POLL_ATTEMPTS * POLL_INTERVAL}s"
    )


async def _download_image(url: str) -> bytes:
    """Download a generated image from URL and return raw bytes.

    Retries on 404 to handle ModelsLab R2 CDN propagation delay — the API
    can report 'success' before the file is actually available on the CDN.
    """
    max_attempts = 5
    retry_delay = 3.0  # seconds

    async with httpx.AsyncClient(timeout=60.0) as client:
        for attempt in range(1, max_attempts + 1):
            logger.info(f"[Z-IMAGE-TURBO] Downloading result from {url[:80]}... (attempt {attempt}/{max_attempts})")
            resp = await client.get(url)
            if resp.status_code == 404 and attempt < max_attempts:
                logger.warning(f"[Z-IMAGE-TURBO] Got 404, CDN not ready yet — retrying in {retry_delay}s")
                await asyncio.sleep(retry_delay)
                continue
            resp.raise_for_status()
            logger.info(f"[Z-IMAGE-TURBO] Downloaded {len(resp.content)} bytes")
            return resp.content

    raise RuntimeError(f"Failed to download image after {max_attempts} attempts: {url}")
