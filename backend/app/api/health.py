from fastapi import APIRouter, Request
from pydantic import BaseModel
from sqlalchemy.exc import SQLAlchemyError

from app.api.errors import ApiError
from app.db.migrations import database_is_current

router = APIRouter(prefix="/health", tags=["health"])


class HealthResponse(BaseModel):
    status: str


@router.get("/live", response_model=HealthResponse)
def live() -> HealthResponse:
    return HealthResponse(status="ok")


@router.get("/ready", response_model=HealthResponse)
def ready(request: Request) -> HealthResponse:
    try:
        healthy = request.app.state.migrations_ready and database_is_current(
            request.app.state.engine
        )
    except SQLAlchemyError:
        healthy = False
    if not healthy:
        raise ApiError(503, "not_ready", "The service is not ready yet.")
    return HealthResponse(status="ready")
