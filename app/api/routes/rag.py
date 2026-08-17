"""RAG question-answering endpoint — scoped to a workspace owned by the caller."""
from fastapi import APIRouter, Depends

from app.api.dependencies import get_current_user, get_rag_service, get_workspace_service
from app.models.user import User
from app.schemas.rag import AskRequest, AskResponse
from app.services.rag_service import RagService
from app.services.workspace_service import WorkspaceService

router = APIRouter(prefix="/api/v1", tags=["rag"])


@router.post("/ask", response_model=AskResponse)
async def ask_question(
    request: AskRequest,
    current_user: User = Depends(get_current_user),
    rag_service: RagService = Depends(get_rag_service),
    workspace_service: WorkspaceService = Depends(get_workspace_service),
) -> AskResponse:
    """Answer a natural-language question using retrieval-augmented generation."""
    await workspace_service.get_owned_workspace(request.workspace_id, current_user.id)

    return await rag_service.ask(request.question, workspace_id=request.workspace_id)
