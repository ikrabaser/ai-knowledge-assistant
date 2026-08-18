"""Anthropic implementation of the chat provider interface."""
from anthropic import AsyncAnthropic

from app.providers.base_chat_provider import ChatProvider, RequestedToolCall, ToolCallDecision, ToolSpec


class AnthropicChatProvider(ChatProvider):
    """Chat completion provider backed by the Anthropic Messages API."""

    provider_name = "anthropic"

    def __init__(self, client: AsyncAnthropic, model: str) -> None:
        self._client = client
        self._model = model
        self.model = model

    async def complete(self, system_prompt: str, user_prompt: str) -> str:
        response = await self._client.messages.create(
            model=self._model,
            max_tokens=1024,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        )
        return "".join(block.text for block in response.content if block.type == "text")

    async def decide_tool_calls(
        self, system_prompt: str, user_prompt: str, tools: list[ToolSpec]
    ) -> ToolCallDecision:
        anthropic_tools = [
            {"name": t.name, "description": t.description, "input_schema": t.parameters} for t in tools
        ]
        response = await self._client.messages.create(
            model=self._model,
            max_tokens=1024,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
            tools=anthropic_tools,
        )
        tool_calls = [
            RequestedToolCall(id=block.id, name=block.name, arguments=block.input)
            for block in response.content
            if block.type == "tool_use"
        ]
        text = "".join(block.text for block in response.content if block.type == "text")
        return ToolCallDecision(text=text or None, tool_calls=tool_calls)
