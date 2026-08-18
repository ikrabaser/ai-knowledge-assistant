"""Per-request correlation id, propagated via a contextvar so any log call —
no matter how deep in the call stack — can tag itself with the request it
belongs to, without threading a request_id parameter through every function.
"""
from contextvars import ContextVar

_request_id_var: ContextVar[str | None] = ContextVar("request_id", default=None)


def set_request_id(request_id: str) -> None:
    _request_id_var.set(request_id)


def get_request_id() -> str | None:
    return _request_id_var.get()
