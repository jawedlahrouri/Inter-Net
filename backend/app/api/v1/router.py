from fastapi import APIRouter
from app.api.v1.endpoints import health, quotes
from app.api.endpoints import auth

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(health.router, prefix="/health", tags=["Health"])
api_router.include_router(quotes.router, prefix="/quotes", tags=["Quotes"])
