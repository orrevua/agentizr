from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="AGENTIZR_", env_file=".env", extra="ignore")

    cors_origins: list[str] = ["http://localhost:3000"]
    api_prefix: str = "/api/v1"
    env: Literal["dev", "prod"] = "dev"


settings = Settings()
