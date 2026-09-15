from typing import List
from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.widget import (
    UserWidgetCreate,
    UserWidgetOut,
    UserWidgetUpdate,
    WidgetDefinitionOut,
    WidgetDeleteResponse,
)
from app.services.widget_storage import JsonWidgetStorage

router = APIRouter()

STANDARD_DEFINITIONS = [
    WidgetDefinitionOut(
        id=1,
        service_id=1,
        name="city_temperature",
        display_name="Météo",
        description="Température pour une ville",
        params_schema=[{"name": "city", "type": "string"}],
    ),
    WidgetDefinitionOut(
        id=2,
        service_id=2,
        name="article_list",
        display_name="Flux RSS",
        description="Articles RSS",
        params_schema=[
            {"name": "link", "type": "string"},
            {"name": "number", "type": "integer"},
        ],
    ),
    WidgetDefinitionOut(
        id=3,
        service_id=3,
        name="custom_api",
        display_name="API JSON Universelle",
        description="Métrique issue d'une API",
        params_schema=[
            {"name": "apiUrl", "type": "string"},
            {"name": "jsonPath", "type": "string"},
        ],
    ),
    WidgetDefinitionOut(
        id=4,
        service_id=4,
        name="shortcut",
        display_name="Raccourci Web",
        description="Lien externe",
        params_schema=[{"name": "url", "type": "string"}],
    ),
]


@router.get("/definitions", response_model=List[WidgetDefinitionOut])
def get_widget_definitions(
    current_user: User = Depends(get_current_user),
):
    return STANDARD_DEFINITIONS


@router.get("", response_model=List[UserWidgetOut])
def list_user_widgets(
    current_user: User = Depends(get_current_user),
):
    return JsonWidgetStorage.load_user_widgets(current_user.id)


@router.post("", response_model=UserWidgetOut, status_code=201)
def create_user_widget(
    widget_in: UserWidgetCreate,
    current_user: User = Depends(get_current_user),
):
    return JsonWidgetStorage.create_widget(current_user.id, widget_in)


@router.put("/{widget_id}", response_model=UserWidgetOut)
def update_user_widget(
    widget_id: int,
    widget_in: UserWidgetUpdate,
    current_user: User = Depends(get_current_user),
):
    return JsonWidgetStorage.update_widget(current_user.id, widget_id, widget_in)


@router.delete("/{widget_id}", response_model=WidgetDeleteResponse)
def delete_user_widget(
    widget_id: int,
    current_user: User = Depends(get_current_user),
):
    return JsonWidgetStorage.delete_widget(current_user.id, widget_id)
