"""Krea AI style converter (img2img) task handler."""

import base64
import logging
from datetime import datetime, timezone

import httpx

from app.config import get_settings
from app.core.errors import ErrorCode, VideoJobError, classify_exception
from app.core.retry import RetryState
from app.models.job import JobDocument, JobStatus
from app.services.firestore import get_job_queue_service
from app.services.s3 import generate_panel_filename, upload_image

logger = logging.getLogger(__name__)
settings = get_settings()

KREA_API_BASE = "https://api.krea.ai"
KREA_PROVIDER = "bfl"
KREA_MODEL = "flux-1-dev"

RESOLUTION_MAP: dict[str, dict[str, int]] = {
    "9:16": {"width": 768,  "height": 1344},
    "16:9": {"width": 1344, "height": 768},
    "1:1":  {"width": 1024, "height": 1024},
    "4:3":  {"width": 1024, "height": 768},
    "3:4":  {"width": 768,  "height": 1024},
}

POLL_INTERVAL_S = 2.0
MAX_POLLS = 60  # 60 × 2 s = 120 s max


class CancellationRequested(Exception):
    pass


async def _check_cancellation(job_id: str) -> None:
    svc = get_job_queue_service()
    job = await svc.get_job(job_id)
    if job and job.cancellation_requested:
        raise CancellationRequested(f"Job {job_id} cancelled by user")


async def _upload_source_to_krea(api_key: str, image_base64: str, mime_type: str) -> str:
    """Upload source image to Krea assets API and return the hosted image_url."""
    image_bytes = base64.b64decode(image_base64)
    ext = mime_type.split("/")[-1].replace("jpeg", "jpg")
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            f"{KREA_API_BASE}/assets",
            headers={"Authorization": f"Bearer {api_key}"},
            files={"file": (f"source.{ext}", image_bytes, mime_type)},
        )
        if not resp.is_success:
            raise VideoJobError(
                ErrorCode.PROVIDER_ERROR,
                f"Krea asset upload failed ({resp.status_code}): {resp.text[:300]}",
            )
        data = resp.json()
        return data["image_url"]


async def _submit_task(
    api_key: str,
    media_url: str,
    prompts: str,
    target_aspect_ratio: str,
) -> str:
    res = RESOLUTION_MAP.get(target_aspect_ratio, {"width": 768, "height": 1344})
    payload = {
        "imageUrl": media_url,
        "prompt": prompts,
        "strength": 0.35,
        "guidance_scale_flux": 12,
        "steps": 50,
        "width": res["width"],
        "height": res["height"],
    }
    logger.info(f"Krea request body: {payload}")
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{KREA_API_BASE}/generate/image/{KREA_PROVIDER}/{KREA_MODEL}",
            json=payload,
            headers={"Authorization": f"Bearer {api_key}"},
        )
        body = resp.text
        if not resp.is_success:
            if resp.status_code == 429:
                raise VideoJobError(
                    ErrorCode.RATE_LIMIT,
                    f"Krea task submission failed ({resp.status_code}): {body[:300]}",
                )
            raise VideoJobError(
                ErrorCode.PROVIDER_ERROR,
                f"Krea task submission failed ({resp.status_code}): {body[:300]}",
            )
        data = resp.json()
        return data["job_id"]


async def _poll_task(api_key: str, krea_job_id: str, job_id: str) -> str:
    import asyncio

    for _ in range(MAX_POLLS):
        await asyncio.sleep(POLL_INTERVAL_S)
        await _check_cancellation(job_id)
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"{KREA_API_BASE}/jobs/{krea_job_id}",
                headers={"Authorization": f"Bearer {api_key}"},
            )
            if not resp.is_success:
                raise VideoJobError(
                    ErrorCode.PROVIDER_ERROR,
                    f"Krea poll failed ({resp.status_code})",
                )
            data = resp.json()

        status = data.get("status", "")
        if status == "completed":
            urls: list[str] = data.get("result", {}).get("urls", [])
            if not urls:
                raise VideoJobError(ErrorCode.PROVIDER_ERROR, "Task completed but no result URLs")
            return urls[0]
        if status in ("failed", "cancelled"):
            raise VideoJobError(ErrorCode.PROVIDER_ERROR, f"Krea task ended with status: {status}")

    raise VideoJobError(ErrorCode.TIMEOUT, "Krea task timed out after 2 minutes")


