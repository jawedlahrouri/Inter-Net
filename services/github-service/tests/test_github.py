import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.github import (
    format_repository,
    fetch_github_user_profile,
    fetch_github_user_stats,
)


def test_format_repository():
    """
    @brief Tests that format_repository maps a raw repository payload to the expected normalized fields.
    """
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
    """
    @brief Tests fetch_github_user_profile with a mocked HTTP GET returning a fake profile.
    """
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
    """
    @brief Tests fetch_github_user_stats with mocked profile and repository responses.
    """
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
        """
        @brief Fakes the HTTP GET by returning the repositories response for the user repos URL and the profile response otherwise.
        @param url Requested URL used to choose which mock response to return.
        @param args Extra positional arguments, ignored.
        @param kwargs Extra keyword arguments such as headers and params, ignored.
        @return The mocked repositories response or the mocked profile response.
        """
        if "user/repos" in url:
            return mock_repos_resp
        return mock_profile_resp

    with patch("httpx.AsyncClient.get", side_effect=mock_get_router):
        stats = await fetch_github_user_stats("token_for_stats_test")
        assert stats["public_repos_count"] == 2
        assert stats["total_stars"] == 10
        assert len(stats["recent_repos"]) == 1
        assert stats["top_languages"][0]["name"] == "Python"


@pytest.mark.anyio
async def test_fetch_github_repo_and_org_mocked():
    """
    @brief Tests the organisation list, organisation stats and repository stats functions with a mocked HTTP GET.
    """
    from app.github import (
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
        mock_resp.json.return_value = fake_orgs
        mock_get.return_value = mock_resp
        orgs = await fetch_github_user_orgs("token123")
        assert len(orgs) == 1
        assert orgs[0]["login"] == "epitech"

        mock_resp.json.return_value = fake_org_detail
        org_stats = await fetch_github_org_stats("token123", "epitech")
        assert org_stats["org"]["name"] == "Epitech"

        mock_resp.json.return_value = fake_repo_detail
        repo_stats = await fetch_github_repo_stats("token123", "epitech", "inter-net")
        assert repo_stats["repo"]["name"] == "inter-net"


