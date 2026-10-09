from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.api import foundation, health
from app.api.errors import (
    ApiError,
    api_error_handler,
    database_error_handler,
    validation_error_handler,
)
from app.config import Settings
from app.db.migrations import upgrade_database
from app.db.session import create_database_engine, create_session_factory


def create_app(settings: Settings | None = None, *, migrate_on_startup: bool = True) -> FastAPI:
    settings = settings or Settings()
    engine = create_database_engine(settings)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        app.state.migrations_ready = False
        if migrate_on_startup:
            upgrade_database(engine)
            app.state.migrations_ready = True
        try:
            yield
        finally:
            engine.dispose()

    app = FastAPI(title="Typeform Clone API", version="0.1.0", lifespan=lifespan)
    app.state.settings = settings
    app.state.engine = engine
    app.state.session_factory = create_session_factory(engine)
    app.state.migrations_ready = False
    app.add_exception_handler(ApiError, api_error_handler)
    app.add_exception_handler(RequestValidationError, validation_error_handler)
    app.add_exception_handler(SQLAlchemyError, database_error_handler)

    @app.middleware("http")
    async def protect_api(request: Request, call_next):
        if request.method not in {"GET", "HEAD", "OPTIONS"}:
            if request.headers.get("origin") not in settings.allowed_origins:
                return JSONResponse(
                    status_code=403,
                    content={
                        "code": "origin_not_allowed",
                        "message": "This origin is not allowed.",
                    },
                    headers={"Cache-Control": "no-store"},
                )
        response = await call_next(request)
        response.headers["Cache-Control"] = "no-store"
        response.headers["X-Content-Type-Options"] = "nosniff"
        return response

    app.include_router(health.router, prefix="/api/v1")
    if settings.foundation_probe_enabled:
        app.include_router(foundation.router, prefix="/api/v1")
    return app


app = create_app()
