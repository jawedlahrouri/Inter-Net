from unittest.mock import patch
from app.core.config import settings
from app.api.v1.endpoints.quotes import FRENCH_QUOTES


def test_get_random_quote_success(client):
    response = client.get(f"{settings.API_PREFIX}/quotes/random")
    assert response.status_code == 200
    data = response.json()
    assert "quote" in data
    assert "author" in data
    assert len(data["quote"]) > 0
    assert len(data["author"]) > 0


def test_get_random_quote_fallback_on_network_error(client):
    with patch("httpx.AsyncClient.get", side_effect=Exception("Network failure")):
        response = client.get(f"{settings.API_PREFIX}/quotes/random")
        assert response.status_code == 200
        data = response.json()
        assert any(q["quote"] == data["quote"] and q["author"] == data["author"] for q in FRENCH_QUOTES)
