"""Tests for the health check and root endpoints."""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_check_returns_healthy_status() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "healthy", "service": "ai-knowledge-assistant"}


def test_root_returns_app_info() -> None:
    response = client.get("/")

    assert response.status_code == 200
    body = response.json()
    assert "name" in body
    assert body["docs"] == "/docs"
