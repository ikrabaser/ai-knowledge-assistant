"""Tool: list documents in a workspace owned by the calling user."""
from typing import Any

from pydantic import BaseModel, Field

from app.services.document_service import DocumentService
from app.services.workspace_service import WorkspaceService
from app.tools.base import BaseTool, ToolContext


class ListDocumentsArgs(BaseModel):
    workspace_id: int = Field(description="The workspace to list documents from.")


class ListDocumentsTool(BaseTool):
    """Lists documents in a workspace. Authorization is checked before any data is returned."""

    name = "list_documents"
    description = "List the documents in a given workspace."
    args_model = ListDocumentsArgs

    def __init__(self, document_service: DocumentService, workspace_service: WorkspaceService) -> None:
        self._document_service = document_service
        self._workspace_service = workspace_service

    async def execute(self, args: ListDocumentsArgs, context: ToolContext) -> dict[str, Any]:
        await self._workspace_service.get_owned_workspace(args.workspace_id, context.user_id)
        documents = await self._document_service.list_documents(args.workspace_id)
        return {
            "documents": [
                {"id": d.id, "filename": d.filename, "status": d.status.value} for d in documents
            ]
        }
