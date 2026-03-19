"""ModelsLab style converter (img2img) task handler."""

import base64
import logging
import time
from datetime import datetime, timezone

from app.config import get_settings
from app.core.errors import ErrorCode, VideoJobError, classify_exception
from app.core.retry import RetryState
from app.models.job import JobDocument, JobStatus
from app.services.firestore import get_job_queue_service
from app.services.s3 import generate_panel_filename, upload_image

logger = logging.getLogger(__name__)
settings = get_settings()

MODELSLAB_V6_I2I_URL = "https://modelslab.com/api/v6/images/img2img"
MODEL_ID = "flux-klein"

POLL_INTERVAL_S = 5.0
MAX_POLLS = 24  # 24 × 5 s = 120 s max


class CancellationRequested(Exception):
    pass


async def _check_cancellation(job_id: str) -> None:
    svc = get_job_queue_service()
    job = await svc.get_job(job_id)
    if job and job.cancellation_requested:
        raise CancellationRequested(f"Job {job_id} cancelled by user")


async def _upload_source_to_s3(image_base64: str, mime_type: str) -> str:
    """Upload source image to S3 and return a publicly accessible CloudFront URL."""
    image_bytes = base64.b64decode(image_base64)
    ext = mime_type.split("/")[-1].replace("jpeg", "jpg")
    timestamp = int(time.time() * 1000)
    s3_key = f"mithril/temp/modelslab-style-converter-source/{timestamp}.{ext}"
    url = await upload_image(image_bytes, s3_key, mime_type)
    logger.info(f"[MODELSLAB-STYLE-CONVERTER] Uploaded source to S3: {url[:80]}...")
    return url


async def _submit_task(
    api_key: str,
    source_url: str,
    prompt: str,
) -> tuple[str | None, str | None]:
    """
    Submit an img2img task to ModelsLab.

    Returns (image_url, fetch_result_url). One of them will be None:
    - image_url is set when the response is immediately successful
    - fetch_result_url is set when the job is processing asynchronously
    """
    import httpx
    from app.core.rate_limiter import distributed_rate_limit

    payload = {
        "key": api_key,
        "model_id": MODEL_ID,
        "prompt": prompt,
        "init_image": source_url,
        "samples": "1",
        "enhance_prompt": False,
        "strength": "0.1"
    }

    async with distributed_rate_limit("modelslab"):
        async with httpx.AsyncClient(timeout=60.0) as client:
            logger.info(f"[MODELSLAB-STYLE-CONVERTER] Submitting to ModelsLab ({MODEL_ID})")
            resp = await client.post(MODELSLAB_V6_I2I_URL, json=payload)

    body = resp.text
    if not resp.is_success:
        if resp.status_code == 429:
            raise VideoJobError(
                ErrorCode.RATE_LIMIT,
                f"ModelsLab rate limit ({resp.status_code}): {body[:300]}",
            )
        raise VideoJobError(
            ErrorCode.PROVIDER_ERROR,
            f"ModelsLab submission failed ({resp.status_code}): {body[:300]}",
        )

    data = resp.json()
    status = data.get("status")
    logger.info(f"[MODELSLAB-STYLE-CONVERTER] Submit response status: {status}")

    if status == "error":
        raise VideoJobError(ErrorCode.PROVIDER_ERROR, f"ModelsLab API error: {data.get('message', data)}")

    if status == "success" and data.get("output"):
        output = data["output"]
        image_url = output[0] if isinstance(output, list) else output
        return image_url, None

    if status == "processing":
        fetch_url = data.get("fetch_result")
        if not fetch_url:
            raise VideoJobError(ErrorCode.PROVIDER_ERROR, "ModelsLab returned 'processing' but no fetch_result URL")
        return None, fetch_url

    raise VideoJobError(ErrorCode.PROVIDER_ERROR, f"Unexpected ModelsLab response: {data}")


async def _poll_for_result(fetch_url: str, api_key: str, job_id: str) -> str:
    """Poll ModelsLab fetch_result URL until the image is ready. Returns image URL."""
    import asyncio
    import httpx

    async with httpx.AsyncClient(timeout=30.0) as client:
        for attempt in range(1, MAX_POLLS + 1):
            await asyncio.sleep(POLL_INTERVAL_S)
            await _check_cancellation(job_id)

            logger.info(f"[MODELSLAB-STYLE-CONVERTER] Poll attempt {attempt}/{MAX_POLLS}")
            resp = await client.post(fetch_url, json={"key": api_key})
            if not resp.is_success:
                raise VideoJobError(ErrorCode.PROVIDER_ERROR, f"ModelsLab poll failed ({resp.status_code})")

            data = resp.json()
            status = data.get("status")
            logger.info(f"[MODELSLAB-STYLE-CONVERTER] Poll status: {status}")

            if status == "success" and data.get("output"):
                output = data["output"]
                return output[0] if isinstance(output, list) else output

            if status == "error":
                raise VideoJobError(ErrorCode.PROVIDER_ERROR, f"ModelsLab generation failed: {data.get('message', data)}")

            # "processing" / "pending" → keep polling

    raise VideoJobError(ErrorCode.TIMEOUT, f"ModelsLab timed out after {MAX_POLLS * POLL_INTERVAL_S}s")


