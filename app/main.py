"""FastAPI application entrypoint."""
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.api.routes import documents, health, search
from app.core.config import get_settings
from app.core.exceptions import AppError
from app.core.logging import configure_logging, get_logger

settings = get_settings()
configure_logging(debug=settings.debug)
logger = get_logger(__name__)

app = FastAPI(
    title=settings.app_name,
    description="Upload documents and ask questions about them using Retrieval-Augmented Generation.",
    version="0.1.0",
)

app.include_router(health.router)
app.include_router(documents.router)
app.include_router(search.router)


@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    """Translate domain errors into clean HTTP responses without leaking internals."""
    logger.warning("Handled application error: %s", exc.message)
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})


@app.get("/")
async def root() -> dict[str, str]:
    """Basic application info."""
    return {
        "name": settings.app_name,
        "environment": settings.app_env,
        "docs": "/docs",
    }
