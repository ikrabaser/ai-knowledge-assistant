"""Celery task that runs the document indexing pipeline in a worker process.

The API process only ever enqueues this (see CeleryIndexingDispatcher); it never
imports or calls the indexing pipeline directly. The worker builds its own DB
session and provider clients here — it must not reuse anything request-scoped
from the API process, since it runs in a separate process entirely.
"""
import asyncio

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings
from app.core.logging import get_logger
from app.providers.openai_provider import OpenAIEmbeddingProvider
from app.repositories.chunk_repository import ChunkRepository
from app.repositories.document_repository import DocumentRepository
from app.services.chunking_service import ChunkingService
from app.services.document_indexing_service import DocumentIndexingService
from app.services.embedding_service import EmbeddingService
from app.services.indexing_dispatcher import IndexingDispatcher
from app.services.parsing_service import ParsingService
from app.tasks.celery_app import celery_app

logger = get_logger(__name__)

MAX_RETRIES = 3
RETRY_BACKOFF_SECONDS = 15


async def _run_indexing(document_id: int) -> None:
    """Build a fresh engine/session bound to *this* call's event loop.

    Each Celery task invocation runs inside its own `asyncio.run()` (its own,
    brand-new event loop). asyncpg connections are pinned to the loop they were
    created on, so reusing the API process's module-level engine/pool here would
    reuse connections from a *different* loop and fail with "Future attached to
    a different loop". A short-lived engine, disposed at the end, avoids that.
    """
    settings = get_settings()
    engine = create_async_engine(settings.database_url, echo=False)
    session_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False, autoflush=False)
    try:
        async with session_factory() as session:
            embedding_provider = OpenAIEmbeddingProvider(
                api_key=settings.openai_api_key,
                model=settings.openai_embedding_model,
            )
            indexing_service = DocumentIndexingService(
                document_repository=DocumentRepository(session),
                chunk_repository=ChunkRepository(session),
                parsing_service=ParsingService(),
                chunking_service=ChunkingService(
                    chunk_size=settings.chunk_size, chunk_overlap=settings.chunk_overlap
                ),
                embedding_service=EmbeddingService(embedding_provider),
                upload_directory=settings.upload_directory,
            )
            await indexing_service.index(document_id)
    finally:
        await engine.dispose()


@celery_app.task(bind=True, max_retries=MAX_RETRIES, name="index_document")
def index_document_task(self, document_id: int) -> None:
    """Run the indexing pipeline for one document, retrying transient failures a bounded number of times."""
    try:
        asyncio.run(_run_indexing(document_id))
    except Exception as exc:
        logger.warning(
            "Indexing failed for document_id=%s (attempt %s/%s): %s",
            document_id,
            self.request.retries + 1,
            MAX_RETRIES,
            exc,
        )
        if self.request.retries >= MAX_RETRIES:
            logger.error("Giving up on document_id=%s after %s attempts.", document_id, self.request.retries + 1)
            # DocumentIndexingService already marked the document as `failed` with the
            # real error message before re-raising — nothing further to persist here.
            return
        raise self.retry(exc=exc, countdown=RETRY_BACKOFF_SECONDS * (2**self.request.retries))


class CeleryIndexingDispatcher(IndexingDispatcher):
    """Production IndexingDispatcher: enqueues the Celery task and returns immediately."""

    async def dispatch(self, document_id: int) -> None:
        index_document_task.delay(document_id)
