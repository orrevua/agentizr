import json

from app.domain.agent import AgentDefinition
from app.domain.generated import GeneratedFile
from app.domain.workflow import Workflow


def emit_workflow_json(
    workflow: Workflow, agents: list[AgentDefinition]
) -> GeneratedFile:
    payload = {
        "agents": [{"slug": a.slug, "name": a.name} for a in agents],
        "nodes": [
            n.model_dump(by_alias=True, exclude_none=False) for n in workflow.nodes
        ],
        "edges": [
            e.model_dump(by_alias=True, exclude_none=False) for e in workflow.edges
        ],
    }
    return GeneratedFile(
        path="workflow.json",
        content=json.dumps(payload, indent=2, sort_keys=True) + "\n",
        platform="universal",
        language="text",
    )
