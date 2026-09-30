import asyncio
import httpx
from typing import Dict, Any, List, Optional, Tuple


STEAM_API_BASE = "https://api.steampowered.com"


def get_game_header_url(appid: int) -> str:
    """
    @brief Builds the Steam CDN URL of a game's header image.
    @param appid Steam application id of the game.
    @return The header.jpg URL on the Akamai Steam CDN for the given appid.
    """
    return f"https://cdn.akamai.steamstatic.com/steam/apps/{appid}/header.jpg"


def get_game_icon_url(appid: int, icon_hash: Optional[str]) -> Optional[str]:
    """
    @brief Builds the Steam community URL of a game's icon image when an icon hash is available.
    @param appid Steam application id of the game.
    @param icon_hash Icon hash returned by the Steam API, possibly empty or None.
    @return The icon JPEG URL, or None when no icon hash is provided.
    """
    if not icon_hash:
        return None
    return f"https://media.steampowered.com/steamcommunity/public/images/apps/{appid}/{icon_hash}.jpg"


def get_persona_state_label(state: int, gameextrainfo: Optional[str] = None) -> str:
    """
    @brief Converts a Steam persona state code into a French status label, preferring the game being played.
    @param state Numeric Steam persona state (0 offline to 6 looking to play).
    @param gameextrainfo Name of the game currently being played, if any.
    @return A French label such as 'En jeu : <game>' or the state name, defaulting to 'En ligne' for unknown states.
    """
    if gameextrainfo:
        return f"En jeu : {gameextrainfo}"
    states = {
        0: "Hors ligne",
        1: "En ligne",
        2: "Occupé",
        3: "Absent",
        4: "Endormi",
        5: "Prêt à échanger",
        6: "Prêt à jouer",
    }
    return states.get(state, "En ligne")


def format_game(
    g: Dict[str, Any],
    recent_2weeks_map: Optional[Dict[int, int]] = None,
) -> Dict[str, Any]:
    """
    @brief Normalizes a raw Steam game record into a dict with playtime in hours and image URLs.
    @param g Raw game dictionary from the Steam API.
    @param recent_2weeks_map Optional mapping of appid to playtime in minutes over the last two weeks.
    @return A dict with appid, name, playtime hours (total and two weeks), icon_url, header_url and last played time.
    """
    appid = g.get("appid", 0)
    p2w = None
    if recent_2weeks_map is not None:
        p2w = recent_2weeks_map.get(appid, g.get("playtime_2weeks"))
    elif "playtime_2weeks" in g:
        p2w = g.get("playtime_2weeks")

    return {
        "appid": appid,
        "name": g.get("name", "Inconnu"),
        "playtime_forever_hours": round(g.get("playtime_forever", 0) / 60.0, 1),
        "playtime_2weeks_hours": round(p2w / 60.0, 1) if p2w is not None else None,
        "icon_url": get_game_icon_url(appid, g.get("img_icon_url")),
        "header_url": get_game_header_url(appid),
        "rtime_last_played": g.get("rtime_last_played"),
    }


async def fetch_player_summary(
    client: httpx.AsyncClient, steam_id: str, api_key: str
) -> Dict[str, Any]:
    """
    @brief Fetches the Steam player summary for a Steam id using an existing HTTP client.
    @param client Async httpx client used to send the request.
    @param steam_id 64-bit Steam id of the player.
    @param api_key Steam Web API key.
    @return The first player dict from the response, or an empty dict on HTTP error or when no player is found.
    """
    res = await client.get(
        f"{STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v2/",
        params={"key": api_key, "steamids": steam_id},
    )
    if res.status_code != 200:
        return {}
    players = res.json().get("response", {}).get("players", [])
    return players[0] if players else {}


async def fetch_player_profile(steam_id: str, api_key: str) -> Dict[str, Any]:
    """
    @brief Fetches a Steam player's basic public profile and raises if the API fails or the player is missing.
    @param steam_id 64-bit Steam id of the player.
    @param api_key Steam Web API key.
    @return A dict with steam_id, username, avatar and profile_url.
    """
    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.get(
            f"{STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v2/",
            params={"key": api_key, "steamids": steam_id},
        )
    if res.status_code != 200:
        raise RuntimeError("Erreur lors de la communication avec l'API Steam.")
    players = res.json().get("response", {}).get("players", [])
    if not players:
        raise LookupError("Profil joueur introuvable.")
    player = players[0]
    return {
        "steam_id": steam_id,
        "username": player.get("personaname", ""),
        "avatar": player.get("avatarfull", ""),
        "profile_url": player.get("profileurl", ""),
    }


