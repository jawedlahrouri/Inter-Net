import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from fastapi import HTTPException, status

from app.schemas.widget import UserWidgetCreate, UserWidgetUpdate


def get_storage_dir() -> Path:
    """
    @brief Resolves and creates the directory where per-user widget JSON files are stored.
    @return A Path to the widget storage directory taken from STORAGE_DIR, /app/storage/widgets or a local storage folder.
    """
    env_path = os.getenv("STORAGE_DIR")
    if env_path:
        storage_dir = Path(env_path)
    elif Path("/app/storage/widgets").exists() or Path("/app").exists():
        storage_dir = Path("/app/storage/widgets")
    else:
        storage_dir = Path(__file__).resolve().parent.parent.parent / "storage" / "widgets"
    storage_dir.mkdir(parents=True, exist_ok=True)
    return storage_dir


def get_user_file_path(user_id: int) -> Path:
    """
    @brief Builds the path of the JSON file holding a given user's widgets.
    @param user_id Identifier of the user.
    @return A Path to user_<id>.json inside the storage directory.
    """
    return get_storage_dir() / f"user_{user_id}.json"


def get_default_widgets_for_user(user_id: int) -> List[Dict[str, Any]]:
    """
    @brief Builds the default widget set (weather and custom API status) for a new user.
    @param user_id Identifier of the user, used to derive widget ids.
    @return A list of two widget dicts with timestamps and embedded widget definitions.
    """
    now = datetime.now(timezone.utc).isoformat()
    return [
        {
            "id": user_id * 1000 + 1,
            "user_id": user_id,
            "widget_id": 1,
            "type": "weather",
            "title": "Météo locale",
            "params_values": {"city": "Paris"},
            "refresh_rate": 60,
            "position_x": 0,
            "position_y": 0,
            "width": 1,
            "height": 1,
            "created_at": now,
            "updated_at": now,
            "widget_def": {
                "id": 1,
                "service_id": 1,
                "name": "city_temperature",
                "display_name": "Météo",
                "description": "Température météo",
                "params_schema": [{"name": "city", "type": "string"}],
            },
        },
        {
            "id": user_id * 1000 + 2,
            "user_id": user_id,
            "widget_id": 2,
            "type": "custom_api",
            "title": "Statut API Backend",
            "params_values": {
                "apiUrl": "http://127.0.0.1:8000/api/v1/health",
                "jsonPath": "status",
                "displayMode": "kpi",
            },
            "refresh_rate": 15,
            "position_x": 1,
            "position_y": 0,
            "width": 1,
            "height": 1,
            "created_at": now,
            "updated_at": now,
            "widget_def": {
                "id": 2,
                "service_id": 2,
                "name": "custom_api",
                "display_name": "API JSON Universelle",
                "description": "Métrique extraite d'une API",
                "params_schema": [
                    {"name": "apiUrl", "type": "string"},
                    {"name": "jsonPath", "type": "string"},
                ],
            },
        },
    ]


