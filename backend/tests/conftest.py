import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app


@pytest.fixture
def settings(tmp_path):
    return Settings(
        _env_file=None,
        environment="test",
        database_path=tmp_path / "database.sqlite3",
        allowed_origins=["http://localhost:3000"],
        foundation_probe_enabled=True,
    )


@pytest.fixture
def client(settings):
    with TestClient(create_app(settings)) as client:
        yield client
