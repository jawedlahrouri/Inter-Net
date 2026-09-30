from typing import Any, Dict, List

from fastapi import Depends, Header, HTTPException, Response, status

from app import github
from common.app import create_cache, create_service_app
from common.cache import hash_secret

app = create_service_app("INTER-NET GitHub Service")
cache = create_cache("github")


def get_github_token(authorization: str = Header(default="")) -> str:
    """
    @brief Extracts the GitHub token from a Bearer Authorization header, raising 401 if it is missing or malformed.
    @param authorization Raw value of the Authorization header.
    @return The stripped GitHub token string.
    """
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token GitHub manquant.",
        )
    return token.strip()


def _set_cache_header(response: Response, hit: bool) -> None:
    """
    @brief Sets the X-Cache response header to HIT or MISS.
    @param response FastAPI response whose headers are modified.
    @param hit Whether the data was served from the cache.
    """
    response.headers["X-Cache"] = "HIT" if hit else "MISS"


@app.get("/user/profile")
async def user_profile(token: str = Depends(get_github_token)) -> Dict[str, Any]:
    """
    @brief Handles the endpoint returning the GitHub profile for the supplied token, mapping errors to 401 or 502.
    @param token GitHub token resolved from the Authorization header.
    @return A dictionary with the GitHub user profile.
    """
    try:
        return await github.fetch_github_user_profile(token)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Erreur lors de la vérification du token GitHub : {e}",
        )


@app.get("/user/stats")
async def user_stats(
    response: Response,
    force_refresh: bool = False,
    token: str = Depends(get_github_token),
) -> Dict[str, Any]:
    """
    @brief Handles the endpoint returning cached GitHub user statistics, with optional forced refresh.
    @param response FastAPI response used to set the cache header.
    @param force_refresh Whether to bypass the cache and refetch.
    @param token GitHub token resolved from the Authorization header.
    @return A dictionary with the user's GitHub statistics.
    """
    try:
        stats, hit = await cache.get_or_fetch(
            f"user:{hash_secret(token)}",
            lambda: github.fetch_github_user_stats(token),
            force_refresh=force_refresh,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Erreur données GitHub : {e}")
    _set_cache_header(response, hit)
    return stats


@app.get("/user/orgs")
async def user_orgs(response: Response, token: str = Depends(get_github_token)) -> List[Dict[str, Any]]:
    """
    @brief Handles the endpoint returning the cached list of the token owner's GitHub organisations.
    @param response FastAPI response used to set the cache header.
    @param token GitHub token resolved from the Authorization header.
    @return A list of dictionaries describing the user's organisations.
    """
    try:
        orgs, hit = await cache.get_or_fetch(
            f"orgs:{hash_secret(token)}",
            lambda: github.fetch_github_user_orgs(token),
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Erreur API GitHub : {e}")
    _set_cache_header(response, hit)
    return orgs


@app.get("/orgs/{org}/stats")
async def org_stats(
    org: str,
    response: Response,
    force_refresh: bool = False,
    token: str = Depends(get_github_token),
) -> Dict[str, Any]:
    """
    @brief Handles the endpoint returning cached statistics for a GitHub organisation, returning 404 if it is unknown.
    @param org Login of the organisation.
    @param response FastAPI response used to set the cache header.
    @param force_refresh Whether to bypass the cache and refetch.
    @param token GitHub token resolved from the Authorization header.
    @return A dictionary with the organisation's statistics.
    """
    try:
        stats, hit = await cache.get_or_fetch(
            f"org:{org.lower()}:{hash_secret(token)}",
            lambda: github.fetch_github_org_stats(token, org),
            force_refresh=force_refresh,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Erreur organisation GitHub : {e}")
    _set_cache_header(response, hit)
    return stats


@app.get("/repos/{owner}/{repo}/stats")
async def repo_stats(
    owner: str,
    repo: str,
    response: Response,
    force_refresh: bool = False,
    token: str = Depends(get_github_token),
) -> Dict[str, Any]:
    """
    @brief Handles the endpoint returning cached statistics for a GitHub repository, returning 404 if it is unknown.
    @param owner Login of the repository owner.
    @param repo Name of the repository.
    @param response FastAPI response used to set the cache header.
    @param force_refresh Whether to bypass the cache and refetch.
    @param token GitHub token resolved from the Authorization header.
    @return A dictionary with the repository's statistics.
    """
    try:
        stats, hit = await cache.get_or_fetch(
            f"repo:{owner.lower()}:{repo.lower()}:{hash_secret(token)}",
            lambda: github.fetch_github_repo_stats(token, owner, repo),
            force_refresh=force_refresh,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Erreur dépôt GitHub : {e}")
    _set_cache_header(response, hit)
    return stats
