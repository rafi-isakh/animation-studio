"""Firestore service for job queue operations."""

import base64
import hashlib
import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from google.cloud import firestore
from google.cloud.firestore_v1 import DocumentReference
from google.oauth2 import service_account

from app.config import get_settings
from app.models.job import (
    BgJobSubmitRequest,
    IdConverterBatchJobSubmitRequest,
    IdConverterGlossaryJobSubmitRequest,
    ImageJobSubmitRequest,
    JobDocument,
    JobStatus,
    JobSubmitRequest,
    JobType,
    PanelJobSubmitRequest,
    PanelSplitterJobSubmitRequest,
    PropDesignSheetJobSubmitRequest,
    StoryboardJobSubmitRequest,
    StorySplitterJobSubmitRequest,
    I2VStoryboardJobSubmitRequest,
    StoryboardEditorJobSubmitRequest,
)

logger = logging.getLogger(__name__)
settings = get_settings()

# Firestore client (lazily initialized)
_db: firestore.AsyncClient | None = None


def _parse_service_account(value: str) -> dict:
    """
    Parse service account JSON from env var.

    Supports:
    - Raw JSON string: {"type":"service_account",...}
    - Base64 encoded JSON
    """
    value = value.strip()

    # Try raw JSON first (starts with '{')
    if value.startswith("{"):
        return json.loads(value)

    # Try base64 decode
    try:
        decoded = base64.b64decode(value).decode("utf-8")
        return json.loads(decoded)
    except Exception:
        pass

    raise ValueError("Invalid service account format")


def get_db() -> firestore.AsyncClient:
    """Get or create Firestore async client."""
    global _db
    if _db is None:
        if settings.firebase_service_account_json:
            # Use service account credentials
            service_account_info = _parse_service_account(
                settings.firebase_service_account_json
            )
            credentials = service_account.Credentials.from_service_account_info(
                service_account_info
            )
            _db = firestore.AsyncClient(
                project=settings.firebase_project_id,
                credentials=credentials,
            )
            logger.info("Firestore client initialized with service account")
        else:
            # Fall back to default credentials (for local dev with gcloud auth)
            _db = firestore.AsyncClient(project=settings.firebase_project_id)
            logger.warning("Firestore client initialized with default credentials")
    return _db


def hash_api_key(api_key: str | None) -> str | None:
    """Hash API key for audit purposes (never store plaintext)."""
    if not api_key:
        return None
    return hashlib.sha256(api_key.encode()).hexdigest()[:16]


