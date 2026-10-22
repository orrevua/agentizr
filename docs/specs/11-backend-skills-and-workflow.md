# 11 — Backend: Skills, Workflow, and Multi-Agent Orchestration

**Status:** Draft
**Date:** 2026-06-23
**Related:** `02-backend-generators.md`, `10-workspace-data-model.md`, `AGENTIZR-SPEC.md` §6.3

## Goal
Generate skill files (Claude Code + Gemini), render handoffs into each agent's instructions at generation time, emit a workflow.json artifact, and rework the orchestrator to walk every agent + every skill — namespacing per-agent output under `{platform}/{agent-slug}/`. All dispatch is registry-driven; no `if/elif` over platform or skill kind. Handoff renderer is a pure function.

## Decisions

- **Skill generators are a parallel registry.** `SKILL_GENERATORS: dict[Platform, SkillGeneratorFn]`, populated only for `Platform.claude_code` and `Platform.gemini`. Calling a missing platform is a no-op (the registry lookup returns `None`, caller skips).
- **Per-agent namespacing in every platform path:** `{platform}/{agent_slug}/{platform_native_path}`. Skills share one folder per platform: `{platform}/skills/{skill_slug}/...` (skills are workspace-wide, not per-agent).
- **Handoff rendering is composition, not mutation.** The generator computes `final_instructions = user_instructions + render_handoffs(agent, workflow, all_agents, lang)` and passes that to existing serializers. `AgentDefinition.instructions` is never mutated.
- **`render_handoffs` is a pure function** in `app/generators/handoffs.py` with 100% unit-test coverage. Empty outgoing edges → returns `""`. Multiple edges → bullet list under `## Handoffs` (localized header).
- **`workflow.json` is platform-neutral** and lives at the zip root. Always emitted, even when the workflow has zero edges (empty arrays).
- **Mermaid emission stays in the README generator** (spec 14), but a pure `render_mermaid(workflow, agents) -> str` lives in `app/generators/mermaid.py` so it's reusable and testable.

## File Layout (output zip)

```
agentizr-output/
├── README.md
├── workflow.json
├── claude-code/
│   ├── {agent-a-slug}/.claude/agents/{agent-a-slug}.md
│   ├── {agent-b-slug}/.claude/agents/{agent-b-slug}.md
│   └── skills/{skill-slug}/SKILL.md
├── copilot/
│   ├── {agent-a-slug}/.github/agents/{agent-a-slug}.agent.md
│   └── {agent-b-slug}/.github/agents/{agent-b-slug}.agent.md
├── codex/
│   ├── {agent-a-slug}/.codex/agents/{agent-a-slug}.toml
│   ├── {agent-a-slug}/.codex/config.toml
│   └── ...
├── gemini/
│   ├── {agent-a-slug}/.gemini/agents/{agent-a-slug}.md
│   └── skills/{skill-slug}/SKILL.md
├── cursor/
│   └── {agent-a-slug}/.cursor/rules/{agent-a-slug}.mdc
├── windsurf/
│   └── {agent-a-slug}/.windsurf/rules/{agent-a-slug}.md
└── universal/
    └── AGENTS.md
```

Skills appearing only on `claude-code` and `gemini` is enforced by `SkillDefinition.platforms` (spec 10).

## Implementation Units

### Unit 1 — Per-agent path prefix in existing platform generators
- **Files:** all 6 generators under `backend/app/generators/{claude_code,copilot,codex,gemini,cursor,windsurf}.py`; their tests
- **Change:** Each generator already returns paths like `claude-code/.claude/agents/{slug}.md`. Insert the agent slug folder: `claude-code/{slug}/.claude/agents/{slug}.md`. Mechanical: prepend `f"{d.slug}/"` after the platform folder segment.
- **Acceptance:** Existing per-platform tests updated to assert the new path; one new test per platform asserts two agents produce two sibling folders.

