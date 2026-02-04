"""ID Converter generation task handlers."""

import json
import logging
from datetime import datetime, timezone

from google import genai
from google.genai import types

from app.config import get_settings
from app.core.errors import (
    ErrorCode,
    VideoJobError,
    classify_exception,
)
from app.core.retry import RetryState
from app.core.state_machine import JobStateMachine
from app.models.job import JobDocument, JobStatus
from app.services.firestore import get_job_queue_service, get_id_converter_service

logger = logging.getLogger(__name__)
settings = get_settings()

MODEL_NAME = "gemini-2.5-flash"


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
        logger.info(f"Cancellation detected for ID converter job {job_id}")
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


# ============================================================================
# Glossary Analysis
# ============================================================================


async def process_glossary_analysis(
    job_id: str,
    worker_id: str = "worker-1",
    custom_api_key: str | None = None,
) -> dict:
    """
    Analyze text to extract entities/glossary.

    This is a single-shot job that:
    1. Calls Gemini to analyze the text
    2. Saves extracted entities to Firestore idConverter document
    3. Updates job status

    Args:
        job_id: The job ID to process
        worker_id: ID of the worker processing this job
        custom_api_key: Optional custom API key (passed through task queue)

    Returns:
        dict with status and result information
    """
    job_queue_service = get_job_queue_service()
    id_converter_service = get_id_converter_service()

    logger.info(f"[{worker_id}] ========== Starting glossary analysis for job {job_id} ==========")

    # Fetch job from Firestore
    job = await job_queue_service.get_job(job_id)
    if not job:
        logger.error(f"[ID-CONV-GLOSSARY] Job {job_id} not found in Firestore")
        return {"job_id": job_id, "status": "error", "error": "Job not found"}

    logger.info(f"[ID-CONV-GLOSSARY] Job {job_id} loaded: project={job.project_id}, status={job.status}")
    logger.info(f"[ID-CONV-GLOSSARY] Text length: {len(job.original_text or '')} chars")
    logger.info(f"[ID-CONV-GLOSSARY] Has file URI: {bool(job.file_uri)}")

    # Initialize state machine
    state_machine = JobStateMachine(job_id, job.status)

    # Mark job as being processed by this worker
    await job_queue_service.update_job(job_id, worker_id=worker_id)

    try:
        # Get API key
        api_key = _get_api_key(job, custom_api_key)

        # Transition to GENERATING
        state_machine.transition_to(JobStatus.GENERATING)
        await job_queue_service.update_job_status(job_id, JobStatus.GENERATING, progress=0.2)
        logger.info(f"[ID-CONV-GLOSSARY] {job_id} - Status updated to GENERATING")

        # Call Gemini for glossary analysis
        logger.info(f"[ID-CONV-GLOSSARY] {job_id} - Calling Gemini API for entity extraction...")
        entities = await _analyze_glossary_with_gemini(
            job.original_text or "",
            job.file_uri,
            api_key
        )
        logger.info(f"[ID-CONV-GLOSSARY] {job_id} - ✓ Extracted {len(entities)} entities")

        # Save to project's idConverter document
        logger.debug(f"[ID-CONV-GLOSSARY] {job_id} - Updating idConverter document in project")
        await id_converter_service.update_glossary(
            project_id=job.project_id,
            glossary=entities,
            current_step="analysis",
            glossary_job_id=job_id,
        )
        logger.info(f"[ID-CONV-GLOSSARY] {job_id} - ✓ idConverter document updated")

        # Update job with results
        state_machine.transition_to(JobStatus.COMPLETED)
        await job_queue_service.update_job_status(
            job_id,
            JobStatus.COMPLETED,
            progress=1.0,
            glossary_result=entities,
        )

        logger.info(f"[ID-CONV-GLOSSARY] {job_id} ========== JOB COMPLETED SUCCESSFULLY ==========")
        return {
            "job_id": job_id,
            "status": "completed",
            "entities_count": len(entities),
        }

    except CancellationRequested:
        logger.warning(f"[ID-CONV-GLOSSARY] {job_id} - Job was cancelled")
        await _handle_glossary_cancellation(job_id, job, state_machine)
        return {"job_id": job_id, "status": "cancelled"}

    except VideoJobError as e:
        logger.error(f"[ID-CONV-GLOSSARY] {job_id} - VideoJobError: {e.code.value} - {e.message}")
        return await _handle_glossary_error(job, e, state_machine, custom_api_key)

    except Exception as e:
        logger.exception(f"[ID-CONV-GLOSSARY] {job_id} - Unexpected error: {type(e).__name__}: {str(e)}")
        video_error = classify_exception(e)
        return await _handle_glossary_error(job, video_error, state_machine, custom_api_key)


