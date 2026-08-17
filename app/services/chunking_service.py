"""Splits extracted document text into overlapping, token-bounded chunks."""
from dataclasses import dataclass

import tiktoken

_ENCODING = tiktoken.get_encoding("cl100k_base")


@dataclass(frozen=True)
class TextChunk:
    """A single chunk of text produced by the chunking service."""

    content: str
    chunk_index: int
    token_count: int


class ChunkingService:
    """Breaks raw text into overlapping chunks sized by token count."""

    def __init__(self, chunk_size: int, chunk_overlap: int) -> None:
        if chunk_size <= 0:
            raise ValueError("chunk_size must be positive")
        if chunk_overlap < 0 or chunk_overlap >= chunk_size:
            raise ValueError("chunk_overlap must be non-negative and smaller than chunk_size")
        self._chunk_size = chunk_size
        self._chunk_overlap = chunk_overlap

    def split(self, text: str) -> list[TextChunk]:
        tokens = _ENCODING.encode(text)
        if not tokens:
            return []

        chunks: list[TextChunk] = []
        step = self._chunk_size - self._chunk_overlap
        start = 0
        index = 0
        while start < len(tokens):
            end = min(start + self._chunk_size, len(tokens))
            token_slice = tokens[start:end]
            content = _ENCODING.decode(token_slice).strip()
            if content:
                chunks.append(TextChunk(content=content, chunk_index=index, token_count=len(token_slice)))
                index += 1
            if end == len(tokens):
                break
            start += step
        return chunks
