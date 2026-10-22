from pydantic import BaseModel, ConfigDict, Field

from app.domain._slug import _SLUG_RE


class Position(BaseModel):
    model_config = ConfigDict(extra="forbid")
    x: float
    y: float


class WorkflowNode(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str = Field(pattern=_SLUG_RE.pattern)
    position: Position


class WorkflowEdge(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str = Field(min_length=1)
    source: str = Field(pattern=_SLUG_RE.pattern)
    target: str = Field(pattern=_SLUG_RE.pattern)
    label: str | None = Field(default=None, max_length=120)
    condition: str | None = Field(default=None, max_length=200)


class Workflow(BaseModel):
    model_config = ConfigDict(extra="forbid")
    nodes: list[WorkflowNode] = Field(default_factory=list)
    edges: list[WorkflowEdge] = Field(default_factory=list)
