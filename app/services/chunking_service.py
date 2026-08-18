"""Splits extracted document text into overlapping, token-bounded chunks.

Uses LangChain's `TokenTextSplitter`, which walks the text in raw tiktoken-token
space (rather than characters) so `chunk_size`/`chunk_overlap` mean exactly what
they say regardless of language or punctuation density.
"""
from dataclasses import dataclass

import tiktoken
from langchain_text_splitters import TokenTextSplitter

_ENCODING_NAME = "cl100k_base"
_encoding = tiktoken.get_encoding(_ENCODING_NAME)


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
        self._splitter = TokenTextSplitter(
            encoding_name=_ENCODING_NAME, chunk_size=chunk_size, chunk_overlap=chunk_overlap
        )

    def split(self, text: str) -> list[TextChunk]:
        chunks: list[TextChunk] = []
        for raw_chunk in self._splitter.split_text(text):
            content = raw_chunk.strip()
            if not content:
                continue
            chunks.append(
                TextChunk(content=content, chunk_index=len(chunks), token_count=len(_encoding.encode(content)))
            )
        return chunks