async def fetch_recently_played_games(
    client: httpx.AsyncClient, steam_id: str, api_key: str
) -> List[Dict[str, Any]]:
    """
    @brief Fetches the games a Steam user played recently.
    @param client Async httpx client used to send the request.
    @param steam_id 64-bit Steam id of the player.
    @param api_key Steam Web API key.
    @return The list of raw recently played game dicts, or an empty list on HTTP error.
    """
    res = await client.get(
        f"{STEAM_API_BASE}/IPlayerService/GetRecentlyPlayedGames/v1/",
        params={"key": api_key, "steamid": steam_id},
    )
    if res.status_code != 200:
        return []
    return res.json().get("response", {}).get("games", [])


async def fetch_owned_games(
    client: httpx.AsyncClient, steam_id: str, api_key: str
) -> Tuple[int, List[Dict[str, Any]]]:
    """
    @brief Fetches all games owned by a Steam user, including app info and played free games.
    @param client Async httpx client used to send the request.
    @param steam_id 64-bit Steam id of the player.
    @param api_key Steam Web API key.
    @return A tuple of the total game count and the list of raw game dicts, or (0, []) on HTTP error.
    """
    res = await client.get(
        f"{STEAM_API_BASE}/IPlayerService/GetOwnedGames/v1/",
        params={
            "key": api_key,
            "steamid": steam_id,
            "include_appinfo": "true",
            "include_played_free_games": "true",
        },
    )
    if res.status_code != 200:
        return 0, []
    data = res.json().get("response", {})
    games = data.get("games", [])
    count = data.get("game_count", len(games))
    return count, games


async def fetch_steam_level(
    client: httpx.AsyncClient, steam_id: str, api_key: str
) -> int:
    """
    @brief Fetches the Steam level of a user.
    @param client Async httpx client used to send the request.
    @param steam_id 64-bit Steam id of the player.
    @param api_key Steam Web API key.
    @return The player's Steam level as an int, or 0 on HTTP error or missing data.
    """
    res = await client.get(
        f"{STEAM_API_BASE}/IPlayerService/GetSteamLevel/v1/",
        params={"key": api_key, "steamid": steam_id},
    )
    if res.status_code != 200:
        return 0
    return res.json().get("response", {}).get("player_level", 0)


async def fetch_badges_and_xp(
    client: httpx.AsyncClient, steam_id: str, api_key: str
) -> Dict[str, Any]:
    """
    @brief Fetches the badges and experience data of a Steam user.
    @param client Async httpx client used to send the request.
    @param steam_id 64-bit Steam id of the player.
    @param api_key Steam Web API key.
    @return The response dict holding badges and XP fields, or an empty dict on HTTP error.
    """
    res = await client.get(
        f"{STEAM_API_BASE}/IPlayerService/GetBadges/v1/",
        params={"key": api_key, "steamid": steam_id},
    )
    if res.status_code != 200:
        return {}
    return res.json().get("response", {})


def compute_profile_summary(player: Dict[str, Any]) -> Dict[str, Any]:
    """
    @brief Builds a simplified profile summary with a French status label from a raw Steam player dict.
    @param player Raw player summary dictionary from the Steam API.
    @return A dict with persona name, avatars, profile URL, persona state, current game, status_label and is_in_game.
    """
    personastate = player.get("personastate", 0)
    gameextrainfo = player.get("gameextrainfo")
    return {
        "personaname": player.get("personaname", "Joueur Steam"),
        "avatar": player.get("avatar", ""),
        "avatarfull": player.get("avatarfull", ""),
        "profileurl": player.get("profileurl", ""),
        "personastate": personastate,
        "gameextrainfo": gameextrainfo,
        "status_label": get_persona_state_label(personastate, gameextrainfo),
        "is_in_game": bool(gameextrainfo),
    }


def compute_level_progress(
    player_xp: int,
    badges_data: Dict[str, Any],
) -> Tuple[int, int, Dict[str, Any]]:
    """
    @brief Computes the progress towards the next Steam level and counts the user's badges.
    @param player_xp Total experience points of the player.
    @param badges_data Badges response dict containing XP thresholds and the badge list.
    @return A tuple of badge count, XP needed to level up, and a progress dict with current xp, xp in level, span and percent.
    """
    xp_needed_to_level_up = badges_data.get("player_xp_needed_to_level_up", 0)
    xp_current_level_base = badges_data.get("player_xp_needed_current_level", 0)
    xp_in_level = max(0, player_xp - xp_current_level_base)
    total_level_span = xp_in_level + xp_needed_to_level_up
    percent = min(100, max(0, int((xp_in_level / total_level_span) * 100))) if total_level_span > 0 else 100
    badges_count = len(badges_data.get("badges", []))
    progress = {
        "current_xp": player_xp,
        "xp_in_level": xp_in_level,
        "xp_needed": xp_needed_to_level_up,
        "total_level_span": total_level_span,
        "percent": percent,
    }
    return badges_count, xp_needed_to_level_up, progress


