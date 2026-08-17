"""Workspace management endpoints."""
from fastapi import APIRouter, Depends

from app.api.dependencies import get_current_user, get_workspace_service
from app.models.user import User
from app.schemas.workspace import WorkspaceCreateRequest, WorkspaceResponse
from app.services.workspace_service import WorkspaceService

router = APIRouter(prefix="/api/v1/workspaces", tags=["workspaces"])


@router.post("", response_model=WorkspaceResponse, status_code=201)
async def create_workspace(
    request: WorkspaceCreateRequest,
    current_user: User = Depends(get_current_user),
    workspace_service: WorkspaceService = Depends(get_workspace_service),
) -> WorkspaceResponse:
    """Create a new workspace owned by the current user."""
    workspace = await workspace_service.create(name=request.name, owner_id=current_user.id)
    return WorkspaceResponse.model_validate(workspace)


@router.get("", response_model=list[WorkspaceResponse])
async def list_workspaces(
    current_user: User = Depends(get_current_user),
    workspace_service: WorkspaceService = Depends(get_workspace_service),
) -> list[WorkspaceResponse]:
    """List all workspaces owned by the current user."""
    workspaces = await workspace_service.list_for_owner(current_user.id)
    return [WorkspaceResponse.model_validate(w) for w in workspaces]


@router.get("/{workspace_id}", response_model=WorkspaceResponse)
async def get_workspace(
    workspace_id: int,
    current_user: User = Depends(get_current_user),
    workspace_service: WorkspaceService = Depends(get_workspace_service),
) -> WorkspaceResponse:
    """Fetch a single workspace owned by the current user."""
    workspace = await workspace_service.get_owned_workspace(workspace_id, current_user.id)
    return WorkspaceResponse.model_validate(workspace)
