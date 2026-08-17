"""Tests for AuthService: registration, login and password/token behavior."""
import pytest

from app.core.config import Settings
from app.core.exceptions import InactiveUserError, InvalidCredentialsError, UserAlreadyExistsError
from app.core.security import decode_access_token
from app.services.auth_service import AuthService
from tests.fakes import FakeUserRepository


@pytest.fixture
def settings() -> Settings:
    return Settings(jwt_secret_key="test-secret", jwt_algorithm="HS256", access_token_expire_minutes=60)


@pytest.fixture
def auth_service(settings: Settings) -> AuthService:
    return AuthService(user_repository=FakeUserRepository(), settings=settings)


@pytest.mark.asyncio
async def test_register_creates_user_and_returns_valid_token(auth_service: AuthService, settings: Settings) -> None:
    user, token = await auth_service.register(email="alice@example.com", password="password123")

    assert user.email == "alice@example.com"
    assert user.password_hash != "password123"
    assert decode_access_token(token, settings) == str(user.id)


@pytest.mark.asyncio
async def test_register_rejects_duplicate_email(auth_service: AuthService) -> None:
    await auth_service.register(email="alice@example.com", password="password123")

    with pytest.raises(UserAlreadyExistsError):
        await auth_service.register(email="alice@example.com", password="another-password")


@pytest.mark.asyncio
async def test_login_succeeds_with_correct_credentials(auth_service: AuthService) -> None:
    registered_user, _ = await auth_service.register(email="bob@example.com", password="password123")

    user, token = await auth_service.login(email="bob@example.com", password="password123")

    assert user.id == registered_user.id
    assert token


@pytest.mark.asyncio
async def test_login_rejects_wrong_password(auth_service: AuthService) -> None:
    await auth_service.register(email="bob@example.com", password="password123")

    with pytest.raises(InvalidCredentialsError):
        await auth_service.login(email="bob@example.com", password="wrong-password")


@pytest.mark.asyncio
async def test_login_rejects_unknown_email(auth_service: AuthService) -> None:
    with pytest.raises(InvalidCredentialsError):
        await auth_service.login(email="nobody@example.com", password="whatever")


@pytest.mark.asyncio
async def test_login_rejects_inactive_user(auth_service: AuthService) -> None:
    user, _ = await auth_service.register(email="carol@example.com", password="password123")
    user.is_active = False

    with pytest.raises(InactiveUserError):
        await auth_service.login(email="carol@example.com", password="password123")
