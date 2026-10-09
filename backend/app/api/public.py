from fastapi import APIRouter

from app.api.dependencies import Database
from app.schemas.forms import PublicForm, SubmissionReceipt, SubmitResponse
from app.services import publishing, submissions

router = APIRouter(prefix="/public", tags=["Public forms"])


@router.get("/forms/{slug}", response_model=PublicForm)
def form_definition(slug: str, session: Database):
    return publishing.public_definition(session, publishing.public_form(session, slug))


@router.post("/forms/{slug}/responses", response_model=SubmissionReceipt, status_code=201)
def submit_response(slug: str, body: SubmitResponse, session: Database):
    # A previously committed retry can retrieve its receipt even after closure.
    form = publishing.public_form(session, slug, require_open=False)
    return submissions.submit(session, form, body)
