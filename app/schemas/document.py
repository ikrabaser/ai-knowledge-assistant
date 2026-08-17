"""Pydantic schemas for Document API responses."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.document import DocumentStatus


class DocumentResponse(BaseModel):
    """Document representation returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    filename: str
    content_type: str
    status: DocumentStatus
    error_message: str | None = None
    created_at: datetime
    updated_at: datetime


class DocumentUploadResponse(DocumentResponse):
    """Response returned right after a document has been uploaded.

    Indexing runs asynchronously — chunk_count is 0 (and status "uploaded") until
    the background worker finishes; poll GET /documents/{id}/status to observe it.
    """

    chunk_count: int = 0


class DocumentStatusResponse(BaseModel):
    """Lightweight, poll-friendly view of a document's indexing progress."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    status: DocumentStatus
    error_message: str | None = None
