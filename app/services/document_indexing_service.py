"""The actual parse -> chunk -> embed -> persist pipeline for one document.

Deliberately separate from DocumentService: this runs inside the Celery worker
process (its own DB session, its own provider clients — see
app/tasks/document_indexing_task.py), reading the already-uploaded file back
from disk by its stored filename. DocumentService only ever validates, saves
the file, creates the row and dispatches indexing; it never runs this itself.
"""
from pathlib import Path

from app.core.logging import get_logger
from app.models.document import Document, DocumentStatus
from app.models.document_chunk import DocumentChunk
from app.repositories.chunk_repository import ChunkRepository
from app.repositories.document_repository import DocumentRepository
from app.services.chunking_service import ChunkingService
from app.services.embedding_service import EmbeddingService
from app.services.parsing_service import ParsingService

logger = get_logger(__name__)


class DocumentIndexingService:
    """Runs the indexing pipeline for a single, already-uploaded document."""

    def __init__(
        self,
        document_repository: DocumentRepository,
        chunk_repository: ChunkRepository,
        parsing_service: ParsingService,
        chunking_service: ChunkingService,
        embedding_service: EmbeddingService,
        upload_directory: str,
    ) -> None:
        self._documents = document_repository
        self._chunks = chunk_repository
        self._parsing_service = parsing_service
        self._chunking_service = chunking_service
        self._embedding_service = embedding_service
        self._upload_directory = Path(upload_directory)

    async def index(self, document_id: int) -> None:
        document = await self._documents.get_by_id(document_id)
        if document is None:
            logger.warning("Indexing requested for unknown document_id=%s; skipping.", document_id)
            return

        await self._documents.update_status(document, DocumentStatus.PROCESSING)
        await self._documents.commit()

        try:
            await self._run_pipeline(document)
            await self._documents.update_status(document, DocumentStatus.INDEXED)
        except Exception as exc:
            logger.exception("Failed to index document %s", document.id)
            await self._documents.update_status(document, DocumentStatus.FAILED, error_message=str(exc))
            await self._documents.commit()
            raise
        else:
            await self._documents.commit()

    async def _run_pipeline(self, document: Document) -> None:
        file_path = self._upload_directory / document.stored_filename
        content = file_path.read_bytes()

        text = self._parsing_service.extract_text(content, document.content_type)
        text_chunks = self._chunking_service.split(text)

        # Prevent duplicate chunks if this document is ever re-indexed (e.g. after a retry).
        await self._chunks.delete_by_document_id(document.id)

        if not text_chunks:
            return

        embeddings = await self._embedding_service.embed_documents([c.content for c in text_chunks])

        chunk_rows = [
            DocumentChunk(
                document_id=document.id,
                content=chunk.content,
                chunk_index=chunk.chunk_index,
                token_count=chunk.token_count,
                embedding=embedding,
            )
            for chunk, embedding in zip(text_chunks, embeddings)
        ]
        await self._chunks.bulk_create(chunk_rows)
