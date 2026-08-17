"""Tests for DocumentService: validation, storage safety and the ingestion pipeline."""
import pytest

from app.core.exceptions import DocumentNotFoundError, FileTooLargeError, UnsupportedFileTypeError
from app.models.document import DocumentStatus
from app.services.chunking_service import ChunkingService
from app.services.document_service import DocumentService
from app.services.embedding_service import EmbeddingService
from app.services.parsing_service import ParsingService
from tests.fakes import FakeChunkRepository, FakeDocumentRepository, FakeEmbeddingProvider


def _build_service(tmp_path, max_upload_size_mb: int = 1) -> DocumentService:
    return DocumentService(
        document_repository=FakeDocumentRepository(),
        chunk_repository=FakeChunkRepository(),
        parsing_service=ParsingService(),
        chunking_service=ChunkingService(chunk_size=50, chunk_overlap=10),
        embedding_service=EmbeddingService(FakeEmbeddingProvider(dimensions=8)),
        upload_directory=str(tmp_path),
        max_upload_size_mb=max_upload_size_mb,
    )


@pytest.mark.asyncio
async def test_upload_and_process_indexes_a_valid_txt_document(tmp_path) -> None:
    service = _build_service(tmp_path)
    content = "Annual leave policy: employees get 14 days per year. " * 10

    document = await service.upload_and_process("handbook.txt", "text/plain", content.encode("utf-8"))

    assert document.status == DocumentStatus.INDEXED
    assert document.error_message is None
    stored_files = list(tmp_path.iterdir())
    assert len(stored_files) == 1
    # The stored filename must never be derived from user input.
    assert stored_files[0].name != "handbook.txt"
    assert await service.count_chunks(document.id) > 0


@pytest.mark.asyncio
async def test_upload_rejects_unsupported_content_type(tmp_path) -> None:
    service = _build_service(tmp_path)

    with pytest.raises(UnsupportedFileTypeError):
        await service.upload_and_process("malware.exe", "application/x-msdownload", b"data")


@pytest.mark.asyncio
async def test_upload_rejects_oversized_file(tmp_path) -> None:
    service = _build_service(tmp_path, max_upload_size_mb=1)
    oversized_content = b"a" * (2 * 1024 * 1024)

    with pytest.raises(FileTooLargeError):
        await service.upload_and_process("big.txt", "text/plain", oversized_content)


@pytest.mark.asyncio
async def test_upload_marks_document_as_failed_on_empty_text(tmp_path) -> None:
    service = _build_service(tmp_path)

    with pytest.raises(Exception):
        await service.upload_and_process("empty.txt", "text/plain", b"   ")


@pytest.mark.asyncio
async def test_get_document_raises_not_found_for_unknown_id(tmp_path) -> None:
    service = _build_service(tmp_path)

    with pytest.raises(DocumentNotFoundError):
        await service.get_document(999)
