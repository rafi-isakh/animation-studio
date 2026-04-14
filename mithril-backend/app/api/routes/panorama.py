"""Panorama perspective crop endpoint."""

import base64
import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.api.deps import AuthenticatedUser
from app.services.s3 import download_image

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/panorama", tags=["panorama"])


class PanoCropRequest(BaseModel):
    """Request for a single perspective crop from a panorama."""
    pano_url: str = ""
    pano_data: str | None = None  # base64-encoded panorama (alternative to URL)
    azimuth: float = 0.0
    elevation: float = 0.0
    fov: float = 90.0
    resolution: tuple[int, int] = (1920, 1080)


class PanoCropResponse(BaseModel):
    image: str  # base64 data URI
    camera_params: dict[str, float]


class PanoBatchRequest(BaseModel):
    """Request for multiple perspective crops from a single panorama."""
    pano_url: str = ""
    pano_data: str | None = None
    views: list[dict] = []  # [{azimuth, elevation, fov}]
    resolution: tuple[int, int] = (1920, 1080)


class PanoBatchResponse(BaseModel):
    images: list[str]  # base64 data URIs
    camera_params: list[dict[str, float]]


@router.post("/crop", response_model=PanoCropResponse)
async def crop_panorama(request: PanoCropRequest, user: AuthenticatedUser):
    """Extract a single perspective view from an equirectangular panorama."""
    from app.services.panorama import extract_perspective

    pano_bytes = await _resolve_pano(request.pano_url, request.pano_data)
    width, height = request.resolution

    try:
        png = extract_perspective(
            pano_bytes,
            azimuth=request.azimuth,
            elevation=request.elevation,
            fov=request.fov,
            output_width=width,
            output_height=height,
        )
    except Exception as e:
        logger.error(f"[PANO] Crop failed: {e}", exc_info=True)
        raise HTTPException(500, f"Panorama crop failed: {e}")

    b64 = base64.b64encode(png).decode("ascii")
    return PanoCropResponse(
        image=f"data:image/png;base64,{b64}",
        camera_params={
            "azimuth": request.azimuth,
            "elevation": request.elevation,
            "fov": request.fov,
        },
    )


@router.post("/batch-crop", response_model=PanoBatchResponse)
async def batch_crop_panorama(request: PanoBatchRequest, user: AuthenticatedUser):
    """Extract multiple perspective views from a single equirectangular panorama."""
    from app.services.panorama import extract_perspective

    pano_bytes = await _resolve_pano(request.pano_url, request.pano_data)
    width, height = request.resolution

    if not request.views:
        raise HTTPException(400, "At least one view is required")
    if len(request.views) > 12:
        raise HTTPException(400, "Maximum 12 views per batch")

    images = []
    params = []

    for view in request.views:
        az = view.get("azimuth", 0.0)
        el = view.get("elevation", 0.0)
        fov = view.get("fov", 90.0)

        try:
            png = extract_perspective(
                pano_bytes,
                azimuth=az,
                elevation=el,
                fov=fov,
                output_width=width,
                output_height=height,
            )
        except Exception as e:
            logger.error(f"[PANO] Batch crop failed at az={az} el={el}: {e}")
            raise HTTPException(500, f"Panorama crop failed: {e}")

        b64 = base64.b64encode(png).decode("ascii")
        images.append(f"data:image/png;base64,{b64}")
        params.append({"azimuth": az, "elevation": el, "fov": fov})

    return PanoBatchResponse(images=images, camera_params=params)


async def _resolve_pano(pano_url: str, pano_data: str | None) -> bytes:
    """Get panorama bytes from URL or base64."""
    if pano_data:
        try:
            return base64.b64decode(pano_data)
        except Exception as e:
            raise HTTPException(400, f"Invalid base64 pano_data: {e}")

    if pano_url:
        try:
            return await download_image(pano_url)
        except Exception as e:
            raise HTTPException(400, f"Failed to download panorama: {e}")

    raise HTTPException(400, "Either pano_url or pano_data must be provided")
