"""OpenAI implementations of the embedding and chat provider interfaces, via LangChain."""
from langchain_openai import ChatOpenAI, OpenAIEmbeddings

from app.providers.base_embedding_provider import EmbeddingProvider
from app.providers.langchain_chat_provider import LangChainChatProvider


class OpenAIEmbeddingProvider(EmbeddingProvider):
    """Embedding provider backed by LangChain's `OpenAIEmbeddings` wrapper."""

    def __init__(self, api_key: str, model: str) -> None:
        self._embeddings = OpenAIEmbeddings(api_key=api_key, model=model)

    async def embed_text(self, text: str) -> list[float]:
        return await self._embeddings.aembed_query(text)

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        return await self._embeddings.aembed_documents(texts)


class OpenAIChatProvider(LangChainChatProvider):
    """Chat completion provider backed by LangChain's `ChatOpenAI` wrapper."""

    provider_name = "openai"

    def __init__(self, api_key: str, model: str) -> None:
        chat_model = ChatOpenAI(api_key=api_key, model=model, temperature=0.2)
        super().__init__(chat_model=chat_model, model=model)
