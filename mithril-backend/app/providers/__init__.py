"""Video generation providers."""

from app.providers.base import VideoProvider
from app.providers.registry import get_provider, register_provider, list_provider_ids
from app.providers.sora import sora_provider
from app.providers.veo3 import veo3_provider
from app.providers.xai_video import xai_video_provider
from app.providers.wan_video import wan_i2v_provider, wan22_i2v_provider
from app.providers.modelslab_video import grok_i2v_provider

# Register all providers
register_provider(sora_provider)
register_provider(veo3_provider)
register_provider(xai_video_provider)
register_provider(wan_i2v_provider)
register_provider(wan22_i2v_provider)
register_provider(grok_i2v_provider)

__all__ = [
    "VideoProvider",
    "get_provider",
    "register_provider",
    "list_provider_ids",
    "sora_provider",
    "veo3_provider",
    "xai_video_provider",
    "wan_i2v_provider",
    "wan22_i2v_provider",
    "grok_i2v_provider",
]
