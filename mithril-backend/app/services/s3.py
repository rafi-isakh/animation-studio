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