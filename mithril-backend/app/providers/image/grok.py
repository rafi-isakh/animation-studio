"""Grok image-to-image panel generation via xAI SDK."""

import asyncio
import logging

import httpx

logger = logging.getLogger(__name__)

XAI_MODEL = "grok-imagine-image-pro"

# Limit concurrent xAI API calls per worker to avoid rate-limit errors
_GROK_SEMAPHORE = asyncio.Semaphore(2)


async def generate_grok_panel(
    image_base64: str,
    mime_type: str,
    prompt: str,
    aspect_ratio: str,
    api_key: str,
) -> bytes:
    """
    Generate a panel image using xAI's grok-imagine-image-pro model.

    Args:
        image_base64: Base64-encoded source panel image.
        mime_type: MIME type of the source image (e.g. "image/jpeg").
        prompt: Transformation prompt describing the desired output.
        aspect_ratio: Target aspect ratio, e.g. "16:9", "9:16", "1:1".
        api_key: xAI API key.

    Returns:
        Generated image as raw bytes.
    """
    import xai_sdk

    client = xai_sdk.Client(api_key=api_key)
    image_url = f"data:{mime_type};base64,{image_base64}"

    logger.info(f"[GROK] Submitting to xAI ({XAI_MODEL}), aspect_ratio={aspect_ratio}")

    # xAI SDK is synchronous — run in thread pool to avoid blocking the event loop
    async with _GROK_SEMAPHORE:
        response = await asyncio.to_thread(
            client.image.sample,
            prompt=prompt,
            model=XAI_MODEL,
            image_url=image_url,
            aspect_ratio=aspect_ratio,
        )

    result_url = response.url
    logger.info(f"[GROK] Generation complete, downloading result from {result_url[:80]}...")

    async with httpx.AsyncClient(timeout=60.0) as http:
        resp = await http.get(result_url)
        resp.raise_for_status()
        logger.info(f"[GROK] Downloaded {len(resp.content)} bytes")
        return resp.content
