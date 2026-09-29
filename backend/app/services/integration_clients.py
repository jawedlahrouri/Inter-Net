import urllib.parse
from typing import Any, Dict, List, Optional

import httpx

from app.core.config import settings

SERVICE_TIMEOUT = httpx.Timeout(30.0, connect=3.0)


class IntegrationServiceError(Exception):
    def __init__(self, status_code: int, detail: str) -> None:
        """
        @brief Initializes an integration service error carrying an HTTP status code and a detail message.
        @param status_code HTTP status code to expose to the API caller.
        @param detail Human-readable error message.
        """
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail


async def _get(
    base_url: str,
    path: str,
    service_label: str,
    params: Optional[Dict[str, Any]] = None,
    headers: Optional[Dict[str, str]] = None,
) -> Any:
    """
    @brief Performs an async HTTP GET against an integration microservice and converts network or HTTP errors into IntegrationServiceError.
    @param base_url Base URL of the target microservice.
    @param path Request path appended to the base URL.
    @param service_label Human-readable service name used in error messages.
    @param params Optional query string parameters to send.
    @param headers Optional HTTP headers to send with the request.
    @return The decoded JSON body of the successful response.
    """
    try:
        async with httpx.AsyncClient(timeout=SERVICE_TIMEOUT) as client:
            res = await client.get(f"{base_url}{path}", params=params, headers=headers)
    except httpx.HTTPError as e:
        raise IntegrationServiceError(503, f"Le service {service_label} est injoignable : {e}")

    if res.status_code >= 400:
        try:
            detail = res.json().get("detail")
        except (ValueError, AttributeError):
            detail = None
        raise IntegrationServiceError(
            res.status_code,
            detail or f"Le service {service_label} a répondu {res.status_code}.",
        )
    return res.json()


def _segment(value: str) -> str:
    """
    @brief Percent-encodes a value so it can be safely used as a single URL path segment.
    @param value Raw string to encode, including any slashes.
    @return The URL-quoted string with no characters left unescaped.
    """
    return urllib.parse.quote(value, safe="")


async def _steam_get(path: str, params: Optional[Dict[str, Any]] = None) -> Any:
    """
    @brief Sends a GET request to the Steam microservice.
    @param path Path of the Steam service endpoint to call.
    @param params Optional query string parameters.
    @return The decoded JSON response from the Steam service.
    """
    return await _get(settings.STEAM_SERVICE_URL, path, "Steam", params=params)


async def fetch_steam_player_profile(steam_id: str) -> Dict[str, Any]:
    """
    @brief Fetches a Steam player's public profile from the Steam microservice.
    @param steam_id Steam ID of the player.
    @return A dictionary containing the player's profile data.
    """
    return await _steam_get(f"/players/{_segment(steam_id)}/profile")


async def fetch_steam_user_stats(steam_id: str, force_refresh: bool = False) -> Dict[str, Any]:
    """
    @brief Fetches a Steam player's aggregated stats from the Steam microservice, optionally bypassing its cache.
    @param steam_id Steam ID of the player.
    @param force_refresh Whether to force the service to ignore its cached data.
    @return A dictionary containing the player's Steam statistics.
    """
    return await _steam_get(
        f"/players/{_segment(steam_id)}/stats",
        params={"force_refresh": str(force_refresh).lower()},
    )


async def _github_get(path: str, token: str, params: Optional[Dict[str, Any]] = None) -> Any:
    """
    @brief Sends an authenticated GET request to the GitHub microservice using a Bearer token.
    @param path Path of the GitHub service endpoint to call.
    @param token GitHub access token forwarded in the Authorization header.
    @param params Optional query string parameters.
    @return The decoded JSON response from the GitHub service.
    """
    return await _get(
        settings.GITHUB_SERVICE_URL,
        path,
        "GitHub",
        params=params,
        headers={"Authorization": f"Bearer {token}"},
    )


async def fetch_github_user_profile(token: str) -> Dict[str, Any]:
    """
    @brief Fetches the GitHub profile of the user owning the token from the GitHub microservice.
    @param token GitHub access token of the user.
    @return A dictionary containing the user's GitHub profile.
    """
    return await _github_get("/user/profile", token)


async def fetch_github_user_stats(token: str, force_refresh: bool = False) -> Dict[str, Any]:
    """
    @brief Fetches aggregated GitHub activity stats for the token owner, optionally bypassing the service cache.
    @param token GitHub access token of the user.
    @param force_refresh Whether to force the service to ignore its cached data.
    @return A dictionary containing the user's GitHub statistics.
    """
    return await _github_get("/user/stats", token, params={"force_refresh": str(force_refresh).lower()})


async def fetch_github_user_orgs(token: str) -> List[Dict[str, Any]]:
    """
    @brief Fetches the GitHub organisations the token owner belongs to.
    @param token GitHub access token of the user.
    @return A list of dictionaries describing each organisation.
    """
    return await _github_get("/user/orgs", token)


async def fetch_github_org_stats(token: str, org: str, force_refresh: bool = False) -> Dict[str, Any]:
    """
    @brief Fetches aggregated statistics for a GitHub organisation from the GitHub microservice.
    @param token GitHub access token of the user.
    @param org Login of the organisation.
    @param force_refresh Whether to force the service to ignore its cached data.
    @return A dictionary containing the organisation's statistics.
    """
    return await _github_get(
        f"/orgs/{_segment(org)}/stats",
        token,
        params={"force_refresh": str(force_refresh).lower()},
    )


async def fetch_github_repo_stats(
    token: str,
    owner: str,
    repo: str,
    force_refresh: bool = False,
) -> Dict[str, Any]:
    """
    @brief Fetches aggregated statistics for a single GitHub repository from the GitHub microservice.
    @param token GitHub access token of the user.
    @param owner Login of the repository owner.
    @param repo Name of the repository.
    @param force_refresh Whether to force the service to ignore its cached data.
    @return A dictionary containing the repository's statistics.
    """
    return await _github_get(
        f"/repos/{_segment(owner)}/{_segment(repo)}/stats",
        token,
        params={"force_refresh": str(force_refresh).lower()},
    )
