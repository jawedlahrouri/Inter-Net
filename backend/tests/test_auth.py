from app.models.user import User


def test_register_success(client, db_session):
    """
    @brief Tests that registering a new user returns 201 with an access token and the created user data.
    @param client The test client fixture used to call the API.
    @param db_session The test database session.
    """
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "testuser@example.com",
            "username": "testuser",
            "password": "strongpassword123",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "testuser@example.com"
    assert data["username"] == "testuser"
    assert data["is_verified"] is False
    assert "access_token" not in data

    user = db_session.query(User).filter(User.email == "testuser@example.com").first()
    assert user is not None
    assert user.is_verified is False
    assert user.verification_token is not None


def test_login_blocked_unverified(client):
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "unverified@example.com",
            "username": "unverified",
            "password": "password123",
        },
    )
    response = client.post(
        "/api/v1/auth/login",
        json={
            "identifier": "unverified@example.com",
            "password": "password123",
        },
    )
    assert response.status_code == 403
    assert "activé" in response.json()["detail"].lower() or "mail" in response.json()["detail"].lower()


def test_verify_email_success_and_login(client, db_session):
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "verify_me@example.com",
            "username": "verifyme",
            "password": "password123",
        },
    )
    user = db_session.query(User).filter(User.email == "verify_me@example.com").first()
    token = user.verification_token

    verify_resp = client.post(
        "/api/v1/auth/verify-email",
        json={"token": token},
    )
    assert verify_resp.status_code == 200
    assert verify_resp.json()["is_verified"] is True

    db_session.refresh(user)
    assert user.is_verified is True
    assert user.verification_token is None
    login_resp = client.post(
        "/api/v1/auth/login",
        json={
            "identifier": "verify_me@example.com",
            "password": "password123",
        },
    )
    assert login_resp.status_code == 200
    assert "access_token" in login_resp.json()


def test_verify_email_invalid_token(client):
    response = client.post(
        "/api/v1/auth/verify-email",
        json={"token": "fake-invalid-token-12345"},
    )
    assert response.status_code == 400


def test_verify_email_get_redirect(client, db_session):
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "get_redirect@example.com",
            "username": "getredirect",
            "password": "password123",
        },
    )
    user = db_session.query(User).filter(User.email == "get_redirect@example.com").first()
    token = user.verification_token

    resp = client.get(f"/api/v1/auth/verify-email?token={token}", follow_redirects=False)
    assert resp.status_code in (303, 307)
    assert "verified=true" in resp.headers["location"]


def test_resend_verification(client, db_session):
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "resend@example.com",
            "username": "resenduser",
            "password": "password123",
        },
    )
    user = db_session.query(User).filter(User.email == "resend@example.com").first()
    old_token = user.verification_token

    resp = client.post(
        "/api/v1/auth/resend-verification",
        json={"email": "resend@example.com"},
    )
    assert resp.status_code == 200

    db_session.refresh(user)
    assert user.verification_token != old_token


def test_register_duplicate_email(client):
    """
    @brief Tests that registering twice with the same email is rejected with a 400 error mentioning the email.
    @param client The test client fixture used to call the API.
    """
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "duplicate@example.com",
            "username": "user1",
            "password": "password123",
        },
    )
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "duplicate@example.com",
            "username": "user2",
            "password": "password123",
        },
    )
    assert response.status_code == 400
    assert "email" in response.json()["detail"].lower()


def test_register_duplicate_username(client):
    """
    @brief Tests that registering twice with the same username is rejected with a 400 error mentioning the username.
    @param client The test client fixture used to call the API.
    """
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "first@example.com",
            "username": "samename",
            "password": "password123",
        },
    )
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "second@example.com",
            "username": "samename",
            "password": "password123",
        },
    )
    assert response.status_code == 400
    assert "nom d'utilisateur" in response.json()["detail"].lower()


