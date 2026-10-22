import json

from app.domain.workflow import Workflow, WorkflowEdge, WorkflowNode
from app.generators.workflow_json import emit_workflow_json
from tests.factories import make_agent


def test_emits_at_root_path():
    f = emit_workflow_json(Workflow(), [make_agent()])
    assert f.path == "workflow.json"
    assert f.platform == "universal"


def test_parses_as_json():
    a = make_agent(name="Alpha", slug="alpha")
    b = make_agent(name="Beta", slug="beta")
    wf = Workflow(
        nodes=[WorkflowNode(id="alpha", position={"x": 1.0, "y": 2.0})],
        edges=[
            WorkflowEdge(id="e1", source="alpha", target="beta", condition="done")
        ],
    )
    f = emit_workflow_json(wf, [a, b])
    parsed = json.loads(f.content)
    assert parsed["agents"] == [
        {"slug": "alpha", "name": "Alpha"},
        {"slug": "beta", "name": "Beta"},
    ]
    assert parsed["nodes"][0]["id"] == "alpha"
    assert parsed["edges"][0]["condition"] == "done"


def test_deterministic_output():
    a = make_agent(name="Alpha", slug="alpha")
    wf = Workflow()
    f1 = emit_workflow_json(wf, [a])
    f2 = emit_workflow_json(wf, [a])
    assert f1.content == f2.content
