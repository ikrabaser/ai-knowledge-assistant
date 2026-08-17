"""Data-access layer for the Workspace model."""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.workspace import Workspace


class WorkspaceRepository:
    """Encapsulates all database queries related to Workspace rows."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, name: str, owner_id: int) -> Workspace:
        workspace = Workspace(name=name, owner_id=owner_id)
        self._session.add(workspace)
        await self._session.flush()
        await self._session.refresh(workspace)
        return workspace

    async def get_by_id(self, workspace_id: int) -> Workspace | None:
        result = await self._session.execute(select(Workspace).where(Workspace.id == workspace_id))
        return result.scalar_one_or_none()

    async def list_by_owner(self, owner_id: int) -> list[Workspace]:
        result = await self._session.execute(
            select(Workspace).where(Workspace.owner_id == owner_id).order_by(Workspace.created_at.desc())
        )
        return list(result.scalars().all())

    async def commit(self) -> None:
        await self._session.commit()
