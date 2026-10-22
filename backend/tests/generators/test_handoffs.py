import pytest

from app.domain.enums import OutputLanguage
from app.domain.workflow import Workflow, WorkflowEdge
from app.generators.handoffs import render_handoffs
from tests.factories import make_agent


def test_no_edges_returns_empty():
    a = make_agent(name="Alpha", slug="alpha")
    assert render_handoffs(a, Workflow(), [a], OutputLanguage.en) == ""


def test_only_outgoing_edges_considered():
    a = make_agent(name="Alpha", slug="alpha")
    b = make_agent(name="Beta", slug="beta")
    wf = Workflow(
        edges=[WorkflowEdge(id="e1", source="beta", target="alpha", condition="ack")]
    )
    assert render_handoffs(a, wf, [a, b], OutputLanguage.en) == ""


def test_single_edge_with_condition_en():
    a = make_agent(name="Alpha", slug="alpha")
    b = make_agent(name="Beta", slug="beta")
    wf = Workflow(
        edges=[WorkflowEdge(id="e1", source="alpha", target="beta", condition="done")]
    )
    out = render_handoffs(a, wf, [a, b], OutputLanguage.en)
    assert out == "\n\n## Handoffs\n- When done, hand off to `@beta` (Beta)\n"


def test_falls_back_to_label_when_no_condition():
    a = make_agent(name="Alpha", slug="alpha")
    b = make_agent(name="Beta", slug="beta")
    wf = Workflow(
        edges=[WorkflowEdge(id="e1", source="alpha", target="beta", label="L")]
    )
    out = render_handoffs(a, wf, [a, b], OutputLanguage.en)
    assert "When L," in out


def test_applicable_fallback_en():
    a = make_agent(name="Alpha", slug="alpha")
    b = make_agent(name="Beta", slug="beta")
    wf = Workflow(edges=[WorkflowEdge(id="e1", source="alpha", target="beta")])
    out = render_handoffs(a, wf, [a, b], OutputLanguage.en)
    assert "When applicable," in out


def test_pt_br_headers():
    a = make_agent(name="Alpha", slug="alpha")
    b = make_agent(name="Beta", slug="beta")
    wf = Workflow(edges=[WorkflowEdge(id="e1", source="alpha", target="beta")])
    out = render_handoffs(a, wf, [a, b], OutputLanguage.pt_br)
    assert "## Transferências" in out
    assert "Quando aplicável," in out
    assert "transferir para `@beta`" in out


def test_unknown_target_raises_keyerror():
    a = make_agent(name="Alpha", slug="alpha")
    wf = Workflow(edges=[WorkflowEdge(id="e1", source="alpha", target="ghost")])
    with pytest.raises(KeyError):
        render_handoffs(a, wf, [a], OutputLanguage.en)


def test_multiple_edges_bullet_list():
    a = make_agent(name="Alpha", slug="alpha")
    b = make_agent(name="Beta", slug="beta")
    c = make_agent(name="Gamma", slug="gamma")
    wf = Workflow(
        edges=[
            WorkflowEdge(id="e1", source="alpha", target="beta", condition="x"),
            WorkflowEdge(id="e2", source="alpha", target="gamma", condition="y"),
        ]
    )
    out = render_handoffs(a, wf, [a, b, c], OutputLanguage.en)
    assert out.count("- When") == 2
