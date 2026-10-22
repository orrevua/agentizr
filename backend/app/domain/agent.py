from typing import Any

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.domain._slug import _SLUG_RE, slugify
from app.domain.enums import (
    ActivationMode,
    Memory,
    Platform,
    ReasoningEffort,
    Scope,
)


class AgentDefinition(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        use_enum_values=False,
        extra="forbid",
    )

    name: str = Field(min_length=2, max_length=80)
    slug: str = Field(pattern=_SLUG_RE.pattern)
    description: str = Field(min_length=5, max_length=300)
    instructions: str = Field(min_length=10, max_length=50_000)

    tools: list[str] = Field(default_factory=list)
    mcp_servers: list[str] = Field(default_factory=list, alias="mcpServers")

    apply_to_globs: list[str] = Field(default_factory=list, alias="applyToGlobs")
    activation_mode: ActivationMode = Field(default=ActivationMode.auto, alias="activationMode")

    model: str = "inherit"
    reasoning_effort: ReasoningEffort = Field(
        default=ReasoningEffort.medium, alias="reasoningEffort"
    )

    scope: Scope = Scope.project
    memory: Memory = Memory.project

    target_platforms: list[Platform] = Field(alias="targetPlatforms", min_length=1)

    @model_validator(mode="before")
    @classmethod
    def _auto_slug(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            return data
        slug = data.get("slug")
        if slug:
            return data
        name = data.get("name")
        if isinstance(name, str) and name.strip():
            data["slug"] = slugify(name)
        return data
