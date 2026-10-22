def test_validation_error_shape(client):
    r = client.post("/api/v1/preview", json={"name": "x"})
    assert r.status_code == 422
    body = r.json()
    assert body["error"] == "validation_failed"
    assert isinstance(body["details"], list)
    assert all("field" in d and "message" in d for d in body["details"])
