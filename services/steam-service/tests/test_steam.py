import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.steam import (
    get_game_icon_url,
    get_game_header_url,
    get_persona_state_label,
    fetch_steam_user_stats,
)


def test_get_game_icon_url():
    """
    @brief Tests that get_game_icon_url builds the expected URL and returns None for a missing or empty hash.
    """
    url = get_game_icon_url(730, "abcdef123456")
    assert url == "https://media.steampowered.com/steamcommunity/public/images/apps/730/abcdef123456.jpg"
    assert get_game_icon_url(730, None) is None
    assert get_game_icon_url(730, "") is None


def test_get_game_header_url():
    """
    @brief Tests that get_game_header_url returns the expected Steam CDN header URL.
    """
    url = get_game_header_url(1172470)
    assert url == "https://cdn.akamai.steamstatic.com/steam/apps/1172470/header.jpg"


def test_get_persona_state_label():
    """
    @brief Tests the French persona state labels, the in-game label and the fallback for unknown states.
    """
    assert get_persona_state_label(1, "Apex Legends") == "En jeu : Apex Legends"
    assert get_persona_state_label(0, None) == "Hors ligne"
    assert get_persona_state_label(1, None) == "En ligne"
    assert get_persona_state_label(2, None) == "Occupé"
    assert get_persona_state_label(3, None) == "Absent"
    assert get_persona_state_label(4, None) == "Endormi"
    assert get_persona_state_label(99, None) == "En ligne"



@pytest.mark.anyio
async def test_fetch_steam_user_stats_mocked():
    """
    @brief Tests fetch_steam_user_stats against a mocked HTTP client and checks the aggregated statistics.
    """
    player_summary_response = {
        "response": {
            "players": [
                {
                    "steamid": "76561198000000000",
                    "personaname": "Tester",
                    "avatar": "http://avatar.jpg",
                    "avatarfull": "http://avatarfull.jpg",
                    "profileurl": "http://steamcommunity.com/id/tester",
                    "personastate": 1,
                    "gameextrainfo": "Half-Life 3",
                }
            ]
        }
    }
    recent_games_response = {
        "response": {
            "total_count": 1,
            "games": [
                {
                    "appid": 70,
                    "name": "Half-Life",
                    "playtime_2weeks": 120,
                    "playtime_forever": 600,
                    "img_icon_url": "iconhash",
                }
            ],
        }
    }
    owned_games_response = {
        "response": {
            "game_count": 2,
            "games": [
                {
                    "appid": 70,
                    "name": "Half-Life",
                    "playtime_forever": 600,
                    "img_icon_url": "iconhash",
                },
                {
                    "appid": 220,
                    "name": "Half-Life 2",
                    "playtime_forever": 0,
                    "img_icon_url": "iconhash2",
                },
            ],
        }
    }
    steam_level_response = {"response": {"player_level": 42}}
    badges_response = {
        "response": {
            "player_xp": 1050,
            "player_xp_needed_to_level_up": 50,
            "player_xp_needed_current_level": 1000,
            "badges": [{"badgeid": 1}],
        }
    }

    mock_client = AsyncMock()

    async def mock_get(url, params=None):
        """
        @brief Fakes the async HTTP client GET by returning a canned Steam API response chosen from the requested URL.
        @param url Requested Steam API URL used to pick the canned response.
        @param params Query parameters of the request, ignored by the mock.
        @return A mock response with status 200 and the JSON payload matching the endpoint.
        """
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        if "GetPlayerSummaries" in url:
            mock_resp.json.return_value = player_summary_response
        elif "GetRecentlyPlayedGames" in url:
            mock_resp.json.return_value = recent_games_response
        elif "GetOwnedGames" in url:
            mock_resp.json.return_value = owned_games_response
        elif "GetSteamLevel" in url:
            mock_resp.json.return_value = steam_level_response
        elif "GetBadges" in url:
            mock_resp.json.return_value = badges_response
        else:
            mock_resp.json.return_value = {}
        return mock_resp

    mock_client.get = mock_get

    with patch("httpx.AsyncClient") as mock_async_client_cls:
        mock_async_client_cls.return_value.__aenter__.return_value = mock_client

        stats = await fetch_steam_user_stats("76561198000000000", "testkey")

        assert stats["steam_id"] == "76561198000000000"
        assert stats["profile"]["personaname"] == "Tester"
        assert stats["profile"]["is_in_game"] is True
        assert stats["profile"]["gameextrainfo"] == "Half-Life 3"
        assert stats["steam_level"] == 42
        assert stats["badges_count"] == 1
        assert stats["games_count"] == 2
        assert stats["total_playtime_hours"] == 10.0
        assert stats["recent_playtime_hours"] == 2.0
        assert stats["unplayed_games_count"] == 1
        assert stats["next_level_progress"]["percent"] == 50


def test_compute_profile_summary():
    """
    @brief Tests that compute_profile_summary maps a player dict to the expected name, in-game flag and status label.
    """
    from app.steam import compute_profile_summary
    profile = compute_profile_summary({
        "personaname": "Alice",
        "avatar": "http://a.jpg",
        "avatarfull": "http://afull.jpg",
        "profileurl": "http://steam/alice",
        "personastate": 1,
        "gameextrainfo": "Portal 2",
    })
    assert profile["personaname"] == "Alice"
    assert profile["is_in_game"] is True
    assert profile["status_label"] == "En jeu : Portal 2"


def test_compute_level_progress():
    """
    @brief Tests that compute_level_progress returns the right badge count, XP needed and percent progress.
    """
    from app.steam import compute_level_progress
    badges_count, xp_needed, progress = compute_level_progress(
        player_xp=550,
        badges_data={
            "player_xp_needed_to_level_up": 50,
            "player_xp_needed_current_level": 500,
            "badges": [{"badgeid": 1}, {"badgeid": 2}],
        },
    )
    assert badges_count == 2
    assert xp_needed == 50
    assert progress["percent"] == 50
    assert progress["xp_in_level"] == 50


def test_compute_library_statistics():
    """
    @brief Tests that compute_library_statistics returns the right total hours, unplayed count and average hours.
    """
    from app.steam import compute_library_statistics
    stats = compute_library_statistics(
        owned_games=[
            {"appid": 1, "playtime_forever": 120},
            {"appid": 2, "playtime_forever": 0},
        ],
        total_count=2,
    )
    assert stats["total_playtime_hours"] == 2.0
    assert stats["unplayed_games_count"] == 1
    assert stats["avg_hours_per_game"] == 1.0

