"""RAG question-answering endpoint."""
from fastapi import APIRouter, Depends

from app.api.dependencies import get_rag_service
from app.schemas.rag import AskRequest, AskResponse
from app.services.rag_service import RagService

router = APIRouter(prefix="/api/v1", tags=["rag"])


@router.post("/ask", response_model=AskResponse)
async def ask_question(
    request: AskRequest,
    rag_service: RagService = Depends(get_rag_service),
) -> AskResponse:
    """Answer a natural-language question using retrieval-augmented generation."""
    return await rag_service.ask(request.question)
