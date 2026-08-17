"""Semantic retrieval service: embeds a query and finds the most similar chunks."""
from dataclasses import dataclass

from app.repositories.chunk_repository import ChunkRepository
from app.services.embedding_service import EmbeddingService


@dataclass(frozen=True)
class RetrievedChunk:
    """A retrieved chunk paired with its similarity score and parent document metadata."""

    document_id: int
    filename: str
    chunk_index: int
    content: str
    similarity_score: float


class RetrievalService:
    """Performs semantic (vector) search over indexed document chunks."""

    def __init__(
        self,
        chunk_repository: ChunkRepository,
        embedding_service: EmbeddingService,
        default_top_k: int,
        similarity_threshold: float,
    ) -> None:
        self._chunks = chunk_repository
        self._embedding_service = embedding_service
        self._default_top_k = default_top_k
        self._similarity_threshold = similarity_threshold

    async def search(
        self,
        query: str,
        workspace_id: int,
        limit: int | None = None,
        document_id: int | None = None,
    ) -> list[RetrievedChunk]:
        query = query.strip()
        if not query:
            return []

        query_embedding = await self._embedding_service.embed_query(query)
        matches = await self._chunks.similarity_search(
            query_embedding=query_embedding,
            limit=limit or self._default_top_k,
            similarity_threshold=self._similarity_threshold,
            workspace_id=workspace_id,
            document_id=document_id,
        )

        return [
            RetrievedChunk(
                document_id=chunk.document_id,
                filename=chunk.document.filename,
                chunk_index=chunk.chunk_index,
                content=chunk.content,
                similarity_score=round(score, 4),
            )
            for chunk, score in matches
        ]
