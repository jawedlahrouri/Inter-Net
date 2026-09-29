from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app, cache
from common.cache import MemoryBackend

STEAM_ID = "76561198000000000"


@pytest.fixture
def client(monkeypatch):
    """
    @brief Pytest fixture that sets a fake Steam API key, resets the cache to an in-memory backend and starts a test client.
    @param monkeypatch Pytest fixture used to set the STEAM_API_KEY environment variable.
    @return The FastAPI TestClient for the Steam service app, yielded for the duration of the test.
    """
    monkeypatch.setenv("STEAM_API_KEY", "testkey")
    cache.backend = MemoryBackend()
    with TestClient(app) as test_client:
        yield test_client


def test_health_exposes_instance(client):
    """
    @brief Tests that the health endpoint returns ok and that the X-Served-By header matches the reported instance.
    @param client FastAPI test client fixture used to send requests.
    """
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"
    assert res.headers["X-Served-By"] == res.json()["instance"]


def test_stats_are_cached(client):
    """
    @brief Tests that repeated stats requests are served from cache, with the X-Cache header showing HIT or MISS and force_refresh bypassing it.
    @param client FastAPI test client fixture used to send requests.
    """
    fake_stats = {"steam_id": STEAM_ID, "steam_level": 42}
    with patch("app.steam.fetch_steam_user_stats", new=AsyncMock(return_value=fake_stats)) as mock_fetch:
        first = client.get(f"/players/{STEAM_ID}/stats")
        second = client.get(f"/players/{STEAM_ID}/stats")
        refreshed = client.get(f"/players/{STEAM_ID}/stats", params={"force_refresh": "true"})

    assert first.json() == second.json() == fake_stats
    assert first.headers["X-Cache"] == "MISS"
    assert second.headers["X-Cache"] == "HIT"
    assert refreshed.headers["X-Cache"] == "MISS"
    assert mock_fetch.await_count == 2


def test_stats_upstream_error_returns_502(client):
    """
    @brief Tests that an upstream failure while fetching stats results in a 502 response containing the error message.
    @param client FastAPI test client fixture used to send requests.
    """
    with patch("app.steam.fetch_steam_user_stats", new=AsyncMock(side_effect=RuntimeError("boom"))):
        res = client.get(f"/players/{STEAM_ID}/stats")
    assert res.status_code == 502
    assert "boom" in res.json()["detail"]


def test_missing_api_key_returns_503(client, monkeypatch):
    """
    @brief Tests that requesting stats without a configured Steam API key returns a 503 response.
    @param client FastAPI test client fixture used to send requests.
    @param monkeypatch Pytest fixture used to remove the STEAM_API_KEY environment variable.
    """
    monkeypatch.delenv("STEAM_API_KEY")
    res = client.get(f"/players/{STEAM_ID}/stats")
    assert res.status_code == 503


def test_invalid_steam_id_is_rejected(client):
    """
    @brief Tests that a malformed Steam ID in the path is rejected with a 422 validation error.
    @param client FastAPI test client fixture used to send requests.
    """
    res = client.get("/players/not-a-steam-id/stats")
    assert res.status_code == 422


def test_profile_not_found_returns_404(client):
    """
    @brief Tests that a missing player profile is reported as a 404 with the lookup error message.
    @param client FastAPI test client fixture used to send requests.
    """
    with patch("app.steam.fetch_player_profile", new=AsyncMock(side_effect=LookupError("Profil joueur introuvable."))):
        res = client.get(f"/players/{STEAM_ID}/profile")
    assert res.status_code == 404
    assert res.json()["detail"] == "Profil joueur introuvable."
