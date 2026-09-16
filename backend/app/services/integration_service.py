from datetime import datetime
from typing import Optional, Any, Dict
from fastapi import Request
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.models.service import Service, UserService
from app.models.user import User


def get_or_create_service(
    db: Session,
    name: str,
    display_name: str,
    description: str = "",
    auth_type: str = "oauth2",
    icon: str = "",
) -> Service:
    """Récupère un service par son nom (ex: 'steam', 'github') ou le crée s'il n'existe pas encore."""
    service = db.query(Service).filter(Service.name == name).first()
    if not service:
        service = Service(
            name=name,
            display_name=display_name,
            description=description,
            auth_type=auth_type,
            icon=icon,
            is_active=True,
        )
        db.add(service)
        db.commit()
        db.refresh(service)
    return service


def resolve_user_from_request(
    db: Session,
    request: Request,
    token: Optional[str] = None,
) -> Optional[User]:
    """
    Extrait et valide l'utilisateur à partir d'un paramètre ?token=...,
    d'un header Authorization Bearer, ou fallback en développement.
    """
    jwt_token = token or request.query_params.get("token")
    auth_header = request.headers.get("Authorization")
    if not jwt_token and auth_header and auth_header.startswith("Bearer "):
        jwt_token = auth_header.split(" ")[1]

    if jwt_token:
        payload = decode_access_token(jwt_token)
        if payload and payload.get("sub"):
            user = db.query(User).filter(User.id == int(payload["sub"])).first()
            if user:
                return user

    # Fallback pour faciliter les tests et le dev local
    return db.query(User).first()


def link_user_service(
    db: Session,
    user_id: int,
    service_name: str,
    access_token: str,
    credentials: Optional[Dict[str, Any]] = None,
    refresh_token: Optional[str] = None,
    token_expires_at: Optional[datetime] = None,
    service_display_name: Optional[str] = None,
    service_description: str = "",
    service_auth_type: str = "oauth2",
) -> UserService:
    """
    Associe ou met à jour les identifiants d'un service externe (Steam, GitHub, Spotify, etc.)
    dans la table user_services pour l'utilisateur spécifié.
    """
    try:
        service = get_or_create_service(
            db=db,
            name=service_name,
            display_name=service_display_name or service_name.capitalize(),
            description=service_description,
            auth_type=service_auth_type,
        )

        user_service = db.query(UserService).filter(
            UserService.user_id == user_id,
            UserService.service_id == service.id,
        ).first()

        if not user_service:
            user_service = UserService(
                user_id=user_id,
                service_id=service.id,
                access_token=access_token,
                refresh_token=refresh_token,
                token_expires_at=token_expires_at,
                credentials=credentials or {},
                is_connected=True,
                connected_at=datetime.utcnow(),
            )
            db.add(user_service)
        else:
            user_service.access_token = access_token
            if refresh_token:
                user_service.refresh_token = refresh_token
            if token_expires_at:
                user_service.token_expires_at = token_expires_at
            if credentials is not None:
                user_service.credentials = credentials
            user_service.is_connected = True
            user_service.connected_at = datetime.utcnow()

        db.commit()
        db.refresh(user_service)
        return user_service
    except Exception as e:
        db.rollback()
        raise e


def get_user_service_status(
    db: Session,
    user_id: int,
    service_name: str,
) -> Dict[str, Any]:
    """Vérifie si un service donné est actuellement connecté pour cet utilisateur."""
    service = db.query(Service).filter(Service.name == service_name).first()
    if not service:
        return {"connected": False}

    user_service = db.query(UserService).filter(
        UserService.user_id == user_id,
        UserService.service_id == service.id,
        UserService.is_connected == True,
    ).first()

    if not user_service:
        return {"connected": False}

    return {
        "connected": True,
        "access_token": user_service.access_token,
        "credentials": user_service.credentials,
        "profile": user_service.credentials,
        "connected_at": user_service.connected_at.isoformat() if user_service.connected_at else None,
    }


def unlink_user_service(
    db: Session,
    user_id: int,
    service_name: str,
) -> bool:
    """Déconnecte un service pour un utilisateur."""
    try:
        service = db.query(Service).filter(Service.name == service_name).first()
        if not service:
            return False

        user_service = db.query(UserService).filter(
            UserService.user_id == user_id,
            UserService.service_id == service.id,
        ).first()

        if user_service:
            user_service.is_connected = False
            db.commit()
            return True

        return False
    except Exception as e:
        db.rollback()
        raise e