async def _download_image(image_url: str) -> bytes:
    """Download generated image from URL, retrying on 404 for CDN propagation."""
    import asyncio
    import httpx

    max_attempts = 8
    retry_delay = 5.0

    async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
        for attempt in range(1, max_attempts + 1):
            logger.info(f"[MODELSLAB-STYLE-CONVERTER] Downloading result (attempt {attempt}/{max_attempts})")
            resp = await client.get(image_url)
            if resp.status_code == 404 and attempt < max_attempts:
                logger.warning(f"[MODELSLAB-STYLE-CONVERTER] Got 404, CDN not ready — retrying in {retry_delay}s")
                await asyncio.sleep(retry_delay)
                continue
            if not resp.is_success:
                raise VideoJobError(
                    ErrorCode.PROVIDER_ERROR,
                    f"Failed to fetch ModelsLab result image ({resp.status_code})",
                )
            return resp.content

    raise VideoJobError(ErrorCode.PROVIDER_ERROR, f"Failed to download image after {max_attempts} attempts")


async def process_modelslab_style_converter_generation(
    job_id: str,
    image_base64: str,
    worker_id: str,
    api_key: str | None = None,
) -> dict:
    """Full lifecycle handler for a ModelsLab style converter job."""
    svc = get_job_queue_service()

    job: JobDocument | None = await svc.get_job(job_id)
    if not job:
        logger.error(f"[{worker_id}] ModelsLab style converter job {job_id} not found")
        return {"job_id": job_id, "status": "error", "error": "Job not found"}

    retry_state = RetryState(max_retries=job.max_retries)
    resolved_key = api_key or settings.modelslab_api_key

    if not resolved_key:
        await svc.update_job_status(
            job_id,
            JobStatus.FAILED,
            progress=0.0,
            error_code=ErrorCode.INVALID_REQUEST.value,
            error_message="No ModelsLab API key configured",
            error_retryable=False,
        )
        return {"job_id": job_id, "status": "failed"}

    while True:
        try:
            # ── PREPARING ──────────────────────────────────────────────────
            await _check_cancellation(job_id)
            await svc.update_job_status(job_id, JobStatus.PREPARING, progress=0.1, worker_id=worker_id)
            source_url = await _upload_source_to_s3(image_base64, job.source_mime_type or "image/jpeg")

            # ── GENERATING ────────────────────────────────────────────────
            await _check_cancellation(job_id)
            await svc.update_job_status(job_id, JobStatus.GENERATING, progress=0.3)
            resolved_prompt = job.modelslab_prompts or "masterpiece, best quality, detailed illustration, anime style"
            logger.info(f"[{worker_id}] ModelsLab prompt: {resolved_prompt!r}")

            image_url, fetch_url = await _submit_task(resolved_key, source_url, resolved_prompt)

            await svc.update_job_status(job_id, JobStatus.GENERATING, progress=0.5)

            if fetch_url:
                image_url = await _poll_for_result(fetch_url, resolved_key, job_id)

            # ── UPLOADING ─────────────────────────────────────────────────
            await _check_cancellation(job_id)
            await svc.update_job_status(job_id, JobStatus.UPLOADING, progress=0.8)
            result_bytes = await _download_image(image_url)  # type: ignore[arg-type]
            s3_key = generate_panel_filename(job.project_id, job.panel_id or job_id, job_id)
            cloudfront_url = await upload_image(
                image_bytes=result_bytes,
                file_name=s3_key,
                content_type="image/png",
            )

            # ── COMPLETED ─────────────────────────────────────────────────
            await svc.update_job_status(
                job_id,
                JobStatus.COMPLETED,
                progress=1.0,
                image_url=cloudfront_url,
                s3_file_name=s3_key,
                completed_at=datetime.now(timezone.utc).isoformat(),
            )
            logger.info(f"[{worker_id}] ModelsLab style converter job {job_id} completed: {cloudfront_url}")
            return {"job_id": job_id, "status": "completed", "image_url": cloudfront_url}

        except CancellationRequested:
            await svc.update_job_status(job_id, JobStatus.CANCELLED, progress=0.0)
            return {"job_id": job_id, "status": "cancelled"}

        except Exception as exc:
            job_error = classify_exception(exc)
            retry_state.record_failure(job_error.code.value, str(job_error))
            can_retry = retry_state.can_retry()

            if can_retry:
                delay = retry_state.get_next_delay(job_error.code)
                logger.warning(f"[{worker_id}] Retrying ModelsLab job {job_id} in {delay}s: {exc}")
                await svc.update_job_status(job_id, JobStatus.GENERATING, progress=0.3)
                import asyncio
                await asyncio.sleep(delay)
                continue

            logger.error(f"[{worker_id}] ModelsLab style converter job {job_id} failed: {exc}")
            await svc.update_job_status(
                job_id,
                JobStatus.FAILED,
                progress=0.0,
                error_code=job_error.code.value,
                error_message=str(job_error),
                error_retryable=job_error.retryable,
            )
            return {"job_id": job_id, "status": "failed", "error": str(exc)}