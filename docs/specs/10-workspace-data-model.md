# 10 — Workspace Data Model

**Status:** Draft
**Date:** 2026-06-23
**Related:** `01-backend-foundation.md`, `02-backend-generators.md`, `06-frontend-agent-builder.md`, `AGENTIZR-SPEC.md` §3, §6.3
**Supersedes:** the bare `AgentDefinition` request body used by specs 01/02/04.

## Goal
Promote the form's top-level shape from a single `AgentDefinition` to a `WorkspaceDefinition` that bundles ≥1 agents, ≥0 skills, and a workflow graph. Workspace owns the output language. Define Pydantic v2 models (backend) and Zod mirrors (frontend) with explicit validation rules. Backwards compatibility is not required (pre-1.0).

## Decisions

- **One workspace, one zip.** A single API call generates everything; the workspace is the new transport unit.
- **`outputLanguage` lives on the workspace,** not per agent. Mixed-language workspaces are out of scope.
- **`generationType` is removed from `AgentDefinition`** entirely. Generation kind is implicit in the model type (agent vs skill). Root-context and rule kinds are deferred (still out of scope).
- **Slug uniqueness is global** across `agents[*].slug` and `skills[*].slug`. Collisions are rejected at the model layer.
- **Workflow nodes are keyed by agent slug** — not a separate id — so edges remain stable across renames-by-slug. Positions persist as float `x`, `y`.
- **Workflow edges may form cycles.** Validation does not block cycles; the README/Mermaid emitter flags them (spec 14).
- **Max 10 agents per workspace.** Hard ceiling, both ends.

## Pydantic v2 (backend)

`backend/app/domain/agent.py` — `AgentDefinition` loses two fields:

| Removed field        | Why                                                    |
|----------------------|--------------------------------------------------------|
| `output_language`    | Hoisted to `WorkspaceDefinition.output_language`.      |
| `generation_type`    | Implicit per model class; no toggle needed in v0.2.    |

`backend/app/domain/skill.py` — new:
```
class SkillDefinition(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="forbid")
    slug: str = Field(pattern=_SLUG_RE.pattern)
    name: str = Field(min_length=2, max_length=80)
    description: str = Field(min_length=5, max_length=300)
    instructions: str = Field(min_length=10, max_length=50_000)
    platforms: list[Literal["claude-code","gemini"]] = Field(min_length=1)
    scope: Scope = Scope.project
    scaffold_dirs: bool = Field(default=False, alias="scaffoldDirs")
```
Slug auto-derives from name via the same `_slugify` helper (extracted to `domain/_slug.py`).

`backend/app/domain/workflow.py` — new:
```
class WorkflowNode(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str = Field(pattern=_SLUG_RE.pattern)   # equals an agent slug
    position: Position                           # {x: float, y: float}

class WorkflowEdge(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str                                     # ULID/uuid string, opaque
    source: str = Field(pattern=_SLUG_RE.pattern)
    target: str = Field(pattern=_SLUG_RE.pattern)
    label: str | None = Field(default=None, max_length=120)
    condition: str | None = Field(default=None, max_length=200)

class Workflow(BaseModel):
    nodes: list[WorkflowNode] = Field(default_factory=list)
    edges: list[WorkflowEdge] = Field(default_factory=list)
```

`backend/app/domain/workspace.py` — new top-level model:
```
class WorkspaceDefinition(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="forbid")
    agents: list[AgentDefinition] = Field(min_length=1, max_length=10)
    skills: list[SkillDefinition] = Field(default_factory=list)
    workflow: Workflow = Field(default_factory=Workflow)
    output_language: OutputLanguage = Field(default=OutputLanguage.en, alias="outputLanguage")

    @model_validator(mode="after")
    def _validate_refs_and_uniqueness(self) -> "WorkspaceDefinition":
        # 1. slug uniqueness across agents + skills
        # 2. every workflow.node.id is in agent slugs (1:1 by spec — see frontend auto-sync)
        # 3. every workflow.edge.source/target is in agent slugs
        ...
```

## Zod mirror (frontend)

`frontend/src/features/workspace-builder/schema.ts`:
- `skillSchema`, `workflowNodeSchema`, `workflowEdgeSchema`, `workflowSchema`, `workspaceSchema`.
- `agentSchema` updated: drop `outputLanguage`, drop `generationType`.
- `workspaceSchema.refine(...)` re-implements the three cross-field rules so React Hook Form shows them at the workspace level (mapped to a synthetic `root.agents` / `root.workflow.edges` error).

