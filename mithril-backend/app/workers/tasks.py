"""Taskiq task definitions."""

import logging
import socket

from app.workers.broker import broker

logger = logging.getLogger(__name__)


def get_worker_id() -> str:
    """Generate a unique worker ID."""
    hostname = socket.gethostname()
    return f"worker-{hostname}"


@broker.task
async def process_video_job(job_id: str, api_key: str | None = None) -> dict:
    """
    Main video generation task.

    This task handles the full lifecycle:
    1. Validate and prepare request
    2. Submit to provider (Sora/Veo3)
    3. Poll for completion
    4. Upload to S3
    5. Update Firestore

    Args:
        job_id: The job ID in Firestore job_queue collection
        api_key: Optional custom API key (passed through task queue, not stored)

    Returns:
        dict with status and result information
    """
    from app.workers.handlers.video_generation import process_video_generation

    worker_id = get_worker_id()
    logger.info(f"[{worker_id}] Processing video job: {job_id} (custom_key: {bool(api_key)})")

    try:
        result = await process_video_generation(job_id, worker_id, api_key)
        logger.info(f"[{worker_id}] Job {job_id} finished with status: {result.get('status')}")
        return result

    except Exception as e:
        logger.exception(f"[{worker_id}] Unhandled error in job {job_id}")
        return {
            "job_id": job_id,
            "status": "error",
            "error": str(e),
        }


@broker.task
async def retry_failed_job(
    job_id: str,
    delay_seconds: float = 0,
    api_key: str | None = None,
) -> dict:
    """
    Retry a failed job after a delay.

    Args:
        job_id: The job ID to retry
        delay_seconds: Delay before processing
        api_key: Optional API key (if not provided, uses settings fallback)

    Returns:
        dict with status and result information
    """
    import asyncio

    if delay_seconds > 0:
        logger.info(f"Waiting {delay_seconds}s before retrying job {job_id}")
        await asyncio.sleep(delay_seconds)

    return await process_video_job(job_id, api_key)


# ============================================================================
# Image Generation Tasks
# ============================================================================


@broker.task
async def process_image_job(job_id: str, api_key: str | None = None) -> dict:
    """
    Main image generation task.

    This task handles the full lifecycle:
    1. Fetch reference images from S3
    2. Call Gemini API to generate image
    3. Upload result to S3
    4. Update Firestore

    Args:
        job_id: The job ID in Firestore job_queue collection
        api_key: Optional custom API key (passed through task queue, not stored)

    Returns:
        dict with status and result information
    """
    from app.workers.handlers.image_generation import process_image_generation

    worker_id = get_worker_id()
    logger.info(f"[{worker_id}] Processing image job: {job_id} (custom_key: {bool(api_key)})")

    try:
        result = await process_image_generation(job_id, worker_id, api_key)
        logger.info(f"[{worker_id}] Image job {job_id} finished with status: {result.get('status')}")
        return result

    except Exception as e:
        logger.exception(f"[{worker_id}] Unhandled error in image job {job_id}")
        return {
            "job_id": job_id,
            "status": "error",
            "error": str(e),
        }


@broker.task
async def retry_failed_image_job(
    job_id: str,
    delay_seconds: float = 0,
    api_key: str | None = None,
) -> dict:
    """
    Retry a failed image job after a delay.

    Args:
        job_id: The job ID to retry
        delay_seconds: Delay before processing
        api_key: Optional API key (if not provided, uses settings fallback)

    Returns:
        dict with status and result information
    """
    import asyncio

    if delay_seconds > 0:
        logger.info(f"Waiting {delay_seconds}s before retrying image job {job_id}")
        await asyncio.sleep(delay_seconds)

    return await process_image_job(job_id, api_key)


# ============================================================================
# Background Generation Tasks
# ============================================================================


