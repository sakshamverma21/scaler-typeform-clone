import secrets

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.errors import ApiError
from app.db.models import Form, FormVersion
from app.schemas.forms import PublicForm
from app.services.common import draft_version, latest_version, now, require_revision
from app.services.definitions import read_definition, validate_publication, write_definition


def publish(session: Session, form: Form, revision: int) -> FormVersion:
    require_revision(form, revision)
    definition = read_definition(session, draft_version(session, form))
    validate_publication(definition)
    latest = latest_version(session, form)
    if form.is_published and latest and latest.source_draft_revision == form.draft_revision:
        return latest
    if not form.public_slug:
        form.public_slug = secrets.token_urlsafe(18)
    version = FormVersion(
        form_id=form.id,
        version_number=latest.version_number + 1 if latest else 1,
        source_draft_revision=form.draft_revision,
        title=definition.title,
        theme_settings={},
        ending_settings={},
        publication_epoch=form.publication_epoch,
        published_at=now(),
    )
    session.add(version)
    session.flush()
    write_definition(session, version, definition)
    form.is_published = True
    form.updated_at = now()
    session.flush()
    return version


def unpublish(session: Session, form: Form) -> None:
    if form.is_published:
        form.is_published = False
        form.publication_epoch += 1
        form.updated_at = now()
        session.flush()


def public_form(session: Session, slug: str, *, require_open: bool = True) -> Form:
    form = session.scalar(select(Form).where(Form.public_slug == slug))
    if form is None:
        raise ApiError(404, "form_not_found", "This form could not be found.")
    if require_open and not form.is_published:
        raise ApiError(410, "form_closed", "This form is no longer accepting responses.")
    return form


def public_definition(session: Session, form: Form) -> PublicForm:
    version = latest_version(session, form)
    return PublicForm(
        version_id=version.id,
        version_number=version.version_number,
        definition=read_definition(session, version),
    )
