# 04 — Backend API: Generate & Preview

**Status:** Draft
**Date:** 2026-06-22
**Related:** `02-backend-generators.md`, `03-backend-catalogs.md`

## Goal
Wire the two action endpoints — `POST /api/v1/preview` and `POST /api/v1/generate` — on top of the generators registry. Define error and warning shapes consistently so the frontend can render them uniformly.

## Decisions

- **`/preview` returns JSON.** Same generators, no zipping; the client gets `files[]` + `warnings[]` to render tabs without paying the cost of downloading a zip.
- **`/generate` streams a zip** via `StreamingResponse(stream_zip(...), media_type="application/zip")`. No buffering the whole archive in memory.
- **Validation errors use FastAPI's default 422 shape.** Frontend already understands it via TanStack Query error handler.
- **Warnings ≠ errors.** Warnings come back inside the 200 response (both `/preview` and `/generate`'s zip includes them in `README.md`). Errors are 4xx.

## Implementation Units

### Unit 1 — `/preview` endpoint
- **Files:** `backend/app/api/preview.py`, `backend/tests/api/test_preview.py`
- **Change:**
  ```python
  @router.post("/preview", response_model=GenerationResult)
  def preview(definition: AgentDefinition) -> GenerationResult:
      return generate_all(definition)
  ```
  Mount router at `/api/v1` in `main.py`.
- **Acceptance:** Posting a minimal valid `AgentDefinition` returns `files: [...]` with one file per selected platform + AGENTS.md + README. Posting `targetPlatforms: []` returns 422.

### Unit 2 — `/generate` endpoint
- **Files:** `backend/app/api/generate.py`, `backend/tests/api/test_generate.py`
- **Change:**
  ```python
  @router.post("/generate")
  def generate(definition: AgentDefinition) -> StreamingResponse:
      result = generate_all(definition)
      filename = f"agentizr-{definition.slug}.zip"
      return StreamingResponse(
          stream_zip(result.files),
          media_type="application/zip",
          headers={"Content-Disposition": f'attachment; filename="{filename}"'},
      )
  ```
- **Acceptance:** Response is a valid zip; member list equals `[f.path for f in result.files]`; `Content-Disposition` carries the slug.

### Unit 3 — Error normalization middleware
- **Files:** `backend/app/api/errors.py`, `backend/tests/api/test_errors.py`
- **Change:** Add an exception handler for `RequestValidationError` that flattens FastAPI's `errors()` into:
  ```json
  { "error": "validation_failed",
    "details": [{ "field": "targetPlatforms", "message": "..." }] }
  ```
  Keep a lookup `ERROR_HANDLERS: dict[type[Exception], Callable]` so future custom exceptions plug in additively.
- **Acceptance:** A 422 includes the normalized shape; the lookup pattern is in place even if only one handler exists today.

### Unit 4 — Router registration
- **Files:** `backend/app/main.py` (modify)
- **Change:** Include `health`, `catalog`, `preview`, `generate` routers, all under `settings.api_prefix`. Order doesn't matter functionally but keep alphabetical for readability.
- **Acceptance:** `GET /api/v1/openapi.json` lists all four prefixes.

### Unit 5 — Smoke E2E test (in-process)
- **Files:** `backend/tests/test_smoke_e2e.py`
- **Change:** Single test that POSTs a realistic `AgentDefinition` (Security Reviewer preset + all 6 platforms) to `/preview` and asserts every expected output path is present, then POSTs to `/generate` and unzips into a temp dir, asserting the same paths exist on disk.
- **Acceptance:** Test green; runtime <1s.

## Out of Scope
- Auth, rate limiting, request size caps (revisit before public launch).
- Multi-agent batch generation (Phase 4).
