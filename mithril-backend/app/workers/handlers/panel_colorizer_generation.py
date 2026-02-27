"""Panel colorizer generation task handler.

Colorizes black-and-white manga panels into full-color anime-style images
using Google Gemini with optional character reference sheets for color extraction.
"""

import base64
import logging
from datetime import datetime, timezone

from app.config import get_settings
from app.core.errors import (
    ErrorCode,
    VideoJobError,
    classify_exception,
)
from app.core.retry import RetryState
from app.core.state_machine import JobStateMachine
from app.models.job import JobDocument, JobStatus
from app.services.firestore import get_job_queue_service
from app.services.s3 import generate_panel_colorizer_filename, upload_image

logger = logging.getLogger(__name__)
settings = get_settings()


class CancellationRequested(Exception):
    """Raised when job cancellation is detected."""
    pass


async def check_cancellation(job_id: str) -> None:
    """Check if cancellation has been requested for a job."""
    job_queue_service = get_job_queue_service()
    job = await job_queue_service.get_job(job_id)
    if job and job.cancellation_requested:
        logger.info(f"Cancellation detected for panel colorizer job {job_id}")
        raise CancellationRequested(f"Job {job_id} was cancelled by user")


def build_colorizer_prompt(
    target_aspect_ratio: str,
    global_prompt: str,
    has_references: bool,
    reference_count: int,
) -> str:
    """
    Build the prompt for manga panel colorization.

    Adapted from the reference project's transformMangaToAnime prompt.
    """
    if has_references:
        reference_instructions = f"""
    INPUT CONTEXT:
    - IMAGES 1 to {reference_count}: REFERENCE IMAGES (Character Sheets / Color Refs).
    - IMAGE {reference_count + 1}: TARGET MANGA PANEL.

    STRICT REFERENCE USAGE:
    - Extract ONLY the Hair Color, Eye Color, and Skin Tone from the REFERENCE IMAGES.
    - APPLY these specific colors to the character in the TARGET MANGA PANEL.
    - DO NOT transfer the clothing, pose, or body shape from REFERENCE IMAGES unless they match exactly.
    - DO NOT change the clothing design drawn in the TARGET MANGA PANEL. Color the clothing in the TARGET MANGA PANEL as it is drawn."""
    else:
        reference_instructions = """
    INPUT CONTEXT:
    - IMAGE 1: TARGET MANGA PANEL."""

    prompt = f"""ACT AS A MASTER ANIME BACKGROUND ARTIST AND COMPOSITOR.

    {reference_instructions}

    CORE TASK:
    Transform the source manga panel into a clean, borderless, full-color {target_aspect_ratio} Anime Screenshot.

    MANDATORY CLEANUP & RESTORATION (PRIORITY 1):
    1. REMOVE ALL TEXT & SYMBOLS:
       - Erase ALL speech bubbles, dialogue boxes, and narration rectangles.
       - Erase ALL sound effects (SFX), katakana/hiragana onomatopoeia, and hand-lettered text.
       - INPAINT the background seamlessly behind these removed elements.

    2. REMOVE PANEL BORDERS:
       - Erase the black frame lines/borders of the manga panel.
       - Eliminate any white gutters or adjacent panel fragments.

    3. EXPAND TO {target_aspect_ratio} FULL SCREEN:
       - The output MUST be a full rectangular image ({target_aspect_ratio}).
       - OUTPAINT/EXTEND the scene to fill the canvas where the borders/gutters used to be.
       - If the panel was irregular (e.g., slanted), fill the empty corners with the scene's background (sky, wall, trees, etc.).
       - Do NOT leave any white space or black bars.

    STRICT COMPOSITION RULES:
    1. NO HALLUCINATIONS: Do NOT add characters that are not in the line art.
    2. PRESERVE ZOOM LEVEL:
       - If the input is a CLOSE-UP (e.g., eye, hand, object), KEEP IT A CLOSE-UP.
       - Simply extend the skin texture, clothing, or background blur to fill the {target_aspect_ratio} width.
       - Do NOT zoom out to reveal the whole head/body if it wasn't drawn.
    3. PRESERVE LINE ART: Colorize the existing drawing; do not redraw the character's features.

    VISUAL STYLE:
    - High-end anime broadcast quality (vibrant colors, cel-shading, compositing).
    - No paper texture, no halftone dots.

    USER PROMPT:
    {global_prompt}"""

    return prompt


