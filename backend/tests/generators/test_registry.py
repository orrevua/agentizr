from app.domain.enums import Platform
from app.generators.registry import GENERATORS, generate_workspace
from tests.factories import make_agent, make_skill, make_workspace


def test_all_platforms_registered():
    assert set(GENERATORS) == set(Platform)


def test_generate_workspace_includes_agents_md_readme_and_workflow_json():
    result = generate_workspace(make_workspace(targetPlatforms=["claude-code"]))
    paths = [f.path for f in result.files]
    assert "claude-code/.claude/agents/security-reviewer.md" in paths
    assert "universal/AGENTS.md" in paths
    assert "README.md" in paths
    assert "workflow.json" in paths


def test_generate_workspace_runs_for_all_platforms():
    w = make_workspace(
        targetPlatforms=["claude-code", "copilot", "codex", "gemini", "cursor", "windsurf"],
        applyToGlobs=["src/**/*.ts"],
    )
    result = generate_workspace(w)
    assert len(result.files) >= 7


def test_generate_workspace_two_agents_produces_separate_folders():
    a = make_agent(name="Alpha", slug="alpha")
    b = make_agent(name="Beta", slug="beta")
    result = generate_workspace(make_workspace(agents=[a, b]))
    paths = {f.path for f in result.files}
    assert "claude-code/.claude/agents/alpha.md" in paths
    assert "claude-code/.claude/agents/beta.md" in paths


def test_generate_workspace_emits_skill_files():
    result = generate_workspace(
        make_workspace(skills=[make_skill(platforms=["claude-code", "gemini"])])
    )
    paths = {f.path for f in result.files}
    assert "claude-code/skills/code-searcher/SKILL.md" in paths
    assert "gemini/skills/code-searcher/SKILL.md" in paths


def test_file_order_agents_then_skills_then_agents_md_then_workflow_then_readme():
    a = make_agent(name="Alpha", slug="alpha")
    result = generate_workspace(
        make_workspace(agents=[a], skills=[make_skill(platforms=["claude-code"])])
    )
    paths = [f.path for f in result.files]
    agent_idx = paths.index("claude-code/.claude/agents/alpha.md")
    skill_idx = paths.index("claude-code/skills/code-searcher/SKILL.md")
    am_idx = paths.index("universal/AGENTS.md")
    wf_idx = paths.index("workflow.json")
    rm_idx = paths.index("README.md")
    assert agent_idx < skill_idx < am_idx < wf_idx < rm_idx
