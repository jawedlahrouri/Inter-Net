from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class AdminUserSummary(BaseModel):
    id: int
    email: EmailStr
    username: str
    role: str
    created_at: datetime
    dashboards_count: int = 0
    widgets_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class AdminUserCreate(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6, max_length=100)
    role: str = Field(default="user", pattern="^(user|admin)$")


class AdminUserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = Field(default=None, min_length=3, max_length=50)
    role: Optional[str] = Field(default=None, pattern="^(user|admin)$")
    password: Optional[str] = Field(default=None, min_length=6, max_length=100)


class AdminDashboardSummary(BaseModel):
    dashboard_id: str
    user_id: int
    user_username: str
    user_email: str
    name: str
    primary_color: Optional[str] = "#0b0f19"
    secondary_color: Optional[str] = "#131b2e"
    tertiary_color: Optional[str] = "#38bdf8"
    background_image: Optional[str] = None
    widgets_count: int = 0


class AdminDashboardCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    primary_color: Optional[str] = "#0b0f19"
    secondary_color: Optional[str] = "#131b2e"
    tertiary_color: Optional[str] = "#38bdf8"
    background_image: Optional[str] = None


class AdminDashboardUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    tertiary_color: Optional[str] = None
    background_image: Optional[str] = None


class AdminDashboardDetail(BaseModel):
    dashboard_id: str
    user_id: int
    user_username: str
    user_email: str
    name: str
    primary_color: Optional[str] = "#0b0f19"
    secondary_color: Optional[str] = "#131b2e"
    tertiary_color: Optional[str] = "#38bdf8"
    background_image: Optional[str] = None
    widgets: List[Dict[str, Any]] = Field(default_factory=list)


class AdminUserDetail(BaseModel):
    id: int
    email: EmailStr
    username: str
    role: str
    created_at: datetime
    updated_at: datetime
    dashboards: List[Dict[str, Any]] = Field(default_factory=list)
    widgets: List[Dict[str, Any]] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class AdminStats(BaseModel):
    total_users: int
    total_admins: int
    total_dashboards: int
    total_widgets: int
