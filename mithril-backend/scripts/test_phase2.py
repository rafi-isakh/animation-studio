#!/usr/bin/env python
"""Test script to verify Phase 2 (Provider Implementation) setup."""

import sys
from pathlib import Path

# Add parent directory to Python path
sys.path.insert(0, str(Path(__file__).parent.parent))


def test_imports():
    """Test that all Phase 2 modules can be imported."""
    print("Testing imports...")

    try:
        from app.models.provider import (
            ProviderConstraints,
            VideoSubmitRequest,
            VideoSubmitResult,
            VideoStatusResult,
        )
        print("  [OK] app.models.provider")
    except ImportError as e:
        print(f"  [FAIL] app.models.provider: {e}")
        return False

    try:
        from app.providers.base import VideoProvider
        print("  [OK] app.providers.base")
    except ImportError as e:
        print(f"  [FAIL] app.providers.base: {e}")
        return False

    try:
        from app.providers.registry import get_provider, list_provider_ids
        print("  [OK] app.providers.registry")
    except ImportError as e:
        print(f"  [FAIL] app.providers.registry: {e}")
        return False

    try:
        from app.providers.sora import sora_provider
        print("  [OK] app.providers.sora")
    except ImportError as e:
        print(f"  [FAIL] app.providers.sora: {e}")
        return False

    try:
        from app.providers.veo3 import veo3_provider
        print("  [OK] app.providers.veo3")
    except ImportError as e:
        print(f"  [FAIL] app.providers.veo3: {e}")
        return False

    try:
        from app.services.s3 import upload_video, get_video_url, generate_video_filename
        print("  [OK] app.services.s3")
    except ImportError as e:
        print(f"  [FAIL] app.services.s3: {e}")
        return False

    try:
        from app.services.image_processor import (
            resize_image,
            prepare_image_for_provider,
        )
        print("  [OK] app.services.image_processor")
    except ImportError as e:
        print(f"  [FAIL] app.services.image_processor: {e}")
        return False

    return True


def test_provider_registry():
    """Test provider registration and lookup."""
    print("\nTesting provider registry...")

    from app.providers import get_provider, list_provider_ids

    # Check registered providers
    provider_ids = list_provider_ids()
    print(f"  Registered providers: {provider_ids}")

    assert "sora" in provider_ids, "Sora provider not registered"
    assert "veo3" in provider_ids, "Veo3 provider not registered"
    print("  [OK] Both providers registered")

    # Test lookup
    sora = get_provider("sora")
    veo3 = get_provider("veo3")

    assert sora is not None, "Sora provider not found"
    assert veo3 is not None, "Veo3 provider not found"
    print("  [OK] Provider lookup works")

    return True


def test_sora_provider():
    """Test Sora provider configuration."""
    print("\nTesting Sora provider...")

    from app.providers.sora import sora_provider

    print(f"  ID: {sora_provider.id}")
    print(f"  Name: {sora_provider.name}")
    print(f"  Model: {sora_provider.model_name}")

    constraints = sora_provider.get_constraints()
    print(f"  Durations: {constraints.durations}")
    print(f"  Sizes: {constraints.sizes}")
    print(f"  Poll interval: {constraints.polling.interval_ms}ms")
    print(f"  Max attempts: {constraints.polling.max_attempts}")

    # Test duration mapping
    assert sora_provider.map_duration(5) == 4, "Duration mapping failed"
    assert sora_provider.map_duration(10) == 8, "Duration mapping failed"
    assert sora_provider.map_duration(12) == 12, "Duration mapping failed"
    print("  [OK] Duration mapping works")

    return True


