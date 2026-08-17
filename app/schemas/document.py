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
    """Response returned right after a document has been uploaded and processed."""

    chunk_count: int = 0
