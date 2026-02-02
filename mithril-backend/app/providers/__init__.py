"""Video generation providers."""

from app.providers.base import VideoProvider
from app.providers.registry import get_provider, register_provider, list_provider_ids
from app.providers.sora import sora_provider
from app.providers.veo3 import veo3_provider

# Register all providers
register_provider(sora_provider)
register_provider(veo3_provider)

__all__ = [
    "VideoProvider",
    "get_provider",
    "register_provider",
    "list_provider_ids",
    "sora_provider",
    "veo3_provider",
]