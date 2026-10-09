"""Minimal persisted cookie probe for Phase 1; domain tables follow in Phase 2."""

import sqlalchemy as sa
from alembic import op

revision = "0001_foundation_probe"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "foundation_probes",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("token_hash", sa.String(64), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
    )


def downgrade():
    op.drop_table("foundation_probes")
