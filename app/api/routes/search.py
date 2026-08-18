"""Semantic search endpoint — scoped to a workspace owned by the caller."""
from fastapi import APIRouter, Depends

from app.api.dependencies import get_current_user, get_retrieval_service, get_workspace_service
from app.models.user import User
from app.schemas.search import SearchRequest, SearchResponse, SearchResultItem
from app.services.retrieval_service import RetrievalService
from app.services.workspace_service import WorkspaceService

router = APIRouter(prefix="/api/v1/search", tags=["search"])


@router.post("", response_model=SearchResponse)
async def semantic_search(
    request: SearchRequest,
    current_user: User = Depends(get_current_user),
    retrieval_service: RetrievalService = Depends(get_retrieval_service),
    workspace_service: WorkspaceService = Depends(get_workspace_service),
) -> SearchResponse:
    """Run a semantic (vector) search over indexed chunks within a workspace."""
    await workspace_service.get_owned_workspace(request.workspace_id, current_user.id)

    results = await retrieval_service.search(
        query=request.query,
        workspace_id=request.workspace_id,
        limit=request.limit,
        document_id=request.document_id,
        content_type=request.content_type,
    )
    return SearchResponse(
        query=request.query,
        results=[
            SearchResultItem(
                document_id=r.document_id,
                filename=r.filename,
                chunk_index=r.chunk_index,
                content=r.content,
                similarity_score=r.similarity_score,
            )
            for r in results
        ],
    )
