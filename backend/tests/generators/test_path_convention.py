from app.generators.registry import generate_workspace
from tests.factories import make_agent, make_skill, make_workspace

_ALL_PLATFORMS = ["claude-code", "copilot", "codex", "gemini", "cursor", "windsurf"]

_EXPECTED = {
    "claude-code/.claude/agents/alpha.md",
    "copilot/.github/agents/alpha.agent.md",
    "codex/.codex/agents/alpha.toml",
    "codex/.codex/config.toml",
    "gemini/.gemini/agents/alpha.md",
    "cursor/.cursor/rules/alpha.mdc",
    "windsurf/.windsurf/rules/alpha.md",
    "claude-code/.claude/agents/beta.md",
    "copilot/.github/agents/beta.agent.md",
    "codex/.codex/agents/beta.toml",
    "gemini/.gemini/agents/beta.md",
    "cursor/.cursor/rules/beta.mdc",
    "windsurf/.windsurf/rules/beta.md",
    "claude-code/skills/searcher/SKILL.md",
    "gemini/skills/searcher/SKILL.md",
    "universal/AGENTS.md",
    "workflow.json",
    "README.md",
}


def test_full_layout_matches_spec():
    a = make_agent(name="Alpha", slug="alpha", targetPlatforms=_ALL_PLATFORMS)
    b = make_agent(name="Beta", slug="beta", targetPlatforms=_ALL_PLATFORMS)
    s = make_skill(name="Searcher", slug="searcher", platforms=["claude-code", "gemini"])
    result = generate_workspace(make_workspace(agents=[a, b], skills=[s]))
    paths = {f.path for f in result.files}
    assert paths == _EXPECTED
