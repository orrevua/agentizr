import pytest
from pydantic import ValidationError

from app.domain.workspace import WorkspaceDefinition


def _agent(slug="agent-a", name=None):
    return {
        "name": name or f"Agent {slug}",
        "slug": slug,
        "description": "An agent",
        "instructions": "Do things carefully.",
        "targetPlatforms": ["claude-code"],
    }


def _skill(slug="skill-a", name=None):
    return {
        "name": name or f"Skill {slug}",
        "slug": slug,
        "description": "A skill",
        "instructions": "Do things skillfully.",
        "platforms": ["claude-code"],
    }


def test_minimal_workspace_valid():
    w = WorkspaceDefinition.model_validate({"agents": [_agent()]})
    assert w.output_language.value == "en"
    assert w.skills == []


def test_alias_round_trip():
    w = WorkspaceDefinition.model_validate(
        {"agents": [_agent()], "outputLanguage": "pt-br"}
    )
    assert w.model_dump(by_alias=True)["outputLanguage"] == "pt-br"


def test_rejects_empty_agents():
    with pytest.raises(ValidationError):
        WorkspaceDefinition.model_validate({"agents": []})


def test_rejects_more_than_ten_agents():
    agents = [_agent(slug=f"agent-{i}") for i in range(11)]
    with pytest.raises(ValidationError):
        WorkspaceDefinition.model_validate({"agents": agents})


def test_rejects_duplicate_agent_slug():
    with pytest.raises(ValidationError) as ei:
        WorkspaceDefinition.model_validate(
            {"agents": [_agent(slug="x"), _agent(slug="x")]}
        )
    assert "duplicate" in str(ei.value)


def test_rejects_slug_collision_agent_skill():
    with pytest.raises(ValidationError) as ei:
        WorkspaceDefinition.model_validate(
            {"agents": [_agent(slug="shared")], "skills": [_skill(slug="shared")]}
        )
    assert "duplicate" in str(ei.value)


def test_rejects_duplicate_skill_slug():
    with pytest.raises(ValidationError):
        WorkspaceDefinition.model_validate(
            {
                "agents": [_agent(slug="a")],
                "skills": [_skill(slug="s"), _skill(slug="s")],
            }
        )


def test_rejects_unknown_edge_endpoint():
    with pytest.raises(ValidationError) as ei:
        WorkspaceDefinition.model_validate(
            {
                "agents": [_agent(slug="a"), _agent(slug="b")],
                "workflow": {
                    "nodes": [],
                    "edges": [{"id": "e1", "source": "a", "target": "ghost"}],
                },
            }
        )
    assert "edge" in str(ei.value)


def test_rejects_unknown_node():
    with pytest.raises(ValidationError) as ei:
        WorkspaceDefinition.model_validate(
            {
                "agents": [_agent(slug="a")],
                "workflow": {
                    "nodes": [{"id": "ghost", "position": {"x": 0, "y": 0}}],
                    "edges": [],
                },
            }
        )
    assert "node" in str(ei.value)


def test_valid_workspace_with_edge():
    w = WorkspaceDefinition.model_validate(
        {
            "agents": [_agent(slug="a"), _agent(slug="b")],
            "workflow": {
                "nodes": [
                    {"id": "a", "position": {"x": 0, "y": 0}},
                    {"id": "b", "position": {"x": 100, "y": 0}},
                ],
                "edges": [
                    {"id": "e1", "source": "a", "target": "b", "condition": "done"}
                ],
            },
        }
    )
    assert len(w.workflow.edges) == 1
