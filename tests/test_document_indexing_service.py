"""Tests for DocumentIndexingService: the pipeline a Celery worker actually runs."""
from pathlib import Path

import pytest

from app.models.document import DocumentStatus
from app.services.chunking_service import ChunkingService
from app.services.document_indexing_service import DocumentIndexingService
from app.services.embedding_service import EmbeddingService
from app.services.parsing_service import ParsingService
from tests.fakes import FakeChunkRepository, FakeDocumentRepository, FakeEmbeddingProvider


def _build_indexing_service(tmp_path, document_repository, chunk_repository) -> DocumentIndexingService:
    return DocumentIndexingService(
        document_repository=document_repository,
        chunk_repository=chunk_repository,
        parsing_service=ParsingService(),
        chunking_service=ChunkingService(chunk_size=50, chunk_overlap=10),
        embedding_service=EmbeddingService(FakeEmbeddingProvider()),
        upload_directory=str(tmp_path),
    )


@pytest.mark.asyncio
async def test_index_reads_the_file_from_disk_and_produces_chunks(tmp_path) -> None:
    documents = FakeDocumentRepository()
    chunks = FakeChunkRepository()
    document = await documents.create(
        filename="handbook.txt", stored_filename="stored.txt", content_type="text/plain", workspace_id=1
    )
    (Path(tmp_path) / "stored.txt").write_text("Annual leave policy: 14 days per year. " * 10, encoding="utf-8")

    service = _build_indexing_service(tmp_path, documents, chunks)
    await service.index(document.id)

    assert document.status == DocumentStatus.INDEXED
    assert document.error_message is None
    assert len(chunks.created_chunks) > 0


@pytest.mark.asyncio
async def test_index_marks_document_failed_when_file_is_missing(tmp_path) -> None:
    documents = FakeDocumentRepository()
    chunks = FakeChunkRepository()
    document = await documents.create(
        filename="handbook.txt", stored_filename="never-written.txt", content_type="text/plain", workspace_id=1
    )

    service = _build_indexing_service(tmp_path, documents, chunks)
    with pytest.raises(Exception):
        await service.index(document.id)

    assert document.status == DocumentStatus.FAILED
    assert document.error_message


@pytest.mark.asyncio
async def test_index_marks_document_failed_on_unreadable_content(tmp_path) -> None:
    documents = FakeDocumentRepository()
    chunks = FakeChunkRepository()
    document = await documents.create(
        filename="handbook.pdf", stored_filename="stored.pdf", content_type="application/pdf", workspace_id=1
    )
    (Path(tmp_path) / "stored.pdf").write_bytes(b"not a real pdf")

    service = _build_indexing_service(tmp_path, documents, chunks)
    with pytest.raises(Exception):
        await service.index(document.id)

    assert document.status == DocumentStatus.FAILED
    assert document.error_message


@pytest.mark.asyncio
async def test_index_is_a_no_op_for_an_unknown_document_id(tmp_path) -> None:
    documents = FakeDocumentRepository()
    chunks = FakeChunkRepository()
    service = _build_indexing_service(tmp_path, documents, chunks)

    # Must not raise — a worker picking up a task for a since-deleted document
    # should log and move on, not crash.
    await service.index(999)


@pytest.mark.asyncio
async def test_reindexing_replaces_previous_chunks_without_duplication(tmp_path) -> None:
    documents = FakeDocumentRepository()
    chunks = FakeChunkRepository()
    document = await documents.create(
        filename="handbook.txt", stored_filename="stored.txt", content_type="text/plain", workspace_id=1
    )
    (Path(tmp_path) / "stored.txt").write_text("Some content here. " * 20, encoding="utf-8")
    service = _build_indexing_service(tmp_path, documents, chunks)

    await service.index(document.id)
    first_count = len(chunks.created_chunks)
    await service.index(document.id)
    second_count = len(chunks.created_chunks)

    assert first_count == second_count
