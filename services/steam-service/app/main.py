import os
from typing import Any, Dict

from fastapi import HTTPException, Path, Response, status

from app import steam
from common.app import create_cache, create_service_app

STEAM_ID_PATTERN = r"^\d{1,20}$"

app = create_service_app("INTER-NET Steam Service")
cache = create_cache("steam")


def _get_api_key() -> str:
    """
    @brief Reads the Steam API key from the environment and raises a 503 error if it is not configured.
    @return The STEAM_API_KEY value as a string.
    """
    api_key = os.getenv("STEAM_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="La clé API Steam n'est pas configurée sur le service Steam.",
        )
    return api_key


@app.get("/players/{steam_id}/profile")
async def player_profile(steam_id: str = Path(pattern=STEAM_ID_PATTERN)) -> Dict[str, Any]:
    """
    @brief Handles the GET profile route by fetching a Steam player's public profile, mapping errors to 404 or 502.
    @param steam_id Numeric Steam id taken from the URL path and validated by a regex.
    @return A dict with steam_id, username, avatar and profile_url.
    """
    api_key = _get_api_key()
    try:
        return await steam.fetch_player_profile(steam_id, api_key)
    except LookupError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))


@app.get("/players/{steam_id}/stats")
async def player_stats(
    response: Response,
    steam_id: str = Path(pattern=STEAM_ID_PATTERN),
    force_refresh: bool = False,
) -> Dict[str, Any]:
    """
    @brief Handles the GET stats route by returning cached or freshly fetched Steam statistics and setting an X-Cache header.
    @param response FastAPI response object used to set the X-Cache header.
    @param steam_id Numeric Steam id taken from the URL path and validated by a regex.
    @param force_refresh When true, bypasses the cache and refetches from Steam.
    @return The Steam statistics dict for the player.
    """
    api_key = _get_api_key()
    try:
        stats, hit = await cache.get_or_fetch(
            f"stats:{steam_id}",
            lambda: steam.fetch_steam_user_stats(steam_id, api_key),
            force_refresh=force_refresh,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Erreur lors de la récupération des données Steam: {e}",
        )
    response.headers["X-Cache"] = "HIT" if hit else "MISS"
    return stats
