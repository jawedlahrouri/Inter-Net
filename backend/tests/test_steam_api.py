from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.core.security import create_access_token
from app.models.user import User
from app.services.integration_clients import IntegrationServiceError
from app.services.integration_service import link_user_service

STEAM_ID = "76561198000000000"


@pytest.fixture
def steam_linked(db_session):
    """
    @brief Creates a test user with a linked Steam service and builds a bearer authorization header for it.
    @param db_session The test database session fixture used to persist the user and Steam link.
    @return A headers dictionary containing the Authorization bearer token of the Steam-linked user.
    """
    user = User(email="gamer@epitech.eu", username="gamer", password_hash="fakehash", role="user")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    link_user_service(
        db=db_session,
        user_id=user.id,
        service_name="steam",
        access_token=STEAM_ID,
        credentials={"steam_id": STEAM_ID},
        service_display_name="Steam",
        service_description="Service Steam Gaming",
        service_auth_type="oauth2",
    )
    return {"Authorization": f"Bearer {create_access_token(subject=user.id)}"}


def test_steam_stats_requires_linked_account(client, db_session):
    """
    @brief Tests that requesting Steam stats without a linked Steam account returns a 400 error.
    @param client The FastAPI test client fixture.
    @param db_session The test database session fixture used to create an unlinked user.
    """
    user = User(email="nosteam@epitech.eu", username="nosteam", password_hash="fakehash", role="user")
    db_session.add(user)
    db_session.commit()
    headers = {"Authorization": f"Bearer {create_access_token(subject=user.id)}"}

    res = client.get("/api/v1/steam/user/stats", headers=headers)
    assert res.status_code == 400


def test_steam_stats_delegated_to_service(client, steam_linked):
    """
    @brief Tests that the Steam stats endpoint delegates to fetch_steam_user_stats with the linked Steam id and returns its result.
    @param client The FastAPI test client fixture.
    @param steam_linked Fixture providing authorization headers of a user with a linked Steam account.
    """
    with patch(
        "app.api.endpoints.steam_api.fetch_steam_user_stats",
        new=AsyncMock(return_value={"steam_id": STEAM_ID, "steam_level": 42}),
    ) as mock_stats:
        res = client.get("/api/v1/steam/user/stats", headers=steam_linked)
    assert res.status_code == 200
    assert res.json()["steam_level"] == 42
    mock_stats.assert_awaited_once_with(steam_id=STEAM_ID, force_refresh=False)


def test_steam_service_error_is_relayed(client, steam_linked):
    """
    @brief Tests that an IntegrationServiceError raised by the Steam service is relayed with its status code and message.
    @param client The FastAPI test client fixture.
    @param steam_linked Fixture providing authorization headers of a user with a linked Steam account.
    """
    error = IntegrationServiceError(502, "Erreur lors de la récupération des données Steam: timeout")
    with patch("app.api.endpoints.steam_api.fetch_steam_user_stats", new=AsyncMock(side_effect=error)):
        res = client.get("/api/v1/steam/user/stats", headers=steam_linked)
    assert res.status_code == 502
    assert "timeout" in res.json()["detail"]


def test_steam_callback_links_profile_from_service(client):
    """
    @brief Tests that the Steam OpenID callback verifies the response and returns the profile fetched from the service.
    @param client The FastAPI test client fixture.
    """
    verify_resp = MagicMock()
    verify_resp.text = "ns:http://specs.openid.net/auth/2.0\nis_valid:true\n"
    profile = {
        "steam_id": STEAM_ID,
        "username": "Tester",
        "avatar": "http://avatarfull.jpg",
        "profile_url": "http://steamcommunity.com/id/tester",
    }
    params = {
        "openid.mode": "id_res",
        "openid.claimed_id": f"https://steamcommunity.com/openid/id/{STEAM_ID}",
    }

    with patch("httpx.AsyncClient.post", new=AsyncMock(return_value=verify_resp)), patch(
        "app.api.endpoints.steam_api.fetch_steam_player_profile",
        new=AsyncMock(return_value=profile),
    ) as mock_profile:
        res = client.get(
            "/api/v1/auth/steam/callback",
            params=params,
            headers={"Accept": "application/json"},
        )

    assert res.status_code == 200
    assert res.json() == profile
    mock_profile.assert_awaited_once_with(STEAM_ID)
