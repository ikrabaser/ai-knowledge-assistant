"""Retrieval-Augmented Generation pipeline: retrieve context, then ask the LLM to answer."""
from app.core.exceptions import ChatProviderError
from app.core.logging import get_logger
from app.providers.base_chat_provider import ChatProvider
from app.schemas.rag import AskResponse, SourceItem
from app.services.retrieval_service import RetrievalService

logger = get_logger(__name__)

NO_CONTEXT_ANSWER = "Yüklenen belgelerde bu soruyu cevaplamak için yeterli bilgi bulunamadı."

SYSTEM_PROMPT = (
    "You are a careful knowledge assistant. Answer the user's question using ONLY the "
    "context excerpts provided below. Do not use any outside knowledge and do not make "
    "assumptions beyond what the context states. If the context does not contain enough "
    "information to answer the question, respond in Turkish exactly with: "
    f"'{NO_CONTEXT_ANSWER}'. Otherwise, answer in the same language as the question, "
    "concisely and accurately."
)


class RagService:
    """Combines semantic retrieval with an LLM chat completion to answer questions."""

    def __init__(self, retrieval_service: RetrievalService, chat_provider: ChatProvider) -> None:
        self._retrieval_service = retrieval_service
        self._chat_provider = chat_provider

    def _build_prompt(self, question: str, chunks: list) -> str:
        context_blocks = "\n\n".join(
            f"[Source {i + 1} — {chunk.filename}, chunk {chunk.chunk_index}]\n{chunk.content}"
            for i, chunk in enumerate(chunks)
        )
        return f"Context:\n{context_blocks}\n\nQuestion: {question}\n\nAnswer:"

    async def ask(self, question: str) -> AskResponse:
        question = question.strip()
        chunks = await self._retrieval_service.search(question)

        if not chunks:
            return AskResponse(answer=NO_CONTEXT_ANSWER, sources=[])

        prompt = self._build_prompt(question, chunks)
        try:
            answer = await self._chat_provider.complete(SYSTEM_PROMPT, prompt)
        except Exception as exc:
            logger.exception("Chat completion failed while answering question")
            raise ChatProviderError(f"Failed to generate an answer: {exc}") from exc

        sources = [
            SourceItem(
                document_id=chunk.document_id,
                filename=chunk.filename,
                chunk_index=chunk.chunk_index,
                similarity_score=chunk.similarity_score,
            )
            for chunk in chunks
        ]
        return AskResponse(answer=answer.strip() or NO_CONTEXT_ANSWER, sources=sources)