def test_veo3_provider():
    """Test Veo3 provider configuration."""
    print("\nTesting Veo3 provider...")

    from app.providers.veo3 import veo3_provider

    print(f"  ID: {veo3_provider.id}")
    print(f"  Name: {veo3_provider.name}")
    print(f"  Model: {veo3_provider.model_name}")

    constraints = veo3_provider.get_constraints()
    print(f"  Durations: {constraints.durations}")
    print(f"  Sizes: {constraints.sizes}")
    print(f"  Poll interval: {constraints.polling.interval_ms}ms")
    print(f"  Max attempts: {constraints.polling.max_attempts}")

    # Test duration mapping
    # Veo3 durations: [4, 6, 8]
    # 5 is equidistant from 4 and 6, min() returns first (4)
    assert veo3_provider.map_duration(5) == 4, "Duration mapping failed for 5"
    # 7 is equidistant from 6 and 8, min() returns first (6)
    assert veo3_provider.map_duration(7) == 6, "Duration mapping failed for 7"
    assert veo3_provider.map_duration(6) == 6, "Duration mapping failed for 6"
    assert veo3_provider.map_duration(8) == 8, "Duration mapping failed for 8"
    print("  [OK] Duration mapping works")

    return True


def test_request_validation():
    """Test request validation."""
    print("\nTesting request validation...")

    from app.models.provider import VideoSubmitRequest
    from app.providers.sora import sora_provider

    # Valid request
    valid_request = VideoSubmitRequest(
        prompt="A cat walking in the garden",
        duration=4,
        aspect_ratio="16:9",
    )
    error = sora_provider.validate_request(valid_request)
    assert error is None, f"Valid request rejected: {error}"
    print("  [OK] Valid request accepted")

    # Invalid request (empty prompt)
    invalid_request = VideoSubmitRequest(
        prompt="",
        duration=4,
        aspect_ratio="16:9",
    )
    error = sora_provider.validate_request(invalid_request)
    assert error is not None, "Empty prompt should be rejected"
    print(f"  [OK] Empty prompt rejected: {error}")

    return True


def test_s3_service():
    """Test S3 service functions."""
    print("\nTesting S3 service...")

    from app.services.s3 import get_video_url, generate_video_filename

    # Test URL generation
    url = get_video_url("test_video.mp4")
    print(f"  Video URL: {url}")
    assert "test_video.mp4" in url, "Filename not in URL"
    print("  [OK] URL generation works")

    # Test filename generation
    filename = generate_video_filename("sora", "job123")
    print(f"  Generated filename: {filename}")
    assert filename.startswith("sora_"), "Filename should start with provider"
    assert filename.endswith(".mp4"), "Filename should end with .mp4"
    assert "job123" in filename, "Job ID should be in filename"
    print("  [OK] Filename generation works")

    return True


def test_image_processor():
    """Test image processor functions."""
    print("\nTesting image processor...")

    from app.services.image_processor import SIZES, decode_base64_image, encode_image_to_base64

    # Check size mappings
    print(f"  Size mappings: {SIZES}")
    assert SIZES["16:9"] == (1280, 720), "16:9 size incorrect"
    assert SIZES["9:16"] == (720, 1280), "9:16 size incorrect"
    print("  [OK] Size mappings correct")

    # Test base64 encode/decode
    test_bytes = b"test image data"
    encoded = encode_image_to_base64(test_bytes)
    decoded = decode_base64_image(encoded)
    assert decoded == test_bytes, "Base64 round-trip failed"
    print("  [OK] Base64 encode/decode works")

    return True


def main():
    """Run all Phase 2 tests."""
    print("=" * 50)
    print("Mithril Backend - Phase 2 Verification")
    print("(Provider Implementation)")
    print("=" * 50)

    all_passed = True

    if not test_imports():
        all_passed = False

    if not test_provider_registry():
        all_passed = False

    if not test_sora_provider():
        all_passed = False

    if not test_veo3_provider():
        all_passed = False

    if not test_request_validation():
        all_passed = False

    if not test_s3_service():
        all_passed = False

    if not test_image_processor():
        all_passed = False

    print("\n" + "=" * 50)
    if all_passed:
        print("ALL PHASE 2 TESTS PASSED!")
        print("=" * 50)
        print("\nProviders are ready. Next: Phase 3 (Worker Logic)")
        return 0
    else:
        print("SOME TESTS FAILED")
        print("=" * 50)
        return 1


if __name__ == "__main__":
    sys.exit(main())
