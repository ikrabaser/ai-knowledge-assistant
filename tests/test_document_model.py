"""Regression test for the Document.status enum <-> Postgres enum mapping.

The Alembic migration creates the Postgres `document_status` type with lowercase
values ("uploaded", "processing", ...). SQLAlchemy's Enum type defaults to storing
the Python enum *member name* ("UPLOADED") unless `values_callable` is set, which
raises `InvalidTextRepresentationError` at insert time against a real database.
This is caught here without needing a live PostgreSQL connection.
"""
from app.models.document import Document, DocumentStatus


def test_status_column_uses_lowercase_enum_values_matching_the_migration() -> None:
    status_column_type = Document.__table__.c.status.type

    assert status_column_type.enums == [member.value for member in DocumentStatus]
    assert status_column_type.enums == ["uploaded", "processing", "indexed", "failed"]
