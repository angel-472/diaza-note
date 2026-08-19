from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=ENV_FILE, extra="ignore")

    database_url: str
    jwt_secret: str

    # Browsers refuse a Secure cookie over plain http, so local dev sets this
    # false in .env. Defaulting to true keeps the unsafe value opt-in.
    cookie_secure: bool = True


settings = Settings()
