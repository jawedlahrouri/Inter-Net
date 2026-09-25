import time
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_admin, get_db
from app.core.security import get_password_hash
from app.models.user import User
from app.schemas.admin import (
    AdminDashboardCreate,
    AdminDashboardDetail,
    AdminDashboardSummary,
    AdminDashboardUpdate,
    AdminStats,
    AdminUserCreate,
    AdminUserDetail,
    AdminUserSummary,
    AdminUserUpdate,
)
from app.schemas.widget import UserWidgetCreate, UserWidgetOut, UserWidgetUpdate
from app.services.widget_storage import JsonWidgetStorage, get_user_file_path

router = APIRouter()


def _get_user_dashboards(user: User) -> List[Dict[str, Any]]:
    settings_dict = user.settings or {}
    dashboards = settings_dict.get("dashboards")
    if not dashboards or not isinstance(dashboards, list):
        return [
            {
                "id": "default",
                "name": "Général",
                "primary_color": "#0b0f19",
                "secondary_color": "#131b2e",
                "tertiary_color": "#38bdf8",
                "background_image": None,
            }
        ]
    return dashboards


@router.get("/stats", response_model=AdminStats)
def get_admin_stats(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_admin),
):
    users = db.query(User).all()
    total_users = len(users)
    total_admins = sum(1 for u in users if u.role == "admin")

    total_dashboards = 0
    total_widgets = 0

    for u in users:
        dashboards = _get_user_dashboards(u)
        total_dashboards += len(dashboards)
        widgets = JsonWidgetStorage.load_user_widgets(u.id)
        total_widgets += len(widgets)

    return AdminStats(
        total_users=total_users,
        total_admins=total_admins,
        total_dashboards=total_dashboards,
        total_widgets=total_widgets,
    )


@router.get("/users", response_model=List[AdminUserSummary])
def list_users(
    q: Optional[str] = Query(default=None, description="Recherche par pseudo ou email"),
    role: Optional[str] = Query(default=None, description="Filtrer par rôle"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_admin),
):
    query = db.query(User)
    if role and role in ["user", "admin"]:
        query = query.filter(User.role == role)
    if q:
        search = f"%{q}%"
        query = query.filter((User.username.ilike(search)) | (User.email.ilike(search)))

    users = query.order_by(User.id.asc()).all()
    result: List[AdminUserSummary] = []

    for u in users:
        dashboards = _get_user_dashboards(u)
        widgets = JsonWidgetStorage.load_user_widgets(u.id)
        result.append(
            AdminUserSummary(
                id=u.id,
                email=u.email,
                username=u.username,
                role=u.role,
                created_at=u.created_at,
                dashboards_count=len(dashboards),
                widgets_count=len(widgets),
            )
        )

    return result


@router.get("/users/{user_id}", response_model=AdminUserDetail)
def get_user_detail(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur introuvable",
        )

    dashboards = _get_user_dashboards(user)
    widgets = JsonWidgetStorage.load_user_widgets(user.id)

    return AdminUserDetail(
        id=user.id,
        email=user.email,
        username=user.username,
        role=user.role,
        created_at=user.created_at,
        updated_at=user.updated_at,
        dashboards=dashboards,
        widgets=widgets,
    )


@router.post("/users", response_model=AdminUserDetail, status_code=status.HTTP_201_CREATED)
def create_user(
    user_in: AdminUserCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_admin),
):
    if db.query(User).filter(User.email == user_in.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cet email est déjà utilisé.",
        )
    if db.query(User).filter(User.username == user_in.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ce nom d'utilisateur est déjà utilisé.",
        )

    hashed_pw = get_password_hash(user_in.password)
    user = User(
        email=user_in.email,
        username=user_in.username,
        password_hash=hashed_pw,
        role=user_in.role,
        settings={
            "dashboards": [
                {
                    "id": "default",
                    "name": "Général",
                    "primary_color": "#0b0f19",
                    "secondary_color": "#131b2e",
                    "tertiary_color": "#38bdf8",
                    "background_image": None,
                }
            ]
        },
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    widgets = JsonWidgetStorage.load_user_widgets(user.id)
    dashboards = _get_user_dashboards(user)

    return AdminUserDetail(
        id=user.id,
        email=user.email,
        username=user.username,
        role=user.role,
        created_at=user.created_at,
        updated_at=user.updated_at,
        dashboards=dashboards,
        widgets=widgets,
    )


@router.put("/users/{user_id}", response_model=AdminUserDetail)
def update_user(
    user_id: int,
    user_in: AdminUserUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_active_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur introuvable",
        )

    if user_in.email and user_in.email != user.email:
        if db.query(User).filter(User.email == user_in.email).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cet email est déjà utilisé.",
            )
        user.email = user_in.email

    if user_in.username and user_in.username != user.username:
        if db.query(User).filter(User.username == user_in.username).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ce nom d'utilisateur est déjà utilisé.",
            )
        user.username = user_in.username

    if user_in.role:
        if user.id == admin_user.id and user_in.role != "admin":
            admin_count = db.query(User).filter(User.role == "admin").count()
            if admin_count <= 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Impossible de révoquer vos propres droits administrateur (seul admin restant).",
                )
        user.role = user_in.role

    if user_in.password:
        user.password_hash = get_password_hash(user_in.password)

    db.commit()
    db.refresh(user)

    dashboards = _get_user_dashboards(user)
    widgets = JsonWidgetStorage.load_user_widgets(user.id)

    return AdminUserDetail(
        id=user.id,
        email=user.email,
        username=user.username,
        role=user.role,
        created_at=user.created_at,
        updated_at=user.updated_at,
        dashboards=dashboards,
        widgets=widgets,
    )


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_active_admin),
):
    if user_id == admin_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vous ne pouvez pas supprimer votre propre compte administrateur.",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur introuvable",
        )

    # Suppression du fichier JSON de stockage des widgets
    widget_file = get_user_file_path(user_id)
    if widget_file.exists():
        try:
            widget_file.unlink()
        except OSError:
            pass

    db.delete(user)
    db.commit()

    return {"message": "Utilisateur et données associées supprimés avec succès", "id": user_id}


