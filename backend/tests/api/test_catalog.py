import pytest


@pytest.mark.parametrize(
    "path,key",
    [
        ("/api/v1/catalog/tools", "tools"),
        ("/api/v1/catalog/models", "models"),
        ("/api/v1/catalog/mcp-servers", "servers"),
        ("/api/v1/catalog/presets", "presets"),
        ("/api/v1/catalog/handoff-conditions", "conditions"),
    ],
)
def test_catalog_endpoints(client, path, key):
    r = client.get(path)
    assert r.status_code == 200
    body = r.json()
    assert key in body
    assert isinstance(body[key], list)
    assert body[key]


def test_handoff_conditions_payload_shape(client):
    r = client.get("/api/v1/catalog/handoff-conditions")
    body = r.json()
    assert len(body["conditions"]) == 4
    first = body["conditions"][0]
    assert {"id", "labelEn", "labelPtBr"} <= first.keys()
