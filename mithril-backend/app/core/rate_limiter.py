"""Distributed rate limiter using Redis for cross-worker/cross-user throttling.

Each provider gets its own named semaphore + cooldown enforced globally via Redis,
so that even with multiple Taskiq workers or concurrent users, the aggregate request
rate to a rate-limited API (e.g. ModelsLab ~0.5 req/s) is respected.
"""

import asyncio
import logging
import time
from contextlib import asynccontextmanager
from typing import AsyncIterator

import redis.asyncio as aioredis

from app.config import get_settings

logger = logging.getLogger(__name__)

# Module-level Redis pool (lazily initialised)
_redis_pool: aioredis.Redis | None = None


def _get_redis() -> aioredis.Redis:
    """Return a shared async Redis connection pool."""
    global _redis_pool
    if _redis_pool is None:
        settings = get_settings()
        _redis_pool = aioredis.from_url(
            settings.redis_url,
            decode_responses=True,
        )
    return _redis_pool


# ---------------------------------------------------------------------------
# Provider-specific configuration
# ---------------------------------------------------------------------------

# max_concurrent: how many API calls may be in-flight globally at once
# cooldown_seconds: minimum gap between consecutive calls (across all workers)
PROVIDER_RATE_CONFIGS: dict[str, dict] = {
    "modelslab": {
        "max_concurrent": 1,
        "cooldown_seconds": 10,
    },
    "grok": {
        "max_concurrent": 2,
        "cooldown_seconds": 0.5,
    },
}

# Key prefixes in Redis
_SEMAPHORE_KEY = "mithril:rate:{provider}:slots"     # sorted set of slot holders
_COOLDOWN_KEY = "mithril:rate:{provider}:last_call"   # string (epoch timestamp)
_LOCK_TTL = 300  # 5 min — auto-release if a worker crashes mid-call


def _sem_key(provider: str) -> str:
    return _SEMAPHORE_KEY.replace("{provider}", provider)


def _cd_key(provider: str) -> str:
    return _COOLDOWN_KEY.replace("{provider}", provider)


@asynccontextmanager
async def distributed_rate_limit(provider: str) -> AsyncIterator[None]:
    """Acquire a global rate-limit slot for *provider*, then yield.

    Usage::

        async with distributed_rate_limit("modelslab"):
            result = await call_modelslab_api(...)

    Behaviour:
    1. Wait until a concurrency slot is free (Redis sorted-set semaphore).
    2. Wait until the cooldown period since the last call has elapsed.
    3. Yield control — the caller makes the API request.
    4. On exit, record the timestamp and release the slot.
    """
    cfg = PROVIDER_RATE_CONFIGS.get(provider)
    if cfg is None:
        # No rate config → pass through immediately
        yield
        return

    r = _get_redis()
    sem_key = _sem_key(provider)
    cd_key = _cd_key(provider)

    max_concurrent: int = cfg["max_concurrent"]
    cooldown: float = cfg["cooldown_seconds"]

    slot_id = f"{time.monotonic_ns()}"  # unique per call
    acquired = False

    try:
        # --- Step 1: acquire concurrency slot ---
        while True:
            now = time.time()

            # Evict stale slots (crashed workers)
            await r.zremrangebyscore(sem_key, "-inf", now - _LOCK_TTL)

            # Try to add ourselves if under the limit
            current_count = await r.zcard(sem_key)
            if current_count < max_concurrent:
                await r.zadd(sem_key, {slot_id: now})
                acquired = True
                break

            # Wait and retry
            logger.debug(f"[RATE-LIMIT] {provider}: all {max_concurrent} slot(s) busy, waiting...")
            await asyncio.sleep(1.0)

        # --- Step 2: respect cooldown ---
        while True:
            last_call_raw = await r.get(cd_key)
            if last_call_raw is not None:
                elapsed = time.time() - float(last_call_raw)
                remaining = cooldown - elapsed
                if remaining > 0:
                    logger.debug(f"[RATE-LIMIT] {provider}: cooldown {remaining:.1f}s remaining")
                    await asyncio.sleep(remaining)
                    continue
            break

        # --- Step 3: let the caller make the request ---
        yield

    finally:
        # --- Step 4: record timestamp + release slot ---
        await r.set(cd_key, str(time.time()), ex=60)
        if acquired:
            await r.zrem(sem_key, slot_id)
