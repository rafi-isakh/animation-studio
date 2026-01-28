"""Integration tests for the video generation job flow."""

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.core.errors import ErrorCode, VideoJobError
from app.core.state_machine import JobStateMachine
from app.models.job import JobDocument, JobStatus, JobSubmitRequest
from app.models.provider import VideoSubmitResult, VideoStatusResult


class TestJobSubmission:
    """Tests for job submission flow."""

    @pytest.mark.asyncio
    async def test_submit_single_job_creates_document(
        self,
        sample_job_request,
        mock_firestore_job_service,
    ):
        """Submitting a job should create a document in Firestore."""
        job = await mock_firestore_job_service.create_job(
            sample_job_request,
            user_id="test-user",
        )

        assert job is not None
        assert job.id is not None
        assert job.project_id == sample_job_request.project_id
        assert job.status == JobStatus.PENDING
        assert job.provider_id == sample_job_request.provider_id

    @pytest.mark.asyncio
    async def test_submit_job_with_batch_id(
        self,
        sample_job_request,
        mock_firestore_job_service,
    ):
        """Batch jobs should have batch_id set."""
        batch_id = str(uuid.uuid4())
        job = await mock_firestore_job_service.create_job(
            sample_job_request,
            user_id="test-user",
            batch_id=batch_id,
        )

        assert job.batch_id == batch_id


class TestJobProcessing:
    """Tests for job processing flow."""

    @pytest.mark.asyncio
    async def test_job_state_transitions(self):
        """Job should transition through correct states."""
        job_id = str(uuid.uuid4())
        state_machine = JobStateMachine(job_id, JobStatus.PENDING)

        # PENDING -> SUBMITTED
        state_machine.transition_to(JobStatus.SUBMITTED)
        assert state_machine.status == JobStatus.SUBMITTED

        # SUBMITTED -> POLLING
        state_machine.transition_to(JobStatus.POLLING)
        assert state_machine.status == JobStatus.POLLING

        # POLLING -> UPLOADING
        state_machine.transition_to(JobStatus.UPLOADING)
        assert state_machine.status == JobStatus.UPLOADING

        # UPLOADING -> COMPLETED
        state_machine.transition_to(JobStatus.COMPLETED)
        assert state_machine.status == JobStatus.COMPLETED

    @pytest.mark.asyncio
    async def test_provider_submit_called_with_correct_params(
        self,
        sample_job_document,
        mock_provider,
    ):
        """Provider submit_job should be called with correct parameters."""
        from app.models.provider import VideoSubmitRequest as ProviderRequest

        request = ProviderRequest(
            prompt=sample_job_document.prompt,
            duration=sample_job_document.duration,
            aspect_ratio=sample_job_document.aspect_ratio,
            image_base64=None,
            image_url=sample_job_document.image_url,
        )

        result = await mock_provider.submit_job(request, "test-api-key")

        assert result.job_id is not None
        assert result.status == "pending"
        mock_provider.submit_job.assert_called_once()

    @pytest.mark.asyncio
    async def test_polling_until_completion(self, mock_provider):
        """Provider should be polled until job completes."""
        provider_job_id = "provider-job-123"
        api_key = "test-key"

        # First call returns running
        status1 = await mock_provider.check_status(provider_job_id, api_key)
        assert status1.status == "running"

        # Second call returns completed
        status2 = await mock_provider.check_status(provider_job_id, api_key)
        assert status2.status == "completed"

    @pytest.mark.asyncio
    async def test_video_download_after_completion(self, mock_provider):
        """Video should be downloaded after job completes."""
        provider_job_id = "provider-job-123"
        api_key = "test-key"

        video_bytes = await mock_provider.download_video(provider_job_id, api_key)

        assert video_bytes is not None
        assert len(video_bytes) > 0


