import hashlib
import json

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.errors import ApiError
from app.db.models import Answer, Form, FormResponse, FormVersion
from app.schemas.forms import SubmissionReceipt, SubmitResponse
from app.services.common import now, utc
from app.services.definitions import options_for, questions_for
from app.services.validation import normalize_answers


def receipt(response: FormResponse) -> SubmissionReceipt:
    return SubmissionReceipt(
        id=response.id, version_id=response.version_id, submitted_at=utc(response.submitted_at)
    )


def submit(
    session: Session, form: Form, body: SubmitResponse, *, is_seed: bool = False
) -> SubmissionReceipt:
    """Caller holds BEGIN IMMEDIATE, including lookup/validation/write and commit.

    SQLite serializes this with unpublish and other submissions. A unique key remains
    the database-level safeguard; no process-local lock or retry loop is needed.
    """
    existing = session.scalar(
        select(FormResponse).where(
            FormResponse.form_id == form.id, FormResponse.submission_key == body.submission_key
        )
    )
    if existing and existing.version_id != body.version_id:
        raise ApiError(409, "submission_conflict", "This submission identifier was already used.")
    version = session.scalar(
        select(FormVersion).where(
            FormVersion.id == body.version_id,
            FormVersion.form_id == form.id,
            FormVersion.version_number > 0,
        )
    )
    if version is None:
        raise ApiError(422, "invalid_version", "This form version is invalid.")
    if not existing and (
        not form.is_published or version.publication_epoch != form.publication_epoch
    ):
        raise ApiError(410, "form_closed", "This form is no longer accepting this response.")
    questions = questions_for(session, version.id)
    options = options_for(session, version.id)
    values = normalize_answers(questions, options, body.answers)
    payload_hash = hashlib.sha256(
        json.dumps(
            {"version_id": version.id, "answers": values},
            sort_keys=True,
            ensure_ascii=False,
            separators=(",", ":"),
        ).encode()
    ).hexdigest()
    if existing:
        if existing.payload_hash != payload_hash:
            raise ApiError(
                409, "submission_conflict", "This submission identifier was used for other answers."
            )
        return receipt(existing)
    response = FormResponse(
        form_id=form.id,
        version_id=version.id,
        submission_key=body.submission_key,
        payload_hash=payload_hash,
        submitted_at=now(),
        is_seed=is_seed,
    )
    session.add(response)
    session.flush()
    for q in questions:
        if q.question_key not in values:
            continue
        value = values[q.question_key]
        answer = Answer(response_id=response.id, version_id=version.id, question_id=q.id)
        if q.type in {"multiple_choice", "dropdown"}:
            answer.option_id = next(o.id for o in options[q.id] if o.option_key == value)
        elif q.type in {"number", "rating"}:
            answer.integer_value = value
        elif q.type == "yes_no":
            answer.boolean_value = value
        else:
            answer.text_value = value
        session.add(answer)
    session.flush()
    return receipt(response)
