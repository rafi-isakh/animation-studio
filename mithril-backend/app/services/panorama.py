"""
Equirectangular panorama → perspective view cropper.

Given a 360° equirectangular image, extract a perspective view at any
azimuth/elevation with a configurable field of view.
"""

import io
import math

import numpy as np
from PIL import Image


def extract_perspective(
    pano_data: bytes,
    azimuth: float = 0.0,
    elevation: float = 0.0,
    fov: float = 90.0,
    output_width: int = 1920,
    output_height: int = 1080,
) -> bytes:
    """
    Extract a perspective view from an equirectangular panorama.

    Args:
        pano_data: Raw bytes of the equirectangular image (PNG/JPEG).
        azimuth: Horizontal look angle in degrees (0 = front, 90 = right, etc.).
        elevation: Vertical look angle in degrees (-90 to 90, positive = up).
        fov: Horizontal field of view in degrees.
        output_width: Width of the output image.
        output_height: Height of the output image.

    Returns:
        PNG image bytes of the perspective crop.
    """
    pano = np.array(Image.open(io.BytesIO(pano_data)))
    pano_h, pano_w = pano.shape[:2]

    # Build a grid of ray directions for the output perspective image
    aspect = output_width / output_height
    fov_rad = math.radians(fov)
    fov_v_rad = 2.0 * math.atan(math.tan(fov_rad / 2.0) / aspect)

    # Pixel coordinates → normalised device coordinates [-1, 1]
    u = np.linspace(-1, 1, output_width, dtype=np.float64)
    v = np.linspace(-1, 1, output_height, dtype=np.float64)
    uu, vv = np.meshgrid(u, v)

    # Ray directions in camera space (looking along +Z)
    x = uu * math.tan(fov_rad / 2.0)
    y = -vv * math.tan(fov_v_rad / 2.0)  # flip: image Y down, world Y up
    z = np.ones_like(x)

    # Normalise
    norm = np.sqrt(x * x + y * y + z * z)
    x /= norm
    y /= norm
    z /= norm

    # Rotate by elevation (around X axis)
    el = math.radians(elevation)
    cos_el, sin_el = math.cos(el), math.sin(el)
    y2 = y * cos_el - z * sin_el
    z2 = y * sin_el + z * cos_el
    y, z = y2, z2

    # Rotate by azimuth (around Y axis)
    az = math.radians(azimuth)
    cos_az, sin_az = math.cos(az), math.sin(az)
    x2 = x * cos_az + z * sin_az
    z2 = -x * sin_az + z * cos_az
    x, z = x2, z2

    # Convert 3D direction → equirectangular coordinates
    # longitude: atan2(x, z) → [−π, π] → [0, pano_w]
    # latitude:  asin(y) → [−π/2, π/2] → [0, pano_h]
    lon = np.arctan2(x, z)  # [-π, π]
    lat = np.arcsin(np.clip(y, -1, 1))  # [-π/2, π/2]

    # Map to pixel coordinates in the panorama
    px = ((lon / math.pi + 1.0) / 2.0) * (pano_w - 1)  # [0, W-1]
    py = ((0.5 - lat / math.pi)) * (pano_h - 1)         # [0, H-1]

    # Bilinear interpolation
    px0 = np.floor(px).astype(np.int32)
    py0 = np.floor(py).astype(np.int32)
    px1 = px0 + 1
    py1 = py0 + 1

    fx = (px - px0).astype(np.float32)
    fy = (py - py0).astype(np.float32)

    # Wrap horizontally, clamp vertically
    px0 = px0 % pano_w
    px1 = px1 % pano_w
    py0 = np.clip(py0, 0, pano_h - 1)
    py1 = np.clip(py1, 0, pano_h - 1)

    # Sample 4 corners
    c00 = pano[py0, px0].astype(np.float32)
    c10 = pano[py0, px1].astype(np.float32)
    c01 = pano[py1, px0].astype(np.float32)
    c11 = pano[py1, px1].astype(np.float32)

    fx3 = fx[:, :, np.newaxis]
    fy3 = fy[:, :, np.newaxis]

    result = (
        c00 * (1 - fx3) * (1 - fy3)
        + c10 * fx3 * (1 - fy3)
        + c01 * (1 - fx3) * fy3
        + c11 * fx3 * fy3
    )

    img = Image.fromarray(np.clip(result, 0, 255).astype(np.uint8))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()
