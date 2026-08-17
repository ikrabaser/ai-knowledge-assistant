"""Data-access layer for the Document model."""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document import Document, DocumentStatus


class DocumentRepository:
    """Encapsulates all database queries related to Document rows."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, filename: str, stored_filename: str, content_type: str) -> Document:
        document = Document(
            filename=filename,
            stored_filename=stored_filename,
            content_type=content_type,
            status=DocumentStatus.UPLOADED,
        )
        self._session.add(document)
        await self._session.flush()
        return document

    async def get_by_id(self, document_id: int) -> Document | None:
        result = await self._session.execute(select(Document).where(Document.id == document_id))
        return result.scalar_one_or_none()

    async def list_all(self) -> list[Document]:
        result = await self._session.execute(select(Document).order_by(Document.created_at.desc()))
        return list(result.scalars().all())

    async def update_status(
        self, document: Document, status: DocumentStatus, error_message: str | None = None
    ) -> Document:
        document.status = status
        document.error_message = error_message
        await self._session.flush()
        # `updated_at` has a server-side `onupdate=func.now()`; after an UPDATE,
        # SQLAlchemy marks it expired since it doesn't know the server-computed
        # value. Refresh explicitly (async-safe) so later attribute access never
        # triggers an implicit, unawaited lazy load ("MissingGreenlet").
        await self._session.refresh(document)
        return document

    async def commit(self) -> None:
        await self._session.commit()
