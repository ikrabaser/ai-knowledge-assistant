"""Document upload and retrieval endpoints."""
from fastapi import APIRouter, Depends, UploadFile

from app.api.dependencies import get_document_service
from app.schemas.document import DocumentResponse, DocumentUploadResponse
from app.services.document_service import DocumentService

router = APIRouter(prefix="/api/v1/documents", tags=["documents"])


@router.post("", response_model=DocumentUploadResponse, status_code=201)
async def upload_document(
    file: UploadFile,
    document_service: DocumentService = Depends(get_document_service),
) -> DocumentUploadResponse:
    """Upload a PDF, DOCX or TXT file and run it through the ingestion pipeline."""
    content = await file.read()
    document = await document_service.upload_and_process(
        filename=file.filename or "unnamed",
        content_type=file.content_type or "application/octet-stream",
        content=content,
    )
    return DocumentUploadResponse(
        id=document.id,
        filename=document.filename,
        content_type=document.content_type,
        status=document.status,
        error_message=document.error_message,
        created_at=document.created_at,
        updated_at=document.updated_at,
        chunk_count=len(document.chunks),
    )


@router.get("", response_model=list[DocumentResponse])
async def list_documents(
    document_service: DocumentService = Depends(get_document_service),
) -> list[DocumentResponse]:
    """List all uploaded documents."""
    documents = await document_service.list_documents()
    return [DocumentResponse.model_validate(document) for document in documents]


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: int,
    document_service: DocumentService = Depends(get_document_service),
) -> DocumentResponse:
    """Fetch a single document by id."""
    document = await document_service.get_document(document_id)
    return DocumentResponse.model_validate(document)