async def _fetch_result_image(image_url: str) -> bytes:
    async with httpx.AsyncClient(timeout=60, follow_redirects=True) as client:
        resp = await client.get(image_url)
        if not resp.is_success:
            raise VideoJobError(
                ErrorCode.PROVIDER_ERROR,
                f"Failed to fetch Krea result image ({resp.status_code})",
            )
        return resp.content


async def process_krea_style_converter_generation(
    job_id: str,
    image_base64: str,
    worker_id: str,
    api_key: str | None = None,
) -> dict:
    """Full lifecycle handler for a Krea AI style converter job."""
    svc = get_job_queue_service()

    job: JobDocument | None = await svc.get_job(job_id)
    if not job:
        logger.error(f"[{worker_id}] Krea style converter job {job_id} not found")
        return {"job_id": job_id, "status": "error", "error": "Job not found"}

    retry_state = RetryState(max_retries=job.max_retries)
    resolved_key = api_key or settings.krea_api_key

    if not resolved_key:
        await svc.update_job_status(
            job_id,
            JobStatus.FAILED,
            progress=0.0,
            error_code=ErrorCode.INVALID_REQUEST.value,
            error_message="No Krea API key configured",
            error_retryable=False,
        )
        return {"job_id": job_id, "status": "failed"}

    while True:
        try:
            # ── PREPARING ──────────────────────────────────────────────────
            await _check_cancellation(job_id)
            await svc.update_job_status(job_id, JobStatus.PREPARING, progress=0.1, worker_id=worker_id)
            media_url = await _upload_source_to_krea(resolved_key, image_base64, job.source_mime_type or "image/jpeg")
            logger.info(f"[{worker_id}] Krea source asset URL: {media_url}")

            # ── GENERATING ────────────────────────────────────────────────
            await _check_cancellation(job_id)
            await svc.update_job_status(job_id, JobStatus.GENERATING, progress=0.3)
            resolved_prompt = job.krea_prompts or "masterpiece, best quality, detailed illustration, anime style"
            logger.info(f"[{worker_id}] Krea prompt: {resolved_prompt!r}")
            krea_job_id = await _submit_task(resolved_key, media_url, resolved_prompt, job.aspect_ratio or "9:16")
            await svc.update_job_status(job_id, JobStatus.GENERATING, progress=0.5)
            result_url = await _poll_task(resolved_key, krea_job_id, job_id)

            # ── UPLOADING ─────────────────────────────────────────────────
            await _check_cancellation(job_id)
            await svc.update_job_status(job_id, JobStatus.UPLOADING, progress=0.8)
            result_bytes = await _fetch_result_image(result_url)
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
            logger.info(f"[{worker_id}] Krea style converter job {job_id} completed: {cloudfront_url}")
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
                logger.warning(f"[{worker_id}] Retrying Krea job {job_id} in {delay}s: {exc}")
                await svc.update_job_status(job_id, JobStatus.GENERATING, progress=0.3)
                import asyncio
                await asyncio.sleep(delay)
                continue

            logger.error(f"[{worker_id}] Krea style converter job {job_id} failed: {exc}")
            await svc.update_job_status(
                job_id,
                JobStatus.FAILED,
                progress=0.0,
                error_code=job_error.code.value,
                error_message=str(job_error),
                error_retryable=job_error.retryable,
            )
            return {"job_id": job_id, "status": "failed", "error": str(exc)}
