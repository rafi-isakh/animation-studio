"""Provider registry for looking up video providers."""

from app.providers.base import VideoProvider

# Registry of all available providers
_providers: dict[str, VideoProvider] = {}


def register_provider(provider: VideoProvider) -> None:
    """Register a provider in the registry."""
    _providers[provider.id] = provider


def get_provider(provider_id: str) -> VideoProvider | None:
    """
    Get a provider by ID.

    Args:
        provider_id: Provider ID (e.g., 'sora', 'veo3')

    Returns:
        VideoProvider instance or None if not found
    """
    return _providers.get(provider_id)


def get_all_providers() -> dict[str, VideoProvider]:
    """Get all registered providers."""
    return _providers.copy()


def list_provider_ids() -> list[str]:
    """Get list of all registered provider IDs."""
    return list(_providers.keys())