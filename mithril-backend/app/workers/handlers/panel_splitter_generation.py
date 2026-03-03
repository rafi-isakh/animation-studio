"""Panel Splitter generation task handler."""

import asyncio
import base64
import io
import json
import logging
import uuid

import httpx
from google import genai
from google.genai import types
from PIL import Image

from app.config import get_settings
from app.core.errors import (
    VideoJobError,
    classify_exception,
)
from app.core.state_machine import JobStateMachine
from app.models.job import JobDocument, JobStatus
from app.services.firestore import get_job_queue_service
from app.services.s3 import upload_image

logger = logging.getLogger(__name__)
settings = get_settings()

# Concurrency control: limit to 3 concurrent panel splitter jobs per worker
# This prevents API rate limit issues and reduces memory pressure
PANEL_SPLITTER_CONCURRENCY = 3
_panel_splitter_semaphore: asyncio.Semaphore | None = None


def get_panel_splitter_semaphore() -> asyncio.Semaphore:
    """Get or create the panel splitter semaphore (lazy init for correct event loop)."""
    global _panel_splitter_semaphore
    if _panel_splitter_semaphore is None:
        _panel_splitter_semaphore = asyncio.Semaphore(PANEL_SPLITTER_CONCURRENCY)
        logger.info(f"[PANEL-SPLITTER] Initialized concurrency semaphore (max {PANEL_SPLITTER_CONCURRENCY})")
    return _panel_splitter_semaphore

MODEL_NAME = "gemini-3.1-pro-preview"


class CancellationRequested(Exception):
    """Raised when job cancellation is detected."""
    pass


async def check_cancellation(job_id: str) -> None:
    """
    Check if cancellation has been requested for a job.

    Args:
        job_id: The job ID to check

    Raises:
        CancellationRequested: If cancellation was requested
    """
    job_queue_service = get_job_queue_service()
    job = await job_queue_service.get_job(job_id)
    if job and job.cancellation_requested:
        logger.info(f"Cancellation detected for panel splitter job {job_id}")
        raise CancellationRequested(f"Job {job_id} was cancelled by user")


def _get_api_key(job: JobDocument, custom_api_key: str | None = None) -> str:
    """Get API key for Gemini.

    Priority:
    1. Custom API key passed through task queue
    2. Fallback to environment variable settings
    """
    if custom_api_key:
        return custom_api_key

    if not settings.gemini_api_key:
        raise VideoJobError.invalid_request("No Gemini API key configured")
    return settings.gemini_api_key


WEBP_MAX_DIM = 16383  # WebP encoder hard limit per dimension


def fit_for_webp(image: Image.Image) -> Image.Image:
    """Scale image down proportionally if either dimension exceeds the WebP limit.

    Only triggers for images larger than 16383px in any direction (e.g. very
    long webtoon pages). Has no effect on normal-sized images.
    """
    w, h = image.size
    if w <= WEBP_MAX_DIM and h <= WEBP_MAX_DIM:
        return image
    scale = min(WEBP_MAX_DIM / w, WEBP_MAX_DIM / h)
    logger.warning(
        f"[PANEL-SPLITTER] Image {w}×{h} exceeds WebP limit, "
        f"scaling to {int(w * scale)}×{int(h * scale)}"
    )
    return image.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)


def optimize_image_for_ai(image: Image.Image, max_size: int = 1600) -> Image.Image:
    """Resize image to max dimensions while maintaining aspect ratio."""
    width, height = image.size
    if width <= max_size and height <= max_size:
        return image

    ratio = min(max_size / width, max_size / height)
    new_size = (int(width * ratio), int(height * ratio))
    return image.resize(new_size, Image.Resampling.LANCZOS)


def crop_panel(image: Image.Image, box_2d: list[int]) -> Image.Image:
    """Crop panel from image using box_2d coordinates (0-1000 scale)."""
    width, height = image.size
    ymin, xmin, ymax, xmax = box_2d

    # Convert 0-1000 scale to pixels
    left = int(xmin * width / 1000)
    top = int(ymin * height / 1000)
    right = int(xmax * width / 1000)
    bottom = int(ymax * height / 1000)

    # Ensure valid crop bounds
    left = max(0, min(left, width - 1))
    top = max(0, min(top, height - 1))
    right = max(left + 1, min(right, width))
    bottom = max(top + 1, min(bottom, height))

    return image.crop((left, top, right, bottom))


