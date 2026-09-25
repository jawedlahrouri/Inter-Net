from fastapi import APIRouter
from app.api.v1.endpoints import health, quotes, proxy, widgets, customization, admin
from app.api.endpoints import auth, steam_api, github_api

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin"])
api_router.include_router(steam_api.router, tags=["Steam"])
api_router.include_router(github_api.router, tags=["GitHub"])
api_router.include_router(health.router, prefix="/health", tags=["Health"])
api_router.include_router(proxy.router, prefix="/proxy", tags=["Proxy"])
api_router.include_router(quotes.router, prefix="/quotes", tags=["Quotes"])
api_router.include_router(widgets.router, prefix="/widgets", tags=["Widgets"])
api_router.include_router(customization.router, prefix="/customization", tags=["Customization"])