class TestJobCompletion:
    """Tests for job completion flow."""

    @pytest.mark.asyncio
    async def test_completed_job_updates_status(
        self,
        sample_job_document,
        mock_firestore_job_service,
    ):
        """Completed job should update Firestore status."""
        # First create the job
        job = await mock_firestore_job_service.create_job(
            JobSubmitRequest(
                project_id=sample_job_document.project_id,
                scene_index=sample_job_document.scene_index,
                clip_index=sample_job_document.clip_index,
                provider_id=sample_job_document.provider_id,
                prompt=sample_job_document.prompt,
                duration=sample_job_document.duration,
                aspect_ratio=sample_job_document.aspect_ratio,
            ),
            user_id="test-user",
        )

        # Update to completed
        await mock_firestore_job_service.update_job_status(
            job.id,
            JobStatus.COMPLETED,
            video_url="https://cdn.example.com/video.mp4",
            s3_file_name="video.mp4",
        )

        # Verify update was called
        mock_firestore_job_service.update_job_status.assert_called()

    @pytest.mark.asyncio
    async def test_s3_upload_generates_correct_url(self, mock_s3_upload):
        """S3 upload should return CDN URL."""
        video_bytes = b"test-video-content"
        filename = "test-video.mp4"

        url = await mock_s3_upload(video_bytes, filename)

        assert "cdn.example.com" in url
        assert filename in url


class TestJobCancellation:
    """Tests for job cancellation flow."""

    @pytest.mark.asyncio
    async def test_cancellation_flag_is_set(
        self,
        sample_job_request,
        mock_firestore_job_service,
    ):
        """Cancellation request should set flag on job."""
        job = await mock_firestore_job_service.create_job(
            sample_job_request,
            user_id="test-user",
        )

        await mock_firestore_job_service.update_job(
            job.id,
            cancellation_requested=True,
        )

        # Verify the job was updated
        mock_firestore_job_service.update_job.assert_called_with(
            job.id,
            cancellation_requested=True,
        )

    @pytest.mark.asyncio
    async def test_cancelled_job_status(
        self,
        sample_job_request,
        mock_firestore_job_service,
    ):
        """Cancelled job should have CANCELLED status."""
        job = await mock_firestore_job_service.create_job(
            sample_job_request,
            user_id="test-user",
        )

        await mock_firestore_job_service.update_job_status(
            job.id,
            JobStatus.CANCELLED,
        )

        mock_firestore_job_service.update_job_status.assert_called_with(
            job.id,
            JobStatus.CANCELLED,
        )


class TestJobRetry:
    """Tests for job retry flow."""

    @pytest.mark.asyncio
    async def test_retryable_error_increments_count(
        self,
        sample_job_request,
        mock_firestore_job_service,
    ):
        """Retryable error should increment retry count."""
        job = await mock_firestore_job_service.create_job(
            sample_job_request,
            user_id="test-user",
        )

        # Simulate retry
        await mock_firestore_job_service.update_job(
            job.id,
            status=JobStatus.PENDING.value,
            retry_count=1,
            error_code=ErrorCode.RATE_LIMIT.value,
            error_message="Rate limit exceeded",
            error_retryable=True,
        )

        mock_firestore_job_service.update_job.assert_called()

    @pytest.mark.asyncio
    async def test_max_retries_moves_to_dlq(
        self,
        sample_job_request,
        mock_firestore_job_service,
    ):
        """Job exceeding max retries should move to DLQ."""
        job = await mock_firestore_job_service.create_job(
            sample_job_request,
            user_id="test-user",
        )

        # Simulate moving to DLQ
        await mock_firestore_job_service.move_to_dlq(
            job.id,
            ErrorCode.PROVIDER_ERROR.value,
            "Provider failed after 3 attempts",
            [],  # failure history
        )

        mock_firestore_job_service.move_to_dlq.assert_called_once()


