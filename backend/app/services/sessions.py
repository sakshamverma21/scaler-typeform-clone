from datetime import timedelta

from sqlalchemy.orm import Session

from app.db.models import CreatorSession, Workspace
from app.security import hash_token, new_opaque_token
from app.services.common import now
from app.services.seed import seed_workspace


def initialize_workspace(session: Session, days: int) -> tuple[CreatorSession, Workspace, str]:
    timestamp = now()
    workspace = Workspace(name="My workspace", created_at=timestamp)
    session.add(workspace)
    session.flush()
    token = new_opaque_token()
    creator = CreatorSession(
        workspace_id=workspace.id,
        token_hash=hash_token(token),
        created_at=timestamp,
        expires_at=timestamp + timedelta(days=days),
    )
    session.add(creator)
    seed_workspace(session, workspace)
    session.flush()
    return creator, workspace, token
