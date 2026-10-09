from sqlalchemy import Integer, cast, func, select
from sqlalchemy.orm import Session

from app.api.errors import ApiError
from app.db.models import Answer, Form, FormResponse, FormVersion, Question, QuestionOption
from app.schemas.forms import (
    AnswerView,
    DistributionItem,
    FormSummary,
    QuestionSummary,
    ResponseDetail,
    ResponseItem,
    ResponseList,
    VersionInfo,
    VersionList,
)
from app.services.common import latest_version, utc
from app.services.definitions import options_for, questions_for
from app.services.pagination import cursor_filter, encode_cursor


def owned_version(session: Session, form: Form, version_id: str) -> FormVersion:
    version = session.scalar(
        select(FormVersion).where(
            FormVersion.id == version_id,
            FormVersion.form_id == form.id,
            FormVersion.version_number > 0,
        )
    )
    if version is None:
        raise ApiError(404, "version_not_found", "This published version could not be found.")
    return version


def list_versions(session: Session, form: Form, limit: int, cursor: str | None) -> VersionList:
    counts = (
        select(FormResponse.version_id, func.count(FormResponse.id).label("total"))
        .group_by(FormResponse.version_id)
        .subquery()
    )
    query = (
        select(FormVersion, func.coalesce(counts.c.total, 0))
        .outerjoin(counts, counts.c.version_id == FormVersion.id)
        .where(FormVersion.form_id == form.id, FormVersion.version_number > 0)
    )
    if cursor:
        query = query.where(
            cursor_filter(cursor, FormVersion.version_number, FormVersion.id, numeric=True)
        )
    rows = session.execute(
        query.order_by(FormVersion.version_number.desc(), FormVersion.id.desc()).limit(limit + 1)
    ).all()
    visible = rows[:limit]
    return VersionList(
        items=[
            VersionInfo(
                id=v.id,
                version_number=v.version_number,
                title=v.title,
                source_draft_revision=v.source_draft_revision,
                published_at=utc(v.published_at),
                response_count=count,
            )
            for v, count in visible
        ],
        next_cursor=encode_cursor(visible[-1][0].version_number, visible[-1][0].id)
        if len(rows) > limit
        else None,
    )


def answer_views(
    session: Session, response: FormResponse, *, preview: bool = False
) -> list[AnswerView]:
    query = (
        select(Question, Answer, QuestionOption)
        .outerjoin(
            Answer, (Answer.question_id == Question.id) & (Answer.response_id == response.id)
        )
        .outerjoin(QuestionOption, QuestionOption.id == Answer.option_id)
        .where(Question.version_id == response.version_id)
        .order_by(Question.position)
    )
    if preview:
        query = query.limit(3)
    views = []
    for question, answer, option in session.execute(query):
        value = display = None
        if answer:
            if option:
                value, display = option.option_key, option.label
            elif answer.text_value is not None:
                value = display = answer.text_value
            elif answer.integer_value is not None:
                value = display = answer.integer_value
            else:
                value = display = answer.boolean_value
        views.append(
            AnswerView(
                question_key=question.question_key,
                type=question.type,
                title=question.title,
                value=value,
                display_value=display,
                skipped=answer is None,
            )
        )
    return views


def list_responses(
    session: Session, form: Form, version_id: str | None, limit: int, cursor: str | None
) -> ResponseList:
    query = (
        select(FormResponse, FormVersion.version_number)
        .join(FormVersion, FormVersion.id == FormResponse.version_id)
        .where(FormResponse.form_id == form.id)
    )
    if version_id:
        owned_version(session, form, version_id)
        query = query.where(FormResponse.version_id == version_id)
    if cursor:
        query = query.where(cursor_filter(cursor, FormResponse.submitted_at, FormResponse.id))
    rows = session.execute(
        query.order_by(FormResponse.submitted_at.desc(), FormResponse.id.desc()).limit(limit + 1)
    ).all()
    visible = rows[:limit]
    return ResponseList(
        items=[
            ResponseItem(
                id=r.id,
                version_id=r.version_id,
                submitted_at=utc(r.submitted_at),
                version_number=number,
                is_seed=r.is_seed,
                preview=answer_views(session, r, preview=True),
            )
            for r, number in visible
        ],
        next_cursor=encode_cursor(visible[-1][0].submitted_at, visible[-1][0].id)
        if len(rows) > limit
        else None,
    )


