"""Tests for RagService using fake retrieval/chat providers."""
import pytest

from app.services.embedding_service import EmbeddingService
from app.services.rag_service import NO_CONTEXT_ANSWER, RagService
from app.services.retrieval_service import RetrievalService
from tests.fakes import FakeChatProvider, FakeChunkRepository, FakeChunkRow, FakeEmbeddingProvider


def _build_rag_service(rows: list[FakeChunkRow], answer: str = "The annual leave is 14 days.") -> tuple[RagService, FakeChatProvider]:
    retrieval_service = RetrievalService(
        chunk_repository=FakeChunkRepository(rows),
        embedding_service=EmbeddingService(FakeEmbeddingProvider()),
        default_top_k=5,
        similarity_threshold=0.3,
    )
    chat_provider = FakeChatProvider(answer=answer)
    return RagService(retrieval_service=retrieval_service, chat_provider=chat_provider), chat_provider


@pytest.mark.asyncio
async def test_ask_returns_answer_with_sources_when_context_found() -> None:
    rows = [FakeChunkRow(1, "handbook.pdf", 4, "Annual leave policy is 14 days.", 0.91)]
    rag_service, chat_provider = _build_rag_service(rows)

    response = await rag_service.ask("What is the annual leave policy?")

    assert response.answer == "The annual leave is 14 days."
    assert len(response.sources) == 1
    assert response.sources[0].filename == "handbook.pdf"
    assert response.sources[0].document_id == 1
    assert chat_provider.last_user_prompt is not None
    assert "Annual leave policy is 14 days." in chat_provider.last_user_prompt


@pytest.mark.asyncio
async def test_ask_returns_fallback_answer_when_no_context() -> None:
    rag_service, chat_provider = _build_rag_service([])

    response = await rag_service.ask("What is the meaning of life?")

    assert response.answer == NO_CONTEXT_ANSWER
    assert response.sources == []
    # The chat provider must not be called when there is no retrieved context.
    assert chat_provider.last_user_prompt is None