@broker.task
async def process_bg_job(job_id: str, api_key: str | None = None) -> dict:
    """
    Main background generation task.

    This task handles the full lifecycle:
    1. Validate job
    2. Call Gemini API to generate background image (text-only)
    3. Upload result to S3
    4. Update Firestore

    Args:
        job_id: The job ID in Firestore job_queue collection
        api_key: Optional custom API key (passed through task queue, not stored)

    Returns:
        dict with status and result information
    """
    from app.workers.handlers.bg_generation import process_bg_generation

    worker_id = get_worker_id()
    logger.info(f"[{worker_id}] Processing bg job: {job_id} (custom_key: {bool(api_key)})")

    try:
        result = await process_bg_generation(job_id, worker_id, api_key)
        logger.info(f"[{worker_id}] BG job {job_id} finished with status: {result.get('status')}")
        return result

    except Exception as e:
        logger.exception(f"[{worker_id}] Unhandled error in bg job {job_id}")
        return {
            "job_id": job_id,
            "status": "error",
            "error": str(e),
        }


@broker.task
async def retry_failed_bg_job(
    job_id: str,
    delay_seconds: float = 0,
    api_key: str | None = None,
) -> dict:
    """
    Retry a failed background job after a delay.

    Args:
        job_id: The job ID to retry
        delay_seconds: Delay before processing
        api_key: Optional API key (if not provided, uses settings fallback)

    Returns:
        dict with status and result information
    """
    import asyncio

    if delay_seconds > 0:
        logger.info(f"Waiting {delay_seconds}s before retrying bg job {job_id}")
        await asyncio.sleep(delay_seconds)

    return await process_bg_job(job_id, api_key)


# ============================================================================
# Prop Design Sheet Generation Tasks
# ============================================================================


@broker.task
async def process_prop_design_sheet_job(job_id: str, api_key: str | None = None) -> dict:
    """
    Main prop design sheet generation task.

    This task handles the full lifecycle:
    1. Fetch reference images from S3
    2. Call Gemini API to generate design sheet image
    3. Upload result to S3
    4. Update Firestore

    Args:
        job_id: The job ID in Firestore job_queue collection
        api_key: Optional custom API key (passed through task queue, not stored)

    Returns:
        dict with status and result information
    """
    from app.workers.handlers.prop_design_sheet_generation import process_prop_design_sheet_generation

    worker_id = get_worker_id()
    logger.info(f"[{worker_id}] Processing prop design sheet job: {job_id} (custom_key: {bool(api_key)})")

    try:
        result = await process_prop_design_sheet_generation(job_id, worker_id, api_key)
        logger.info(f"[{worker_id}] Prop design sheet job {job_id} finished with status: {result.get('status')}")
        return result

    except Exception as e:
        logger.exception(f"[{worker_id}] Unhandled error in prop design sheet job {job_id}")
        return {
            "job_id": job_id,
            "status": "error",
            "error": str(e),
        }


@broker.task
async def retry_failed_prop_design_sheet_job(
    job_id: str,
    delay_seconds: float = 0,
    api_key: str | None = None,
) -> dict:
    """
    Retry a failed prop design sheet job after a delay.

    Args:
        job_id: The job ID to retry
        delay_seconds: Delay before processing
        api_key: Optional API key (if not provided, uses settings fallback)

    Returns:
        dict with status and result information
    """
    import asyncio

    if delay_seconds > 0:
        logger.info(f"Waiting {delay_seconds}s before retrying prop design sheet job {job_id}")
        await asyncio.sleep(delay_seconds)

    return await process_prop_design_sheet_job(job_id, api_key)


# ============================================================================
# Panel Editor Generation Tasks
# ============================================================================


@broker.task
async def process_panel_job(
    job_id: str,
    image_base64: str,
    api_key: str | None = None,
) -> dict:
    """
    Main panel editor generation task.

    This task handles the full lifecycle:
    1. Load source image and build prompt
    2. Call Gemini API to generate transformed panel
    3. Upload result to S3
    4. Update Firestore

    Args:
        job_id: The job ID in Firestore job_queue collection
        image_base64: Base64 encoded image (passed through task queue to avoid Firestore 1MB limit)
        api_key: Optional custom API key (passed through task queue, not stored)

    Returns:
        dict with status and result information
    """
    from app.workers.handlers.panel_generation import process_panel_generation

    worker_id = get_worker_id()
    logger.info(f"[{worker_id}] Processing panel job: {job_id} (custom_key: {bool(api_key)})")

    try:
        result = await process_panel_generation(job_id, image_base64, worker_id, api_key)
        logger.info(f"[{worker_id}] Panel job {job_id} finished with status: {result.get('status')}")
        return result

    except Exception as e:
        logger.exception(f"[{worker_id}] Unhandled error in panel job {job_id}")
        return {
            "job_id": job_id,
            "status": "error",
            "error": str(e),
        }


