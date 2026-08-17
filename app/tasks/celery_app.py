"""Celery application instance, used both by the API process (to enqueue tasks)
and by the worker process (to execute them).
"""
from celery import Celery

from app.core.config import get_settings

settings = get_settings()

celery_app = Celery(
    "ai_knowledge_assistant",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.tasks.document_indexing_task"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    # Keep task state around briefly for debugging; nothing here polls for results.
    result_expires=3600,
    broker_connection_retry_on_startup=True,
)
