from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.domain.agent import AgentDefinition
from app.domain.enums import OutputLanguage
from app.domain.skill import SkillDefinition
from app.domain.workflow import Workflow


class WorkspaceDefinition(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="forbid")

    agents: list[AgentDefinition] = Field(min_length=1, max_length=10)
    skills: list[SkillDefinition] = Field(default_factory=list)
    workflow: Workflow = Field(default_factory=Workflow)
    output_language: OutputLanguage = Field(
        default=OutputLanguage.en, alias="outputLanguage"
    )

    @model_validator(mode="after")
    def _validate_refs_and_uniqueness(self) -> "WorkspaceDefinition":
        agent_slugs = {a.slug for a in self.agents}
        skill_slugs = {s.slug for s in self.skills}
        if len(agent_slugs) != len(self.agents) or agent_slugs & skill_slugs or len(
            skill_slugs
        ) != len(self.skills):
            raise ValueError("workspace.slug.duplicate")
        for node in self.workflow.nodes:
            if node.id not in agent_slugs:
                raise ValueError("workspace.node.unknown_agent")
        for edge in self.workflow.edges:
            if edge.source not in agent_slugs or edge.target not in agent_slugs:
                raise ValueError("workspace.edge.unknown_agent")
        return self
