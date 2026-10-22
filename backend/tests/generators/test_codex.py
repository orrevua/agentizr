import tomllib

from app.domain.enums import OutputLanguage
from app.domain.workflow import Workflow
from app.generators.codex import generate_codex
from tests.factories import make_agent


def _call(d):
    return generate_codex(d, OutputLanguage.en, Workflow(), [d])


def test_two_files_emitted():
    files = _call(make_agent())
    paths = [f.path for f in files]
    assert "codex/.codex/agents/security-reviewer.toml" in paths
    assert "codex/.codex/config.toml" in paths


def test_agent_toml_round_trips():
    files = _call(make_agent(tools=["Read"], mcpServers=["filesystem"]))
    agent_file = next(f for f in files if f.path.endswith("/security-reviewer.toml"))
    parsed = tomllib.loads(agent_file.content)
    assert parsed["name"] == "Security Reviewer"
    assert parsed["mcp_servers"] == ["Read", "filesystem"]
    assert parsed["model_reasoning_effort"] == "medium"


def test_config_underscores_slug():
    files = _call(make_agent(name="Security Reviewer"))
    config = next(f for f in files if f.path.endswith("/config.toml"))
    parsed = tomllib.loads(config.content)
    assert "security_reviewer" in parsed["agents"]
    assert parsed["agents"]["security_reviewer"]["config_file"] == "agents/security-reviewer.toml"


def test_mcp_dedup():
    files = _call(make_agent(tools=["Read"], mcpServers=["Read", "github"]))
    agent_file = next(f for f in files if f.path.endswith("/security-reviewer.toml"))
    parsed = tomllib.loads(agent_file.content)
    assert parsed["mcp_servers"] == ["Read", "github"]


def test_two_agents_produce_sibling_folders():
    a = make_agent(name="Alpha", slug="alpha")
    b = make_agent(name="Beta", slug="beta")
    fa = generate_codex(a, OutputLanguage.en, Workflow(), [a, b])
    fb = generate_codex(b, OutputLanguage.en, Workflow(), [a, b])
    assert any(p.path == "codex/.codex/agents/alpha.toml" for p in fa)
    assert any(p.path == "codex/.codex/agents/beta.toml" for p in fb)