async def _generate_colorized_image_gemini(
    image_base64: str,
    mime_type: str,
    prompt: str,
    reference_images: list[dict],
    api_key: str,
) -> bytes:
    """Generate colorized panel image using Gemini API (supports reference images)."""
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=api_key)
    model = "gemini-2.0-flash-exp-image-generation"

    contents = []

    # Add reference images first (color references)
    for ref in reference_images:
        contents.append(
            types.Part.from_bytes(
                data=base64.b64decode(ref["base64"]),
                mime_type=ref.get("mime_type", "image/png"),
            )
        )

    # Add target manga panel
    contents.append(
        types.Part.from_bytes(
            data=base64.b64decode(image_base64),
            mime_type=mime_type,
        )
    )

    # Add text prompt
    contents.append(types.Part.from_text(text=prompt))

    generate_config = types.GenerateContentConfig(
        response_modalities=["IMAGE", "TEXT"],
    )

    response = await client.aio.models.generate_content(
        model=model,
        contents=contents,
        config=generate_config,
    )

    if response.candidates and response.candidates[0].content and response.candidates[0].content.parts:
        for part in response.candidates[0].content.parts:
            if part.inline_data and part.inline_data.data:
                return part.inline_data.data

    raise VideoJobError.provider_error("No image data found in Gemini response")


async def generate_colorized_image_for_provider(
    provider_id: str,
    image_base64: str,
    mime_type: str,
    prompt: str,
    aspect_ratio: str,
    reference_images: list[dict],
    api_key: str,
) -> bytes:
    """Dispatch colorized panel image generation to the appropriate provider."""
    if provider_id == "gemini":
        return await _generate_colorized_image_gemini(
            image_base64, mime_type, prompt, reference_images, api_key,
        )
    # For non-Gemini providers, use the panel generation dispatch
    # (reference images are not supported; prompt-only colorization)
    from app.workers.handlers.panel_generation import generate_panel_image_for_provider
    return await generate_panel_image_for_provider(
        provider_id=provider_id,
        image_base64=image_base64,
        mime_type=mime_type,
        prompt=prompt,
        aspect_ratio=aspect_ratio,
        api_key=api_key,
    )


async def process_panel_colorizer_generation(
    job_id: str,
    image_base64: str,
    reference_images: list[dict],
    worker_id: str = "worker-1",
    custom_api_key: str | None = None,
) -> dict:
    """
    Main panel colorizer generation pipeline.

    Pipeline stages:
    1. PENDING -> PREPARING: Build colorization prompt
    2. PREPARING -> GENERATING: Call Gemini API with references + manga panel
    3. GENERATING -> UPLOADING: Upload result to S3
    4. UPLOADING -> COMPLETED: Update Firestore
    """
    job_queue_service = get_job_queue_service()

    logger.info(f"[{worker_id}] ========== Starting panel colorizer for job {job_id} ==========")

    # Fetch job from Firestore
    job = await job_queue_service.get_job(job_id)
    if not job:
        logger.error(f"[PANEL-COLORIZER] Job {job_id} not found in Firestore")
        return {"job_id": job_id, "status": "error", "error": "Job not found"}

    logger.info(f"[PANEL-COLORIZER] Job {job_id}: session={job.session_id}, panel={job.panel_id}")
    logger.info(f"[PANEL-COLORIZER] Aspect ratio: {job.aspect_ratio}, References: {len(reference_images)}")

    state_machine = JobStateMachine(job_id, job.status)
    await job_queue_service.update_job(job_id, worker_id=worker_id)

    try:
        # === CHECKPOINT 1: Before preparing ===
        await check_cancellation(job_id)

        api_key = _get_api_key(job, custom_api_key)

        # === Stage 1: Prepare - build prompt ===
        prompt = await _stage_prepare(job, reference_images, state_machine)

        # === CHECKPOINT 2: Before generating ===
        await check_cancellation(job_id)

        # === Stage 2: Generate colorized image ===
        image_bytes = await _stage_generate(job, image_base64, prompt, reference_images, api_key, state_machine)

        # === CHECKPOINT 3: Before upload ===
        await check_cancellation(job_id)

        # === Stage 3: Upload to S3 ===
        result = await _stage_upload(job, image_bytes, state_machine)

        # === Stage 4: Complete ===
        await _stage_complete(job, result, state_machine)

        logger.info(f"[PANEL-COLORIZER] {job_id} ========== JOB COMPLETED ==========")
        return {
            "job_id": job_id,
            "status": "completed",
            "image_url": result["image_url"],
            "s3_file_name": result["s3_file_name"],
        }

    except CancellationRequested:
        logger.warning(f"[PANEL-COLORIZER] {job_id} - Job was cancelled")
        await _handle_cancellation(job_id, state_machine)
        return {"job_id": job_id, "status": "cancelled"}

    except VideoJobError as e:
        logger.error(f"[PANEL-COLORIZER] {job_id} - VideoJobError: {e.code.value} - {e.message}")
        return await _handle_error(job, e, state_machine, image_base64, reference_images, custom_api_key)

    except Exception as e:
        logger.exception(f"[PANEL-COLORIZER] {job_id} - Unexpected error: {type(e).__name__}: {str(e)}")
        video_error = classify_exception(e)
        return await _handle_error(job, video_error, state_machine, image_base64, reference_images, custom_api_key)


