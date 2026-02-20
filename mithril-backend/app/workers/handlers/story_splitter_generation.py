"""Story Splitter generation task handler."""

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
from app.services.firestore import get_job_queue_service

logger = logging.getLogger(__name__)
settings = get_settings()

MODEL_NAME = "gemini-2.5-pro"


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
        logger.info(f"Cancellation detected for story splitter job {job_id}")
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


async def process_story_splitter(
    job_id: str,
    custom_api_key: str | None = None,
    worker_id: str = "worker-1",
) -> dict:
    """
    Split a story into parts with cliffhanger analysis.

    This job:
    1. Calls Gemini to analyze and split the text
    2. Saves split parts to Firestore storySplits document
    3. Updates job status

    Args:
        job_id: The job ID to process
        custom_api_key: Optional custom API key (passed through task queue)
        worker_id: ID of the worker processing this job

    Returns:
        dict with status and result information
    """
    job_queue_service = get_job_queue_service()

    logger.info(f"[{worker_id}] ========== Starting story splitter job {job_id} ==========")

    # Fetch job from Firestore
    job = await job_queue_service.get_job(job_id)
    if not job:
        logger.error(f"[STORY-SPLITTER] Job {job_id} not found in Firestore")
        return {"job_id": job_id, "status": "error", "error": "Job not found"}

    logger.info(f"[STORY-SPLITTER] Job {job_id} loaded: project={job.project_id}, status={job.status}")
    logger.info(f"[STORY-SPLITTER] Text length: {len(job.story_text or '')} chars")
    logger.info(f"[STORY-SPLITTER] Num parts: {job.num_parts}")

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
        logger.info(f"[STORY-SPLITTER] {job_id} - Status updated to GENERATING")

        # Check for cancellation before AI call
        await check_cancellation(job_id)

        # Call Gemini for story splitting
        logger.info(f"[STORY-SPLITTER] {job_id} - Calling Gemini API for story splitting...")
        parts = await _split_story_with_gemini(
            job.story_text or "",
            job.guidelines or "",
            job.num_parts or 8,
            api_key
        )
        logger.info(f"[STORY-SPLITTER] {job_id} - Split into {len(parts)} parts")

        # Check for cancellation after AI call
        await check_cancellation(job_id)

        # Save to project's storySplits document
        logger.debug(f"[STORY-SPLITTER] {job_id} - Updating storySplits document in project")
        await _save_story_splits(
            job.project_id,
            job.guidelines or "",
            parts,
            job_id,
        )
        logger.info(f"[STORY-SPLITTER] {job_id} - storySplits document updated")

        # Update job with results
        state_machine.transition_to(JobStatus.COMPLETED)
        await job_queue_service.update_job_status(
            job_id,
            JobStatus.COMPLETED,
            progress=1.0,
            split_result=parts,
        )

        logger.info(f"[STORY-SPLITTER] {job_id} ========== JOB COMPLETED SUCCESSFULLY ==========")
        return {
            "job_id": job_id,
            "status": "completed",
            "parts_count": len(parts),
        }

    except CancellationRequested:
        logger.info(f"[STORY-SPLITTER] {job_id} - Job was cancelled")
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
        logger.exception(f"[STORY-SPLITTER] {job_id} - Error during processing: {e}")

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


