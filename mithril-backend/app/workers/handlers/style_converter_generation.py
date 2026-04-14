"""Style converter (pixAI img2img) task handler."""

import base64
import logging
from datetime import datetime, timezone

import httpx

from app.config import get_settings
from app.core.errors import ErrorCode, VideoJobError, classify_exception
from app.core.retry import RetryState
from app.core.state_machine import JobStateMachine
from app.models.job import JobDocument, JobStatus
from app.services.firestore import get_job_queue_service
from app.services.s3 import generate_panel_filename, upload_image

logger = logging.getLogger(__name__)
settings = get_settings()

DEFAULT_IMAGE_WEIGHT = 0.26

PIXAI_API_BASE = "https://api.pixai.art/v1"

# Haruka v2 (PixAI XL)
MODEL_ID = "1861558740588989558"
LORA_VERSION_ID = "1979066588753786310"
LORA_WEIGHT = 0.2

NEGATIVE_PROMPTS = (
    "watermark, nsfw, worst quality, bad quality, low quality, lowres, anatomical nonsense, "
    "artistic error, bad anatomy, interlocked fingers, extra fingers, text, artist name, "
    "watermark, signature, bad feet, extra toes, ugly, poorly drawn, censor, blurry, "
    "simple background, transparent background, old, oldest, glitch, deformed, mutated, "
    "disfigured, long body, bad hands, missing fingers, extra digit, fewer digits, cropped, "
    "very displeasing, sketch, jpeg artifacts, username, censored, bar_censor, mosaic_censor, "
    "conjoined, bad ai-generated, nsfw, long neck, skin blemishes, skin spots, acne, "
    "the wrong limb, error, black line, excess hands"
)

RESOLUTION_MAP: dict[str, dict[str, int]] = {
    "9:16": {"width": 768, "height": 1280},
    "16:9": {"width": 1280, "height": 768},
    "1:1":  {"width": 1024, "height": 1024},
    "4:3":  {"width": 1024, "height": 1024},
    "3:4":  {"width": 896,  "height": 1152},
}

POLL_INTERVAL_S = 5.0
MAX_POLLS = 36  # 36 × 5 s = 180 s max


class CancellationRequested(Exception):
    pass


async def _check_cancellation(job_id: str) -> None:
    svc = get_job_queue_service()
    job = await svc.get_job(job_id)
    if job and job.cancellation_requested:
        raise CancellationRequested(f"Job {job_id} cancelled by user")


async def _upload_source_to_s3(image_base64: str, mime_type: str) -> str:
    """Upload source image to S3 so pixAI can fetch it via public URL."""
    import time
    ext = mime_type.split("/")[-1].replace("jpeg", "jpg")
    key = f"mithril/temp/style-converter-source/{int(time.time())}.{ext}"
    image_bytes = base64.b64decode(image_base64)
    from app.services.s3 import get_s3_client
    from app.config import get_settings as _gs
    _settings = _gs()
    s3 = get_s3_client()
    s3.put_object(
        Bucket=_settings.videos_bucket,
        Key=key,
        Body=image_bytes,
        ContentType=mime_type,
    )
    return f"{_settings.cloudfront_url}/{key}"


async def _submit_task(
    api_key: str,
    media_url: str,
    prompts: str,
    target_aspect_ratio: str,
    image_weight: float,
) -> str:
    res = RESOLUTION_MAP.get(target_aspect_ratio, {"width": 768, "height": 1280})
    payload = {
        "parameters": {
            "modelId": MODEL_ID,
            "prompts": prompts,
            "negativePrompts": NEGATIVE_PROMPTS,
            "width": res["width"],
            "height": res["height"],
            "steps": 30,
            "cfg": 7,
            "sampler": "DPM++ 2M Karras",
            "seed": -1,
            "mediaId": None,
            "mediaWeight": max(0.0, min(1.0, image_weight)),
            "mediaUrl": media_url,
            "loraVersionIds": [LORA_VERSION_ID],
            "loraWeights": [LORA_WEIGHT],
        }
    }
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{PIXAI_API_BASE}/task",
            json=payload,
            headers={"Authorization": f"Bearer {api_key}"},
        )
        body = resp.text
        if not resp.is_success:
            if resp.status_code == 429:
                raise VideoJobError(ErrorCode.RATE_LIMIT, f"pixAI task submission failed ({resp.status_code}): {body[:300]}")
            raise VideoJobError(
                ErrorCode.PROVIDER_ERROR,
                f"pixAI task submission failed ({resp.status_code}): {body[:300]}",
            )
        data = resp.json()
        return data["id"]


