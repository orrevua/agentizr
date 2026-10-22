from app.domain.enums import OutputLanguage
from app.domain.workflow import Workflow
from app.generators.claude_code import generate_claude_code
from tests.factories import make_agent


def _call(d, workflow=None, agents=None):
    return generate_claude_code(
        d, OutputLanguage.en, workflow or Workflow(), agents or [d]
    )


def test_path_and_basic_frontmatter():
    d = make_agent(tools=["Bash", "Read", "Grep"])
    files = _call(d)
    assert len(files) == 1
    f = files[0]
    assert f.path == "claude-code/.claude/agents/security-reviewer.md"
    assert 'tools: "Bash, Read, Grep"' in f.content
    assert "model: inherit" in f.content
    assert "memory: project" in f.content


def test_omits_memory_when_none():
    f = _call(make_agent(memory="none"))[0]
    assert "memory:" not in f.content


def test_omits_tools_when_empty():
    f = _call(make_agent(tools=[]))[0]
    assert "tools:" not in f.content


def test_body_contains_instructions():
    d = make_agent(instructions="Do the thing.\nThen do another.")
    f = _call(d)[0]
    assert "Do the thing." in f.content


def test_two_agents_produce_sibling_folders():
    a = make_agent(name="Alpha", slug="alpha")
    b = make_agent(name="Beta", slug="beta")
    fa = _call(a, agents=[a, b])[0]
    fb = _call(b, agents=[a, b])[0]
    assert fa.path == "claude-code/.claude/agents/alpha.md"
    assert fb.path == "claude-code/.claude/agents/beta.md"


def test_handoff_block_appended_when_outgoing_edge():
    from app.domain.workflow import WorkflowEdge

    a = make_agent(name="Alpha", slug="alpha")
    b = make_agent(name="Beta", slug="beta")
    wf = Workflow(
        edges=[WorkflowEdge(id="e1", source="alpha", target="beta", condition="done")]
    )
    f = _call(a, workflow=wf, agents=[a, b])[0]
    assert "## Handoffs" in f.content
    assert "@beta" in f.content