@broker.task
async def retry_failed_panel_job(
    job_id: str,
    delay_seconds: float = 0,
    image_base64: str = "",
    api_key: str | None = None,
) -> dict:
    """
    Retry a failed panel job after a delay.

    Args:
        job_id: The job ID to retry
        delay_seconds: Delay before processing
        image_base64: Base64 encoded image (passed through task queue to avoid Firestore 1MB limit)
        api_key: Optional API key (if not provided, uses settings fallback)

    Returns:
        dict with status and result information
    """
    import asyncio

    if delay_seconds > 0:
        logger.info(f"Waiting {delay_seconds}s before retrying panel job {job_id}")
        await asyncio.sleep(delay_seconds)

    return await process_panel_job(job_id, image_base64, api_key)


# ============================================================================
# Style Converter (PixAI) Tasks
# ============================================================================


@broker.task
async def process_style_converter_job(
    job_id: str,
    image_base64: str,
    api_key: str | None = None,
) -> dict:
    """
    Main style converter task (pixAI img2img).

    Pipeline:
    1. Upload source image to S3
    2. Submit pixAI img2img task
    3. Poll until completed
    4. Fetch result image bytes
    5. Upload result to S3
    6. Update Firestore with CloudFront URL

    Args:
        job_id: The job ID in Firestore job_queue collection
        image_base64: Base64 encoded image (not stored in Firestore to avoid 1 MB limit)
        api_key: Optional custom PixAI key (falls back to PIXAI_API_KEY env var)

    Returns:
        dict with status and result information
    """
    from app.workers.handlers.style_converter_generation import process_style_converter_generation

    worker_id = get_worker_id()
    logger.info(f"[{worker_id}] Processing style converter job: {job_id} (custom_key: {bool(api_key)})")

    try:
        result = await process_style_converter_generation(job_id, image_base64, worker_id, api_key)
        logger.info(f"[{worker_id}] Style converter job {job_id} finished with status: {result.get('status')}")
        return result
    except Exception as e:
        logger.exception(f"[{worker_id}] Unhandled error in style converter job {job_id}")
        return {"job_id": job_id, "status": "error", "error": str(e)}


@broker.task
async def retry_failed_style_converter_job(
    job_id: str,
    delay_seconds: float = 0,
    image_base64: str = "",
    api_key: str | None = None,
) -> dict:
    import asyncio
    if delay_seconds > 0:
        await asyncio.sleep(delay_seconds)
    return await process_style_converter_job(job_id, image_base64, api_key)


# ============================================================================
# ID Converter Tasks
# ============================================================================


@broker.task
async def process_id_converter_glossary_job(job_id: str, api_key: str | None = None) -> dict:
    """
    ID Converter glossary analysis task.

    Extracts entities (characters, items, locations) from webnovel text.

    Pipeline:
    1. PENDING -> GENERATING: Call Gemini to analyze text
    2. GENERATING -> COMPLETED: Update Firestore with entities

    Args:
        job_id: The job ID in Firestore job_queue collection
        api_key: Optional custom API key (passed through task queue, not stored)

    Returns:
        dict with status and result information
    """
    from app.workers.handlers.id_converter_generation import process_glossary_analysis

    worker_id = get_worker_id()
    logger.info(f"[{worker_id}] Processing ID converter glossary job: {job_id} (custom_key: {bool(api_key)})")

    try:
        result = await process_glossary_analysis(job_id, worker_id, api_key)
        logger.info(f"[{worker_id}] ID converter glossary job {job_id} finished with status: {result.get('status')}")
        return result

    except Exception as e:
        logger.exception(f"[{worker_id}] Unhandled error in ID converter glossary job {job_id}")
        return {
            "job_id": job_id,
            "status": "error",
            "error": str(e),
        }


