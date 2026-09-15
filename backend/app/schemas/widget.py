from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, ConfigDict, Field


class WidgetDefinitionOut(BaseModel):
    id: Optional[int] = 1
    service_id: Optional[int] = 1
    name: str
    display_name: str
    description: Optional[str] = None
    params_schema: Optional[Any] = None

    model_config = ConfigDict(from_attributes=True)


class UserWidgetBase(BaseModel):
    title: Optional[str] = None
    type: Optional[str] = None
    params_values: dict[str, Any] = Field(default_factory=dict)
    refresh_rate: int = Field(default=60, ge=5, le=86400)
    position_x: int = 0
    position_y: int = 0
    width: int = 1
    height: int = 1



class UserWidgetCreate(UserWidgetBase):
    widget_id: Optional[int] = None
    type: Optional[str] = None


class UserWidgetUpdate(BaseModel):
    title: Optional[str] = None
    params_values: Optional[dict[str, Any]] = None
    refresh_rate: Optional[int] = Field(default=None, ge=5, le=86400)
    position_x: Optional[int] = None
    position_y: Optional[int] = None
    width: Optional[int] = None
    height: Optional[int] = None


class UserWidgetOut(UserWidgetBase):
    id: int
    user_id: int
    widget_id: Optional[int] = 1
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    widget_def: Optional[WidgetDefinitionOut] = None

    model_config = ConfigDict(from_attributes=True)



class WidgetDeleteResponse(BaseModel):
    message: str = "Widget supprimé avec succès"
    id: int