@router.get("/dashboards", response_model=List[AdminDashboardSummary])
def list_all_dashboards(
    user_id: Optional[int] = Query(default=None, description="Filtrer par ID utilisateur"),
    q: Optional[str] = Query(default=None, description="Recherche par nom ou propriétaire"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_admin),
):
    query = db.query(User)
    if user_id:
        query = query.filter(User.id == user_id)
    users = query.all()

    results: List[AdminDashboardSummary] = []
    search = q.lower() if q else None

    for u in users:
        dashboards = _get_user_dashboards(u)
        widgets = JsonWidgetStorage.load_user_widgets(u.id)

        for d in dashboards:
            d_id = str(d.get("id", "default"))
            d_name = d.get("name", "Général")

            if search:
                matches_name = search in d_name.lower()
                matches_user = search in u.username.lower() or search in u.email.lower()
                if not matches_name and not matches_user:
                    continue

            # Comptage des widgets rattachés à ce dashboard
            count = sum(
                1 for w in widgets
                if (w.get("params_values") or {}).get("dashboardId", "default") == d_id
            )

            results.append(
                AdminDashboardSummary(
                    dashboard_id=d_id,
                    user_id=u.id,
                    user_username=u.username,
                    user_email=u.email,
                    name=d_name,
                    primary_color=d.get("primary_color") or "#0b0f19",
                    secondary_color=d.get("secondary_color") or "#131b2e",
                    tertiary_color=d.get("tertiary_color") or "#38bdf8",
                    background_image=d.get("background_image"),
                    widgets_count=count,
                )
            )

    return results


@router.get("/users/{user_id}/dashboards/{dashboard_id}", response_model=AdminDashboardDetail)
def get_user_dashboard_detail(
    user_id: int,
    dashboard_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur introuvable",
        )

    dashboards = _get_user_dashboards(user)
    target_dash = next((d for d in dashboards if str(d.get("id")) == dashboard_id), None)
    if not target_dash:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tableau de bord introuvable pour cet utilisateur",
        )

    widgets = JsonWidgetStorage.load_user_widgets(user.id)
    dash_widgets = [
        w for w in widgets
        if (w.get("params_values") or {}).get("dashboardId", "default") == dashboard_id
    ]

    return AdminDashboardDetail(
        dashboard_id=dashboard_id,
        user_id=user.id,
        user_username=user.username,
        user_email=user.email,
        name=target_dash.get("name", "Tableau de bord"),
        primary_color=target_dash.get("primary_color") or "#0b0f19",
        secondary_color=target_dash.get("secondary_color") or "#131b2e",
        tertiary_color=target_dash.get("tertiary_color") or "#38bdf8",
        background_image=target_dash.get("background_image"),
        widgets=dash_widgets,
    )


