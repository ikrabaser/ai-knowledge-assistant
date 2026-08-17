"""Pydantic schemas for the semantic search endpoint."""
from pydantic import BaseModel, Field


class SearchRequest(BaseModel):
    """Request body for POST /api/v1/search."""

    query: str = Field(min_length=1, max_length=2000)
    limit: int = Field(default=5, ge=1, le=50)


class SearchResultItem(BaseModel):
    """A single retrieved chunk with its similarity score."""

    document_id: int
    filename: str
    chunk_index: int
    content: str
    similarity_score: float


class SearchResponse(BaseModel):
    """Response body for POST /api/v1/search."""

    query: str
    results: list[SearchResultItem]
