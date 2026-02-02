"""S3 service for video upload/download operations."""

import logging
from typing import Literal

import boto3
from botocore.exceptions import ClientError

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Lazy-initialized S3 client
_s3_client = None


def get_s3_client():
    """Get or create S3 client."""
    global _s3_client
    if _s3_client is None:
        _s3_client = boto3.client(
            "s3",
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
            region_name=settings.aws_region,
        )
    return _s3_client


def get_video_url(file_name: str) -> str:
    """
    Get the CloudFront URL for a video file.

    Args:
        file_name: S3 object key (e.g., 'sora_1234567890_jobid.mp4')

    Returns:
        Full CloudFront URL
    """
    return f"https://{settings.cloudfront_domain}/{file_name}"


async def upload_video(
    video_bytes: bytes,
    file_name: str,
    content_type: str = "video/mp4",
) -> str:
    """
    Upload video to S3.

    Args:
        video_bytes: Video file content
        file_name: S3 object key
        content_type: MIME type

    Returns:
        CloudFront URL of the uploaded video
    """
    client = get_s3_client()

    try:
        client.put_object(
            Bucket=settings.videos_bucket,
            Key=file_name,
            Body=video_bytes,
            ContentType=content_type,
        )
        logger.info(f"Uploaded video to S3: {file_name}")
        return get_video_url(file_name)
    except ClientError as e:
        logger.error(f"Failed to upload video to S3: {e}")
        raise


async def delete_video(file_name: str) -> bool:
    """
    Delete video from S3.

    Args:
        file_name: S3 object key

    Returns:
        True if deleted successfully
    """
    client = get_s3_client()

    try:
        client.delete_object(
            Bucket=settings.videos_bucket,
            Key=file_name,
        )
        logger.info(f"Deleted video from S3: {file_name}")
        return True
    except ClientError as e:
        logger.error(f"Failed to delete video from S3: {e}")
        return False


async def delete_videos(file_names: list[str]) -> int:
    """
    Delete multiple videos from S3.

    Args:
        file_names: List of S3 object keys

    Returns:
        Number of successfully deleted files
    """
    if not file_names:
        return 0

    client = get_s3_client()

    try:
        response = client.delete_objects(
            Bucket=settings.videos_bucket,
            Delete={
                "Objects": [{"Key": name} for name in file_names],
                "Quiet": True,
            },
        )
        deleted_count = len(file_names) - len(response.get("Errors", []))
        logger.info(f"Deleted {deleted_count} videos from S3")
        return deleted_count
    except ClientError as e:
        logger.error(f"Failed to delete videos from S3: {e}")
        return 0


def generate_video_filename(
    provider_id: Literal["sora", "veo3"],
    job_id: str,
) -> str:
    """
    Generate a unique filename for a video.

    Args:
        provider_id: Provider ID
        job_id: Provider's job ID

    Returns:
        Filename like 'sora_1234567890_jobid.mp4'
    """
    import time

    # Sanitize job_id (replace / with _)
    safe_job_id = job_id.replace("/", "_")
    timestamp = int(time.time() * 1000)
    return f"{provider_id}_{timestamp}_{safe_job_id}.mp4"


# ============================================================================
# Image-specific S3 operations
# ============================================================================


def get_image_url(file_name: str) -> str:
    """
    Get the CloudFront URL for an image file.

    Args:
        file_name: S3 object key

    Returns:
        Full CloudFront URL
    """
    return f"https://{settings.cloudfront_domain}/{file_name}"


async def upload_image(
    image_bytes: bytes,
    file_name: str,
    content_type: str = "image/png",
) -> str:
    """
    Upload image to S3.

    Args:
        image_bytes: Image file content
        file_name: S3 object key
        content_type: MIME type

    Returns:
        CloudFront URL of the uploaded image
    """
    client = get_s3_client()

    try:
        client.put_object(
            Bucket=settings.videos_bucket,  # Using same bucket for images
            Key=file_name,
            Body=image_bytes,
            ContentType=content_type,
        )
        logger.info(f"Uploaded image to S3: {file_name}")
        return get_image_url(file_name)
    except ClientError as e:
        logger.error(f"Failed to upload image to S3: {e}")
        raise


