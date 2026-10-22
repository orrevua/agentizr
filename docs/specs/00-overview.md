# 00 — System Overview

**Status:** Draft
**Date:** 2026-06-22

## Goal
Define the end-to-end architecture for Agentizr: a Next.js 15 frontend that collects an `AgentDefinition` via a guided form and a FastAPI backend that owns all generation, catalogs, and zipping. The browser never builds files; it only renders previews and triggers downloads.

## Architecture

```
┌───────────────────────┐         HTTPS / JSON           ┌──────────────────────┐
│   Next.js 15 (App R.) │ ─────────────────────────────► │  FastAPI (Python 3.12)│
│   React 19, Tailwind4 │ ◄───────────────────────────── │  Pydantic v2          │
│   RHF + Zod, TanStack │   JSON previews / zip stream   │  Generators registry  │
└───────────────────────┘                                └──────────────────────┘
```

- **Frontend** is a thin UI shell. It runs on Vercel. Server Components render layout; Client Components host the form and preview.
- **Backend** is the brain. It hosts catalogs, validation, generators, and zipping. Deployable as a container (Fly.io / Railway / Render).
- **No browser-side JSZip.** This supersedes spec §8.1.

## Repo Layout (monorepo)

```
agentizr/
├── frontend/                 # Next.js 15 app
│   ├── src/
│   │   ├── app/              # App Router (server-first)
│   │   ├── features/         # Feature-sliced modules
│   │   │   ├── agent-builder/
│   │   │   ├── preview/
│   │   │   └── catalogs/
│   │   ├── shared/           # ui primitives, lib, hooks, i18n
│   │   └── styles/
│   ├── messages/             # next-intl: en.json, pt-br.json
│   └── tests/                # Playwright E2E
├── backend/                  # FastAPI app
│   ├── app/
│   │   ├── api/              # routers: generate, preview, catalog
│   │   ├── domain/           # Pydantic models, enums
│   │   ├── generators/       # one module per platform + registry
│   │   ├── catalog/          # tools, models, presets, mcp data
│   │   ├── zip.py
│   │   └── main.py
│   └── tests/                # pytest
├── docs/
│   ├── specs/
│   └── HANDOFF.md
└── AGENTIZR-SPEC.md
```

## HTTP Contract

All requests/responses are JSON unless otherwise noted. Backend mounts at `/api/v1`.

### `POST /api/v1/generate`
- **Request body:** `AgentDefinition` (see `02-backend-foundation` for schema).
- **Response:** `200 application/zip` via `StreamingResponse`; `Content-Disposition: attachment; filename="agentizr-{slug}.zip"`.
- **Errors:** `422 { detail: ValidationError[] }` (FastAPI default shape).

### `POST /api/v1/preview`
- **Request body:** `AgentDefinition`.
- **Response:**
  ```json
  {
    "files": [
      { "path": "claude-code/.claude/agents/security-reviewer.md",
        "content": "---\nname: ...",
        "platform": "claude-code",
        "language": "markdown" }
    ],
    "warnings": [
      { "code": "copilot_char_limit", "message": "..." }
    ]
  }
  ```
- **No zipping.** Used by the in-browser preview panel.

### `GET /api/v1/catalog/tools`
```json
{ "tools": [
    { "name": "Read",
      "description": "Read file contents from disk",
      "platforms": ["claude-code","copilot","gemini"] }
] }
```

### `GET /api/v1/catalog/models`
```json
{ "models": [
    { "id": "claude-sonnet-4-6", "label": "Claude Sonnet 4.6",
      "platforms": ["claude-code"] },
    { "id": "inherit", "label": "Inherit", "platforms": ["claude-code"] }
] }
```

### `GET /api/v1/catalog/presets`
```json
{ "presets": [
    { "id": "code-reviewer",
      "label": "Code Reviewer",
      "description": "Reviews PRs for quality...",
      "definition": { /* partial AgentDefinition */ } }
] }
```

### `GET /api/v1/catalog/mcp-servers`
```json
{ "servers": [
    { "name": "filesystem",
      "description": "Local filesystem access",
      "platforms": ["claude-code","codex","gemini"] }
] }
```

## Deployment

- **Frontend:** Vercel. `NEXT_PUBLIC_API_BASE_URL` points at the backend public URL.
- **Backend:** Container image, deployed standalone. CORS allow-list reads from env (`CORS_ORIGINS`).
- **Local dev:** `pnpm dev` in `frontend/`, `uvicorn app.main:app --reload` in `backend/`. Backend on `:8000`, frontend on `:3000`.

## Decisions

- **Two services, not one Next.js with Python serverless functions.** Cleaner contracts, the generator logic stays language-correct (Pydantic + TOML libs are first-class in Python), and the backend can later power a CLI without coupling to Next.
- **Zod schema is hand-mirrored from Pydantic** (not codegen). The schema is small (~30 fields), and hand-mirroring avoids the build-time `datamodel-code-generator` dependency and keeps Zod's error messages tunable for the UI. A contract test pins drift (see `09-testing-and-ci`).
- **TanStack Query** owns every catalog/preview/generate call. No raw `fetch` in components.
- **Streaming zip** keeps memory flat for future multi-agent generation.

## Out of Scope (this overview)
- Authentication, persistence, multi-agent batches, CLI packaging — all post-MVP.
- The actual field-by-field generator logic (covered in `02-backend-generators.md`).
