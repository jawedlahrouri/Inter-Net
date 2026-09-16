import os
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from app.api.v1.router import api_router
from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
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

# Mount static files for uploaded and preset storage
storage_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "storage")
os.makedirs(os.path.join(storage_path, "custom_vids"), exist_ok=True)
os.makedirs(os.path.join(storage_path, "widgets"), exist_ok=True)

app.mount(f"{settings.API_V1_STR}/storage", StaticFiles(directory=storage_path), name="api_storage")
app.mount("/storage", StaticFiles(directory=storage_path), name="storage")



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
                    "name": "custom",
                    "widgets": [
                        {
                            "name": "custom_api",
                            "description": "Display a metric from an external JSON API",
                            "params": [
                                {
                                    "name": "apiUrl",
                                    "type": "string"
                                },
                                {
                                    "name": "jsonPath",
                                    "type": "string"
                                }
                            ]
                        }
                    ]
                },
                {
                    "name": "shortcuts",
                    "widgets": [
                        {
                            "name": "shortcut",
                            "description": "Quick external website shortcut",
                            "params": [
                                {
                                    "name": "url",
                                    "type": "string"
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
                },
                {
                    "name": "github",
                    "widgets": [
                        {
                            "name": "total_commits",
                            "description": "Nombre total de commits cumulés",
                            "params": []
                        },
                        {
                            "name": "lines_stats",
                            "description": "Lignes de code ajoutées, supprimées et ratio",
                            "params": []
                        },
                        {
                            "name": "avg_commit_size",
                            "description": "Taille moyenne d'un commit en lignes",
                            "params": []
                        },
                        {
                            "name": "commits_timeframes",
                            "description": "Commits sur 7, 30 et 90 jours",
                            "params": []
                        },
                        {
                            "name": "lines_timeframes",
                            "description": "Lignes modifiées sur 7, 30 et 90 jours",
                            "params": []
                        },
                        {
                            "name": "active_days",
                            "description": "Jours actifs avec commits sur 30 et 365 jours",
                            "params": []
                        },
                        {
                            "name": "active_repos_count",
                            "description": "Nombre de dépôts avec au moins un commit",
                            "params": []
                        },
                        {
                            "name": "weekly_top_devs",
                            "description": "Commits cette semaine - Top Développeurs",
                            "params": []
                        },
                        {
                            "name": "pr_overview",
                            "description": "Pull requests ouvertes, mergées et fermées",
                            "params": []
                        },
                        {
                            "name": "pr_merge_rate",
                            "description": "Taux de PR mergées et temps moyen",
                            "params": []
                        },
                        {
                            "name": "pr_created_total",
                            "description": "Nombre total de PR créées",
                            "params": []
                        },
                        {
                            "name": "code_reviews_done",
                            "description": "Relectures de code et validations effectuées",
                            "params": []
                        },
                        {
                            "name": "projects_collaboration",
                            "description": "Projets rejoints, propriétaire ou contributeur",
                            "params": []
                        },
                        {
                            "name": "avg_team_size",
                            "description": "Taille moyenne d'équipe sur les projets",
                            "params": []
                        },
                        {
                            "name": "project_seniority",
                            "description": "Ancienneté moyenne et plus vieux projet",
                            "params": []
                        },
                        {
                            "name": "top_repos_by_commits",
                            "description": "Classement des dépôts par nombre de commits",
                            "params": []
                        },
                        {
                            "name": "top_starred_repos",
                            "description": "Podium des dépôts les plus étoilés",
                            "params": []
                        },
                        {
                            "name": "recent_repos_list",
                            "description": "Derniers dépôts mis à jour",
                            "params": []
                        },
                        {
                            "name": "primary_language",
                            "description": "Technologie et langage de prédilection",
                            "params": []
                        },
                        {
                            "name": "languages_breakdown",
                            "description": "Répartition des 5 langages les plus utilisés",
                            "params": []
                        },
                        {
                            "name": "profile_card",
                            "description": "Profil, bio, entreprise et followers",
                            "params": []
                        },
                        {
                            "name": "repo_overview",
                            "description": "Fiche détaillée d'un dépôt (stars, forks, statut)",
                            "params": [{"name": "repoFullName", "type": "string"}]
                        },
                        {
                            "name": "repo_recent_commits",
                            "description": "Flux des derniers commits sur un dépôt",
                            "params": [{"name": "repoFullName", "type": "string"}]
                        },
                        {
                            "name": "repo_contributors",
                            "description": "Top contributeurs d'un dépôt sélectionné",
                            "params": [{"name": "repoFullName", "type": "string"}]
                        },
                        {
                            "name": "repo_languages",
                            "description": "Répartition des langages d'un dépôt précis",
                            "params": [{"name": "repoFullName", "type": "string"}]
                        },
                        {
                            "name": "org_overview",
                            "description": "Activité et métriques d'une organisation",
                            "params": [{"name": "orgName", "type": "string"}]
                        },
                        {
                            "name": "orgs_list",
                            "description": "Liste des organisations et équipes de l'utilisateur",
                            "params": []
                        },
                        {
                            "name": "repos_by_org",
                            "description": "Répartition des dépôts par organisation",
                            "params": []
                        }
                    ]
                }
            ]
        }
    }
