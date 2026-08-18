"""Anthropic implementation of the chat provider interface, via LangChain."""
from langchain_anthropic import ChatAnthropic

from app.providers.langchain_chat_provider import LangChainChatProvider


class AnthropicChatProvider(LangChainChatProvider):
    """Chat completion provider backed by LangChain's `ChatAnthropic` wrapper."""

    provider_name = "anthropic"

    def __init__(self, api_key: str, model: str) -> None:
        chat_model = ChatAnthropic(api_key=api_key, model=model, max_tokens=1024, temperature=0.2)
        super().__init__(chat_model=chat_model, model=model)
