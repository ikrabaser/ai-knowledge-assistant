"""Validates arguments, enforces authorization and executes a single tool call safely."""
from dataclasses import dataclass
from typing import Any

from pydantic import ValidationError

from app.core.exceptions import AppError
from app.core.logging import get_logger
from app.tools.base import ToolContext
from app.tools.registry import ToolRegistry

logger = get_logger(__name__)


@dataclass(frozen=True)
class ToolExecutionResult:
    """The structured outcome of a single tool call — always returned, never raised."""

    tool_call_id: str
    name: str
    success: bool
    result: dict[str, Any] | None
    error: str | None


class ToolExecutionService:
    """Runs the Tool Registry -> Argument Validation -> Authorization -> Execution pipeline.

    A tool call can fail for many reasons (unknown tool, bad arguments, the user
    doesn't own the referenced workspace/document, a downstream error) — none of
    those should ever crash the request. Every outcome is captured as a structured
    ToolExecutionResult and logged, so the LLM (and the caller) always gets a clean
    answer back instead of a 500.
    """

    def __init__(self, registry: ToolRegistry) -> None:
        self._registry = registry

    async def execute(self, tool_call_id: str, name: str, raw_arguments: dict, context: ToolContext) -> ToolExecutionResult:
        tool = self._registry.get(name)
        if tool is None:
            logger.warning("Rejected call to unknown tool '%s' (user_id=%s)", name, context.user_id)
            return ToolExecutionResult(tool_call_id, name, False, None, f"Unknown tool '{name}'.")

        try:
            args = tool.args_model.model_validate(raw_arguments)
        except ValidationError as exc:
            logger.warning("Rejected invalid arguments for tool '%s' (user_id=%s): %s", name, context.user_id, exc)
            return ToolExecutionResult(tool_call_id, name, False, None, f"Invalid arguments: {exc}")

        try:
            result = await tool.execute(args, context)
        except AppError as exc:
            # Includes authorization failures (e.g. WorkspaceNotFoundError for a
            # workspace/document the caller doesn't own) — logged, not leaked as a 500.
            logger.warning("Tool '%s' failed for user_id=%s: %s", name, context.user_id, exc.message)
            return ToolExecutionResult(tool_call_id, name, False, None, exc.message)
        except Exception:
            logger.exception("Unexpected error executing tool '%s' (user_id=%s)", name, context.user_id)
            return ToolExecutionResult(tool_call_id, name, False, None, "Tool execution failed.")

        logger.info("Tool '%s' succeeded (user_id=%s)", name, context.user_id)
        return ToolExecutionResult(tool_call_id, name, True, result, None)