async def _analyze_glossary_with_gemini(
    text: str,
    file_uri: str | None,
    api_key: str
) -> list[dict]:
    """Call Gemini to analyze text and extract entities."""
    client = genai.Client(api_key=api_key)

    system_prompt = """
You are a professional storyboard script analyzer for Webnovels.
Read the provided webnovel text/file.

Your goal is to identify:
1. Main Characters
2. Recurrent/Symbolic Items (e.g., specific weapons, artifacts like 'Crystal Ball')
3. Crucially, identify "Variants" of these characters/items based on time period, outfit, state (e.g., undead, child, before regression).

For each variant, assign a CAPITALIZED_SNAKE_CASE_ID.

CRITICAL INSTRUCTION:
The 'description' field for each variant MUST be written in KOREAN (Hangul).
Keep the Korean description concise and summarized (similar length to English summary).

Example:
- Character: Elisa
  - Variant: 30 years old, before death -> ELISA_BEFORE_30 (description: "30세, 처형 직전, 후회로 가득 찬 모습")
  - Variant: 20 years old, current time -> ELISA_PRESENT (description: "20세, 회귀 후, 결의에 찬 모습")

Return a JSON object containing a list of entities.
"""

    # Build content parts
    parts = [types.Part.from_text(text=system_prompt)]

    if file_uri:
        parts.append(types.Part.from_uri(file_uri=file_uri, mime_type="text/plain"))
    else:
        # Limit to ~800k characters to be safe
        truncated_text = text[:800000] if len(text) > 800000 else text
        parts.append(types.Part.from_text(text=f"TEXT CONTENT:\n{truncated_text}"))

    response = await client.aio.models.generate_content(
        model=MODEL_NAME,
        contents=[types.Content(role="user", parts=parts)],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema={
                "type": "object",
                "properties": {
                    "entities": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "name": {"type": "string"},
                                "type": {"type": "string", "enum": ["CHARACTER", "ITEM", "LOCATION"]},
                                "variants": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "id": {"type": "string"},
                                            "description": {"type": "string"},
                                            "tags": {"type": "array", "items": {"type": "string"}}
                                        },
                                        "required": ["id", "description"]
                                    }
                                }
                            },
                            "required": ["name", "type", "variants"]
                        }
                    }
                },
                "required": ["entities"]
            }
        )
    )

    response_text = response.text.strip() if response.text else ""
    if not response_text:
        raise VideoJobError.provider_error("Empty response from Gemini API")

    result = json.loads(response_text)
    return result.get("entities", [])


async def _handle_glossary_cancellation(
    job_id: str,
    job: JobDocument,
    state_machine: JobStateMachine,
) -> None:
    """Handle glossary job cancellation."""
    job_queue_service = get_job_queue_service()

    logger.info(f"[{job_id}] Handling glossary cancellation")

    state_machine.transition_to(JobStatus.CANCELLED)
    await job_queue_service.update_job_status(
        job_id,
        JobStatus.CANCELLED,
        cancelled_at=datetime.now(timezone.utc).isoformat(),
    )


