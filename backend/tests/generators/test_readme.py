from app.domain.workflow import Workflow, WorkflowEdge
from app.generators.readme import generate_readme
from app.generators.registry import generate_workspace
from tests.factories import make_agent, make_skill, make_workspace


def test_readme_lists_agents_and_skills():
    a = make_agent(name="Alpha", slug="alpha")
    b = make_agent(name="Beta", slug="beta")
    wf = Workflow(
        edges=[WorkflowEdge(id="e1", source="alpha", target="beta", condition="done")]
    )
    w = make_workspace(agents=[a, b], skills=[make_skill()], workflow=wf)
    result = generate_workspace(w)
    readme = next(f for f in result.files if f.path == "README.md")
    assert "### Alpha (`@alpha`)" in readme.content
    assert "### Beta (`@beta`)" in readme.content
    assert "### Code Searcher (`code-searcher`)" in readme.content
    assert "flowchart LR" in readme.content
    assert "alpha -->|done| beta" in readme.content


def test_readme_locale_pt_br():
    w = make_workspace(output_language="pt-br")
    result = generate_workspace(w)
    readme = next(f for f in result.files if f.path == "README.md")
    assert "# Workspace Agentizr" in readme.content


def test_cycle_note_present_when_cycle():
    a = make_agent(name="Alpha", slug="alpha")
    b = make_agent(name="Beta", slug="beta")
    wf = Workflow(
        edges=[
            WorkflowEdge(id="e1", source="alpha", target="beta"),
            WorkflowEdge(id="e2", source="beta", target="alpha"),
        ]
    )
    result = generate_workspace(make_workspace(agents=[a, b], workflow=wf))
    readme = next(f for f in result.files if f.path == "README.md")
    assert "contains cycles" in readme.content.lower()


def test_generate_readme_direct_with_excerpt():
    w = make_workspace()
    f = generate_readme(w, [], '{"agents": []}')
    assert "workflow.json" in f.content
    assert '"agents": []' in f.content


def test_handoffs_block_for_agent_with_no_outgoing_shows_none():
    a = make_agent(name="Alpha", slug="alpha")
    result = generate_workspace(make_workspace(agents=[a]))
    readme = next(f for f in result.files if f.path == "README.md")
    assert "none" in readme.content
