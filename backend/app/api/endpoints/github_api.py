import os
import urllib.parse
from typing import Optional
import httpx
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.core.config import settings
from app.models.user import User
from app.models.service import Service, UserService
from app.services.integration_service import (
    resolve_user_from_request,
    link_user_service,
    get_user_service_status,
    unlink_user_service,
)
from app.services.github_service import (
    fetch_github_user_profile,
    fetch_github_user_stats,
    fetch_github_user_orgs,
    fetch_github_org_stats,
    fetch_github_repo_stats,
)

load_dotenv()

GITHUB_OAUTH_AUTHORIZE_URL = "https://github.com/login/oauth/authorize"
GITHUB_OAUTH_TOKEN_URL = "https://github.com/login/oauth/access_token"

router = APIRouter()


class GithubTokenConnect(BaseModel):
    token: str


class GithubProfileResponse(BaseModel):
    github_id: str
    login: str
    username: str
    avatar: str
    profile_url: str


@router.get("/auth/github")
def github_auth(token: Optional[str] = None):
    """
    Redirige l'utilisateur vers la mire d'autorisation GitHub OAuth2.
    """
    client_id = settings.GITHUB_CLIENT_ID or os.getenv("GITHUB_CLIENT_ID")
    if not client_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GITHUB_CLIENT_ID n'est pas configuré sur le serveur. Utilisez la connexion directe par Personal Access Token (PAT).",
        )

    base_url = settings.BASE_URL or os.getenv("BASE_URL", "http://localhost:8080")
    return_url = f"{base_url}/api/v1/auth/github/callback"

    params = {
        "client_id": client_id,
        "redirect_uri": return_url,
        "scope": "read:user repo",
        "state": token or "",
    }
    redirect_url = f"{GITHUB_OAUTH_AUTHORIZE_URL}?{urllib.parse.urlencode(params)}"
    return RedirectResponse(url=redirect_url)


@router.get("/auth/github/callback")
async def github_callback(
    request: Request,
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Reçoit le code d'autorisation retourné par GitHub, l'échange contre un jeton
    d'accès, récupère les données de profil et lie le service au compte utilisateur.
    """
    frontend_url = settings.FRONTEND_URL or os.getenv("FRONTEND_URL", "http://localhost:3000")

    if error or not code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Authentification GitHub annulée ou invalide : {error or 'Code manquant'}",
        )

    client_id = settings.GITHUB_CLIENT_ID or os.getenv("GITHUB_CLIENT_ID")
    client_secret = (
        settings.GITHUB_CLIENT_SECRET
        or os.getenv("GITHUB_CLIENT_SECRET")
        or settings.GITHUB_API_KEY
        or os.getenv("GITHUB_API_KEY")
    )

    if not client_id or not client_secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Identifiants client GitHub (CLIENT_ID / CLIENT_SECRET) non configurés.",
        )

    async with httpx.AsyncClient(timeout=10.0) as client:
        token_resp = await client.post(
            GITHUB_OAUTH_TOKEN_URL,
            data={
                "client_id": client_id,
                "client_secret": client_secret,
                "code": code,
            },
            headers={"Accept": "application/json"},
        )

        if token_resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Erreur lors de l'échange du code avec l'API GitHub.",
            )

        token_data = token_resp.json()
        access_token = token_data.get("access_token")
        if not access_token:
            error_desc = token_data.get("error_description", "Échec de l'obtention du token GitHub.")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=error_desc,
            )

        # Récupération des informations de profil
        try:
            profile_data = await fetch_github_user_profile(access_token)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Impossible de charger le profil GitHub : {e}",
            )

        # Association à l'utilisateur connecté
        user = resolve_user_from_request(db, request, token=state)
        if user:
            try:
                link_user_service(
                    db=db,
                    user_id=user.id,
                    service_name="github",
                    access_token=access_token,
                    credentials=profile_data,
                    service_display_name="GitHub",
                    service_description="Service GitHub Développeur",
                    service_auth_type="oauth2",
                )
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Erreur lors de l'enregistrement du compte GitHub : {e}",
                )

        accept_header = request.headers.get("accept", "")
        if "application/json" in accept_header:
            return GithubProfileResponse(
                github_id=profile_data["github_id"],
                login=profile_data["login"],
                username=profile_data["username"],
                avatar=profile_data["avatar"],
                profile_url=profile_data["profile_url"],
            )

        return RedirectResponse(url=f"{frontend_url}/?tab=settings&github=connected")


@router.post("/auth/github/token")
async def github_connect_token(
    payload: GithubTokenConnect,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Connecte et lie le compte GitHub de l'utilisateur directement via un
    Personal Access Token (PAT) ou une clé API GitHub.
    """
    token_str = payload.token.strip()
    if not token_str:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le jeton GitHub ne peut pas être vide.",
        )

    try:
        profile_data = await fetch_github_user_profile(token_str)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Erreur lors de la vérification du token GitHub : {e}",
        )

    try:
        link_user_service(
            db=db,
            user_id=current_user.id,
            service_name="github",
            access_token=token_str,
            credentials=profile_data,
            service_display_name="GitHub",
            service_description="Service GitHub Développeur",
            service_auth_type="api_key",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de l'enregistrement de l'intégration GitHub : {e}",
        )

    return {
        "message": "Compte GitHub connecté avec succès.",
        "profile": profile_data,
    }


