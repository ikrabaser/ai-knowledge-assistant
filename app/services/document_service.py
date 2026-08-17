"""Orchestrates the document ingestion pipeline: validate, store, parse, chunk, embed, persist."""
import uuid
from pathlib import Path

from app.core.exceptions import DocumentNotFoundError, FileTooLargeError, UnsupportedFileTypeError
from app.core.logging import get_logger
from app.models.document import Document, DocumentStatus
from app.models.document_chunk import DocumentChunk
from app.repositories.chunk_repository import ChunkRepository
from app.repositories.document_repository import DocumentRepository
from app.services.chunking_service import ChunkingService
from app.services.embedding_service import EmbeddingService
from app.services.parsing_service import SUPPORTED_CONTENT_TYPES, ParsingService

logger = get_logger(__name__)

_EXTENSION_BY_CONTENT_TYPE = {
    "application/pdf": ".pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "text/plain": ".txt",
}


class DocumentService:
    """Coordinates repositories and services to run the full ingestion pipeline."""

    def __init__(
        self,
        document_repository: DocumentRepository,
        chunk_repository: ChunkRepository,
        parsing_service: ParsingService,
        chunking_service: ChunkingService,
        embedding_service: EmbeddingService,
        upload_directory: str,
        max_upload_size_mb: int,
    ) -> None:
        self._documents = document_repository
        self._chunks = chunk_repository
        self._parsing_service = parsing_service
        self._chunking_service = chunking_service
        self._embedding_service = embedding_service
        self._upload_directory = Path(upload_directory)
        self._max_upload_size_bytes = max_upload_size_mb * 1024 * 1024

    def _validate(self, filename: str, content_type: str, content: bytes) -> None:
        if content_type not in SUPPORTED_CONTENT_TYPES:
            raise UnsupportedFileTypeError(
                f"Unsupported file type '{content_type}'. Allowed: PDF, DOCX, TXT."
            )
        if len(content) > self._max_upload_size_bytes:
            raise FileTooLargeError(
                f"File exceeds the maximum allowed size of {self._max_upload_size_bytes // (1024 * 1024)}MB."
            )
        if len(content) == 0:
            raise UnsupportedFileTypeError("Uploaded file is empty.")

    def _generate_safe_filename(self, content_type: str) -> str:
        """Generate a random, non-guessable filename — never derived from user input."""
        extension = _EXTENSION_BY_CONTENT_TYPE[content_type]
        return f"{uuid.uuid4().hex}{extension}"

    def _save_file(self, stored_filename: str, content: bytes) -> Path:
        self._upload_directory.mkdir(parents=True, exist_ok=True)
        destination = (self._upload_directory / stored_filename).resolve()
        # Defence in depth: ensure the resolved path still lives inside the upload directory.
        if self._upload_directory.resolve() not in destination.parents:
            raise UnsupportedFileTypeError("Invalid file destination.")
        destination.write_bytes(content)
        return destination

    async def upload_and_process(self, filename: str, content_type: str, content: bytes) -> Document:
        """Run the full pipeline: validate -> store -> extract -> chunk -> embed -> persist."""
        self._validate(filename, content_type, content)

        stored_filename = self._generate_safe_filename(content_type)
        document = await self._documents.create(
            filename=filename, stored_filename=stored_filename, content_type=content_type
        )
        await self._documents.commit()

        try:
            self._save_file(stored_filename, content)
            await self._index_document(document, content, content_type)
            await self._documents.update_status(document, DocumentStatus.INDEXED)
        except Exception as exc:
            logger.exception("Failed to process document %s", document.id)
            await self._documents.update_status(document, DocumentStatus.FAILED, error_message=str(exc))
            await self._documents.commit()
            raise
        else:
            await self._documents.commit()

        return document

    async def _index_document(self, document: Document, content: bytes, content_type: str) -> None:
        await self._documents.update_status(document, DocumentStatus.PROCESSING)
        await self._documents.commit()

        text = self._parsing_service.extract_text(content, content_type)
        text_chunks = self._chunking_service.split(text)

        # Prevent duplicate chunks if this document is ever re-processed.
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

    async def get_document(self, document_id: int) -> Document:
        document = await self._documents.get_by_id(document_id)
        if document is None:
            raise DocumentNotFoundError(f"Document {document_id} not found.")
        return document

    async def list_documents(self) -> list[Document]:
        return await self._documents.list_all()

    async def count_chunks(self, document_id: int) -> int:
        return await self._chunks.count_by_document_id(document_id)
