"""Abstraction over how document indexing gets scheduled to run asynchronously.

DocumentService depends only on this interface, never on Celery directly — the
production implementation enqueues a Celery task; tests can substitute one that
runs the same DocumentIndexingService inline (against fake repositories), which
keeps DocumentService's tests deterministic and free of any real broker/worker.
"""
from abc import ABC, abstractmethod


class IndexingDispatcher(ABC):
    """Schedules a document to be indexed, without blocking the caller on completion."""

    @abstractmethod
    async def dispatch(self, document_id: int) -> None:
        """Fire off indexing for a document. Must not block until indexing finishes."""
        ...
