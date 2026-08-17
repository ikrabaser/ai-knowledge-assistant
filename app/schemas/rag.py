"""Pydantic schemas for the RAG question-answering endpoint."""
from pydantic import BaseModel, Field


class AskRequest(BaseModel):
    """Request body for POST /api/v1/ask."""

    workspace_id: int
    question: str = Field(min_length=1, max_length=2000)


class SourceItem(BaseModel):
    """A source chunk that was used to construct the answer."""

    document_id: int
    filename: str
    chunk_index: int
    similarity_score: float


class AskResponse(BaseModel):
    """Response body for POST /api/v1/ask."""

    answer: str
    sources: list[SourceItem]
