import os
import re
from pathlib import Path
from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from pydantic import BaseModel

router = APIRouter()

# Découverte dynamique et robuste du dossier backend/storage
if Path("/app/storage").is_dir():
    storage_dir = Path("/app/storage")
else:
    cursor = Path(__file__).resolve()
    while cursor.parent != cursor and cursor.name != "app":
        cursor = cursor.parent
    storage_dir = cursor.parent / "storage"

STORAGE_VIDS_DIR = storage_dir / "custom_vids"
STORAGE_VIDS_DIR.mkdir(parents=True, exist_ok=True)

STORAGE_BG_DIR = storage_dir / "custom_bg"
STORAGE_BG_DIR.mkdir(parents=True, exist_ok=True)

STORAGE_MUSIC_DIR = storage_dir / "custom_music"
STORAGE_MUSIC_DIR.mkdir(parents=True, exist_ok=True)


class VideoInfo(BaseModel):
    id: str
    name: str
    filename: str
    url: str
    size: int


class BackgroundInfo(BaseModel):
    id: str
    name: str
    filename: str
    url: str
    size: int


@router.get("/videos", response_model=List[VideoInfo])
def list_custom_videos() -> List[VideoInfo]:
    videos: List[VideoInfo] = []
    allowed_extensions = {".mp4", ".webm", ".ogg"}

    if STORAGE_VIDS_DIR.exists():
        for file in STORAGE_VIDS_DIR.iterdir():
            if file.is_file() and file.suffix.lower() in allowed_extensions:
                formatted_name = file.stem.replace("_", " ").replace("-", " ").title()
                videos.append(
                    VideoInfo(
                        id=file.name,
                        name=formatted_name,
                        filename=file.name,
                        url=f"/api/v1/storage/custom_vids/{file.name}",
                        size=file.stat().st_size,
                    )
                )

    videos.sort(key=lambda v: (0 if v.filename == "la_peace.mp4" else 1, v.name))
    return videos


@router.post("/videos/upload", response_model=VideoInfo, status_code=status.HTTP_201_CREATED)
async def upload_custom_video(file: UploadFile = File(...)) -> VideoInfo:
    allowed_extensions = {".mp4", ".webm", ".ogg"}
    file_ext = Path(file.filename or "").suffix.lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Format de fichier non pris en charge. Formats acceptés : .mp4, .webm, .ogg",
        )

    base_name = re.sub(r"[^\w\-.]", "_", Path(file.filename or "video").stem)
    safe_filename = f"{base_name}{file_ext}"
    target_path = STORAGE_VIDS_DIR / safe_filename

    content = await file.read()
    if len(content) > 50 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Le fichier dépasse la taille maximale autorisée (50 Mo).",
        )

    with open(target_path, "wb") as f:
        f.write(content)

    formatted_name = target_path.stem.replace("_", " ").replace("-", " ").title()
    return VideoInfo(
        id=safe_filename,
        name=formatted_name,
        filename=safe_filename,
        url=f"/api/v1/storage/custom_vids/{safe_filename}",
        size=len(content),
    )


@router.get("/backgrounds", response_model=List[BackgroundInfo])
def list_custom_backgrounds() -> List[BackgroundInfo]:
    backgrounds: List[BackgroundInfo] = []
    allowed_extensions = {".jpg", ".jpeg", ".png", ".webp", ".avif", ".svg"}

    if STORAGE_BG_DIR.exists():
        for file in STORAGE_BG_DIR.iterdir():
            if file.is_file() and file.suffix.lower() in allowed_extensions:
                formatted_name = file.stem.replace("_", " ").replace("-", " ").title()
                backgrounds.append(
                    BackgroundInfo(
                        id=file.name,
                        name=formatted_name,
                        filename=file.name,
                        url=f"/api/v1/storage/custom_bg/{file.name}",
                        size=file.stat().st_size,
                    )
                )

    backgrounds.sort(key=lambda b: b.name)
    return backgrounds


@router.post("/backgrounds/upload", response_model=BackgroundInfo, status_code=status.HTTP_201_CREATED)
async def upload_custom_background(file: UploadFile = File(...)) -> BackgroundInfo:
    allowed_extensions = {".jpg", ".jpeg", ".png", ".webp", ".avif", ".svg"}
    file_ext = Path(file.filename or "").suffix.lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Format d'image non pris en charge. Formats acceptés : .jpg, .jpeg, .png, .webp, .avif, .svg",
        )

    base_name = re.sub(r"[^\w\-.]", "_", Path(file.filename or "background").stem)
    safe_filename = f"{base_name}{file_ext}"
    target_path = STORAGE_BG_DIR / safe_filename

    content = await file.read()
    if len(content) > 15 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Le fichier dépasse la taille maximale autorisée (15 Mo).",
        )

    with open(target_path, "wb") as f:
        f.write(content)

    formatted_name = target_path.stem.replace("_", " ").replace("-", " ").title()
    return BackgroundInfo(
        id=safe_filename,
        name=formatted_name,
        filename=safe_filename,
        url=f"/api/v1/storage/custom_bg/{safe_filename}",
        size=len(content),
    )


class MusicInfo(BaseModel):
    id: str
    name: str
    filename: str
    url: str
    size: int


@router.get("/music", response_model=List[MusicInfo])
def list_custom_music() -> List[MusicInfo]:
    music: List[MusicInfo] = []
    allowed_extensions = {".mp3", ".wav", ".ogg", ".m4a", ".aac", ".flac"}

    if STORAGE_MUSIC_DIR.exists():
        for file in STORAGE_MUSIC_DIR.iterdir():
            if file.is_file() and file.suffix.lower() in allowed_extensions:
                formatted_name = file.stem.replace("_", " ").replace("-", " ").title()
                music.append(
                    MusicInfo(
                        id=file.name,
                        name=formatted_name,
                        filename=file.name,
                        url=f"/api/v1/storage/custom_music/{file.name}",
                        size=file.stat().st_size,
                    )
                )

    music.sort(key=lambda m: m.name)
    return music


@router.post("/music/upload", response_model=MusicInfo, status_code=status.HTTP_201_CREATED)
async def upload_custom_music(file: UploadFile = File(...)) -> MusicInfo:
    allowed_extensions = {".mp3", ".wav", ".ogg", ".m4a", ".aac", ".flac"}
    file_ext = Path(file.filename or "").suffix.lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Format audio non pris en charge. Formats acceptés : .mp3, .wav, .ogg, .m4a, .aac, .flac",
        )

    base_name = re.sub(r"[^\w\-.]", "_", Path(file.filename or "music").stem)
    safe_filename = f"{base_name}{file_ext}"
    target_path = STORAGE_MUSIC_DIR / safe_filename

    content = await file.read()
    if len(content) > 30 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Le fichier audio dépasse la taille maximale autorisée (30 Mo).",
        )

    with open(target_path, "wb") as f:
        f.write(content)

    formatted_name = target_path.stem.replace("_", " ").replace("-", " ").title()
    return MusicInfo(
        id=safe_filename,
        name=formatted_name,
        filename=safe_filename,
        url=f"/api/v1/storage/custom_music/{safe_filename}",
        size=len(content),
    )


