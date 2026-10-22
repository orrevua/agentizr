# 01 — Backend Foundation

**Status:** Draft
**Date:** 2026-06-22
**Related:** `00-overview.md`

## Goal
Stand up the FastAPI service skeleton: project layout, settings, CORS, Pydantic v2 domain models, and pytest harness. No generators or routes with business logic yet — only the scaffolding the rest of the backend specs will plug into.

## Decisions

- **Python 3.12+**, **FastAPI**, **Pydantic v2**, **uvicorn**, **pytest + pytest-asyncio + httpx**.
- **Package manager:** `uv` (lockfile + venv in one tool, fastest in CI).
- **Settings via `pydantic-settings`** — env-driven, no hardcoded URLs.
- **TOML:** `tomli_w` for serializing (`tomllib` for reading; we only write).
- **YAML:** `ruamel.yaml` (preserves quoting/ordering; required because Claude Code expects `tools: "Bash, Read"` quoted-string vs Copilot expects YAML array — explicit control matters).
- **Slug derivation lives in the backend** so the frontend doesn't need to ship the same regex.

## Project Layout

```
backend/
├── pyproject.toml
├── uv.lock
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI() app, router includes, CORS
│   ├── settings.py             # Settings(BaseSettings)
│   ├── api/
│   │   ├── __init__.py
│   │   ├── health.py
│   │   ├── catalog.py          # (filled by spec 03)
│   │   ├── generate.py         # (filled by spec 04)
│   │   └── preview.py          # (filled by spec 04)
│   ├── domain/
│   │   ├── __init__.py
│   │   ├── enums.py            # Platform, ActivationMode, Scope, Memory, Reasoning, OutputLanguage
│   │   ├── agent.py            # AgentDefinition model
│   │   └── generated.py        # GeneratedFile, GenerationResult
│   ├── generators/             # (spec 02)
│   ├── catalog/                # (spec 03)
│   └── zip.py                  # (spec 02 / 04)
└── tests/
    ├── conftest.py
    └── test_health.py
```

## Implementation Units

### Unit 1 — `pyproject.toml` + project bootstrap
- **Files:** `backend/pyproject.toml`, `backend/.python-version`, `backend/README.md` (one paragraph)
- **Change:** Declare deps: `fastapi`, `uvicorn[standard]`, `pydantic>=2.7`, `pydantic-settings`, `ruamel.yaml`, `tomli_w`. Dev: `pytest`, `pytest-asyncio`, `httpx`, `ruff`, `mypy`.
- **Acceptance:** `uv sync` succeeds; `uv run python -c "import fastapi"` works.

### Unit 2 — `app/settings.py`
- **Files:** `backend/app/settings.py`
- **Change:** `class Settings(BaseSettings)` with `cors_origins: list[str] = ["http://localhost:3000"]`, `api_prefix: str = "/api/v1"`, `env: Literal["dev","prod"] = "dev"`. `model_config = SettingsConfigDict(env_prefix="AGENTIZR_")`. Export `settings = Settings()`.
- **Acceptance:** `from app.settings import settings; settings.api_prefix == "/api/v1"`.

### Unit 3 — `app/domain/enums.py`
- **Files:** `backend/app/domain/enums.py`
- **Change:** `StrEnum` subclasses for `Platform` (`claude-code`, `copilot`, `codex`, `gemini`, `cursor`, `windsurf`), `ActivationMode` (`always`, `auto`, `on_demand`, `manual`), `Scope` (`project`, `global`), `Memory` (`project`, `user`, `local`, `none`), `ReasoningEffort` (`low`, `medium`, `high`), `OutputLanguage` (`en`, `pt-br`), `GenerationType` (`agent`, `rule`, `skill`, `root-context`).
- **Acceptance:** `Platform("claude-code")` resolves; values match spec §3 exactly.

### Unit 4 — `app/domain/agent.py` (AgentDefinition)
- **Files:** `backend/app/domain/agent.py`
- **Change:** Pydantic v2 `AgentDefinition` mirroring spec §3 with validation from §11:
  - `name: str = Field(min_length=2, max_length=80)`
  - `slug: str = Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")` — `@model_validator(mode="before")` auto-derives from `name` if missing (lowercase, non-alphanumerics → `-`, collapse, strip).
  - `description: str = Field(min_length=5, max_length=300)`
  - `instructions: str = Field(min_length=10, max_length=50_000)`
  - `tools: list[str] = []`, `mcp_servers: list[str] = Field(default_factory=list, alias="mcpServers")`
  - `apply_to_globs: list[str] = Field(default_factory=list, alias="applyToGlobs")`
  - `activation_mode: ActivationMode = Field(alias="activationMode", default=ActivationMode.auto)`
  - `model: str = "inherit"`, `reasoning_effort: ReasoningEffort = Field(alias="reasoningEffort", default=ReasoningEffort.medium)`
  - `scope: Scope = Scope.project`, `memory: Memory = Memory.project`
  - `output_language: OutputLanguage = Field(alias="outputLanguage", default=OutputLanguage.en)`
  - `target_platforms: list[Platform] = Field(alias="targetPlatforms", min_length=1)`
  - `generation_type: GenerationType = Field(alias="generationType", default=GenerationType.agent)`
  - `model_config = ConfigDict(populate_by_name=True, use_enum_values=False, extra="forbid")`
- **Acceptance:** Round-trips a JSON payload with camelCase keys; rejects `targetPlatforms: []`; auto-slugs `"Security Reviewer"` → `"security-reviewer"`.

### Unit 5 — `app/domain/generated.py`
- **Files:** `backend/app/domain/generated.py`
- **Change:** `class GeneratedFile(BaseModel): path: str; content: str; platform: Platform | Literal["universal"]; language: Literal["markdown","toml","yaml","text"]`. `class Warning(BaseModel): code: str; message: str; platform: Platform | None = None`. `class GenerationResult(BaseModel): files: list[GeneratedFile]; warnings: list[Warning] = []`.
- **Acceptance:** Importable and pickled-into-JSON cleanly.

### Unit 6 — `app/main.py` + CORS + health route
- **Files:** `backend/app/main.py`, `backend/app/api/health.py`
- **Change:** Create `app = FastAPI(title="Agentizr API", version="0.1.0")`. Add `CORSMiddleware` with `allow_origins=settings.cors_origins`, `allow_methods=["*"]`, `allow_headers=["*"]`. Mount health router (`GET /api/v1/health` → `{"status":"ok"}`).
- **Acceptance:** `uvicorn app.main:app` boots; `curl localhost:8000/api/v1/health` returns ok.

### Unit 7 — pytest harness
- **Files:** `backend/tests/conftest.py`, `backend/tests/test_health.py`, `backend/tests/test_agent_model.py`
- **Change:** `conftest.py` exposes a `client = TestClient(app)` fixture. `test_health.py` hits `/api/v1/health`. `test_agent_model.py` covers slug auto-derivation, alias round-trip, and rejection of empty platforms list.
- **Acceptance:** `uv run pytest` is green with at least 5 passing tests.

## Out of Scope
- Generators (spec 02), catalogs (03), API endpoints for generate/preview (04).
- Auth, rate-limiting, observability.
