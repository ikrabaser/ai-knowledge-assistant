"""Remove the undersized ivfflat index on document_chunks.embedding.

pgvector's ivfflat index is an approximate-nearest-neighbor structure that needs
to be trained on a dataset roughly proportional to its `lists` parameter (rule of
thumb: `lists` in the low hundreds requires many thousands of rows). With the
small corpora expected in this MVP, the ivfflat index (`lists=100`) silently
returns zero results for `ORDER BY embedding <=> query` — verified against a
live database with two indexed chunks and a real OpenAI embedding.

For now, semantic search falls back to an exact sequential scan (fine at MVP
scale). A properly-sized ANN index (ivfflat with `lists` tuned to the corpus
size, or an HNSW index) should be added once the corpus grows large enough to
need it.

Revision ID: 0002
Revises: 0001
Create Date: 2026-08-17
"""
from collections.abc import Sequence

from alembic import op

revision: str = "0002"
down_revision: str | None = "0001"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_document_chunks_embedding_cosine")


def downgrade() -> None:
    op.create_index(
        "ix_document_chunks_embedding_cosine",
        "document_chunks",
        ["embedding"],
        postgresql_using="ivfflat",
        postgresql_with={"lists": 100},
        postgresql_ops={"embedding": "vector_cosine_ops"},
    )
