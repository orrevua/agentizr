import pytest
from pydantic import ValidationError

from app.domain.workflow import Position, Workflow, WorkflowEdge, WorkflowNode


def test_node_requires_slug_id():
    with pytest.raises(ValidationError):
        WorkflowNode(id="Bad ID", position=Position(x=0, y=0))


def test_edge_accepts_arbitrary_id():
    e = WorkflowEdge(id="01HXYZ-anything_123", source="a", target="b")
    assert e.id == "01HXYZ-anything_123"


def test_edge_label_and_condition_optional():
    e = WorkflowEdge(id="e1", source="a", target="b")
    assert e.label is None
    assert e.condition is None


def test_workflow_defaults_empty():
    w = Workflow()
    assert w.nodes == []
    assert w.edges == []


def test_workflow_extra_forbid():
    with pytest.raises(ValidationError):
        Workflow.model_validate({"nodes": [], "edges": [], "extra": 1})


def test_edge_rejects_empty_id():
    with pytest.raises(ValidationError):
        WorkflowEdge(id="", source="a", target="b")
