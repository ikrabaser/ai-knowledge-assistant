"""Selects a ChatProvider implementation based on configuration.

Keeps provider-specific branching out of the business logic (RagService/routes):
those only ever see the ChatProvider interface, never know which LLM is behind it.
"""
from app.core.config import Settings
from app.core.exceptions import AppError
from app.providers.anthropic_provider import AnthropicChatProvider
from app.providers.base_chat_provider import ChatProvider
from app.providers.openai_provider import OpenAIChatProvider

SUPPORTED_PROVIDERS = ("openai", "anthropic")


class UnsupportedLLMProviderError(AppError):
    """Raised when LLM_PROVIDER is set to an unrecognized value."""

    status_code = 500


def create_chat_provider(settings: Settings) -> ChatProvider:
    """Build the configured ChatProvider (LLM_PROVIDER=openai|anthropic)."""
    provider_name = settings.llm_provider.strip().lower()

    if provider_name == "openai":
        return OpenAIChatProvider(api_key=settings.openai_api_key, model=settings.openai_chat_model)

    if provider_name == "anthropic":
        return AnthropicChatProvider(api_key=settings.anthropic_api_key, model=settings.anthropic_chat_model)

    raise UnsupportedLLMProviderError(
        f"Unsupported LLM_PROVIDER '{settings.llm_provider}'. Supported: {', '.join(SUPPORTED_PROVIDERS)}."
    )
