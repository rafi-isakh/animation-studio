"""Image processing service for resizing images before video generation."""

import base64
import io
import logging
from typing import Literal

import httpx
from PIL import Image

logger = logging.getLogger(__name__)

# Size mappings for each aspect ratio
SIZES: dict[str, tuple[int, int]] = {
    "16:9": (1280, 720),
    "9:16": (720, 1280),
}


async def fetch_image_from_url(url: str) -> bytes:
    """
    Fetch image from URL.

    Args:
        url: Image URL (S3/CloudFront or external)

    Returns:
        Image bytes
    """
    async with httpx.AsyncClient() as client:
        response = await client.get(url, follow_redirects=True)
        response.raise_for_status()
        return response.content


def decode_base64_image(base64_string: str) -> bytes:
    """
    Decode base64 image string.

    Args:
        base64_string: Base64 encoded image (with or without data URI prefix)

    Returns:
        Image bytes
    """
    # Remove data URI prefix if present
    if "," in base64_string:
        base64_string = base64_string.split(",", 1)[1]

    return base64.b64decode(base64_string)


def encode_image_to_base64(image_bytes: bytes) -> str:
    """
    Encode image bytes to base64 string.

    Args:
        image_bytes: Image bytes

    Returns:
        Base64 encoded string (without data URI prefix)
    """
    return base64.b64encode(image_bytes).decode("utf-8")


def resize_image(
    image_bytes: bytes,
    aspect_ratio: Literal["16:9", "9:16"],
    output_format: str = "JPEG",
    quality: int = 90,
) -> bytes:
    """
    Resize image to exact dimensions for the given aspect ratio.

    Args:
        image_bytes: Original image bytes
        aspect_ratio: Target aspect ratio
        output_format: Output format (JPEG, PNG)
        quality: JPEG quality (1-100)

    Returns:
        Resized image bytes
    """
    target_size = SIZES[aspect_ratio]

    # Open image
    image = Image.open(io.BytesIO(image_bytes))

    # Convert to RGB if necessary (for JPEG output)
    if output_format == "JPEG" and image.mode in ("RGBA", "P"):
        image = image.convert("RGB")

    # Resize to exact dimensions (may distort, but providers require exact sizes)
    resized = image.resize(target_size, Image.Resampling.LANCZOS)

    # Save to bytes
    output = io.BytesIO()
    resized.save(output, format=output_format, quality=quality)
    output.seek(0)

    logger.debug(f"Resized image to {target_size[0]}x{target_size[1]}")
    return output.read()


async def prepare_image_for_provider(
    image_base64: str | None,
    image_url: str | None,
    aspect_ratio: Literal["16:9", "9:16"],
) -> str | None:
    """
    Prepare image for video generation provider.

    Fetches from URL if needed, resizes to correct dimensions,
    and returns base64 encoded JPEG.

    Args:
        image_base64: Base64 encoded image (optional)
        image_url: Image URL (optional)
        aspect_ratio: Target aspect ratio

    Returns:
        Base64 encoded resized image, or None if no image provided
    """
    if not image_base64 and not image_url:
        return None

    # Get image bytes
    if image_base64:
        image_bytes = decode_base64_image(image_base64)
    else:
        image_bytes = await fetch_image_from_url(image_url)

    # Resize
    resized_bytes = resize_image(image_bytes, aspect_ratio)

    # Encode to base64
    return encode_image_to_base64(resized_bytes)