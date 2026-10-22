from app.domain.agent import AgentDefinition
from app.domain.enums import OutputLanguage
from app.domain.skill import SkillDefinition
from app.domain.workflow import Workflow
from app.domain.workspace import WorkspaceDefinition


def make_agent(**overrides) -> AgentDefinition:
    payload = {
        "name": "Security Reviewer",
        "description": "Scans code for vulnerabilities",
        "instructions": "You are a security expert. Always check for SQL injection.",
        "targetPlatforms": ["claude-code"],
    }
    payload.update(overrides)
    return AgentDefinition.model_validate(payload)


def make_skill(**overrides) -> SkillDefinition:
    payload = {
        "name": "Code Searcher",
        "description": "Searches code intelligently",
        "instructions": "Use ripgrep when available.",
        "platforms": ["claude-code"],
    }
    payload.update(overrides)
    return SkillDefinition.model_validate(payload)


def make_workspace(
    *,
    agent: AgentDefinition | None = None,
    agents: list[AgentDefinition] | None = None,
    skills: list[SkillDefinition] | None = None,
    workflow: Workflow | None = None,
    output_language: OutputLanguage | str = OutputLanguage.en,
    **agent_overrides,
) -> WorkspaceDefinition:
    if agents is None:
        agents = [agent or make_agent(**agent_overrides)]
    return WorkspaceDefinition(
        agents=agents,
        skills=skills or [],
        workflow=workflow or Workflow(),
        output_language=OutputLanguage(output_language)
        if isinstance(output_language, str)
        else output_language,
    )