def _get_api_key(job: JobDocument, custom_api_key: str | None = None) -> str:
    """Get API key for panel colorizer based on provider."""
    if custom_api_key:
        return custom_api_key

    if job.provider_id == "grok":
        if not settings.modelslab_api_key:
            raise VideoJobError.invalid_request("No ModelsLab API key configured for Grok provider")
        return settings.modelslab_api_key

    if job.provider_id == "z_image_turbo":
        if not settings.modelslab_api_key:
            raise VideoJobError.invalid_request("No ModelsLab API key configured for Z-Image Turbo provider")
        return settings.modelslab_api_key

    if job.provider_id == "flux2_dev":
        if not settings.modelslab_api_key:
            raise VideoJobError.invalid_request("No ModelsLab API key configured for Flux2 Dev provider")
        return settings.modelslab_api_key

    if not settings.gemini_api_key:
        raise VideoJobError.invalid_request("No Gemini API key configured")
    return settings.gemini_api_key


async def _stage_prepare(
    job: JobDocument,
    reference_images: list[dict],
    state_machine: JobStateMachine,
) -> str:
    """Stage 1: Build colorization prompt."""
    job_queue_service = get_job_queue_service()

    logger.info(f"[PANEL-COLORIZER] {job.id} - Stage 1: PREPARING")
    state_machine.transition_to(JobStatus.PREPARING)
    await job_queue_service.update_job_status(job.id, JobStatus.PREPARING, progress=0.1)

    prompt = build_colorizer_prompt(
        target_aspect_ratio=job.aspect_ratio,
        global_prompt=job.global_prompt or "",
        has_references=len(reference_images) > 0,
        reference_count=len(reference_images),
    )

    await job_queue_service.update_job(job.id, progress=0.2)
    logger.info(f"[PANEL-COLORIZER] {job.id} - Stage 1 complete: prompt built")
    return prompt


async def _stage_generate(
    job: JobDocument,
    image_base64: str,
    prompt: str,
    reference_images: list[dict],
    api_key: str,
    state_machine: JobStateMachine,
) -> bytes:
    """Stage 2: Generate colorized image using the selected provider."""
    job_queue_service = get_job_queue_service()

    provider_id = job.provider_id or "gemini"
    logger.info(f"[PANEL-COLORIZER] {job.id} - Stage 2: GENERATING with {provider_id}")
    state_machine.transition_to(JobStatus.GENERATING)
    await job_queue_service.update_job_status(job.id, JobStatus.GENERATING, progress=0.3)

    if not image_base64:
        raise VideoJobError.invalid_request("No source image provided")

    logger.info(f"[PANEL-COLORIZER] {job.id} - Calling {provider_id} API...")
    try:
        image_bytes = await generate_colorized_image_for_provider(
            provider_id=provider_id,
            image_base64=image_base64,
            mime_type=job.source_mime_type or "image/jpeg",
            prompt=prompt,
            aspect_ratio=job.aspect_ratio,
            reference_images=reference_images,
            api_key=api_key,
        )
        logger.info(f"[PANEL-COLORIZER] {job.id} - Image generated: {len(image_bytes)} bytes")
    except Exception as e:
        logger.error(f"[PANEL-COLORIZER] {job.id} - {provider_id} API error: {type(e).__name__}: {str(e)}")
        raise classify_exception(e)

    await job_queue_service.update_job(job.id, progress=0.7)
    return image_bytes


