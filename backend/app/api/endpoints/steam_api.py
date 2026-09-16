import os
import re
import urllib.parse
from typing import Optional
import httpx
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.service import Service, UserService
from app.services.integration_service import (
    resolve_user_from_request,
    link_user_service,
    get_user_service_status,
    unlink_user_service,
)
from app.services.steam_service import fetch_steam_user_stats

load_dotenv()

STEAM_API_KEY = os.getenv("STEAM_API_KEY")
BASE_URL = os.getenv("BASE_URL", "http://localhost:8080")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
RETURN_URL = f"{BASE_URL}/api/v1/auth/steam/callback"

STEAM_OPENID_URL = "https://steamcommunity.com/openid/login"

router = APIRouter()


class SteamResponse(BaseModel):
    steam_id: str
    username: str
    avatar: str
    profile_url: str


@router.get("/auth/steam")
def steam_auth(token: Optional[str] = None):
    """Redirige l'utilisateur vers la mire de connexion Steam."""
    return_url = f"{RETURN_URL}?token={token}" if token else RETURN_URL
    params = {
        "openid.ns": "http://specs.openid.net/auth/2.0",
        "openid.mode": "checkid_setup",
        "openid.return_to": return_url,
        "openid.realm": BASE_URL,
        "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
        "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
    }
    redirect_url = f"{STEAM_OPENID_URL}?{urllib.parse.urlencode(params)}"
    return RedirectResponse(url=redirect_url)


@router.get("/auth/steam/callback")
async def steam_callback(
    request: Request,
    token: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Reçoit la réponse de Steam, vérifie la signature et récupère les infos du profil."""
    if not STEAM_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="La clé API Steam n'est pas configurée.",
        )

    query_params = dict(request.query_params)
    if not query_params or query_params.get("openid.mode") != "id_res":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Authentification Steam annulée ou invalide.",
        )

    verification_params = query_params.copy()
    verification_params["openid.mode"] = "check_authentication"

    async with httpx.AsyncClient() as client:
        verify_response = await client.post(
            STEAM_OPENID_URL, data=verification_params
        )

        if "is_valid:true" not in verify_response.text:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Échec de validation OpenID Steam.",
            )

        claimed_id = query_params.get("openid.claimed_id", "")
        match = re.search(r"^https://steamcommunity\.com/openid/id/(\d+)$", claimed_id)
        if not match:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Format de SteamID introuvable.",
            )
        steam_id = match.group(1)

        api_url = "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/"
        user_response = await client.get(
            api_url, params={"key": STEAM_API_KEY, "steamids": steam_id}
        )

        if user_response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Erreur lors de la communication avec l'API Steam.",
            )

        players = user_response.json().get("response", {}).get("players", [])
        if not players:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profil joueur introuvable.",
            )

        player = players[0]
        player_data = {
            "steam_id": steam_id,
            "username": player.get("personaname", ""),
            "avatar": player.get("avatarfull", ""),
            "profile_url": player.get("profileurl", ""),
        }

        # Associer à l'utilisateur connecté
        user = resolve_user_from_request(db, request, token)
        if user:
            try:
                link_user_service(
                    db=db,
                    user_id=user.id,
                    service_name="steam",
                    access_token=steam_id,
                    credentials=player_data,
                    service_display_name="Steam",
                    service_description="Service Steam Gaming",
                    service_auth_type="oauth2",
                )
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Erreur lors de l'enregistrement du compte Steam: {e}",
                )

        accept_header = request.headers.get("accept", "")
        if "application/json" in accept_header:
            return SteamResponse(
                steam_id=steam_id,
                username=player.get("personaname", ""),
                avatar=player.get("avatarfull", ""),
                profile_url=player.get("profileurl", ""),
            )

        return RedirectResponse(url=f"{FRONTEND_URL}/?tab=settings&steam=connected")


@router.get("/auth/steam/status")
def steam_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retourne le statut de connexion Steam pour l'utilisateur actuel."""
    return get_user_service_status(db=db, user_id=current_user.id, service_name="steam")


@router.post("/auth/steam/disconnect")
def steam_disconnect(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Déconnecte le compte Steam de l'utilisateur."""
    unlinked = unlink_user_service(db=db, user_id=current_user.id, service_name="steam")
    if unlinked:
        return {"message": "Compte Steam déconnecté avec succès."}
    return {"message": "Aucun compte Steam lié à déconnecter."}


@router.get("/auth/steam/user/stats")
@router.get("/steam/user/stats")
async def steam_user_stats(
    force_refresh: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retourne les 15 métriques statistiques Steam pour l'utilisateur connecté.
    Exige impérativement que le compte Steam soit lié.
    Protégé par un cache serveur de 5 minutes pour respecter les quotas Steam.
    """
    if not STEAM_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="La clé API Steam n'est pas configurée sur le serveur.",
        )

    service = db.query(Service).filter(Service.name == "steam").first()
    if not service:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le service Steam n'est pas configuré.",
        )

    user_service = db.query(UserService).filter(
        UserService.user_id == current_user.id,
        UserService.service_id == service.id,
        UserService.is_connected == True,
    ).first()

    if not user_service or not user_service.access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Veuillez connecter votre compte Steam dans vos Paramètres pour accéder aux widgets Steam.",
        )

    steam_id = user_service.access_token
    try:
        stats = await fetch_steam_user_stats(
            steam_id=steam_id,
            api_key=STEAM_API_KEY,
            force_refresh=force_refresh,
        )
        return stats

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Erreur lors de la récupération des données Steam: {e}",
        )