def compute_library_statistics(
    owned_games: List[Dict[str, Any]],
    total_count: int,
) -> Dict[str, Any]:
    """
    @brief Computes total playtime, unplayed game count and average hours per game for a Steam library.
    @param owned_games List of raw owned game dicts with playtime in minutes.
    @param total_count Total number of games owned by the user.
    @return A dict with total_playtime_hours, unplayed_games_count and avg_hours_per_game.
    """
    total_minutes = sum(g.get("playtime_forever", 0) for g in owned_games)
    total_hours = round(total_minutes / 60.0, 1)
    unplayed_count = sum(1 for g in owned_games if g.get("playtime_forever", 0) == 0)
    avg_hours = round(total_hours / max(total_count, 1), 1)
    return {
        "total_playtime_hours": total_hours,
        "unplayed_games_count": unplayed_count,
        "avg_hours_per_game": avg_hours,
    }


def compute_game_highlights(
    owned_games: List[Dict[str, Any]],
    recent_games: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    @brief Selects highlighted games such as most played, last played, top 3 and recent and unplayed lists.
    @param owned_games List of raw owned game dicts.
    @param recent_games List of raw recently played game dicts with two-week playtime.
    @return A dict with last and most played games, top 3 lists, recent and unplayed game lists, recent hours and count.
    """
    recent_2w_map = {g.get("appid"): g.get("playtime_2weeks", 0) for g in recent_games if "appid" in g}
    sorted_playtime = sorted(owned_games, key=lambda g: g.get("playtime_forever", 0), reverse=True)
    sorted_last_played = sorted(owned_games, key=lambda g: g.get("rtime_last_played", 0), reverse=True)

    most_played = format_game(sorted_playtime[0], recent_2w_map) if sorted_playtime else None
    top_3_played = [format_game(g, recent_2w_map) for g in sorted_playtime[:3]]

    if sorted_last_played and sorted_last_played[0].get("rtime_last_played", 0) > 0:
        last_played = format_game(sorted_last_played[0], recent_2w_map)
    elif recent_games:
        last_played = format_game(recent_games[0], recent_2w_map)
    else:
        last_played = most_played

    recent_chrono = [format_game(g, recent_2w_map) for g in sorted_last_played[:3] if g.get("rtime_last_played", 0) > 0]
    top_3_recent = recent_chrono if recent_chrono else [format_game(g, recent_2w_map) for g in recent_games[:3]]

    recent_appids = {g.get("appid") for g in recent_games if "appid" in g}
    recent_owned_sorted = [g for g in sorted_last_played if g.get("appid") in recent_appids]
    recent_owned_appids = {g.get("appid") for g in recent_owned_sorted}
    for g in recent_games:
        if g.get("appid") not in recent_owned_appids:
            recent_owned_sorted.append(g)

    unplayed_raw = [g for g in owned_games if g.get("playtime_forever", 0) == 0]
    recent_hours = round(sum(g.get("playtime_2weeks", 0) for g in recent_games) / 60.0, 1)

    return {
        "last_played_game": last_played,
        "most_played_game": most_played,
        "top_3_played": top_3_played,
        "top_3_recent": top_3_recent,
        "recent_games_list": [format_game(g, recent_2w_map) for g in recent_owned_sorted],
        "unplayed_games_list": [format_game(g, recent_2w_map) for g in unplayed_raw],
        "recent_playtime_hours": recent_hours,
        "recent_games_count": len(recent_games),
    }


async def fetch_steam_user_stats(steam_id: str, api_key: str) -> Dict[str, Any]:
    """
    @brief Concurrently queries the Steam API and aggregates profile, level, badges, library and game highlight statistics.
    @param steam_id 64-bit Steam id of the player.
    @param api_key Steam Web API key.
    @return A dict combining the profile, level, XP progress, library statistics and game highlights of the user.
    """
    async with httpx.AsyncClient(timeout=10.0) as client:
        player_task = fetch_player_summary(client, steam_id, api_key)
        recent_task = fetch_recently_played_games(client, steam_id, api_key)
        owned_task = fetch_owned_games(client, steam_id, api_key)
        level_task = fetch_steam_level(client, steam_id, api_key)
        badges_task = fetch_badges_and_xp(client, steam_id, api_key)

        player, recent_games, (total_count, owned_games), level, badges_data = await asyncio.gather(
            player_task, recent_task, owned_task, level_task, badges_task
        )

    player_xp = badges_data.get("player_xp", 0)
    badges_count, xp_needed, progress = compute_level_progress(player_xp, badges_data)
    library_stats = compute_library_statistics(owned_games, total_count)
    highlights = compute_game_highlights(owned_games, recent_games)

    result = {
        "steam_id": steam_id,
        "profile": compute_profile_summary(player),
        "games_count": total_count,
        "steam_level": level,
        "badges_count": badges_count,
        "player_xp": player_xp,
        "xp_needed_to_level_up": xp_needed,
        "next_level_progress": progress,
        **library_stats,
        **highlights,
    }
    return result
