"""Add workspaces and link documents to a workspace.

Revision ID: 0004
Revises: 0003
Create Date: 2026-08-18

Safety notes for existing data:
- `documents.workspace_id` is added as NULLable. Any documents created before
  this migration (V1 had no concept of users/workspaces) simply keep a NULL
  workspace_id — no data is deleted or rewritten. They will no longer be
  reachable through the now workspace-scoped document endpoints, which is the
  intended effect of introducing per-user isolation, but the rows themselves
  are preserved and could be backfilled into a workspace manually later.
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0004"
down_revision: str | None = "0003"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "workspaces",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column(
            "owner_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_workspaces_owner_id", "workspaces", ["owner_id"])

    op.add_column(
        "documents",
        sa.Column(
            "workspace_id",
            sa.Integer(),
            sa.ForeignKey("workspaces.id", ondelete="CASCADE"),
            nullable=True,
        ),
    )
    op.create_index("ix_documents_workspace_id", "documents", ["workspace_id"])


def downgrade() -> None:
    op.drop_index("ix_documents_workspace_id", table_name="documents")
    op.drop_column("documents", "workspace_id")
    op.drop_index("ix_workspaces_owner_id", table_name="workspaces")
    op.drop_table("workspaces")