async def _split_story_with_gemini(
    text: str,
    guidelines: str,
    num_parts: int,
    api_key: str,
) -> list[dict]:
    """
    Call Gemini API to split story text into parts with cliffhanger analysis.

    Args:
        text: Full story text to split
        guidelines: Genre-specific splitting guidelines
        num_parts: Number of parts to split into
        api_key: Gemini API key

    Returns:
        List of part dictionaries with text and cliffhangers
    """
    client = genai.Client(api_key=api_key)

    system_instruction = f"""
당신은 텍스트 분할 및 클리프행어 분석을 위한 AI 도구입니다. 당신의 임무는 두 가지입니다:

**임무 1: 텍스트 분할**
주어진 텍스트를 {num_parts}개의 파트로 나누기 위해, 각 파트(마지막 파트 제외)를 마무리할 **마지막 문장**을 찾아내세요.

**임무 2: 클리프행어 분석**
각 파트에서 3개의 핵심 클리프행어 포인트를 분석하세요:
1. BEGINNING (도입부 훅) - 파트 초반에서 독자를 끌어들이는 문장
2. MIDDLE (중반부) - 파트 중간에서 긴장감을 유지하는 문장
3. ENDING (절단면) - 파트 끝에서 다음 파트로 이어지는 클리프행어 문장

**절대적인 규칙:**
1. "cliffhangerSentences" 배열에는 **정확히 {num_parts - 1}개**의 문장이 포함되어야 합니다.
2. "partAnalysis" 배열에는 **정확히 {num_parts}개**의 파트 분석이 포함되어야 합니다.
3. 각 파트 분석에는 **정확히 3개**의 클리프행어가 포함되어야 합니다 (BEGINNING, MIDDLE, ENDING 순서).
4. 모든 문장은 원본 텍스트에 있는 문장과 **정확히 일치**해야 합니다. 단어, 구두점, 띄어쓰기 등을 절대 변경하지 마십시오.
5. 각 클리프행어의 "reason"은 왜 이 문장이 해당 위치에서 효과적인 클리프행어인지 한국어로 간결하게 설명해야 합니다.

**부차적인 목표:**
1. 각 파트의 분량이 가능한 한 균등하도록 해주세요.
2. 선택된 각 문장은 그 자체로 다음 내용에 대한 궁금증을 유발하는 훌륭한 클리프행어여야 합니다.

사용자 가이드라인: {guidelines or "추가 가이드라인 없음."}
"""

    # Define response schema
    response_schema = {
        "type": "OBJECT",
        "properties": {
            "cliffhangerSentences": {
                "type": "ARRAY",
                "description": f"An array of exactly {num_parts - 1} strings. Each string is the last sentence of a part and must be an exact quote from the source text.",
                "items": {
                    "type": "STRING",
                },
            },
            "partAnalysis": {
                "type": "ARRAY",
                "description": f"An array of exactly {num_parts} part analyses. Each analysis contains 3 cliffhangers (BEGINNING, MIDDLE, ENDING).",
                "items": {
                    "type": "OBJECT",
                    "properties": {
                        "cliffhangers": {
                            "type": "ARRAY",
                            "description": "Array of exactly 3 cliffhangers: BEGINNING, MIDDLE, ENDING in order.",
                            "items": {
                                "type": "OBJECT",
                                "properties": {
                                    "sentence": {
                                        "type": "STRING",
                                        "description": "The exact sentence from the source text.",
                                    },
                                    "reason": {
                                        "type": "STRING",
                                        "description": "Korean explanation of why this sentence is an effective cliffhanger at this position.",
                                    },
                                },
                                "required": ["sentence", "reason"],
                            },
                        },
                    },
                    "required": ["cliffhangers"],
                },
            },
        },
        "required": ["cliffhangerSentences", "partAnalysis"],
    }

    prompt = f"다음 전체 스크립트를 {num_parts}개의 파트로 나누고, 각 파트의 클리프행어를 분석해주세요:\n\n---\n{text}\n---"

    # Call Gemini with retry logic
    max_retries = 3
    initial_delay = 2000
    delay = initial_delay

    for attempt in range(max_retries):
        try:
            response = await client.aio.models.generate_content(
                model=MODEL_NAME,
                contents=prompt,
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
                import asyncio
                await asyncio.sleep(delay / 1000)
                delay *= 2
            else:
                raise

    response_text = response.text.strip() if response.text else ""
    if not response_text:
        raise ValueError("Empty response from Gemini API")

    result = json.loads(response_text)

    cliffhanger_sentences = result.get("cliffhangerSentences", [])
    part_analysis = result.get("partAnalysis", [])

    if not isinstance(cliffhanger_sentences, list):
        raise ValueError("AI returned invalid format for cliffhanger sentences")

    if len(cliffhanger_sentences) != num_parts - 1:
        raise ValueError(
            f"AI failed to generate requested number of cliffhanger sentences. "
            f"Requested: {num_parts - 1}, Generated: {len(cliffhanger_sentences)}"
        )

    # Split the text into parts
    text_parts = []
    remaining_text = text

    for sentence in cliffhanger_sentences:
        search_sentence = sentence.strip()
        index = remaining_text.find(search_sentence)

        if index == -1:
            logger.error(f"Could not find cliffhanger: '{search_sentence[:50]}...' in remaining text")
            raise ValueError(
                f"AI returned a cliffhanger sentence that could not be found in the original script. "
                f"The AI may have altered the sentence."
            )

        split_point = index + len(search_sentence)
        part = remaining_text[:split_point]
        text_parts.append(part.strip())
        remaining_text = remaining_text[split_point:]

    text_parts.append(remaining_text.strip())

    if len(text_parts) != num_parts:
        raise ValueError(
            f"Final number of parts after splitting does not match expected count. "
            f"Expected: {num_parts}, Actual: {len(text_parts)}"
        )

    # Combine text parts with analysis
    parts_with_analysis = []
    for i, text_part in enumerate(text_parts):
        analysis = part_analysis[i] if i < len(part_analysis) else {}
        parts_with_analysis.append({
            "text": text_part,
            "cliffhangers": analysis.get("cliffhangers", []),
        })

    return parts_with_analysis


async def _save_story_splits(
    project_id: str,
    guidelines: str,
    parts: list[dict],
    job_id: str,
) -> None:
    """
    Save story split results to Firestore.

    Args:
        project_id: The project ID
        guidelines: Guidelines used for splitting
        parts: List of split parts with cliffhangers
        job_id: The job ID
    """
    from app.services.firestore import get_story_splits_service

    story_splits_service = get_story_splits_service()
    await story_splits_service.save_story_splits(
        project_id=project_id,
        guidelines=guidelines,
        parts=parts,
        job_id=job_id,
    )
