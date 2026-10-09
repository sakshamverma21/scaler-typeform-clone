from pathlib import Path
from typing import Literal
from urllib.parse import urlsplit

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="TYPEFORM_", env_file=".env", extra="ignore")

    environment: Literal["development", "test", "production"] = "development"
    database_path: Path = Path("data/typeform.sqlite3")
    allowed_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000"])
    foundation_probe_enabled: bool = False
    session_days: int = Field(default=30, ge=1, le=90)

    @field_validator("database_path")
    @classmethod
    def normalize_database_path(cls, value: Path) -> Path:
        return value.expanduser().resolve()

    @field_validator("allowed_origins")
    @classmethod
    def validate_origins(cls, values: list[str]) -> list[str]:
        if not values:
            raise ValueError("At least one allowed frontend origin is required")
        for value in values:
            parsed = urlsplit(value)
            if (
                parsed.scheme not in {"http", "https"}
                or not parsed.netloc
                or parsed.path
                or parsed.query
                or parsed.fragment
                or parsed.username
                or parsed.password
                or "*" in value
            ):
                raise ValueError(
                    "Origins must be explicit HTTP(S) origins without a trailing slash"
                )
        return list(dict.fromkeys(values))

    @model_validator(mode="after")
    def require_production_https(self) -> "Settings":
        if self.environment == "production" and any(
            not value.startswith("https://") for value in self.allowed_origins
        ):
            raise ValueError("Production frontend origins must use HTTPS")
        return self

    @property
    def secure_cookies(self) -> bool:
        return self.environment == "production"
