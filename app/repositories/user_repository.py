"""Data-access layer for the User model."""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


class UserRepository:
    """Encapsulates all database queries related to User rows."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, email: str, password_hash: str) -> User:
        user = User(email=email, password_hash=password_hash, is_active=True)
        self._session.add(user)
        await self._session.flush()
        await self._session.refresh(user)
        return user

    async def get_by_id(self, user_id: int) -> User | None:
        result = await self._session.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:
        result = await self._session.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def commit(self) -> None:
        await self._session.commit()