async def _handle_glossary_error(
    job: JobDocument,
    error: VideoJobError,
    state_machine: JobStateMachine,
    custom_api_key: str | None = None,
) -> dict:
    """Handle glossary job error with potential retry."""
    from app.workers.tasks import retry_failed_id_converter_job

    job_queue_service = get_job_queue_service()

    logger.error(f"[{job.id}] Glossary error: {error.code.value} - {error.message}")

    # Create retry state from job
    retry_state = RetryState(
        max_retries=job.max_retries,
        retry_count=job.retry_count,
    )

    # Record this failure
    retry_state.record_failure(error.code.value, error.message)

    # Check if we should retry
    if error.retryable and retry_state.can_retry():
        delay = retry_state.get_next_delay(error.code)
        logger.info(
            f"[{job.id}] Will retry glossary in {delay:.1f}s "
            f"(attempt {retry_state.retry_count}/{retry_state.max_retries})"
        )

        # Update job for retry
        state_machine.transition_to(JobStatus.FAILED)
        await job_queue_service.update_job(
            job.id,
            status=JobStatus.PENDING.value,
            retry_count=retry_state.retry_count,
            error_code=error.code.value,
            error_message=error.message,
            error_retryable=True,
        )

        # Queue retry task with delay and API key
        await retry_failed_id_converter_job.kiq(job.id, delay, custom_api_key)

        return {
            "job_id": job.id,
            "status": "retry_scheduled",
            "retry_after": delay,
            "attempt": retry_state.retry_count,
        }

    else:
        # Move to DLQ
        logger.warning(f"[{job.id}] Moving glossary job to DLQ after {retry_state.retry_count} attempts")

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


# ============================================================================
# Batch Conversion
# ============================================================================


