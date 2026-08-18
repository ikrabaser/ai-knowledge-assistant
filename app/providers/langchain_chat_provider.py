"""ChatProvider implementation backed by any LangChain `BaseChatModel`.

LangChain normalizes OpenAI's and Anthropic's very different native tool-calling
wire formats into one shape (`AIMessage.tool_calls`), so a single implementation
here drives both `OpenAIChatProvider` and `AnthropicChatProvider` — they only
differ in which LangChain chat model they construct.
"""
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import HumanMessage, SystemMessage

from app.providers.base_chat_provider import ChatProvider, RequestedToolCall, ToolCallDecision, ToolSpec


def _tool_spec_to_openai_format(tool: ToolSpec) -> dict:
    # LangChain's `bind_tools` accepts OpenAI-format function schemas for every
    # chat model it wraps (including ChatAnthropic, which converts them
    # internally) — one schema shape, both providers.
    return {
        "type": "function",
        "function": {"name": tool.name, "description": tool.description, "parameters": tool.parameters},
    }


def _content_to_text(content) -> str | None:
    if isinstance(content, str):
        return content or None
    # Some providers can return a list of content blocks instead of a plain
    # string; join any text segments and drop anything else (e.g. tool blocks
    # already represented separately via `.tool_calls`).
    if isinstance(content, list):
        text = "".join(block for block in content if isinstance(block, str))
        return text or None
    return None


class LangChainChatProvider(ChatProvider):
    """Generates completions and tool-call decisions via a LangChain chat model."""

    def __init__(self, chat_model: BaseChatModel, model: str) -> None:
        self._chat_model = chat_model
        self.model = model

    async def complete(self, system_prompt: str, user_prompt: str) -> str:
        response = await self._chat_model.ainvoke(
            [SystemMessage(content=system_prompt), HumanMessage(content=user_prompt)]
        )
        return _content_to_text(response.content) or ""

    async def decide_tool_calls(
        self, system_prompt: str, user_prompt: str, tools: list[ToolSpec]
    ) -> ToolCallDecision:
        bound_model = self._chat_model.bind_tools([_tool_spec_to_openai_format(t) for t in tools])
        response = await bound_model.ainvoke(
            [SystemMessage(content=system_prompt), HumanMessage(content=user_prompt)]
        )
        tool_calls = [
            RequestedToolCall(id=call["id"], name=call["name"], arguments=call["args"])
            for call in response.tool_calls
        ]
        return ToolCallDecision(text=_content_to_text(response.content), tool_calls=tool_calls)