def test_login_with_email_and_username(client, db_session):
    """
    @brief Tests that a registered user can log in with either their email or their username.
    @param client The test client fixture used to call the API.
    @param db_session The test database session.
    """
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "loginuser@example.com",
            "username": "loginuser",
            "password": "correctpassword",
        },
    )
    user = db_session.query(User).filter(User.email == "loginuser@example.com").first()
    user.is_verified = True
    db_session.commit()

    resp_email = client.post(
        "/api/v1/auth/login",
        json={
            "identifier": "loginuser@example.com",
            "password": "correctpassword",
        },
    )
    assert resp_email.status_code == 200
    assert "access_token" in resp_email.json()

    resp_username = client.post(
        "/api/v1/auth/login",
        json={
            "identifier": "loginuser",
            "password": "correctpassword",
        },
    )
    assert resp_username.status_code == 200
    assert "access_token" in resp_username.json()


def test_login_wrong_password(client, db_session):
    """
    @brief Tests that logging in with a wrong password returns a 401 status.
    @param client The test client fixture used to call the API.
    @param db_session The test database session.
    """
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "failpass@example.com",
            "username": "failpass",
            "password": "correctpassword",
        },
    )
    user = db_session.query(User).filter(User.email == "failpass@example.com").first()
    user.is_verified = True
    db_session.commit()

    response = client.post(
        "/api/v1/auth/login",
        json={
            "identifier": "failpass@example.com",
            "password": "wrongpassword",
        },
    )
    assert response.status_code == 401


def test_get_me_authenticated(client, db_session):
    """
    @brief Tests that the me endpoint returns the profile of the user identified by a valid bearer token.
    @param client The test client fixture used to call the API.
    @param db_session The test database session.
    """
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "me@example.com",
            "username": "meuser",
            "password": "password123",
        },
    )
    user = db_session.query(User).filter(User.email == "me@example.com").first()
    user.is_verified = True
    db_session.commit()

    login_resp = client.post(
        "/api/v1/auth/login",
        json={"identifier": "me@example.com", "password": "password123"},
    )
    token = login_resp.json()["access_token"]

    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "me@example.com"
    assert data["username"] == "meuser"


def test_get_me_unauthorized(client):
    """
    @brief Tests that the me endpoint returns 401 when no token is provided.
    @param client The test client fixture used to call the API.
    """
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_user_settings_dashboards(client, db_session):
    """
    @brief Tests reading the default dashboard settings and updating multiple dashboards through the settings endpoints.
    @param client The test client fixture used to call the API.
    @param db_session The test database session.
    """
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "dashuser@example.com",
            "username": "dashuser",
            "password": "password123",
        },
    )
    user = db_session.query(User).filter(User.email == "dashuser@example.com").first()
    user.is_verified = True
    db_session.commit()

    login_resp = client.post(
        "/api/v1/auth/login",
        json={"identifier": "dashuser@example.com", "password": "password123"},
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    get_resp = client.get("/api/v1/auth/me/settings", headers=headers)
    assert get_resp.status_code == 200
    data = get_resp.json()
    assert "dashboards" in data
    assert len(data["dashboards"]) == 1
    assert data["dashboards"][0]["id"] == "default"

    patch_resp = client.patch(
        "/api/v1/auth/me/settings",
        headers=headers,
        json={
            "dashboards": [
                {
                    "id": "default",
                    "name": "Principal",
                    "primary_color": "#112233",
                    "secondary_color": "#223344",
                    "tertiary_color": "#334455",
                    "background_image": "/api/v1/storage/custom_bg/bg1.png",
                },
                {"id": "dev", "name": "Développement"},
            ]
        },
    )
    assert patch_resp.status_code == 200
    updated_data = patch_resp.json()
    assert len(updated_data["dashboards"]) == 2
    assert updated_data["dashboards"][0]["primary_color"] == "#112233"
    assert updated_data["dashboards"][0]["background_image"] == "/api/v1/storage/custom_bg/bg1.png"
    assert updated_data["dashboards"][1]["name"] == "Développement"
    assert updated_data["dashboards"][1]["primary_color"] == "#0b0f19"