async def download_image(url: str) -> bytes:
    """
    Download image from URL (supports S3/CloudFront URLs and external URLs).

    Args:
        url: Image URL

    Returns:
        Image bytes
    """
    import httpx

    async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
        response = await client.get(url)
        if not response.is_success:
            raise Exception(f"Failed to download image: {response.status_code}")
        return response.content


def generate_image_filename(
    project_id: str,
    frame_id: str,
    job_id: str,
) -> str:
    """
    Generate a unique filename for a generated image.

    Args:
        project_id: Project ID
        frame_id: Frame ID
        job_id: Job ID

    Returns:
        Filename like 'images/project123/frame456_1234567890.png'
    """
    import time

    timestamp = int(time.time() * 1000)
    # Sanitize IDs (replace / with _)
    safe_project_id = project_id.replace("/", "_")
    safe_frame_id = frame_id.replace("/", "_")
    return f"images/{safe_project_id}/{safe_frame_id}_{timestamp}.png"


def generate_bg_filename(
    project_id: str,
    bg_id: str,
    angle: str,
) -> str:
    """
    Generate a unique filename for a generated background image.

    Args:
        project_id: Project ID
        bg_id: Background ID
        angle: Angle name (e.g., "Front View", "Worm View")

    Returns:
        Filename like 'backgrounds/project123/bg001/front_view_1234567890.png'
    """
    import time

    timestamp = int(time.time() * 1000)
    # Sanitize IDs (replace / with _, spaces with _)
    safe_project_id = project_id.replace("/", "_")
    safe_bg_id = bg_id.replace("/", "_")
    safe_angle = angle.replace(" ", "_").replace("/", "_").lower()
    return f"backgrounds/{safe_project_id}/{safe_bg_id}/{safe_angle}_{timestamp}.png"


def generate_prop_design_sheet_filename(
    project_id: str,
    prop_id: str,
) -> str:
    """
    Generate a unique filename for a generated prop design sheet image.

    Args:
        project_id: Project ID
        prop_id: Prop ID

    Returns:
        Filename like 'props/project123/prop001/design_sheet_1234567890.png'
    """
    import time

    timestamp = int(time.time() * 1000)
    # Sanitize IDs (replace / with _, spaces with _)
    safe_project_id = project_id.replace("/", "_")
    safe_prop_id = prop_id.replace("/", "_").replace(" ", "_")
    return f"props/{safe_project_id}/{safe_prop_id}/design_sheet_{timestamp}.png"


def generate_panel_filename(
    project_id: str,
    panel_id: str,
    job_id: str,
) -> str:
    """
    Generate a unique filename for a generated panel image.

    Uses project-based path to match ImageSplitter's pattern:
    - ImageSplitter stores at: mithril/{projectId}/i2v/panels/
    - Panel Editor stores at:  mithril/{projectId}/i2v/edited-panels/

    Args:
        project_id: Project ID
        panel_id: Panel ID
        job_id: Job ID

    Returns:
        Filename like 'mithril/project123/i2v/edited-panels/panel456_1234567890.png'
    """
    import time

    timestamp = int(time.time() * 1000)
    # Sanitize IDs (replace / with _)
    safe_project_id = project_id.replace("/", "_")
    safe_panel_id = panel_id.replace("/", "_")
    return f"mithril/{safe_project_id}/i2v/edited-panels/{safe_panel_id}_{timestamp}.png"


async def upload_reference_images(
    project_id: str,
    frame_id: str,
    images: list[tuple[bytes, str]],  # List of (image_bytes, category)
) -> list[str]:
    """
    Upload reference images to S3 for job processing.

    Args:
        project_id: Project ID
        frame_id: Frame ID
        images: List of (image_bytes, category) tuples

    Returns:
        List of S3 URLs
    """
    import time

    urls = []
    timestamp = int(time.time() * 1000)
    safe_project_id = project_id.replace("/", "_")
    safe_frame_id = frame_id.replace("/", "_")

    for i, (img_bytes, category) in enumerate(images):
        file_name = f"refs/{safe_project_id}/{safe_frame_id}_{timestamp}_{category}_{i}.webp"
        url = await upload_image(img_bytes, file_name, "image/webp")
        urls.append(url)

    return urls