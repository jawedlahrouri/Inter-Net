import secrets
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.core.config import settings
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.user import User
from app.models.widget import UserWidget, WidgetDefinition
from app.schemas.user import (
    UserCreate,
    UserLogin,
    UserResponse,
    Token,
    RegisterResponse,
    VerifyEmailRequest,
    VerifyEmailResponse,
    ResendVerificationRequest,
)
from app.schemas.settings import UserSettings, UserSettingsUpdate
from app.services.mail_service import MailService

router = APIRouter()


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing_email = db.query(User).filter(User.email == user_in.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cet email est déjà associé à un compte.",
        )
    existing_username = db.query(User).filter(User.username == user_in.username).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ce nom d'utilisateur est déjà pris.",
        )
    hashed_password = get_password_hash(user_in.password)
    verification_token = secrets.token_urlsafe(32)
    user = User(
        email=user_in.email,
        username=user_in.username,
        password_hash=hashed_password,
        role="user",
        is_verified=False,
        verification_token=verification_token,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    weather_def = db.query(WidgetDefinition).filter(WidgetDefinition.name == "city_temperature").first()
    if weather_def:
        db.add(UserWidget(
            user_id=user.id,
            widget_id=weather_def.id,
            title="Météo locale",
            params_values={"city": "Paris"},
            refresh_rate=60,
        ))
    custom_def = db.query(WidgetDefinition).filter(WidgetDefinition.name == "custom_api").first()
    if custom_def:
        db.add(UserWidget(
            user_id=user.id,
            widget_id=custom_def.id,
            title="Statut API Backend",
            params_values={
                "apiUrl": "http://127.0.0.1:8000/api/v1/health",
                "jsonPath": "status",
                "displayMode": "kpi",
            },
            refresh_rate=15,
        ))
    db.commit()

    await MailService.send_verification_email(user.email, user.username, verification_token)
    return RegisterResponse(
        message="Compte créé avec succès. Veuillez vérifier votre boîte email pour activer votre compte avant de vous connecter.",
        email=user.email,
        username=user.username,
        is_verified=False,
    )


@router.post("/verify-email", response_model=VerifyEmailResponse)
def verify_email(data: VerifyEmailRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.verification_token == data.token).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Jeton de confirmation invalide ou expiré.",
        )

    user.is_verified = True
    user.verification_token = None
    db.commit()
    return VerifyEmailResponse(
        message="Votre compte a été confirmé avec succès. Vous pouvez maintenant vous connecter.",
        is_verified=True,
        email=user.email,
    )


@router.get("/verify-email")
def verify_email_get(token: str = Query(..., description="Jeton de vérification"), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.verification_token == token).first()
    if not user:
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/verify-email?error=invalid",
            status_code=status.HTTP_303_SEE_OTHER,
        )

    user.is_verified = True
    user.verification_token = None
    db.commit()
    return RedirectResponse(
        url=f"{settings.FRONTEND_URL}/verify-email?verified=true&email={user.email}",
        status_code=status.HTTP_303_SEE_OTHER,
    )


@router.post("/resend-verification")
async def resend_verification(data: ResendVerificationRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if user and not user.is_verified:
        new_token = secrets.token_urlsafe(32)
        user.verification_token = new_token
        db.commit()
        await MailService.send_verification_email(user.email, user.username, new_token)

    return {"message": "Si un compte non activé existe avec cette adresse email, un nouvel email de confirmation a été envoyé."}


@router.post("/login", response_model=Token)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        (User.email == login_in.identifier) | (User.username == login_in.identifier)
    ).first()

    if not user or not verify_password(login_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Identifiants incorrects.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Votre compte n'est pas encore activé. Veuillez cliquer sur le bouton dans le mail de confirmation reçu pour valider votre compte.",
        )

    access_token = create_access_token(subject=user.id)
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.get("/me/settings", response_model=UserSettings)
def get_user_settings(current_user: User = Depends(get_current_user)):
    user_settings = current_user.settings or {}
    return UserSettings.model_validate(user_settings)


@router.patch("/me/settings", response_model=UserSettings)
def update_user_settings(
    settings_in: UserSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current = current_user.settings or {}
    updated_dict = dict(current)

    if settings_in.meditation is not None:
        med_current = dict(updated_dict.get("meditation", {}))
        med_updates = settings_in.meditation.model_dump(exclude_unset=True)
        med_current.update(med_updates)
        updated_dict["meditation"] = med_current

    if settings_in.dashboards is not None:
        updated_dict["dashboards"] = [d.model_dump() for d in settings_in.dashboards]

    if settings_in.customization is not None:
        custom_current = dict(updated_dict.get("customization", {}))
        custom_updates = settings_in.customization.model_dump(exclude_unset=True)
        custom_current.update(custom_updates)
        updated_dict["customization"] = custom_current

    current_user.settings = updated_dict
    db.commit()
    db.refresh(current_user)
    return UserSettings.model_validate(current_user.settings or {})

