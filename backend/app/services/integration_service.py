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
    """
    @brief Looks up a service by name and creates and persists it as active if it does not exist.
    @param db SQLAlchemy database session.
    @param name Unique internal name of the service.
    @param display_name Display name used when creating the service.
    @param description Description used when creating the service.
    @param auth_type Authentication type used when creating the service.
    @param icon Icon identifier used when creating the service.
    @return The existing or newly created Service record.
    """
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
    @brief Resolves the current user from a JWT found in the argument, query string or Bearer header, falling back to the first user.
    @param db SQLAlchemy database session.
    @param request Incoming FastAPI request carrying the token in its query or headers.
    @param token Optional explicit JWT that takes precedence over the request.
    @return The matching User, otherwise the first user in the database, or None if there are no users.
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
    @brief Creates or updates the link between a user and a service with its tokens and credentials, marking it connected.
    @param db SQLAlchemy database session.
    @param user_id Identifier of the user linking the service.
    @param service_name Internal name of the service.
    @param access_token Access token to store for the link.
    @param credentials Optional credentials or profile data to store.
    @param refresh_token Optional refresh token to store.
    @param token_expires_at Optional expiry datetime of the access token.
    @param service_display_name Optional display name used if the service must be created.
    @param service_description Description used if the service must be created.
    @param service_auth_type Authentication type used if the service must be created.
    @return The saved UserService record.
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
    """
    @brief Returns whether a user is connected to a service and, if so, the stored token and profile data.
    @param db SQLAlchemy database session.
    @param user_id Identifier of the user.
    @param service_name Internal name of the service.
    @return A dictionary with connected false, or connected true plus access_token, credentials, profile and connected_at.
    """
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
    """
    @brief Marks a user's link to a service as disconnected.
    @param db SQLAlchemy database session.
    @param user_id Identifier of the user.
    @param service_name Internal name of the service.
    @return True if a link was found and disconnected, otherwise False.
    """
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