class JobQueueService:
    """Service for managing jobs in Firestore."""

    COLLECTION = "job_queue"
    DLQ_COLLECTION = "dead_letter_queue"

    def __init__(self) -> None:
        self.db = get_db()

    def _job_ref(self, job_id: str) -> DocumentReference:
        """Get document reference for a job."""
        return self.db.collection(self.COLLECTION).document(job_id)

    async def create_job(
        self,
        request: JobSubmitRequest,
        user_id: str,
        batch_id: str | None = None,
    ) -> JobDocument:
        """
        Create a new job in the queue.

        Args:
            request: Job submission request
            user_id: ID of the user creating the job
            batch_id: Optional batch ID for grouped jobs

        Returns:
            Created JobDocument
        """
        job_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)

        job = JobDocument(
            id=job_id,
            project_id=request.project_id,
            scene_index=request.scene_index,
            clip_index=request.clip_index,
            provider_id=request.provider_id,
            prompt=request.prompt,
            image_url=request.image_url,
            image_end_url=request.image_end_url,
            duration=request.duration,
            aspect_ratio=request.aspect_ratio,
            api_key_hash=hash_api_key(request.api_key),
            status=JobStatus.PENDING,
            created_at=now,
            updated_at=now,
            user_id=user_id,
            batch_id=batch_id,
        )

        # Store in Firestore
        await self._job_ref(job_id).set(job.model_dump(mode="json"))

        logger.info(f"Created job {job_id} for project {request.project_id}")
        return job

    async def create_image_job(
        self,
        request: ImageJobSubmitRequest,
        user_id: str,
        batch_id: str | None = None,
    ) -> JobDocument:
        """
        Create a new image generation job in the queue.

        Args:
            request: Image job submission request
            user_id: ID of the user creating the job
            batch_id: Optional batch ID for grouped jobs

        Returns:
            Created JobDocument
        """
        job_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)

        job = JobDocument(
            id=job_id,
            type=JobType.IMAGE,
            project_id=request.project_id,
            scene_index=request.scene_index,
            clip_index=request.clip_index,
            provider_id="gemini",  # Currently only Gemini for images
            prompt=request.prompt,
            style_prompt=request.style_prompt,
            reference_urls=request.reference_urls,
            aspect_ratio=request.aspect_ratio,
            api_key_hash=hash_api_key(request.api_key),
            status=JobStatus.PENDING,
            created_at=now,
            updated_at=now,
            user_id=user_id,
            batch_id=batch_id,
            # Image-specific fields
            frame_id=request.frame_id,
            frame_label=request.frame_label,
            max_retries=2,  # Fewer retries for images
        )

        # Store in Firestore
        await self._job_ref(job_id).set(job.model_dump(mode="json"))

        logger.info(f"Created image job {job_id} for project {request.project_id}, frame {request.frame_id}")
        return job

    async def create_bg_job(
        self,
        request: BgJobSubmitRequest,
        user_id: str,
        batch_id: str | None = None,
    ) -> JobDocument:
        """
        Create a new background angle generation job in the queue.

        Args:
            request: Background job submission request
            user_id: ID of the user creating the job
            batch_id: Optional batch ID for grouped jobs

        Returns:
            Created JobDocument
        """
        job_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)

        # Build reference URLs list from single reference URL if provided
        reference_urls = [request.reference_url] if request.reference_url else []

        job = JobDocument(
            id=job_id,
            type=JobType.BACKGROUND,
            project_id=request.project_id,
            scene_index=0,  # Not used for backgrounds
            clip_index=0,  # Not used for backgrounds
            provider_id="gemini",  # Currently only Gemini for backgrounds
            prompt=request.prompt,
            aspect_ratio=request.aspect_ratio,
            api_key_hash=hash_api_key(request.api_key),
            status=JobStatus.PENDING,
            created_at=now,
            updated_at=now,
            user_id=user_id,
            batch_id=batch_id,
            # Background-specific fields
            bg_id=request.bg_id,
            bg_angle=request.bg_angle,
            bg_name=request.bg_name,
            reference_urls=reference_urls,  # Master reference image for style consistency
            max_retries=2,  # Fewer retries for backgrounds
        )

        # Store in Firestore
        await self._job_ref(job_id).set(job.model_dump(mode="json"))

        logger.info(f"Created bg job {job_id} for project {request.project_id}, bg {request.bg_id}, angle {request.bg_angle}")
        return job

    async def create_prop_design_sheet_job(
        self,
        request: PropDesignSheetJobSubmitRequest,
        user_id: str,
        batch_id: str | None = None,
    ) -> JobDocument:
        """
        Create a new prop design sheet generation job in the queue.

        Args:
            request: Prop design sheet job submission request
            user_id: ID of the user creating the job
            batch_id: Optional batch ID for grouped jobs

        Returns:
            Created JobDocument
        """
        job_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)

        job = JobDocument(
            id=job_id,
            type=JobType.PROP_DESIGN_SHEET,
            project_id=request.project_id,
            scene_index=0,  # Not used for props
            clip_index=0,  # Not used for props
            provider_id="gemini",  # Currently only Gemini for prop design sheets
            prompt=request.prompt,
            aspect_ratio=request.aspect_ratio,
            api_key_hash=hash_api_key(request.api_key),
            status=JobStatus.PENDING,
            created_at=now,
            updated_at=now,
            user_id=user_id,
            batch_id=batch_id,
            # Prop design sheet-specific fields
            prop_id=request.prop_id,
            prop_name=request.prop_name,
            prop_category=request.category,
            reference_urls=request.reference_urls,
            max_retries=2,  # Fewer retries for prop design sheets
        )

        # Store in Firestore
        await self._job_ref(job_id).set(job.model_dump(mode="json"))

        logger.info(f"Created prop design sheet job {job_id} for project {request.project_id}, prop {request.prop_id} ({request.prop_name})")
        return job

    async def create_panel_job(
        self,
        request: PanelJobSubmitRequest,
        user_id: str,
    ) -> JobDocument:
        """
        Create a new panel editor job in the queue.

        Args:
            request: Panel job submission request
            user_id: ID of the user creating the job

        Returns:
            Created JobDocument
        """
        job_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)

        job = JobDocument(
            id=job_id,
            type=JobType.PANEL,
            project_id=request.project_id,  # Use actual project_id for S3 storage
            scene_index=0,  # Not used for panels
            clip_index=0,  # Not used for panels
            provider_id=request.provider,
            prompt="",  # Prompt is built in the handler
            aspect_ratio=request.target_aspect_ratio,
            api_key_hash=hash_api_key(request.api_key),
            status=JobStatus.PENDING,
            created_at=now,
            updated_at=now,
            user_id=user_id,
            # Panel-specific fields
            session_id=request.session_id,  # For real-time tracking
            panel_id=request.panel_id,
            file_name=request.file_name,
            # NOTE: image_base64 is passed through task queue, not stored in Firestore
            # to avoid the 1MB document size limit (same pattern as panel splitter)
            source_mime_type=request.mime_type,
            refinement_mode=request.refinement_mode,
            max_retries=2,  # Fewer retries for panels
        )

        # Store in Firestore
        await self._job_ref(job_id).set(job.model_dump(mode="json"))

        logger.info(f"Created panel job {job_id} for session {request.session_id}, panel {request.panel_id}")
        return job

    async def create_id_converter_glossary_job(
        self,
        request: IdConverterGlossaryJobSubmitRequest,
        user_id: str,
    ) -> JobDocument:
        """
        Create a new ID converter glossary analysis job in the queue.

        Args:
            request: Glossary analysis job submission request
            user_id: ID of the user creating the job

        Returns:
            Created JobDocument
        """
        job_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)

        job = JobDocument(
            id=job_id,
            type=JobType.ID_CONVERTER_GLOSSARY,
            project_id=request.project_id,
            scene_index=0,  # Not used for ID converter
            clip_index=0,  # Not used for ID converter
            provider_id="gemini",
            prompt="",  # Prompt is built in the handler
            aspect_ratio="",  # Not used for ID converter
            api_key_hash=hash_api_key(request.api_key),
            status=JobStatus.PENDING,
            created_at=now,
            updated_at=now,
            user_id=user_id,
            # ID Converter glossary-specific fields
            original_text=request.original_text,
            file_uri=request.file_uri,
            max_retries=3,
        )

        # Store in Firestore
        await self._job_ref(job_id).set(job.model_dump(mode="json"))

        logger.info(f"Created ID converter glossary job {job_id} for project {request.project_id}")
        return job

    async def create_id_converter_batch_job(
        self,
        request: IdConverterBatchJobSubmitRequest,
        user_id: str,
    ) -> JobDocument:
        """
        Create a new ID converter batch conversion job in the queue.

        Args:
            request: Batch conversion job submission request
            user_id: ID of the user creating the job

        Returns:
            Created JobDocument
        """
        job_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)

        # Prepare chunks data with proper structure
        chunks_data = [
            {
                "originalIndex": chunk.get("originalIndex", i),
                "originalText": chunk.get("originalText", ""),
                "translatedText": "",
                "status": "pending",
            }
            for i, chunk in enumerate(request.chunks)
        ]

        job = JobDocument(
            id=job_id,
            type=JobType.ID_CONVERTER_BATCH,
            project_id=request.project_id,
            scene_index=0,  # Not used for ID converter
            clip_index=0,  # Not used for ID converter
            provider_id="gemini",
            prompt="",  # Prompt is built in the handler
            aspect_ratio="",  # Not used for ID converter
            api_key_hash=hash_api_key(request.api_key),
            status=JobStatus.PENDING,
            created_at=now,
            updated_at=now,
            user_id=user_id,
            # ID Converter batch-specific fields
            glossary_result=request.glossary,
            chunks_data=chunks_data,
            total_chunks=len(chunks_data),
            completed_chunks=0,
            current_chunk_index=0,
            max_retries=3,
        )

        # Store in Firestore
        await self._job_ref(job_id).set(job.model_dump(mode="json"))

        logger.info(f"Created ID converter batch job {job_id} for project {request.project_id} with {len(chunks_data)} chunks")
        return job

    async def create_story_splitter_job(
        self,
        request: StorySplitterJobSubmitRequest,
        user_id: str,
    ) -> JobDocument:
        """
        Create a new story splitter job in the queue.

        Args:
            request: Story splitter job submission request
            user_id: ID of the user creating the job

        Returns:
            Created JobDocument
        """
        job_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)

        job = JobDocument(
            id=job_id,
            type=JobType.STORY_SPLITTER,
            project_id=request.project_id,
            scene_index=0,  # Not used for story splitter
            clip_index=0,  # Not used for story splitter
            provider_id="gemini",
            prompt="",  # Prompt is built in the handler
            aspect_ratio="",  # Not used for story splitter
            api_key_hash=hash_api_key(request.api_key),
            status=JobStatus.PENDING,
            created_at=now,
            updated_at=now,
            user_id=user_id,
            # Story splitter-specific fields
            story_text=request.text,
            guidelines=request.guidelines,
            num_parts=request.num_parts,
            max_retries=3,
        )

        # Store in Firestore
        await self._job_ref(job_id).set(job.model_dump(mode="json"))

        logger.info(f"Created story splitter job {job_id} for project {request.project_id} with {request.num_parts} parts")
        return job

    async def create_panel_splitter_job(
        self,
        request: PanelSplitterJobSubmitRequest,
        user_id: str,
        batch_id: str | None = None,
    ) -> JobDocument:
        """
        Create a new panel splitter job in the queue.

        Args:
            request: Panel splitter job submission request
            user_id: ID of the user creating the job
            batch_id: Optional batch ID for grouped jobs

        Returns:
            Created JobDocument
        """
        job_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)

        job = JobDocument(
            id=job_id,
            type=JobType.PANEL_SPLITTER,
            project_id=request.project_id,
            scene_index=0,  # Not used for panel splitter
            clip_index=0,  # Not used for panel splitter
            provider_id="gemini",
            prompt="",  # Prompt is built in the handler
            aspect_ratio="",  # Not used for panel splitter
            api_key_hash=hash_api_key(request.api_key),
            status=JobStatus.PENDING,
            created_at=now,
            updated_at=now,
            user_id=user_id,
            batch_id=batch_id,
            # Panel splitter-specific fields
            page_id=request.page_id,
            page_index=request.page_index,
            file_name=request.file_name,
            reading_direction=request.reading_direction,
            # NOTE: image_base64 is passed through task queue, not stored in Firestore
            # to avoid 1MB document size limit
            max_retries=3,
        )

        # Store in Firestore
        await self._job_ref(job_id).set(job.model_dump(mode="json"))

        logger.info(f"Created panel splitter job {job_id} for page {request.page_id}")
        return job

    async def create_storyboard_job(
        self,
        request: StoryboardJobSubmitRequest,
        user_id: str,
    ) -> JobDocument:
        """
        Create a new storyboard generation job in the queue.

        Args:
            request: Storyboard job submission request
            user_id: ID of the user creating the job

        Returns:
            Created JobDocument
        """
        job_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)

        job = JobDocument(
            id=job_id,
            type=JobType.STORYBOARD,
            project_id=request.project_id,
            scene_index=0,  # Not used for storyboard
            clip_index=0,  # Not used for storyboard
            provider_id="gemini",
            prompt="",  # Prompt is built in the handler
            aspect_ratio="",  # Not used for storyboard
            api_key_hash=hash_api_key(request.api_key),
            status=JobStatus.PENDING,
            created_at=now,
            updated_at=now,
            user_id=user_id,
            # Storyboard-specific fields
            source_text=request.source_text,
            part_index=request.part_index,
            target_time=request.target_time,
            story_condition=request.story_condition,
            image_condition=request.image_condition,
            video_condition=request.video_condition,
            sound_condition=request.sound_condition,
            image_guide=request.image_guide,
            video_guide=request.video_guide,
            custom_instruction=request.custom_instruction,
            background_instruction=request.background_instruction,
            negative_instruction=request.negative_instruction,
            video_instruction=request.video_instruction,
            max_retries=3,
        )

        # Store in Firestore
        await self._job_ref(job_id).set(job.model_dump(mode="json"))

        logger.info(f"Created storyboard job {job_id} for project {request.project_id}")
        return job

    async def create_i2v_storyboard_job(
        self,
        request: I2VStoryboardJobSubmitRequest,
        user_id: str,
    ) -> JobDocument:
        """
        Create a new I2V storyboard generation job in the queue.

        Args:
            request: I2V storyboard job submission request
            user_id: ID of the user creating the job

        Returns:
            Created JobDocument
        """
        job_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)

        job = JobDocument(
            id=job_id,
            type=JobType.I2V_STORYBOARD,
            project_id=request.project_id,
            scene_index=0,
            clip_index=0,
            provider_id="gemini",
            prompt="",
            aspect_ratio="",
            api_key_hash=hash_api_key(request.api_key),
            status=JobStatus.PENDING,
            created_at=now,
            updated_at=now,
            user_id=user_id,
            # I2V Storyboard-specific fields
            panel_urls=request.panel_urls,
            panel_labels=request.panel_labels,
            target_duration=request.target_duration,
            source_text=request.source_text,
            story_condition=request.story_condition,
            image_condition=request.image_condition,
            video_condition=request.video_condition,
            sound_condition=request.sound_condition,
            image_guide=request.image_guide,
            video_guide=request.video_guide,
            max_retries=3,
        )

        # Store in Firestore
        await self._job_ref(job_id).set(job.model_dump(mode="json"))

        logger.info(f"Created I2V storyboard job {job_id} for project {request.project_id}")
        return job

    async def create_storyboard_editor_job(
        self,
        request: StoryboardEditorJobSubmitRequest,
        user_id: str,
    ) -> JobDocument:
        """
        Create a new storyboard editor job (generate or remix) in the queue.

        Args:
            request: Storyboard editor job submission request
            user_id: ID of the user creating the job

        Returns:
            Created JobDocument
        """
        job_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)

        job = JobDocument(
            id=job_id,
            type=JobType.STORYBOARD_EDITOR,
            project_id=request.project_id,
            scene_index=request.scene_index,
            clip_index=request.clip_index,
            provider_id="gemini",
            prompt=request.prompt,
            aspect_ratio=request.aspect_ratio,
            api_key_hash=hash_api_key(request.api_key),
            status=JobStatus.PENDING,
            created_at=now,
            updated_at=now,
            user_id=user_id,
            # Storyboard Editor-specific fields
            frame_type=request.frame_type,
            operation=request.operation,
            reference_urls=[request.reference_image_url] if request.reference_image_url else [],
            asset_image_urls=request.asset_image_urls,
            original_image_url=request.original_image_url,
            original_context=request.original_context,
            remix_prompt=request.remix_prompt,
            max_retries=2,
        )

        # Store in Firestore
        await self._job_ref(job_id).set(job.model_dump(mode="json"))

        logger.info(
            f"Created storyboard editor job {job_id} for project {request.project_id} "
            f"(scene={request.scene_index}, clip={request.clip_index}, "
            f"frame={request.frame_type}, op={request.operation})"
        )
        return job

    async def get_job(self, job_id: str) -> JobDocument | None:
        """
        Get a job by ID.

        Args:
            job_id: The job ID

        Returns:
            JobDocument if found, None otherwise
        """
        doc = await self._job_ref(job_id).get()
        if not doc.exists:
            return None
        return JobDocument(**doc.to_dict())

    async def update_job(
        self,
        job_id: str,
        *,
        unset_fields: list[str] | None = None,
        **updates: Any,
    ) -> None:
        """
        Update job fields.

        Args:
            job_id: The job ID
            unset_fields: Optional list of fields to remove from the document.
            **updates: Fields to update
        """
        updates["updated_at"] = datetime.now(timezone.utc).isoformat()

        # Filter out None values (default behavior is to avoid overwriting with nulls).
        filtered_updates = {k: v for k, v in updates.items() if v is not None}

        # Explicitly unset fields when requested.
        if unset_fields:
            for field_name in unset_fields:
                filtered_updates[field_name] = firestore.DELETE_FIELD

        await self._job_ref(job_id).update(filtered_updates)
        logger.debug(f"Updated job {job_id}: {list(filtered_updates.keys())}")

    async def update_job_status(
        self,
        job_id: str,
        status: JobStatus,
        **kwargs: Any,
    ) -> None:
        """
        Update job status with optional additional fields.

        Args:
            job_id: The job ID
            status: New status
            **kwargs: Additional fields to update
        """
        updates = {"status": status.value, **kwargs}

        # Set timestamp based on status
        if status == JobStatus.SUBMITTED:
            updates["submitted_at"] = datetime.now(timezone.utc).isoformat()
        elif status in (JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED):
            updates["completed_at"] = datetime.now(timezone.utc).isoformat()

        await self.update_job(job_id, **updates)
        logger.info(f"Job {job_id} status changed to {status.value}")

    async def mark_cancellation_requested(self, job_id: str) -> bool:
        """
        Mark a job for cancellation.

        Args:
            job_id: The job ID

        Returns:
            True if cancellation was requested, False if job already terminal
        """
        job = await self.get_job(job_id)
        if not job:
            return False

        # Can't cancel already completed/failed jobs
        if job.status in (JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED):
            return False

        await self.update_job(job_id, cancellation_requested=True)
        logger.info(f"Cancellation requested for job {job_id}")
        return True

    async def get_project_jobs(
        self,
        project_id: str,
        status_filter: list[JobStatus] | None = None,
        limit: int = 50,
    ) -> list[JobDocument]:
        """
        Get jobs for a project.

        Args:
            project_id: The project ID
            status_filter: Optional list of statuses to filter by
            limit: Maximum number of jobs to return

        Returns:
            List of JobDocuments
        """
        query = self.db.collection(self.COLLECTION).where(
            "project_id", "==", project_id
        )

        if status_filter:
            status_values = [s.value for s in status_filter]
            query = query.where("status", "in", status_values)

        query = query.order_by("created_at", direction=firestore.Query.DESCENDING)
        query = query.limit(limit)

        docs = await query.get()
        return [JobDocument(**doc.to_dict()) for doc in docs]

    async def move_to_dlq(
        self,
        job_id: str,
        error_code: str,
        error_message: str,
        failure_history: list[dict],
    ) -> None:
        """
        Move a failed job to the dead letter queue.

        Args:
            job_id: The job ID
            error_code: Final error code
            error_message: Final error message
            failure_history: List of all failure attempts
        """
        job = await self.get_job(job_id)
        if not job:
            return

        dlq_id = str(uuid.uuid4())
        dlq_doc = {
            "id": dlq_id,
            "original_job_id": job_id,
            "project_id": job.project_id,
            "scene_index": job.scene_index,
            "clip_index": job.clip_index,
            "original_request": {
                "prompt": job.prompt,
                "image_url": job.image_url,
                "duration": job.duration,
                "aspect_ratio": job.aspect_ratio,
                "provider_id": job.provider_id,
            },
            "final_error_code": error_code,
            "final_error_message": error_message,
            "total_attempts": job.retry_count + 1,
            "failure_history": failure_history,
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        await self.db.collection(self.DLQ_COLLECTION).document(dlq_id).set(dlq_doc)
        logger.warning(f"Job {job_id} moved to DLQ as {dlq_id}")


class VideoClipService:
    """Service for updating video clips in project Firestore."""

    def __init__(self) -> None:
        self.db = get_db()

    def _clip_ref(self, project_id: str, scene_index: int, clip_index: int) -> DocumentReference:
        """Get document reference for a video clip."""
        clip_id = f"{scene_index}_{clip_index}"
        return (
            self.db.collection("projects")
            .document(project_id)
            .collection("storyboard")
            .document("video")
            .collection("clips")
            .document(clip_id)
        )

    async def update_clip_status(
        self,
        project_id: str,
        scene_index: int,
        clip_index: int,
        status: str,
        **kwargs: Any,
    ) -> None:
        """
        Update video clip status in project Firestore.

        Args:
            project_id: The project ID
            scene_index: Scene index
            clip_index: Clip index
            status: New status
            **kwargs: Additional fields (video_url, job_id, error, etc.)
        """
        updates = {"status": status, **kwargs}
        filtered_updates = {k: v for k, v in updates.items() if v is not None}

        await self._clip_ref(project_id, scene_index, clip_index).set(
            filtered_updates, merge=True
        )
        logger.debug(
            f"Updated clip {scene_index}_{clip_index} in project {project_id}"
        )


class ImageFrameService:
    """Service for updating image frames in project Firestore."""

    def __init__(self) -> None:
        self.db = get_db()

    def _frame_ref(self, project_id: str, frame_id: str) -> DocumentReference:
        """Get document reference for an image frame."""
        return (
            self.db.collection("projects")
            .document(project_id)
            .collection("imageGen")
            .document("settings")
            .collection("frames")
            .document(frame_id)
        )

    async def update_frame_status(
        self,
        project_id: str,
        frame_id: str,
        status: str,
        **kwargs: Any,
    ) -> None:
        """
        Update image frame status in project Firestore.

        Args:
            project_id: The project ID
            frame_id: Frame ID
            status: New status
            **kwargs: Additional fields (imageRef, s3FileName, jobId, error, etc.)
        """
        updates = {"status": status, **kwargs}
        filtered_updates = {k: v for k, v in updates.items() if v is not None}

        await self._frame_ref(project_id, frame_id).set(
            filtered_updates, merge=True
        )
        logger.debug(
            f"Updated frame {frame_id} in project {project_id}"
        )


class BackgroundAngleService:
    """Service for updating background angles in project Firestore."""

    def __init__(self) -> None:
        self.db = get_db()

    def _bg_ref(self, project_id: str, bg_id: str) -> DocumentReference:
        """Get document reference for a background."""
        return (
            self.db.collection("projects")
            .document(project_id)
            .collection("bgSheet")
            .document("settings")
            .collection("backgrounds")
            .document(bg_id)
        )

    async def update_angle_status(
        self,
        project_id: str,
        bg_id: str,
        angle: str,
        status: str,
        imageRef: str | None = None,
        s3FileName: str | None = None,
        jobId: str | None = None,
        error: str | None = None,
    ) -> None:
        """
        Update background angle status in project Firestore.

        The backgrounds collection stores documents with an 'angles' array.
        Each angle has: { angle: string, imageRef: string, status: string, jobId: string }

        Args:
            project_id: The project ID
            bg_id: Background ID
            angle: Angle name (e.g., "Front View", "Worm View")
            status: New status
            imageRef: S3 URL of generated image
            s3FileName: S3 file path
            jobId: Job ID for tracking
            error: Error message if failed
        """
        bg_ref = self._bg_ref(project_id, bg_id)
        bg_doc = await bg_ref.get()

        if not bg_doc.exists:
            logger.warning(f"Background {bg_id} not found in project {project_id}")
            return

        bg_data = bg_doc.to_dict()
        angles = bg_data.get("angles", [])

        # Find and update the specific angle
        updated = False
        for i, angle_data in enumerate(angles):
            if angle_data.get("angle") == angle:
                angles[i]["status"] = status
                if imageRef is not None:
                    angles[i]["imageRef"] = imageRef
                if s3FileName is not None:
                    angles[i]["s3FileName"] = s3FileName
                if jobId is not None:
                    angles[i]["jobId"] = jobId
                if error is not None:
                    angles[i]["error"] = error
                elif status == "completed":
                    # Clear error on success
                    angles[i].pop("error", None)
                updated = True
                break

        if not updated:
            logger.warning(f"Angle {angle} not found in background {bg_id}")
            return

        await bg_ref.update({"angles": angles})
        logger.debug(
            f"Updated angle {angle} in background {bg_id} in project {project_id}"
        )


class PropDesignSheetService:
    """Service for updating prop design sheets in project Firestore."""

    def __init__(self) -> None:
        self.db = get_db()

    def _result_ref(self, project_id: str) -> DocumentReference:
        """Get document reference for propDesignerResult."""
        return (
            self.db.collection("projects")
            .document(project_id)
            .collection("mithril")
            .document("propDesignerResult")
        )

    async def update_prop_design_sheet(
        self,
        project_id: str,
        prop_id: str,
        status: str,
        designSheetImageRef: str | None = None,
        designSheetPrompt: str | None = None,
        s3FileName: str | None = None,
        jobId: str | None = None,
        error: str | None = None,
    ) -> None:
        """
        Update prop design sheet in project Firestore.

        The propDesignerResult document stores a 'props' array.
        Each prop has: { id, name, category, designSheetImageRef, isGenerating, etc. }

        Args:
            project_id: The project ID
            prop_id: Prop ID
            status: New status ("generating", "completed", "failed")
            designSheetImageRef: S3 URL of generated design sheet
            designSheetPrompt: The prompt used for generation
            s3FileName: S3 file path
            jobId: Job ID for tracking
            error: Error message if failed
        """
        result_ref = self._result_ref(project_id)
        result_doc = await result_ref.get()

        if not result_doc.exists:
            logger.warning(f"propDesignerResult not found in project {project_id}")
            return

        result_data = result_doc.to_dict()
        props = result_data.get("props", [])

        # Find and update the specific prop
        updated = False
        for i, prop in enumerate(props):
            if prop.get("id") == prop_id:
                # Update status-related fields
                if status == "generating":
                    props[i]["isGenerating"] = True
                    props[i]["generationError"] = None
                elif status == "completed":
                    props[i]["isGenerating"] = False
                    props[i]["generationError"] = None
                    if designSheetImageRef is not None:
                        props[i]["designSheetImageRef"] = designSheetImageRef
                    if designSheetPrompt is not None:
                        props[i]["designSheetPrompt"] = designSheetPrompt
                elif status == "failed":
                    props[i]["isGenerating"] = False
                    props[i]["generationError"] = error

                if jobId is not None:
                    props[i]["jobId"] = jobId
                if s3FileName is not None:
                    props[i]["s3FileName"] = s3FileName

                updated = True
                break

        if not updated:
            logger.warning(f"Prop {prop_id} not found in project {project_id}")
            return

        await result_ref.update({"props": props})
        logger.debug(
            f"Updated prop {prop_id} design sheet in project {project_id} (status: {status})"
        )


class IdConverterService:
    """Service for updating ID converter data in project Firestore."""

    def __init__(self) -> None:
        self.db = get_db()

    def _doc_ref(self, project_id: str) -> DocumentReference:
        """Get document reference for idConverter/data."""
        return (
            self.db.collection("projects")
            .document(project_id)
            .collection("idConverter")
            .document("data")
        )

    async def update_glossary(
        self,
        project_id: str,
        glossary: list[dict],
        current_step: str | None = None,
        glossary_job_id: str | None = None,
    ) -> None:
        """
        Update glossary entities in project's idConverter document.

        Args:
            project_id: The project ID
            glossary: List of entity objects with variants
            current_step: Optional step to update ("analysis", "processing", etc.)
            glossary_job_id: Optional job ID for tracking
        """
        updates: dict[str, Any] = {"glossary": glossary}
        if current_step is not None:
            updates["currentStep"] = current_step
        if glossary_job_id is not None:
            updates["glossaryJobId"] = glossary_job_id

        await self._doc_ref(project_id).set(updates, merge=True)
        logger.debug(f"Updated glossary in project {project_id} ({len(glossary)} entities)")

    async def update_chunks(
        self,
        project_id: str,
        chunks: list[dict],
        batch_job_id: str | None = None,
    ) -> None:
        """
        Update converted chunks in project's idConverter document.

        Args:
            project_id: The project ID
            chunks: List of chunk data with translated text
            batch_job_id: Optional job ID for tracking
        """
        updates: dict[str, Any] = {"chunks": chunks}
        if batch_job_id is not None:
            updates["batchJobId"] = batch_job_id

        await self._doc_ref(project_id).set(updates, merge=True)
        logger.debug(f"Updated chunks in project {project_id} ({len(chunks)} chunks)")

    async def update_step(
        self,
        project_id: str,
        current_step: str,
    ) -> None:
        """
        Update current step in project's idConverter document.

        Args:
            project_id: The project ID
            current_step: The step to set ("upload", "analysis", "processing", "completed")
        """
        await self._doc_ref(project_id).set({"currentStep": current_step}, merge=True)
        logger.debug(f"Updated idConverter step in project {project_id} to {current_step}")

    async def get_data(self, project_id: str) -> dict | None:
        """
        Get the idConverter data for a project.

        Args:
            project_id: The project ID

        Returns:
            The idConverter data dict or None if not found
        """
        doc = await self._doc_ref(project_id).get()
        if not doc.exists:
            return None
        return doc.to_dict()


class StorySplitsService:
    """Service for updating story splits data in project Firestore."""

    def __init__(self) -> None:
        self.db = get_db()

    def _doc_ref(self, project_id: str) -> DocumentReference:
        """Get document reference for mithril/storySplits."""
        return (
            self.db.collection("projects")
            .document(project_id)
            .collection("mithril")
            .document("storySplits")
        )

    async def save_story_splits(
        self,
        project_id: str,
        guidelines: str,
        parts: list[dict],
        job_id: str | None = None,
    ) -> None:
        """
        Save story split results to project's storySplits document.

        Args:
            project_id: The project ID
            guidelines: Guidelines used for splitting
            parts: List of part objects with text and cliffhangers
            job_id: Optional job ID for tracking
        """
        data: dict[str, Any] = {
            "guidelines": guidelines,
            "parts": parts,
        }
        if job_id is not None:
            data["jobId"] = job_id

        await self._doc_ref(project_id).set(data, merge=True)
        logger.debug(f"Saved story splits in project {project_id} ({len(parts)} parts)")

    async def get_story_splits(self, project_id: str) -> dict | None:
        """
        Get the story splits data for a project.

        Args:
            project_id: The project ID

        Returns:
            The storySplits data dict or None if not found
        """
        doc = await self._doc_ref(project_id).get()
        if not doc.exists:
            return None
        return doc.to_dict()

    async def delete_story_splits(self, project_id: str) -> None:
        """
        Delete story splits data for a project.

        Args:
            project_id: The project ID
        """
        await self._doc_ref(project_id).delete()
        logger.debug(f"Deleted story splits for project {project_id}")


class StoryboardService:
    """Service for updating storyboard data in project Firestore."""

    def __init__(self) -> None:
        self.db = get_db()

    def _storyboard_ref(self, project_id: str) -> DocumentReference:
        """Get document reference for storyboard/data."""
        return (
            self.db.collection("projects")
            .document(project_id)
            .collection("storyboard")
            .document("data")
        )

    def _voice_prompts_ref(self, project_id: str) -> DocumentReference:
        """Get document reference for storyboard/voicePrompts."""
        return (
            self.db.collection("projects")
            .document(project_id)
            .collection("storyboard")
            .document("voicePrompts")
        )

    def _scene_ref(self, project_id: str, scene_index: int) -> DocumentReference:
        """Get document reference for a scene."""
        return (
            self.db.collection("projects")
            .document(project_id)
            .collection("storyboard")
            .document("data")
            .collection("scenes")
            .document(f"scene_{scene_index}")
        )

    def _clip_ref(self, project_id: str, scene_index: int, clip_index: int) -> DocumentReference:
        """Get document reference for a clip within a scene."""
        return (
            self.db.collection("projects")
            .document(project_id)
            .collection("storyboard")
            .document("data")
            .collection("scenes")
            .document(f"scene_{scene_index}")
            .collection("clips")
            .document(f"clip_{clip_index}")
        )

    async def save_storyboard(
        self,
        project_id: str,
        scenes: list[dict],
        voice_prompts: list[dict],
        character_id_summary: list[dict] | None = None,
        genre: str | None = None,
        job_id: str | None = None,
    ) -> None:
        """
        Save storyboard results to Firestore.

        This saves:
        - Storyboard metadata to storyboard/data
        - Voice prompts to storyboard/voicePrompts
        - Each scene to storyboard/data/scenes/scene_{index}
        - Each clip to storyboard/data/scenes/scene_{index}/clips/clip_{index}

        Args:
            project_id: The project ID
            scenes: List of scene objects with clips
            voice_prompts: List of voice prompt objects
            character_id_summary: List of character ID summary objects
            genre: Detected genre string
            job_id: Optional job ID for tracking
        """
        from google.cloud.firestore_v1 import SERVER_TIMESTAMP

        # Save storyboard metadata
        storyboard_data: dict[str, Any] = {
            "generatedAt": SERVER_TIMESTAMP,
            "aspectRatio": "16:9",
        }
        if job_id:
            storyboard_data["jobId"] = job_id
        if character_id_summary is not None:
            storyboard_data["characterIdSummary"] = character_id_summary
        if genre is not None:
            storyboard_data["genre"] = genre

        await self._storyboard_ref(project_id).set(storyboard_data, merge=True)
        logger.debug(f"Saved storyboard metadata for project {project_id}")

        # Save voice prompts
        if voice_prompts:
            await self._voice_prompts_ref(project_id).set({"prompts": voice_prompts})
            logger.debug(f"Saved {len(voice_prompts)} voice prompts for project {project_id}")

        # Save scenes and clips
        for scene_index, scene in enumerate(scenes):
            # Save scene
            scene_data = {
                "sceneIndex": scene_index,
                "sceneTitle": scene.get("sceneTitle", ""),
            }
            await self._scene_ref(project_id, scene_index).set(scene_data)

            # Save clips for this scene
            clips = scene.get("clips", [])
            for clip_index, clip in enumerate(clips):
                clip_data = {
                    "clipIndex": clip_index,
                    "story": clip.get("story", ""),
                    "imagePrompt": clip.get("imagePrompt", ""),
                    "videoPrompt": clip.get("videoPrompt", ""),
                    "soraVideoPrompt": clip.get("soraVideoPrompt", ""),
                    "veoVideoPrompt": clip.get("veoVideoPrompt", ""),
                    "backgroundPrompt": clip.get("backgroundPrompt", ""),
                    "backgroundId": clip.get("backgroundId", ""),
                    "dialogue": clip.get("dialogue", ""),
                    "dialogueEn": clip.get("dialogueEn", ""),
                    "narration": clip.get("narration", ""),
                    "narrationEn": clip.get("narrationEn", ""),
                    "sfx": clip.get("sfx", ""),
                    "sfxEn": clip.get("sfxEn", ""),
                    "bgm": clip.get("bgm", ""),
                    "bgmEn": clip.get("bgmEn", ""),
                    "length": clip.get("length", ""),
                    "accumulatedTime": clip.get("accumulatedTime", ""),
                    "imageRef": "",  # Empty until image is generated
                    "selectedBgId": None,  # User selection
                }
                await self._clip_ref(project_id, scene_index, clip_index).set(clip_data)

            logger.debug(f"Saved scene {scene_index} with {len(clips)} clips for project {project_id}")

        logger.info(f"Saved complete storyboard for project {project_id}: {len(scenes)} scenes")

    async def update_storyboard_job_id(
        self,
        project_id: str,
        job_id: str | None,
    ) -> None:
        """
        Update the job ID in the storyboard metadata.

        Args:
            project_id: The project ID
            job_id: The job ID (or None to clear)
        """
        await self._storyboard_ref(project_id).set({"jobId": job_id}, merge=True)
        logger.debug(f"Updated storyboard jobId for project {project_id}: {job_id}")


class I2VScriptService:
    """Service for saving I2V storyboard results to project Firestore."""

    def __init__(self) -> None:
        self.db = get_db()

    def _data_ref(self, project_id: str) -> DocumentReference:
        """Get document reference for i2vScript/data."""
        return (
            self.db.collection("projects")
            .document(project_id)
            .collection("i2vScript")
            .document("data")
        )

    def _scene_ref(self, project_id: str, scene_index: int) -> DocumentReference:
        """Get document reference for a scene."""
        return (
            self.db.collection("projects")
            .document(project_id)
            .collection("i2vScript")
            .document("data")
            .collection("scenes")
            .document(f"scene_{scene_index}")
        )

    def _clip_ref(self, project_id: str, scene_index: int, clip_index: int) -> DocumentReference:
        """Get document reference for a clip within a scene."""
        return (
            self.db.collection("projects")
            .document(project_id)
            .collection("i2vScript")
            .document("data")
            .collection("scenes")
            .document(f"scene_{scene_index}")
            .collection("clips")
            .document(f"clip_{clip_index}")
        )

    async def save_i2v_storyboard(
        self,
        project_id: str,
        scenes: list[dict],
        voice_prompts: list[dict],
        metadata: dict | None = None,
        job_id: str | None = None,
    ) -> None:
        """
        Save I2V storyboard results to Firestore.

        Writes to projects/{projectId}/i2vScript/ subcollection,
        matching the frontend's expected structure.

        Args:
            project_id: The project ID
            scenes: List of scene objects with clips
            voice_prompts: List of voice prompt objects
            metadata: Optional metadata (targetDuration, conditions, etc.)
            job_id: Optional job ID for tracking
        """
        from google.cloud.firestore_v1 import SERVER_TIMESTAMP

        # Save metadata
        meta_data: dict[str, Any] = {
            "updatedAt": SERVER_TIMESTAMP,
        }
        if metadata:
            meta_data.update(metadata)
        if job_id:
            meta_data["jobId"] = job_id

        await self._data_ref(project_id).set(meta_data, merge=True)
        logger.debug(f"Saved I2V script metadata for project {project_id}")

        # Save voice prompts
        if voice_prompts:
            voice_ref = (
                self.db.collection("projects")
                .document(project_id)
                .collection("i2vScript")
                .document("voicePrompts")
            )
            await voice_ref.set({"prompts": voice_prompts})
            logger.debug(f"Saved {len(voice_prompts)} I2V voice prompts for project {project_id}")

        # Save scenes and clips
        for scene_index, scene in enumerate(scenes):
            scene_data = {
                "sceneIndex": scene_index,
                "sceneTitle": scene.get("sceneTitle", ""),
            }
            await self._scene_ref(project_id, scene_index).set(scene_data)

            clips = scene.get("clips", [])
            for clip_index, clip in enumerate(clips):
                clip_data = {
                    "clipIndex": clip_index,
                    "referenceImageIndex": clip.get("referenceImageIndex", 0),
                    "story": clip.get("story", ""),
                    "imagePrompt": clip.get("imagePrompt", ""),
                    "imagePromptEnd": clip.get("imagePromptEnd", ""),
                    "videoPrompt": clip.get("videoPrompt", ""),
                    "soraVideoPrompt": clip.get("soraVideoPrompt", ""),
                    "backgroundPrompt": clip.get("backgroundPrompt", ""),
                    "backgroundId": clip.get("backgroundId", ""),
                    "dialogue": clip.get("dialogue", ""),
                    "dialogueEn": clip.get("dialogueEn", ""),
                    "sfx": clip.get("sfx", ""),
                    "sfxEn": clip.get("sfxEn", ""),
                    "bgm": clip.get("bgm", ""),
                    "bgmEn": clip.get("bgmEn", ""),
                    "length": clip.get("length", ""),
                    "accumulatedTime": clip.get("accumulatedTime", ""),
                }
                await self._clip_ref(project_id, scene_index, clip_index).set(clip_data)

            logger.debug(f"Saved I2V scene {scene_index} with {len(clips)} clips for project {project_id}")

        logger.info(f"Saved complete I2V storyboard for project {project_id}: {len(scenes)} scenes")


# Lazy service instances
_job_queue_service: JobQueueService | None = None
_video_clip_service: VideoClipService | None = None
_image_frame_service: ImageFrameService | None = None
_bg_angle_service: BackgroundAngleService | None = None
_prop_design_sheet_service: PropDesignSheetService | None = None
_id_converter_service: IdConverterService | None = None
_story_splits_service: StorySplitsService | None = None
_storyboard_service: StoryboardService | None = None
_i2v_script_service: I2VScriptService | None = None


def get_job_queue_service() -> JobQueueService:
    """Get or create JobQueueService instance."""
    global _job_queue_service
    if _job_queue_service is None:
        _job_queue_service = JobQueueService()
    return _job_queue_service


def get_video_clip_service() -> VideoClipService:
    """Get or create VideoClipService instance."""
    global _video_clip_service
    if _video_clip_service is None:
        _video_clip_service = VideoClipService()
    return _video_clip_service


def get_image_frame_service() -> ImageFrameService:
    """Get or create ImageFrameService instance."""
    global _image_frame_service
    if _image_frame_service is None:
        _image_frame_service = ImageFrameService()
    return _image_frame_service


def get_bg_angle_service() -> BackgroundAngleService:
    """Get or create BackgroundAngleService instance."""
    global _bg_angle_service
    if _bg_angle_service is None:
        _bg_angle_service = BackgroundAngleService()
    return _bg_angle_service


def get_prop_design_sheet_service() -> PropDesignSheetService:
    """Get or create PropDesignSheetService instance."""
    global _prop_design_sheet_service
    if _prop_design_sheet_service is None:
        _prop_design_sheet_service = PropDesignSheetService()
    return _prop_design_sheet_service


def get_id_converter_service() -> IdConverterService:
    """Get or create IdConverterService instance."""
    global _id_converter_service
    if _id_converter_service is None:
        _id_converter_service = IdConverterService()
    return _id_converter_service


def get_story_splits_service() -> StorySplitsService:
    """Get or create StorySplitsService instance."""
    global _story_splits_service
    if _story_splits_service is None:
        _story_splits_service = StorySplitsService()
    return _story_splits_service


def get_storyboard_service() -> StoryboardService:
    """Get or create StoryboardService instance."""
    global _storyboard_service
    if _storyboard_service is None:
        _storyboard_service = StoryboardService()
    return _storyboard_service


def get_i2v_script_service() -> I2VScriptService:
    """Get or create I2VScriptService instance."""
    global _i2v_script_service
    if _i2v_script_service is None:
        _i2v_script_service = I2VScriptService()
    return _i2v_script_service


# Backwards compatible aliases (use getter functions for lazy init)
job_queue_service = None  # Use get_job_queue_service() instead
video_clip_service = None  # Use get_video_clip_service() instead
image_frame_service = None  # Use get_image_frame_service() instead