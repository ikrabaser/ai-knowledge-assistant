"""Shared retrieval data types — split out so RetrievalService and RerankingService
can both depend on RetrievedChunk without an import cycle between them.
"""
from dataclasses import dataclass


@dataclass(frozen=True)
class RetrievedChunk:
    """A retrieved chunk paired with its similarity score and parent document metadata."""

    document_id: int
    filename: str
    chunk_index: int
    content: str
    similarity_score: float
