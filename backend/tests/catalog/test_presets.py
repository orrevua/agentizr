from app.catalog.presets import PRESETS
from app.catalog.tools import TOOLS
from app.domain.agent import AgentDefinition


def test_eight_presets():
    assert len(PRESETS) == 8


def test_preset_tools_subset_of_catalog():
    catalog_names = {t.name for t in TOOLS}
    for p in PRESETS:
        for tool in p.definition.get("tools", []):
            assert tool in catalog_names, f"{p.id} references unknown tool {tool}"


def test_presets_round_trip_through_agent_definition():
    for p in PRESETS:
        merged = {
            "name": p.label,
            "description": p.description,
            "targetPlatforms": ["claude-code"],
            **p.definition,
        }
        AgentDefinition.model_validate(merged)