@broker.task
async def process_id_converter_batch_job(job_id: str, api_key: str | None = None) -> dict:
    """
    ID Converter batch chunk conversion task.

    Converts all text chunks sequentially using the glossary.
    Each chunk is processed with context from the previous chunk.

    Pipeline:
    1. PENDING -> GENERATING: Process chunks one by one
    2. For each chunk: Update progress in Firestore
    3. GENERATING -> COMPLETED: All chunks done

    The worker maintains state in Firestore so it can resume after restart.

    Args:
        job_id: The job ID in Firestore job_queue collection
        api_key: Optional custom API key (passed through task queue, not stored)

    Returns:
        dict with status and result information
    """
    from app.workers.handlers.id_converter_generation import process_batch_conversion

    worker_id = get_worker_id()
    logger.info(f"[{worker_id}] Processing ID converter batch job: {job_id} (custom_key: {bool(api_key)})")

    try:
        result = await process_batch_conversion(job_id, worker_id, api_key)
        logger.info(f"[{worker_id}] ID converter batch job {job_id} finished with status: {result.get('status')}")
        return result

    except Exception as e:
        logger.exception(f"[{worker_id}] Unhandled error in ID converter batch job {job_id}")
        return {
            "job_id": job_id,
            "status": "error",
            "error": str(e),
        }


@broker.task
async def retry_failed_id_converter_job(
    job_id: str,
    delay_seconds: float = 0,
    api_key: str | None = None,
) -> dict:
    """
    Retry a failed ID converter job after a delay.

    Automatically determines job type (glossary or batch) and routes
    to the appropriate handler.

    Args:
        job_id: The job ID to retry
        delay_seconds: Delay before processing
        api_key: Optional API key (if not provided, uses settings fallback)

    Returns:
        dict with status and result information
    """
    import asyncio
    from app.models.job import JobType
    from app.services.firestore import get_job_queue_service

    if delay_seconds > 0:
        logger.info(f"Waiting {delay_seconds}s before retrying ID converter job {job_id}")
        await asyncio.sleep(delay_seconds)

    # Determine job type and route to correct handler
    job_queue_service = get_job_queue_service()
    job = await job_queue_service.get_job(job_id)

    if not job:
        logger.error(f"Cannot retry ID converter job {job_id}: job not found")
        return {"job_id": job_id, "status": "error", "error": "Job not found"}

    if job.type == JobType.ID_CONVERTER_GLOSSARY:
        return await process_id_converter_glossary_job(job_id, api_key)
    elif job.type == JobType.ID_CONVERTER_BATCH:
        return await process_id_converter_batch_job(job_id, api_key)
    else:
        logger.error(f"Cannot retry job {job_id}: unexpected type {job.type}")
        return {"job_id": job_id, "status": "error", "error": f"Unexpected job type: {job.type}"}


# ============================================================================
# Story Splitter Tasks
# ============================================================================


@broker.task
async def process_story_splitter_job(job_id: str, api_key: str | None = None) -> dict:
    """
    Story splitter task.

    Splits a story into multiple parts with cliffhanger analysis.

    Pipeline:
    1. PENDING -> GENERATING: Call Gemini to analyze and split text
    2. GENERATING -> COMPLETED: Update Firestore with split parts

    Args:
        job_id: The job ID in Firestore job_queue collection
        api_key: Optional custom API key (passed through task queue, not stored)

    Returns:
        dict with status and result information
    """
    from app.workers.handlers.story_splitter_generation import process_story_splitter

    logger.info(f"[STORY-SPLITTER-TASK] ========== Starting story splitter job {job_id} ==========")
    logger.info(f"[STORY-SPLITTER-TASK] Has custom API key: {bool(api_key)}")

    try:
        result = await process_story_splitter(job_id, api_key)
        logger.info(f"[STORY-SPLITTER-TASK] Job {job_id} completed: {result.get('status', 'unknown')}")
        return result
    except Exception as e:
        logger.exception(f"[STORY-SPLITTER-TASK] Job {job_id} failed with exception: {e}")
        return {
            "job_id": job_id,
            "status": "error",
            "error": str(e),
        }


