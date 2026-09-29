from unittest.mock import AsyncMock, patch

import httpx
import pytest

from app.core.security import create_access_token
from app.models.user import User
from app.services.integration_clients import IntegrationServiceError
from app.services.integration_service import link_user_service


@pytest.fixture
def auth_header(db_session):
    """
    @brief Pytest fixture that creates a test user in the database and builds a bearer token for it.
    @param db_session Database session fixture used to persist the test user.
    @return A tuple of the Authorization header dict and the created User.
    """
    user = User(
        email="dev@epitech.eu",
        username="githubdev",
        password_hash="fakehash",
        role="user",
        is_verified=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    token = create_access_token(subject=user.id)
    return {"Authorization": f"Bearer {token}"}, user


@pytest.fixture
def github_linked(db_session, auth_header):
    """
    @brief Pytest fixture that links the test user to the GitHub service with a fake access token.
    @param db_session Database session fixture used to store the linked GitHub service.
    @param auth_header Fixture providing the Authorization headers and the user to link.
    @return The Authorization header dict of the user whose GitHub account is linked.
    """
    headers, user = auth_header
    link_user_service(
        db=db_session,
        user_id=user.id,
        service_name="github",
        access_token="ghp_linked_token",
        credentials={"login": "githubdev"},
        service_display_name="GitHub",
        service_description="Service GitHub Développeur",
        service_auth_type="api_key",
    )
    return headers


def test_github_status_disconnected(client, auth_header):
    """
    @brief Tests that the GitHub status endpoint reports connected as false for a user without a linked account.
    @param client FastAPI test client fixture used to send requests.
    @param auth_header Fixture providing the Authorization headers and the user.
    """
    headers, _ = auth_header
    res = client.get("/api/v1/auth/github/status", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["connected"] is False


def test_github_connect_token(client, auth_header):
    """
    @brief Tests the full GitHub token connect, status and disconnect flow with a mocked profile fetch.
    @param client FastAPI test client fixture used to send requests.
    @param auth_header Fixture providing the Authorization headers and the user.
    """
    headers, user = auth_header

    fake_profile = {
        "github_id": "4567",
        "login": "tester",
        "username": "Tester Bot",
        "avatar": "https://avatar.url/tester.png",
        "profile_url": "https://github.com/tester",
    }

    with patch(
        "app.api.endpoints.github_api.fetch_github_user_profile",
        new=AsyncMock(return_value=fake_profile),
    ) as mock_profile:
        res = client.post(
            "/api/v1/auth/github/token",
            headers=headers,
            json={"token": "ghp_valid_mock_token_12345"},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["message"] == "Compte GitHub connecté avec succès."
        assert data["profile"]["login"] == "tester"
        mock_profile.assert_awaited_once_with("ghp_valid_mock_token_12345")

    res_status = client.get("/api/v1/auth/github/status", headers=headers)
    assert res_status.status_code == 200
    status_data = res_status.json()
    assert status_data["connected"] is True
    assert status_data["profile"]["login"] == "tester"

    res_disc = client.post("/api/v1/auth/github/disconnect", headers=headers)
    assert res_disc.status_code == 200
    assert "déconnecté" in res_disc.json()["message"]

    res_after = client.get("/api/v1/auth/github/status", headers=headers)
    assert res_after.json()["connected"] is False


def test_github_connect_invalid_token_relays_service_error(client, auth_header):
    """
    @brief Tests that an invalid GitHub token error from the integration service is relayed as a 401 and leaves the account disconnected.
    @param client FastAPI test client fixture used to send requests.
    @param auth_header Fixture providing the Authorization headers and the user.
    """
    headers, _ = auth_header
    error = IntegrationServiceError(401, "Token GitHub invalide ou expiré.")
    with patch("app.api.endpoints.github_api.fetch_github_user_profile", new=AsyncMock(side_effect=error)):
        res = client.post("/api/v1/auth/github/token", headers=headers, json={"token": "ghp_bad"})
    assert res.status_code == 401
    assert res.json()["detail"] == "Token GitHub invalide ou expiré."

    res_status = client.get("/api/v1/auth/github/status", headers=headers)
    assert res_status.json()["connected"] is False


def test_github_stats_delegated_to_service(client, github_linked):
    """
    @brief Tests that the GitHub user stats endpoint delegates to the stats service with the stored token and force_refresh flag.
    @param client FastAPI test client fixture used to send requests.
    @param github_linked Fixture providing headers of a user with a linked GitHub account.
    """
    with patch(
        "app.api.endpoints.github_api.fetch_github_user_stats",
        new=AsyncMock(return_value={"total_stars": 7}),
    ) as mock_stats:
        res = client.get("/api/v1/auth/github/user/stats?force_refresh=true", headers=github_linked)
    assert res.status_code == 200
    assert res.json() == {"total_stars": 7}
    mock_stats.assert_awaited_once_with(token="ghp_linked_token", force_refresh=True)


def test_github_service_unreachable_returns_503(client, github_linked):
    """
    @brief Tests that a connection failure to the GitHub microservice is reported as a 503 error.
    @param client FastAPI test client fixture used to send requests.
    @param github_linked Fixture providing headers of a user with a linked GitHub account.
    """
    with patch("httpx.AsyncClient.get", new=AsyncMock(side_effect=httpx.ConnectError("refused"))):
        res = client.get("/api/v1/auth/github/user/orgs", headers=github_linked)
    assert res.status_code == 503
    assert "GitHub" in res.json()["detail"]


def test_about_json_includes_github(client):
    """
    @brief Tests that about.json lists the github service along with its repo, org and repos-by-org widgets.
    @param client FastAPI test client fixture used to send requests.
    """
    res = client.get("/about.json")
    assert res.status_code == 200
    services = res.json()["server"]["services"]
    names = [s["name"] for s in services]
    assert "github" in names
    github_service = next(s for s in services if s["name"] == "github")
    widget_names = [w["name"] for w in github_service["widgets"]]
    assert "repo_overview" in widget_names
    assert "org_overview" in widget_names
    assert "repos_by_org" in widget_names
