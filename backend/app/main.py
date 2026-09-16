import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import api_router
from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        from app.db.session import engine, Base
        import app.models
        Base.metadata.create_all(bind=engine)
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

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}",
        "docs": f"{settings.API_V1_STR}/docs",
        "health": f"{settings.API_V1_STR}/health",
    }


@app.get("/about.json")
def get_about(request: Request):
    client_host = request.client.host if request.client else "127.0.0.1"
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        client_host = forwarded_for.split(",")[0].strip()

    return {
        "client": {
            "host": client_host
        },
        "server": {
            "current_time": int(time.time()),
            "services": [
                {
                    "name": "weather",
                    "widgets": [
                        {
                            "name": "city_temperature",
                            "description": "Display temperature for a city",
                            "params": [
                                {
                                    "name": "city",
                                    "type": "string"
                                }
                            ]
                        }
                    ]
                },
                {
                    "name": "rss",
                    "widgets": [
                        {
                            "name": "article_list",
                            "description": "Displaying the list of the last articles",
                            "params": [
                                {
                                    "name": "link",
                                    "type": "string"
                                },
                                {
                                    "name": "number",
                                    "type": "integer"
                                }
                            ]
                        }
                    ]
                },
                {
                    "name": "steam",
                    "widgets": [
                        {
                            "name": "last_played",
                            "description": "Dernier jeu joué par l'utilisateur",
                            "params": []
                        },
                        {
                            "name": "most_played",
                            "description": "Jeu avec le plus d'heures au compteur",
                            "params": []
                        },
                        {
                            "name": "games_count",
                            "description": "Nombre total de jeux dans la bibliothèque",
                            "params": []
                        },
                        {
                            "name": "total_playtime",
                            "description": "Nombre d'heures de jeu cumulées",
                            "params": []
                        },
                        {
                            "name": "recent_playtime",
                            "description": "Temps de jeu sur les 14 derniers jours",
                            "params": []
                        },
                        {
                            "name": "steam_level",
                            "description": "Niveau et profil Steam du joueur",
                            "params": []
                        }
                    ]
                }
            ]
        }
    }
