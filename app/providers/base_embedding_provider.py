"""Abstract interface for text-embedding providers."""
from abc import ABC, abstractmethod


class EmbeddingProvider(ABC):
    """Any provider capable of turning text into a vector embedding."""

    @abstractmethod
    async def embed_text(self, text: str) -> list[float]:
        """Return the embedding vector for a single piece of text."""
        ...

    @abstractmethod
    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """Return embedding vectors for a batch of texts, preserving order."""
        ...
