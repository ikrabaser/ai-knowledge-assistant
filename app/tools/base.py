"""Base abstractions for LLM-callable tools.

Every tool: declares its arguments as a Pydantic model (so arguments are always
validated before execution — the LLM's raw JSON never reaches business logic
unchecked), and receives a ToolContext carrying the authenticated user id so it
can enforce that the caller only ever touches their own data.

Tools intentionally never expose shell execution, arbitrary code execution,
filesystem access outside the managed pipeline, or raw SQL — only specific,
narrow, read-only application operations.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any

from pydantic import BaseModel


@dataclass(frozen=True)
class ToolContext:
    """Authorization context a tool executes under."""

    user_id: int


class BaseTool(ABC):
    """A single named, LLM-callable application capability."""

    name: str
    description: str
    args_model: type[BaseModel]

    @abstractmethod
    async def execute(self, args: BaseModel, context: ToolContext) -> dict[str, Any]:
        """Run the tool and return a JSON-serializable structured result."""
        ...
