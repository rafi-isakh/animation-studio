"""Task handlers."""

from app.workers.handlers.video_generation import process_video_generation

__all__ = ["process_video_generation"]