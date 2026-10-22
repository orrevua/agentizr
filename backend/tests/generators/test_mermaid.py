from app.domain.workflow import Workflow, WorkflowEdge, WorkflowNode
from app.generators.mermaid import has_cycle, render_mermaid
from tests.factories import make_agent


def _pos(x=0.0, y=0.0):
    return {"x": x, "y": y}


def test_render_simple_flow():
    a = make_agent(name="Alpha", slug="alpha")
    b = make_agent(name="Beta", slug="beta")
    wf = Workflow(
        nodes=[
            WorkflowNode(id="alpha", position=_pos()),
            WorkflowNode(id="beta", position=_pos(100, 0)),
        ],
        edges=[
            WorkflowEdge(id="e1", source="alpha", target="beta", condition="Task complete")
        ],
    )
    out = render_mermaid(wf, [a, b])
    assert "flowchart LR" in out
    assert 'alpha["Alpha"]' in out
    assert 'beta["Beta"]' in out
    assert "alpha -->|Task complete| beta" in out


def test_render_edge_without_label():
    a = make_agent(name="Alpha", slug="alpha")
    b = make_agent(name="Beta", slug="beta")
    wf = Workflow(edges=[WorkflowEdge(id="e1", source="alpha", target="beta")])
    out = render_mermaid(wf, [a, b])
    assert "alpha --> beta" in out


def test_sanitizes_dashes_in_slug():
    a = make_agent(name="My Agent", slug="my-agent")
    wf = Workflow()
    out = render_mermaid(wf, [a])
    assert 'my_agent["My Agent"]' in out


def test_cycle_detection_two_node():
    wf = Workflow(
        edges=[
            WorkflowEdge(id="e1", source="a", target="b"),
            WorkflowEdge(id="e2", source="b", target="a"),
        ]
    )
    assert has_cycle(wf) is True


def test_cycle_detection_three_node():
    wf = Workflow(
        edges=[
            WorkflowEdge(id="e1", source="a", target="b"),
            WorkflowEdge(id="e2", source="b", target="c"),
            WorkflowEdge(id="e3", source="c", target="a"),
        ]
    )
    assert has_cycle(wf) is True


def test_no_cycle_dag():
    wf = Workflow(
        edges=[
            WorkflowEdge(id="e1", source="a", target="b"),
            WorkflowEdge(id="e2", source="b", target="c"),
        ]
    )
    assert has_cycle(wf) is False


def test_cycle_comment_prepended():
    a = make_agent(name="Alpha", slug="alpha")
    b = make_agent(name="Beta", slug="beta")
    wf = Workflow(
        edges=[
            WorkflowEdge(id="e1", source="alpha", target="beta"),
            WorkflowEdge(id="e2", source="beta", target="alpha"),
        ]
    )
    out = render_mermaid(wf, [a, b])
    assert out.startswith("%% Contains cycles")


def test_label_fallback_uses_edge_label_when_no_condition():
    a = make_agent(name="Alpha", slug="alpha")
    b = make_agent(name="Beta", slug="beta")
    wf = Workflow(edges=[WorkflowEdge(id="e1", source="alpha", target="beta", label="L")])
    out = render_mermaid(wf, [a, b])
    assert "alpha -->|L| beta" in out


def test_has_cycle_empty():
    assert has_cycle(Workflow()) is False