async def _stage_upload(
    job: JobDocument,
    image_bytes: bytes,
    state_machine: JobStateMachine,
) -> dict:
    """Stage 3: Upload colorized image to S3."""
    job_queue_service = get_job_queue_service()

    logger.info(f"[PANEL-COLORIZER] {job.id} - Stage 3: UPLOADING")
    state_machine.transition_to(JobStatus.UPLOADING)
    await job_queue_service.update_job_status(job.id, JobStatus.UPLOADING, progress=0.8)

    s3_file_name = generate_panel_colorizer_filename(
        project_id=job.project_id,
        panel_id=job.panel_id or job.id,
        job_id=job.id,
    )

    try:
        image_url = await upload_image(image_bytes, s3_file_name, "image/png")
        logger.info(f"[PANEL-COLORIZER] {job.id} - Uploaded to S3: {s3_file_name}")
    except Exception as e:
        logger.error(f"[PANEL-COLORIZER] {job.id} - S3 upload failed: {e}")
        raise VideoJobError.internal(f"S3 upload failed: {e}")

    return {
        "image_url": image_url,
        "s3_file_name": s3_file_name,
    }


async def _stage_complete(
    job: JobDocument,
    result: dict,
    state_machine: JobStateMachine,
) -> None:
    """Stage 4: Update Firestore and mark complete."""
    job_queue_service = get_job_queue_service()

    logger.info(f"[PANEL-COLORIZER] {job.id} - Stage 4: COMPLETING")
    state_machine.transition_to(JobStatus.COMPLETED)

    await job_queue_service.update_job_status(
        job.id,
        JobStatus.COMPLETED,
        image_url=result["image_url"],
        s3_file_name=result["s3_file_name"],
        progress=1.0,
    )


async def _handle_cancellation(
    job_id: str,
    state_machine: JobStateMachine,
) -> None:
    """Handle job cancellation."""
    job_queue_service = get_job_queue_service()

    state_machine.transition_to(JobStatus.CANCELLED)
    await job_queue_service.update_job_status(
        job_id,
        JobStatus.CANCELLED,
        cancelled_at=datetime.now(timezone.utc).isoformat(),
    )


async def _handle_error(
    job: JobDocument,
    error: VideoJobError,
    state_machine: JobStateMachine,
    image_base64: str = "",
    reference_images: list[dict] | None = None,
    custom_api_key: str | None = None,
) -> dict:
    """Handle job error with potential retry."""
    from app.workers.tasks import retry_failed_panel_colorizer_job

    job_queue_service = get_job_queue_service()

    logger.error(f"[{job.id}] Error: {error.code.value} - {error.message}")

    retry_state = RetryState(
        max_retries=job.max_retries,
        retry_count=job.retry_count,
    )
    retry_state.record_failure(error.code.value, error.message)

    if error.retryable and retry_state.can_retry():
        delay = retry_state.get_next_delay(error.code)
        logger.info(
            f"[{job.id}] Will retry in {delay:.1f}s "
            f"(attempt {retry_state.retry_count}/{retry_state.max_retries})"
        )

        state_machine.transition_to(JobStatus.FAILED)
        await job_queue_service.update_job(
            job.id,
            status=JobStatus.PENDING.value,
            retry_count=retry_state.retry_count,
            error_code=error.code.value,
            error_message=error.message,
            error_retryable=True,
        )

        await retry_failed_panel_colorizer_job.kiq(
            job.id, delay, image_base64, reference_images or [], custom_api_key
        )

        return {
            "job_id": job.id,
            "status": "retry_scheduled",
            "retry_after": delay,
            "attempt": retry_state.retry_count,
        }
    else:
        logger.warning(f"[{job.id}] Moving to DLQ after {retry_state.retry_count} attempts")

        state_machine.transition_to(JobStatus.FAILED)
        await job_queue_service.update_job_status(
            job.id,
            JobStatus.FAILED,
            error_code=error.code.value,
            error_message=error.message,
            error_retryable=False,
        )

        await job_queue_service.move_to_dlq(
            job.id,
            error.code.value,
            error.message,
            retry_state.failure_history,
        )

        return {
            "job_id": job.id,
            "status": "failed",
            "error_code": error.code.value,
            "error_message": error.message,
            "moved_to_dlq": True,
        }
