def test_register_success(client):
    """
    @brief Tests that registering a new user returns 201 with an access token and the created user data.
    @param client The test client fixture used to call the API.
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
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "testuser@example.com"
    assert data["user"]["username"] == "testuser"
    assert data["user"]["role"] == "user"


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


def test_login_with_email_and_username(client):
    """
    @brief Tests that a registered user can log in with either their email or their username.
    @param client The test client fixture used to call the API.
    """
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "loginuser@example.com",
            "username": "loginuser",
            "password": "correctpassword",
        },
    )

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


def test_login_wrong_password(client):
    """
    @brief Tests that logging in with a wrong password returns a 401 status.
    @param client The test client fixture used to call the API.
    """
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "failpass@example.com",
            "username": "failpass",
            "password": "correctpassword",
        },
    )
    response = client.post(
        "/api/v1/auth/login",
        json={
            "identifier": "failpass@example.com",
            "password": "wrongpassword",
        },
    )
    assert response.status_code == 401


def test_get_me_authenticated(client):
    """
    @brief Tests that the me endpoint returns the profile of the user identified by a valid bearer token.
    @param client The test client fixture used to call the API.
    """
    reg_resp = client.post(
        "/api/v1/auth/register",
        json={
            "email": "me@example.com",
            "username": "meuser",
            "password": "password123",
        },
    )
    token = reg_resp.json()["access_token"]

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


def test_user_settings_dashboards(client):
    """
    @brief Tests reading the default dashboard settings and updating multiple dashboards through the settings endpoints.
    @param client The test client fixture used to call the API.
    """
    reg_resp = client.post(
        "/api/v1/auth/register",
        json={
            "email": "dashuser@example.com",
            "username": "dashuser",
            "password": "password123",
        },
    )
    token = reg_resp.json()["access_token"]
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


