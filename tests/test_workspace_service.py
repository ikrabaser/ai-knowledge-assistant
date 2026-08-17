"""Tests for WorkspaceService: creation, listing and ownership enforcement."""
import pytest

from app.core.exceptions import WorkspaceNotFoundError
from app.services.workspace_service import WorkspaceService
from tests.fakes import FakeWorkspaceRepository


@pytest.fixture
def workspace_service() -> WorkspaceService:
    return WorkspaceService(FakeWorkspaceRepository())


@pytest.mark.asyncio
async def test_create_workspace_sets_owner(workspace_service: WorkspaceService) -> None:
    workspace = await workspace_service.create(name="My Workspace", owner_id=1)

    assert workspace.name == "My Workspace"
    assert workspace.owner_id == 1


@pytest.mark.asyncio
async def test_list_for_owner_only_returns_owned_workspaces(workspace_service: WorkspaceService) -> None:
    await workspace_service.create(name="Owner 1 Workspace", owner_id=1)
    await workspace_service.create(name="Owner 2 Workspace", owner_id=2)

    workspaces = await workspace_service.list_for_owner(owner_id=1)

    assert len(workspaces) == 1
    assert workspaces[0].name == "Owner 1 Workspace"


@pytest.mark.asyncio
async def test_get_owned_workspace_succeeds_for_the_owner(workspace_service: WorkspaceService) -> None:
    created = await workspace_service.create(name="Mine", owner_id=1)

    fetched = await workspace_service.get_owned_workspace(created.id, owner_id=1)

    assert fetched.id == created.id


@pytest.mark.asyncio
async def test_get_owned_workspace_rejects_a_different_owner(workspace_service: WorkspaceService) -> None:
    created = await workspace_service.create(name="Mine", owner_id=1)

    with pytest.raises(WorkspaceNotFoundError):
        await workspace_service.get_owned_workspace(created.id, owner_id=2)


@pytest.mark.asyncio
async def test_get_owned_workspace_rejects_unknown_id(workspace_service: WorkspaceService) -> None:
    with pytest.raises(WorkspaceNotFoundError):
        await workspace_service.get_owned_workspace(999, owner_id=1)