@broker.task
async def retry_failed_story_splitter_job(
    job_id: str,
    delay_seconds: int = 0,
    api_key: str | None = None,
) -> dict:
    """
    Retry a failed story splitter job after a delay.

    This task is scheduled when a transient error occurs and the job
    should be retried after some backoff period.
    """
    import asyncio

    if delay_seconds > 0:
        logger.info(f"Waiting {delay_seconds}s before retrying story splitter job {job_id}")
        await asyncio.sleep(delay_seconds)

    return await process_story_splitter_job(job_id, api_key)


# ============================================================================
# Storyboard Generation Tasks
# ============================================================================


@broker.task
async def process_storyboard_job(job_id: str, api_key: str | None = None) -> dict:
    """
    Storyboard generation task.

    Generates scenes, clips, and voice prompts from source text.

    Pipeline:
    1. PENDING -> GENERATING: Call Gemini to generate storyboard
    2. GENERATING -> COMPLETED: Update Firestore with scenes and clips

    Args:
        job_id: The job ID in Firestore job_queue collection
        api_key: Optional custom API key (passed through task queue, not stored)

    Returns:
        dict with status and result information
    """
    from app.workers.handlers.storyboard_generation import process_storyboard

    logger.info(f"[STORYBOARD-TASK] ========== Starting storyboard job {job_id} ==========")
    logger.info(f"[STORYBOARD-TASK] Has custom API key: {bool(api_key)}")

    try:
        result = await process_storyboard(job_id, api_key)
        logger.info(f"[STORYBOARD-TASK] Job {job_id} completed: {result.get('status', 'unknown')}")
        return result
    except Exception as e:
        logger.exception(f"[STORYBOARD-TASK] Job {job_id} failed with exception: {e}")
        return {
            "job_id": job_id,
            "status": "error",
            "error": str(e),
        }


@broker.task
async def retry_failed_storyboard_job(
    job_id: str,
    delay_seconds: int = 0,
    api_key: str | None = None,
) -> dict:
    """
    Retry a failed storyboard job after a delay.

    This task is scheduled when a transient error occurs and the job
    should be retried after some backoff period.
    """
    import asyncio

    if delay_seconds > 0:
        logger.info(f"Waiting {delay_seconds}s before retrying storyboard job {job_id}")
        await asyncio.sleep(delay_seconds)

    return await process_storyboard_job(job_id, api_key)


# ============================================================================
# I2V Storyboard Generation Tasks
# ============================================================================


@broker.task
async def process_i2v_storyboard_job(job_id: str, api_key: str | None = None) -> dict:
    """
    I2V storyboard generation task.

    Generates scenes, clips, and voice prompts from manga panel images.

    Pipeline:
    1. PENDING -> PREPARING: Download panel images from S3
    2. PREPARING -> GENERATING: Call Gemini with images + prompt
    3. GENERATING -> COMPLETED: Update Firestore with scenes and clips

    Args:
        job_id: The job ID in Firestore job_queue collection
        api_key: Optional custom API key (passed through task queue, not stored)

    Returns:
        dict with status and result information
    """
    from app.workers.handlers.i2v_storyboard_generation import process_i2v_storyboard

    worker_id = get_worker_id()
    logger.info(f"[I2V-STORYBOARD-TASK] ========== Starting I2V storyboard job {job_id} ==========")
    logger.info(f"[I2V-STORYBOARD-TASK] Has custom API key: {bool(api_key)}")

    try:
        result = await process_i2v_storyboard(job_id, api_key, worker_id)
        logger.info(f"[I2V-STORYBOARD-TASK] Job {job_id} completed: {result.get('status', 'unknown')}")
        return result
    except Exception as e:
        logger.exception(f"[I2V-STORYBOARD-TASK] Job {job_id} failed with exception: {e}")
        return {
            "job_id": job_id,
            "status": "error",
            "error": str(e),
        }