## Validation Rules (authoritative)

| Rule | Surface | Error code |
|---|---|---|
| `len(agents) >= 1` | Pydantic + Zod | `workspace.agents.too_few` |
| `len(agents) <= 10` | Pydantic + Zod | `workspace.agents.too_many` |
| Slugs unique across agents ∪ skills | model_validator + Zod refine | `workspace.slug.duplicate` |
| Every edge `source`/`target` in agent slugs | model_validator + Zod refine | `workspace.edge.unknown_agent` |
| Every workflow node `id` in agent slugs | model_validator + Zod refine | `workspace.node.unknown_agent` |
| Skill `platforms ⊆ {claude-code, gemini}` | Pydantic Literal + Zod enum | `skill.platform.unsupported` |
| Each agent passes existing `AgentDefinition` rules | Pydantic + Zod | unchanged |

Cycles in `workflow.edges` are **allowed** and not flagged here.

## Implementation Units

### Unit 1 — Strip `output_language` and `generation_type` from `AgentDefinition`
- **Files:** `backend/app/domain/agent.py`, `backend/app/domain/enums.py` (keep `GenerationType` enum for now; mark unused), `backend/tests/test_agent_model.py`
- **Change:** Remove the two fields and their aliases; update existing tests to drop those keys.
- **Acceptance:** `uv run pytest backend/tests/test_agent_model.py` green; payloads with `outputLanguage` on an agent now fail with `extra="forbid"`.

### Unit 2 — Extract `_slugify` to `domain/_slug.py`
- **Files:** `backend/app/domain/_slug.py`, `backend/app/domain/agent.py`
- **Change:** Move `_SLUG_RE`, `_NON_ALNUM`, `_slugify` into the new module; re-export from `agent.py` import.
- **Acceptance:** Existing slug tests still pass; `from app.domain._slug import slugify` works.

### Unit 3 — `SkillDefinition` Pydantic model
- **Files:** `backend/app/domain/skill.py`, `backend/tests/test_skill_model.py`
- **Change:** Implement model per "Pydantic v2" section above with `_auto_slug` before-validator analogous to `AgentDefinition`.
- **Acceptance:** Round-trip a camelCase payload; rejects empty `platforms`; auto-slugs from name.

### Unit 4 — Workflow models
- **Files:** `backend/app/domain/workflow.py`, `backend/tests/test_workflow_model.py`
- **Change:** Define `Position`, `WorkflowNode`, `WorkflowEdge`, `Workflow`. No cross-ref validation here (lives in `WorkspaceDefinition`).
- **Acceptance:** Edge with arbitrary string `id` accepted; node `id` must match slug regex.

### Unit 5 — `WorkspaceDefinition` + cross-field validators
- **Files:** `backend/app/domain/workspace.py`, `backend/tests/test_workspace_model.py`
- **Change:** Implement top-level model with the three `model_validator(mode="after")` rules. Use lookup-set construction (no nested loops).
- **Acceptance:** Tests cover: duplicate slug across agent/skill rejected; unknown edge endpoint rejected; 11-agent workspace rejected; valid workspace accepted with empty workflow.

### Unit 6 — Zod schemas (workspace, skill, workflow)
- **Files:** `frontend/src/features/workspace-builder/schema.ts`, `frontend/src/features/workspace-builder/schema.test.ts`
- **Change:** Mirror Pydantic shape. Drop `outputLanguage` and `generationType` from `agentSchema`. `workspaceSchema.superRefine(...)` enforces the three cross-field rules.
- **Acceptance:** Tests cover the same rejections as Unit 5; the existing `schema.contract.test.ts` is updated to compare against the new OpenAPI fixture (spec 15).

### Unit 7 — Default-factory `makeEmptyWorkspace()` helper
- **Files:** `frontend/src/features/workspace-builder/defaults.ts`, sibling test
- **Change:** Pure function returning a workspace with one blank agent, no skills, empty workflow, `outputLanguage: 'en'`. Used as RHF `defaultValues`.
- **Acceptance:** `workspaceSchema.parse(makeEmptyWorkspace())` succeeds except for the required free-text fields the user fills in.

## Out of Scope
- Migration of any persisted user data — none exists.
- Versioning the schema (`version` discriminator) — defer until 1.0.
- Per-agent output language — explicitly rejected.
- Rule / root-context generation kinds — deferred.
