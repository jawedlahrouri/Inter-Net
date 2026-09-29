import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.db.session import Base
from app.api.deps import get_db
from app.core.config import settings
from app.main import app

settings.MAIL_SUPPRESS_SEND = True

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture()
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

def create_user_token(client, db_session, email: str, username: str, password: str = "password123") -> str:
    from app.models.user import User
    from app.core.security import create_access_token
    client.post(
        "/api/v1/auth/register",
        json={"email": email, "username": username, "password": password},
    )
    user = db_session.query(User).filter(User.email == email).first()
    if user:
        user.is_verified = True
        db_session.commit()
        return create_access_token(subject=user.id)
    return ""
