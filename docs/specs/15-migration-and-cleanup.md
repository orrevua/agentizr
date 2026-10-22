# 15 — Migration and Cleanup

**Status:** Draft
**Date:** 2026-06-23
**Related:** specs 10–14

## Goal
Execute the breaking refactor in an order that keeps the tree compilable at every step and leaves no dead code. No data migration logic — there are no real users. Regenerate the OpenAPI fixture so the schema-parity test reflects the new shape.

## Decisions

- **Breaking is allowed.** v0.2 is pre-1.0; no shims for `AgentDefinition`-as-root.
- **Sequence by dependency.** Backend models → backend generators → backend API → OpenAPI export → frontend schema → frontend feature folder rename → frontend canvas → e2e fix.
- **Old fields stay in `enums.py` if other code might reference them later** (e.g. `GenerationType`) — mark with a docstring "reserved for future use". No silent deletes of public-looking enums.
- **One commit per spec** is the implementer's call, but each unit below is independently green.

## Cleanup Targets

| Target | Action |
|---|---|
| `AgentDefinition.output_language` | Delete field + alias + all references in generators (`generate_workspace` passes `w.output_language` explicitly). |
| `AgentDefinition.generation_type` | Delete field; keep `GenerationType` enum (unused, reserved). |
| `frontend/src/features/agent-builder/` | Rename → `workspace-builder/` (spec 12 Unit 1). |
| `frontend/src/features/agent-builder/components/OutputLanguageField.tsx` | Move to new feature; rewire to workspace path. |
| `frontend/src/test/fixtures/openapi.json` | Regenerate after backend changes. |
| `frontend/src/features/agent-builder/schema.contract.test.ts` | Move + update; assert workspace shape. |
| `useAgentForm.ts` | Delete; replaced by `useWorkspaceForm`. |
| `useAgentTabsController.test.ts` | New. |
| `messages/en.json` / `messages/pt-br.json` | Add workspace + workflow + skill keys (spec 12 Unit 8, 13 Unit 10). |
| Backend test files mentioning `AgentDefinition` as request body | Rewrite to use `WorkspaceDefinition`. |
| Playwright happy-path spec (`tests/e2e/happy-path.spec.ts`) | Update to add a 2nd agent, draw one edge, generate. |

## Implementation Units (ordering matters)

### Unit 1 — Land spec 10 (backend models only, no generator changes yet)
- **Files:** see spec 10 Units 1–5
- **Acceptance:** `uv run pytest backend/tests/` green. Generators still operate on `AgentDefinition` (callers in `registry.py` not yet changed — the API endpoints are temporarily broken; mark them `@router.post(... , include_in_schema=False)` is NOT needed because Unit 2 follows immediately).

### Unit 2 — Update orchestrator + APIs to `WorkspaceDefinition`
- **Files:** spec 11 Units 2, 3, 9 (registry signature, generator signature, API endpoints)
- **Acceptance:** Backend pytest green end-to-end. OpenAPI now reflects WorkspaceDefinition.

### Unit 3 — Land remaining backend units (skills, handoffs, mermaid, workflow.json, catalog endpoint, warnings update, README+AGENTS rewrite, path convention test)
- **Files:** spec 11 Units 1, 4–8, 10; spec 14 Units 1–6
- **Acceptance:** All backend tests green; coverage ≥ existing threshold (85%).

### Unit 4 — Regenerate OpenAPI fixture
- **Files:** `frontend/src/test/fixtures/openapi.json` (overwrite)
- **Change:** Run `uv run python -m scripts.export_openapi` from `backend/`. Commit the new fixture.
- **Acceptance:** File contains `WorkspaceDefinition`, `SkillDefinition`, `WorkflowNode`, `WorkflowEdge` schemas.

### Unit 5 — Land spec 10 Units 6–7 (frontend Zod schemas + defaults)
- **Files:** `frontend/src/features/agent-builder/schema.ts` (will move next unit), `defaults.ts`, tests
- **Acceptance:** Schema tests pass; contract test pinned against new fixture passes.

### Unit 6 — Rename `agent-builder` → `workspace-builder` (spec 12 Unit 1)
- **Files:** folder rename + global import rewrite + tests
- **Acceptance:** `npm run typecheck && npm test && npm run build` all green.

### Unit 7 — Land spec 12 Units 2–8 (form refactor, tabs, skills section, mutations, i18n)
- **Files:** see spec 12
- **Acceptance:** Frontend tests green; preview/generate calls go out as `WorkspaceDefinition`; MSW handlers updated.

### Unit 8 — Land spec 13 (workflow canvas)
- **Files:** see spec 13
- **Acceptance:** All spec-13 unit tests pass; bundle still builds.

### Unit 9 — Update Playwright happy-path
- **Files:** `frontend/tests/e2e/happy-path.spec.ts`
- **Change:** Fill agent 1, click "+ Add agent", fill agent 2, drag from agent 1 to agent 2 on the canvas, pick condition "Task complete", click "Generate", assert zip download.
- **Acceptance:** `npm run e2e` passes locally.

### Unit 10 — Delete dead files
- **Files:** any `useAgentForm.ts`, `AgentBuilder.tsx`, old per-agent `OutputLanguageField` location, etc.
- **Acceptance:** `rg "useAgentForm|features/agent-builder" frontend/src` returns nothing.

### Unit 11 — Update HANDOFF.md
- **Files:** `docs/HANDOFF.md`
- **Change:** Replace the "Phase 2" section header with "Phase 2 — Shipped" and mark specs 10–15 done. Refresh test counts.
- **Acceptance:** Manual review.

## Out of Scope
- Data migration scripts.
- Backwards-compatible request shims.
- Renaming any backend module that isn't strictly required (e.g. `app/api/generate.py` keeps its name).
- Reorganizing existing generator file names.
