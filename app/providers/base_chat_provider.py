"""Abstract interface for chat/completion providers, used by the RAG pipeline."""
from abc import ABC, abstractmethod


class ChatProvider(ABC):
    """Any provider capable of producing a chat completion from messages."""

    @abstractmethod
    async def complete(self, system_prompt: str, user_prompt: str) -> str:
        """Return the model's answer text given a system and user prompt."""
        ...
