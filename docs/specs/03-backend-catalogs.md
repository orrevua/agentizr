# 03 — Backend Catalogs

**Status:** Draft
**Date:** 2026-06-22
**Related:** `00-overview.md`, `01-backend-foundation.md`

## Goal
The backend owns canonical reference data: tools, models, MCP servers, presets. The frontend never hardcodes any of these. Each catalog is a static Python module today (easy to migrate to a DB or JSON file later) served through `/api/v1/catalog/*`.

## Decisions

- **Catalogs are typed Python constants**, not JSON files, so they participate in type-checking and refactors.
- **One Pydantic response model per endpoint** — Pydantic handles serialization and OpenAPI documentation in one step.
- **Tool catalog uses Claude Code's built-in tool list** as the canonical superset; each entry records which platforms also recognize that tool.
- **Presets store a partial `AgentDefinition`** (everything except `name`/`slug`/`description`/`instructions`, which the user customizes).

## File Layout

```
backend/app/catalog/
├── __init__.py
├── tools.py         # TOOLS: list[ToolInfo]
├── models.py        # MODELS: list[ModelInfo]
├── mcp_servers.py   # MCP_SERVERS: list[McpServerInfo]
└── presets.py       # PRESETS: list[PresetInfo]
backend/app/api/catalog.py    # router
```

## Implementation Units

### Unit 1 — Catalog response models
- **Files:** `backend/app/catalog/__init__.py`
- **Change:** Pydantic models exported from the package:
  - `ToolInfo(name: str, description: str, platforms: list[Platform])`
  - `ModelInfo(id: str, label: str, platforms: list[Platform])`
  - `McpServerInfo(name: str, description: str, platforms: list[Platform])`
  - `PresetInfo(id: str, label: str, description: str, definition: dict[str, Any])`
- **Acceptance:** Models import cleanly; `extra="forbid"`.

### Unit 2 — Tools catalog
- **Files:** `backend/app/catalog/tools.py`, `backend/tests/catalog/test_tools.py`
- **Change:** `TOOLS` = list of `ToolInfo`. Entries (name, one-line description) — Claude Code built-ins:
  - `Read` — Read file contents from disk
  - `Write` — Create or overwrite files
  - `Edit` — Apply targeted edits to existing files
  - `Bash` — Execute shell commands
  - `Glob` — Find files by name pattern
  - `Grep` — Search file contents with regex
  - `WebFetch` — Fetch and parse a URL
  - `WebSearch` — Run web search queries
  - `Task` — Spawn a subagent for a focused task
  - `TodoWrite` — Manage a structured todo list
  - `NotebookEdit` — Edit Jupyter notebook cells
- **Platforms per tool:** all include `claude-code`; `Read`/`Grep`/`Bash`/`WebFetch` also list `copilot`, `gemini` where they correspond to standard MCP equivalents. Be conservative — only list a platform if it natively recognizes the tool name.
- **Acceptance:** `len(TOOLS) == 11`; every tool's `platforms` contains `claude-code`; no duplicate names.

### Unit 3 — Models catalog
- **Files:** `backend/app/catalog/models.py`, `backend/tests/catalog/test_models.py`
- **Change:** `MODELS` includes at minimum: `inherit` (claude-code), `claude-sonnet-4-6` (claude-code), `claude-opus-4-7` (claude-code), `gpt-4.1` (codex), `gpt-5` (codex), `gemini-2.5-pro` (gemini), `gemini-2.5-flash` (gemini). One entry per `(id, platform)` family.
- **Acceptance:** Every model id is unique; every entry's `platforms` is non-empty.

### Unit 4 — MCP servers catalog
- **Files:** `backend/app/catalog/mcp_servers.py`, `backend/tests/catalog/test_mcp_servers.py`
- **Change:** Start small: `filesystem`, `github`, `postgres`, `brave-search`. Descriptions one line each. Platforms: each lists `claude-code`, `codex`, `gemini` (the three with first-class MCP support today).
- **Acceptance:** 4 entries; no name collisions.

### Unit 5 — Presets catalog
- **Files:** `backend/app/catalog/presets.py`, `backend/tests/catalog/test_presets.py`
- **Change:** `PRESETS` contains the 8 presets from spec §12, each with `definition` carrying default `tools`, `activation_mode`, `scope`, and a starter `instructions` snippet (~3 lines). `id` is kebab-case. Frontend uses these to pre-fill the form.
- **Acceptance:** 8 entries; every preset's `definition.tools` is a subset of `TOOLS` names; every preset round-trips through `AgentDefinition` validation when merged with minimum required fields.

### Unit 6 — Catalog router
- **Files:** `backend/app/api/catalog.py`, `backend/tests/api/test_catalog.py`
- **Change:** Four `GET` endpoints under `/api/v1/catalog/`:
  - `/tools` → `{"tools": TOOLS}`
  - `/models` → `{"models": MODELS}`
  - `/mcp-servers` → `{"servers": MCP_SERVERS}`
  - `/presets` → `{"presets": PRESETS}`
  - Use a small `CATALOG_ENDPOINTS` lookup `dict[str, Callable]` to avoid duplicated handler bodies.
- **Acceptance:** All four return 200 with the expected shape; OpenAPI shows the response models.

## Out of Scope
- DB-backed catalogs, admin UI, community-contributed presets.
- Per-locale catalog descriptions (English only for MVP; translations live in frontend `messages/`).
