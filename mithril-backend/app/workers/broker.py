"""Taskiq broker configuration with Redis."""

from taskiq_redis import RedisAsyncResultBackend, ListQueueBroker

from app.config import get_settings

settings = get_settings()

# Redis broker for task queue
broker = ListQueueBroker(
    url=settings.redis_url,
    queue_name="mithril_jobs",
).with_result_backend(
    RedisAsyncResultBackend(
        redis_url=settings.redis_url,
        result_ex_time=3600,  # Results expire after 1 hour
    )
)