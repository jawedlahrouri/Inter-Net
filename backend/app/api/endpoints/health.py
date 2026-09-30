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
    @brief Reports the service health status with its version and current UTC timestamp.
    @return A HealthResponse with status ok, version, UTC timestamp and project name.
    """
    return HealthResponse(
        status="ok",
        version=settings.VERSION,
        timestamp=datetime.now(timezone.utc),
        service=settings.PROJECT_NAME,
    )
