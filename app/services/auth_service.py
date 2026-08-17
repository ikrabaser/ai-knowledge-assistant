"""Registration, login and token issuance."""
from app.core.config import Settings
from app.core.exceptions import InactiveUserError, InvalidCredentialsError, UserAlreadyExistsError
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.repositories.user_repository import UserRepository


class AuthService:
    """Orchestrates user registration and login against the UserRepository."""

    def __init__(self, user_repository: UserRepository, settings: Settings) -> None:
        self._users = user_repository
        self._settings = settings

    async def register(self, email: str, password: str) -> tuple[User, str]:
        existing = await self._users.get_by_email(email)
        if existing is not None:
            raise UserAlreadyExistsError(f"An account with email '{email}' already exists.")

        user = await self._users.create(email=email, password_hash=hash_password(password))
        await self._users.commit()
        token = create_access_token(subject=str(user.id), settings=self._settings)
        return user, token

    async def login(self, email: str, password: str) -> tuple[User, str]:
        user = await self._users.get_by_email(email)
        if user is None or not verify_password(password, user.password_hash):
            raise InvalidCredentialsError("Invalid email or password.")
        if not user.is_active:
            raise InactiveUserError("This account has been deactivated.")

        token = create_access_token(subject=str(user.id), settings=self._settings)
        return user, token
