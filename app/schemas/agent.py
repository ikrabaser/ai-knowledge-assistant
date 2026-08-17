"""Pydantic schemas for the agent (LLM function-calling) endpoint."""
from typing import Any

from pydantic import BaseModel, Field


class AgentAskRequest(BaseModel):
    """Request body for POST /api/v1/agent/ask."""

    question: str = Field(min_length=1, max_length=2000)


class ToolCallSummary(BaseModel):
    """A single tool call the agent made, and its outcome."""

    name: str
    success: bool
    result: dict[str, Any] | None = None
    error: str | None = None


class AgentAskResponse(BaseModel):
    """Response body for POST /api/v1/agent/ask."""

    answer: str
    tool_calls: list[ToolCallSummary]
