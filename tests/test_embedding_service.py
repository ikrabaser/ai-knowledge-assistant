"""Tests for EmbeddingService using a fake provider (no real OpenAI calls)."""
import pytest

from app.core.exceptions import EmbeddingProviderError
from app.providers.base_embedding_provider import EmbeddingProvider
from app.services.embedding_service import EmbeddingService
from tests.fakes import FakeEmbeddingProvider


@pytest.mark.asyncio
async def test_embed_query_returns_vector() -> None:
    service = EmbeddingService(FakeEmbeddingProvider(dimensions=8))

    vector = await service.embed_query("hello world")

    assert len(vector) == 8


@pytest.mark.asyncio
async def test_embed_documents_returns_empty_list_for_no_texts() -> None:
    service = EmbeddingService(FakeEmbeddingProvider())

    result = await service.embed_documents([])

    assert result == []


@pytest.mark.asyncio
async def test_embed_documents_preserves_order() -> None:
    service = EmbeddingService(FakeEmbeddingProvider(dimensions=4))

    result = await service.embed_documents(["a", "b", "c"])

    assert len(result) == 3


class _FailingProvider(EmbeddingProvider):
    async def embed_text(self, text: str) -> list[float]:
        raise RuntimeError("boom")

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        raise RuntimeError("boom")


@pytest.mark.asyncio
async def test_embed_query_wraps_provider_errors() -> None:
    service = EmbeddingService(_FailingProvider())

    with pytest.raises(EmbeddingProviderError):
        await service.embed_query("hello")
