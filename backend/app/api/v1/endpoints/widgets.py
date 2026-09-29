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
    WidgetDefinitionOut(
        id=5,
        service_id=5,
        name="steam",
        display_name="Steam",
        description="Statistiques et métriques de profil Steam",
        params_schema=[{"name": "steamMetric", "type": "string"}],
    ),
    WidgetDefinitionOut(
        id=6,
        service_id=6,
        name="github",
        display_name="GitHub",
        description="Statistiques, repositories et activité de code GitHub",
        params_schema=[{"name": "githubMetric", "type": "string"}],
    ),
]


@router.get("/definitions", response_model=List[WidgetDefinitionOut])
def get_widget_definitions(
    current_user: User = Depends(get_current_user),
):
    """
    @brief Returns the standard catalog of available widget definitions for an authenticated user.
    @param current_user Authenticated user resolved from the request token.
    @return The list of standard widget definitions.
    """
    return STANDARD_DEFINITIONS


@router.get("", response_model=List[UserWidgetOut])
def list_user_widgets(
    current_user: User = Depends(get_current_user),
):
    """
    @brief Lists the widgets stored for the current user.
    @param current_user Authenticated user whose widgets are loaded.
    @return The list of widgets saved by the user.
    """
    return JsonWidgetStorage.load_user_widgets(current_user.id)


@router.post("", response_model=UserWidgetOut, status_code=201)
def create_user_widget(
    widget_in: UserWidgetCreate,
    current_user: User = Depends(get_current_user),
):
    """
    @brief Creates a new widget for the current user in the JSON widget storage.
    @param widget_in Payload describing the widget to create.
    @param current_user Authenticated user who will own the widget.
    @return The newly created widget.
    """
    return JsonWidgetStorage.create_widget(current_user.id, widget_in)


@router.put("/{widget_id}", response_model=UserWidgetOut)
def update_user_widget(
    widget_id: int,
    widget_in: UserWidgetUpdate,
    current_user: User = Depends(get_current_user),
):
    """
    @brief Updates an existing widget of the current user with the provided fields.
    @param widget_id Identifier of the widget to update.
    @param widget_in Payload with the fields to change.
    @param current_user Authenticated user who owns the widget.
    @return The updated widget.
    """
    return JsonWidgetStorage.update_widget(current_user.id, widget_id, widget_in)


@router.delete("/{widget_id}", response_model=WidgetDeleteResponse)
def delete_user_widget(
    widget_id: int,
    current_user: User = Depends(get_current_user),
):
    """
    @brief Deletes a widget belonging to the current user from the JSON widget storage.
    @param widget_id Identifier of the widget to delete.
    @param current_user Authenticated user who owns the widget.
    @return A deletion response confirming the removal.
    """
    return JsonWidgetStorage.delete_widget(current_user.id, widget_id)
