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
    return f"https://cdn.akamai.steamstatic.com/steam/apps/{appid}/header.jpg"


def get_game_icon_url(appid: int, icon_hash: Optional[str]) -> Optional[str]:
    if not icon_hash:
        return None
    return f"https://media.steampowered.com/steamcommunity/public/images/apps/{appid}/{icon_hash}.jpg"


def get_persona_state_label(state: int, gameextrainfo: Optional[str] = None) -> str:
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


async def fetch_steam_user_stats(
    steam_id: str,
    api_key: str,
    force_refresh: bool = False,
) -> Dict[str, Any]:
    """
    Interroge l'API Web Steam et calcule les métriques agrégées pour un joueur.
    Met en cache les résultats pendant 5 minutes (300 secondes) pour éviter le spam API.
    """
    now = time.time()
    if not force_refresh and steam_id in _STEAM_STATS_CACHE:
        timestamp, cached_data = _STEAM_STATS_CACHE[steam_id]
        if now - timestamp < CACHE_TTL_SECONDS:
            return cached_data

    async with httpx.AsyncClient(timeout=10.0) as client:

        # 1. Résumé du joueur (avatar, nom, statut en ligne/en jeu)
        summaries_res = await client.get(
            f"{STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v2/",
            params={"key": api_key, "steamids": steam_id},
        )
        players = summaries_res.json().get("response", {}).get("players", []) if summaries_res.status_code == 200 else []
        player = players[0] if players else {}

        # 2. Jeux récents (2 semaines)
        recent_res = await client.get(
            f"{STEAM_API_BASE}/IPlayerService/GetRecentlyPlayedGames/v1/",
            params={"key": api_key, "steamid": steam_id},
        )
        recent_data = recent_res.json().get("response", {}) if recent_res.status_code == 200 else {}
        recent_games_raw: List[Dict[str, Any]] = recent_data.get("games", [])

        # 3. Tous les jeux possédés
        owned_res = await client.get(
            f"{STEAM_API_BASE}/IPlayerService/GetOwnedGames/v1/",
            params={
                "key": api_key,
                "steamid": steam_id,
                "include_appinfo": "true",
                "include_played_free_games": "true",
            },
        )
        owned_data = owned_res.json().get("response", {}) if owned_res.status_code == 200 else {}
        owned_games_raw: List[Dict[str, Any]] = owned_data.get("games", [])
        total_games_count: int = owned_data.get("game_count", len(owned_games_raw))

        # 4. Niveau Steam
        level_res = await client.get(
            f"{STEAM_API_BASE}/IPlayerService/GetSteamLevel/v1/",
            params={"key": api_key, "steamid": steam_id},
        )
        steam_level = level_res.json().get("response", {}).get("player_level", 0) if level_res.status_code == 200 else 0

        # 5. Badges & XP
        badges_res = await client.get(
            f"{STEAM_API_BASE}/IPlayerService/GetBadges/v1/",
            params={"key": api_key, "steamid": steam_id},
        )
        badges_data = badges_res.json().get("response", {}) if badges_res.status_code == 200 else {}
        player_xp = badges_data.get("player_xp", 0)
        xp_needed_to_level_up = badges_data.get("player_xp_needed_to_level_up", 0)
        xp_current_level_base = badges_data.get("player_xp_needed_current_level", 0)
        badges_list = badges_data.get("badges", [])
        badges_count = len(badges_list)

    # Calculs et mise en forme des jeux possédés
    total_playtime_minutes = sum(g.get("playtime_forever", 0) for g in owned_games_raw)
    total_playtime_hours = round(total_playtime_minutes / 60.0, 1)

    unplayed_count = sum(1 for g in owned_games_raw if g.get("playtime_forever", 0) == 0)
    avg_hours = round(total_playtime_hours / max(total_games_count, 1), 1)

    # Map des temps de jeu des 2 dernières semaines (appid -> minutes)
    recent_2weeks_map = {
        g.get("appid"): g.get("playtime_2weeks", 0) for g in recent_games_raw if "appid" in g
    }

    # Tri par temps total de jeu pour le jeu le plus joué et top 3
    sorted_by_playtime = sorted(
        owned_games_raw, key=lambda g: g.get("playtime_forever", 0), reverse=True
    )

    def format_game(g: Dict[str, Any]) -> Dict[str, Any]:
        appid = g.get("appid", 0)
        p2w = recent_2weeks_map.get(appid, g.get("playtime_2weeks"))
        return {
            "appid": appid,
            "name": g.get("name", "Inconnu"),
            "playtime_forever_hours": round(g.get("playtime_forever", 0) / 60.0, 1),
            "playtime_2weeks_hours": round(p2w / 60.0, 1) if p2w is not None else None,
            "icon_url": get_game_icon_url(appid, g.get("img_icon_url")),
            "header_url": get_game_header_url(appid),
            "rtime_last_played": g.get("rtime_last_played"),
        }

    most_played_game = format_game(sorted_by_playtime[0]) if sorted_by_playtime else None
    top_3_played = [format_game(g) for g in sorted_by_playtime[:3]]

    # Calculs et mise en forme des jeux récents
    recent_playtime_minutes = sum(g.get("playtime_2weeks", 0) for g in recent_games_raw)
    recent_playtime_hours = round(recent_playtime_minutes / 60.0, 1)
    recent_games_count = len(recent_games_raw)

    # Tri chronologique selon rtime_last_played pour identifier le VRAI dernier jeu lancé
    sorted_by_last_played = sorted(
        owned_games_raw, key=lambda g: g.get("rtime_last_played", 0), reverse=True
    )
    if sorted_by_last_played and sorted_by_last_played[0].get("rtime_last_played", 0) > 0:
        last_played_game = format_game(sorted_by_last_played[0])
    elif recent_games_raw:
        last_played_game = format_game(recent_games_raw[0])
    else:
        last_played_game = most_played_game

    # Top 3 récents : triés par dernière session chronologique
    recent_chronological = [
        format_game(g)
        for g in sorted_by_last_played[:3]
        if g.get("rtime_last_played", 0) > 0
    ]
    top_3_recent = recent_chronological if recent_chronological else [format_game(g) for g in recent_games_raw[:3]]


    # Calcul progression niveau
    xp_in_level = player_xp - xp_current_level_base
    total_xp_for_level = xp_in_level + xp_needed_to_level_up
    progress_percent = min(
        100, max(0, int((xp_in_level / total_xp_for_level) * 100))
    ) if total_xp_for_level > 0 else 100

    # Formatage profil
    personastate = player.get("personastate", 0)
    gameextrainfo = player.get("gameextrainfo")
    status_label = get_persona_state_label(personastate, gameextrainfo)

    return {
        "steam_id": steam_id,
        "profile": {
            "personaname": player.get("personaname", "Joueur Steam"),
            "avatar": player.get("avatar", ""),
            "avatarfull": player.get("avatarfull", ""),
            "profileurl": player.get("profileurl", ""),
            "personastate": personastate,
            "gameextrainfo": gameextrainfo,
            "status_label": status_label,
            "is_in_game": bool(gameextrainfo),
        },
        # 15 Métriques
        "last_played_game": last_played_game,
        "most_played_game": most_played_game,
        "games_count": total_games_count,
        "total_playtime_hours": total_playtime_hours,
        "recent_playtime_hours": recent_playtime_hours,
        "steam_level": steam_level,
        "badges_count": badges_count,
        "player_xp": player_xp,
        "xp_needed_to_level_up": xp_needed_to_level_up,
        "next_level_progress": {
            "current_xp": player_xp,
            "xp_in_level": max(0, xp_in_level),
            "xp_needed": xp_needed_to_level_up,
            "total_level_span": total_xp_for_level,
            "percent": progress_percent,
        },
        "top_3_played": top_3_played,
        "top_3_recent": top_3_recent,
        "unplayed_games_count": unplayed_count,
        "avg_hours_per_game": avg_hours,
        "recent_games_count": recent_games_count,
    }

    _STEAM_STATS_CACHE[steam_id] = (time.time(), result)
    return result