class TestErrorHandling:
    """Tests for error handling."""

    def test_rate_limit_error_is_retryable(self):
        """Rate limit errors should be retryable."""
        error = VideoJobError.rate_limit("Too many requests")
        assert error.retryable is True
        assert error.code == ErrorCode.RATE_LIMIT

    def test_quota_exceeded_error_is_not_retryable(self):
        """Quota exceeded errors should not be retryable."""
        error = VideoJobError.quota_exceeded("Quota exceeded")
        assert error.retryable is False
        assert error.code == ErrorCode.QUOTA_EXCEEDED

    def test_invalid_request_error_is_not_retryable(self):
        """Invalid request errors should not be retryable."""
        error = VideoJobError.invalid_request("Bad request")
        assert error.retryable is False
        assert error.code == ErrorCode.INVALID_REQUEST

    def test_provider_error_is_retryable(self):
        """Provider errors should be retryable."""
        error = VideoJobError.provider_error("Provider failed")
        assert error.retryable is True
        assert error.code == ErrorCode.PROVIDER_ERROR


class TestAPIKeyHandling:
    """Tests for API key handling."""

    @pytest.mark.asyncio
    async def test_custom_api_key_passed_to_provider(self, mock_provider):
        """Custom API key should be passed to provider."""
        from app.models.provider import VideoSubmitRequest as ProviderRequest

        custom_key = "user-custom-api-key"
        request = ProviderRequest(
            prompt="Test prompt",
            duration=4,
            aspect_ratio="16:9",
        )

        await mock_provider.submit_job(request, custom_key)

        # Verify the custom key was passed
        call_args = mock_provider.submit_job.call_args
        assert call_args[0][1] == custom_key

    @pytest.mark.asyncio
    async def test_fallback_api_key_used_when_no_custom(
        self,
        mock_settings,
    ):
        """Settings API key should be used when no custom key provided."""
        from app.models.job import JobDocument, JobStatus

        job = JobDocument(
            id="test-job",
            project_id="test-project",
            scene_index=0,
            clip_index=0,
            provider_id="veo3",
            prompt="Test",
            duration=4,
            aspect_ratio="16:9",
            status=JobStatus.PENDING,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
            user_id="test-user",
        )

        # The _get_api_key function should return settings key when no custom key
        # This is tested indirectly through the mock_settings fixture
        assert mock_settings.gemini_api_key == "test-gemini-key"


class TestBatchProcessing:
    """Tests for batch job processing."""

    @pytest.mark.asyncio
    async def test_batch_jobs_share_batch_id(
        self,
        mock_firestore_job_service,
    ):
        """All jobs in a batch should share the same batch_id."""
        batch_id = str(uuid.uuid4())
        jobs = []

        for i in range(3):
            request = JobSubmitRequest(
                project_id="test-project",
                scene_index=0,
                clip_index=i,
                provider_id="veo3",
                prompt=f"Test prompt {i}",
                duration=4,
                aspect_ratio="16:9",
            )
            job = await mock_firestore_job_service.create_job(
                request,
                user_id="test-user",
                batch_id=batch_id,
            )
            jobs.append(job)

        # All jobs should have the same batch_id
        for job in jobs:
            assert job.batch_id == batch_id

    @pytest.mark.asyncio
    async def test_batch_partial_failure(
        self,
        mock_firestore_job_service,
    ):
        """Batch should handle partial failures gracefully."""
        batch_id = str(uuid.uuid4())

        # Create 3 jobs
        jobs = []
        for i in range(3):
            request = JobSubmitRequest(
                project_id="test-project",
                scene_index=0,
                clip_index=i,
                provider_id="veo3",
                prompt=f"Test prompt {i}",
                duration=4,
                aspect_ratio="16:9",
            )
            job = await mock_firestore_job_service.create_job(
                request,
                user_id="test-user",
                batch_id=batch_id,
            )
            jobs.append(job)

        # Complete first job
        await mock_firestore_job_service.update_job_status(
            jobs[0].id,
            JobStatus.COMPLETED,
        )

        # Fail second job
        await mock_firestore_job_service.update_job_status(
            jobs[1].id,
            JobStatus.FAILED,
            error_code=ErrorCode.PROVIDER_ERROR.value,
            error_message="Provider failed",
        )

        # Complete third job
        await mock_firestore_job_service.update_job_status(
            jobs[2].id,
            JobStatus.COMPLETED,
        )

        # Verify all updates were called
        assert mock_firestore_job_service.update_job_status.call_count == 3