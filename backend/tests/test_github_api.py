import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.models.user import User
from app.core.security import create_access_token
from app.services.github_service import (
    format_repository,
    fetch_github_user_profile,
    fetch_github_user_stats,
    clear_github_cache,
)


@pytest.fixture
def auth_header(db_session):
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


def test_format_repository():
    raw_repo = {
        "id": 12345,
        "name": "inter-net",
        "full_name": "crabe/inter-net",
        "html_url": "https://github.com/crabe/inter-net",
        "description": "Dashboard",
        "language": "TypeScript",
        "stargazers_count": 42,
        "forks_count": 5,
        "open_issues_count": 2,
        "updated_at": "2026-09-16T12:00:00Z",
        "private": False,
    }
    formatted = format_repository(raw_repo)
    assert formatted["name"] == "inter-net"
    assert formatted["stargazers_count"] == 42
    assert formatted["language"] == "TypeScript"
    assert formatted["is_private"] is False


@pytest.mark.anyio
async def test_fetch_github_user_profile_mocked():
    fake_profile = {
        "id": 99999,
        "login": "octocat",
        "name": "The Octocat",
        "avatar_url": "https://avatars.githubusercontent.com/u/99999",
        "html_url": "https://github.com/octocat",
        "bio": "GitHub mascot",
        "public_repos": 8,
        "followers": 1500,
        "following": 0,
        "created_at": "2011-01-25T18:44:36Z",
    }

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = fake_profile

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_resp
        profile = await fetch_github_user_profile("fake_token")
        assert profile["login"] == "octocat"
        assert profile["username"] == "The Octocat"
        assert profile["public_repos"] == 8


@pytest.mark.anyio
async def test_fetch_github_user_stats_mocked():
    clear_github_cache()
    fake_profile = {
        "id": 123,
        "login": "coder",
        "name": "Code Master",
        "avatar_url": "https://avatar.url",
        "html_url": "https://github.com/coder",
        "public_repos": 2,
        "followers": 10,
        "following": 5,
    }
    fake_repos = [
        {
            "id": 1,
            "name": "repo-one",
            "full_name": "coder/repo-one",
            "html_url": "https://github.com/coder/repo-one",
            "description": "Test repo",
            "language": "Python",
            "stargazers_count": 10,
            "forks_count": 2,
            "open_issues_count": 0,
            "updated_at": "2026-09-16T10:00:00Z",
            "private": False,
        }
    ]

    mock_profile_resp = MagicMock()
    mock_profile_resp.status_code = 200
    mock_profile_resp.json.return_value = fake_profile

    mock_repos_resp = MagicMock()
    mock_repos_resp.status_code = 200
    mock_repos_resp.json.return_value = fake_repos

    async def mock_get_router(url, *args, **kwargs):
        if "user/repos" in url:
            return mock_repos_resp
        return mock_profile_resp

    with patch("httpx.AsyncClient.get", side_effect=mock_get_router):
        stats = await fetch_github_user_stats("token_for_stats_test")
        assert stats["public_repos_count"] == 2
        assert stats["total_stars"] == 10
        assert len(stats["recent_repos"]) == 1
        assert stats["top_languages"][0]["name"] == "Python"


def test_github_status_disconnected(client, auth_header):
    headers, _ = auth_header
    res = client.get("/api/v1/auth/github/status", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["connected"] is False


def test_github_connect_token(client, auth_header):
    headers, user = auth_header

    fake_profile = {
        "id": 4567,
        "login": "tester",
        "name": "Tester Bot",
        "avatar_url": "https://avatar.url/tester.png",
        "html_url": "https://github.com/tester",
        "public_repos": 12,
        "followers": 5,
        "following": 3,
    }

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = fake_profile

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_resp
        res = client.post(
            "/api/v1/auth/github/token",
            headers=headers,
            json={"token": "ghp_valid_mock_token_12345"},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["message"] == "Compte GitHub connecté avec succès."
        assert data["profile"]["login"] == "tester"

    # Vérification du statut connecté
    res_status = client.get("/api/v1/auth/github/status", headers=headers)
    assert res_status.status_code == 200
    status_data = res_status.json()
    assert status_data["connected"] is True
    assert status_data["profile"]["login"] == "tester"

    # Déconnexion
    res_disc = client.post("/api/v1/auth/github/disconnect", headers=headers)
    assert res_disc.status_code == 200
    assert "déconnecté" in res_disc.json()["message"]

    # Statut après déconnexion
    res_after = client.get("/api/v1/auth/github/status", headers=headers)
    assert res_after.json()["connected"] is False


def test_about_json_includes_github(client):
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


@pytest.mark.anyio
async def test_fetch_github_repo_and_org_mocked():
    from app.services.github_service import (
        fetch_github_user_orgs,
        fetch_github_org_stats,
        fetch_github_repo_stats,
    )

    fake_orgs = [{"id": 1, "login": "epitech", "avatar_url": "https://epitech.eu/logo.png", "description": "School"}]
    fake_org_detail = {"id": 1, "login": "epitech", "name": "Epitech", "description": "School", "public_repos": 5}
    fake_repo_detail = {
        "id": 99,
        "name": "inter-net",
        "full_name": "epitech/inter-net",
        "stargazers_count": 15,
        "forks_count": 2,
        "open_issues_count": 1,
        "language": "TypeScript",
        "private": False,
    }

    mock_resp = MagicMock()
    mock_resp.status_code = 200

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        # 1. Orgs
        mock_resp.json.return_value = fake_orgs
        mock_get.return_value = mock_resp
        orgs = await fetch_github_user_orgs("token123")
        assert len(orgs) == 1
        assert orgs[0]["login"] == "epitech"

        # 2. Org stats
        mock_resp.json.return_value = fake_org_detail
        org_stats = await fetch_github_org_stats("token123", "epitech")
        assert org_stats["org"]["name"] == "Epitech"

        # 3. Repo stats
        mock_resp.json.return_value = fake_repo_detail
        repo_stats = await fetch_github_repo_stats("token123", "epitech", "inter-net")
        assert repo_stats["repo"]["name"] == "inter-net"


