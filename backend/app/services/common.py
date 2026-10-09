from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.errors import ApiError
from app.db.models import Form, FormVersion


def now() -> datetime:
    """SQLite stores naive UTC; API serialization explicitly restores its timezone."""
    return datetime.now(UTC).replace(tzinfo=None)


def utc(value: datetime) -> datetime:
    return value.replace(tzinfo=UTC)


def owned_form(session: Session, workspace_id: str, form_id: str) -> Form:
    form = session.scalar(select(Form).where(Form.id == form_id, Form.workspace_id == workspace_id))
    if form is None:
        raise ApiError(404, "form_not_found", "This form could not be found.")
    return form


def draft_version(session: Session, form: Form) -> FormVersion:
    return session.scalars(
        select(FormVersion).where(FormVersion.form_id == form.id, FormVersion.version_number == 0)
    ).one()


def latest_version(session: Session, form: Form) -> FormVersion | None:
    return session.scalar(
        select(FormVersion)
        .where(FormVersion.form_id == form.id, FormVersion.version_number > 0)
        .order_by(FormVersion.version_number.desc())
        .limit(1)
    )


def require_revision(form: Form, revision: int) -> None:
    if form.draft_revision != revision:
        raise ApiError(412, "stale_revision", "This form changed. Reload before saving again.")
