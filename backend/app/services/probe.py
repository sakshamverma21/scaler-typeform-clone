from datetime import UTC, datetime, timedelta
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import FoundationProbe
from app.security import hash_token, new_opaque_token


def find_probe(session: Session, token: str | None) -> FoundationProbe | None:
    if not token or len(token) > 128:
        return None
    return session.scalar(
        select(FoundationProbe).where(
            FoundationProbe.token_hash == hash_token(token),
            FoundationProbe.expires_at > datetime.now(UTC).replace(tzinfo=None),
        )
    )


def initialize_probe(
    session: Session, token: str | None, session_days: int
) -> tuple[FoundationProbe, str | None]:
    existing = find_probe(session, token)
    if existing:
        return existing, None
    new_token = new_opaque_token()
    now = datetime.now(UTC).replace(tzinfo=None)
    probe = FoundationProbe(
        id=str(uuid4()),
        token_hash=hash_token(new_token),
        created_at=now,
        expires_at=now + timedelta(days=session_days),
    )
    session.add(probe)
    session.commit()
    return probe, new_token
