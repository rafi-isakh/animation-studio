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

    model_url: str = ""  # S3/CloudFront URL to .glb file (mutually exclusive with model_data)
    model_data: str | None = None  # Base64-encoded .glb bytes (for local file uploads)
    azimuth: float = 0.0  # Horizontal angle in degrees (0-360)
    elevation: float = 30.0  # Vertical angle in degrees (-90 to 90)
    distance_multiplier: float = 2.5  # Camera distance as multiplier of model extent
    fov: float = 45.0  # Field of view in degrees
    camera_mode: Literal["exterior", "interior", "absolute"] = "exterior"  # exterior=orbit outside, interior=inside looking out, absolute=raw XYZ
    tilt: float = 0.0  # Camera roll in degrees (-180 to 180), Dutch angle effect
    interior_offset_x: float = 0.0  # Horizontal offset from center (-1 to 1, fraction of half-extent). Interior only.
    interior_offset_y: float = 0.0  # Vertical offset from center (-1 to 1). Interior only.
    interior_offset_z: float = 0.0  # Depth offset from center (-1 to 1). Interior only.
    eye: tuple[float, float, float] | None = None  # Absolute camera position (X, Y, Z). Absolute mode only.
    model_format: Literal["glb", "3dgs", "auto"] = "auto"  # "glb"=trimesh/pyrender, "3dgs"=Gaussian splat .ply, "auto"=detect from URL/data
    max_gaussians: int = 200_000  # 3DGS only: cap on rendered Gaussians (lower = faster)
    up_axis: Literal["auto", "y", "-y", "z", "-z"] = "auto"  # 3DGS only: world up direction
    look_at_center: bool = False  # Absolute mode: look at scene center instead of using azimuth/elevation for direction
    resolution: tuple[int, int] = (1920, 1080)
    output_mode: Literal["direct", "ai_enhanced"] = "direct"
    style_prompt: str | None = None
    api_key: str | None = None  # For ai_enhanced (Gemini)


class Render3DResponse(BaseModel):
    """Response model for single 3D render."""

    image: str  # base64 data URI
    camera_params: dict[str, float]  # {azimuth, elevation, distance_multiplier, fov}
    scene_info: dict | None = None  # {center, bbox_min, bbox_max, extents} — for absolute camera positioning


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

    # Validate source
    if not request.model_url and not request.model_data:
        raise HTTPException(400, "Either model_url or model_data (base64) must be provided")

    width, height = request.resolution
    if width < 256 or height < 256 or width > 3840 or height > 3840:
        raise HTTPException(400, "Resolution must be between 256 and 3840 per dimension")
    if request.fov < 10 or request.fov > 120:
        raise HTTPException(400, "FOV must be between 10 and 120 degrees")
    if request.distance_multiplier < 0.5 or request.distance_multiplier > 20.0:
        raise HTTPException(400, "Distance multiplier must be between 0.5 and 20.0")
    if request.tilt < -180 or request.tilt > 180:
        raise HTTPException(400, "Tilt must be between -180 and 180 degrees")
    for axis, val in [("X", request.interior_offset_x), ("Y", request.interior_offset_y), ("Z", request.interior_offset_z)]:
        if val < -1.0 or val > 1.0:
            raise HTTPException(400, f"Interior offset {axis} must be between -1.0 and 1.0")

    # Resolve model bytes — either decode base64 or download from URL
    if request.model_data:
        try:
            model_data = base64.b64decode(request.model_data)
            logger.info(f"[RENDER-3D] Using uploaded model data ({len(model_data)} bytes)")
        except Exception as e:
            raise HTTPException(400, f"Invalid base64 model_data: {e}")
    else:
        try:
            model_data = await download_image(request.model_url)
        except Exception as e:
            logger.error(f"[RENDER-3D] Failed to download model: {e}")
            raise HTTPException(400, f"Failed to download model from URL: {e}")

    # Detect format
    effective_format = request.model_format
    if effective_format == "auto":
        url_lower = request.model_url.lower()
        if url_lower.endswith(".ply") or url_lower.endswith(".splat") or url_lower.endswith(".spz"):
            effective_format = "3dgs"
        elif request.model_data:
            # Local file: detect from magic bytes after decoding
            try:
                probe = base64.b64decode(request.model_data[:8])[:4]
                effective_format = "3dgs" if (probe in (b"NGSP", b"ply\n", b"ply\r", b"ply ") or probe[:3] == b"ply" or probe[:2] == b"\x1f\x8b") else "glb"
            except Exception:
                effective_format = "glb"
        else:
            effective_format = "glb"  # default

    # Render single view
    try:
        scene_info = None
        if effective_format == "3dgs":
            from app.services.renderer_3dgs import render_single_view_3dgs
            logger.info(f"[RENDER-3D] Using 3DGS renderer (max_gaussians={request.max_gaussians})")
            png_bytes, scene_info = await render_single_view_3dgs(
                model_data=model_data,
                azimuth=request.azimuth,
                elevation=request.elevation,
                distance_multiplier=request.distance_multiplier,
                fov=request.fov,
                resolution=request.resolution,
                camera_mode=request.camera_mode,
                tilt=request.tilt,
                interior_offset_x=request.interior_offset_x,
                interior_offset_y=request.interior_offset_y,
                interior_offset_z=request.interior_offset_z,
                max_gaussians=request.max_gaussians,
                up_axis=request.up_axis,
                eye=request.eye,
                look_at_center=request.look_at_center,
            )
        else:
            logger.info("[RENDER-3D] Using GLB renderer (pyrender)")
            png_bytes = await render_single_view(
                model_data=model_data,
                azimuth=request.azimuth,
                elevation=request.elevation,
                distance_multiplier=request.distance_multiplier,
                fov=request.fov,
                resolution=request.resolution,
                camera_mode=request.camera_mode,
                tilt=request.tilt,
                interior_offset_x=request.interior_offset_x,
                interior_offset_y=request.interior_offset_y,
                interior_offset_z=request.interior_offset_z,
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
        scene_info=scene_info,
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
