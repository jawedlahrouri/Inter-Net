def test_about_json(client):
    response = client.get("/about.json")
    assert response.status_code == 200
    data = response.json()

    assert "client" in data
    assert "host" in data["client"]

    assert "server" in data
    assert "current_time" in data["server"]
    assert isinstance(data["server"]["current_time"], int)

    assert "services" in data["server"]
    assert isinstance(data["server"]["services"], list)

    for service in data["server"]["services"]:
        assert "name" in service
        assert "widgets" in service
        for widget in service["widgets"]:
            assert "name" in widget
            assert "params" in widget
            for param in widget["params"]:
                assert "name" in param
                assert "type" in param
                assert param["type"] in ["integer", "string"]
