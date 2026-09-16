import asyncio
import time
import httpx
from typing import Dict, Any, List, Optional, Tuple


STEAM_API_BASE = "https://api.steampowered.com"
CACHE_TTL_SECONDS = 300  # 5 minutes (protection anti-spam et respect des quotas API Steam)

_STEAM_STATS_CACHE: Dict[str, Tuple[float, Dict[str, Any]]] = {}


def clear_steam_stats_cache() -> None:
    """Vide le cache mémoire des statistiques Steam (utile pour les tests)."""
    _STEAM_STATS_CACHE.clear()


def get_game_header_url(appid: int) -> str:
    """Génère l'URL officielle de la jaquette/bannière du jeu sur le CDN Steam."""
    return f"https://cdn.akamai.steamstatic.com/steam/apps/{appid}/header.jpg"


def get_game_icon_url(appid: int, icon_hash: Optional[str]) -> Optional[str]:
    """Génère l'URL officielle de l'icône de l'application Steam."""
    if not icon_hash:
        return None
    return f"https://media.steampowered.com/steamcommunity/public/images/apps/{appid}/{icon_hash}.jpg"


def get_persona_state_label(state: int, gameextrainfo: Optional[str] = None) -> str:
    """Traduit l'état de présence Steam en libellé lisible."""
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
    """Mappe un objet jeu brut de Steam vers un format standardisé."""
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
    """Récupère les informations de profil et l'état en direct du joueur."""
    res = await client.get(
        f"{STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v2/",
        params={"key": api_key, "steamids": steam_id},
    )
    if res.status_code != 200:
        return {}
    players = res.json().get("response", {}).get("players", [])
    return players[0] if players else {}


async def fetch_recently_played_games(
    client: httpx.AsyncClient, steam_id: str, api_key: str
) -> List[Dict[str, Any]]:
    """Récupère la liste des jeux joués au cours des 14 derniers jours."""
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
    """Récupère tous les jeux possédés par l'utilisateur."""
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
    """Récupère le niveau du profil Steam du joueur."""
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
    """Récupère les données de badges et d'expérience (XP) du joueur."""
    res = await client.get(
        f"{STEAM_API_BASE}/IPlayerService/GetBadges/v1/",
        params={"key": api_key, "steamid": steam_id},
    )
    if res.status_code != 200:
        return {}
    return res.json().get("response", {})


def compute_profile_summary(player: Dict[str, Any]) -> Dict[str, Any]:
    """Formate le profil utilisateur et son statut en direct."""
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
    """Calcule la progression XP vers le niveau suivant et le compte de badges."""
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
    """Calcule les statistiques globales de la ludothèque (heures totales, backlog, moyenne)."""
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
    """Détermine les jeux clés : dernier joué, plus joué, top 3 et listes récentes/backlog."""
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


async def fetch_steam_user_stats(
    steam_id: str,
    api_key: str,
    force_refresh: bool = False,
) -> Dict[str, Any]:
    """
    Orchestre la récupération et le calcul des 15 métriques statistiques Steam.
    Exécute les requêtes API en parallèle et applique un cache mémoire de 5 minutes.
    """
    now = time.time()
    if not force_refresh and steam_id in _STEAM_STATS_CACHE:
        timestamp, cached_data = _STEAM_STATS_CACHE[steam_id]
        if now - timestamp < CACHE_TTL_SECONDS:
            return cached_data

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

    _STEAM_STATS_CACHE[steam_id] = (time.time(), result)
    return result