@router.get("/auth/github/status")
def github_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retourne le statut actuel de l'intégration GitHub pour l'utilisateur connecté.
    """
    return get_user_service_status(db=db, user_id=current_user.id, service_name="github")


@router.post("/auth/github/disconnect")
def github_disconnect(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Déconnecte le compte GitHub de l'utilisateur.
    """
    unlinked = unlink_user_service(db=db, user_id=current_user.id, service_name="github")
    if unlinked:
        return {"message": "Compte GitHub déconnecté avec succès."}
    return {"message": "Aucun compte GitHub lié à déconnecter."}


def _get_github_access_token(db: Session, user_id: int) -> str:
    service = db.query(Service).filter(Service.name == "github").first()
    if not service:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le service GitHub n'est pas configuré.",
        )

    user_service = db.query(UserService).filter(
        UserService.user_id == user_id,
        UserService.service_id == service.id,
        UserService.is_connected == True,
    ).first()

    if not user_service or not user_service.access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Veuillez connecter votre compte GitHub dans vos Paramètres pour accéder aux métriques GitHub.",
        )
    return user_service.access_token


@router.get("/auth/github/user/stats")
@router.get("/github/user/stats")
async def github_user_stats(
    force_refresh: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retourne les statistiques GitHub (profil, dépôts récents, étoiles totales, orgs)
    pour l'utilisateur connecté.
    """
    token = _get_github_access_token(db, current_user.id)
    try:
        stats = await fetch_github_user_stats(token=token, force_refresh=force_refresh)
        return stats
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Erreur données GitHub : {e}")


@router.get("/auth/github/user/orgs")
async def github_user_orgs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retourne la liste des organisations dont l'utilisateur est membre.
    """
    token = _get_github_access_token(db, current_user.id)
    try:
        orgs = await fetch_github_user_orgs(token)
        return orgs
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Erreur API GitHub : {e}")


@router.get("/auth/github/orgs/{org}/stats")
async def github_org_stats(
    org: str,
    force_refresh: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retourne les statistiques détaillées d'une organisation ciblée.
    """
    token = _get_github_access_token(db, current_user.id)
    try:
        stats = await fetch_github_org_stats(token=token, org=org, force_refresh=force_refresh)
        return stats
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Erreur organisation GitHub : {e}")


@router.get("/auth/github/repos/{owner}/{repo}/stats")
async def github_repo_stats(
    owner: str,
    repo: str,
    force_refresh: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retourne les statistiques détaillées d'un dépôt ciblé.
    """
    token = _get_github_access_token(db, current_user.id)
    try:
        stats = await fetch_github_repo_stats(token=token, owner=owner, repo=repo, force_refresh=force_refresh)
        return stats
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Erreur dépôt GitHub : {e}")


