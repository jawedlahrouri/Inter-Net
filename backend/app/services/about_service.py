import time
from typing import Any, Dict, List
from fastapi import Request


class AboutService:
    @staticmethod
    def get_client_host(request: Request) -> str:
        """
        @brief Determines the client IP, preferring the first address in the X-Forwarded-For header over the socket address.
        @param request Incoming FastAPI request providing the client address and headers.
        @return The client host string, defaulting to 127.0.0.1 when unknown.
        """
        client_host = request.client.host if request.client else "127.0.0.1"
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            client_host = forwarded_for.split(",")[0].strip()
        return client_host

    @staticmethod
    def get_services_catalog() -> List[Dict[str, Any]]:
        """
        @brief Builds the static catalog of services and their widgets with parameter schemas exposed by about.json.
        @return A list of service dicts, each with a name and its list of widgets.
        """
        return [
            {
                "name": "weather",
                "widgets": [
                    {
                        "name": "city_temperature",
                        "description": "Display temperature for a city",
                        "params": [
                            {"name": "city", "type": "string"}
                        ],
                    }
                ],
            },
            {
                "name": "rss",
                "widgets": [
                    {
                        "name": "article_list",
                        "description": "Displaying the list of the last articles",
                        "params": [
                            {"name": "link", "type": "string"},
                            {"name": "number", "type": "integer"},
                        ],
                    }
                ],
            },
            {
                "name": "custom",
                "widgets": [
                    {
                        "name": "custom_api",
                        "description": "Display a metric from an external JSON API",
                        "params": [
                            {"name": "apiUrl", "type": "string"},
                            {"name": "jsonPath", "type": "string"},
                        ],
                    }
                ],
            },
            {
                "name": "shortcuts",
                "widgets": [
                    {
                        "name": "shortcut",
                        "description": "Quick external website shortcut",
                        "params": [
                            {"name": "url", "type": "string"}
                        ],
                    }
                ],
            },
            {
                "name": "steam",
                "widgets": [
                    {
                        "name": "last_played",
                        "description": "Dernier jeu joué par l'utilisateur",
                        "params": [{"name": "steam_id", "type": "string"}],
                    },
                    {
                        "name": "most_played",
                        "description": "Jeu avec le plus d'heures au compteur",
                        "params": [{"name": "steam_id", "type": "string"}],
                    },
                    {
                        "name": "games_count",
                        "description": "Nombre total de jeux dans la bibliothèque",
                        "params": [{"name": "steam_id", "type": "string"}],
                    },
                    {
                        "name": "total_playtime",
                        "description": "Nombre d'heures de jeu cumulées",
                        "params": [{"name": "steam_id", "type": "string"}],
                    },
                    {
                        "name": "recent_playtime",
                        "description": "Temps de jeu sur les 14 derniers jours",
                        "params": [{"name": "steam_id", "type": "string"}],
                    },
                    {
                        "name": "steam_level",
                        "description": "Niveau et profil Steam du joueur",
                        "params": [{"name": "steam_id", "type": "string"}],
                    },
                ],
            },
            {
                "name": "github",
                "widgets": [
                    {
                        "name": "total_commits",
                        "description": "Nombre total de commits cumulés",
                        "params": [{"name": "username", "type": "string"}],
                    },
                    {
                        "name": "lines_stats",
                        "description": "Lignes de code ajoutées, supprimées et ratio",
                        "params": [{"name": "username", "type": "string"}],
                    },
                    {
                        "name": "avg_commit_size",
                        "description": "Taille moyenne d'un commit en lignes",
                        "params": [{"name": "username", "type": "string"}],
                    },
                    {
                        "name": "commits_timeframes",
                        "description": "Commits sur 7, 30 et 90 jours",
                        "params": [{"name": "days", "type": "integer"}],
                    },
                    {
                        "name": "lines_timeframes",
                        "description": "Lignes modifiées sur 7, 30 et 90 jours",
                        "params": [{"name": "days", "type": "integer"}],
                    },
                    {
                        "name": "active_days",
                        "description": "Jours actifs avec commits sur 30 et 365 jours",
                        "params": [{"name": "days", "type": "integer"}],
                    },
                    {
                        "name": "active_repos_count",
                        "description": "Nombre de dépôts avec au moins un commit",
                        "params": [{"name": "username", "type": "string"}],
                    },
                    {
                        "name": "weekly_top_devs",
                        "description": "Commits cette semaine - Top Développeurs",
                        "params": [{"name": "limit", "type": "integer"}],
                    },
                    {
                        "name": "pr_overview",
                        "description": "Pull requests ouvertes, mergées et fermées",
                        "params": [{"name": "username", "type": "string"}],
                    },
                    {
                        "name": "pr_merge_rate",
                        "description": "Taux de PR mergées et temps moyen",
                        "params": [{"name": "username", "type": "string"}],
                    },
                    {
                        "name": "pr_created_total",
                        "description": "Nombre total de PR créées",
                        "params": [{"name": "username", "type": "string"}],
                    },
                    {
                        "name": "code_reviews_done",
                        "description": "Relectures de code et validations effectuées",
                        "params": [{"name": "username", "type": "string"}],
                    },
                    {
                        "name": "projects_collaboration",
                        "description": "Projets rejoints, propriétaire ou contributeur",
                        "params": [{"name": "username", "type": "string"}],
                    },
                    {
                        "name": "avg_team_size",
                        "description": "Taille moyenne d'équipe sur les projets",
                        "params": [{"name": "username", "type": "string"}],
                    },
                    {
                        "name": "project_seniority",
                        "description": "Ancienneté moyenne et plus vieux projet",
                        "params": [{"name": "username", "type": "string"}],
                    },
                    {
                        "name": "top_repos_by_commits",
                        "description": "Classement des dépôts par nombre de commits",
                        "params": [{"name": "limit", "type": "integer"}],
                    },
                    {
                        "name": "top_starred_repos",
                        "description": "Podium des dépôts les plus étoilés",
                        "params": [{"name": "limit", "type": "integer"}],
                    },
                    {
                        "name": "recent_repos_list",
                        "description": "Derniers dépôts mis à jour",
                        "params": [{"name": "limit", "type": "integer"}],
                    },
                    {
                        "name": "primary_language",
                        "description": "Technologie et langage de prédilection",
                        "params": [{"name": "username", "type": "string"}],
                    },
                    {
                        "name": "languages_breakdown",
                        "description": "Répartition des 5 langages les plus utilisés",
                        "params": [{"name": "limit", "type": "integer"}],
                    },
                    {
                        "name": "profile_card",
                        "description": "Profil, bio, entreprise et followers",
                        "params": [{"name": "username", "type": "string"}],
                    },
                    {
                        "name": "repo_overview",
                        "description": "Fiche détaillée d'un dépôt (stars, forks, statut)",
                        "params": [{"name": "repoFullName", "type": "string"}],
                    },
                    {
                        "name": "repo_recent_commits",
                        "description": "Flux des derniers commits sur un dépôt",
                        "params": [{"name": "repoFullName", "type": "string"}],
                    },
                    {
                        "name": "repo_contributors",
                        "description": "Top contributeurs d'un dépôt sélectionné",
                        "params": [{"name": "repoFullName", "type": "string"}],
                    },
                    {
                        "name": "repo_languages",
                        "description": "Répartition des langages d'un dépôt précis",
                        "params": [{"name": "repoFullName", "type": "string"}],
                    },
                    {
                        "name": "org_overview",
                        "description": "Activité et métriques d'une organisation",
                        "params": [{"name": "orgName", "type": "string"}],
                    },
                    {
                        "name": "orgs_list",
                        "description": "Liste des organisations et équipes de l'utilisateur",
                        "params": [{"name": "username", "type": "string"}],
                    },
                    {
                        "name": "repos_by_org",
                        "description": "Répartition des dépôts par organisation",
                        "params": [{"name": "orgName", "type": "string"}],
                    },
                ],
            },
        ]

    @classmethod
    def get_about_payload(cls, request: Request) -> Dict[str, Any]:
        """
        @brief Assembles the about.json payload with the client host, current server time and services catalog.
        @param request Incoming FastAPI request used to determine the client host.
        @return A dict with a client section containing the host and a server section with the current timestamp and services.
        """
        return {
            "client": {
                "host": cls.get_client_host(request)
            },
            "server": {
                "current_time": int(time.time()),
                "services": cls.get_services_catalog(),
            },
        }

