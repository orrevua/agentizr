# 14 — Output, README, and Platform Path Updates

**Status:** Draft
**Date:** 2026-06-23
**Related:** `11-backend-skills-and-workflow.md`, `02-backend-generators.md`

## Goal
Rebuild the output README around the workspace (agents + skills + workflow), embed a Mermaid diagram of the workflow, and give per-agent install instructions. Document the `workflow.json` payload. Lock in the per-agent + per-skill path conventions introduced in spec 11.

## Decisions

- **README is one Markdown file at the zip root.** No per-platform README split — the user wants a single overview.
- **Mermaid block is always emitted**, even with zero edges (a node-only diagram is still useful documentation).
- **Cycle warning** appears as a Markdown callout above the diagram when `has_cycle(workflow)` returns true (Mermaid renderer prepends its own `%% Contains cycles` comment too).
- **Per-platform install snippets are templated**, not hardcoded — each platform contributes a small instruction snippet via a lookup `PLATFORM_INSTALL_SNIPPETS: dict[Platform, dict[OutputLanguage, str]]`. Snippets accept `{agent_slug}` and `{platform_folder}` placeholders.
- **`workflow.json` is documented in the README** with a code-fence excerpt of the actual emitted JSON (truncated to first 80 lines if huge).
- **AGENTS.md becomes workspace-wide.** One file listing all agents (sections per agent) — not one per agent.

## README Template (en, mirror in pt-br)

```
# Agentizr Workspace

Generated {date} · {N} agent(s) · {M} skill(s) · {E} handoff edge(s)

## Workflow

{mermaid block — flowchart LR}

{optional: > **Note:** This workflow contains cycles. Make sure each loop has a clear exit.}

## Agents

### {Agent Name} (`@{slug}`)
{description}

**Install per platform:**
- **Claude Code** — copy `claude-code/{slug}/.claude/` into your repository root.
- **GitHub Copilot** — copy `copilot/{slug}/.github/` into your repository root.
- ... (only platforms targeted by this agent)

**Outgoing handoffs:** {none | list of edges}

## Skills

### {Skill Name} (`{slug}`)
{description}

**Install per platform:**
- **Claude Code** — copy `claude-code/skills/{slug}/` into `.claude/skills/`.
- **Gemini** — copy `gemini/skills/{slug}/` into `.gemini/skills/`.

## workflow.json

```json
{first 80 lines of workflow.json, or full content if shorter}
```

## Universal Fallback

See `universal/AGENTS.md`.
```

## Implementation Units

### Unit 1 — Template files (en + pt-br)
- **Files:** `backend/app/generators/templates/en/readme_workspace.md`, `backend/app/generators/templates/pt-br/readme_workspace.md`
- **Change:** Jinja2-style templates (existing template engine; if none, use Python str-format). Sections per the template above.
- **Acceptance:** Loading the template and rendering against a sample context produces a valid Markdown file.

### Unit 2 — `PLATFORM_INSTALL_SNIPPETS` lookup
- **Files:** `backend/app/generators/install_snippets.py`, `backend/tests/generators/test_install_snippets.py`
- **Change:** Two-level dict `{Platform: {OutputLanguage: str}}` keyed by every supported platform. Each snippet is a single line accepting `{agent_slug}`. Helper `render_snippets(platforms: list[Platform], slug: str, lang: OutputLanguage) -> list[str]`.
- **Acceptance:** Snippet helper returns one bullet per requested platform in stable platform order.

### Unit 3 — Rewrite `generate_readme` for workspaces
- **Files:** `backend/app/generators/readme.py`, `backend/tests/generators/test_readme.py`
- **Change:** Signature → `def generate_readme(w: WorkspaceDefinition, files: list[GeneratedFile], workflow_json_content: str) -> GeneratedFile`. Builds context dict, calls `render_mermaid(...)` (spec 11 Unit 7), embeds workflow.json excerpt (head 80 lines), uses `PLATFORM_INSTALL_SNIPPETS` per agent. Renders the locale-appropriate template.
- **Acceptance:** Snapshot test: 2 agents, 1 skill, 1 edge — README contains both agent sections, the skill section, and a `flowchart LR` block with the edge.

### Unit 4 — Rewrite `generate_agents_md` for workspaces
- **Files:** `backend/app/generators/agents_md.py`, `backend/tests/generators/test_agents_md.py`
- **Change:** `generate_agents_md(w: WorkspaceDefinition) -> list[GeneratedFile]` produces a single `universal/AGENTS.md` with workspace overview (one H1) and per-agent H2 sections. No frontmatter.
- **Acceptance:** Two agents → AGENTS.md has two H2 blocks; instructions are not modified (no handoff appendix in AGENTS.md; that lives in platform-native files only).

### Unit 5 — Orchestrator wires README + workflow.json in correct order
- **Files:** `backend/app/generators/registry.py`, `backend/tests/generators/test_registry.py`
- **Change:** In `generate_workspace`:
  1. Generate per-agent files.
  2. Generate per-skill files.
  3. Generate `universal/AGENTS.md`.
  4. Generate `workflow.json` (capture its content for the README excerpt).
  5. Generate `README.md` (last — needs the file list and workflow content).
- **Acceptance:** Test asserts the order of `files` in `GenerationResult` matches this sequence; README excerpt matches the workflow.json content.

### Unit 6 — Path-convention test (regression guard)
- **Files:** `backend/tests/generators/test_path_convention.py`
- **Change:** A single test instantiates a 2-agent workspace targeting all 6 platforms + 1 skill on Claude+Gemini, then asserts the resulting `files` set contains exactly the expected paths (full enumeration). Locks the layout described in spec 11.
- **Acceptance:** Test passes; any future drift in pathing breaks loudly.

## Out of Scope
- HTML rendering of the README.
- Per-platform README files.
- Asset bundling (logos, badges) into the zip.
- Generating a real Mermaid SVG (the README ships a fenced Mermaid block — GitHub renders it).
