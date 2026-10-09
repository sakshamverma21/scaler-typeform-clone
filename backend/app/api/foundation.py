from datetime import UTC, datetime

from fastapi import APIRouter, Request, Response
from pydantic import BaseModel

from app.api.errors import ApiError
from app.services.probe import find_probe, initialize_probe

router = APIRouter(prefix="/foundation", tags=["foundation diagnostics"])
PROBE_COOKIE = "typeform_foundation"


class ProbeResponse(BaseModel):
    id: str
    created_at: datetime


def probe_response(probe) -> ProbeResponse:
    return ProbeResponse(id=probe.id, created_at=probe.created_at.replace(tzinfo=UTC))


@router.post("/probe", response_model=ProbeResponse)
def create_probe(request: Request, response: Response) -> ProbeResponse:
    settings = request.app.state.settings
    with request.app.state.session_factory() as session:
        probe, token = initialize_probe(
            session, request.cookies.get(PROBE_COOKIE), settings.session_days
        )
        if token:
            response.set_cookie(
                PROBE_COOKIE,
                token,
                max_age=settings.session_days * 86400,
                httponly=True,
                secure=settings.secure_cookies,
                samesite="lax",
                path="/",
            )
        return probe_response(probe)


@router.get("/probe", response_model=ProbeResponse)
def get_probe(request: Request) -> ProbeResponse:
    with request.app.state.session_factory() as session:
        probe = find_probe(session, request.cookies.get(PROBE_COOKIE))
        if not probe:
            raise ApiError(401, "probe_session_missing", "Run the connection check first.")
        return probe_response(probe)
