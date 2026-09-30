from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app, cache
from common.cache import MemoryBackend

AUTH = {"Authorization": "Bearer ghp_test_token"}


@pytest.fixture
def client():
    """
    @brief Provides a FastAPI test client for the GitHub service using a fresh in-memory cache backend.
    @return Yields the started TestClient bound to the service app.
    """
    cache.backend = MemoryBackend()
    with TestClient(app) as test_client:
        yield test_client


def test_missing_token_returns_401(client):
    """
    @brief Tests that requesting user stats without an Authorization header returns 401.
    @param client The test client fixture for the GitHub service.
    """
    res = client.get("/user/stats")
    assert res.status_code == 401


def test_user_stats_are_cached_per_token(client):
    """
    @brief Tests that user stats are cached per token, giving a MISS then a HIT and a separate MISS for another token.
    @param client The test client fixture for the GitHub service.
    """
    with patch("app.github.fetch_github_user_stats", new=AsyncMock(return_value={"total_stars": 10})) as mock_fetch:
        first = client.get("/user/stats", headers=AUTH)
        second = client.get("/user/stats", headers=AUTH)
        other_user = client.get("/user/stats", headers={"Authorization": "Bearer ghp_other_token"})

    assert first.headers["X-Cache"] == "MISS"
    assert second.headers["X-Cache"] == "HIT"
    assert other_user.headers["X-Cache"] == "MISS"
    assert mock_fetch.await_count == 2


def test_cache_key_does_not_contain_token(client):
    """
    @brief Tests that the raw GitHub token never appears in the keys stored in the cache backend.
    @param client The test client fixture for the GitHub service.
    """
    backend = MemoryBackend()
    cache.backend = backend
    with patch("app.github.fetch_github_user_stats", new=AsyncMock(return_value={})):
        client.get("/user/stats", headers=AUTH)
    assert backend._store
    assert all("ghp_test_token" not in key for key in backend._store)


def test_invalid_token_returns_401(client):
    """
    @brief Tests that an invalid GitHub token error raised while fetching the profile is mapped to a 401 response.
    @param client The test client fixture for the GitHub service.
    """
    error = ValueError("Token GitHub invalide ou expiré.")
    with patch("app.github.fetch_github_user_profile", new=AsyncMock(side_effect=error)):
        res = client.get("/user/profile", headers=AUTH)
    assert res.status_code == 401
    assert res.json()["detail"] == "Token GitHub invalide ou expiré."


def test_unknown_org_returns_404(client):
    """
    @brief Tests that an unknown GitHub organization error is mapped to a 404 response.
    @param client The test client fixture for the GitHub service.
    """
    error = ValueError("Organisation 'nope' introuvable sur GitHub.")
    with patch("app.github.fetch_github_org_stats", new=AsyncMock(side_effect=error)):
        res = client.get("/orgs/nope/stats", headers=AUTH)
    assert res.status_code == 404


def test_repo_upstream_error_returns_502(client):
    """
    @brief Tests that an unexpected upstream failure while fetching repo stats is mapped to a 502 response containing the error message.
    @param client The test client fixture for the GitHub service.
    """
    with patch("app.github.fetch_github_repo_stats", new=AsyncMock(side_effect=RuntimeError("rate limit"))):
        res = client.get("/repos/owner/repo/stats", headers=AUTH)
    assert res.status_code == 502
    assert "rate limit" in res.json()["detail"]
