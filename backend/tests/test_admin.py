from app.core.security import create_access_token, get_password_hash
from app.models.user import User


def create_user_helper(db_session, username="regular_user", email="regular@test.com", role="user"):
    user = User(
        email=email,
        username=username,
        password_hash=get_password_hash("password123"),
        role=role,
        settings={"dashboards": [{"id": "default", "name": "Général"}]},
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def auth_headers(user_id: int):
    token = create_access_token(subject=user_id)
    return {"Authorization": f"Bearer {token}"}


def test_admin_access_forbidden_for_anonymous(client):
    res = client.get("/api/v1/admin/stats")
    assert res.status_code == 401


def test_admin_access_forbidden_for_regular_user(client, db_session):
    user = create_user_helper(db_session, username="user_one", email="u1@test.com", role="user")
    headers = auth_headers(user.id)

    res = client.get("/api/v1/admin/stats", headers=headers)
    assert res.status_code == 403
    assert res.json()["detail"] == "Droits administrateur requis"


def test_admin_stats_and_list_users(client, db_session):
    admin = create_user_helper(db_session, username="superadmin", email="admin@test.com", role="admin")
    u1 = create_user_helper(db_session, username="alice", email="alice@test.com", role="user")
    headers = auth_headers(admin.id)

    stats_res = client.get("/api/v1/admin/stats", headers=headers)
    assert stats_res.status_code == 200
    stats_data = stats_res.json()
    assert stats_data["total_users"] >= 2
    assert stats_data["total_admins"] >= 1
    assert stats_data["total_dashboards"] >= 2

    users_res = client.get("/api/v1/admin/users", headers=headers)
    assert users_res.status_code == 200
    users_list = users_res.json()
    usernames = [u["username"] for u in users_list]
    assert "superadmin" in usernames
    assert "alice" in usernames


def test_admin_create_update_delete_user(client, db_session):
    admin = create_user_helper(db_session, username="admin_crud", email="admin_crud@test.com", role="admin")
    headers = auth_headers(admin.id)

    # 1. Création d'un utilisateur par l'admin
    payload = {
        "email": "new_created@test.com",
        "username": "new_created",
        "password": "secretpassword",
        "role": "user",
    }
    create_res = client.post("/api/v1/admin/users", json=payload, headers=headers)
    assert create_res.status_code == 201
    created_user = create_res.json()
    created_id = created_user["id"]
    assert created_user["username"] == "new_created"

    # 2. Modification des informations
    update_payload = {
        "username": "new_created_updated",
        "role": "admin",
    }
    update_res = client.put(f"/api/v1/admin/users/{created_id}", json=update_payload, headers=headers)
    assert update_res.status_code == 200
    assert update_res.json()["username"] == "new_created_updated"
    assert update_res.json()["role"] == "admin"

    # 3. Interdiction pour l'admin de supprimer son propre compte
    self_del = client.delete(f"/api/v1/admin/users/{admin.id}", headers=headers)
    assert self_del.status_code == 400

    # 4. Suppression de l'utilisateur créé
    del_res = client.delete(f"/api/v1/admin/users/{created_id}", headers=headers)
    assert del_res.status_code == 200
    assert del_res.json()["id"] == created_id


def test_admin_dashboards_management(client, db_session):
    admin = create_user_helper(db_session, username="admin_dash", email="admindash@test.com", role="admin")
    user = create_user_helper(db_session, username="bob", email="bob@test.com", role="user")
    headers = auth_headers(admin.id)

    # 1. Lister tous les dashboards
    list_res = client.get("/api/v1/admin/dashboards", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 2

    # 2. Créer un nouveau dashboard pour l'utilisateur Bob
    create_res = client.post(
        f"/api/v1/admin/users/{user.id}/dashboards",
        json={"name": "Bob Monitoring", "primary_color": "#112233"},
        headers=headers,
    )
    assert create_res.status_code == 201
    created_dash = create_res.json()
    dash_id = created_dash["dashboard_id"]
    assert created_dash["name"] == "Bob Monitoring"

    # 3. Modifier le dashboard créé
    put_res = client.put(
        f"/api/v1/admin/users/{user.id}/dashboards/{dash_id}",
        json={"name": "Bob Super Monitoring", "primary_color": "#445566"},
        headers=headers,
    )
    assert put_res.status_code == 200
    assert put_res.json()["name"] == "Bob Super Monitoring"

    # 4. Obtenir les détails du dashboard
    detail_res = client.get(
        f"/api/v1/admin/users/{user.id}/dashboards/{dash_id}",
        headers=headers,
    )
    assert detail_res.status_code == 200
    assert detail_res.json()["name"] == "Bob Super Monitoring"

    # 5. Supprimer le dashboard
    del_res = client.delete(
        f"/api/v1/admin/users/{user.id}/dashboards/{dash_id}",
        headers=headers,
    )
    assert del_res.status_code == 200


def test_admin_widget_crud_for_user(client, db_session):
    admin = create_user_helper(db_session, username="admin_wid", email="adminwid@test.com", role="admin")
    target_user = create_user_helper(db_session, username="target_user", email="target@test.com", role="user")
    headers = auth_headers(admin.id)

    # 1. Création d'un widget pour target_user
    widget_payload = {
        "title": "Météo Lyon",
        "type": "weather",
        "params_values": {"city": "Lyon", "dashboardId": "default"},
        "refresh_rate": 30,
        "width": 2,
        "height": 1,
    }
    create_res = client.post(
        f"/api/v1/admin/users/{target_user.id}/widgets",
        json=widget_payload,
        headers=headers,
    )
    assert create_res.status_code == 201
    created_widget = create_res.json()
    widget_id = created_widget["id"]
    assert created_widget["title"] == "Météo Lyon"

    # 2. Mise à jour du widget
    update_res = client.put(
        f"/api/v1/admin/users/{target_user.id}/widgets/{widget_id}",
        json={"title": "Météo Lyon Centre", "refresh_rate": 45},
        headers=headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["title"] == "Météo Lyon Centre"
    assert update_res.json()["refresh_rate"] == 45

    # 3. Suppression du widget
    del_res = client.delete(
        f"/api/v1/admin/users/{target_user.id}/widgets/{widget_id}",
        headers=headers,
    )
    assert del_res.status_code == 200
