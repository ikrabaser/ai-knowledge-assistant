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

    # Redis — Celery broker/result backend for asynchronous document indexing
    redis_url: str = "redis://localhost:6379/0"

    # LLM provider selection — "openai" or "anthropic". Embeddings always use OpenAI
    # (Anthropic has no public embeddings API), only chat/generation is switched.
    llm_provider: str = "openai"

    # OpenAI
    openai_api_key: str = ""
    openai_chat_model: str = "gpt-4o-mini"
    openai_embedding_model: str = "text-embedding-3-small"

    # Anthropic
    anthropic_api_key: str = ""
    anthropic_chat_model: str = "claude-3-5-sonnet-20241022"

    # Chunking
    chunk_size: int = 800
    chunk_overlap: int = 150

    # Retrieval
    search_top_k: int = 5
    similarity_threshold: float = 0.3

    # Reranking — a lightweight second-stage pass over vector-search candidates.
    # When disabled, retrieval behaves exactly as before (vector search only).
    rerank_enabled: bool = False
    retrieval_candidate_count: int = 20
    rerank_top_k: int = 5

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

    # Frontend origins allowed to call this API (comma-separated).
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    @property
    def cors_allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance so the environment is parsed only once."""
    return Settings()
