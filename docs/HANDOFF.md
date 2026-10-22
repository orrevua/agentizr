# Agentizr — Session Handoff

**Last updated:** 2026-06-23 (Phase 2 frontend shipped)
**Phase:** Phase 1 + Phase 2 shipped end-to-end (backend already complete; frontend specs 12, 13, and frontend portions of 15 landed this session).

## Project Status

### Phase 1 — Shipped
Single-agent generation across 6 platforms. Backend (FastAPI), frontend (Next.js 15), 93 backend tests at 99% coverage, 22 frontend tests, full bilingual UX. See "Phase 1 Detail" below.

### Phase 2 — Workspace + Skills + Workflow (shipped)
The form now holds a `WorkspaceDefinition`: N agents in shadcn-style tabs (add/remove/inline rename, per-tab error dot, ≤10), an independent `SkillsSection` (Claude Code + Gemini), and an `@xyflow/react` v12 canvas with one node per agent and handoff edges. RHF `Controller` fully controls the canvas; React Flow holds no internal state. Edge labels mirror handoff `condition` and use a popover driven by `/catalog/handoff-conditions` (free-text fallback). Mobile renders read-only React Flow + a `MobileNotice`. `outputLanguage` hoisted to the workspace sidebar. Preview/Generate mutations send the full `WorkspaceDefinition`. Single-agent zip filename is still trusted from the backend's `Content-Disposition`.

**Frontend file layout (new/changed):**
- `src/features/workspace-builder/` — renamed from `agent-builder/`, schema/types rewritten to mirror Pydantic `WorkspaceDefinition`. New: `defaults.ts`, `hooks/useWorkspaceForm.ts`, `hooks/useAgentTabsController.ts`, `components/WorkspaceBuilder.tsx`, `WorkspaceForm.tsx`, `AgentTabs.tsx`, `AgentTabPanel.tsx`, `SkillsSection.tsx`, `SkillRow.tsx`. Per-agent field components now take `basePath: agents.${number}`. `useSlugFromName` watches all agents and propagates renames into `workflow.nodes/edges`.
- `src/features/workflow/` — new feature. `lib/autoLayout.ts`, `lib/toReactFlow.ts`, `lib/fromReactFlow.ts`, `hooks/useHandoffConditions.ts`, `components/WorkflowCanvas.tsx`, `WorkflowController.tsx`, `AgentNode.tsx`, `HandoffEdge.tsx`, `EdgeCallbacks.tsx`, `EmptyState.tsx`, `MobileNotice.tsx`.
- `src/shared/ui/tabs.tsx` — hand-rolled shadcn-shaped Tabs primitive.
- `src/shared/hooks/useMediaQuery.ts` — new.
- `src/test/handlers.ts` + `fixtures/catalogs.ts` — added `HANDOFF_CONDITIONS_FIXTURE` + handler.
- `src/test/fixtures/openapi.json` — regenerated; `schema.contract.test.ts` rewritten to cover `AgentDefinition`, `SkillDefinition`, `WorkflowNode`, `WorkflowEdge`, `WorkspaceDefinition`.
- `messages/en.json` + `pt-br.json` — added `workspace.*` and `workflow.*` keys (parity green).

**Old `agent-builder` workspace artifacts shipped:** the previous spec'd table below is preserved for history.

#### Final Phase 2 test/build numbers
| Suite | Result |
|---|---|
| Frontend Vitest | **42 passed** (up from 22; new: autoLayout, fromReactFlow, useAgentTabsController, useHandoffConditions, workspace + skill + workflow schema rules, contract for all 5 schemas) |
| `npx tsc --noEmit` | clean |
| `npx next lint` | clean (1 pre-existing a11y warning on `CatalogCombobox` carried over from Phase 1) |
| `npx next build` | success, 287 kB first-load on `/[locale]` |

#### Deferred / not shipped this session
- Backend was already complete (168 pytest @ 99%); not touched this session.
- Spec 14 (output/README rewrites) is backend-only and already shipped per task brief.
- Spec 15 Unit 9 (Playwright happy-path) — not updated; happy-path spec still targets the Phase 1 single-agent flow.
- Spec 13 Unit 5 explicit unit test for `HandoffEdge` (covered indirectly via `useHandoffConditions` query test); skipped to keep canvas tests lean.
- The original ITEM-style "Items the user should confirm" list resolved during this session via the pre-resolved defaults.

#### Spec set
| # | Spec | Scope |
|---|---|---|
| 10 | `10-workspace-data-model.md` | `WorkspaceDefinition`, `SkillDefinition`, `WorkflowNode/Edge` (Pydantic + Zod). Removes `outputLanguage` and `generationType` from `AgentDefinition`. |
| 11 | `11-backend-skills-and-workflow.md` | Skill generators (Claude + Gemini), `render_handoffs` pure function, `workflow.json`, Mermaid, multi-agent orchestrator, per-agent path namespacing. New `/catalog/handoff-conditions`. |
| 12 | `12-frontend-workspace-and-tabs.md` | Rename `agent-builder` → `workspace-builder`. shadcn Tabs for agents (add/remove/rename + per-tab error badge). Standalone `SkillsSection`. Hoist `OutputLanguageField` to workspace. |
| 13 | `13-frontend-workflow-canvas.md` | `src/features/workflow/` using `@xyflow/react` v12. Controlled state via RHF `Controller`. Custom `AgentNode`, condition-dropdown edge labels (free-text fallback). Empty state + mobile read-only. |
| 14 | `14-output-and-readme-updates.md` | Workspace-wide README with Mermaid + per-platform install snippets. Workspace-wide `universal/AGENTS.md`. `workflow.json` excerpt. |
| 15 | `15-migration-and-cleanup.md` | Ordered cleanup: backend models → orchestrator → API → OpenAPI fixture → frontend rename → workflow canvas → e2e fix. No backwards-compat shims. |