### Unit 2 — Orchestrator iterates agents and emits `workflow.json`
- **Files:** `backend/app/generators/registry.py`, `backend/app/api/preview.py`, `backend/app/api/generate.py`, `backend/tests/generators/test_registry.py`
- **Change:**
  - Rename `generate_all(d: AgentDefinition)` to `generate_workspace(w: WorkspaceDefinition) -> GenerationResult`.
  - Inside: for each `agent in w.agents`, for each `platform in agent.target_platforms`, call `GENERATORS[platform](agent, w.output_language, w.workflow, w.agents)` (signature change — see Unit 3).
  - After agents: iterate `w.skills` over `SKILL_GENERATORS` (Unit 4). Append `generate_agents_md(w)` (one universal AGENTS.md for the whole workspace, lists every agent). Append `workflow.json` (Unit 5). Append `generate_readme(w, files)` (spec 14).
  - Update routes to accept `WorkspaceDefinition`; zip filename becomes `agentizr-workspace.zip` (or `agentizr-{first_agent_slug}.zip` when `len(agents)==1` — pick the latter, friendlier).
- **Acceptance:** Calling `generate_workspace` with two agents + one skill produces all expected paths and a `workflow.json` at root.

### Unit 3 — Update generator signature to receive workflow context
- **Files:** `backend/app/generators/_types.py`, all 6 generators, tests
- **Change:**
  - New `GeneratorFn = Callable[[AgentDefinition, OutputLanguage, Workflow, list[AgentDefinition]], list[GeneratedFile]]`.
  - Each generator composes `final_instructions = agent.instructions + render_handoffs(agent, workflow, all_agents, lang)` and uses `final_instructions` wherever `agent.instructions` was passed into the body.
- **Acceptance:** Each generator's existing test still asserts body content; a new test asserts that when the workflow has an outgoing edge for the agent, the body contains the `## Handoffs` block.

### Unit 4 — Skill generators + registry
- **Files:** `backend/app/generators/skills/__init__.py`, `backend/app/generators/skills/registry.py`, `backend/app/generators/skills/claude_code.py`, `backend/app/generators/skills/gemini.py`, `backend/tests/generators/skills/test_*.py`
- **Change:**
  - `SkillGeneratorFn = Callable[[SkillDefinition, OutputLanguage], list[GeneratedFile]]`.
  - `SKILL_GENERATORS: dict[Platform, SkillGeneratorFn] = {Platform.claude_code: ..., Platform.gemini: ...}`. No entries for other platforms — lookup uses `.get()`; missing platform = skip.
  - Claude skill: `claude-code/skills/{slug}/SKILL.md` with YAML frontmatter `{name, description}` and body = `instructions`. If `scaffold_dirs`, also emit `scripts/.gitkeep` and `docs/.gitkeep`.
  - Gemini skill: `gemini/skills/{slug}/SKILL.md` with same shape.
  - Orchestrator iterates: `for skill in w.skills: for platform in skill.platforms: gen = SKILL_GENERATORS.get(platform); if gen: files += gen(skill, lang)`.
- **Acceptance:** Skill with `platforms=['claude-code','gemini']` emits two SKILL.md files; `scaffold_dirs=true` adds the two `.gitkeep` placeholders per platform.

### Unit 5 — `render_handoffs` pure function (100% coverage)
- **Files:** `backend/app/generators/handoffs.py`, `backend/tests/generators/test_handoffs.py`
- **Change:**
  ```
  def render_handoffs(
      agent: AgentDefinition,
      workflow: Workflow,
      agents: list[AgentDefinition],
      lang: OutputLanguage,
  ) -> str
  ```
  - Filter `workflow.edges` where `edge.source == agent.slug`.
  - Build an index `{a.slug: a.name for a in agents}` (lookup table, not loops).
  - Localized headers from a constant `HEADERS: dict[OutputLanguage, dict[str, str]]` (`{"en": {"section": "## Handoffs", "when": "When", "handoff_to": "hand off to"}, "pt-br": {...}}`).
  - Output format per edge: `- {when} {condition or label or "applicable"}, {handoff_to} \`@{target-slug}\` ({target-name})`.
  - Returns `""` if no outgoing edges; otherwise `"\n\n## Handoffs\n" + bullets + "\n"`.
- **Acceptance:** 100% line+branch coverage. Tests: zero edges → empty string; one edge with condition → exact expected markdown; one edge missing condition + label → uses "applicable" / "aplicável"; unknown target slug → raises `KeyError` (caller must validate first — workspace validator does this); pt-br header verified.

