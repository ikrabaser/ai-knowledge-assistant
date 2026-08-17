"""Workspace creation and ownership-enforced access."""
from app.core.exceptions import WorkspaceNotFoundError
from app.models.workspace import Workspace
from app.repositories.workspace_repository import WorkspaceRepository


class WorkspaceService:
    """Orchestrates workspace creation/listing and enforces per-owner isolation.

    `get_owned_workspace` is the single choke point every other service (documents,
    search, RAG) must go through before touching workspace-scoped data — it raises
    a 404 for both "does not exist" and "exists but belongs to someone else", so a
    caller can never distinguish the two and probe for other users' workspace ids.
    """

    def __init__(self, workspace_repository: WorkspaceRepository) -> None:
        self._workspaces = workspace_repository

    async def create(self, name: str, owner_id: int) -> Workspace:
        workspace = await self._workspaces.create(name=name, owner_id=owner_id)
        await self._workspaces.commit()
        return workspace

    async def list_for_owner(self, owner_id: int) -> list[Workspace]:
        return await self._workspaces.list_by_owner(owner_id)

    async def get_owned_workspace(self, workspace_id: int, owner_id: int) -> Workspace:
        workspace = await self._workspaces.get_by_id(workspace_id)
        if workspace is None or workspace.owner_id != owner_id:
            raise WorkspaceNotFoundError(f"Workspace {workspace_id} not found.")
        return workspace
