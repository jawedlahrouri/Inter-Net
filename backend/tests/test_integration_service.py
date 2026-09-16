from app.models.user import User
from app.services.integration_service import (
    get_or_create_service,
    link_user_service,
    get_user_service_status,
    unlink_user_service,
)


def test_integration_service_lifecycle(db_session):
    # 1. Create a test user
    user = User(
        email="gamer@example.com",
        username="gamer123",
        password_hash="fakehash",
        role="user",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    # 2. Get or create service
    service = get_or_create_service(
        db=db_session,
        name="steam",
        display_name="Steam",
        description="Steam gaming platform",
        auth_type="oauth2",
    )
    assert service.id is not None
    assert service.name == "steam"

    # 3. Check status before connecting
    status_before = get_user_service_status(db=db_session, user_id=user.id, service_name="steam")
    assert status_before["connected"] is False

    # 4. Link service
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

    # 5. Check status after connecting
    status_after = get_user_service_status(db=db_session, user_id=user.id, service_name="steam")
    assert status_after["connected"] is True
    assert status_after["profile"]["username"] == "GamerPro"

    # 6. Unlink service
    unlinked = unlink_user_service(db=db_session, user_id=user.id, service_name="steam")
    assert unlinked is True

    # 7. Check status after unlinking
    status_unlinked = get_user_service_status(db=db_session, user_id=user.id, service_name="steam")
    assert status_unlinked["connected"] is False

