"""Data-access layer for the DocumentChunk model, including pgvector similarity search."""
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.document_chunk import DocumentChunk


class ChunkRepository:
    """Encapsulates all database queries related to DocumentChunk rows."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def delete_by_document_id(self, document_id: int) -> None:
        """Remove any existing chunks for a document before re-indexing it."""
        await self._session.execute(delete(DocumentChunk).where(DocumentChunk.document_id == document_id))
        await self._session.flush()

    async def bulk_create(self, chunks: list[DocumentChunk]) -> list[DocumentChunk]:
        self._session.add_all(chunks)
        await self._session.flush()
        return chunks

    async def similarity_search(
        self, query_embedding: list[float], limit: int, similarity_threshold: float
    ) -> list[tuple[DocumentChunk, float]]:
        """Return (chunk, similarity_score) pairs ordered by cosine similarity, most similar first.

        pgvector's `cosine_distance` returns a value in [0, 2] where 0 means identical.
        We convert it to a similarity score in [-1, 1] (1 == identical) for the API response.
        """
        distance = DocumentChunk.embedding.cosine_distance(query_embedding)
        stmt = (
            select(DocumentChunk, distance.label("distance"))
            .options(joinedload(DocumentChunk.document))
            .where(DocumentChunk.embedding.isnot(None))
            .order_by(distance)
            .limit(limit)
        )
        result = await self._session.execute(stmt)
        rows = result.all()

        matches: list[tuple[DocumentChunk, float]] = []
        for chunk, dist in rows:
            similarity = 1 - dist
            if similarity >= similarity_threshold:
                matches.append((chunk, similarity))
        return matches

    async def commit(self) -> None:
        await self._session.commit()
