"""Anthropic implementation of the chat provider interface."""
from anthropic import AsyncAnthropic

from app.providers.base_chat_provider import ChatProvider


class AnthropicChatProvider(ChatProvider):
    """Chat completion provider backed by the Anthropic Messages API."""

    def __init__(self, client: AsyncAnthropic, model: str) -> None:
        self._client = client
        self._model = model

    async def complete(self, system_prompt: str, user_prompt: str) -> str:
        response = await self._client.messages.create(
            model=self._model,
            max_tokens=1024,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        )
        return "".join(block.text for block in response.content if block.type == "text")