@broker.task
async def retry_failed_i2v_storyboard_job(
    job_id: str,
    delay_seconds: int = 0,
    api_key: str | None = None,
) -> dict:
    """
    Retry a failed I2V storyboard job after a delay.
    """
    import asyncio

    if delay_seconds > 0:
        logger.info(f"Waiting {delay_seconds}s before retrying I2V storyboard job {job_id}")
        await asyncio.sleep(delay_seconds)

    return await process_i2v_storyboard_job(job_id, api_key)


# ============================================================================
# Panel Splitter Tasks
# ============================================================================


@broker.task
async def process_panel_splitter_job(
    job_id: str,
    image_url: str,
    api_key: str | None = None,
) -> dict:
    """
    Panel splitter task.

    Detects panels in manga/comic page and crops them.

    Pipeline:
    1. PENDING -> GENERATING: Call Gemini to detect panels
    2. GENERATING -> UPLOADING: Crop panels and upload to S3
    3. UPLOADING -> COMPLETED: Update Firestore with panel URLs

    Args:
        job_id: The job ID in Firestore job_queue collection
        image_url: S3/CloudFront URL of the page image (uploaded by frontend)
        api_key: Optional custom API key (passed through task queue, not stored)

    Returns:
        dict with status and result information
    """
    from app.workers.handlers.panel_splitter_generation import process_panel_splitter

    logger.info(f"[PANEL-SPLITTER-TASK] ========== Starting panel splitter job {job_id} ==========")
    logger.info(f"[PANEL-SPLITTER-TASK] Has custom API key: {bool(api_key)}")
    logger.info(f"[PANEL-SPLITTER-TASK] Image URL: {image_url[:80] if image_url else 'None'}...")

    try:
        result = await process_panel_splitter(job_id, image_url, api_key)
        logger.info(f"[PANEL-SPLITTER-TASK] Job {job_id} completed: {result.get('status', 'unknown')}")
        return result
    except Exception as e:
        logger.exception(f"[PANEL-SPLITTER-TASK] Job {job_id} failed with exception: {e}")
        return {
            "job_id": job_id,
            "status": "error",
            "error": str(e),
        }


@broker.task
async def retry_failed_panel_splitter_job(
    job_id: str,
    image_url: str,
    delay_seconds: int = 0,
    api_key: str | None = None,
) -> dict:
    """
    Retry a failed panel splitter job after a delay.

    This task is scheduled when a transient error occurs and the job
    should be retried after some backoff period.
    """
    import asyncio

    if delay_seconds > 0:
        logger.info(f"Waiting {delay_seconds}s before retrying panel splitter job {job_id}")
        await asyncio.sleep(delay_seconds)

    return await process_panel_splitter_job(job_id, image_url, api_key)


# ============================================================================
# Panel Colorizer Tasks
# ============================================================================


@broker.task
async def process_panel_colorizer_job(
    job_id: str,
    image_base64: str,
    reference_images: list[dict] | None = None,
    api_key: str | None = None,
) -> dict:
    """
    Main panel colorizer generation task.

    Colorizes B&W manga panels into full-color anime-style images.

    Args:
        job_id: The job ID in Firestore job_queue collection
        image_base64: Base64 encoded image (passed through task queue)
        reference_images: List of {base64, mime_type} dicts for color references
        api_key: Optional custom API key

    Returns:
        dict with status and result information
    """
    from app.workers.handlers.panel_colorizer_generation import process_panel_colorizer_generation

    worker_id = get_worker_id()
    logger.info(f"[{worker_id}] Processing panel colorizer job: {job_id} (custom_key: {bool(api_key)})")

    try:
        result = await process_panel_colorizer_generation(
            job_id, image_base64, reference_images or [], worker_id, api_key
        )
        logger.info(f"[{worker_id}] Panel colorizer job {job_id} finished: {result.get('status')}")
        return result

    except Exception as e:
        logger.exception(f"[{worker_id}] Unhandled error in panel colorizer job {job_id}")
        return {
            "job_id": job_id,
            "status": "error",
            "error": str(e),
        }


