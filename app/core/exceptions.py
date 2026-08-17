"""Domain-specific exceptions used across services and translated to HTTP responses."""


class AppError(Exception):
    """Base class for all handled application errors."""

    status_code: int = 500

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class UnsupportedFileTypeError(AppError):
    """Raised when an uploaded file's extension/content-type is not supported."""

    status_code = 415


class FileTooLargeError(AppError):
    """Raised when an uploaded file exceeds the configured size limit."""

    status_code = 413


class DocumentNotFoundError(AppError):
    """Raised when a requested document id does not exist."""

    status_code = 404


class ParsingError(AppError):
    """Raised when text extraction from a document fails (corrupt/empty/unreadable)."""

    status_code = 422


class EmbeddingProviderError(AppError):
    """Raised when the embedding provider (OpenAI) fails or times out."""

    status_code = 502


class ChatProviderError(AppError):
    """Raised when the chat completion provider (OpenAI) fails or times out."""

    status_code = 502
