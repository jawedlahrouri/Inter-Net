import io
import pytest


def test_custom_videos_list(client):
    response = client.get("/api/v1/customization/videos")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert any(v["filename"] == "la_peace.mp4" for v in data)


def test_storage_static_file_serving(client):
    response = client.get("/api/v1/storage/custom_vids/la_peace.mp4")
    assert response.status_code == 200
    assert len(response.content) > 0


def test_user_settings_lifecycle(client):
    # Register a user to test settings
    reg_res = client.post(
        "/api/v1/auth/register",
        json={
            "email": "settings_tester@example.com",
            "username": "settings_tester",
            "password": "Password123!",
        },
    )
    assert reg_res.status_code == 201
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Get default settings
    get_res = client.get("/api/v1/auth/me/settings", headers=headers)
    assert get_res.status_code == 200
    settings = get_res.json()
    assert settings["meditation"]["video_enabled"] is True
    assert "la_peace.mp4" in settings["meditation"]["video_url"]

    # Update settings (disable video, custom URL)
    patch_res = client.patch(
        "/api/v1/auth/me/settings",
        headers=headers,
        json={
            "meditation": {
                "video_enabled": False,
                "video_url": "https://example.com/custom.mp4",
                "sound_enabled": True,
            }
        },
    )
    assert patch_res.status_code == 200
    updated = patch_res.json()
    assert updated["meditation"]["video_enabled"] is False
    assert updated["meditation"]["video_url"] == "https://example.com/custom.mp4"
    assert updated["meditation"]["sound_enabled"] is True

    # Re-fetch settings
    get_res2 = client.get("/api/v1/auth/me/settings", headers=headers)
    assert get_res2.status_code == 200
    assert get_res2.json()["meditation"]["video_enabled"] is False

    # Check default theme customization
    assert "customization" in get_res2.json()
    assert get_res2.json()["customization"]["primary_color"] == "#0b0f19"
    assert get_res2.json()["customization"]["secondary_color"] == "#131b2e"
    assert get_res2.json()["customization"]["tertiary_color"] == "#38bdf8"
    assert get_res2.json()["customization"]["background_image"] is None

    # Update theme customization (colors and background image)
    patch_custom_res = client.patch(
        "/api/v1/auth/me/settings",
        headers=headers,
        json={
            "customization": {
                "primary_color": "#1e1e2e",
                "secondary_color": "#282a36",
                "tertiary_color": "#ff79c6",
                "background_image": "/api/v1/storage/custom_bg/my_bg.png",
            }
        },
    )
    assert patch_custom_res.status_code == 200
    custom_updated = patch_custom_res.json()["customization"]
    assert custom_updated["primary_color"] == "#1e1e2e"
    assert custom_updated["secondary_color"] == "#282a36"
    assert custom_updated["tertiary_color"] == "#ff79c6"
    assert custom_updated["background_image"] == "/api/v1/storage/custom_bg/my_bg.png"


def test_custom_backgrounds_list_and_upload(client):
    # List backgrounds
    get_res = client.get("/api/v1/customization/backgrounds")
    assert get_res.status_code == 200
    assert isinstance(get_res.json(), list)

    # Upload valid image
    fake_png = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4"
    files = {"file": ("test_space_wallpaper.png", io.BytesIO(fake_png), "image/png")}
    upload_res = client.post("/api/v1/customization/backgrounds/upload", files=files)
    assert upload_res.status_code == 201
    bg_data = upload_res.json()
    assert "test_space_wallpaper.png" in bg_data["filename"]
    assert bg_data["url"].startswith("/api/v1/storage/custom_bg/")

    # Check that it appears in list
    get_res2 = client.get("/api/v1/customization/backgrounds")
    assert any(b["filename"] == bg_data["filename"] for b in get_res2.json())

    # Upload invalid file extension should return 400
    invalid_files = {"file": ("malicious.exe", io.BytesIO(b"binary"), "application/octet-stream")}
    bad_upload = client.post("/api/v1/customization/backgrounds/upload", files=invalid_files)
    assert bad_upload.status_code == 400

