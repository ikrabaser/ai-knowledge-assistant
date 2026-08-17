"""Tool: list the calling user's own workspaces."""
from typing import Any

from pydantic import BaseModel

from app.services.workspace_service import WorkspaceService
from app.tools.base import BaseTool, ToolContext


class ListWorkspacesArgs(BaseModel):
    """No arguments — always scoped to the calling user."""


class ListWorkspacesTool(BaseTool):
    """Lists workspaces owned by the current user. Never sees other users' workspaces."""

    name = "list_workspaces"
    description = "List the current user's workspaces."
    args_model = ListWorkspacesArgs

    def __init__(self, workspace_service: WorkspaceService) -> None:
        self._workspace_service = workspace_service

    async def execute(self, args: ListWorkspacesArgs, context: ToolContext) -> dict[str, Any]:
        workspaces = await self._workspace_service.list_for_owner(context.user_id)
        return {
            "workspaces": [{"id": w.id, "name": w.name, "created_at": w.created_at.isoformat()} for w in workspaces]
        }
