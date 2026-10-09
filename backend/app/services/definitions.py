from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.api.errors import ApiError
from app.db.models import FormVersion, Question, QuestionOption
from app.schemas.forms import DraftDefinition, OptionDefinition, QuestionDefinition, QuestionType


def questions_for(session: Session, version_id: str) -> list[Question]:
    return list(
        session.scalars(
            select(Question).where(Question.version_id == version_id).order_by(Question.position)
        )
    )


def options_for(session: Session, version_id: str) -> dict[str, list[QuestionOption]]:
    options = session.scalars(
        select(QuestionOption)
        .join(Question, QuestionOption.question_id == Question.id)
        .where(Question.version_id == version_id)
        .order_by(QuestionOption.position)
    )
    result: dict[str, list[QuestionOption]] = {}
    for option in options:
        result.setdefault(option.question_id, []).append(option)
    return result


def read_definition(session: Session, version: FormVersion) -> DraftDefinition:
    options = options_for(session, version.id)
    return DraftDefinition(
        title=version.title,
        theme_settings=version.theme_settings,
        ending_settings=version.ending_settings,
        questions=[
            QuestionDefinition(
                question_key=q.question_key,
                type=q.type,
                title=q.title,
                description=q.description,
                required=q.required,
                rating_max=q.rating_max,
                options=[
                    OptionDefinition(option_key=o.option_key, label=o.label)
                    for o in options.get(q.id, [])
                ],
            )
            for q in questions_for(session, version.id)
        ],
    )


def write_definition(session: Session, version: FormVersion, definition: DraftDefinition) -> None:
    """Draft rows can be replaced; positive published versions are never rewritten."""
    version.title = definition.title
    version.theme_settings = definition.theme_settings.model_dump()
    version.ending_settings = definition.ending_settings.model_dump()
    for position, item in enumerate(definition.questions):
        question = Question(
            version_id=version.id,
            question_key=item.question_key,
            type=item.type.value,
            title=item.title,
            description=item.description,
            required=item.required,
            position=position,
            rating_max=item.rating_max,
        )
        session.add(question)
        session.flush()
        session.add_all(
            [
                QuestionOption(
                    question_id=question.id,
                    option_key=option.option_key,
                    label=option.label,
                    position=index,
                )
                for index, option in enumerate(item.options)
            ]
        )
    session.flush()


def replace_draft(session: Session, version: FormVersion, definition: DraftDefinition) -> None:
    if version.version_number != 0:
        raise ValueError("Published definitions are immutable")
    session.execute(delete(Question).where(Question.version_id == version.id))
    write_definition(session, version, definition)


def validate_publication(definition: DraftDefinition) -> None:
    errors = []
    if not definition.title.strip():
        errors.append({"field": "title", "message": "Give your form a title."})
    if not definition.questions:
        errors.append({"field": "questions", "message": "Add at least one question."})
    for q in definition.questions:
        if not q.title.strip():
            errors.append({"question_key": q.question_key, "message": "Enter a question prompt."})
        if q.type in {QuestionType.MULTIPLE_CHOICE, QuestionType.DROPDOWN}:
            minimum = 2 if q.type == QuestionType.MULTIPLE_CHOICE else 1
            if len(q.options) < minimum or any(not o.label.strip() for o in q.options):
                errors.append(
                    {
                        "question_key": q.question_key,
                        "message": f"Add at least {minimum} nonblank choices.",
                    }
                )
    if errors:
        raise ApiError(422, "invalid_publication", "Finish these fields before publishing.", errors)
