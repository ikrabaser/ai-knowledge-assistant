"""Pydantic schemas for workspace endpoints."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class WorkspaceCreateRequest(BaseModel):
    """Request body for POST /api/v1/workspaces."""

    name: str = Field(min_length=1, max_length=255)


class WorkspaceResponse(BaseModel):
    """Workspace representation returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    owner_id: int
    created_at: datetime
    updated_at: datetime
