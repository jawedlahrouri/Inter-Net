import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.db.session import Base
from app.api.deps import get_db
from app.main import app

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """
    @brief Session-scoped autouse fixture that creates all tables in the in-memory test database and drops them afterwards.
    @return Yields once so tests run between table creation and teardown, returning no value.
    """
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db_session():
    """
    @brief Fixture providing a database session bound to a transaction that is rolled back after each test.
    @return Yields a SQLAlchemy test session tied to a rolled-back transaction.
    """
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture()
def client(db_session):
    """
    @brief Fixture providing a FastAPI TestClient whose get_db dependency is overridden with the test session.
    @param db_session The transactional test database session injected by the db_session fixture.
    @return Yields a TestClient for the app and clears dependency overrides afterwards.
    """
    def override_get_db():
        """
        @brief Replacement get_db dependency that yields the shared test session instead of a real one.
        @return Yields the test database session without closing it.
        """
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
