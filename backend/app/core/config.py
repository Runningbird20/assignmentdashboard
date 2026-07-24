from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    app_name: str = "StudentOS"
    debug: bool = False

    database_url: str = "sqlite:///./studentos.db"

    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    # Where uploaded class files are stored on disk. Swappable: everything
    # that touches storage goes through services/file_storage.py, so moving
    # to S3-compatible storage later only means rewriting that one module.
    upload_dir: str = "./uploads"

    # Google Sheets import: fetched via the sheet's public CSV export
    # endpoint, so the sheet must be shared as "Anyone with the link can view".
    google_sheet_url: str | None = None

    # Background auto-sync of the configured sheet.
    auto_sync_enabled: bool = False
    sync_interval_minutes: int = 60

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
