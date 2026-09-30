import os
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from app.api.v1.router import api_router
from app.core.config import settings
from app.services.about_service import AboutService
from app.services.integration_clients import IntegrationServiceError


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    @brief Runs application startup by creating database tables and attempting to add the users settings column, then yields until shutdown.
    @param app The FastAPI application instance whose lifespan is managed.
    @return An async context manager body that yields control once startup is finished.
    """
    try:
        from app.db.session import engine, Base
        import app.models
        Base.metadata.create_all(bind=engine)
        try:
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN settings JSON DEFAULT NULL"))
                conn.commit()
        except Exception:
            pass
        try:
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE"))
                conn.commit()
        except Exception:
            pass
        try:
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN verification_token VARCHAR(255) DEFAULT NULL"))
                conn.commit()
        except Exception:
            pass
    except Exception as e:
        print(f"DB Startup warning: {e}")
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)

if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

@app.exception_handler(IntegrationServiceError)
async def integration_service_error_handler(request: Request, exc: IntegrationServiceError):
    """
    @brief Handles IntegrationServiceError exceptions by converting them into JSON error responses.
    @param request The incoming HTTP request that triggered the error.
    @param exc The IntegrationServiceError carrying the status code and detail.
    @return A JSONResponse with the exception status code and a detail message.
    """
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


app.include_router(api_router, prefix=settings.API_V1_STR)

storage_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "storage")
os.makedirs(os.path.join(storage_path, "custom_vids"), exist_ok=True)
os.makedirs(os.path.join(storage_path, "custom_bg"), exist_ok=True)
os.makedirs(os.path.join(storage_path, "custom_music"), exist_ok=True)
os.makedirs(os.path.join(storage_path, "widgets"), exist_ok=True)

app.mount(f"{settings.API_V1_STR}/storage", StaticFiles(directory=storage_path), name="api_storage")
app.mount("/storage", StaticFiles(directory=storage_path), name="storage")



@app.get("/")
def root():
    """
    @brief Serves the API root endpoint with a welcome message and documentation links.
    @return A dictionary with the welcome message, docs path and health path.
    """
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}",
        "docs": f"{settings.API_V1_STR}/docs",
        "health": f"{settings.API_V1_STR}/health",
    }


@app.get("/about.json")
def get_about(request: Request):
    """
    @brief Serves the about.json endpoint describing the service.
    @param request The incoming HTTP request used to build the about payload.
    @return The about payload produced by AboutService.
    """
    return AboutService.get_about_payload(request)

