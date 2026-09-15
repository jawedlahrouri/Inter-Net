from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.widget import UserWidget, WidgetDefinition
from app.schemas.widget import (
    UserWidgetCreate,
    UserWidgetOut,
    UserWidgetUpdate,
    WidgetDefinitionOut,
    WidgetDeleteResponse,
)

router = APIRouter()


@router.get("/definitions", response_model=List[WidgetDefinitionOut])
def get_widget_definitions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(WidgetDefinition).all()


@router.get("", response_model=List[UserWidgetOut])
def list_user_widgets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(UserWidget)
        .options(joinedload(UserWidget.widget_def))
        .filter(UserWidget.user_id == current_user.id)
        .order_by(UserWidget.id.asc())
        .all()
    )


@router.post("", response_model=UserWidgetOut, status_code=status.HTTP_201_CREATED)
def create_user_widget(
    widget_in: UserWidgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    definition = None
    if widget_in.widget_id:
        definition = (
            db.query(WidgetDefinition)
            .filter(WidgetDefinition.id == widget_in.widget_id)
            .first()
        )
    
    # Résolution automatique par type de widget si l'ID n'est pas fourni
    if not definition and widget_in.type:
        type_mapping = {
            "weather": "city_temperature",
            "city_temperature": "city_temperature",
            "custom_api": "custom_api",
            "default": "shortcut",
            "shortcut": "shortcut",
            "rss": "article_list",
            "article_list": "article_list",
        }
        def_name = type_mapping.get(widget_in.type, widget_in.type)
        definition = (
            db.query(WidgetDefinition)
            .filter(WidgetDefinition.name == def_name)
            .first()
        )

    if not definition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Définition de widget introuvable",
        )

    widget = UserWidget(
        user_id=current_user.id,
        widget_id=definition.id,
        title=widget_in.title or definition.display_name,
        params_values=widget_in.params_values,
        refresh_rate=widget_in.refresh_rate,
        position_x=widget_in.position_x,
        position_y=widget_in.position_y,
        width=widget_in.width,
        height=widget_in.height,
    )
    db.add(widget)
    db.commit()
    db.refresh(widget)
    return widget


@router.put("/{widget_id}", response_model=UserWidgetOut)
def update_user_widget(
    widget_id: int,
    widget_in: UserWidgetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    widget = db.query(UserWidget).filter(UserWidget.id == widget_id).first()
    if not widget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Widget introuvable",
        )

    if widget.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'avez pas l'autorisation de modifier ce widget",
        )

    if widget_in.title is not None:
        widget.title = widget_in.title
    if widget_in.params_values is not None:
        merged = dict(widget.params_values or {})
        merged.update(widget_in.params_values)
        widget.params_values = merged
    if widget_in.refresh_rate is not None:
        widget.refresh_rate = widget_in.refresh_rate
    if widget_in.position_x is not None:
        widget.position_x = widget_in.position_x
    if widget_in.position_y is not None:
        widget.position_y = widget_in.position_y
    if widget_in.width is not None:
        widget.width = widget_in.width
    if widget_in.height is not None:
        widget.height = widget_in.height

    db.commit()
    db.refresh(widget)
    return widget



@router.delete("/{widget_id}", response_model=WidgetDeleteResponse)
def delete_user_widget(
    widget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    widget = db.query(UserWidget).filter(UserWidget.id == widget_id).first()
    if not widget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Widget introuvable",
        )

    # Vérifie l'appartenance pour interdire la suppression des widgets d'autres utilisateurs
    if widget.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'avez pas l'autorisation de supprimer ce widget",
        )

    db.delete(widget)
    db.commit()
    return WidgetDeleteResponse(
        message="Widget supprimé avec succès",
        id=widget_id,
    )
