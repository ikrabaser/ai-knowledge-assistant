"""Semantic retrieval service: embeds a query and finds the most similar chunks.

Question -> Embedding -> Vector Search -> Top N Candidates -> Reranker -> Top K -> RAG.
The reranking stage is optional: when no RerankingService is wired in (or it's
disabled via config), this behaves exactly like plain vector search, fetching and
returning `default_top_k` (or the caller-provided `limit`) results directly.
"""
from app.repositories.chunk_repository import ChunkRepository
from app.services.embedding_service import EmbeddingService
from app.services.reranking_service import RerankingService
from app.services.retrieval_types import RetrievedChunk

__all__ = ["RetrievedChunk", "RetrievalService"]


class RetrievalService:
    """Performs semantic (vector) search over indexed document chunks, with optional reranking."""

    def __init__(
        self,
        chunk_repository: ChunkRepository,
        embedding_service: EmbeddingService,
        default_top_k: int,
        similarity_threshold: float,
        reranking_service: RerankingService | None = None,
        candidate_count: int | None = None,
        rerank_top_k: int | None = None,
    ) -> None:
        self._chunks = chunk_repository
        self._embedding_service = embedding_service
        self._default_top_k = default_top_k
        self._similarity_threshold = similarity_threshold
        self._reranking_service = reranking_service
        # Only meaningful when reranking is enabled — how many candidates to pull
        # from vector search before the reranker narrows them down to top_k.
        self._candidate_count = candidate_count or default_top_k
        # The default final count *after* reranking, when the caller doesn't
        # explicitly request a different `limit`.
        self._rerank_top_k = rerank_top_k or default_top_k

    async def search(
        self,
        query: str,
        workspace_id: int,
        limit: int | None = None,
        document_id: int | None = None,
        content_type: str | None = None,
    ) -> list[RetrievedChunk]:
        query = query.strip()
        if not query:
            return []

        if limit is not None:
            top_k = limit
        elif self._reranking_service is not None:
            top_k = self._rerank_top_k
        else:
            top_k = self._default_top_k
        fetch_limit = max(self._candidate_count, top_k) if self._reranking_service else top_k

        query_embedding = await self._embedding_service.embed_query(query)
        matches = await self._chunks.similarity_search(
            query_embedding=query_embedding,
            limit=fetch_limit,
            similarity_threshold=self._similarity_threshold,
            workspace_id=workspace_id,
            document_id=document_id,
            content_type=content_type,
        )

        candidates = [
            RetrievedChunk(
                document_id=chunk.document_id,
                filename=chunk.document.filename,
                chunk_index=chunk.chunk_index,
                content=chunk.content,
                similarity_score=round(score, 4),
            )
            for chunk, score in matches
        ]

        if self._reranking_service is None:
            return candidates[:top_k]
        return self._reranking_service.rerank(query, candidates, top_k)
