from app.services.widget_storage import JsonWidgetStorage


def test_delete_widget_success(client):
    reg_resp = client.post(
        "/api/v1/auth/register",
        json={
            "email": "widget_owner@example.com",
            "username": "widget_owner",
            "password": "password123",
        },
    )
    token = reg_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    create_resp = client.post(
        "/api/v1/widgets",
        headers=headers,
        json={
            "type": "weather",
            "title": "Ma Météo",
            "params_values": {"city": "Paris"},
            "refresh_rate": 30,
        },
    )
    widget_id = create_resp.json()["id"]

    response = client.delete(
        f"/api/v1/widgets/{widget_id}",
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == widget_id
    assert "supprimé avec succès" in data["message"]

    list_resp = client.get("/api/v1/widgets", headers=headers)
    assert not any(w["id"] == widget_id for w in list_resp.json())


def test_delete_widget_not_found(client):
    reg_resp = client.post(
        "/api/v1/auth/register",
        json={
            "email": "notfound_tester@example.com",
            "username": "notfound_tester",
            "password": "password123",
        },
    )
    token = reg_resp.json()["access_token"]

    response = client.delete(
        "/api/v1/widgets/999999",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 404
    assert "introuvable" in response.json()["detail"].lower()


def test_delete_widget_forbidden_for_other_user(client):
    resp_user1 = client.post(
        "/api/v1/auth/register",
        json={
            "email": "user1_widget@example.com",
            "username": "user1_widget",
            "password": "password123",
        },
    )
    token1 = resp_user1.json()["access_token"]

    resp_user2 = client.post(
        "/api/v1/auth/register",
        json={
            "email": "user2_widget@example.com",
            "username": "user2_widget",
            "password": "password123",
        },
    )
    token2 = resp_user2.json()["access_token"]

    create_resp = client.post(
        "/api/v1/widgets",
        headers={"Authorization": f"Bearer {token1}"},
        json={
            "type": "weather",
            "title": "Widget Utilisateur 1",
            "params_values": {"city": "Lyon"},
            "refresh_rate": 60,
        },
    )
    widget_id = create_resp.json()["id"]

    response = client.delete(
        f"/api/v1/widgets/{widget_id}",
        headers={"Authorization": f"Bearer {token2}"},
    )
    assert response.status_code == 403
    assert "autorisation" in response.json()["detail"].lower()


def test_delete_widget_unauthorized(client):
    response = client.delete("/api/v1/widgets/1")
    assert response.status_code == 401


def test_create_and_list_widgets(client):
    reg_resp = client.post(
        "/api/v1/auth/register",
        json={
            "email": "crud_user@example.com",
            "username": "crud_user",
            "password": "password123",
        },
    )
    token = reg_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    create_resp = client.post(
        "/api/v1/widgets",
        headers=headers,
        json={
            "type": "weather",
            "title": "Météo Marseille",
            "params_values": {"city": "Marseille"},
            "refresh_rate": 15,
        },
    )
    assert create_resp.status_code == 201
    created_id = create_resp.json()["id"]

    list_resp = client.get("/api/v1/widgets", headers=headers)
    assert list_resp.status_code == 200
    widgets = list_resp.json()
    assert any(w["id"] == created_id for w in widgets)
    created_widget = next(w for w in widgets if w["id"] == created_id)
    assert created_widget["title"] == "Météo Marseille"
    assert created_widget["refresh_rate"] == 15


def test_update_widget_success(client):
    reg_resp = client.post(
        "/api/v1/auth/register",
        json={
            "email": "update_user@example.com",
            "username": "update_user",
            "password": "password123",
        },
    )
    token = reg_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    create_resp = client.post(
        "/api/v1/widgets",
        headers=headers,
        json={
            "type": "custom_api",
            "title": "Titre initial",
            "params_values": {"city": "Bordeaux"},
            "refresh_rate": 30,
        },
    )
    widget_id = create_resp.json()["id"]

    update_resp = client.put(
        f"/api/v1/widgets/{widget_id}",
        headers=headers,
        json={
            "title": "Titre Modifié",
            "refresh_rate": 10,
            "params_values": {"city": "Toulouse"},
        },
    )
    assert update_resp.status_code == 200
    data = update_resp.json()
    assert data["title"] == "Titre Modifié"
    assert data["refresh_rate"] == 10
    assert data["params_values"]["city"] == "Toulouse"


def test_create_widget_by_type(client):
    reg_resp = client.post(
        "/api/v1/auth/register",
        json={
            "email": "type_user@example.com",
            "username": "type_user",
            "password": "password123",
        },
    )
    token = reg_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    create_resp = client.post(
        "/api/v1/widgets",
        headers=headers,
        json={
            "type": "weather",
            "title": "Météo par type",
            "params_values": {"city": "Nice"},
            "refresh_rate": 45,
        },
    )
    assert create_resp.status_code == 201
    assert create_resp.json()["type"] == "weather"
