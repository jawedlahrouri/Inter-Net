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
from app.services.integration_clients import (
    fetch_steam_player_profile,
    fetch_steam_user_stats,
)

load_dotenv()

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
    """
    @brief Builds the Steam OpenID login URL and redirects the user to Steam.
    @param token The optional app JWT appended to the return URL to identify the user on callback.
    @return A redirect response to the Steam OpenID login page.
    """
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
    """
    @brief Handles the Steam OpenID callback by verifying the assertion, extracting the SteamID and linking the Steam account to the user.
    @param request The incoming request holding the OpenID query parameters and headers.
    @param token The optional app JWT used to identify the user to link.
    @param db The database session dependency.
    @return The Steam player profile as JSON if the client accepts JSON, otherwise a redirect to the frontend settings tab.
    """
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

    player_data = await fetch_steam_player_profile(steam_id)

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
        return SteamResponse(**player_data)

    return RedirectResponse(url=f"{FRONTEND_URL}/?tab=settings&steam=connected")


@router.get("/auth/steam/status")
def steam_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    @brief Returns the Steam connection status of the current user.
    @param db The database session dependency.
    @param current_user The authenticated user resolved from the bearer token.
    @return The Steam service link status for the current user.
    """
    return get_user_service_status(db=db, user_id=current_user.id, service_name="steam")


@router.post("/auth/steam/disconnect")
def steam_disconnect(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    @brief Unlinks the Steam account from the current user.
    @param db The database session dependency.
    @param current_user The authenticated user resolved from the bearer token.
    @return A message dict stating whether a Steam account was disconnected or none was linked.
    """
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
    @brief Fetches the Steam statistics of the current user after checking that Steam is configured and linked.
    @param force_refresh Whether to bypass the cache and fetch fresh data.
    @param db The database session dependency.
    @param current_user The authenticated user resolved from the bearer token.
    @return The Steam user statistics returned by the Steam client, or a 400 error if Steam is not configured or linked.
    """
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

    return await fetch_steam_user_stats(
        steam_id=user_service.access_token,
        force_refresh=force_refresh,
    )