"""Tool: fetch metadata for a single document owned by the calling user."""
from typing import Any

from pydantic import BaseModel, Field

from app.services.document_service import DocumentService
from app.services.workspace_service import WorkspaceService
from app.tools.base import BaseTool, ToolContext


class GetDocumentArgs(BaseModel):
    workspace_id: int = Field(description="The workspace the document belongs to.")
    document_id: int = Field(description="The id of the document to fetch.")


class GetDocumentTool(BaseTool):
    """Fetches a single document's metadata. Authorization is checked before returning anything."""

    name = "get_document"
    description = "Get metadata (filename, status) for a single document by id."
    args_model = GetDocumentArgs

    def __init__(self, document_service: DocumentService, workspace_service: WorkspaceService) -> None:
        self._document_service = document_service
        self._workspace_service = workspace_service

    async def execute(self, args: GetDocumentArgs, context: ToolContext) -> dict[str, Any]:
        await self._workspace_service.get_owned_workspace(args.workspace_id, context.user_id)
        document = await self._document_service.get_document(args.document_id, args.workspace_id)
        return {
            "id": document.id,
            "filename": document.filename,
            "content_type": document.content_type,
            "status": document.status.value,
            "created_at": document.created_at.isoformat(),
        }
