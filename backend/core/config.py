# backend/core/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGO_CONNECTION_STRING: str
    MONGO_DATABASE_NAME: str
    LLM_PROVIDER: str = "gemini"
    GEMINI_MODEL: str = "gemini-2.5-flash"
    GOOGLE_API_KEY: str | None = None
    TTS_PROVIDER: str = "azure"
    AZURE_TTS_KEY: str | None = None
    AZURE_TTS_REGION: str | None = None

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()