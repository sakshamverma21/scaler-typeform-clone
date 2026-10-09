from typing import Annotated

from fastapi import APIRouter, Query, Request, Response

from app.api.dependencies import (
    CREATOR_COOKIE,
    CreatorWorkspace,
    Database,
    Revision,
    active_session,
)
from app.db.models import Workspace
from app.schemas.forms import (
    CreateForm,
    FormDetail,
    FormList,
    FormMetadata,
    FormSummary,
    OperationResult,
    RenameForm,
    ResponseDetail,
    ResponseList,
    SaveDraft,
    SessionInfo,
    VersionList,
)
from app.services import forms, publishing, results
from app.services.common import owned_form, utc
from app.services.sessions import initialize_workspace

router = APIRouter(prefix="/creator", tags=["Creator"])
PageSize = Annotated[int, Query(ge=1, le=100)]
Cursor = Annotated[str | None, Query(max_length=512)]


def etag(response: Response, revision: int) -> None:
    response.headers["ETag"] = f'"{revision}"'


@router.post("/session", response_model=SessionInfo)
def bootstrap(request: Request, response: Response, session: Database):
    settings = request.app.state.settings
    creator = active_session(session, request.cookies.get(CREATOR_COOKIE))
    if creator:
        workspace = session.get(Workspace, creator.workspace_id)
    else:
        creator, workspace, token = initialize_workspace(session, settings.session_days)
        response.set_cookie(
            CREATOR_COOKIE,
            token,
            max_age=settings.session_days * 86400,
            httponly=True,
            secure=settings.secure_cookies,
            samesite="lax",
            path="/",
        )
    return SessionInfo(
        workspace_id=workspace.id, workspace_name=workspace.name, expires_at=utc(creator.expires_at)
    )


@router.get("/forms", response_model=FormList)
def list_forms(
    session: Database, workspace: CreatorWorkspace, limit: PageSize = 30, cursor: Cursor = None
):
    return forms.list_forms(session, workspace.id, limit, cursor)


@router.post("/forms", response_model=FormDetail, status_code=201)
def create_form(
    body: CreateForm, response: Response, session: Database, workspace: CreatorWorkspace
):
    form = forms.create_form(session, workspace.id, body.title)
    etag(response, form.draft_revision)
    return forms.detail(session, form)


@router.get("/forms/{form_id}", response_model=FormDetail)
def get_form(form_id: str, response: Response, session: Database, workspace: CreatorWorkspace):
    form = owned_form(session, workspace.id, form_id)
    etag(response, form.draft_revision)
    return forms.detail(session, form)


@router.patch("/forms/{form_id}", response_model=FormDetail)
def rename_form(
    form_id: str,
    body: RenameForm,
    response: Response,
    session: Database,
    workspace: CreatorWorkspace,
    revision: Revision,
):
    result = forms.rename_form(
        session, owned_form(session, workspace.id, form_id), body.title, revision
    )
    etag(response, result.form.draft_revision)
    return result


@router.put("/forms/{form_id}/draft", response_model=FormDetail)
def save_draft(
    form_id: str,
    body: SaveDraft,
    response: Response,
    session: Database,
    workspace: CreatorWorkspace,
    revision: Revision,
):
    result = forms.save_draft(session, owned_form(session, workspace.id, form_id), body, revision)
    etag(response, result.form.draft_revision)
    return result


@router.post("/forms/{form_id}/duplicate", response_model=FormDetail, status_code=201)
def duplicate_form(
    form_id: str,
    response: Response,
    session: Database,
    workspace: CreatorWorkspace,
    revision: Revision,
):
    result = forms.duplicate_form(session, owned_form(session, workspace.id, form_id), revision)
    etag(response, result.form.draft_revision)
    return result


@router.delete("/forms/{form_id}", response_model=OperationResult)
def delete_form(form_id: str, session: Database, workspace: CreatorWorkspace):
    forms.delete_form(session, owned_form(session, workspace.id, form_id))
    return OperationResult(status="deleted")


@router.post("/forms/{form_id}/publish", response_model=FormMetadata)
def publish_form(form_id: str, session: Database, workspace: CreatorWorkspace, revision: Revision):
    form = owned_form(session, workspace.id, form_id)
    publishing.publish(session, form, revision)
    return forms.metadata(session, form)


@router.post("/forms/{form_id}/unpublish", response_model=FormMetadata)
def unpublish_form(form_id: str, session: Database, workspace: CreatorWorkspace):
    form = owned_form(session, workspace.id, form_id)
    publishing.unpublish(session, form)
    return forms.metadata(session, form)


@router.get("/forms/{form_id}/versions", response_model=VersionList)
def versions(
    form_id: str,
    session: Database,
    workspace: CreatorWorkspace,
    limit: PageSize = 30,
    cursor: Cursor = None,
):
    return results.list_versions(session, owned_form(session, workspace.id, form_id), limit, cursor)


@router.get("/forms/{form_id}/responses", response_model=ResponseList)
def responses(
    form_id: str,
    session: Database,
    workspace: CreatorWorkspace,
    limit: PageSize = 30,
    cursor: Cursor = None,
    version_id: str | None = None,
):
    return results.list_responses(
        session, owned_form(session, workspace.id, form_id), version_id, limit, cursor
    )


@router.get("/forms/{form_id}/responses/{response_id}", response_model=ResponseDetail)
def response_detail(form_id: str, response_id: str, session: Database, workspace: CreatorWorkspace):
    return results.response_detail(session, owned_form(session, workspace.id, form_id), response_id)


@router.get("/forms/{form_id}/summary", response_model=FormSummary)
def summary(
    form_id: str, session: Database, workspace: CreatorWorkspace, version_id: str | None = None
):
    return results.summary(session, owned_form(session, workspace.id, form_id), version_id)