### Unit 6 — `workflow.json` emitter
- **Files:** `backend/app/generators/workflow_json.py`, `backend/tests/generators/test_workflow_json.py`
- **Change:** `def emit_workflow_json(workflow: Workflow, agents: list[AgentDefinition]) -> GeneratedFile` returning `path="workflow.json"`, `language="text"` (no JSON enum yet — keep change minimal; add later if useful). Body shape:
  ```
  {
    "agents": [{"slug": ..., "name": ...}, ...],
    "nodes": [{"id": ..., "position": {"x": ..., "y": ...}}, ...],
    "edges": [{"id": ..., "source": ..., "target": ..., "label": ..., "condition": ...}, ...]
  }
  ```
  Use `model_dump(by_alias=True, exclude_none=False)` + `json.dumps(..., indent=2, sort_keys=True)` for determinism.
- **Acceptance:** Output parses as JSON; deterministic for two identical workspaces.

### Unit 7 — `render_mermaid` pure function
- **Files:** `backend/app/generators/mermaid.py`, `backend/tests/generators/test_mermaid.py`
- **Change:** `def render_mermaid(workflow: Workflow, agents: list[AgentDefinition]) -> str` → a `flowchart LR` block:
  ```
  flowchart LR
    agent_a["Agent A"]
    agent_b["Agent B"]
    agent_a -->|Task complete| agent_b
  ```
  Slugs sanitized to valid Mermaid ids (`-` → `_`). When `has_cycle(workflow)` (simple DFS in same module), prepend a comment line `%% Contains cycles`.
- **Acceptance:** Renders the expected diagram for a 2-node 1-edge sample; cycle-detection test covers a 3-node cycle.

### Unit 8 — `GET /api/v1/catalog/handoff-conditions`
- **Files:** `backend/app/api/catalog.py`, `backend/app/catalog/handoff_conditions.py`, `backend/tests/api/test_catalog.py`
- **Change:** Static list:
  ```
  HANDOFF_CONDITIONS: list[dict[str, str]] = [
      {"id": "task_complete", "labelEn": "Task complete", "labelPtBr": "Tarefa concluída"},
      {"id": "needs_review", "labelEn": "Needs review", "labelPtBr": "Precisa revisão"},
      {"id": "error_escalation", "labelEn": "Error escalation", "labelPtBr": "Escalação de erro"},
      {"id": "out_of_scope", "labelEn": "Out of scope", "labelPtBr": "Fora de escopo"},
  ]
  ```
  Endpoint returns `{"conditions": [...]}`. Locale resolution stays on the frontend.
- **Acceptance:** `GET /api/v1/catalog/handoff-conditions` returns 200 with 4 entries.

### Unit 9 — Update API endpoints to accept `WorkspaceDefinition`
- **Files:** `backend/app/api/preview.py`, `backend/app/api/generate.py`, `backend/tests/api/test_preview.py`, `backend/tests/api/test_generate.py`
- **Change:**
  - Request body type → `WorkspaceDefinition`.
  - `preview` calls `generate_workspace(w)` and returns the unchanged `GenerationResult` shape.
  - `generate` filename: `agentizr-{w.agents[0].slug}.zip` when single agent else `agentizr-workspace.zip`.
- **Acceptance:** Existing happy-path tests rewritten with workspace payloads still pass; a 2-agent workspace generates a zip containing both agent folders.

### Unit 10 — Update warnings collector for workspace scope
- **Files:** `backend/app/generators/warnings.py`, `backend/tests/generators/test_warnings.py`
- **Change:** `collect_warnings(w: WorkspaceDefinition) -> list[Warning]` iterates each agent and runs the existing predicate table, prefixing each warning's `message` with the agent's name when `len(agents) > 1` (so the UI knows which tab is affected). Predicate table itself unchanged.
- **Acceptance:** Multi-agent workspace yields warnings keyed visibly per agent.

## Out of Scope
- Rule and root-context generation kinds (still deferred to a later spec).
- Per-skill `scripts/` and `docs/` content beyond `.gitkeep` placeholders.
- Validating cycle-free workflows (cycles are allowed; only flagged).
- Skill generators for non-Claude/non-Gemini platforms.
