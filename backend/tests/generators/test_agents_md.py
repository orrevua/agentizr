from app.generators.agents_md import generate_agents_md
from tests.factories import make_agent, make_workspace


def test_no_frontmatter():
    f = generate_agents_md(make_workspace())[0]
    assert not f.content.startswith("---")


def test_contains_workspace_title_and_agent_h3():
    f = generate_agents_md(make_workspace())[0]
    assert "# Agentizr Workspace" in f.content
    assert "### Security Reviewer" in f.content


def test_tools_bullets():
    f = generate_agents_md(make_workspace(tools=["Read", "Grep"]))[0]
    assert "- Read" in f.content
    assert "- Grep" in f.content


def test_locale_pt_br():
    f = generate_agents_md(make_workspace(output_language="pt-br"))[0]
    assert "### Instruções" in f.content
    assert "# Workspace Agentizr" in f.content


def test_two_agents_two_sections():
    a = make_agent(name="Alpha", slug="alpha")
    b = make_agent(name="Beta", slug="beta")
    f = generate_agents_md(make_workspace(agents=[a, b]))[0]
    assert "### Alpha" in f.content
    assert "### Beta" in f.content


def test_empty_tools_uses_placeholder():
    f = generate_agents_md(make_workspace(tools=[]))[0]
    assert "_No specific tools configured._" in f.content
