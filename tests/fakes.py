"""Deterministic fake providers/repositories used across the test suite.

These avoid any real network calls to OpenAI and avoid requiring a live
PostgreSQL/pgvector instance for unit tests.
"""
from dataclasses import dataclass
from datetime import datetime, timezone

from app.models.document import Document, DocumentStatus
from app.models.user import User
from app.providers.base_chat_provider import ChatProvider
from app.providers.base_embedding_provider import EmbeddingProvider


class FakeEmbeddingProvider(EmbeddingProvider):
    """Deterministic embedding provider: hashes text into a fixed-size vector."""

    def __init__(self, dimensions: int = 8) -> None:
        self.dimensions = dimensions

    async def embed_text(self, text: str) -> list[float]:
        return self._vectorize(text)

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        return [self._vectorize(text) for text in texts]

    def _vectorize(self, text: str) -> list[float]:
        seed = sum(ord(c) for c in text) or 1
        return [((seed * (i + 1)) % 97) / 97 for i in range(self.dimensions)]


class FakeChatProvider(ChatProvider):
    """Chat provider that echoes back a canned answer for assertions."""

    def __init__(self, answer: str = "This is a fake answer based on the given context.") -> None:
        self.answer = answer
        self.last_system_prompt: str | None = None
        self.last_user_prompt: str | None = None

    async def complete(self, system_prompt: str, user_prompt: str) -> str:
        self.last_system_prompt = system_prompt
        self.last_user_prompt = user_prompt
        return self.answer


@dataclass
class FakeChunkRow:
    document_id: int
    filename: str
    chunk_index: int
    content: str
    similarity_score: float


class FakeChunkRepository:
    """In-memory stand-in for ChunkRepository, used to test RetrievalService."""

    def __init__(self, rows: list[FakeChunkRow] | None = None) -> None:
        self._rows = rows if rows is not None else []

    async def similarity_search(
        self, query_embedding: list[float], limit: int, similarity_threshold: float
    ):
        matches = [row for row in self._rows if row.similarity_score >= similarity_threshold]
        matches.sort(key=lambda r: r.similarity_score, reverse=True)

        class _Chunk:
            def __init__(self, row: FakeChunkRow) -> None:
                self.document_id = row.document_id
                self.chunk_index = row.chunk_index
                self.content = row.content

                class _Doc:
                    def __init__(self, filename: str) -> None:
                        self.filename = filename

                self.document = _Doc(row.filename)

        return [(_Chunk(row), row.similarity_score) for row in matches[:limit]]

    async def delete_by_document_id(self, document_id: int) -> None:
        self._rows = [r for r in self._rows if r.document_id != document_id]

    async def bulk_create(self, chunks: list) -> list:
        self.created_chunks = chunks
        return chunks

    async def count_by_document_id(self, document_id: int) -> int:
        created = getattr(self, "created_chunks", [])
        return len([c for c in created if getattr(c, "document_id", None) == document_id])

    async def commit(self) -> None:
        pass


class FakeUserRepository:
    """In-memory stand-in for UserRepository, used to test AuthService."""

    def __init__(self) -> None:
        self._users: dict[int, User] = {}
        self._next_id = 1

    async def create(self, email: str, password_hash: str) -> User:
        now = datetime.now(timezone.utc)
        user = User(email=email, password_hash=password_hash, is_active=True)
        user.id = self._next_id
        user.created_at = now
        user.updated_at = now
        self._next_id += 1
        self._users[user.id] = user
        return user

    async def get_by_id(self, user_id: int) -> User | None:
        return self._users.get(user_id)

    async def get_by_email(self, email: str) -> User | None:
        for user in self._users.values():
            if user.email == email:
                return user
        return None

    async def commit(self) -> None:
        pass


class FakeDocumentRepository:
    """In-memory stand-in for DocumentRepository, used to test DocumentService."""

    def __init__(self) -> None:
        self._documents: dict[int, Document] = {}
        self._next_id = 1

    async def create(self, filename: str, stored_filename: str, content_type: str) -> Document:
        document = Document(
            filename=filename,
            stored_filename=stored_filename,
            content_type=content_type,
            status=DocumentStatus.UPLOADED,
        )
        document.id = self._next_id
        document.chunks = []
        self._next_id += 1
        self._documents[document.id] = document
        return document

    async def get_by_id(self, document_id: int) -> Document | None:
        return self._documents.get(document_id)

    async def list_all(self) -> list[Document]:
        return list(self._documents.values())

    async def update_status(
        self, document: Document, status: DocumentStatus, error_message: str | None = None
    ) -> Document:
        document.status = status
        document.error_message = error_message
        return document

    async def commit(self) -> None:
        pass
