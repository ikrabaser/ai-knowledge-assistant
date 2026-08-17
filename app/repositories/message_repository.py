"""Data-access layer for the Message model."""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.message import Message, MessageRole


class MessageRepository:
    """Encapsulates all database queries related to Message rows."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, conversation_id: int, role: MessageRole, content: str) -> Message:
        message = Message(conversation_id=conversation_id, role=role, content=content)
        self._session.add(message)
        await self._session.flush()
        await self._session.refresh(message)
        return message

    async def list_by_conversation(self, conversation_id: int) -> list[Message]:
        result = await self._session.execute(
            select(Message).where(Message.conversation_id == conversation_id).order_by(Message.id)
        )
        return list(result.scalars().all())

    async def list_recent_by_conversation(self, conversation_id: int, limit: int) -> list[Message]:
        """Return the most recent `limit` messages, in chronological order."""
        result = await self._session.execute(
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.id.desc())
            .limit(limit)
        )
        return list(reversed(result.scalars().all()))

    async def commit(self) -> None:
        await self._session.commit()
