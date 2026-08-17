"""Tests for RetrievalService using fake repository/embedding provider."""
import pytest

from app.services.embedding_service import EmbeddingService
from app.services.retrieval_service import RetrievalService
from tests.fakes import FakeChunkRepository, FakeChunkRow, FakeEmbeddingProvider


@pytest.mark.asyncio
async def test_search_returns_results_above_threshold() -> None:
    rows = [
        FakeChunkRow(1, "handbook.pdf", 0, "Annual leave policy is 14 days.", 0.91),
        FakeChunkRow(1, "handbook.pdf", 1, "Sick leave policy is 10 days.", 0.40),
        FakeChunkRow(2, "other.pdf", 0, "Unrelated content.", 0.10),
    ]
    retrieval_service = RetrievalService(
        chunk_repository=FakeChunkRepository(rows),
        embedding_service=EmbeddingService(FakeEmbeddingProvider()),
        default_top_k=5,
        similarity_threshold=0.3,
    )

    results = await retrieval_service.search("annual leave policy")

    assert len(results) == 2
    assert results[0].similarity_score >= results[1].similarity_score


@pytest.mark.asyncio
async def test_search_returns_empty_list_for_blank_query() -> None:
    retrieval_service = RetrievalService(
        chunk_repository=FakeChunkRepository([]),
        embedding_service=EmbeddingService(FakeEmbeddingProvider()),
        default_top_k=5,
        similarity_threshold=0.3,
    )

    results = await retrieval_service.search("   ")

    assert results == []


@pytest.mark.asyncio
async def test_search_respects_limit() -> None:
    rows = [FakeChunkRow(1, "doc.pdf", i, f"chunk {i}", 0.9 - i * 0.01) for i in range(10)]
    retrieval_service = RetrievalService(
        chunk_repository=FakeChunkRepository(rows),
        embedding_service=EmbeddingService(FakeEmbeddingProvider()),
        default_top_k=5,
        similarity_threshold=0.0,
    )

    results = await retrieval_service.search("query", limit=3)

    assert len(results) == 3
