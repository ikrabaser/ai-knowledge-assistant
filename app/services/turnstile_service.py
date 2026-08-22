"""Cloudflare Turnstile server-side verification service."""

from dataclasses import dataclass

import httpx

from app.core.config import Settings


TURNSTILE_SITEVERIFY_URL = (
    "https://challenges.cloudflare.com/turnstile/v0/siteverify"
)


@dataclass(frozen=True)
class TurnstileVerificationResult:
    """Normalized result returned by Turnstile verification."""

    success: bool
    hostname: str | None = None
    action: str | None = None
    error_codes: tuple[str, ...] = ()


class TurnstileService:
    """Verify Cloudflare Turnstile tokens with the Siteverify API."""

    def __init__(self, settings: Settings) -> None:
        self._secret_key = settings.turnstile_secret_key
        self._enabled = settings.turnstile_enabled

    async def verify(
        self,
        *,
        token: str,
        remote_ip: str | None = None,
    ) -> TurnstileVerificationResult:
        """Verify a Turnstile token.

        Turnstile may be disabled in local/test environments. When enabled,
        verification fails closed if the token is missing, malformed, or if
        Cloudflare cannot validate it.
        """

        if not self._enabled:
            return TurnstileVerificationResult(success=True)

        if not self._secret_key:
            return TurnstileVerificationResult(
                success=False,
                error_codes=("missing-secret-key",),
            )

        token = token.strip()

        if not token or len(token) > 2048:
            return TurnstileVerificationResult(
                success=False,
                error_codes=("invalid-token",),
            )

        payload: dict[str, str] = {
            "secret": self._secret_key,
            "response": token,
        }

        if remote_ip:
            payload["remoteip"] = remote_ip

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    TURNSTILE_SITEVERIFY_URL,
                    data=payload,
                )
                response.raise_for_status()
                data = response.json()
        except (httpx.HTTPError, ValueError):
            return TurnstileVerificationResult(
                success=False,
                error_codes=("verification-unavailable",),
            )

        error_codes = data.get("error-codes", [])

        return TurnstileVerificationResult(
            success=bool(data.get("success")),
            hostname=data.get("hostname"),
            action=data.get("action"),
            error_codes=tuple(error_codes)
            if isinstance(error_codes, list)
            else (),
        )
