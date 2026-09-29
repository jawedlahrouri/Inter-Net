import pytest
from app.models.user import User
from app.core.security import create_access_token


def test_unverified_user_cannot_access_protected_endpoints(client, db_session):
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "blocked@example.com",
            "username": "blockeduser",
            "password": "password123",
        },
    )
    user = db_session.query(User).filter(User.email == "blocked@example.com").first()
    assert user is not None
    assert user.is_verified is False

    fake_token = create_access_token(subject=user.id)
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {fake_token}"},
    )
    assert response.status_code == 403
    assert "non vérifié" in response.json()["detail"].lower() or "confirmer" in response.json()["detail"].lower()


def test_full_email_verification_lifecycle(client, db_session):
    reg_resp = client.post(
        "/api/v1/auth/register",
        json={
            "email": "lifecycle@example.com",
            "username": "lifecycleuser",
            "password": "password123",
        },
    )
    assert reg_resp.status_code == 201
    assert reg_resp.json()["is_verified"] is False

    login_fail = client.post(
        "/api/v1/auth/login",
        json={
            "identifier": "lifecycle@example.com",
            "password": "password123",
        },
    )
    assert login_fail.status_code == 403

    user = db_session.query(User).filter(User.email == "lifecycle@example.com").first()
    token = user.verification_token
    assert token is not None

    verify_resp = client.post(
        "/api/v1/auth/verify-email",
        json={"token": token},
    )
    assert verify_resp.status_code == 200
    assert verify_resp.json()["is_verified"] is True

    db_session.refresh(user)
    assert user.is_verified is True
    assert user.verification_token is None

    re_verify = client.post(
        "/api/v1/auth/verify-email",
        json={"token": token},
    )
    assert re_verify.status_code == 400

    login_success = client.post(
        "/api/v1/auth/login",
        json={
            "identifier": "lifecycle@example.com",
            "password": "password123",
        },
    )
    assert login_success.status_code == 200
    jwt_token = login_success.json()["access_token"]

    me_resp = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {jwt_token}"},
    )
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "lifecycle@example.com"
