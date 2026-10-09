"""Versioned forms, isolated creator workspaces, typed responses."""

import sqlalchemy as sa
from alembic import op

revision = "0002_form_domain"
down_revision = "0001_foundation_probe"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "workspaces",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("seeded_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "creator_sessions",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("workspace_id", sa.String(length=36), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token_hash"),
    )
    op.create_index(
        "ix_creator_sessions_workspace", "creator_sessions", ["workspace_id"], unique=False
    )
    op.create_table(
        "forms",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("workspace_id", sa.String(length=36), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("public_slug", sa.String(length=32), nullable=True),
        sa.Column("is_published", sa.Boolean(create_constraint=True), nullable=False),
        sa.Column("publication_epoch", sa.Integer(), nullable=False),
        sa.Column("draft_revision", sa.Integer(), nullable=False),
        sa.Column("last_save_mutation_id", sa.String(length=36), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.CheckConstraint(
            "draft_revision >= 0 AND publication_epoch >= 0", name="ck_form_counters"
        ),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("public_slug"),
    )
    op.create_index(
        "ix_forms_workspace_updated", "forms", ["workspace_id", "updated_at", "id"], unique=False
    )
    op.create_table(
        "form_versions",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("form_id", sa.String(length=36), nullable=False),
        sa.Column("version_number", sa.Integer(), nullable=False),
        sa.Column("source_draft_revision", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("theme_settings", sa.JSON(), nullable=False),
        sa.Column("ending_settings", sa.JSON(), nullable=False),
        sa.Column("publication_epoch", sa.Integer(), nullable=False),
        sa.Column("published_at", sa.DateTime(), nullable=True),
        sa.CheckConstraint(
            "(version_number = 0 AND published_at IS NULL) OR "
            "(version_number > 0 AND published_at IS NOT NULL)",
            name="ck_version_publication",
        ),
        sa.CheckConstraint(
            "version_number >= 0 AND source_draft_revision >= 0 AND publication_epoch >= 0",
            name="ck_version_counters",
        ),
        sa.ForeignKeyConstraint(["form_id"], ["forms.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("form_id", "version_number", name="uq_form_version_number"),
        sa.UniqueConstraint("id", "form_id", name="uq_version_form"),
    )
    op.create_table(
        "questions",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("version_id", sa.String(length=36), nullable=False),
        sa.Column("question_key", sa.String(length=36), nullable=False),
        sa.Column("type", sa.String(length=32), nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("required", sa.Boolean(create_constraint=True), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("rating_max", sa.Integer(), nullable=True),
        sa.CheckConstraint(
            "(type = 'rating' AND rating_max BETWEEN 1 AND 10 AND rating_max IS NOT NULL) OR "
            "(type != 'rating' AND rating_max IS NULL)",
            name="ck_question_rating",
        ),
        sa.CheckConstraint(
            "type IN ('short_text','long_text','multiple_choice','dropdown',"
            "'email','number','yes_no','rating')",
            name="ck_question_type",
        ),
        sa.CheckConstraint("position >= 0", name="ck_question_position"),
        sa.ForeignKeyConstraint(["version_id"], ["form_versions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("id", "version_id", name="uq_question_version"),
        sa.UniqueConstraint("version_id", "position", name="uq_question_position"),
        sa.UniqueConstraint("version_id", "question_key", name="uq_question_key"),
    )
    op.create_table(
        "responses",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("form_id", sa.String(length=36), nullable=False),
        sa.Column("version_id", sa.String(length=36), nullable=False),
        sa.Column("submission_key", sa.String(length=36), nullable=False),
        sa.Column("payload_hash", sa.String(length=64), nullable=False),
        sa.Column("submitted_at", sa.DateTime(), nullable=False),
        sa.Column("is_seed", sa.Boolean(create_constraint=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["version_id", "form_id"],
            ["form_versions.id", "form_versions.form_id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("form_id", "submission_key", name="uq_response_submission"),
        sa.UniqueConstraint("id", "version_id", name="uq_response_version"),
    )
    op.create_index(
        "ix_responses_form_submitted", "responses", ["form_id", "submitted_at", "id"], unique=False
    )
    op.create_index("ix_responses_version", "responses", ["version_id"], unique=False)
    op.create_table(
        "question_options",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("question_id", sa.String(length=36), nullable=False),
        sa.Column("option_key", sa.String(length=36), nullable=False),
        sa.Column("label", sa.Text(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.CheckConstraint("position >= 0", name="ck_option_position"),
        sa.ForeignKeyConstraint(["question_id"], ["questions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("id", "question_id", name="uq_option_question"),
        sa.UniqueConstraint("question_id", "option_key", name="uq_option_key"),
        sa.UniqueConstraint("question_id", "position", name="uq_option_position"),
    )
    op.create_table(
        "answers",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("response_id", sa.String(length=36), nullable=False),
        sa.Column("version_id", sa.String(length=36), nullable=False),
        sa.Column("question_id", sa.String(length=36), nullable=False),
        sa.Column("text_value", sa.Text(), nullable=True),
        sa.Column("integer_value", sa.Integer(), nullable=True),
        sa.Column("boolean_value", sa.Boolean(create_constraint=True), nullable=True),
        sa.Column("option_id", sa.String(length=36), nullable=True),
        sa.CheckConstraint(
            "integer_value IS NULL OR (typeof(integer_value) = 'integer' "
            "AND integer_value BETWEEN 0 AND 999999999999999)",
            name="ck_answer_integer",
        ),
        sa.CheckConstraint(
            "(text_value IS NOT NULL) + (integer_value IS NOT NULL) + "
            "(boolean_value IS NOT NULL) + (option_id IS NOT NULL) = 1",
            name="ck_answer_one_value",
        ),
        sa.ForeignKeyConstraint(
            ["option_id", "question_id"],
            ["question_options.id", "question_options.question_id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["question_id", "version_id"],
            ["questions.id", "questions.version_id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["response_id", "version_id"],
            ["responses.id", "responses.version_id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("response_id", "question_id", name="uq_answer_question"),
    )
    op.create_index("ix_answers_option", "answers", ["option_id", "question_id"], unique=False)
    op.create_index("ix_answers_question", "answers", ["question_id", "version_id"], unique=False)
    op.create_index(
        "ix_answers_response_version", "answers", ["response_id", "version_id"], unique=False
    )


def downgrade():
    op.drop_index("ix_answers_response_version", table_name="answers")
    op.drop_index("ix_answers_question", table_name="answers")
    op.drop_index("ix_answers_option", table_name="answers")
    op.drop_table("answers")
    op.drop_table("question_options")
    op.drop_index("ix_responses_version", table_name="responses")
    op.drop_index("ix_responses_form_submitted", table_name="responses")
    op.drop_table("responses")
    op.drop_table("questions")
    op.drop_table("form_versions")
    op.drop_index("ix_forms_workspace_updated", table_name="forms")
    op.drop_table("forms")
    op.drop_index("ix_creator_sessions_workspace", table_name="creator_sessions")
    op.drop_table("creator_sessions")
    op.drop_table("workspaces")
