# 02 — Backend Generators

**Status:** Draft
**Date:** 2026-06-22
**Related:** `01-backend-foundation.md`, `AGENTIZR-SPEC.md` §2, §4, §5, §10

## Goal
Implement one pure generator per platform plus the universal AGENTS.md and README generators, exposed through a single registry. No `if/elif` ladder over platforms — a `dict[Platform, Callable]` registry drives the orchestrator. Each generator returns `list[GeneratedFile]` and has no I/O.

## Decisions

- **Registry over switch.** `GENERATORS: dict[Platform, GeneratorFn]` makes adding a platform an additive change.
- **Shared serializers** (`serialize_frontmatter`, `serialize_toml`) live in `generators/_serialize.py`. Each platform composes them.
- **Activation-mode mapping is a lookup table** per platform (`CURSOR_ACTIVATION: dict[ActivationMode, CursorMode]`, `WINDSURF_TRIGGER: dict[ActivationMode, str]`) — never a conditional cascade.
- **Output path prefix** per platform is `{platform_folder}/...` (spec §5). Always per-platform folders for MVP; "merged tree" mode is deferred.
- **Templates** for instruction stubs live in `app/generators/templates/{lang}/...`. The orchestrator passes `output_language` into each generator.

## Shared Types

```python
# app/generators/_types.py
GeneratorFn = Callable[[AgentDefinition], list[GeneratedFile]]
```

## Implementation Units

### Unit 1 — `_serialize.py` (shared helpers)
- **Files:** `backend/app/generators/_serialize.py`, `backend/tests/generators/test_serialize.py`
- **Change:** Export:
  - `def yaml_frontmatter(fields: dict[str, Any]) -> str` — emits `---\n...\n---\n` block using ruamel.yaml with `default_flow_style=False`.
  - `def toml_block(fields: dict[str, Any]) -> str` — `tomli_w.dumps(fields)`.
  - `def fenced(content: str) -> str` — wraps body in trailing newline normalization.
- **Acceptance:** Snapshot tests for both serializers; YAML output is stable, deterministic.

### Unit 2 — Orchestrator + registry
- **Files:** `backend/app/generators/__init__.py`, `backend/app/generators/registry.py`, `backend/tests/generators/test_registry.py`
- **Change:** `registry.py` defines:
  ```python
  GENERATORS: dict[Platform, GeneratorFn] = {}
  def register(p: Platform): ...   # decorator
  def generate_all(d: AgentDefinition) -> GenerationResult:
      files = [f for p in d.target_platforms for f in GENERATORS[p](d)]
      files += generate_agents_md(d)         # always
      files.append(generate_readme(d, files))
      warnings = collect_warnings(d)         # spec §11.1
      return GenerationResult(files=files, warnings=warnings)
  ```
- **Acceptance:** Registering a fake generator and calling `generate_all` returns its files plus AGENTS.md + README.

### Unit 3 — Warnings collector
- **Files:** `backend/app/generators/warnings.py`, `backend/tests/generators/test_warnings.py`
- **Change:** `collect_warnings(d) -> list[Warning]` driven by a list of `(predicate, code, message_key)` tuples. Covers spec §11.1: copilot char limit, cursor always-apply word limit, codex tools→mcp, global scope.
- **Acceptance:** All four warnings fire for the right inputs and stay silent otherwise.

### Unit 4 — Claude Code generator
- **Files:** `backend/app/generators/claude_code.py`, `backend/tests/generators/test_claude_code.py`
- **Change:** `@register(Platform.claude_code)` produces `claude-code/.claude/agents/{slug}.md`. Frontmatter: `name`, `description`, `tools` (comma-joined string, only if non-empty), `model` (default `"inherit"`), `memory` (omit if `none`). Body = `d.instructions`.
- **Acceptance:** Frontmatter has `tools: "Bash, Read, Grep"` quoted form; emits `CLAUDE.md` only if `generation_type == root-context` (otherwise just the agent file).

