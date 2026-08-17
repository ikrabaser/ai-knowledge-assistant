"""Validates, safely stores and registers an uploaded document, then schedules indexing.

The actual parse -> chunk -> embed pipeline does NOT run here — it's dispatched
(see IndexingDispatcher) to run asynchronously, so the upload endpoint returns
as soon as the file is safely on disk and the row exists, without blocking the
caller on embedding generation.
"""
import uuid
from pathlib import Path

from app.core.exceptions import DocumentNotFoundError, FileTooLargeError, UnsupportedFileTypeError
from app.models.document import Document
from app.repositories.chunk_repository import ChunkRepository
from app.repositories.document_repository import DocumentRepository
from app.services.indexing_dispatcher import IndexingDispatcher
from app.services.parsing_service import SUPPORTED_CONTENT_TYPES

_EXTENSION_BY_CONTENT_TYPE = {
    "application/pdf": ".pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "text/plain": ".txt",
}


class DocumentService:
    """Coordinates document upload/lookup and hands off indexing to the dispatcher."""

    def __init__(
        self,
        document_repository: DocumentRepository,
        chunk_repository: ChunkRepository,
        indexing_dispatcher: IndexingDispatcher,
        upload_directory: str,
        max_upload_size_mb: int,
    ) -> None:
        self._documents = document_repository
        self._chunks = chunk_repository
        self._indexing_dispatcher = indexing_dispatcher
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

    async def upload_and_process(
        self, filename: str, content_type: str, content: bytes, workspace_id: int
    ) -> Document:
        """Validate, store and register a document, then schedule indexing.

        Returns immediately with the document in `uploaded` status — the caller
        is never blocked on parsing/chunking/embedding. Use get_document() /
        the document status endpoint to observe it move through
        uploaded -> processing -> indexed | failed.
        """
        self._validate(filename, content_type, content)

        stored_filename = self._generate_safe_filename(content_type)
        self._save_file(stored_filename, content)

        document = await self._documents.create(
            filename=filename,
            stored_filename=stored_filename,
            content_type=content_type,
            workspace_id=workspace_id,
        )
        await self._documents.commit()

        await self._indexing_dispatcher.dispatch(document.id)

        return document

    async def get_document(self, document_id: int, workspace_id: int) -> Document:
        """Fetch a document, scoped to a workspace.

        Returns 404 for both "does not exist" and "belongs to a different
        workspace" — the caller can never distinguish the two.
        """
        document = await self._documents.get_by_id_and_workspace(document_id, workspace_id)
        if document is None:
            raise DocumentNotFoundError(f"Document {document_id} not found.")
        return document

    async def list_documents(self, workspace_id: int) -> list[Document]:
        return await self._documents.list_by_workspace(workspace_id)

    async def count_chunks(self, document_id: int) -> int:
        return await self._chunks.count_by_document_id(document_id)
