"""3D model rendering endpoint for experimental background generation."""

import base64
import logging
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.api.deps import AuthenticatedUser
from app.services.s3 import download_image

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/render-3d", tags=["render-3d"])


class Render3DRequest(BaseModel):
    """Request model for single 3D model render."""

    model_url: str  # S3/CloudFront URL to .glb file
    azimuth: float = 0.0  # Horizontal angle in degrees (0-360)
    elevation: float = 30.0  # Vertical angle in degrees (-90 to 90)
    distance_multiplier: float = 2.5  # Camera distance as multiplier of model extent
    fov: float = 45.0  # Field of view in degrees
    camera_mode: Literal["exterior", "interior"] = "exterior"  # exterior=orbit outside, interior=inside looking out
    tilt: float = 0.0  # Camera roll in degrees (-180 to 180), Dutch angle effect
    resolution: tuple[int, int] = (1920, 1080)
    output_mode: Literal["direct", "ai_enhanced"] = "direct"
    style_prompt: str | None = None
    api_key: str | None = None  # For ai_enhanced (Gemini)


class Render3DResponse(BaseModel):
    """Response model for single 3D render."""

    image: str  # base64 data URI
    camera_params: dict[str, float]  # {azimuth, elevation, distance_multiplier, fov}


@router.post("/render", response_model=Render3DResponse)
async def render_3d_model_endpoint(
    request: Render3DRequest,
    user: AuthenticatedUser,
) -> Render3DResponse:
    """
    Render a single image from a .glb 3D model with custom camera parameters.
    """
    from app.services.renderer_3d import render_single_view

    logger.info(
        f"[RENDER-3D] User {user.uid} rendering az={request.azimuth} el={request.elevation} "
        f"from {request.model_url[:80]}... (mode={request.output_mode})"
    )

    # Validate
    width, height = request.resolution
    if width < 256 or height < 256 or width > 3840 or height > 3840:
        raise HTTPException(400, "Resolution must be between 256 and 3840 per dimension")
    if request.fov < 10 or request.fov > 120:
        raise HTTPException(400, "FOV must be between 10 and 120 degrees")
    if request.distance_multiplier < 0.5 or request.distance_multiplier > 20.0:
        raise HTTPException(400, "Distance multiplier must be between 0.5 and 20.0")
    if request.tilt < -180 or request.tilt > 180:
        raise HTTPException(400, "Tilt must be between -180 and 180 degrees")

    # Download .glb model
    try:
        model_data = await download_image(request.model_url)
    except Exception as e:
        logger.error(f"[RENDER-3D] Failed to download model: {e}")
        raise HTTPException(400, f"Failed to download model from URL: {e}")

    # Render single view
    try:
        png_bytes = await render_single_view(
            model_data=model_data,
            azimuth=request.azimuth,
            elevation=request.elevation,
            distance_multiplier=request.distance_multiplier,
            fov=request.fov,
            resolution=request.resolution,
            camera_mode=request.camera_mode,
            tilt=request.tilt,
        )
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        logger.error(f"[RENDER-3D] Rendering failed: {e}", exc_info=True)
        raise HTTPException(500, f"3D rendering failed: {e}")

    # Optional AI enhancement
    if request.output_mode == "ai_enhanced":
        png_bytes = await _enhance_single(png_bytes, request.style_prompt, request.api_key)

    # Convert to base64 data URI
    b64 = base64.b64encode(png_bytes).decode("ascii")

    logger.info(f"[RENDER-3D] Successfully rendered image ({len(png_bytes)} bytes)")

    return Render3DResponse(
        image=f"data:image/png;base64,{b64}",
        camera_params={
            "azimuth": request.azimuth,
            "elevation": request.elevation,
            "distance_multiplier": request.distance_multiplier,
            "fov": request.fov,
        },
    )


async def _enhance_single(
    png_bytes: bytes,
    style_prompt: str | None,
    api_key: str | None,
) -> bytes:
    """Pass a single render through Gemini for AI stylization."""
    from app.config import get_settings
    from app.providers.image import gemini_image_provider
    from app.providers.image.base import ImageGenerateRequest

    settings = get_settings()
    effective_key = api_key or settings.gemini_api_key

    if not effective_key:
        raise HTTPException(400, "API key required for AI enhanced mode")

    prompt = style_prompt or "Transform this 3D render into a polished anime-style animation background. Maintain the exact camera angle and composition."

    try:
        request = ImageGenerateRequest(
            prompt=prompt,
            reference_images=[png_bytes],
            aspect_ratio="16:9",
        )
        return await gemini_image_provider.generate_image(request, effective_key)
    except Exception as e:
        logger.warning(f"[RENDER-3D] Enhancement failed: {e}. Using raw render.")
        return png_bytes
