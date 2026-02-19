"""Grok image-to-image generation via ModelsLab xAI API."""

import asyncio
import logging

import httpx

logger = logging.getLogger(__name__)

MODELSLAB_I2I_URL = "https://modelslab.com/api/v7/images/image-to-image"
MODEL_ID = "grok-imagine-image-i2i"
POLL_INTERVAL = 5  # seconds between polls
MAX_POLL_ATTEMPTS = 24  # 24 × 5s = 2 min max wait


async def generate_grok_panel(
    source_url: str,
    prompt: str,
    aspect_ratio: str,
    api_key: str,
) -> bytes:
    """
    Generate a panel image using ModelsLab's grok-imagine-image-i2i model.

    Args:
        source_url: Publicly accessible URL of the source panel image.
        prompt: Transformation prompt describing the desired output.
        aspect_ratio: Target aspect ratio, e.g. "16:9", "9:16", "1:1".
        api_key: ModelsLab API key (sent in request body as "key").

    Returns:
        Generated image as raw bytes.
    """
    payload = {
        "key": api_key,
        "model_id": MODEL_ID,
        "prompt": prompt,
        "init_image": source_url,
        "aspect_ratio": aspect_ratio,
        "resolution": "1k",
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        logger.info(f"[GROK] Calling ModelsLab img2img ({MODEL_ID}), source={source_url[:60]}...")
        response = await client.post(MODELSLAB_I2I_URL, json=payload)
        response.raise_for_status()
        data = response.json()

    status = data.get("status")
    logger.info(f"[GROK] Initial response status: {status}")

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
        logger.info(f"[GROK] Processing async, polling: {fetch_url}")
        return await _poll_for_result(fetch_url, api_key)

    raise RuntimeError(f"Unexpected ModelsLab response: {data}")


async def _poll_for_result(fetch_url: str, api_key: str) -> bytes:
    """Poll ModelsLab fetch_result URL until the image is ready."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        for attempt in range(1, MAX_POLL_ATTEMPTS + 1):
            await asyncio.sleep(POLL_INTERVAL)
            logger.info(f"[GROK] Poll attempt {attempt}/{MAX_POLL_ATTEMPTS}")

            resp = await client.post(fetch_url, json={"key": api_key})
            resp.raise_for_status()
            data = resp.json()

            status = data.get("status")
            logger.info(f"[GROK] Poll status: {status}")

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
    """Download a generated image from URL and return raw bytes."""
    async with httpx.AsyncClient(timeout=60.0) as client:
        logger.info(f"[GROK] Downloading result from {url[:80]}...")
        resp = await client.get(url)
        resp.raise_for_status()
        logger.info(f"[GROK] Downloaded {len(resp.content)} bytes")
        return resp.content