### Unit 5 — Copilot generator
- **Files:** `backend/app/generators/copilot.py`, `backend/tests/generators/test_copilot.py`
- **Change:** `copilot/.github/agents/{slug}.agent.md`. Frontmatter: `name`, `description`, `applyTo` (comma-joined glob string per spec §2.2 example), `tools` as YAML array.
- **Acceptance:** Extension is exactly `.agent.md`; tools serialize as YAML list, not string.

### Unit 6 — Codex generator
- **Files:** `backend/app/generators/codex.py`, `backend/tests/generators/test_codex.py`
- **Change:** Two files:
  1. `codex/.codex/agents/{slug}.toml` with `name`, `description`, `developer_instructions` (triple-quoted multiline), `mcp_servers` (use `tools ∪ mcp_servers`), `model_reasoning_effort`.
  2. `codex/.codex/config.toml` with `[agents.{slug_underscored}]` block (`slug.replace("-", "_")`).
- **Acceptance:** TOML round-trips through `tomllib.loads`; underscored agent key matches.

### Unit 7 — Gemini generator
- **Files:** `backend/app/generators/gemini.py`, `backend/tests/generators/test_gemini.py`
- **Change:** `gemini/.gemini/agents/{slug}.md` with frontmatter `name`, `description`, `model` (only if not `"inherit"`), `tools` (YAML array), `mcpServers` (YAML array).
- **Acceptance:** No `tools:` key when list is empty; `mcpServers` camelCase preserved.

### Unit 8 — Cursor generator
- **Files:** `backend/app/generators/cursor.py`, `backend/tests/generators/test_cursor.py`
- **Change:** `cursor/.cursor/rules/{slug}.mdc`. Use a `CURSOR_ACTIVATION: dict[ActivationMode, dict]` lookup that yields the right combo of `alwaysApply`, `globs`, `description` per §4.2.
- **Acceptance:** Each of the 4 activation modes produces the exact frontmatter shape from §4.2.

### Unit 9 — Windsurf generator
- **Files:** `backend/app/generators/windsurf.py`, `backend/tests/generators/test_windsurf.py`
- **Change:** `windsurf/.windsurf/rules/{slug}.md`. `WINDSURF_TRIGGER: dict[ActivationMode, str]` lookup per §4.3. Frontmatter `trigger`, `description`.
- **Acceptance:** `always→always_on`, `auto→model_decision`, `on_demand→model_decision`, `manual→manual`.

### Unit 10 — Universal AGENTS.md generator
- **Files:** `backend/app/generators/agents_md.py`, `backend/tests/generators/test_agents_md.py`
- **Change:** `generate_agents_md(d) -> list[GeneratedFile]` → one file at `universal/AGENTS.md`. Pure Markdown (no frontmatter) using a template that interpolates name, description, instructions, tools-as-bullets.
- **Acceptance:** No `---` block in output; contains the agent name as H1.

### Unit 11 — README generator
- **Files:** `backend/app/generators/readme.py`, `backend/tests/generators/test_readme.py`
- **Change:** `generate_readme(d, files) -> GeneratedFile` at `README.md`. Lists every generated file grouped by platform with a one-line "drop this into your repo's root" instruction. Locale-aware via templates.
- **Acceptance:** README lists each file path exactly once, in stable platform order.

### Unit 12 — Zipper
- **Files:** `backend/app/zip.py`, `backend/tests/test_zip.py`
- **Change:** `def stream_zip(files: list[GeneratedFile]) -> Iterator[bytes]` using stdlib `zipfile.ZipFile` over a `BytesIO` chunked in 64KB reads. Deterministic mtimes for reproducible builds.
- **Acceptance:** Resulting bytes parse as a valid zip via `zipfile.ZipFile(BytesIO(b))`; member list matches input paths.

## Out of Scope
- Skill directories with scripts/docs (deferred; spec §6.3 open question).
- "Merged tree" output mode.
- Truncation/auto-splitting of oversized Copilot/Cursor instructions (only warnings for MVP).
