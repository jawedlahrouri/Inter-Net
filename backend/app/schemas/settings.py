from typing import List, Optional
from pydantic import BaseModel, Field


class MeditationSettings(BaseModel):
    video_enabled: bool = Field(default=True, description="Active ou désactive la vidéo de fond")
    video_url: str = Field(
        default="/api/v1/storage/custom_vids/la_peace.mp4",
        description="URL de la vidéo d'arrière-plan",
    )
    sound_enabled: bool = Field(default=False, description="Active ou désactive le son de la vidéo")


class MeditationSettingsUpdate(BaseModel):
    video_enabled: Optional[bool] = None
    video_url: Optional[str] = None
    sound_enabled: Optional[bool] = None


class DashboardPage(BaseModel):
    id: str = Field(..., description="Identifiant unique de la page de tableau de bord")
    name: str = Field(..., description="Nom de la page de tableau de bord")


class ThemeCustomizationSettings(BaseModel):
    primary_color: str = Field(
        default="#0b0f19",
        description="Couleur primaire du dashboard (sert de fond d'écran si aucune image)",
    )
    secondary_color: str = Field(
        default="#131b2e",
        description="Couleur secondaire (cartes des widgets et surfaces)",
    )
    tertiary_color: str = Field(
        default="#38bdf8",
        description="Couleur ternaire (accents, bordures et reflets)",
    )
    background_image: Optional[str] = Field(
        default=None,
        description="URL ou chemin de l'image de fond du dashboard",
    )


class ThemeCustomizationSettingsUpdate(BaseModel):
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    tertiary_color: Optional[str] = None
    background_image: Optional[str] = None


class UserSettings(BaseModel):
    meditation: MeditationSettings = Field(default_factory=MeditationSettings)
    dashboards: List[DashboardPage] = Field(
        default_factory=lambda: [DashboardPage(id="default", name="Général")],
        description="Liste des pages de tableaux de bord personnalisées",
    )
    customization: ThemeCustomizationSettings = Field(default_factory=ThemeCustomizationSettings)


class UserSettingsUpdate(BaseModel):
    meditation: Optional[MeditationSettingsUpdate] = None
    dashboards: Optional[List[DashboardPage]] = None
    customization: Optional[ThemeCustomizationSettingsUpdate] = None
