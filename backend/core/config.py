# backend/core/config.py
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGO_CONNECTION_STRING: str
    MONGO_DATABASE_NAME: str
    LLM_PROVIDER: str = "gemini"
    GEMINI_MODEL: str = "gemini-2.5-flash"
    GOOGLE_API_KEY: Optional[str] = None
    GOOGLE_APPLICATION_CREDENTIALS: Optional[str] = None
    TTS_PROVIDER: str = "azure"
    AZURE_TTS_KEY: Optional[str] = None
    AZURE_TTS_REGION: Optional[str] = None
    AZURE_TTS_ENDPOINT: str

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()