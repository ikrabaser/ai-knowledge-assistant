"""FastAPI dependency providers wiring repositories, services and providers together."""
from functools import lru_cache

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.database import get_db
from app.core.exceptions import InvalidCredentialsError
from app.core.security import decode_access_token
from app.models.user import User
from app.providers.base_chat_provider import ChatProvider
from app.providers.base_embedding_provider import EmbeddingProvider
from app.providers.chat_provider_factory import create_chat_provider
from app.providers.openai_provider import OpenAIEmbeddingProvider
from app.repositories.chunk_repository import ChunkRepository
from app.repositories.conversation_repository import ConversationRepository
from app.repositories.document_repository import DocumentRepository
from app.repositories.message_repository import MessageRepository
from app.repositories.user_repository import UserRepository
from app.repositories.workspace_repository import WorkspaceRepository
from app.services.auth_service import AuthService
from app.services.conversation_service import ConversationService
from app.services.document_service import DocumentService
from app.services.embedding_service import EmbeddingService
from app.services.agent_service import AgentService
from app.services.indexing_dispatcher import IndexingDispatcher
from app.services.rag_service import RagService
from app.services.retrieval_service import RetrievalService
from app.services.tool_execution_service import ToolExecutionService
from app.services.workspace_service import WorkspaceService
from app.tasks.document_indexing_task import CeleryIndexingDispatcher
from app.tools.get_document_tool import GetDocumentTool
from app.tools.list_documents_tool import ListDocumentsTool
from app.tools.list_workspaces_tool import ListWorkspacesTool
from app.tools.registry import ToolRegistry
from app.tools.summarize_document_tool import SummarizeDocumentTool

_bearer_scheme = HTTPBearer(auto_error=False)


@lru_cache
def get_openai_client() -> AsyncOpenAI:
    settings = get_settings()
    return AsyncOpenAI(api_key=settings.openai_api_key)


def get_embedding_provider(
    settings: Settings = Depends(get_settings),
    client: AsyncOpenAI = Depends(get_openai_client),
) -> EmbeddingProvider:
    return OpenAIEmbeddingProvider(client=client, model=settings.openai_embedding_model)


def get_chat_provider(settings: Settings = Depends(get_settings)) -> ChatProvider:
    """Return the configured ChatProvider — OpenAI or Anthropic, per LLM_PROVIDER."""
    return create_chat_provider(settings)


def get_user_repository(session: AsyncSession = Depends(get_db)) -> UserRepository:
    return UserRepository(session)


def get_auth_service(
    settings: Settings = Depends(get_settings),
    user_repository: UserRepository = Depends(get_user_repository),
) -> AuthService:
    return AuthService(user_repository=user_repository, settings=settings)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    settings: Settings = Depends(get_settings),
    user_repository: UserRepository = Depends(get_user_repository),
) -> User:
    """Resolve the authenticated user from a Bearer JWT, or raise 401."""
    if credentials is None:
        raise HTTPException(status_code=401, detail="Not authenticated.")

    try:
        subject = decode_access_token(credentials.credentials, settings)
        user_id = int(subject)
    except (jwt.PyJWTError, ValueError, TypeError) as exc:
        raise InvalidCredentialsError("Invalid or expired authentication token.") from exc

    user = await user_repository.get_by_id(user_id)
    if user is None or not user.is_active:
        raise InvalidCredentialsError("Invalid or expired authentication token.")
    return user


def get_workspace_repository(session: AsyncSession = Depends(get_db)) -> WorkspaceRepository:
    return WorkspaceRepository(session)


def get_workspace_service(
    workspace_repository: WorkspaceRepository = Depends(get_workspace_repository),
) -> WorkspaceService:
    return WorkspaceService(workspace_repository)


def get_document_repository(session: AsyncSession = Depends(get_db)) -> DocumentRepository:
    return DocumentRepository(session)


