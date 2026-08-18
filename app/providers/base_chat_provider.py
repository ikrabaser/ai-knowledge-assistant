"""Abstract interface for chat/completion providers, used by the RAG and agent pipelines."""
from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass(frozen=True)
class ToolSpec:
    """A tool definition exposed to the LLM, in a provider-agnostic shape."""

    name: str
    description: str
    parameters: dict  # JSON schema, as produced by a Pydantic model's model_json_schema()


@dataclass(frozen=True)
class RequestedToolCall:
    """One tool invocation the LLM asked for."""

    id: str
    name: str
    arguments: dict


@dataclass(frozen=True)
class ToolCallDecision:
    """The LLM's response to a tool-enabled prompt: either final text, or tool call requests."""

    text: str | None
    tool_calls: list[RequestedToolCall]


class ChatProvider(ABC):
    """Any provider capable of producing a chat completion from messages."""

    #: Short, provider-agnostic identifiers for observability/logging only
    #: (never used for branching logic — see chat_provider_factory for that).
    provider_name: str = "unknown"
    model: str = "unknown"

    @abstractmethod
    async def complete(self, system_prompt: str, user_prompt: str) -> str:
        """Return the model's answer text given a system and user prompt."""
        ...

    @abstractmethod
    async def decide_tool_calls(
        self, system_prompt: str, user_prompt: str, tools: list[ToolSpec]
    ) -> ToolCallDecision:
        """Ask the model to either answer directly or request one or more tool calls."""
        ...
