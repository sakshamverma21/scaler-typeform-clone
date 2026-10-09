import re
from typing import Annotated

from fastapi import Depends, Header, Request
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.api.errors import ApiError
from app.db.models import CreatorSession, Workspace
from app.security import hash_token
from app.services.common import now

CREATOR_COOKIE = "typeform_creator"


def database(request: Request):
    with request.app.state.session_factory() as session:
        # Acquire SQLite's write reservation before reading a revision or publication state.
        # Commit errors must happen before a successful HTTP response is sent.
        statement = "BEGIN" if request.method in {"GET", "HEAD", "OPTIONS"} else "BEGIN IMMEDIATE"
        session.execute(text(statement))
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise


Database = Annotated[Session, Depends(database, scope="function")]


def active_session(session: Session, token: str | None) -> CreatorSession | None:
    if not token or len(token) > 128:
        return None
    return session.scalar(
        select(CreatorSession).where(
            CreatorSession.token_hash == hash_token(token), CreatorSession.expires_at > now()
        )
    )


def creator_workspace(request: Request, session: Database) -> Workspace:
    creator = active_session(session, request.cookies.get(CREATOR_COOKIE))
    if creator is None:
        raise ApiError(401, "session_required", "Open the workspace to start a creator session.")
    return session.get(Workspace, creator.workspace_id)


CreatorWorkspace = Annotated[Workspace, Depends(creator_workspace)]


def revision(if_match: Annotated[str | None, Header()] = None) -> int:
    if if_match is None:
        raise ApiError(428, "revision_required", "Provide the draft revision in If-Match.")
    if not re.fullmatch(r'"(0|[1-9][0-9]{0,15})"', if_match):
        raise ApiError(422, "invalid_revision", 'If-Match must be a quoted revision, such as "0".')
    return int(if_match[1:-1])


Revision = Annotated[int, Depends(revision)]
