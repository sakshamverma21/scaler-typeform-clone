import re

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError


class ApiError(Exception):
    def __init__(self, status: int, code: str, message: str, errors: list[dict] | None = None):
        self.status = status
        self.code = code
        self.message = message
        self.errors = errors


async def api_error_handler(_request: Request, error: ApiError) -> JSONResponse:
    content = {"code": error.code, "message": error.message}
    if error.errors is not None:
        content["errors"] = error.errors
    return JSONResponse(status_code=error.status, content=content)


async def validation_error_handler(
    _request: Request, error: RequestValidationError
) -> JSONResponse:
    errors = []
    for item in error.errors():
        location = item["loc"]
        field = {"field": ".".join(map(str, location)), "message": item["msg"]}
        # Union/type failures happen before domain validation. Preserve a valid logical
        # key so the future runner can show that error beside the affected question.
        if (
            isinstance(error.body, dict)
            and len(location) >= 3
            and location[:2] == ("body", "answers")
            and type(location[2]) is int
        ):
            answers = error.body.get("answers")
            index = location[2]
            if isinstance(answers, list) and 0 <= index < len(answers):
                answer = answers[index]
                key = answer.get("question_key") if isinstance(answer, dict) else None
                if isinstance(key, str) and re.fullmatch(
                    r"[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}", key
                ):
                    field["question_key"] = key
        errors.append(field)
    return JSONResponse(
        status_code=422,
        content={
            "code": "validation_error",
            "message": "Check the supplied values.",
            "errors": errors,
        },
    )


async def database_error_handler(_request: Request, _error: SQLAlchemyError) -> JSONResponse:
    return JSONResponse(
        status_code=503,
        content={"code": "database_unavailable", "message": "Please try again in a moment."},
    )
