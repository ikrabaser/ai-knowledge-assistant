"""Application configuration loaded from environment variables."""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central application settings, sourced from the environment / .env file."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Application
    app_name: str = "AI Knowledge Assistant"
    app_env: str = "development"
    debug: bool = True

    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/ai_knowledge_assistant"

    # OpenAI
    openai_api_key: str = ""
    openai_chat_model: str = "gpt-4o-mini"
    openai_embedding_model: str = "text-embedding-3-small"

    # Chunking
    chunk_size: int = 800
    chunk_overlap: int = 150

    # Retrieval
    search_top_k: int = 5
    similarity_threshold: float = 0.3

    # Uploads
    max_upload_size_mb: int = 20
    upload_directory: str = "uploads"

    # Authentication
    jwt_secret_key: str = "insecure-development-secret-change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # Conversation history — bounds how much prior chat context is fed back into
    # the RAG prompt, so a long-running conversation can't grow the prompt without limit.
    conversation_history_max_messages: int = 10
    conversation_history_max_tokens: int = 2000


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance so the environment is parsed only once."""
    return Settings()
