from datetime import datetime
from uuid import uuid4

from sqlalchemy import (
    JSON,
    Boolean,
    CheckConstraint,
    ForeignKey,
    ForeignKeyConstraint,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class FoundationProbe(Base):
    """Temporary Phase 1 record; no form or respondent data."""

    __tablename__ = "foundation_probes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(nullable=False)
    expires_at: Mapped[datetime] = mapped_column(nullable=False)


def new_id() -> str:
    return str(uuid4())


class Workspace(Base):
    __tablename__ = "workspaces"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    seeded_at: Mapped[datetime | None]
    created_at: Mapped[datetime]


class CreatorSession(Base):
    __tablename__ = "creator_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True)
    workspace_id: Mapped[str] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"))
    expires_at: Mapped[datetime]
    created_at: Mapped[datetime]
    __table_args__ = (Index("ix_creator_sessions_workspace", "workspace_id"),)


class Form(Base):
    __tablename__ = "forms"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    workspace_id: Mapped[str] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(200))
    public_slug: Mapped[str | None] = mapped_column(String(32), unique=True)
    is_published: Mapped[bool] = mapped_column(Boolean(create_constraint=True), default=False)
    publication_epoch: Mapped[int] = mapped_column(Integer, default=0)
    draft_revision: Mapped[int] = mapped_column(Integer, default=0)
    last_save_mutation_id: Mapped[str | None] = mapped_column(String(36))
    created_at: Mapped[datetime]
    updated_at: Mapped[datetime]
    __table_args__ = (
        CheckConstraint("draft_revision >= 0 AND publication_epoch >= 0", name="ck_form_counters"),
        Index("ix_forms_workspace_updated", "workspace_id", "updated_at", "id"),
    )


class FormVersion(Base):
    __tablename__ = "form_versions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    form_id: Mapped[str] = mapped_column(ForeignKey("forms.id", ondelete="CASCADE"))
    version_number: Mapped[int] = mapped_column(Integer)
    source_draft_revision: Mapped[int] = mapped_column(Integer)
    title: Mapped[str] = mapped_column(String(200))
    theme_settings: Mapped[dict] = mapped_column(JSON)
    ending_settings: Mapped[dict] = mapped_column(JSON)
    publication_epoch: Mapped[int] = mapped_column(Integer)
    published_at: Mapped[datetime | None]
    __table_args__ = (
        UniqueConstraint("form_id", "version_number", name="uq_form_version_number"),
        UniqueConstraint("id", "form_id", name="uq_version_form"),
        CheckConstraint(
            "version_number >= 0 AND source_draft_revision >= 0 AND publication_epoch >= 0",
            name="ck_version_counters",
        ),
        CheckConstraint(
            "(version_number = 0 AND published_at IS NULL) OR "
            "(version_number > 0 AND published_at IS NOT NULL)",
            name="ck_version_publication",
        ),
    )


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    version_id: Mapped[str] = mapped_column(ForeignKey("form_versions.id", ondelete="CASCADE"))
    question_key: Mapped[str] = mapped_column(String(36))
    type: Mapped[str] = mapped_column(String(32))
    title: Mapped[str] = mapped_column(Text)
    description: Mapped[str] = mapped_column(Text)
    required: Mapped[bool] = mapped_column(Boolean(create_constraint=True))
    position: Mapped[int] = mapped_column(Integer)
    rating_max: Mapped[int | None] = mapped_column(Integer)
    __table_args__ = (
        UniqueConstraint("version_id", "question_key", name="uq_question_key"),
        UniqueConstraint("version_id", "position", name="uq_question_position"),
        UniqueConstraint("id", "version_id", name="uq_question_version"),
        CheckConstraint("position >= 0", name="ck_question_position"),
        CheckConstraint(
            "type IN ('short_text','long_text','multiple_choice','dropdown',"
            "'email','number','yes_no','rating')",
            name="ck_question_type",
        ),
        CheckConstraint(
            "(type = 'rating' AND rating_max BETWEEN 1 AND 10 AND rating_max IS NOT NULL) OR "
            "(type != 'rating' AND rating_max IS NULL)",
            name="ck_question_rating",
        ),
    )


class QuestionOption(Base):
    __tablename__ = "question_options"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    question_id: Mapped[str] = mapped_column(ForeignKey("questions.id", ondelete="CASCADE"))
    option_key: Mapped[str] = mapped_column(String(36))
    label: Mapped[str] = mapped_column(Text)
    position: Mapped[int] = mapped_column(Integer)
    __table_args__ = (
        UniqueConstraint("question_id", "option_key", name="uq_option_key"),
        UniqueConstraint("question_id", "position", name="uq_option_position"),
        UniqueConstraint("id", "question_id", name="uq_option_question"),
        CheckConstraint("position >= 0", name="ck_option_position"),
    )


class FormResponse(Base):
    __tablename__ = "responses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    form_id: Mapped[str] = mapped_column(String(36))
    version_id: Mapped[str] = mapped_column(String(36))
    submission_key: Mapped[str] = mapped_column(String(36))
    payload_hash: Mapped[str] = mapped_column(String(64))
    submitted_at: Mapped[datetime]
    is_seed: Mapped[bool] = mapped_column(Boolean(create_constraint=True), default=False)
    __table_args__ = (
        ForeignKeyConstraint(
            ["version_id", "form_id"],
            ["form_versions.id", "form_versions.form_id"],
            ondelete="CASCADE",
        ),
        UniqueConstraint("form_id", "submission_key", name="uq_response_submission"),
        UniqueConstraint("id", "version_id", name="uq_response_version"),
        Index("ix_responses_form_submitted", "form_id", "submitted_at", "id"),
        Index("ix_responses_version", "version_id"),
    )


class Answer(Base):
    __tablename__ = "answers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    response_id: Mapped[str] = mapped_column(String(36))
    version_id: Mapped[str] = mapped_column(String(36))
    question_id: Mapped[str] = mapped_column(String(36))
    text_value: Mapped[str | None] = mapped_column(Text)
    integer_value: Mapped[int | None] = mapped_column(Integer)
    boolean_value: Mapped[bool | None] = mapped_column(Boolean(create_constraint=True))
    option_id: Mapped[str | None] = mapped_column(String(36))
    __table_args__ = (
        ForeignKeyConstraint(
            ["response_id", "version_id"],
            ["responses.id", "responses.version_id"],
            ondelete="CASCADE",
        ),
        ForeignKeyConstraint(
            ["question_id", "version_id"],
            ["questions.id", "questions.version_id"],
            ondelete="CASCADE",
        ),
        ForeignKeyConstraint(
            ["option_id", "question_id"],
            ["question_options.id", "question_options.question_id"],
            ondelete="CASCADE",
        ),
        UniqueConstraint("response_id", "question_id", name="uq_answer_question"),
        CheckConstraint(
            "(text_value IS NOT NULL) + (integer_value IS NOT NULL) + "
            "(boolean_value IS NOT NULL) + (option_id IS NOT NULL) = 1",
            name="ck_answer_one_value",
        ),
        CheckConstraint(
            "integer_value IS NULL OR (typeof(integer_value) = 'integer' "
            "AND integer_value BETWEEN 0 AND 999999999999999)",
            name="ck_answer_integer",
        ),
        Index("ix_answers_question", "question_id", "version_id"),
        Index("ix_answers_option", "option_id", "question_id"),
        Index("ix_answers_response_version", "response_id", "version_id"),
    )