async def process_batch_conversion(
    job_id: str,
    worker_id: str = "worker-1",
    custom_api_key: str | None = None,
) -> dict:
    """
    Process all chunks in a batch conversion job.

    Key features:
    - Processes chunks sequentially (each needs context from previous)
    - Updates progress after each chunk
    - Can resume from last completed chunk if job is restarted
    - Updates Firestore idConverter document with converted chunks

    Args:
        job_id: The job ID to process
        worker_id: ID of the worker processing this job
        custom_api_key: Optional custom API key (passed through task queue)

    Returns:
        dict with status and result information
    """
    job_queue_service = get_job_queue_service()
    id_converter_service = get_id_converter_service()

    logger.info(f"[{worker_id}] ========== Starting batch conversion for job {job_id} ==========")

    # Fetch job from Firestore
    job = await job_queue_service.get_job(job_id)
    if not job:
        logger.error(f"[ID-CONV-BATCH] Job {job_id} not found in Firestore")
        return {"job_id": job_id, "status": "error", "error": "Job not found"}

    logger.info(f"[ID-CONV-BATCH] Job {job_id} loaded: project={job.project_id}, status={job.status}")
    logger.info(f"[ID-CONV-BATCH] Total chunks: {job.total_chunks}, Completed: {job.completed_chunks}")
    logger.info(f"[ID-CONV-BATCH] Glossary entities: {len(job.glossary_result or [])}")

    # Initialize state machine
    state_machine = JobStateMachine(job_id, job.status)

    # Mark job as being processed by this worker
    await job_queue_service.update_job(job_id, worker_id=worker_id)

    try:
        # Get API key
        api_key = _get_api_key(job, custom_api_key)

        chunks_data = job.chunks_data or []
        total_chunks = len(chunks_data)
        start_index = job.completed_chunks or 0

        if total_chunks == 0:
            raise VideoJobError.invalid_request("No chunks to process")

        # Transition to GENERATING
        state_machine.transition_to(JobStatus.GENERATING)
        initial_progress = start_index / total_chunks if total_chunks > 0 else 0
        await job_queue_service.update_job_status(
            job_id,
            JobStatus.GENERATING,
            progress=initial_progress,
            total_chunks=total_chunks,
            completed_chunks=start_index,
        )
        logger.info(f"[ID-CONV-BATCH] {job_id} - Status updated to GENERATING, starting from chunk {start_index}")

        # Update idConverter step to processing
        await id_converter_service.update_step(
            project_id=job.project_id,
            current_step="processing",
        )

        # Process each chunk sequentially
        for i in range(start_index, total_chunks):
            # Check for cancellation before each chunk
            await check_cancellation(job_id)

            chunk = chunks_data[i]
            logger.info(f"[ID-CONV-BATCH] {job_id} - Processing chunk {i + 1}/{total_chunks}")

            # Get context from previous chunk
            prev_text = ""
            if i > 0 and chunks_data[i - 1].get("translatedText"):
                prev_text = chunks_data[i - 1]["translatedText"][-1000:]

            # Mark chunk as processing
            chunks_data[i]["status"] = "processing"
            await job_queue_service.update_job(
                job_id,
                current_chunk_index=i,
                chunks_data=chunks_data,
            )

            # Convert chunk
            try:
                translated_text = await _convert_chunk_with_gemini(
                    chunk.get("originalText", ""),
                    job.glossary_result or [],
                    prev_text,
                    api_key
                )
                logger.info(f"[ID-CONV-BATCH] {job_id} - ✓ Chunk {i + 1} converted ({len(translated_text)} chars)")
            except Exception as e:
                logger.error(f"[ID-CONV-BATCH] {job_id} - ✗ Chunk {i + 1} failed: {e}")
                chunks_data[i]["status"] = "error"
                raise

            # Update chunk data
            chunks_data[i]["translatedText"] = translated_text
            chunks_data[i]["status"] = "completed"

            # Update progress in Firestore
            progress = (i + 1) / total_chunks
            await job_queue_service.update_job(
                job_id,
                progress=progress,
                completed_chunks=i + 1,
                current_chunk_index=i,
                chunks_data=chunks_data,
            )

            # Update project's idConverter document with chunk progress
            await id_converter_service.update_chunks(
                project_id=job.project_id,
                chunks=chunks_data,
                batch_job_id=job_id,
            )

        # Mark complete
        state_machine.transition_to(JobStatus.COMPLETED)
        await job_queue_service.update_job_status(
            job_id,
            JobStatus.COMPLETED,
            progress=1.0,
            completed_chunks=total_chunks,
        )

        # Update idConverter step to completed
        await id_converter_service.update_step(
            project_id=job.project_id,
            current_step="completed",
        )

        logger.info(f"[ID-CONV-BATCH] {job_id} ========== JOB COMPLETED SUCCESSFULLY ==========")
        return {
            "job_id": job_id,
            "status": "completed",
            "total_chunks": total_chunks,
        }

    except CancellationRequested:
        logger.warning(f"[ID-CONV-BATCH] {job_id} - Job was cancelled at chunk {job.current_chunk_index}")
        await _handle_batch_cancellation(job_id, job, state_machine)
        return {"job_id": job_id, "status": "cancelled"}

    except VideoJobError as e:
        logger.error(f"[ID-CONV-BATCH] {job_id} - VideoJobError: {e.code.value} - {e.message}")
        return await _handle_batch_error(job, e, state_machine, custom_api_key)

    except Exception as e:
        logger.exception(f"[ID-CONV-BATCH] {job_id} - Unexpected error: {type(e).__name__}: {str(e)}")
        video_error = classify_exception(e)
        return await _handle_batch_error(job, video_error, state_machine, custom_api_key)


