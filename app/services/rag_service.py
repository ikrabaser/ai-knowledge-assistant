"""Retrieval-Augmented Generation pipeline: retrieve context, then ask the LLM to answer."""
from dataclasses import dataclass

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
    "assumptions beyond what the context states. Prior conversation turns are given only "
    "to help you understand what the user is referring to (e.g. 'it', 'that policy') — "
    "never treat them as a source of facts by themselves. If the context does not contain "
    "enough information to answer the question, respond in Turkish exactly with: "
    f"'{NO_CONTEXT_ANSWER}'. Otherwise, answer in the same language as the question, "
    "concisely and accurately."
)


@dataclass(frozen=True)
class HistoryTurn:
    """One prior turn of a conversation, fed back into the prompt for context."""

    role: str
    content: str


class RagService:
    """Combines semantic retrieval with an LLM chat completion to answer questions."""

    def __init__(self, retrieval_service: RetrievalService, chat_provider: ChatProvider) -> None:
        self._retrieval_service = retrieval_service
        self._chat_provider = chat_provider

    def _build_prompt(self, question: str, chunks: list, history: list[HistoryTurn]) -> str:
        context_blocks = "\n\n".join(
            f"[Source {i + 1} — {chunk.filename}, chunk {chunk.chunk_index}]\n{chunk.content}"
            for i, chunk in enumerate(chunks)
        )
        parts = []
        if history:
            history_text = "\n".join(f"{turn.role}: {turn.content}" for turn in history)
            parts.append(f"Previous conversation:\n{history_text}")
        parts.append(f"Context:\n{context_blocks}")
        parts.append(f"Question: {question}\n\nAnswer:")
        return "\n\n".join(parts)

    async def ask(
        self,
        question: str,
        workspace_id: int,
        history: list[HistoryTurn] | None = None,
    ) -> AskResponse:
        question = question.strip()
        chunks = await self._retrieval_service.search(question, workspace_id=workspace_id)

        if not chunks:
            return AskResponse(answer=NO_CONTEXT_ANSWER, sources=[])

        prompt = self._build_prompt(question, chunks, history or [])
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
