"""Application-wide logging configuration.

Logs are emitted as one JSON object per line (structured logging), which is
what makes fields like `request_id`, `retrieval_duration`, `tool_name` etc.
usable by any log aggregator without custom parsing. Every log call still goes
through the standard `logging` module — callers just pass extra structured
fields via `logger.info(message, extra={...})`.

Hard rule enforced by convention across the codebase (not by this module):
never put API keys, secrets, full prompts, questions, answers, or document
content into a log call or its `extra` fields — only counts, ids, durations,
booleans and short identifiers.
"""
import json
import logging
import sys
from datetime import datetime, timezone

from app.core.request_context import get_request_id

# Attributes every stdlib LogRecord carries — anything else on the record was
# added by a caller via `extra={...}` and should be surfaced in the JSON output.
_STANDARD_RECORD_ATTRS = {
    "name", "msg", "args", "levelname", "levelno", "pathname", "filename",
    "module", "exc_info", "exc_text", "stack_info", "lineno", "funcName",
    "created", "msecs", "relativeCreated", "thread", "threadName",
    "processName", "process", "message", "taskName",
}


class JsonFormatter(logging.Formatter):
    """Renders each log record as a single-line JSON object."""

    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "timestamp": datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        request_id = get_request_id()
        if request_id:
            payload["request_id"] = request_id

        for key, value in record.__dict__.items():
            if key not in _STANDARD_RECORD_ATTRS:
                payload[key] = value

        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)

        return json.dumps(payload, default=str)


def configure_logging(debug: bool = False) -> None:
    """Configure root logging handlers and level for the application."""
    level = logging.DEBUG if debug else logging.INFO
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())

    root_logger = logging.getLogger()
    root_logger.setLevel(level)
    root_logger.handlers = [handler]

    # Quiet down noisy third-party loggers by default — pure transport-layer
    # plumbing (TCP/TLS handshakes, raw request/response frames) is never useful
    # signal, even in debug mode.
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("openai").setLevel(logging.WARNING)
    logging.getLogger("anthropic").setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    """Return a module-scoped logger."""
    return logging.getLogger(name)
