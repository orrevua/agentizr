# 09 — Testing & CI

**Status:** Draft
**Date:** 2026-06-22
**Related:** all prior specs

## Goal
Lock in the test pyramid and a minimum-viable CI: pytest for the backend (100% generator coverage), Vitest + Testing Library for the frontend, Playwright for one happy-path E2E. GitHub Actions runs everything on every PR.

## Decisions

- **Backend coverage target:** 100% on `app/generators/` and `app/catalog/` (pure code); ≥85% overall.
- **Contract test pins schema drift** between Pydantic and Zod: backend dumps `openapi.json`; a frontend test asserts every field of the Zod schema appears under `AgentDefinition` with matching constraints. Cheap insurance for the "hand-mirrored" decision.
- **Vitest over Jest** — native ESM, faster, official Vite plugin for React.
- **Playwright over Cypress** — first-class Next.js support, parallel by default.
- **MSW** mocks the backend in frontend unit/integration tests.
- **One Playwright happy path** for MVP: fill form → preview → download zip → unzip → assert key file paths exist.

## Implementation Units

### Unit 1 — Backend test config
- **Files:** `backend/pyproject.toml` (modify), `backend/pytest.ini` or `[tool.pytest.ini_options]`
- **Change:** Configure pytest discovery, asyncio mode = auto, `addopts = "--cov=app --cov-report=term-missing --cov-fail-under=85"`. Add `pytest-cov` to dev deps.
- **Acceptance:** `uv run pytest` enforces coverage threshold.

### Unit 2 — Generator coverage push
- **Files:** existing `backend/tests/generators/*.py` (extend)
- **Change:** Add the missing edge-case tests per generator: empty tools, max-length instructions, every activation mode for Cursor/Windsurf, global vs project scope path differences, output_language switching.
- **Acceptance:** `app/generators/` reaches 100% line + branch coverage.

### Unit 3 — Frontend test config
- **Files:** `frontend/vitest.config.ts`, `frontend/vitest.setup.ts`, `frontend/package.json` (deps: `vitest`, `@vitest/coverage-v8`, `@testing-library/react`, `@testing-library/jest-dom`, `msw`, `jsdom`)
- **Change:** Configure jsdom env, path alias `@`, setup file for jest-dom matchers and MSW server lifecycle (`beforeAll/afterAll`).
- **Acceptance:** `pnpm test` runs and Schema/hook tests from earlier specs pass.

### Unit 4 — MSW handlers + catalog fixtures
- **Files:** `frontend/src/test/handlers.ts`, `frontend/src/test/server.ts`, `frontend/src/test/fixtures/*.ts`
- **Change:** Default handlers for `/catalog/tools`, `/catalog/models`, `/catalog/mcp-servers`, `/catalog/presets`, `/preview`, `/generate`. Fixtures match real backend shapes.
- **Acceptance:** Component tests that need catalogs work without per-test mocking.

### Unit 5 — Schema parity contract test
- **Files:** `frontend/src/features/agent-builder/schema.contract.test.ts`, `backend/scripts/export_openapi.py`
- **Change:** Backend script writes `openapi.json` to `frontend/src/test/fixtures/openapi.json` (regenerated in CI before frontend tests). Test loads it and asserts: every property in the `AgentDefinition` request schema exists in `agentDefinitionSchema.shape`, with matching type and (where applicable) min/max.
- **Acceptance:** Renaming a backend field without updating Zod fails this test.

### Unit 6 — i18n parity test
- **Files:** `frontend/src/shared/i18n/parity.test.ts`
- **Change:** Recursively flatten both `en.json` and `pt-br.json`; assert key sets are equal.
- **Acceptance:** Missing a PT-BR key fails CI.

### Unit 7 — Playwright E2E
- **Files:** `frontend/playwright.config.ts`, `frontend/tests/e2e/happy-path.spec.ts`, `frontend/package.json` (dep: `@playwright/test`)
- **Change:** Configure webServer to start both backend (`uvicorn`) and frontend (`pnpm dev`) before tests. One spec: navigate `/`, fill name/description/instructions, select Claude+Cursor, click Generate, intercept the download, unzip in memory, assert `claude-code/.claude/agents/<slug>.md` and `cursor/.cursor/rules/<slug>.mdc` exist.
- **Acceptance:** `pnpm e2e` green locally and in CI.

### Unit 8 — GitHub Actions
- **Files:** `.github/workflows/ci.yml`
- **Change:** Two jobs:
  - `backend`: setup Python 3.12, install `uv`, `uv sync`, `uv run ruff check`, `uv run mypy app`, `uv run pytest`. Then `uv run python scripts/export_openapi.py` and upload `openapi.json` artifact.
  - `frontend`: needs backend artifact, setup Node 22 + pnpm, `pnpm install`, `pnpm lint`, `pnpm typecheck`, download openapi artifact, `pnpm test`, `pnpm exec playwright install --with-deps chromium`, `pnpm e2e`.
- **Acceptance:** Workflow passes on a clean PR.

### Unit 9 — Linting & formatting
- **Files:** `backend/ruff.toml`, `frontend/eslint.config.mjs`, `frontend/.prettierrc`
- **Change:** Ruff for Python (rules: E, F, I, UP, B, SIM). ESLint flat config extending `next/core-web-vitals` + `@typescript-eslint`. Prettier with the project's tab/quote conventions.
- **Acceptance:** `ruff check`, `pnpm lint`, `pnpm format --check` all green.

## Out of Scope
- Load testing, security scanning, dependabot tuning (post-launch).
- Visual regression testing.
- Mutation testing.
