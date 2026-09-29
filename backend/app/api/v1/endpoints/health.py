from datetime import datetime, timezone
from fastapi import APIRouter
from pydantic import BaseModel
from app.core.config import settings

router = APIRouter()


class HealthResponse(BaseModel):
    status: str
    version: str
    timestamp: datetime
    service: str


@router.get("", response_model=HealthResponse)
def get_health() -> HealthResponse:
    """
    @brief Handles the health check endpoint by reporting service status, version and current time.
    @return A HealthResponse with status ok, the app version, the current UTC timestamp and the service name.
    """
    return HealthResponse(
        status="ok",
        version=settings.VERSION,
        timestamp=datetime.now(timezone.utc),
        service=settings.PROJECT_NAME,
    )

