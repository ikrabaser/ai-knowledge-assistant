"""Pydantic schemas for conversation and message endpoints."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.message import MessageRole
from app.schemas.rag import SourceItem


class ConversationCreateRequest(BaseModel):
    """Request body for POST /api/v1/conversations."""

    workspace_id: int
    title: str = Field(default="New Conversation", min_length=1, max_length=255)


class MessageResponse(BaseModel):
    """A single stored message."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    role: MessageRole
    content: str
    created_at: datetime


class ConversationResponse(BaseModel):
    """Conversation representation without its messages (list view)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    workspace_id: int
    title: str
    created_at: datetime
    updated_at: datetime


class ConversationDetailResponse(ConversationResponse):
    """Conversation representation including its full message history."""

    messages: list[MessageResponse]


class MessageCreateRequest(BaseModel):
    """Request body for POST /api/v1/conversations/{id}/messages — the user's question."""

    content: str = Field(min_length=1, max_length=2000)


class MessageCreateResponse(BaseModel):
    """Response after posting a message: the stored user message and the generated answer."""

    user_message: MessageResponse
    assistant_message: MessageResponse
    sources: list[SourceItem]
