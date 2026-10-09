from datetime import UTC, datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError
from sqlalchemy import select, text

from app.config import Settings
from app.db.models import FoundationProbe
from app.main import create_app
from app.security import hash_token

ORIGIN = {"Origin": "http://localhost:3000"}
PATH = "/api/v1/foundation/probe"


def test_liveness_readiness_and_no_cache(client):
    assert client.get("/api/v1/health/live").json() == {"status": "ok"}
    response = client.get("/api/v1/health/ready")
    assert response.json() == {"status": "ready"}
    assert response.headers["cache-control"] == "no-store"
    assert "database" not in response.text


def test_readiness_requires_migration(settings):
    with TestClient(create_app(settings, migrate_on_startup=False)) as client:
        assert client.get("/api/v1/health/live").status_code == 200
        response = client.get("/api/v1/health/ready")
        assert response.status_code == 503
        assert response.json()["code"] == "not_ready"


def test_cookie_round_trip_is_idempotent_and_hashed(client):
    created = client.post(PATH, headers=ORIGIN)
    assert created.status_code == 200
    cookie = created.headers["set-cookie"]
    assert "HttpOnly" in cookie and "SameSite=lax" in cookie and "Path=/" in cookie
    assert "Max-Age=2592000" in cookie and "Secure" not in cookie
    assert client.get(PATH).json() == created.json()
    assert client.post(PATH, headers=ORIGIN).json() == created.json()
    with client.app.state.session_factory() as session:
        records = session.scalars(select(FoundationProbe)).all()
        assert len(records) == 1
        assert records[0].token_hash == hash_token(client.cookies["typeform_foundation"])
        assert records[0].token_hash != client.cookies["typeform_foundation"]


def test_cookie_and_record_survive_new_application(settings):
    with TestClient(create_app(settings)) as first:
        saved = first.post(PATH, headers=ORIGIN).json()
        cookies = dict(first.cookies)
    with TestClient(create_app(settings)) as restarted:
        restarted.cookies.update(cookies)
        assert restarted.get(PATH).json() == saved
        assert restarted.post(PATH, headers=ORIGIN).json() == saved


def test_separate_browsers_cannot_read_each_others_record(settings):
    with TestClient(create_app(settings)) as first, TestClient(create_app(settings)) as second:
        assert second.get(PATH).status_code == 401
        a = first.post(PATH, headers=ORIGIN).json()
        b = second.post(PATH, headers=ORIGIN).json()
        assert a["id"] != b["id"]
        assert first.get(PATH).json() == a
        assert second.get(PATH).json() == b


@pytest.mark.parametrize("origin", [None, "https://foreign.example", "null"])
def test_untrusted_origin_cannot_write(client, origin):
    response = client.post(PATH, headers={"Origin": origin} if origin else {})
    assert response.status_code == 403
    assert response.json()["code"] == "origin_not_allowed"
    assert response.headers["cache-control"] == "no-store"


def test_expired_cookie_creates_new_record(client):
    old = client.post(PATH, headers=ORIGIN).json()
    with client.app.state.session_factory() as session:
        record = session.get(FoundationProbe, old["id"])
        record.expires_at = datetime.now(UTC).replace(tzinfo=None) - timedelta(seconds=1)
        session.commit()
    assert client.get(PATH).status_code == 401
    assert client.post(PATH, headers=ORIGIN).json()["id"] != old["id"]


def test_production_cookie_is_secure(tmp_path):
    settings = Settings(
        _env_file=None,
        environment="production",
        database_path=tmp_path / "secure.sqlite3",
        allowed_origins=["https://forms.example.com"],
        foundation_probe_enabled=True,
    )
    with TestClient(create_app(settings), base_url="https://api.example.com") as client:
        response = client.post(PATH, headers={"Origin": "https://forms.example.com"})
        assert "Secure" in response.headers["set-cookie"]
        assert "Domain=" not in response.headers["set-cookie"]
        assert client.get(PATH).status_code == 200


def test_probe_is_disabled_unless_explicitly_enabled(tmp_path):
    settings = Settings(_env_file=None, database_path=tmp_path / "disabled.sqlite3")
    with TestClient(create_app(settings)) as client:
        assert client.get(PATH).status_code == 404
        assert client.get("/api/v1/health/ready").status_code == 200


def test_sqlite_pragmas_on_multiple_connections(client):
    engine = client.app.state.engine
    with engine.connect() as first, engine.connect() as second:
        for connection in [first, second]:
            assert connection.scalar(text("PRAGMA foreign_keys")) == 1
            assert connection.scalar(text("PRAGMA busy_timeout")) == 5000
            assert connection.scalar(text("PRAGMA journal_mode")) == "delete"


def test_database_failure_returns_recoverable_error(client):
    with client.app.state.engine.begin() as connection:
        connection.execute(text("DROP TABLE foundation_probes"))
    response = client.post(PATH, headers=ORIGIN)
    assert response.status_code == 503
    assert response.json()["code"] == "database_unavailable"
    assert "sqlite" not in response.text


@pytest.mark.parametrize(
    "origin", ["*", "https://example.com/", "ftp://example.com", "https://a:b@example.com"]
)
def test_invalid_origin_configuration_fails(origin):
    with pytest.raises(ValidationError):
        Settings(_env_file=None, allowed_origins=[origin])


def test_production_rejects_http_origin():
    with pytest.raises(ValidationError):
        Settings(_env_file=None, environment="production", allowed_origins=["http://example.com"])
