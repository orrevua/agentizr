import io
import zipfile


def _agent(**overrides):
    base = {
        "name": "Security Reviewer",
        "description": "Scans code for vulnerabilities",
        "instructions": "You are a security expert. Always check for SQL injection.",
        "targetPlatforms": ["claude-code", "codex"],
    }
    base.update(overrides)
    return base


def test_generate_returns_zip_single_agent_filename(client):
    r = client.post("/api/v1/generate", json={"agents": [_agent()]})
    assert r.status_code == 200
    assert r.headers["content-type"] == "application/zip"
    assert "agentizr-security-reviewer.zip" in r.headers["content-disposition"]

    with zipfile.ZipFile(io.BytesIO(r.content)) as zf:
        names = zf.namelist()
        assert "claude-code/.claude/agents/security-reviewer.md" in names
        assert "codex/.codex/agents/security-reviewer.toml" in names
        assert "universal/AGENTS.md" in names
        assert "README.md" in names
        assert "workflow.json" in names


def test_generate_multi_agent_uses_workspace_filename(client):
    payload = {
        "agents": [
            _agent(name="Alpha", slug="alpha"),
            _agent(name="Beta", slug="beta"),
        ]
    }
    r = client.post("/api/v1/generate", json=payload)
    assert r.status_code == 200
    assert "agentizr-workspace.zip" in r.headers["content-disposition"]
    with zipfile.ZipFile(io.BytesIO(r.content)) as zf:
        names = zf.namelist()
        assert "claude-code/.claude/agents/alpha.md" in names
        assert "claude-code/.claude/agents/beta.md" in names