async def detect_panels_with_gemini(
    image: Image.Image,
    reading_direction: str,
    api_key: str,
) -> list[dict]:
    """Call Gemini to detect panels in manga/comic page."""
    client = genai.Client(api_key=api_key)

    direction_desc = "right-to-left (Manga)" if reading_direction == "rtl" else "left-to-right (Western Comic)"

    system_instruction = f"""You are an expert at analyzing manga and comic pages for animation storyboard creation.
Analyze the image and detect individual panels that could be animated separately.

Reading Direction: {direction_desc}

For each panel, return bounding box coordinates in [ymin, xmin, ymax, xmax] format using 0-1000 scale.
Order panels according to the reading direction.

Include:
- Main story panels (separate overlapping panels)
- Character close-ups
- Action sequences
- Background/scenery panels

Exclude:
- Speech bubbles (they're part of containing panel)
- Sound effects only
- Page margins"""

    response_schema = {
        "type": "OBJECT",
        "properties": {
            "panels": {
                "type": "ARRAY",
                "items": {
                    "type": "OBJECT",
                    "properties": {
                        "box_2d": {
                            "type": "ARRAY",
                            "items": {"type": "INTEGER"},
                            "description": "[ymin, xmin, ymax, xmax] in 0-1000 scale"
                        },
                        "label": {
                            "type": "STRING",
                            "description": "Brief description of panel content"
                        }
                    },
                    "required": ["box_2d"]
                }
            }
        },
        "required": ["panels"]
    }

    # Convert image to bytes
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", quality=85)
    image_bytes = buffer.getvalue()

    # Retry with exponential backoff
    max_retries = 3
    delay = 2000  # ms

    for attempt in range(max_retries):
        try:
            response = await client.aio.models.generate_content(
                model=MODEL_NAME,
                contents=[
                    types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
                    "Detect all panels in this manga/comic page."
                ],
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                    response_schema=response_schema,
                ),
            )
            break
        except Exception as e:
            error_msg = str(e)
            if ("503" in error_msg or "overloaded" in error_msg or "UNAVAILABLE" in error_msg) and attempt < max_retries - 1:
                logger.warning(f"Attempt {attempt + 1} failed due to model overload. Retrying in {delay}ms...")
                await asyncio.sleep(delay / 1000)
                delay *= 2
            else:
                raise

    response_text = response.text.strip() if response.text else ""
    if not response_text:
        raise ValueError("Empty response from Gemini API")

    result = json.loads(response_text)
    panels = result.get("panels", [])

    # Validate panel data
    valid_panels = []
    for panel in panels:
        box_2d = panel.get("box_2d", [])
        if len(box_2d) == 4 and all(isinstance(x, (int, float)) for x in box_2d):
            valid_panels.append({
                "box_2d": [int(x) for x in box_2d],
                "label": panel.get("label", "")
            })

    return valid_panels


async def process_panel_splitter(
    job_id: str,
    image_url: str,
    custom_api_key: str | None = None,
    worker_id: str = "worker-1",
) -> dict:
    """
    Detect panels in a manga/comic page and crop them.

    Steps:
    1. Download image from S3 URL
    2. Optimize image for AI (max 1600x1600)
    3. Call Gemini with panel detection prompt
    4. Crop panels from original image
    5. Upload cropped panels to S3
    6. Update Firestore with results

    Args:
        job_id: The job ID to process
        image_url: S3/CloudFront URL of the page image (uploaded by frontend)
        custom_api_key: Optional custom API key (passed through task queue)
        worker_id: ID of the worker processing this job

    Returns:
        dict with status and result information
    """
    # Acquire semaphore to limit concurrent processing
    semaphore = get_panel_splitter_semaphore()
    logger.info(f"[PANEL-SPLITTER] Job {job_id} waiting for semaphore...")

    async with semaphore:
        return await _process_panel_splitter_impl(
            job_id, image_url, custom_api_key, worker_id
        )


