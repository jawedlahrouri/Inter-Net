from app.core.config import settings


def test_root_endpoint(client):
    """
    @brief Tests that the root endpoint returns 200 with a message and the docs URL.
    @param client The FastAPI test client fixture.
    """
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert data["docs"] == f"{settings.API_PREFIX}/docs"


def test_health_endpoint(client):
    """
    @brief Tests that the health endpoint returns 200 with status ok, version, timestamp and service name.
    @param client The FastAPI test client fixture.
    """
    response = client.get(f"{settings.API_PREFIX}/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["version"] == settings.VERSION
    assert "timestamp" in data
    assert data["service"] == settings.PROJECT_NAME