def get_chunk_repository(session: AsyncSession = Depends(get_db)) -> ChunkRepository:
    return ChunkRepository(session)


def get_embedding_service(
    provider: EmbeddingProvider = Depends(get_embedding_provider),
) -> EmbeddingService:
    return EmbeddingService(provider)


def get_indexing_dispatcher() -> IndexingDispatcher:
    """Production dispatcher: enqueues indexing onto the Celery/Redis queue."""
    return CeleryIndexingDispatcher()


def get_document_service(
    settings: Settings = Depends(get_settings),
    document_repository: DocumentRepository = Depends(get_document_repository),
    chunk_repository: ChunkRepository = Depends(get_chunk_repository),
    indexing_dispatcher: IndexingDispatcher = Depends(get_indexing_dispatcher),
) -> DocumentService:
    return DocumentService(
        document_repository=document_repository,
        chunk_repository=chunk_repository,
        indexing_dispatcher=indexing_dispatcher,
        upload_directory=settings.upload_directory,
        max_upload_size_mb=settings.max_upload_size_mb,
    )


def get_retrieval_service(
    settings: Settings = Depends(get_settings),
    chunk_repository: ChunkRepository = Depends(get_chunk_repository),
    embedding_service: EmbeddingService = Depends(get_embedding_service),
) -> RetrievalService:
    return RetrievalService(
        chunk_repository=chunk_repository,
        embedding_service=embedding_service,
        default_top_k=settings.search_top_k,
        similarity_threshold=settings.similarity_threshold,
    )


def get_rag_service(
    retrieval_service: RetrievalService = Depends(get_retrieval_service),
    chat_provider: ChatProvider = Depends(get_chat_provider),
) -> RagService:
    return RagService(retrieval_service=retrieval_service, chat_provider=chat_provider)


def get_conversation_repository(session: AsyncSession = Depends(get_db)) -> ConversationRepository:
    return ConversationRepository(session)


def get_message_repository(session: AsyncSession = Depends(get_db)) -> MessageRepository:
    return MessageRepository(session)


def get_conversation_service(
    settings: Settings = Depends(get_settings),
    conversation_repository: ConversationRepository = Depends(get_conversation_repository),
    message_repository: MessageRepository = Depends(get_message_repository),
    workspace_service: WorkspaceService = Depends(get_workspace_service),
    rag_service: RagService = Depends(get_rag_service),
) -> ConversationService:
    return ConversationService(
        conversation_repository=conversation_repository,
        message_repository=message_repository,
        workspace_service=workspace_service,
        rag_service=rag_service,
        history_max_messages=settings.conversation_history_max_messages,
        history_max_tokens=settings.conversation_history_max_tokens,
    )


def get_tool_registry(
    document_service: DocumentService = Depends(get_document_service),
    workspace_service: WorkspaceService = Depends(get_workspace_service),
    chunk_repository: ChunkRepository = Depends(get_chunk_repository),
    chat_provider: ChatProvider = Depends(get_chat_provider),
) -> ToolRegistry:
    return ToolRegistry(
        [
            ListWorkspacesTool(workspace_service),
            ListDocumentsTool(document_service, workspace_service),
            GetDocumentTool(document_service, workspace_service),
            SummarizeDocumentTool(document_service, workspace_service, chunk_repository, chat_provider),
        ]
    )


def get_tool_execution_service(
    tool_registry: ToolRegistry = Depends(get_tool_registry),
) -> ToolExecutionService:
    return ToolExecutionService(tool_registry)


def get_agent_service(
    chat_provider: ChatProvider = Depends(get_chat_provider),
    tool_registry: ToolRegistry = Depends(get_tool_registry),
    tool_execution_service: ToolExecutionService = Depends(get_tool_execution_service),
) -> AgentService:
    return AgentService(
        chat_provider=chat_provider,
        tool_registry=tool_registry,
        tool_execution_service=tool_execution_service,
    )
