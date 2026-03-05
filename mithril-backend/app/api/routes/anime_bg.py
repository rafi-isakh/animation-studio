"""Anime BG Studio — image-to-anime batch conversion endpoint."""

import asyncio
import base64
import logging
from typing import Literal

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.api.deps import AuthenticatedUser
from app.providers.image.base import ImageGenerateRequest
from app.providers.image.gemini import gemini_image_provider

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/anime-bg", tags=["anime-bg"])


class AnimeBgEnhanceRequest(BaseModel):
    """Request for single image anime conversion."""

    image_base64: str
    image_mime_type: str = "image/png"
    prompt: str
    reference_image_base64: str | None = None
    reference_image_mime_type: str | None = None
    aspect_ratio: Literal["16:9", "9:16", "1:1"] = "16:9"
    api_key: str | None = None
    provider: Literal["gemini", "grok"] = "gemini"


class AnimeBgEnhanceResponse(BaseModel):
    """Response with generated anime image."""

    image: str  # base64 data URI


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

    final_prompt = (
        f"Edit this image. {prompt}. "
        f"{'Use the second provided image strictly as a color and style reference. ' if ref_bytes else ''}"
        f"You MUST maintain the exact original angle, structure, and design of the first image. "
        f"Make sure the output is strictly a 2D hand-drawn anime illustration, NOT 3D or CGI."
    )

    request = ImageGenerateRequest(
        prompt=final_prompt,
        reference_images=reference_images,
        aspect_ratio=aspect_ratio,
    )
    return await gemini_image_provider.generate_image(request, api_key)


async def _generate_grok(
    source_base64: str,
    source_mime: str,
    ref_base64: str | None,
    ref_mime: str | None,
    prompt: str,
    aspect_ratio: str,
    api_key: str,
) -> bytes:
    """Generate anime image via Grok (xAI) provider using xai_sdk."""
    import xai_sdk

    client = xai_sdk.Client(api_key=api_key)
    model = "grok-imagine-image-pro"

    # Build image URLs list (data URIs)
    image_urls = [f"data:{source_mime};base64,{source_base64}"]
    if ref_base64 and ref_mime:
        image_urls.append(f"data:{ref_mime};base64,{ref_base64}")

    final_prompt = (
        f"Edit this image. {prompt}. "
        f"{'Use the second provided image strictly as a color and style reference. ' if ref_base64 else ''}"
        f"You MUST maintain the exact original angle, structure, and design of the first image. "
        f"Make sure the output is strictly a 2D hand-drawn anime illustration, NOT 3D or CGI."
    )

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

    # Decode source image
    try:
        source_bytes = base64.b64decode(request.image_base64)
    except Exception as e:
        raise HTTPException(400, f"Invalid image_base64: {e}")

    # Decode reference image if provided
    ref_bytes: bytes | None = None
    if request.reference_image_base64:
        try:
            ref_bytes = base64.b64decode(request.reference_image_base64)
        except Exception as e:
            raise HTTPException(400, f"Invalid reference_image_base64: {e}")

    try:
        if request.provider == "grok":
            result_bytes = await _generate_grok(
                source_base64=request.image_base64,
                source_mime=request.image_mime_type,
                ref_base64=request.reference_image_base64,
                ref_mime=request.reference_image_mime_type,
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

    b64 = base64.b64encode(result_bytes).decode("ascii")
    return AnimeBgEnhanceResponse(image=f"data:image/png;base64,{b64}")
