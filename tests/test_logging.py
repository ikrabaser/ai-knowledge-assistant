"""Tests for structured JSON logging and request correlation."""
import json
import logging

from app.core.logging import JsonFormatter
from app.core.request_context import get_request_id, set_request_id


def _format(logger_name: str, message: str, extra: dict | None = None) -> dict:
    record = logging.LogRecord(
        name=logger_name,
        level=logging.INFO,
        pathname=__file__,
        lineno=1,
        msg=message,
        args=(),
        exc_info=None,
    )
    for key, value in (extra or {}).items():
        setattr(record, key, value)
    return json.loads(JsonFormatter().format(record))


def test_format_produces_valid_json_with_core_fields() -> None:
    payload = _format("app.services.rag_service", "RAG request completed")

    assert payload["message"] == "RAG request completed"
    assert payload["level"] == "INFO"
    assert payload["logger"] == "app.services.rag_service"
    assert "timestamp" in payload


def test_format_surfaces_extra_structured_fields() -> None:
    payload = _format(
        "app.services.rag_service",
        "RAG request completed",
        extra={"workspace_id": 3, "retrieval_duration_ms": 12.5, "success": True},
    )

    assert payload["workspace_id"] == 3
    assert payload["retrieval_duration_ms"] == 12.5
    assert payload["success"] is True


def test_format_includes_request_id_when_set() -> None:
    set_request_id("test-request-id-123")
    try:
        payload = _format("app.main", "Handled request")
        assert payload["request_id"] == "test-request-id-123"
    finally:
        set_request_id(None)  # type: ignore[arg-type]


def test_format_omits_request_id_when_unset() -> None:
    set_request_id(None)  # type: ignore[arg-type]

    payload = _format("app.main", "Handled request")

    assert "request_id" not in payload


def test_get_request_id_round_trips_through_set_request_id() -> None:
    set_request_id("abc-123")
    try:
        assert get_request_id() == "abc-123"
    finally:
        set_request_id(None)  # type: ignore[arg-type]


def test_format_never_includes_raw_python_log_record_internals() -> None:
    """Sanity check that we don't leak internal LogRecord bookkeeping fields."""
    payload = _format("app.services.rag_service", "RAG request completed")

    assert "args" not in payload
    assert "msg" not in payload
    assert "pathname" not in payload
