"""Semantic search endpoint."""
from fastapi import APIRouter, Depends

from app.api.dependencies import get_retrieval_service
from app.schemas.search import SearchRequest, SearchResponse, SearchResultItem
from app.services.retrieval_service import RetrievalService

router = APIRouter(prefix="/api/v1/search", tags=["search"])


@router.post("", response_model=SearchResponse)
async def semantic_search(
    request: SearchRequest,
    retrieval_service: RetrievalService = Depends(get_retrieval_service),
) -> SearchResponse:
    """Run a semantic (vector) search over indexed document chunks."""
    results = await retrieval_service.search(query=request.query, limit=request.limit)
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