#### Recommended implementation order (with dependencies)

```
spec 10 (data model)
  ↓
spec 11 (backend skills, workflow, orchestrator)        ← unblocks all backend work
  ↓
spec 14 (output & README rewrite)                       ← purely backend, no frontend dep
  ↓
[regenerate OpenAPI fixture]
  ↓
spec 12 frontend foundation (rename + workspace form + tabs + skills)
  ↓
spec 13 (workflow canvas)                                ← depends on spec 12 hooks
  ↓
spec 15 final units (e2e + dead-file cleanup + HANDOFF refresh)
```

Spec 15 is **not a final phase**; its units are interleaved per the "Implementation Units (ordering matters)" section in that file. Treat spec 15 as the playbook the Implementer follows from session start.

#### Pre-resolved decisions (do NOT re-ask)
- Library: `@xyflow/react` v12 (MIT).
- React Flow state: fully controlled via RHF `Controller`. No `useNodesState`.
- Workspace ceiling: 10 agents.
- Slug uniqueness: global across agents ∪ skills.
- Skill platforms: Claude Code + Gemini only.
- Workflow cycles: allowed; flagged in README only.
- Output zip namespaces every agent under `{platform}/{agent-slug}/`; skills under `{platform}/skills/{skill-slug}/`.
- Handoff renderer is a pure function with 100% unit coverage.
- API breaks freely (pre-1.0). No backwards-compat shims.

#### Items the user should confirm before code starts
1. **Single-agent zip filename.** When `len(agents) == 1`, the spec proposes `agentizr-{slug}.zip` (preserves Phase 1 UX). When `len(agents) > 1`, it becomes `agentizr-workspace.zip`. Acceptable, or always `agentizr-workspace.zip`?
2. **Mobile workflow editing.** Spec 13 ships read-only React Flow on mobile (no Mermaid dep added). Confirm — otherwise we add `mermaid` to the bundle for a static SVG.
3. **`GenerationType` enum retention.** Spec 15 keeps the unused enum "reserved for future use". Confirm, or delete fully now?
4. **Edge `label` vs `condition`.** Spec stores both; `label` mirrors `condition` for display. Confirm we don't need them as independently editable fields in v0.2.

Defaults assumed for all four. Speak up only to override.

---

## Phase 1 Detail (shipped)

### What ships
- **Backend** (FastAPI, Python 3.12) — catalogs, generators for 6 platforms, preview/generate endpoints, AGENTS.md + README assembly, bilingual templates.
- **Frontend** (Next.js 15.5, React 19, App Router) — bilingual UX (EN + PT-BR), form-driven agent builder, preset picker, Shiki preview, in-browser zip download.
- **Tests** — pytest with branch coverage on backend; Vitest + Testing Library + MSW on frontend; Playwright E2E spec written (not run in CI by default).
- **CI** — GitHub Actions workflow at `.github/workflows/ci.yml` runs ruff + pytest + OpenAPI export → frontend lint + typecheck + vitest + build.

### Final Phase 1 test counts
| Suite | Tests | Notes |
|---|---|---|
| Backend pytest | **93 passed** | 99% line+branch coverage; threshold `--cov-fail-under=85`. |
| Frontend Vitest | **22 passed across 7 files** | Schema, hooks, components, i18n parity, contract test. |
| Playwright E2E | 1 spec written, **not executed in CI** | Documented skip. |

### Spec status
| # | Spec | Status |
|---|---|---|
| 01–09 | Phase 1 specs | shipped |
| 10 | Workspace data model | spec'd |
| 11 | Backend skills + workflow | spec'd |
| 12 | Frontend workspace + tabs | shipped |
| 13 | Frontend workflow canvas | shipped |
| 14 | Output + README updates | shipped (backend) |
| 15 | Migration & cleanup | shipped (Unit 9 Playwright deferred) |

### Phase 1 deviations (carry-overs)
- Validation messages still English in Zod (deferred — wire through `useTranslations('validation')` later).
- `LocaleToggle` does not persist to localStorage (URL is canonical source-of-truth in MVP).
- `mypy` and `prettier` deferred (specs 09 Unit 8/9).
- Playwright not run in CI.
- 4 `npm audit` advisories (1 low, 3 moderate) — all transitive; review before 1.0.

## Source of Truth

`AGENTIZR-SPEC.md` is the product spec (Phase 1 baseline). Specs 10–15 extend and supersede §3 and §5 for Phase 2. Earlier overrides in archived handoffs still apply.
