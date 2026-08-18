"""Orchestrates conversations: ownership-enforced CRUD plus RAG-backed messaging."""
import tiktoken

from app.core.exceptions import ConversationNotFoundError
from app.models.conversation import Conversation
from app.models.message import Message, MessageRole
from app.repositories.conversation_repository import ConversationRepository
from app.repositories.message_repository import MessageRepository
from app.schemas.rag import SourceItem
from app.services.rag_service import HistoryTurn, RagService
from app.services.workspace_service import WorkspaceService

_ENCODING = tiktoken.get_encoding("cl100k_base")


class ConversationService:
    """Creates/lists/reads conversations and drives the RAG pipeline for new messages."""

    def __init__(
        self,
        conversation_repository: ConversationRepository,
        message_repository: MessageRepository,
        workspace_service: WorkspaceService,
        rag_service: RagService,
        history_max_messages: int,
        history_max_tokens: int,
    ) -> None:
        self._conversations = conversation_repository
        self._messages = message_repository
        self._workspace_service = workspace_service
        self._rag_service = rag_service
        self._history_max_messages = history_max_messages
        self._history_max_tokens = history_max_tokens

    async def create_conversation(self, workspace_id: int, user_id: int, title: str) -> Conversation:
        await self._workspace_service.get_owned_workspace(workspace_id, user_id)
        conversation = await self._conversations.create(workspace_id=workspace_id, user_id=user_id, title=title)
        await self._conversations.commit()
        return conversation

    async def list_conversations(self, workspace_id: int, user_id: int) -> list[Conversation]:
        await self._workspace_service.get_owned_workspace(workspace_id, user_id)
        return await self._conversations.list_by_workspace_and_owner(workspace_id, user_id)

    async def get_conversation(self, conversation_id: int, user_id: int) -> Conversation:
        """Fetch a conversation, scoped to its owner.

        Returns 404 for both "does not exist" and "belongs to another user".
        """
        conversation = await self._conversations.get_by_id_and_owner(conversation_id, user_id)
        if conversation is None:
            raise ConversationNotFoundError(f"Conversation {conversation_id} not found.")
        return conversation

    async def get_messages(self, conversation_id: int) -> list[Message]:
        return await self._messages.list_by_conversation(conversation_id)

    def _bound_history(self, messages: list[Message]) -> list[HistoryTurn]:
        """Cap prior context by both message count and token budget (oldest dropped first)."""
        recent = messages[-self._history_max_messages :] if messages else []

        bounded: list[HistoryTurn] = []
        token_budget = self._history_max_tokens
        # Walk from most recent backwards, keeping turns while they still fit the budget.
        for message in reversed(recent):
            token_count = len(_ENCODING.encode(message.content))
            if token_count > token_budget:
                break
            token_budget -= token_count
            bounded.append(HistoryTurn(role=message.role.value, content=message.content))
        bounded.reverse()
        return bounded

    async def add_message(
        self, conversation_id: int, user_id: int, content: str
    ) -> tuple[Message, Message, list[SourceItem]]:
        """Store the user's question, run RAG with bounded history, store and return the answer."""
        conversation = await self.get_conversation(conversation_id, user_id)

        prior_messages = await self._messages.list_recent_by_conversation(
            conversation.id, limit=self._history_max_messages
        )
        history = self._bound_history(prior_messages)

        user_message = await self._messages.create(
            conversation_id=conversation.id, role=MessageRole.USER, content=content
        )

        response = await self._rag_service.ask(
            question=content, workspace_id=conversation.workspace_id, history=history, user_id=user_id
        )

        assistant_message = await self._messages.create(
            conversation_id=conversation.id, role=MessageRole.ASSISTANT, content=response.answer
        )
        await self._messages.commit()

        return user_message, assistant_message, response.sources
