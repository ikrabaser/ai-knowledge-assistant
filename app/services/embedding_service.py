"""Service wrapper around an EmbeddingProvider, isolating business logic from OpenAI specifics."""
from app.core.exceptions import EmbeddingProviderError
from app.core.logging import get_logger
from app.providers.base_embedding_provider import EmbeddingProvider

logger = get_logger(__name__)


class EmbeddingService:
    """Produces embeddings for text via a pluggable EmbeddingProvider."""

    def __init__(self, provider: EmbeddingProvider) -> None:
        self._provider = provider

    async def embed_query(self, text: str) -> list[float]:
        try:
            return await self._provider.embed_text(text)
        except Exception as exc:
            logger.exception("Embedding request failed for query text")
            raise EmbeddingProviderError(f"Failed to generate embedding: {exc}") from exc

    async def embed_documents(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        try:
            return await self._provider.embed_batch(texts)
        except Exception as exc:
            logger.exception("Embedding request failed for %d text(s)", len(texts))
            raise EmbeddingProviderError(f"Failed to generate embeddings: {exc}") from exc
