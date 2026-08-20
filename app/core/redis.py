"""Shared Redis client used by lightweight application infrastructure."""

from functools import lru_cache

from redis.asyncio import Redis

from app.core.config import get_settings


@lru_cache
def get_redis_client() -> Redis:
    settings = get_settings()

    return Redis.from_url(
        settings.redis_url,
        encoding="utf-8",
        decode_responses=True,
    )