async def _convert_chunk_with_gemini(
    chunk_text: str,
    glossary: list[dict],
    previous_context: str,
    api_key: str
) -> str:
    """Call Gemini to convert a single chunk."""
    client = genai.Client(api_key=api_key)

    # Build glossary string
    glossary_parts = []
    for entity in glossary:
        entity_str = f"Entity: {entity.get('name', 'Unknown')}\nVariants:"
        for variant in entity.get('variants', []):
            entity_str += f"\n- {variant.get('id', 'UNKNOWN')}: {variant.get('description', '')}"
        glossary_parts.append(entity_str)
    glossary_str = "\n---\n".join(glossary_parts)

    system_prompt = f"""
Task: Translate the following Korean Webnovel text to English in a high-quality, narrative "storyboard" style.

CRITICAL INSTRUCTION - ID REPLACEMENT:
1. In narrative descriptions, stage directions, and action lines, you MUST replace names, pronouns (where unambiguous), and references to specific items with their corresponding IDs from the glossary below.
2. Infer the correct Variant ID based on the narrative context (time, appearance, mood).

CRITICAL INSTRUCTION - DIALOGUE PROTECTION:
1. **DO NOT** replace names or terms inside spoken dialogue (text within quotation marks).
2. Dialogue should remain natural English language.
3. Example:
   - CORRECT: ELISA_PRESENT walked into the room. "Hello, James," she said.
   - INCORRECT: ELISA_PRESENT walked into the room. "Hello, JAMES_SOLDIER," ELISA_PRESENT said.

GLOSSARY:
{glossary_str}

PREVIOUS CONTEXT (for continuity):
{previous_context}
"""

    response = await client.aio.models.generate_content(
        model=MODEL_NAME,
        contents=[
            types.Content(role="user", parts=[
                types.Part.from_text(text=system_prompt),
                types.Part.from_text(text=f"TEXT TO TRANSLATE:\n{chunk_text}")
            ])
        ]
    )

    return response.text or ""


async def _handle_batch_cancellation(
    job_id: str,
    job: JobDocument,
    state_machine: JobStateMachine,
) -> None:
    """Handle batch job cancellation."""
    job_queue_service = get_job_queue_service()
    id_converter_service = get_id_converter_service()

    logger.info(f"[{job_id}] Handling batch cancellation")

    state_machine.transition_to(JobStatus.CANCELLED)
    await job_queue_service.update_job_status(
        job_id,
        JobStatus.CANCELLED,
        cancelled_at=datetime.now(timezone.utc).isoformat(),
    )

    # Keep the chunks as-is (partially completed state is preserved)
    # The user can see progress and potentially retry later


async def _handle_batch_error(
    job: JobDocument,
    error: VideoJobError,
    state_machine: JobStateMachine,
    custom_api_key: str | None = None,
) -> dict:
    """Handle batch job error with potential retry."""
    from app.workers.tasks import retry_failed_id_converter_job

    job_queue_service = get_job_queue_service()

    logger.error(f"[{job.id}] Batch error at chunk {job.current_chunk_index}: {error.code.value} - {error.message}")

    # Create retry state from job
    retry_state = RetryState(
        max_retries=job.max_retries,
        retry_count=job.retry_count,
    )

    # Record this failure
    retry_state.record_failure(error.code.value, error.message)

    # Check if we should retry
    if error.retryable and retry_state.can_retry():
        delay = retry_state.get_next_delay(error.code)
        logger.info(
            f"[{job.id}] Will retry batch from chunk {job.completed_chunks} in {delay:.1f}s "
            f"(attempt {retry_state.retry_count}/{retry_state.max_retries})"
        )

        # Update job for retry - keep completed_chunks so we can resume
        state_machine.transition_to(JobStatus.FAILED)
        await job_queue_service.update_job(
            job.id,
            status=JobStatus.PENDING.value,
            retry_count=retry_state.retry_count,
            error_code=error.code.value,
            error_message=error.message,
            error_retryable=True,
        )

        # Queue retry task with delay and API key
        await retry_failed_id_converter_job.kiq(job.id, delay, custom_api_key)

        return {
            "job_id": job.id,
            "status": "retry_scheduled",
            "retry_after": delay,
            "attempt": retry_state.retry_count,
            "completed_chunks": job.completed_chunks,
        }

    else:
        # Move to DLQ
        logger.warning(f"[{job.id}] Moving batch job to DLQ after {retry_state.retry_count} attempts")

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
            "completed_chunks": job.completed_chunks,
        }
