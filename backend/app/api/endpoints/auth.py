from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.user import User
from app.models.widget import UserWidget, WidgetDefinition
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token
from app.schemas.settings import UserSettings, UserSettingsUpdate

router = APIRouter()



@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """
    @brief Registers a new user after checking email and username uniqueness, creates default widgets and issues an access token.
    @param user_in The registration payload with email, username and password.
    @param db The SQLAlchemy database session.
    @return A Token containing the bearer access token and the created user.
    """
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
    user = User(
        email=user_in.email,
        username=user_in.username,
        password_hash=hashed_password,
        role="user",
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


    access_token = create_access_token(subject=user.id)
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=Token)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    """
    @brief Authenticates a user by email or username and password and issues an access token.
    @param login_in The login payload with the identifier and password.
    @param db The SQLAlchemy database session.
    @return A Token containing the bearer access token and the authenticated user.
    """
    user = db.query(User).filter(
        (User.email == login_in.identifier) | (User.username == login_in.identifier)
    ).first()

    if not user or not verify_password(login_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Identifiants incorrects.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(subject=user.id)
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """
    @brief Returns the profile of the currently authenticated user.
    @param current_user The authenticated user resolved from the bearer token.
    @return The current user serialized as a UserResponse.
    """
    return UserResponse.model_validate(current_user)


@router.get("/me/settings", response_model=UserSettings)
def get_user_settings(current_user: User = Depends(get_current_user)):
    """
    @brief Returns the stored settings of the currently authenticated user.
    @param current_user The authenticated user resolved from the bearer token.
    @return The user's settings validated as a UserSettings object, empty defaults if none are stored.
    """
    user_settings = current_user.settings or {}
    return UserSettings.model_validate(user_settings)


@router.patch("/me/settings", response_model=UserSettings)
def update_user_settings(
    settings_in: UserSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    @brief Merges partial meditation, dashboards and customization updates into the user's stored settings and saves them.
    @param settings_in The partial settings update sent by the client.
    @param current_user The authenticated user resolved from the bearer token.
    @param db The SQLAlchemy database session.
    @return The updated settings validated as a UserSettings object.
    """
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

