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




class VideoInfo(BaseModel):
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
