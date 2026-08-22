"""Unit tests for Cloudflare Turnstile verification."""

import httpx
import pytest

from app.core.config import Settings
from app.services.turnstile_service import TurnstileService


@pytest.mark.asyncio
async def test_turnstile_disabled_allows_request() -> None:
    settings = Settings(
        turnstile_enabled=False,
        turnstile_secret_key="",
    )
    service = TurnstileService(settings)

    result = await service.verify(token="")

    assert result.success is True


@pytest.mark.asyncio
async def test_turnstile_enabled_requires_secret_key() -> None:
    settings = Settings(
        turnstile_enabled=True,
        turnstile_secret_key="",
    )
    service = TurnstileService(settings)

    result = await service.verify(token="some-token")

    assert result.success is False
    assert "missing-secret-key" in result.error_codes


@pytest.mark.asyncio
async def test_turnstile_rejects_empty_token() -> None:
    settings = Settings(
        turnstile_enabled=True,
        turnstile_secret_key="test-secret",
    )
    service = TurnstileService(settings)

    result = await service.verify(token="")

    assert result.success is False
    assert "invalid-token" in result.error_codes


@pytest.mark.asyncio
async def test_turnstile_accepts_successful_cloudflare_response(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    settings = Settings(
        turnstile_enabled=True,
        turnstile_secret_key="test-secret",
    )
    service = TurnstileService(settings)

    class FakeResponse:
        def raise_for_status(self) -> None:
            return None

        def json(self):
            return {
                "success": True,
                "hostname": "localhost",
                "action": "register",
                "error-codes": [],
            }

    class FakeAsyncClient:
        def __init__(self, *args, **kwargs) -> None:
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return None

        async def post(self, *args, **kwargs):
            return FakeResponse()

    monkeypatch.setattr(httpx, "AsyncClient", FakeAsyncClient)

    result = await service.verify(
        token="valid-token",
        remote_ip="127.0.0.1",
    )

    assert result.success is True
    assert result.hostname == "localhost"
    assert result.action == "register"
    assert result.error_codes == ()


@pytest.mark.asyncio
async def test_turnstile_fails_closed_when_cloudflare_is_unavailable(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    settings = Settings(
        turnstile_enabled=True,
        turnstile_secret_key="test-secret",
    )
    service = TurnstileService(settings)

    class FailingAsyncClient:
        def __init__(self, *args, **kwargs) -> None:
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return None

        async def post(self, *args, **kwargs):
            raise httpx.ConnectError("Cloudflare unavailable")

    monkeypatch.setattr(httpx, "AsyncClient", FailingAsyncClient)

    result = await service.verify(token="valid-token")

    assert result.success is False
    assert "verification-unavailable" in result.error_codes
