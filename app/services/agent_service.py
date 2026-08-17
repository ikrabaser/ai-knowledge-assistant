"""Orchestrates the LLM function-calling pipeline.

    LLM -> Tool Request -> Tool Registry -> Argument Validation -> Authorization Check
        -> Tool Execution -> Structured Result -> LLM Response

A single round: the model either answers directly, or requests one or more tool
calls; every requested call is validated, authorization-checked and executed
through ToolExecutionService (never allowed to touch another user's data); the
structured results are then handed back to the model to produce the final answer.
No loop — this can't run away regardless of what the model asks for.
"""
import json

from app.core.logging import get_logger
from app.providers.base_chat_provider import ChatProvider
from app.services.tool_execution_service import ToolExecutionResult, ToolExecutionService
from app.tools.base import ToolContext
from app.tools.registry import ToolRegistry

logger = get_logger(__name__)

SYSTEM_PROMPT = (
    "You are a knowledge assistant with access to a small set of read-only tools for "
    "inspecting the user's own workspaces and documents. Use a tool only when it is "
    "needed to answer the question. Never invent tool results or workspace/document "
    "data you were not given."
)

FINAL_ANSWER_SYSTEM_PROMPT = (
    "You are a knowledge assistant. Answer the user's question using ONLY the tool "
    "results provided below. If a tool failed or returned nothing useful, say so "
    "plainly instead of guessing."
)


class AgentAskResponse:
    """Result of an agent turn: the final answer plus a log of any tool calls made."""

    def __init__(self, answer: str, tool_calls: list[ToolExecutionResult]) -> None:
        self.answer = answer
        self.tool_calls = tool_calls


class AgentService:
    """Answers a question, letting the LLM call tools when it decides it needs to."""

    def __init__(
        self,
        chat_provider: ChatProvider,
        tool_registry: ToolRegistry,
        tool_execution_service: ToolExecutionService,
    ) -> None:
        self._chat_provider = chat_provider
        self._tool_registry = tool_registry
        self._tool_execution_service = tool_execution_service

    async def ask(self, question: str, user_id: int) -> AgentAskResponse:
        question = question.strip()
        context = ToolContext(user_id=user_id)

        decision = await self._chat_provider.decide_tool_calls(
            SYSTEM_PROMPT, question, self._tool_registry.specs()
        )

        if not decision.tool_calls:
            return AgentAskResponse(answer=(decision.text or "").strip(), tool_calls=[])

        results: list[ToolExecutionResult] = []
        for call in decision.tool_calls:
            result = await self._tool_execution_service.execute(call.id, call.name, call.arguments, context)
            results.append(result)

        results_text = "\n".join(
            f"- {r.name}: {'OK — ' + json.dumps(r.result) if r.success else 'FAILED — ' + (r.error or '')}"
            for r in results
        )
        follow_up_prompt = f"Question: {question}\n\nTool results:\n{results_text}\n\nAnswer:"

        answer = await self._chat_provider.complete(FINAL_ANSWER_SYSTEM_PROMPT, follow_up_prompt)
        return AgentAskResponse(answer=answer.strip(), tool_calls=results)
