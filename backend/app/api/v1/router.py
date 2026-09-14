from fastapi import APIRouter
from app.api.v1.endpoints import health, proxy

api_router = APIRouter()
api_router.include_router(health.router, prefix="/health", tags=["Health"])
api_router.include_router(proxy.router, prefix="/proxy", tags=["Proxy"])
