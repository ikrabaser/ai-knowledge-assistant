"""Tests for password hashing and JWT token utilities."""
import time

import jwt
import pytest

from app.core.config import Settings
from app.core.security import create_access_token, decode_access_token, hash_password, verify_password


@pytest.fixture
def settings() -> Settings:
    return Settings(jwt_secret_key="test-secret", jwt_algorithm="HS256", access_token_expire_minutes=60)


def test_hash_password_does_not_store_plain_text() -> None:
    password_hash = hash_password("super-secret-password")

    assert password_hash != "super-secret-password"
    assert password_hash.startswith("$2b$")


def test_verify_password_accepts_correct_password() -> None:
    password_hash = hash_password("correct-horse-battery-staple")

    assert verify_password("correct-horse-battery-staple", password_hash) is True


def test_verify_password_rejects_wrong_password() -> None:
    password_hash = hash_password("correct-horse-battery-staple")

    assert verify_password("wrong-password", password_hash) is False


def test_verify_password_rejects_malformed_hash() -> None:
    assert verify_password("anything", "not-a-real-bcrypt-hash") is False


def test_create_and_decode_access_token_round_trips(settings: Settings) -> None:
    token = create_access_token(subject="42", settings=settings)

    subject = decode_access_token(token, settings)

    assert subject == "42"


def test_decode_access_token_rejects_wrong_secret(settings: Settings) -> None:
    token = create_access_token(subject="42", settings=settings)
    wrong_settings = Settings(jwt_secret_key="a-different-secret", jwt_algorithm="HS256")

    with pytest.raises(jwt.PyJWTError):
        decode_access_token(token, wrong_settings)


def test_decode_access_token_rejects_expired_token(settings: Settings) -> None:
    expired_settings = Settings(
        jwt_secret_key=settings.jwt_secret_key, jwt_algorithm="HS256", access_token_expire_minutes=0
    )
    token = create_access_token(subject="42", settings=expired_settings)
    time.sleep(1.1)

    with pytest.raises(jwt.PyJWTError):
        decode_access_token(token, expired_settings)
