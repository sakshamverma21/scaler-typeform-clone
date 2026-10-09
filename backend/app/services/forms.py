import hashlib
import json
from uuid import uuid4

from sqlalchemy import Integer, cast, delete, func, select
from sqlalchemy.orm import Session

from app.api.errors import ApiError
from app.db.models import Form, FormResponse, FormVersion
from app.schemas.forms import DraftDefinition, FormDetail, FormList, FormMetadata, SaveDraft
from app.services.common import draft_version, now, require_revision, utc
from app.services.definitions import read_definition, replace_draft, write_definition
from app.services.pagination import cursor_filter, encode_cursor


def metadata(session: Session, form: Form, counts: tuple[int, int] | None = None) -> FormMetadata:
    if counts is None:
        total, seeded = session.execute(
            select(
                func.count(FormResponse.id),
                func.coalesce(func.sum(cast(FormResponse.is_seed, Integer)), 0),
            ).where(FormResponse.form_id == form.id)
        ).one()
    else:
        total, seeded = counts
    return FormMetadata(
        id=form.id,
        title=form.title,
        is_published=form.is_published,
        public_slug=form.public_slug,
        draft_revision=form.draft_revision,
        last_save_mutation_id=form.last_save_mutation_id,
        created_at=utc(form.created_at),
        updated_at=utc(form.updated_at),
        response_count=total,
        seed_response_count=int(seeded),
    )


def detail(session: Session, form: Form) -> FormDetail:
    return FormDetail(
        form=metadata(session, form), draft=read_definition(session, draft_version(session, form))
    )


def create_form(session: Session, workspace_id: str, title: str) -> Form:
    timestamp = now()
    form = Form(workspace_id=workspace_id, title=title, created_at=timestamp, updated_at=timestamp)
    session.add(form)
    session.flush()
    version = FormVersion(
        form_id=form.id,
        version_number=0,
        source_draft_revision=0,
        publication_epoch=0,
        title=title,
        theme_settings={},
        ending_settings={},
    )
    session.add(version)
    session.flush()
    write_definition(session, version, DraftDefinition(title=title))
    return form


def definition_hash(definition: DraftDefinition) -> str:
    return hashlib.sha256(
        json.dumps(
            definition.model_dump(mode="json"),
            sort_keys=True,
            ensure_ascii=False,
            separators=(",", ":"),
        ).encode()
    ).hexdigest()


def save_draft(session: Session, form: Form, body: SaveDraft, revision: int) -> FormDetail:
    draft = draft_version(session, form)
    if form.last_save_mutation_id == body.mutation_id:
        if definition_hash(read_definition(session, draft)) != definition_hash(body.definition):
            raise ApiError(
                409, "mutation_conflict", "This save identifier was used for other edits."
            )
        return detail(session, form)
    require_revision(form, revision)
    replace_draft(session, draft, body.definition)
    form.title = body.definition.title
    form.draft_revision += 1
    draft.source_draft_revision = form.draft_revision
    form.last_save_mutation_id = body.mutation_id
    form.updated_at = now()
    session.flush()
    return detail(session, form)


def rename_form(session: Session, form: Form, title: str, revision: int) -> FormDetail:
    require_revision(form, revision)
    if not title.strip():
        raise ApiError(422, "invalid_title", "Enter a form title.")
    if title != form.title:
        form.title = title
        form.draft_revision += 1
        form.last_save_mutation_id = None
        form.updated_at = now()
        draft = draft_version(session, form)
        draft.title = title
        draft.source_draft_revision = form.draft_revision
        session.flush()
    return detail(session, form)


def duplicate_form(session: Session, form: Form, revision: int) -> FormDetail:
    require_revision(form, revision)
    definition = read_definition(session, draft_version(session, form)).model_copy(deep=True)
    definition.title = f"{form.title[:193]} (copy)"
    for q in definition.questions:
        q.question_key = str(uuid4())
        for option in q.options:
            option.option_key = str(uuid4())
    duplicate = create_form(session, form.workspace_id, definition.title)
    replace_draft(session, draft_version(session, duplicate), definition)
    return detail(session, duplicate)


def delete_form(session: Session, form: Form) -> None:
    session.execute(delete(Form).where(Form.id == form.id))


def list_forms(session: Session, workspace_id: str, limit: int, cursor: str | None) -> FormList:
    counts = (
        select(
            FormResponse.form_id,
            func.count(FormResponse.id).label("total"),
            func.sum(cast(FormResponse.is_seed, Integer)).label("seeded"),
        )
        .group_by(FormResponse.form_id)
        .subquery()
    )
    query = (
        select(Form, func.coalesce(counts.c.total, 0), func.coalesce(counts.c.seeded, 0))
        .outerjoin(counts, counts.c.form_id == Form.id)
        .where(Form.workspace_id == workspace_id)
    )
    if cursor:
        query = query.where(cursor_filter(cursor, Form.updated_at, Form.id))
    rows = session.execute(
        query.order_by(Form.updated_at.desc(), Form.id.desc()).limit(limit + 1)
    ).all()
    visible = rows[:limit]
    return FormList(
        items=[metadata(session, f, (total, seeded)) for f, total, seeded in visible],
        next_cursor=encode_cursor(visible[-1][0].updated_at, visible[-1][0].id)
        if len(rows) > limit
        else None,
    )
