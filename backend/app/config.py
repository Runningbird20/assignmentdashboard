from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from the environment / .env file."""

    canvas_api_url: str = ""
    canvas_access_token: str = ""
    slack_webhook_url: str = ""
    database_url: str = "sqlite:///canvas.db"
    sync_interval_hours: int = 1

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def canvas_configured(self) -> bool:
        return bool(self.canvas_api_url and self.canvas_access_token)

    @property
    def slack_configured(self) -> bool:
        return bool(self.slack_webhook_url)


@lru_cache
def get_settings() -> Settings:
    return Settings()