async def _process_panel_splitter_impl(
    job_id: str,
    image_url: str,
    custom_api_key: str | None = None,
    worker_id: str = "worker-1",
) -> dict:
    """Internal implementation of panel splitter processing (runs under semaphore)."""
    job_queue_service = get_job_queue_service()

    logger.info(f"[{worker_id}] ========== Starting panel splitter job {job_id} (acquired semaphore) ==========")

    # Fetch job from Firestore
    job = await job_queue_service.get_job(job_id)
    if not job:
        logger.error(f"[PANEL-SPLITTER] Job {job_id} not found in Firestore")
        return {"job_id": job_id, "status": "error", "error": "Job not found"}

    logger.info(f"[PANEL-SPLITTER] Job {job_id} loaded: project={job.project_id}, page={job.page_id}")
    logger.info(f"[PANEL-SPLITTER] Reading direction: {job.reading_direction}")

    # Initialize state machine
    state_machine = JobStateMachine(job_id, job.status)

    # Mark job as being processed by this worker
    await job_queue_service.update_job(job_id, worker_id=worker_id)

    try:
        # Get API key
        api_key = _get_api_key(job, custom_api_key)

        # Check for cancellation before processing
        await check_cancellation(job_id)

        # 1. Download image from S3/CloudFront URL (frontend uploads to S3 first)
        if not image_url:
            raise ValueError("No source image URL provided")

        logger.info(f"[PANEL-SPLITTER] {job_id} - Downloading image from {image_url[:80]}...")
        async with httpx.AsyncClient(timeout=60.0) as http:
            resp = await http.get(image_url)
            resp.raise_for_status()
            image_data = resp.content

        original_image = Image.open(io.BytesIO(image_data))
        logger.info(f"[PANEL-SPLITTER] {job_id} - Original image size: {original_image.size}")

        # 2. Optimize image for AI
        optimized_image = optimize_image_for_ai(original_image, max_size=1600)
        logger.info(f"[PANEL-SPLITTER] {job_id} - Optimized image size: {optimized_image.size}")

        # 3. GENERATING: Call Gemini for panel detection
        state_machine.transition_to(JobStatus.GENERATING)
        await job_queue_service.update_job_status(job_id, JobStatus.GENERATING, progress=0.2)
        logger.info(f"[PANEL-SPLITTER] {job_id} - Status updated to GENERATING")

        # Check for cancellation before AI call
        await check_cancellation(job_id)

        panels = await detect_panels_with_gemini(
            optimized_image,
            job.reading_direction or "rtl",
            api_key,
        )
        logger.info(f"[PANEL-SPLITTER] {job_id} - Detected {len(panels)} panels")

        # Check for cancellation after AI call
        await check_cancellation(job_id)

        if not panels:
            logger.warning(f"[PANEL-SPLITTER] {job_id} - No panels detected")
            # Still complete successfully with empty panels
            state_machine.transition_to(JobStatus.COMPLETED)
            await job_queue_service.update_job_status(
                job_id,
                JobStatus.COMPLETED,
                progress=1.0,
                detected_panels=[],
            )
            return {
                "job_id": job_id,
                "status": "completed",
                "panel_count": 0,
            }

        # 4. UPLOADING: Crop panels and upload to S3
        #    (Source page is already on S3 — uploaded by frontend before submission)
        state_machine.transition_to(JobStatus.UPLOADING)
        await job_queue_service.update_job_status(job_id, JobStatus.UPLOADING, progress=0.4)
        logger.info(f"[PANEL-SPLITTER] {job_id} - Status updated to UPLOADING")

        # Store the page image URL on the job (already on S3, no re-upload needed)
        page_image_url = image_url
        await job_queue_service.update_job(job_id, image_url=page_image_url)

        await job_queue_service.update_job_status(job_id, JobStatus.UPLOADING, progress=0.5)

        detected_panels = []
        for i, panel in enumerate(panels):
            # Check for cancellation periodically
            if i % 3 == 0:
                await check_cancellation(job_id)

            # Crop from original resolution
            try:
                cropped = crop_panel(original_image, panel["box_2d"])
            except Exception as e:
                logger.warning(f"[PANEL-SPLITTER] {job_id} - Failed to crop panel {i}: {e}")
                continue

            # Upload to S3. Include job_id prefix for cache-busting (same reason as page key).
            panel_id = str(uuid.uuid4())
            s3_key = f"mithril/{job.project_id}/i2v/panels/{job.page_index}_{i}_{job_id[:8]}.webp"

            buffer = io.BytesIO()
            fit_for_webp(cropped).save(buffer, format="WEBP", quality=90)
            buffer.seek(0)

            try:
                url = await upload_image(buffer.getvalue(), s3_key, "image/webp")
            except Exception as e:
                logger.warning(f"[PANEL-SPLITTER] {job_id} - Failed to upload panel {i}: {e}")
                continue

            detected_panels.append({
                "id": panel_id,
                "box_2d": panel["box_2d"],
                "label": panel.get("label", f"Panel {i + 1}"),
                "imageUrl": url,
            })

            # Update progress
            progress = 0.5 + (0.4 * (i + 1) / len(panels))
            await job_queue_service.update_job_status(job_id, JobStatus.UPLOADING, progress=progress)

        logger.info(f"[PANEL-SPLITTER] {job_id} - Successfully cropped and uploaded {len(detected_panels)} panels")

        # 5. COMPLETED
        state_machine.transition_to(JobStatus.COMPLETED)
        await job_queue_service.update_job_status(
            job_id,
            JobStatus.COMPLETED,
            progress=1.0,
            detected_panels=detected_panels,
        )

        logger.info(f"[PANEL-SPLITTER] {job_id} ========== JOB COMPLETED SUCCESSFULLY ==========")
        return {
            "job_id": job_id,
            "status": "completed",
            "panel_count": len(detected_panels),
        }

    except CancellationRequested:
        logger.info(f"[PANEL-SPLITTER] {job_id} - Job was cancelled")
        await job_queue_service.update_job_status(
            job_id,
            JobStatus.CANCELLED,
            progress=0.0,
        )
        return {
            "job_id": job_id,
            "status": "cancelled",
        }

    except Exception as e:
        logger.exception(f"[PANEL-SPLITTER] {job_id} - Error during processing: {e}")

        # Classify the error
        error_info = classify_exception(e)

        # Update job status to failed
        await job_queue_service.update_job_status(
            job_id,
            JobStatus.FAILED,
            error_code=error_info.code.value,
            error_message=str(e),
            error_retryable=error_info.retryable,
        )

        return {
            "job_id": job_id,
            "status": "failed",
            "error": str(e),
            "error_code": error_info.code.value,
            "retryable": error_info.retryable,
        }
