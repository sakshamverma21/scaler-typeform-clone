import re

from app.api.errors import ApiError
from app.db.models import Question, QuestionOption
from app.schemas.forms import SubmittedAnswer


def valid_email(value: str) -> bool:
    if len(value) > 254 or value.count("@") != 1:
        return False
    local, domain = value.rsplit("@", 1)
    if (
        not local
        or len(local) > 64
        or local.startswith(".")
        or local.endswith(".")
        or ".." in local
    ):
        return False
    if not re.fullmatch(r"[A-Za-z0-9!#$%&'*+/=?^_`{|}~.\-]+", local):
        return False
    try:
        domain = domain.encode("idna").decode("ascii")
    except UnicodeError:
        return False
    labels = domain.split(".")
    return len(labels) >= 2 and all(
        re.fullmatch(r"[A-Za-z0-9](?:[A-Za-z0-9\-]{0,61}[A-Za-z0-9])?", label) for label in labels
    )


def normalize_answers(
    questions: list[Question],
    options: dict[str, list[QuestionOption]],
    answers: list[SubmittedAnswer],
) -> dict[str, str | int | bool]:
    supplied = {}
    errors = []
    keys = {q.question_key for q in questions}
    for answer in answers:
        if answer.question_key not in keys:
            errors.append({"question_key": answer.question_key, "message": "Unknown question."})
        elif answer.question_key in supplied:
            errors.append(
                {"question_key": answer.question_key, "message": "Answer supplied twice."}
            )
        supplied[answer.question_key] = answer.value
    normalized = {}
    for q in questions:
        value = supplied.get(q.question_key)
        if value is None or (isinstance(value, str) and not value.strip()):
            if q.required:
                errors.append({"question_key": q.question_key, "message": "Please fill this in."})
            continue
        message = None
        if q.type in {"short_text", "long_text", "email"}:
            if type(value) is not str:
                message = "Enter a text answer."
            else:
                value = value.strip()
                maximum = {"short_text": 999, "long_text": 10000, "email": 254}[q.type]
                if len(value) > maximum:
                    message = f"Use at most {maximum} characters."
                elif q.type == "short_text" and ("\n" in value or "\r" in value):
                    message = "Use a single line of text."
                elif q.type == "email" and not valid_email(value):
                    message = "Enter a valid email address."
        elif q.type in {"multiple_choice", "dropdown"}:
            if type(value) is not str or value not in {o.option_key for o in options.get(q.id, [])}:
                message = "Select a choice from this question."
        elif q.type == "yes_no":
            if type(value) is not bool:
                message = "Choose Yes or No."
        else:
            maximum = q.rating_max if q.type == "rating" else 999999999999999
            minimum = 1 if q.type == "rating" else 0
            if type(value) is not int or not minimum <= value <= maximum:
                message = f"Enter a whole number from {minimum} to {maximum}."
        if message:
            errors.append({"question_key": q.question_key, "message": message})
        else:
            normalized[q.question_key] = value
    if errors:
        raise ApiError(422, "invalid_answers", "Check your answers and try again.", errors)
    return normalized
