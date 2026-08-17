"""Tool: summarize a single document owned by the calling user."""
from typing import Any

from pydantic import BaseModel, Field

from app.core.exceptions import ToolExecutionError
from app.providers.base_chat_provider import ChatProvider
from app.repositories.chunk_repository import ChunkRepository
from app.services.document_service import DocumentService
from app.services.workspace_service import WorkspaceService
from app.tools.base import BaseTool, ToolContext

_MAX_CHARACTERS = 12000  # keep the summarization prompt bounded regardless of document size

_SUMMARIZE_SYSTEM_PROMPT = (
    "You are a precise summarizer. Summarize the given document excerpt in 3-5 sentences, "
    "using only the text provided. Do not add outside information."
)


class SummarizeDocumentArgs(BaseModel):
    workspace_id: int = Field(description="The workspace the document belongs to.")
    document_id: int = Field(description="The id of the document to summarize.")


class SummarizeDocumentTool(BaseTool):
    """Summarizes an indexed document's content using the configured chat provider."""

    name = "summarize_document"
    description = "Produce a short summary of a single document's content."
    args_model = SummarizeDocumentArgs

    def __init__(
        self,
        document_service: DocumentService,
        workspace_service: WorkspaceService,
        chunk_repository: ChunkRepository,
        chat_provider: ChatProvider,
    ) -> None:
        self._document_service = document_service
        self._workspace_service = workspace_service
        self._chunk_repository = chunk_repository
        self._chat_provider = chat_provider

    async def execute(self, args: SummarizeDocumentArgs, context: ToolContext) -> dict[str, Any]:
        await self._workspace_service.get_owned_workspace(args.workspace_id, context.user_id)
        document = await self._document_service.get_document(args.document_id, args.workspace_id)

        chunks = await self._chunk_repository.list_content_by_document_id(document.id)
        if not chunks:
            raise ToolExecutionError(f"Document {document.id} has no indexed content to summarize.")

        text = "\n\n".join(chunks)[:_MAX_CHARACTERS]
        summary = await self._chat_provider.complete(_SUMMARIZE_SYSTEM_PROMPT, text)

        return {"document_id": document.id, "filename": document.filename, "summary": summary.strip()}
