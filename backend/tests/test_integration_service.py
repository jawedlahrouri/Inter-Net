from app.models.user import User
from app.services.integration_service import (
    get_or_create_service,
    link_user_service,
    get_user_service_status,
    unlink_user_service,
)


def test_integration_service_lifecycle(db_session):
    """
    @brief Tests the integration service lifecycle of creating a service, linking it to a user, checking its status and unlinking it.
    @param db_session Database session fixture used to persist the user and service records.
    """
    user = User(
        email="gamer@example.com",
        username="gamer123",
        password_hash="fakehash",
        role="user",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    service = get_or_create_service(
        db=db_session,
        name="steam",
        display_name="Steam",
        description="Steam gaming platform",
        auth_type="oauth2",
    )
    assert service.id is not None
    assert service.name == "steam"

    status_before = get_user_service_status(db=db_session, user_id=user.id, service_name="steam")
    assert status_before["connected"] is False

    user_service = link_user_service(
        db=db_session,
        user_id=user.id,
        service_name="steam",
        access_token="76561198000000000",
        credentials={"username": "GamerPro", "avatar": "https://avatar.url"},
        service_display_name="Steam",
    )
    assert user_service.is_connected is True
    assert user_service.access_token == "76561198000000000"

    status_after = get_user_service_status(db=db_session, user_id=user.id, service_name="steam")
    assert status_after["connected"] is True
    assert status_after["profile"]["username"] == "GamerPro"

    unlinked = unlink_user_service(db=db_session, user_id=user.id, service_name="steam")
    assert unlinked is True

    status_unlinked = get_user_service_status(db=db_session, user_id=user.id, service_name="steam")
    assert status_unlinked["connected"] is False


def test_oauth_token_encryption_at_rest(db_session):
    """
    @brief Verifies that OAuth tokens are encrypted at rest in the database and decrypted on read.
    """
    from sqlalchemy import text
    from app.core.security import encrypt_token, decrypt_token

    raw_token = "gho_secret_github_token_12345"
    user = User(email="dev@example.com", username="dev_tester", password_hash="h", role="user")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    user_service = link_user_service(
        db=db_session,
        user_id=user.id,
        service_name="github",
        access_token=raw_token,
    )

    # 1. Accessing via the ORM returns the decrypted plaintext token
    assert user_service.access_token == raw_token

    # 2. Raw SQL query on the table proves that ciphertext is stored at rest
    raw_db_val = db_session.execute(
        text("SELECT access_token FROM user_services WHERE id = :id"),
        {"id": user_service.id},
    ).scalar()
    assert raw_db_val is not None
    assert raw_db_val != raw_token
    assert raw_db_val.startswith("gAAAAA")

    # 3. Direct decryption helper restores original token
    assert decrypt_token(raw_db_val) == raw_token

    # 4. Fallback on legacy unencrypted token
    assert decrypt_token("legacy_plaintext_token") == "legacy_plaintext_token"


