import pytest
from app.models.service import Service
from app.models.widget import WidgetDefinition, UserWidget


@pytest.fixture
def sample_service_and_widget_def(db_session):
    service = Service(
        name="weather_test",
        display_name="Test Weather",
        description="Service météo pour les tests",
        auth_type="none",
        is_active=True,
    )
    db_session.add(service)
    db_session.flush()

    widget_def = WidgetDefinition(
        service_id=service.id,
        name="city_temperature",
        display_name="Température Ville",
        description="Affiche la température",
        params_schema=[{"name": "city", "type": "string"}],
    )
    db_session.add(widget_def)
    db_session.commit()
    db_session.refresh(widget_def)
    return widget_def


def test_delete_widget_success(client, sample_service_and_widget_def, db_session):
    reg_resp = client.post(
        "/api/v1/auth/register",
        json={
            "email": "widget_owner@example.com",
            "username": "widget_owner",
            "password": "password123",
        },
    )
    token = reg_resp.json()["access_token"]
    user_id = reg_resp.json()["user"]["id"]

    widget = UserWidget(
        user_id=user_id,
        widget_id=sample_service_and_widget_def.id,
        title="Ma Météo",
        params_values={"city": "Paris"},
        refresh_rate=30,
    )
    db_session.add(widget)
    db_session.commit()
    db_session.refresh(widget)
    widget_id = widget.id

    response = client.delete(
        f"/api/v1/widgets/{widget_id}",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == widget_id
    assert "supprimé avec succès" in data["message"]

    deleted = db_session.query(UserWidget).filter(UserWidget.id == widget_id).first()
    assert deleted is None


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


def test_delete_widget_forbidden_for_other_user(client, sample_service_and_widget_def, db_session):
    resp_user1 = client.post(
        "/api/v1/auth/register",
        json={
            "email": "user1_widget@example.com",
            "username": "user1_widget",
            "password": "password123",
        },
    )
    user1_id = resp_user1.json()["user"]["id"]

    resp_user2 = client.post(
        "/api/v1/auth/register",
        json={
            "email": "user2_widget@example.com",
            "username": "user2_widget",
            "password": "password123",
        },
    )
    user2_token = resp_user2.json()["access_token"]

    widget_user1 = UserWidget(
        user_id=user1_id,
        widget_id=sample_service_and_widget_def.id,
        title="Widget Utilisateur 1",
        params_values={"city": "Lyon"},
        refresh_rate=60,
    )
    db_session.add(widget_user1)
    db_session.commit()
    db_session.refresh(widget_user1)

    response = client.delete(
        f"/api/v1/widgets/{widget_user1.id}",
        headers={"Authorization": f"Bearer {user2_token}"},
    )
    assert response.status_code == 403
    assert "autorisation" in response.json()["detail"].lower()

    persisted = db_session.query(UserWidget).filter(UserWidget.id == widget_user1.id).first()
    assert persisted is not None


def test_delete_widget_unauthorized(client):
    response = client.delete("/api/v1/widgets/1")
    assert response.status_code == 401


def test_create_and_list_widgets(client, sample_service_and_widget_def):
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
            "widget_id": sample_service_and_widget_def.id,
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



def test_update_widget_success(client, sample_service_and_widget_def):
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
            "widget_id": sample_service_and_widget_def.id,
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


def test_create_widget_by_type(client, sample_service_and_widget_def):
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
    assert create_resp.json()["widget_id"] == sample_service_and_widget_def.id

