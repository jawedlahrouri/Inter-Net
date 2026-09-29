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

