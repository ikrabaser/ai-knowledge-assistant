"""Tests for AgentService: the tool-calling decision -> execution -> final-answer loop."""
import pytest

from app.providers.base_chat_provider import RequestedToolCall, ToolCallDecision
from app.services.agent_service import AgentService
from app.services.tool_execution_service import ToolExecutionService
from app.services.workspace_service import WorkspaceService
from app.tools.list_workspaces_tool import ListWorkspacesTool
from app.tools.registry import ToolRegistry
from tests.fakes import FakeChatProvider, FakeWorkspaceRepository

OWNER_ID = 1


async def _build_agent(tool_decision: ToolCallDecision | None, final_answer: str = "The final answer.") -> tuple[AgentService, FakeChatProvider]:
    workspace_repository = FakeWorkspaceRepository()
    workspace_service = WorkspaceService(workspace_repository)
    await workspace_service.create(name="My Workspace", owner_id=OWNER_ID)

    registry = ToolRegistry([ListWorkspacesTool(workspace_service)])
    chat_provider = FakeChatProvider(answer=final_answer, tool_decision=tool_decision)
    tool_execution_service = ToolExecutionService(registry)

    agent = AgentService(
        chat_provider=chat_provider, tool_registry=registry, tool_execution_service=tool_execution_service
    )
    return agent, chat_provider


@pytest.mark.asyncio
async def test_agent_answers_directly_when_no_tool_is_needed() -> None:
    agent, _ = await _build_agent(tool_decision=ToolCallDecision(text="Direct answer.", tool_calls=[]))

    response = await agent.ask("What is 2+2?", user_id=OWNER_ID)

    assert response.answer == "Direct answer."
    assert response.tool_calls == []


@pytest.mark.asyncio
async def test_agent_executes_a_requested_tool_and_synthesizes_a_final_answer() -> None:
    decision = ToolCallDecision(
        text=None, tool_calls=[RequestedToolCall(id="call-1", name="list_workspaces", arguments={})]
    )
    agent, chat_provider = await _build_agent(tool_decision=decision, final_answer="You have 1 workspace.")

    response = await agent.ask("What workspaces do I have?", user_id=OWNER_ID)

    assert response.answer == "You have 1 workspace."
    assert len(response.tool_calls) == 1
    assert response.tool_calls[0].name == "list_workspaces"
    assert response.tool_calls[0].success is True
    assert response.tool_calls[0].result["workspaces"][0]["name"] == "My Workspace"
    # The tool result must have been folded into the follow-up prompt sent to the LLM.
    assert "My Workspace" in chat_provider.last_user_prompt


@pytest.mark.asyncio
async def test_agent_surfaces_a_failed_tool_call_without_crashing() -> None:
    decision = ToolCallDecision(
        text=None, tool_calls=[RequestedToolCall(id="call-1", name="not_a_real_tool", arguments={})]
    )
    agent, _ = await _build_agent(tool_decision=decision, final_answer="I could not find that information.")

    response = await agent.ask("Do something unsupported.", user_id=OWNER_ID)

    assert response.tool_calls[0].success is False
    assert response.answer == "I could not find that information."
