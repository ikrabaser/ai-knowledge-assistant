"""Data-access layer for the Conversation model."""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.conversation import Conversation


class ConversationRepository:
    """Encapsulates all database queries related to Conversation rows."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, workspace_id: int, user_id: int, title: str) -> Conversation:
        conversation = Conversation(workspace_id=workspace_id, user_id=user_id, title=title)
        self._session.add(conversation)
        await self._session.flush()
        await self._session.refresh(conversation)
        return conversation

    async def get_by_id_and_owner(self, conversation_id: int, user_id: int) -> Conversation | None:
        result = await self._session.execute(
            select(Conversation).where(Conversation.id == conversation_id, Conversation.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def list_by_workspace_and_owner(self, workspace_id: int, user_id: int) -> list[Conversation]:
        result = await self._session.execute(
            select(Conversation)
            .where(Conversation.workspace_id == workspace_id, Conversation.user_id == user_id)
            .order_by(Conversation.created_at.desc())
        )
        return list(result.scalars().all())

    async def commit(self) -> None:
        await self._session.commit()
