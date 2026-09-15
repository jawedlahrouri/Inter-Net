from app.core.config import settings


def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert data["docs"] == f"{settings.API_PREFIX}/docs"


def test_health_endpoint(client):
    response = client.get(f"{settings.API_PREFIX}/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["version"] == settings.VERSION
    assert "timestamp" in data
    assert data["service"] == settings.PROJECT_NAME