def response_detail(session: Session, form: Form, response_id: str) -> ResponseDetail:
    response = session.scalar(
        select(FormResponse).where(FormResponse.id == response_id, FormResponse.form_id == form.id)
    )
    if response is None:
        raise ApiError(404, "response_not_found", "This response could not be found.")
    version = owned_version(session, form, response.version_id)
    return ResponseDetail(
        id=response.id,
        version_id=version.id,
        submitted_at=utc(response.submitted_at),
        version_number=version.version_number,
        form_title=version.title,
        is_seed=response.is_seed,
        answers=answer_views(session, response),
    )


def summary(session: Session, form: Form, version_id: str | None) -> FormSummary:
    version = (
        owned_version(session, form, version_id) if version_id else latest_version(session, form)
    )
    if version is None:
        return FormSummary(
            version_id=None,
            version_number=None,
            title=form.title,
            response_count=0,
            seed_response_count=0,
            questions=[],
        )
    total, seeded = session.execute(
        select(
            func.count(FormResponse.id),
            func.coalesce(func.sum(cast(FormResponse.is_seed, Integer)), 0),
        ).where(FormResponse.version_id == version.id)
    ).one()
    questions = questions_for(session, version.id)
    options = options_for(session, version.id)
    aggregates = {
        row[0]: row[1:]
        for row in session.execute(
            select(
                Answer.question_id,
                func.count(Answer.id),
                func.min(Answer.integer_value),
                func.max(Answer.integer_value),
                func.avg(Answer.integer_value),
            )
            .where(Answer.version_id == version.id)
            .group_by(Answer.question_id)
        )
    }
    distributions = {}
    for question_id, option_id, boolean_value, integer_value, count in session.execute(
        select(
            Answer.question_id,
            Answer.option_id,
            Answer.boolean_value,
            Answer.integer_value,
            func.count(Answer.id),
        )
        .where(
            Answer.version_id == version.id,
            (
                Answer.option_id.is_not(None)
                | Answer.boolean_value.is_not(None)
                | Answer.integer_value.is_not(None)
            ),
        )
        .group_by(Answer.question_id, Answer.option_id, Answer.boolean_value, Answer.integer_value)
    ):
        distributions.setdefault(question_id, {})[(option_id, boolean_value, integer_value)] = count
    summaries = []
    for q in questions:
        answered, minimum, maximum, mean = aggregates.get(q.id, (0, None, None, None))
        counts = distributions.get(q.id, {})
        buckets = []
        if q.type in {"multiple_choice", "dropdown"}:
            buckets = [
                (o.option_key, o.label, counts.get((o.id, None, None), 0))
                for o in options.get(q.id, [])
            ]
        elif q.type == "yes_no":
            buckets = [
                (v, "Yes" if v else "No", counts.get((None, v, None), 0)) for v in [True, False]
            ]
        elif q.type == "rating":
            buckets = [
                (v, str(v), counts.get((None, None, v), 0)) for v in range(1, q.rating_max + 1)
            ]
        summaries.append(
            QuestionSummary(
                question_key=q.question_key,
                type=q.type,
                title=q.title,
                answered_count=answered,
                skipped_count=total - answered,
                minimum=minimum,
                maximum=maximum,
                mean=mean,
                distribution=[
                    DistributionItem(
                        value=value,
                        label=label,
                        count=count,
                        percentage=round(count / answered * 100, 2) if answered else 0,
                    )
                    for value, label, count in buckets
                ],
            )
        )
    return FormSummary(
        version_id=version.id,
        version_number=version.version_number,
        title=version.title,
        response_count=total,
        seed_response_count=int(seeded),
        questions=summaries,
    )
