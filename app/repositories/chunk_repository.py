"""Data-access layer for the DocumentChunk model, including pgvector similarity search."""
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.document import Document
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

    async def list_content_by_document_id(self, document_id: int) -> list[str]:
        """Return chunk contents for a document, in original chunk order."""
        result = await self._session.execute(
            select(DocumentChunk.content)
            .where(DocumentChunk.document_id == document_id)
            .order_by(DocumentChunk.chunk_index)
        )
        return list(result.scalars().all())

    async def count_by_document_id(self, document_id: int) -> int:
        """Count chunks without touching the Document.chunks lazy relationship.

        Avoids triggering an implicit, unawaited lazy load on an async session
        (which raises MissingGreenlet) when callers only need the count.
        """
        result = await self._session.execute(
            select(func.count()).select_from(DocumentChunk).where(DocumentChunk.document_id == document_id)
        )
        return result.scalar_one()

    async def similarity_search(
        self,
        query_embedding: list[float],
        limit: int,
        similarity_threshold: float,
        workspace_id: int,
        document_id: int | None = None,
    ) -> list[tuple[DocumentChunk, float]]:
        """Return (chunk, similarity_score) pairs ordered by cosine similarity, most similar first.

        `workspace_id` is mandatory (not optional) so no call site can accidentally
        run an unscoped search: a chunk belonging to another workspace must never be
        returned, even if its similarity score would otherwise rank higher.
        `document_id`, if given, further narrows the search to a single document.

        pgvector's `cosine_distance` returns a value in [0, 2] where 0 means identical.
        We convert it to a similarity score in [-1, 1] (1 == identical) for the API response.
        """
        distance = DocumentChunk.embedding.cosine_distance(query_embedding)
        stmt = (
            select(DocumentChunk, distance.label("distance"))
            .join(Document, Document.id == DocumentChunk.document_id)
            .options(joinedload(DocumentChunk.document))
            .where(DocumentChunk.embedding.isnot(None), Document.workspace_id == workspace_id)
            .order_by(distance)
            .limit(limit)
        )
        if document_id is not None:
            stmt = stmt.where(DocumentChunk.document_id == document_id)
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
