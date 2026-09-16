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
