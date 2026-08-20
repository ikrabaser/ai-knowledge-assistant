"""Abuse protection for public authentication endpoints."""

from dataclasses import dataclass
from hashlib import sha256
from typing import Literal

from redis.asyncio import Redis
from redis.exceptions import RedisError

from app.core.config import Settings
from app.core.logging import get_logger


logger = get_logger(__name__)

AuthAction = Literal["login", "register"]


@dataclass(frozen=True)
class RateLimitResult:
    allowed: bool
    retry_after: int = 0


class AuthProtectionService:
    """Rate limiting and bot-trap checks kept separate from authentication logic."""

    def __init__(self, redis_client: Redis, settings: Settings) -> None:
        self._redis = redis_client
        self._settings = settings

    @staticmethod
    def is_honeypot_triggered(value: str | None) -> bool:
        return bool(value and value.strip())

    async def check_rate_limit(
        self,
        action: AuthAction,
        identifier: str,
    ) -> RateLimitResult:
        if not self._settings.auth_rate_limit_enabled:
            return RateLimitResult(allowed=True)

        limit, window_seconds = self._configuration_for(action)
        key = self._rate_limit_key(action, identifier)

        try:
            pipeline = self._redis.pipeline(transaction=True)
            pipeline.incr(key)
            pipeline.ttl(key)

            current, ttl = await pipeline.execute()

            if current == 1 or ttl == -1:
                await self._redis.expire(key, window_seconds)
                ttl = window_seconds

            if current > limit:
                return RateLimitResult(
                    allowed=False,
                    retry_after=max(int(ttl), 1),
                )

            return RateLimitResult(allowed=True)

        except RedisError:
            logger.warning(
                "Auth rate limiter unavailable; allowing request",
                extra={"auth_action": action},
            )
            return RateLimitResult(allowed=True)

    async def reset_rate_limit(
        self,
        action: AuthAction,
        identifier: str,
    ) -> None:
        if not self._settings.auth_rate_limit_enabled:
            return

        try:
            await self._redis.delete(
                self._rate_limit_key(action, identifier)
            )
        except RedisError:
            logger.warning(
                "Could not reset auth rate limiter",
                extra={"auth_action": action},
            )

    def _configuration_for(
        self,
        action: AuthAction,
    ) -> tuple[int, int]:
        if action == "register":
            return (
                self._settings.auth_register_rate_limit,
                self._settings.auth_register_rate_window_seconds,
            )

        return (
            self._settings.auth_login_rate_limit,
            self._settings.auth_login_rate_window_seconds,
        )

    @staticmethod
    def _rate_limit_key(
        action: AuthAction,
        identifier: str,
    ) -> str:
        digest = sha256(identifier.encode("utf-8")).hexdigest()[:32]
        return f"masteacon:auth:{action}:{digest}"