@broker.task
async def retry_failed_panel_colorizer_job(
    job_id: str,
    delay_seconds: float = 0,
    image_base64: str = "",
    reference_images: list[dict] | None = None,
    api_key: str | None = None,
) -> dict:
    """Retry a failed panel colorizer job after a delay."""
    import asyncio

    if delay_seconds > 0:
        logger.info(f"Waiting {delay_seconds}s before retrying panel colorizer job {job_id}")
        await asyncio.sleep(delay_seconds)

    return await process_panel_colorizer_job(job_id, image_base64, reference_images, api_key)


# ============================================================================
# Storyboard Editor Tasks
# ============================================================================


@broker.task
async def process_storyboard_editor_job(job_id: str, api_key: str | None = None) -> dict:
    """
    Storyboard editor generation/remix task.

    Generates or remixes anime frames from manga panels using Gemini.

    Pipeline:
    1. PENDING -> PREPARING: Fetch reference/asset images from S3
    2. PREPARING -> GENERATING: Call Gemini API (generate or remix)
    3. GENERATING -> UPLOADING: Upload result to S3
    4. UPLOADING -> COMPLETED: Update Firestore with image URL

    Args:
        job_id: The job ID in Firestore job_queue collection
        api_key: Optional custom API key (passed through task queue, not stored)

    Returns:
        dict with status and result information
    """
    from app.workers.handlers.storyboard_editor_generation import process_storyboard_editor_generation

    worker_id = get_worker_id()
    logger.info(f"[STORYBOARD-EDITOR-TASK] ========== Starting job {job_id} ==========")
    logger.info(f"[STORYBOARD-EDITOR-TASK] Has custom API key: {bool(api_key)}")

    try:
        result = await process_storyboard_editor_generation(job_id, worker_id, api_key)
        logger.info(f"[STORYBOARD-EDITOR-TASK] Job {job_id} completed: {result.get('status', 'unknown')}")
        return result
    except Exception as e:
        logger.exception(f"[STORYBOARD-EDITOR-TASK] Job {job_id} failed with exception: {e}")
        return {
            "job_id": job_id,
            "status": "error",
            "error": str(e),
        }


@broker.task
async def retry_failed_storyboard_editor_job(
    job_id: str,
    delay_seconds: float = 0,
    api_key: str | None = None,
) -> dict:
    """Retry a failed storyboard editor job after a delay."""
    import asyncio

    if delay_seconds > 0:
        logger.info(f"Waiting {delay_seconds}s before retrying storyboard editor job {job_id}")
        await asyncio.sleep(delay_seconds)

    return await process_storyboard_editor_job(job_id, api_key)


# ============================================================================
# Maintenance Tasks
# ============================================================================


@broker.task
async def cleanup_stale_jobs() -> dict:
    """
    Periodic task to clean up stale jobs.

    Finds jobs stuck in active states for too long and moves them to failed/DLQ.
    """
    from datetime import datetime, timezone, timedelta
    from app.models.job import JobStatus
    from app.services.firestore import get_job_queue_service

    logger.info("Running stale job cleanup")

    # Define stale threshold (jobs stuck for more than 30 minutes)
    stale_threshold = datetime.now(timezone.utc) - timedelta(minutes=30)

    # This is a simplified implementation
    # In production, you'd query Firestore for stale jobs
    cleaned = 0

    logger.info(f"Stale job cleanup completed: {cleaned} jobs cleaned")
    return {"cleaned": cleaned}


@broker.task
async def process_dlq_job(dlq_id: str) -> dict:
    """
    Process a job from the dead letter queue.

    This allows manual retry of failed jobs.

    Args:
        dlq_id: The DLQ entry ID

    Returns:
        dict with status information
    """
    logger.info(f"Processing DLQ entry: {dlq_id}")

    # TODO: Implement DLQ processing
    # 1. Fetch DLQ entry
    # 2. Recreate job in job_queue
    # 3. Process the job
    # 4. Update DLQ entry status

    return {"dlq_id": dlq_id, "status": "not_implemented"}