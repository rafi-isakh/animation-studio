"""Anime BG Studio — image-to-anime batch conversion endpoint."""

import asyncio
import base64
import logging
import time
from typing import Literal

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.api.deps import AuthenticatedUser
from app.providers.image.base import ImageGenerateRequest
from app.providers.image.gemini import gemini_image_provider
from app.services.s3 import download_image, upload_image

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/anime-bg", tags=["anime-bg"])


class AnimeBgEnhanceRequest(BaseModel):
    """Request for single image anime conversion."""

    image_url: str  # CloudFront URL of source image
    prompt: str
    reference_image_url: str | None = None  # CloudFront URL of style reference
    aspect_ratio: Literal["16:9", "9:16", "1:1"] = "16:9"
    api_key: str | None = None
    provider: Literal["gemini", "grok"] = "gemini"
    session_id: str = ""  # For S3 key generation
    image_id: str = ""  # For S3 key generation


class AnimeBgEnhanceResponse(BaseModel):
    """Response with generated anime image URL."""

    image_url: str  # CloudFront URL of the result


def _build_prompt(prompt: str, has_reference: bool) -> str:
    """Build the final prompt with structural preservation instructions."""
    return (
        f"Edit this image. {prompt}. "
        f"{'Use the second provided image strictly as a color and style reference. ' if has_reference else ''}"
        f"You MUST maintain the exact original angle, structure, and design of the first image. "
        f"Make sure the output is strictly a 2D hand-drawn anime illustration, NOT 3D or CGI."
    )


async def _generate_gemini(
    source_bytes: bytes,
    ref_bytes: bytes | None,
    prompt: str,
    aspect_ratio: str,
    api_key: str,
) -> bytes:
    """Generate anime image via Gemini provider."""
    reference_images: list[bytes] = [source_bytes]
    if ref_bytes:
        reference_images.append(ref_bytes)

    final_prompt = _build_prompt(prompt, ref_bytes is not None)

    request = ImageGenerateRequest(
        prompt=final_prompt,
        reference_images=reference_images,
        aspect_ratio=aspect_ratio,
    )
    return await gemini_image_provider.generate_image(request, api_key)


async def _generate_grok(
    source_bytes: bytes,
    ref_bytes: bytes | None,
    prompt: str,
    aspect_ratio: str,
    api_key: str,
) -> bytes:
    """Generate anime image via Grok (xAI) provider using xai_sdk."""
    import xai_sdk

    client = xai_sdk.Client(api_key=api_key)
    model = "grok-imagine-image-pro"

    # Build image URLs as data URIs
    source_b64 = base64.b64encode(source_bytes).decode("ascii")
    image_urls = [f"data:image/png;base64,{source_b64}"]
    if ref_bytes:
        ref_b64 = base64.b64encode(ref_bytes).decode("ascii")
        image_urls.append(f"data:image/png;base64,{ref_b64}")

    final_prompt = _build_prompt(prompt, ref_bytes is not None)

    logger.info(f"[ANIME-BG-GROK] Submitting to xAI ({model}), {len(image_urls)} image(s), aspect_ratio={aspect_ratio}")

    max_retries = 3
    for attempt in range(1, max_retries + 1):
        try:
            response = await asyncio.to_thread(
                client.image.sample,
                prompt=final_prompt,
                model=model,
                image_urls=image_urls,
                aspect_ratio=aspect_ratio,
            )
            break
        except Exception as e:
            error_msg = str(e)
            if attempt < max_retries and ("INTERNAL" in error_msg or "generation failed" in error_msg.lower()):
                wait = attempt * 2
                logger.warning(f"[ANIME-BG-GROK] Attempt {attempt}/{max_retries} failed, retrying in {wait}s: {error_msg}")
                await asyncio.sleep(wait)
            else:
                raise

    result_url = response.url
    logger.info(f"[ANIME-BG-GROK] Generation complete, downloading result...")

    async with httpx.AsyncClient(timeout=60.0) as http:
        resp = await http.get(result_url)
        resp.raise_for_status()
        logger.info(f"[ANIME-BG-GROK] Downloaded {len(resp.content)} bytes")
        return resp.content


@router.post("/enhance", response_model=AnimeBgEnhanceResponse)
async def enhance_image(
    request: AnimeBgEnhanceRequest,
    user: AuthenticatedUser,
) -> AnimeBgEnhanceResponse:
    """Convert a single image to anime style via Gemini or Grok."""
    from app.config import get_settings

    settings = get_settings()

    # Resolve API key
    if request.provider == "grok":
        effective_key = request.api_key or settings.xai_api_key
    else:
        effective_key = request.api_key or settings.gemini_api_key

    if not effective_key:
        raise HTTPException(400, f"API key required for {request.provider} provider")

    # Download source image from URL
    try:
        source_bytes = await download_image(request.image_url)
        logger.info(f"[ANIME-BG] Downloaded source image: {len(source_bytes)} bytes")
    except Exception as e:
        raise HTTPException(400, f"Failed to download source image: {e}")

    # Download reference image if provided
    ref_bytes: bytes | None = None
    if request.reference_image_url:
        try:
            ref_bytes = await download_image(request.reference_image_url)
            logger.info(f"[ANIME-BG] Downloaded reference image: {len(ref_bytes)} bytes")
        except Exception as e:
            raise HTTPException(400, f"Failed to download reference image: {e}")

    # Generate
    try:
        if request.provider == "grok":
            result_bytes = await _generate_grok(
                source_bytes=source_bytes,
                ref_bytes=ref_bytes,
                prompt=request.prompt,
                aspect_ratio=request.aspect_ratio,
                api_key=effective_key,
            )
        else:
            result_bytes = await _generate_gemini(
                source_bytes=source_bytes,
                ref_bytes=ref_bytes,
                prompt=request.prompt,
                aspect_ratio=request.aspect_ratio,
                api_key=effective_key,
            )
    except Exception as e:
        logger.error(f"[ANIME-BG] {request.provider} generation failed: {e}")
        raise HTTPException(500, f"Image generation failed: {e}")

    # Upload result to S3
    session_id = request.session_id or "default"
    image_id = request.image_id or str(int(time.time() * 1000))
    s3_key = f"tools/anime-bg/{session_id}/result/{image_id}.png"

    try:
        result_url = await upload_image(result_bytes, s3_key, "image/png")
        logger.info(f"[ANIME-BG] Uploaded result to S3: {s3_key}")
    except Exception as e:
        logger.error(f"[ANIME-BG] Failed to upload result to S3: {e}")
        raise HTTPException(500, f"Failed to upload result: {e}")

    return AnimeBgEnhanceResponse(image_url=result_url)