@router.post("/users/{user_id}/dashboards", response_model=AdminDashboardDetail, status_code=status.HTTP_201_CREATED)
def create_user_dashboard(
    user_id: int,
    dash_in: AdminDashboardCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur introuvable",
        )

    settings_dict = dict(user.settings or {})
    dashboards = list(settings_dict.get("dashboards") or [])
    if not dashboards:
        dashboards = [
            {
                "id": "default",
                "name": "Général",
                "primary_color": "#0b0f19",
                "secondary_color": "#131b2e",
                "tertiary_color": "#38bdf8",
                "background_image": None,
            }
        ]

    new_id = f"dash-{int(time.time() * 1000)}"
    new_dash = {
        "id": new_id,
        "name": dash_in.name,
        "primary_color": dash_in.primary_color or "#0b0f19",
        "secondary_color": dash_in.secondary_color or "#131b2e",
        "tertiary_color": dash_in.tertiary_color or "#38bdf8",
        "background_image": dash_in.background_image,
    }

    dashboards.append(new_dash)
    settings_dict["dashboards"] = dashboards
    user.settings = settings_dict
    db.commit()

    return AdminDashboardDetail(
        dashboard_id=new_id,
        user_id=user.id,
        user_username=user.username,
        user_email=user.email,
        name=new_dash["name"],
        primary_color=new_dash["primary_color"],
        secondary_color=new_dash["secondary_color"],
        tertiary_color=new_dash["tertiary_color"],
        background_image=new_dash["background_image"],
        widgets=[],
    )


@router.put("/users/{user_id}/dashboards/{dashboard_id}", response_model=AdminDashboardDetail)
def update_user_dashboard(
    user_id: int,
    dashboard_id: str,
    dash_in: AdminDashboardUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur introuvable",
        )

    settings_dict = dict(user.settings or {})
    dashboards = list(settings_dict.get("dashboards") or _get_user_dashboards(user))
    dash_idx = next((i for i, d in enumerate(dashboards) if str(d.get("id")) == dashboard_id), None)

    if dash_idx is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tableau de bord introuvable",
        )

    target = dict(dashboards[dash_idx])
    if dash_in.name is not None:
        target["name"] = dash_in.name
    if dash_in.primary_color is not None:
        target["primary_color"] = dash_in.primary_color
    if dash_in.secondary_color is not None:
        target["secondary_color"] = dash_in.secondary_color
    if dash_in.tertiary_color is not None:
        target["tertiary_color"] = dash_in.tertiary_color
    if dash_in.background_image is not None:
        target["background_image"] = dash_in.background_image

    dashboards[dash_idx] = target
    settings_dict["dashboards"] = dashboards
    user.settings = settings_dict
    db.commit()

    widgets = JsonWidgetStorage.load_user_widgets(user.id)
    dash_widgets = [
        w for w in widgets
        if (w.get("params_values") or {}).get("dashboardId", "default") == dashboard_id
    ]

    return AdminDashboardDetail(
        dashboard_id=dashboard_id,
        user_id=user.id,
        user_username=user.username,
        user_email=user.email,
        name=target.get("name", "Tableau de bord"),
        primary_color=target.get("primary_color"),
        secondary_color=target.get("secondary_color"),
        tertiary_color=target.get("tertiary_color"),
        background_image=target.get("background_image"),
        widgets=dash_widgets,
    )


@router.delete("/users/{user_id}/dashboards/{dashboard_id}")
def delete_user_dashboard(
    user_id: int,
    dashboard_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur introuvable",
        )

    if dashboard_id == "default":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le tableau de bord principal par défaut ne peut pas être supprimé.",
        )

    settings_dict = dict(user.settings or {})
    dashboards = list(settings_dict.get("dashboards") or _get_user_dashboards(user))
    filtered = [d for d in dashboards if str(d.get("id")) != dashboard_id]

    if len(filtered) == len(dashboards):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tableau de bord introuvable",
        )

    settings_dict["dashboards"] = filtered
    user.settings = settings_dict
    db.commit()

    # Nettoyage des widgets rattachés à ce dashboard
    widgets = JsonWidgetStorage.load_user_widgets(user.id)
    remaining_widgets = [
        w for w in widgets
        if (w.get("params_values") or {}).get("dashboardId", "default") != dashboard_id
    ]
    JsonWidgetStorage.save_user_widgets(user.id, remaining_widgets)

    return {"message": "Tableau de bord supprimé avec succès", "dashboard_id": dashboard_id}


@router.post("/users/{user_id}/widgets", response_model=UserWidgetOut, status_code=status.HTTP_201_CREATED)
def admin_create_user_widget(
    user_id: int,
    widget_in: UserWidgetCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur introuvable",
        )
    return JsonWidgetStorage.create_widget(user_id, widget_in)


@router.put("/users/{user_id}/widgets/{widget_id}", response_model=UserWidgetOut)
def admin_update_user_widget(
    user_id: int,
    widget_id: int,
    widget_in: UserWidgetUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur introuvable",
        )
    return JsonWidgetStorage.update_widget(user_id, widget_id, widget_in)


@router.delete("/users/{user_id}/widgets/{widget_id}")
def admin_delete_user_widget(
    user_id: int,
    widget_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur introuvable",
        )
    return JsonWidgetStorage.delete_widget(user_id, widget_id)
