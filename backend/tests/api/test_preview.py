def _agent_payload(**overrides):
    base = {
        "name": "Security Reviewer",
        "description": "Scans code for vulnerabilities",
        "instructions": "You are a security expert. Always check for SQL injection.",
        "targetPlatforms": ["claude-code"],
    }
    base.update(overrides)
    return base


def _workspace_payload(**overrides):
    return {"agents": [_agent_payload(**overrides)]}


def test_preview_returns_files(client):
    r = client.post("/api/v1/preview", json=_workspace_payload())
    assert r.status_code == 200
    body = r.json()
    paths = [f["path"] for f in body["files"]]
    assert "claude-code/.claude/agents/security-reviewer.md" in paths
    assert "universal/AGENTS.md" in paths
    assert "README.md" in paths
    assert "workflow.json" in paths


def test_preview_rejects_empty_platforms(client):
    r = client.post("/api/v1/preview", json=_workspace_payload(targetPlatforms=[]))
    assert r.status_code == 422
    body = r.json()
    assert body["error"] == "validation_failed"
    assert any("targetPlatforms" in d["field"] for d in body["details"])


def test_preview_rejects_empty_agents(client):
    r = client.post("/api/v1/preview", json={"agents": []})
    assert r.status_code == 422