class JsonWidgetStorage:
    @staticmethod
    def load_user_widgets(user_id: int) -> List[Dict[str, Any]]:
        """
        @brief Loads a user's widgets from their JSON file, creating default widgets if the file does not exist.
        @param user_id Identifier of the user whose widgets are loaded.
        @return The list of widget dicts, or an empty list if the file is corrupt or unreadable.
        """
        file_path = get_user_file_path(user_id)
        if not file_path.exists():
            default_widgets = get_default_widgets_for_user(user_id)
            JsonWidgetStorage.save_user_widgets(user_id, default_widgets)
            return default_widgets

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data if isinstance(data, list) else []
        except (json.JSONDecodeError, OSError):
            return []

    @staticmethod
    def save_user_widgets(user_id: int, widgets: List[Dict[str, Any]]) -> None:
        """
        @brief Writes a user's widgets to their JSON file atomically via a temporary file.
        @param user_id Identifier of the user whose widgets are saved.
        @param widgets List of widget dicts to persist.
        """
        file_path = get_user_file_path(user_id)
        temp_path = file_path.with_suffix(".tmp")
        with open(temp_path, "w", encoding="utf-8") as f:
            json.dump(widgets, f, indent=2, ensure_ascii=False)
        temp_path.replace(file_path)

    @staticmethod
    def find_widget_globally(widget_id: int) -> Tuple[Optional[int], Optional[Dict[str, Any]]]:
        """
        @brief Searches every user's widget file for a widget with the given id.
        @param widget_id Identifier of the widget to look for.
        @return A tuple of the owning user id and the widget dict, or (None, None) if not found.
        """
        storage_dir = get_storage_dir()
        for user_file in storage_dir.glob("user_*.json"):
            try:
                with open(user_file, "r", encoding="utf-8") as f:
                    widgets = json.load(f)
                    if isinstance(widgets, list):
                        for w in widgets:
                            if w.get("id") == widget_id:
                                uid = int(user_file.stem.replace("user_", ""))
                                return uid, w
            except (json.JSONDecodeError, OSError, ValueError):
                continue
        return None, None

    @staticmethod
    def create_widget(user_id: int, widget_in: UserWidgetCreate) -> Dict[str, Any]:
        """
        @brief Creates a new widget for a user with a generated id and a widget definition derived from its type, then saves it.
        @param user_id Identifier of the user who owns the widget.
        @param widget_in Creation payload with type, title, parameters, refresh rate, position and size.
        @return The newly created widget dict.
        """
        widgets = JsonWidgetStorage.load_user_widgets(user_id)
        
        existing_ids = [w.get("id", 0) for w in widgets if isinstance(w.get("id"), int)]
        next_id = max(existing_ids, default=user_id * 1000) + 1

        now = datetime.now(timezone.utc).isoformat()
        widget_type = widget_in.type or "custom_api"
        if widget_in.widget_id == 1 or widget_type in ["weather", "city_temperature"]:
            def_name = "city_temperature"
            display_name = "Météo"
        elif widget_in.widget_id == 2 or widget_type in ["rss", "article_list"]:
            def_name = "article_list"
            display_name = "Flux RSS"
        elif widget_type in ["default", "shortcut"]:
            def_name = "shortcut"
            display_name = "Raccourci Web"
        elif widget_type == "steam":
            def_name = "steam"
            display_name = "Steam"
        elif widget_type == "github":
            def_name = "github"
            display_name = "GitHub"
        else:
            def_name = "custom_api"
            display_name = "API JSON Universelle"

        new_widget: Dict[str, Any] = {
            "id": next_id,
            "user_id": user_id,
            "widget_id": widget_in.widget_id or 1,
            "type": widget_type,
            "title": widget_in.title or display_name,
            "params_values": widget_in.params_values,
            "refresh_rate": widget_in.refresh_rate,
            "position_x": widget_in.position_x,
            "position_y": widget_in.position_y,
            "width": widget_in.width,
            "height": widget_in.height,
            "created_at": now,
            "updated_at": now,
            "widget_def": {
                "id": widget_in.widget_id or 1,
                "service_id": 1,
                "name": def_name,
                "display_name": display_name,
                "description": display_name,
                "params_schema": [],
            },
        }

        widgets.append(new_widget)
        JsonWidgetStorage.save_user_widgets(user_id, widgets)
        return new_widget

    @staticmethod
    def update_widget(user_id: int, widget_id: int, widget_in: UserWidgetUpdate) -> Dict[str, Any]:
        """
        @brief Applies partial updates to a user's widget and saves it, raising 403 or 404 if it is not accessible.
        @param user_id Identifier of the user requesting the update.
        @param widget_id Identifier of the widget to update.
        @param widget_in Update payload whose non-None fields overwrite the widget.
        @return The updated widget dict.
        """
        widgets = JsonWidgetStorage.load_user_widgets(user_id)
        widget_index = next((i for i, w in enumerate(widgets) if w.get("id") == widget_id), None)

        if widget_index is None:
            owner_id, _ = JsonWidgetStorage.find_widget_globally(widget_id)
            if owner_id is not None and owner_id != user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Vous n'avez pas l'autorisation de modifier ce widget",
                )
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Widget introuvable",
            )

        target = widgets[widget_index]
        if widget_in.title is not None:
            target["title"] = widget_in.title
        if widget_in.params_values is not None:
            merged = dict(target.get("params_values") or {})
            merged.update(widget_in.params_values)
            target["params_values"] = merged
        if widget_in.refresh_rate is not None:
            target["refresh_rate"] = widget_in.refresh_rate
        if widget_in.position_x is not None:
            target["position_x"] = widget_in.position_x
        if widget_in.position_y is not None:
            target["position_y"] = widget_in.position_y
        if widget_in.width is not None:
            target["width"] = widget_in.width
        if widget_in.height is not None:
            target["height"] = widget_in.height

        target["updated_at"] = datetime.now(timezone.utc).isoformat()
        widgets[widget_index] = target
        JsonWidgetStorage.save_user_widgets(user_id, widgets)
        return target

    @staticmethod
    def delete_widget(user_id: int, widget_id: int) -> Dict[str, Any]:
        """
        @brief Deletes a widget from a user's storage, raising 403 or 404 if it is owned by another user or missing.
        @param user_id Identifier of the user requesting the deletion.
        @param widget_id Identifier of the widget to delete.
        @return A dict with a success message and the deleted widget id.
        """
        widgets = JsonWidgetStorage.load_user_widgets(user_id)
        filtered = [w for w in widgets if w.get("id") != widget_id]

        if len(filtered) == len(widgets):
            owner_id, _ = JsonWidgetStorage.find_widget_globally(widget_id)
            if owner_id is not None and owner_id != user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Vous n'avez pas l'autorisation de supprimer ce widget",
                )
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Widget introuvable",
            )

        JsonWidgetStorage.save_user_widgets(user_id, filtered)
        return {
            "message": "Widget supprimé avec succès",
            "id": widget_id,
        }

    @staticmethod
    def reorder_widgets(user_id: int, ordered_ids: List[int]) -> List[Dict[str, Any]]:
        """
        @brief Reorders user widgets according to the given list of IDs, assigning position_x sequentially.
        @param user_id Identifier of the user whose widgets are reordered.
        @param ordered_ids List of widget IDs defining the new visual sequence.
        @return The reordered list of widgets.
        """
        widgets = JsonWidgetStorage.load_user_widgets(user_id)
        widget_map = {w.get("id"): w for w in widgets}
        reordered: List[Dict[str, Any]] = []

        for i, wid in enumerate(ordered_ids):
            if wid in widget_map:
                w = widget_map.pop(wid)
                w["position_x"] = i
                w["updated_at"] = datetime.now(timezone.utc).isoformat()
                reordered.append(w)

        # Conserve en queue les widgets non spécifiés dans la liste
        for w in widget_map.values():
            w["position_x"] = len(reordered)
            reordered.append(w)

        JsonWidgetStorage.save_user_widgets(user_id, reordered)
        return reordered

