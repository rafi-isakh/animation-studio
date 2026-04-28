"""WaveSpeed GPT-Image-2-Edit provider for prop design sheet generation."""

import asyncio
import base64
import logging

import httpx

logger = logging.getLogger(__name__)

_SUBMIT_URL = "https://api.wavespeed.ai/api/v3/openai/gpt-image-2/edit"
_RESULT_URL = "https://api.wavespeed.ai/api/v3/predictions/{request_id}/result"

_POLL_MAX_RETRIES = 10
_POLL_DELAY_SECONDS = 3.0


async def generate_image(
    prompt: str,
    reference_urls: list[str],
    aspect_ratio: str,
    api_key: str,
    resolution: str = "1k",
    quality: str = "medium",
) -> bytes:
    """Generate a prop design sheet image using WaveSpeed GPT-Image-2-Edit.

    Args:
        prompt: The image generation prompt.
        reference_urls: S3/CDN URLs of reference images (may be empty).
        aspect_ratio: Aspect ratio string e.g. "16:9", "1:1".
        api_key: WaveSpeed Bearer token.
        resolution: "1k", "2k", or "4k".
        quality: "low", "medium", or "high".

    Returns:
        PNG image bytes.
    """
    payload: dict = {
        "prompt": prompt,
        "aspect_ratio": aspect_ratio,
        "resolution": resolution,
        "quality": quality,
        "enable_sync_mode": True,
        "enable_base64_output": True,
    }
    if reference_urls:
        payload["images"] = reference_urls

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        logger.info(f"[WaveSpeed] Submitting request: prompt_len={len(prompt)}, refs={len(reference_urls)}, ratio={aspect_ratio}")
        response = await client.post(_SUBMIT_URL, json=payload, headers=headers)

        if response.status_code != 200:
            raise RuntimeError(f"WaveSpeed API error {response.status_code}: {response.text[:300]}")

        data = response.json().get("data", {})
        status = data.get("status")

        if status == "completed":
            return _decode_output(data)

        if status == "failed":
            raise RuntimeError(f"WaveSpeed generation failed: {data.get('error', 'unknown error')}")

        # Poll for result
        request_id = data.get("id")
        if not request_id:
            raise RuntimeError("WaveSpeed response missing request ID")

        logger.info(f"[WaveSpeed] Polling for result, request_id={request_id}")
        return await _poll_result(client, request_id, headers)


async def _poll_result(client: httpx.AsyncClient, request_id: str, headers: dict) -> bytes:
    url = _RESULT_URL.format(request_id=request_id)

    for attempt in range(1, _POLL_MAX_RETRIES + 1):
        await asyncio.sleep(_POLL_DELAY_SECONDS)

        response = await client.get(url, headers=headers)
        if response.status_code != 200:
            logger.warning(f"[WaveSpeed] Poll attempt {attempt} returned {response.status_code}")
            continue

        data = response.json().get("data", {})
        status = data.get("status")

        if status == "completed":
            logger.info(f"[WaveSpeed] Completed after {attempt} poll(s)")
            return _decode_output(data)

        if status == "failed":
            raise RuntimeError(f"WaveSpeed generation failed: {data.get('error', 'unknown error')}")

        logger.debug(f"[WaveSpeed] Poll {attempt}/{_POLL_MAX_RETRIES}: status={status}")

    raise RuntimeError(f"WaveSpeed generation timed out after {_POLL_MAX_RETRIES} polls")


def _decode_output(data: dict) -> bytes:
    outputs = data.get("outputs", [])
    if not outputs:
        raise RuntimeError("WaveSpeed response has no outputs")

    raw = outputs[0]
    # Strip data URI prefix if present
    if isinstance(raw, str) and "base64," in raw:
        raw = raw.split("base64,", 1)[1]

    return base64.b64decode(raw)
