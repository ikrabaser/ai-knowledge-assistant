"""Route-level tests for the authentication endpoints.

Dependencies that would normally hit the real database are overridden with an
in-memory fake user repository, shared across requests within a test via
FastAPI's dependency_overrides — no real PostgreSQL connection is needed.
"""
import pytest
from fastapi.testclient import TestClient

from app.api.dependencies import get_auth_service, get_current_user, get_user_repository
from app.core.config import get_settings
from app.main import app
from app.services.auth_service import AuthService
from tests.fakes import FakeUserRepository


@pytest.fixture
def client():
    shared_repository = FakeUserRepository()
    settings = get_settings()

    def _get_user_repository_override():
        return shared_repository

    def _get_auth_service_override():
        return AuthService(user_repository=shared_repository, settings=settings)

    app.dependency_overrides[get_user_repository] = _get_user_repository_override
    app.dependency_overrides[get_auth_service] = _get_auth_service_override

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.pop(get_user_repository, None)
    app.dependency_overrides.pop(get_auth_service, None)
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
