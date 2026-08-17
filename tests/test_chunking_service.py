"""Tests for ChunkingService."""
import pytest

from app.services.chunking_service import ChunkingService


def test_split_returns_empty_list_for_empty_text() -> None:
    service = ChunkingService(chunk_size=10, chunk_overlap=2)

    assert service.split("") == []


def test_split_produces_sequential_indexes() -> None:
    service = ChunkingService(chunk_size=20, chunk_overlap=5)
    text = "word " * 200

    chunks = service.split(text)

    assert len(chunks) > 1
    assert [c.chunk_index for c in chunks] == list(range(len(chunks)))


def test_split_respects_chunk_size_upper_bound() -> None:
    service = ChunkingService(chunk_size=20, chunk_overlap=5)
    text = "word " * 200

    chunks = service.split(text)

    assert all(c.token_count <= 20 for c in chunks)


def test_split_single_short_text_returns_one_chunk() -> None:
    service = ChunkingService(chunk_size=100, chunk_overlap=10)

    chunks = service.split("This is a short sentence.")

    assert len(chunks) == 1
    assert chunks[0].chunk_index == 0


def test_invalid_overlap_raises_value_error() -> None:
    with pytest.raises(ValueError):
        ChunkingService(chunk_size=10, chunk_overlap=10)
