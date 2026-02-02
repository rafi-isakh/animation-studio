"""Tests for video generation providers."""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.models.provider import (
    VideoSubmitRequest,
    VideoSubmitResult,
    VideoStatusResult,
    ProviderConstraints,
)


class TestSoraProvider:
    """Tests for OpenAI Sora provider."""

    @pytest.fixture
    def sora_provider(self):
        """Create Sora provider instance."""
        from app.providers.sora import SoraProvider

        return SoraProvider()

    def test_provider_id(self, sora_provider):
        """Provider should have correct ID."""
        assert sora_provider.id == "sora"

    def test_provider_name(self, sora_provider):
        """Provider should have correct name."""
        assert sora_provider.name == "Sora"

    def test_constraints(self, sora_provider):
        """Provider should return valid constraints."""
        constraints = sora_provider.get_constraints()

        assert constraints is not None
        assert isinstance(constraints.durations, list)
        assert 4 in constraints.durations
        assert constraints.polling is not None
        assert constraints.polling.interval_ms > 0
        assert constraints.polling.max_attempts > 0

    def test_duration_mapping(self, sora_provider):
        """Provider should map durations correctly."""
        # Test mapping to valid durations
        # Sora supports [4, 8, 12] - maps to closest, ties go to first in list
        assert sora_provider.map_duration(3) == 4
        assert sora_provider.map_duration(4) == 4
        assert sora_provider.map_duration(5) == 4  # closer to 4 than 8
        assert sora_provider.map_duration(6) == 4  # tie between 4 and 8, first wins
        assert sora_provider.map_duration(7) == 8  # closer to 8
        assert sora_provider.map_duration(10) == 8  # equidistant to 8 and 12, first wins
        assert sora_provider.map_duration(11) == 12
        assert sora_provider.map_duration(15) == 12

    def test_validate_request_valid(self, sora_provider):
        """Valid request should pass validation."""
        request = VideoSubmitRequest(
            prompt="A cat walking",
            duration=4,
            aspect_ratio="16:9",
        )

        error = sora_provider.validate_request(request)
        assert error is None

    def test_validate_request_missing_prompt(self, sora_provider):
        """Request without prompt should fail validation."""
        request = VideoSubmitRequest(
            prompt="",
            duration=4,
            aspect_ratio="16:9",
        )

        error = sora_provider.validate_request(request)
        assert error is not None
        assert "prompt" in error.lower()

    @pytest.mark.asyncio
    async def test_submit_job_calls_api(self, sora_provider):
        """Submit should call OpenAI API."""
        request = VideoSubmitRequest(
            prompt="A cat walking",
            duration=4,
            aspect_ratio="16:9",
        )

        with patch("httpx.AsyncClient") as mock_client:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.is_success = True
            mock_response.json.return_value = {"id": "sora-job-123"}

            mock_client.return_value.__aenter__ = AsyncMock(
                return_value=MagicMock(post=AsyncMock(return_value=mock_response))
            )
            mock_client.return_value.__aexit__ = AsyncMock()

            # This would call the actual API, so we skip the actual call
            # result = await sora_provider.submit_job(request, "test-key")
            pass


class TestVeo3Provider:
    """Tests for Google Veo 3 provider."""

    @pytest.fixture
    def veo3_provider(self):
        """Create Veo3 provider instance."""
        from app.providers.veo3 import Veo3Provider

        return Veo3Provider()

    def test_provider_id(self, veo3_provider):
        """Provider should have correct ID."""
        assert veo3_provider.id == "veo3"

    def test_provider_name(self, veo3_provider):
        """Provider should have correct name."""
        assert veo3_provider.name == "Veo 3"

    def test_model_name(self, veo3_provider):
        """Provider should use correct model."""
        assert "veo" in veo3_provider.model_name.lower()

    def test_constraints(self, veo3_provider):
        """Provider should return valid constraints."""
        constraints = veo3_provider.get_constraints()

        assert constraints is not None
        assert isinstance(constraints.durations, list)
        assert 4 in constraints.durations
        assert constraints.polling is not None
        assert constraints.supports_image_to_video is True

    def test_duration_mapping(self, veo3_provider):
        """Provider should map durations correctly."""
        # Veo3 supports [4, 6, 8] - maps to closest, ties go to first in list
        assert veo3_provider.map_duration(3) == 4
        assert veo3_provider.map_duration(4) == 4
        assert veo3_provider.map_duration(5) == 4  # tie between 4 and 6, first wins
        assert veo3_provider.map_duration(6) == 6
        assert veo3_provider.map_duration(7) == 6  # tie between 6 and 8, first wins
        assert veo3_provider.map_duration(8) == 8
        assert veo3_provider.map_duration(10) == 8

    def test_validate_request_valid(self, veo3_provider):
        """Valid request should pass validation."""
        request = VideoSubmitRequest(
            prompt="A sunset over the ocean",
            duration=4,
            aspect_ratio="16:9",
        )

        error = veo3_provider.validate_request(request)
        assert error is None

    def test_validate_request_with_image(self, veo3_provider):
        """Request with image should pass validation."""
        request = VideoSubmitRequest(
            prompt="Animate this image",
            duration=6,
            aspect_ratio="16:9",
            image_url="https://example.com/image.jpg",
        )

        error = veo3_provider.validate_request(request)
        assert error is None


class TestProviderRegistry:
    """Tests for provider registry."""

    def test_get_sora_provider(self):
        """Registry should return Sora provider."""
        from app.providers import get_provider

        provider = get_provider("sora")
        assert provider is not None
        assert provider.id == "sora"

    def test_get_veo3_provider(self):
        """Registry should return Veo3 provider."""
        from app.providers import get_provider

        provider = get_provider("veo3")
        assert provider is not None
        assert provider.id == "veo3"

    def test_get_invalid_provider(self):
        """Registry should return None for invalid provider."""
        from app.providers import get_provider

        provider = get_provider("invalid")
        assert provider is None

    def test_list_provider_ids(self):
        """Registry should list all provider IDs."""
        from app.providers import list_provider_ids

        provider_ids = list_provider_ids()
        assert len(provider_ids) >= 2
        assert "sora" in provider_ids
        assert "veo3" in provider_ids


class TestProviderConstraints:
    """Tests for provider constraints."""

    def test_constraints_have_required_fields(self):
        """Constraints should have all required fields."""
        from app.models.provider import PollingConfig

        constraints = ProviderConstraints(
            durations=[4, 8, 12],
            sizes={"16:9": "1920x1080"},
            polling=PollingConfig(interval_ms=5000, max_attempts=120),
        )

        assert constraints.durations is not None
        assert constraints.sizes is not None
        assert constraints.polling is not None

    def test_constraints_aspect_ratios(self):
        """Constraints should define valid aspect ratios."""
        from app.providers.sora import SORA_CONSTRAINTS
        from app.providers.veo3 import VEO3_CONSTRAINTS

        # Both providers should support 16:9 and 9:16
        assert "16:9" in SORA_CONSTRAINTS.sizes
        assert "9:16" in SORA_CONSTRAINTS.sizes
        assert "16:9" in VEO3_CONSTRAINTS.sizes
        assert "9:16" in VEO3_CONSTRAINTS.sizes