"""Tests for ConversationService: ownership enforcement, message flow, history bounding."""
import pytest

from app.core.exceptions import ConversationNotFoundError, WorkspaceNotFoundError
from app.models.message import MessageRole
from app.services.conversation_service import ConversationService
from app.services.embedding_service import EmbeddingService
from app.services.rag_service import RagService
from app.services.retrieval_service import RetrievalService
from app.services.workspace_service import WorkspaceService
from tests.fakes import (
    FakeChatProvider,
    FakeChunkRepository,
    FakeChunkRow,
    FakeConversationRepository,
    FakeEmbeddingProvider,
    FakeMessageRepository,
    FakeWorkspaceRepository,
)

WORKSPACE_ID = 1
OWNER_ID = 10
OTHER_USER_ID = 20


async def _build_conversation_service(
    history_max_messages: int = 10, history_max_tokens: int = 2000, chunk_rows: list | None = None
) -> ConversationService:
    workspace_repository = FakeWorkspaceRepository()
    workspace = await workspace_repository.create(name="Test Workspace", owner_id=OWNER_ID)
    assert workspace.id == WORKSPACE_ID  # first workspace created always gets id 1
    workspace_service = WorkspaceService(workspace_repository)

    retrieval_service = RetrievalService(
        chunk_repository=FakeChunkRepository(chunk_rows or [FakeChunkRow(1, "doc.txt", 0, "Some fact.", 0.9)]),
        embedding_service=EmbeddingService(FakeEmbeddingProvider()),
        default_top_k=5,
        similarity_threshold=0.3,
    )
    rag_service = RagService(retrieval_service=retrieval_service, chat_provider=FakeChatProvider())

    return ConversationService(
        conversation_repository=FakeConversationRepository(),
        message_repository=FakeMessageRepository(),
        workspace_service=workspace_service,
        rag_service=rag_service,
        history_max_messages=history_max_messages,
        history_max_tokens=history_max_tokens,
    )


@pytest.mark.asyncio
async def test_create_conversation_requires_workspace_ownership() -> None:
    service = await _build_conversation_service()

    with pytest.raises(WorkspaceNotFoundError):
        await service.create_conversation(WORKSPACE_ID, user_id=OTHER_USER_ID, title="Hi")


@pytest.mark.asyncio
async def test_create_conversation_succeeds_for_owner() -> None:
    service = await _build_conversation_service()

    conversation = await service.create_conversation(WORKSPACE_ID, user_id=OWNER_ID, title="My chat")

    assert conversation.workspace_id == WORKSPACE_ID
    assert conversation.user_id == OWNER_ID


@pytest.mark.asyncio
async def test_get_conversation_rejects_a_different_user() -> None:
    service = await _build_conversation_service()
    conversation = await service.create_conversation(WORKSPACE_ID, user_id=OWNER_ID, title="My chat")

    with pytest.raises(ConversationNotFoundError):
        await service.get_conversation(conversation.id, user_id=OTHER_USER_ID)


@pytest.mark.asyncio
async def test_add_message_stores_user_and_assistant_messages() -> None:
    service = await _build_conversation_service()
    conversation = await service.create_conversation(WORKSPACE_ID, user_id=OWNER_ID, title="My chat")

    user_message, assistant_message, sources = await service.add_message(
        conversation.id, user_id=OWNER_ID, content="What is the fact?"
    )

    assert user_message.role == MessageRole.USER
    assert user_message.content == "What is the fact?"
    assert assistant_message.role == MessageRole.ASSISTANT
    assert len(sources) == 1

    stored = await service.get_messages(conversation.id)
    assert [m.role for m in stored] == [MessageRole.USER, MessageRole.ASSISTANT]


@pytest.mark.asyncio
async def test_add_message_rejects_a_different_user() -> None:
    service = await _build_conversation_service()
    conversation = await service.create_conversation(WORKSPACE_ID, user_id=OWNER_ID, title="My chat")

    with pytest.raises(ConversationNotFoundError):
        await service.add_message(conversation.id, user_id=OTHER_USER_ID, content="Hi")


@pytest.mark.asyncio
async def test_history_is_capped_by_message_count() -> None:
    service = await _build_conversation_service(history_max_messages=2)
    conversation = await service.create_conversation(WORKSPACE_ID, user_id=OWNER_ID, title="My chat")

    for i in range(5):
        await service.add_message(conversation.id, user_id=OWNER_ID, content=f"Question {i}")

    # 5 exchanges * 2 messages each = 10 stored messages; history passed to any single
    # RAG call must never exceed the configured cap, regardless of how long the chat gets.
    all_messages = await service.get_messages(conversation.id)
    assert len(all_messages) == 10
    bounded = service._bound_history(all_messages)
    assert len(bounded) <= 2


@pytest.mark.asyncio
async def test_history_is_capped_by_token_budget() -> None:
    service = await _build_conversation_service(history_max_messages=50, history_max_tokens=5)
    conversation = await service.create_conversation(WORKSPACE_ID, user_id=OWNER_ID, title="My chat")
    await service.add_message(conversation.id, user_id=OWNER_ID, content="This is a fairly long question.")

    all_messages = await service.get_messages(conversation.id)
    bounded = service._bound_history(all_messages)

    # A 5-token budget can't fit either message from that first exchange in full.
    assert bounded == []
