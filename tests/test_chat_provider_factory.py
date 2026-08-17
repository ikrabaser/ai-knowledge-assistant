"""Tests for the LLM provider factory — no real network calls to OpenAI/Anthropic."""
import pytest

from app.core.config import Settings
from app.providers.anthropic_provider import AnthropicChatProvider
from app.providers.chat_provider_factory import UnsupportedLLMProviderError, create_chat_provider
from app.providers.openai_provider import OpenAIChatProvider


def _settings(**overrides) -> Settings:
    defaults = {
        "openai_api_key": "sk-test",
        "openai_chat_model": "gpt-4o-mini",
        "anthropic_api_key": "sk-ant-test",
        "anthropic_chat_model": "claude-3-5-sonnet-20241022",
    }
    defaults.update(overrides)
    return Settings(**defaults)


def test_create_chat_provider_returns_openai_by_default() -> None:
    provider = create_chat_provider(_settings(llm_provider="openai"))

    assert isinstance(provider, OpenAIChatProvider)


def test_create_chat_provider_returns_anthropic_when_configured() -> None:
    provider = create_chat_provider(_settings(llm_provider="anthropic"))

    assert isinstance(provider, AnthropicChatProvider)


def test_create_chat_provider_is_case_insensitive() -> None:
    provider = create_chat_provider(_settings(llm_provider="ANTHROPIC"))

    assert isinstance(provider, AnthropicChatProvider)


def test_create_chat_provider_rejects_unknown_provider() -> None:
    with pytest.raises(UnsupportedLLMProviderError):
        create_chat_provider(_settings(llm_provider="some-other-llm"))