async def _poll_task(api_key: str, task_id: str, job_id: str) -> str:
    import asyncio
    for _ in range(MAX_POLLS):
        await asyncio.sleep(POLL_INTERVAL_S)
        await _check_cancellation(job_id)
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"{PIXAI_API_BASE}/task/{task_id}",
                headers={"Authorization": f"Bearer {api_key}"},
            )
            if not resp.is_success:
                raise VideoJobError(ErrorCode.PROVIDER_ERROR, f"pixAI poll failed ({resp.status_code})")
            data = resp.json()
        status = data.get("status", "")
        if status == "completed":
            media_id: str | None = data.get("outputs", {}).get("mediaIds", [None])[0]
            if not media_id:
                raise VideoJobError(ErrorCode.PROVIDER_ERROR, "Task completed but no mediaId")
            return media_id
        if status in ("failed", "cancelled"):
            raise VideoJobError(ErrorCode.PROVIDER_ERROR, f"pixAI task ended with status: {status}")
    raise VideoJobError(ErrorCode.TIMEOUT, "pixAI task timed out after 3 minutes")


async def _fetch_result_image(api_key: str, media_id: str) -> bytes:
    async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
        resp = await client.get(
            f"{PIXAI_API_BASE}/media/{media_id}/image",
            headers={"Authorization": f"Bearer {api_key}"},
        )
        if not resp.is_success:
            raise VideoJobError(ErrorCode.PROVIDER_ERROR, f"Failed to fetch result image ({resp.status_code})")
        return resp.content


async def process_style_converter_generation(
    job_id: str,
    image_base64: str,
    worker_id: str,
    api_key: str | None = None,
) -> dict:
    """Full lifecycle handler for a style converter job."""
    svc = get_job_queue_service()
    state_machine = JobStateMachine(job_id)

    job: JobDocument | None = await svc.get_job(job_id)
    if not job:
        logger.error(f"[{worker_id}] Style converter job {job_id} not found")
        return {"job_id": job_id, "status": "error", "error": "Job not found"}

    retry_state = RetryState(max_retries=job.max_retries)
    resolved_key = api_key or settings.pixai_api_key

    if not resolved_key:
        await svc.update_job_status(
            job_id,
            JobStatus.FAILED,
            progress=0.0,
            error_code=ErrorCode.INVALID_REQUEST.value,
            error_message="No pixAI API key configured",
            error_retryable=False,
        )
        return {"job_id": job_id, "status": "failed"}

    while True:
        try:
            # ── PREPARING ──────────────────────────────────────────────────
            await _check_cancellation(job_id)
            await svc.update_job_status(job_id, JobStatus.PREPARING, progress=0.1, worker_id=worker_id)
            media_url = await _upload_source_to_s3(image_base64, job.source_mime_type or "image/jpeg")

            # ── GENERATING ────────────────────────────────────────────────
            await _check_cancellation(job_id)
            await svc.update_job_status(job_id, JobStatus.GENERATING, progress=0.3)
            task_id = await _submit_task(
                resolved_key,
                media_url,
                job.pixai_prompts or "masterpiece, best quality, detailed illustration, anime style",
                job.aspect_ratio or "9:16",
                job.pixai_image_weight if job.pixai_image_weight is not None else DEFAULT_IMAGE_WEIGHT,
            )

            try:
                from app.services.credits import get_credit_cost, get_credits_service
                _cost = get_credit_cost(job.type.value, "pixai")
                await get_credits_service().record_credit(
                    user_id=job.user_id, project_id=job.project_id,
                    job_id=job.id, job_type=job.type.value,
                    provider_id="pixai", cost_usd=_cost,
                )
            except Exception:
                logger.warning(f"Failed to record credit for job {job_id}", exc_info=True)

            await svc.update_job_status(job_id, JobStatus.GENERATING, progress=0.5)
            media_id = await _poll_task(resolved_key, task_id, job_id)

            # ── UPLOADING ─────────────────────────────────────────────────
            await _check_cancellation(job_id)
            await svc.update_job_status(job_id, JobStatus.UPLOADING, progress=0.8)
            result_bytes = await _fetch_result_image(resolved_key, media_id)
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
            logger.info(f"[{worker_id}] Style converter job {job_id} completed: {cloudfront_url}")
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
                logger.warning(f"[{worker_id}] Retrying job {job_id} in {delay}s: {exc}")
                await svc.update_job_status(job_id, JobStatus.GENERATING, progress=0.3)
                import asyncio
                await asyncio.sleep(delay)
                continue

            logger.error(f"[{worker_id}] Style converter job {job_id} failed: {exc}")
            await svc.update_job_status(
                job_id,
                JobStatus.FAILED,
                progress=0.0,
                error_code=job_error.code.value,
                error_message=str(job_error),
                error_retryable=job_error.retryable,
            )
            return {"job_id": job_id, "status": "failed", "error": str(exc)}
