"""Shared test fixtures for integration tests."""

import asyncio
import uuid
from datetime import datetime, timezone
from typing import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest


@pytest.fixture(scope="session")
def event_loop():
    """Create an event loop for the test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()

from app.models.job import JobDocument, JobStatus, JobSubmitRequest
from app.models.provider import VideoSubmitResult, VideoStatusResult


@pytest.fixture
def sample_job_request() -> JobSubmitRequest:
    """Create a sample job submission request."""
    return JobSubmitRequest(
        project_id=f"test-project-{uuid.uuid4().hex[:8]}",
        scene_index=0,
        clip_index=0,
        provider_id="veo3",
        prompt="A cat walking on the beach at sunset",
        image_url=None,
        duration=4,
        aspect_ratio="16:9",
        api_key="test-api-key-123",
    )


@pytest.fixture
def sample_job_document(sample_job_request: JobSubmitRequest) -> JobDocument:
    """Create a sample job document."""
    now = datetime.now(timezone.utc)
    return JobDocument(
        id=str(uuid.uuid4()),
        project_id=sample_job_request.project_id,
        scene_index=sample_job_request.scene_index,
        clip_index=sample_job_request.clip_index,
        provider_id=sample_job_request.provider_id,
        prompt=sample_job_request.prompt,
        image_url=sample_job_request.image_url,
        duration=sample_job_request.duration,
        aspect_ratio=sample_job_request.aspect_ratio,
        status=JobStatus.PENDING,
        created_at=now,
        updated_at=now,
        user_id="test-user-123",
    )


@pytest.fixture
def mock_provider():
    """Create a mock video provider."""
    provider = MagicMock()
    provider.id = "veo3"
    provider.name = "Veo 3"

    # Mock submit_job
    async def mock_submit(request, api_key):
        return VideoSubmitResult(
            job_id=f"provider-job-{uuid.uuid4().hex[:8]}",
            status="pending",
        )

    provider.submit_job = AsyncMock(side_effect=mock_submit)

    # Mock check_status - returns completed after first call
    call_count = {"value": 0}

    async def mock_check_status(job_id, api_key):
        call_count["value"] += 1
        if call_count["value"] >= 2:
            return VideoStatusResult(
                job_id=job_id,
                status="completed",
            )
        return VideoStatusResult(
            job_id=job_id,
            status="running",
        )

    provider.check_status = AsyncMock(side_effect=mock_check_status)

    # Mock download_video
    async def mock_download(job_id, api_key):
        # Return fake video bytes
        return b"fake-video-content-" + job_id.encode()

    provider.download_video = AsyncMock(side_effect=mock_download)

    # Mock constraints
    provider.get_constraints.return_value = MagicMock(
        durations=[4, 6, 8],
        polling=MagicMock(interval_ms=100, max_attempts=10),
    )

    return provider


@pytest.fixture
def mock_firestore_job_service():
    """Create a mock Firestore job queue service."""
    service = MagicMock()
    jobs_store = {}

    async def create_job(request, user_id, batch_id=None):
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
            duration=request.duration,
            aspect_ratio=request.aspect_ratio,
            status=JobStatus.PENDING,
            created_at=now,
            updated_at=now,
            user_id=user_id,
            batch_id=batch_id,
        )
        jobs_store[job_id] = job
        return job

    async def get_job(job_id):
        return jobs_store.get(job_id)

    async def update_job(job_id, **kwargs):
        if job_id in jobs_store:
            job = jobs_store[job_id]
            for key, value in kwargs.items():
                if hasattr(job, key):
                    setattr(job, key, value)
            job.updated_at = datetime.now(timezone.utc)

    async def update_job_status(job_id, status, **kwargs):
        if job_id in jobs_store:
            job = jobs_store[job_id]
            job.status = status
            for key, value in kwargs.items():
                if hasattr(job, key):
                    setattr(job, key, value)
            job.updated_at = datetime.now(timezone.utc)

    service.create_job = AsyncMock(side_effect=create_job)
    service.get_job = AsyncMock(side_effect=get_job)
    service.update_job = AsyncMock(side_effect=update_job)
    service.update_job_status = AsyncMock(side_effect=update_job_status)
    service.move_to_dlq = AsyncMock()
    service._jobs_store = jobs_store  # Expose for test assertions

    return service


@pytest.fixture
def mock_video_clip_service():
    """Create a mock video clip service."""
    service = MagicMock()
    service.update_clip_status = AsyncMock()
    service.update_clip_video = AsyncMock()
    return service


@pytest.fixture
def mock_s3_upload():
    """Mock S3 upload function."""

    async def mock_upload(video_bytes, filename, content_type="video/mp4"):
        return f"https://cdn.example.com/videos/{filename}"

    return AsyncMock(side_effect=mock_upload)


@pytest.fixture
def mock_settings():
    """Create mock settings."""
    settings = MagicMock()
    settings.sora_api_key = "test-sora-key"
    settings.gemini_api_key = "test-gemini-key"
    settings.videos_bucket = "test-bucket"
    settings.cloudfront_domain = "cdn.example.com"
    return settings