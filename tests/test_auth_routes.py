"""Route-level tests for the authentication endpoints.

Dependencies that would normally hit the real database are overridden with an
in-memory fake user repository, shared across requests within a test via
FastAPI's dependency_overrides — no real PostgreSQL connection is needed.
"""
import pytest
from fastapi.testclient import TestClient

from app.api.dependencies import (
    get_auth_protection_service,
    get_auth_service,
    get_current_user,
    get_user_repository,
)
from app.core.config import get_settings
from app.main import app
from app.services.auth_service import AuthService
from tests.fakes import FakeAuthProtectionService, FakeUserRepository


@pytest.fixture
def auth_protection():
    return FakeAuthProtectionService()


@pytest.fixture
def client(auth_protection):
    shared_repository = FakeUserRepository()
    settings = get_settings()

    def _get_user_repository_override():
        return shared_repository

    def _get_auth_service_override():
        return AuthService(user_repository=shared_repository, settings=settings)

    def _get_auth_protection_service_override():
        return auth_protection

    app.dependency_overrides[get_user_repository] = _get_user_repository_override
    app.dependency_overrides[get_auth_service] = _get_auth_service_override
    app.dependency_overrides[get_auth_protection_service] = (
        _get_auth_protection_service_override
    )

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.pop(get_user_repository, None)
    app.dependency_overrides.pop(get_auth_service, None)
    app.dependency_overrides.pop(get_auth_protection_service, None)
    app.dependency_overrides.pop(get_current_user, None)


def test_register_returns_access_token(client: TestClient) -> None:
    response = client.post(
        "/api/v1/auth/register", json={"email": "alice@example.com", "password": "password123"}
    )

    assert response.status_code == 201
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]


def test_register_rejects_duplicate_email(client: TestClient) -> None:
    client.post("/api/v1/auth/register", json={"email": "alice@example.com", "password": "password123"})

    response = client.post(
        "/api/v1/auth/register", json={"email": "alice@example.com", "password": "password123"}
    )

    assert response.status_code == 409


def test_register_rejects_short_password(client: TestClient) -> None:
    response = client.post("/api/v1/auth/register", json={"email": "alice@example.com", "password": "short"})

    assert response.status_code == 422


def test_login_returns_access_token_for_valid_credentials(client: TestClient) -> None:
    client.post("/api/v1/auth/register", json={"email": "alice@example.com", "password": "password123"})

    response = client.post(
        "/api/v1/auth/login", json={"email": "alice@example.com", "password": "password123"}
    )

    assert response.status_code == 200
    assert response.json()["access_token"]


def test_login_rejects_wrong_password(client: TestClient) -> None:
    client.post("/api/v1/auth/register", json={"email": "alice@example.com", "password": "password123"})

    response = client.post(
        "/api/v1/auth/login", json={"email": "alice@example.com", "password": "wrong-password"}
    )

    assert response.status_code == 401


def test_me_returns_current_user_with_valid_token(client: TestClient) -> None:
    register_response = client.post(
        "/api/v1/auth/register", json={"email": "alice@example.com", "password": "password123"}
    )
    token = register_response.json()["access_token"]

    response = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    assert response.json()["email"] == "alice@example.com"


def test_me_rejects_missing_token(client: TestClient) -> None:
    response = client.get("/api/v1/auth/me")

    assert response.status_code == 401


def test_me_rejects_invalid_token(client: TestClient) -> None:
    response = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer not-a-real-token"})

    assert response.status_code == 401


def test_register_rejects_honeypot_submission(
    client: TestClient,
) -> None:
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "bot@example.com",
            "password": "password123",
            "website": "https://spam.example",
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid registration request."

    # The rejected bot request must not have created the account.
    retry = client.post(
        "/api/v1/auth/register",
        json={
            "email": "bot@example.com",
            "password": "password123",
        },
    )

    assert retry.status_code == 201


def test_register_returns_429_when_rate_limited(
    client: TestClient,
    auth_protection: FakeAuthProtectionService,
) -> None:
    auth_protection.blocked_actions.add("register")
    auth_protection.retry_after = 120

    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "alice@example.com",
            "password": "password123",
        },
    )

    assert response.status_code == 429
    assert response.headers["Retry-After"] == "120"
    assert response.json()["detail"] == (
        "Too many authentication attempts. Please try again later."
    )


def test_login_returns_429_when_rate_limited(
    client: TestClient,
    auth_protection: FakeAuthProtectionService,
) -> None:
    auth_protection.blocked_actions.add("login")
    auth_protection.retry_after = 45

    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "alice@example.com",
            "password": "password123",
        },
    )

    assert response.status_code == 429
    assert response.headers["Retry-After"] == "45"


def test_successful_login_resets_rate_limit(
    client: TestClient,
    auth_protection: FakeAuthProtectionService,
) -> None:
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "alice@example.com",
            "password": "password123",
        },
    )

    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "alice@example.com",
            "password": "password123",
        },
    )

    assert response.status_code == 200
    assert any(
        action == "login"
        for action, _identifier in auth_protection.resets
    )
