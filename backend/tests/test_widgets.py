from tests.conftest import create_user_token


def test_delete_widget_success(client, db_session):
    """
    @brief Tests that a user can delete their own widget and that it no longer appears in the widget list.
    @param client The FastAPI test client fixture.
    @param db_session The test database session.
    """
    token = create_user_token(client, db_session, "widget_owner@example.com", "widget_owner", "password123")
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


def test_delete_widget_not_found(client, db_session):
    """
    @brief Tests that deleting a nonexistent widget returns a 404 error.
    @param client The FastAPI test client fixture.
    @param db_session The test database session.
    """
    token = create_user_token(client, db_session, "notfound_tester@example.com", "notfound_tester", "password123")

    response = client.delete(
        "/api/v1/widgets/999999",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 404
    assert "introuvable" in response.json()["detail"].lower()


def test_delete_widget_forbidden_for_other_user(client, db_session):
    """
    @brief Tests that a user cannot delete a widget owned by another user and receives a 403 error.
    @param client The FastAPI test client fixture.
    @param db_session The test database session.
    """
    token1 = create_user_token(client, db_session, "user1_widget@example.com", "user1_widget", "password123")
    token2 = create_user_token(client, db_session, "user2_widget@example.com", "user2_widget", "password123")

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
    """
    @brief Tests that deleting a widget without authentication returns a 401 error.
    @param client The FastAPI test client fixture.
    """
    response = client.delete("/api/v1/widgets/1")
    assert response.status_code == 401


def test_create_and_list_widgets(client, db_session):
    """
    @brief Tests that a created widget is returned with a 201 status and appears in the user's widget list with its fields.
    @param client The FastAPI test client fixture.
    @param db_session The test database session.
    """
    token = create_user_token(client, db_session, "crud_user@example.com", "crud_user", "password123")
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


def test_update_widget_success(client, db_session):
    """
    @brief Tests that updating a widget's title, refresh rate and parameters is persisted and returned.
    @param client The FastAPI test client fixture.
    @param db_session The test database session.
    """
    token = create_user_token(client, db_session, "update_user@example.com", "update_user", "password123")
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


def test_create_widget_by_type(client, db_session):
    """
    @brief Tests that creating a widget of type weather returns a 201 status and preserves the type.
    @param client The FastAPI test client fixture.
    @param db_session The test database session.
    """
    token = create_user_token(client, db_session, "type_user@example.com", "type_user", "password123")
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


def test_widget_dimensions_customization(client, db_session):
    """
    @brief Tests that widget width and height can be set at creation and changed through an update.
    @param client The FastAPI test client fixture.
    @param db_session The test database session.
    """
    token = create_user_token(client, db_session, "dimensions_user@example.com", "dimensions_user", "password123")
    headers = {"Authorization": f"Bearer {token}"}

    create_resp = client.post(
        "/api/v1/widgets",
        headers=headers,
        json={
            "type": "custom_api",
            "title": "Widget Dimensions",
            "params_values": {"apiUrl": "https://api.example.com", "jsonPath": "data"},
            "refresh_rate": 30,
            "width": 2,
            "height": 2,
        },
    )
    assert create_resp.status_code == 201
    widget = create_resp.json()
    assert widget["width"] == 2
    assert widget["height"] == 2
    widget_id = widget["id"]

    update_resp = client.put(
        f"/api/v1/widgets/{widget_id}",
        headers=headers,
        json={
            "width": 3,
            "height": 1,
        },
    )
    assert update_resp.status_code == 200
    updated = update_resp.json()
    assert updated["width"] == 3
    assert updated["height"] == 1


def test_reorder_widgets_success(client, db_session):
    """
    @brief Tests reordering widgets updates their positions and array order.
    """
    token = create_user_token(client, db_session, "reorder_user@example.com", "reorder_user", "password123")
    headers = {"Authorization": f"Bearer {token}"}

    r1 = client.post(
        "/api/v1/widgets",
        headers=headers,
        json={"type": "weather", "title": "Widget Alpha", "params_values": {"city": "Paris"}},
    )
    r2 = client.post(
        "/api/v1/widgets",
        headers=headers,
        json={"type": "weather", "title": "Widget Beta", "params_values": {"city": "Lyon"}},
    )
    id1 = r1.json()["id"]
    id2 = r2.json()["id"]

    reorder_resp = client.put(
        "/api/v1/widgets/reorder",
        headers=headers,
        json={"widget_ids": [id2, id1]},
    )
    assert reorder_resp.status_code == 200
    widgets = reorder_resp.json()
    ids_in_order = [w["id"] for w in widgets if w["id"] in [id1, id2]]
    assert ids_in_order == [id2, id1]

