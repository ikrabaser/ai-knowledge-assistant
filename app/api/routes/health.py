"""Health check endpoint."""
from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check() -> dict[str, str]:
    """Simple liveness check used by orchestrators and monitoring."""
    return {"status": "healthy", "service": "ai-knowledge-assistant"}
