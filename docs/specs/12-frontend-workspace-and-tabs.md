# 12 — Frontend: Workspace Builder + Agent Tabs + Skills

**Status:** Draft
**Date:** 2026-06-23
**Related:** `06-frontend-agent-builder.md`, `10-workspace-data-model.md`, `11-backend-skills-and-workflow.md`

## Goal
Refactor `src/features/agent-builder/` into `src/features/workspace-builder/`. The form now holds a `WorkspaceDefinition`. Agents render in a shadcn `Tabs` strip with add / remove / rename and per-tab validation badges. Skills live in their own section (not a tab) because they aren't agents. The existing per-agent form is preserved verbatim — it just operates on the active tab's array entry.

## Decisions

- **One RHF form, one resolver.** A single `useForm<WorkspaceDefinition>` at the top; nested fields use array paths (`agents.0.name`, `skills.2.platforms`). No nested forms.
- **`useFieldArray` for both `agents` and `skills`.** Tabs/list reordering reads `fields` from those arrays.
- **Active tab state lives in React state, not RHF.** It's UI state, not form state. Persist via `useState`; reset to index 0 when active tab is removed.
- **Per-tab validation badge** uses RHF's `formState.errors.agents?.[i]` — present = red dot. Pure lookup, no recomputation.
- **Skills section is collapsible and below the agent tabs.** Renders only when at least one platform among any agent supports skills, but for UX simplicity always show it (skills aren't blocked by agent selection — they're independent generation units).
- **`OutputLanguageField` moves up to the workspace level.** Sidebar, top of the "OUTPUT" group, above the per-agent fields. The per-agent OutputLanguage field is deleted.
- **Tab renaming** edits `agents.{i}.name` directly via inline-edit pattern in the tab label; slug auto-derives downstream (existing `useSlugFromName` hook applies to the active agent).
- **No barrel files.** Each component import is explicit.

## Feature Folder (new)

```
src/features/workspace-builder/
├── components/
│   ├── WorkspaceBuilder.tsx          # Server Component shell (was AgentBuilder.tsx)
│   ├── WorkspaceForm.tsx             # Client; RHF root for WorkspaceDefinition
│   ├── AgentTabs.tsx                 # Client; tabs strip + add/remove/rename
│   ├── AgentTabPanel.tsx             # Client; wraps the existing AgentForm fields for agents[i]
│   ├── OutputLanguageField.tsx       # MOVED from agent-builder, now workspace-scoped
│   ├── SkillsSection.tsx             # Client; collapsible
│   ├── SkillList.tsx                 # Client; renders SkillRow for each skills[i]
│   ├── SkillRow.tsx                  # Client; per-skill compact editor
│   └── (existing field components, MOVED unchanged: PlatformSelector, ScopeRadio, IdentityFields,
│        InstructionsField, ActivationField, ModelField, MemoryField, GlobsField, CatalogCombobox)
├── hooks/
│   ├── useWorkspaceForm.ts           # was useAgentForm
│   ├── useSlugFromName.ts            # unchanged, now operates on path
│   └── useAgentTabsController.ts     # add/remove/rename, syncs to workflow.nodes (spec 13 reads this)
├── api/                              # unchanged hooks (tools/models/mcp/presets)
├── schema.ts                         # already updated in spec 10 unit 6
├── defaults.ts                       # spec 10 unit 7
└── types.ts
```

The old `src/features/agent-builder/` folder is **renamed** (not copy-pasted) — see spec 15 for the cleanup sequencing.

## Implementation Units

### Unit 1 — Rename feature folder + update imports
- **Files:** rename `frontend/src/features/agent-builder/` → `frontend/src/features/workspace-builder/`; update every import (`src/app/**`, tests). No content change yet.
- **Acceptance:** `npm run typecheck` clean. Existing tests still pass against unchanged components.

### Unit 2 — `useWorkspaceForm` replaces `useAgentForm`
- **Files:** `hooks/useWorkspaceForm.ts`, `hooks/useAgentForm.ts` (delete), tests
- **Change:** Returns `useForm<WorkspaceDefinition>({ resolver: zodResolver(workspaceSchema), defaultValues: makeEmptyWorkspace() })`.
- **Acceptance:** Default values parse against `workspaceSchema` minus the required free-text fields.

### Unit 3 — `WorkspaceForm` shell + `OutputLanguageField` hoisted
- **Files:** `components/WorkspaceForm.tsx`, `components/OutputLanguageField.tsx` (move + rewire path to `outputLanguage`), `components/WorkspaceBuilder.tsx`
- **Change:**
  - `WorkspaceForm` owns `useWorkspaceForm`, wraps `FormProvider`, renders sidebar (Platform/Scope/OutputLanguage live here — but `PlatformSelector` and `ScopeRadio` now bind to `agents.{activeIndex}.targetPlatforms` and `agents.{activeIndex}.scope`), the agent tabs region, the skills section, and the action buttons.
  - Pass `activeAgentIndex` (UI state) into per-agent field components via prop, not context, so they remain pure.
- **Acceptance:** Page renders with one default agent tab; `outputLanguage` change updates form state at the workspace level.

### Unit 4 — `useAgentTabsController` hook
- **Files:** `hooks/useAgentTabsController.ts`, test
- **Change:** Wraps `useFieldArray({ name: 'agents' })`. Exposes `add()`, `remove(index)`, `rename(index, name)`, `activeIndex`, `setActiveIndex`. On `add`: appends a blank agent AND appends a `workflow.nodes` entry `{ id: newSlug, position: autoLayout(index) }` via `setValue('workflow.nodes', ...)`. On `remove`: drops the agent, drops the matching `workflow.nodes` entry (by id), drops any `workflow.edges` where `source` or `target` equals the slug. On `rename`: updates `agents.{i}.name`; `useSlugFromName` re-derives the slug, then a side-effect updates the matching `workflow.nodes.id` and any edge `source/target` pointing at the old slug.
- **Acceptance:** Tests cover the three side-effects. Adding a 4th agent yields a workflow.node at sensible offset coordinates.

### Unit 5 — `AgentTabs` + `AgentTabPanel`
- **Files:** `components/AgentTabs.tsx`, `components/AgentTabPanel.tsx`, tests
- **Change:**
  - `AgentTabs`: shadcn `Tabs` `value={activeIndex}` with a `TabsList` of `TabsTrigger`s. Each trigger shows the agent's display name (inline-editable on double-click → input, blur to commit), a small red dot when `errors.agents?.[i]` exists, and an × button (disabled if `agents.length === 1`). Trailing `+ Add agent` button (disabled when `agents.length === 10`).
  - `AgentTabPanel`: wraps the existing field components (`IdentityFields`, `InstructionsField`, `ActivationField`, `ModelField`, `MemoryField`, `GlobsField`, `CatalogCombobox`×2, `PlatformSelector`, `ScopeRadio`) bound to `agents.{activeIndex}.*` paths.
- **Acceptance:** Adding two agents shows two tabs; errors in agent 0 show a red dot on tab 0 even when tab 1 is active.

### Unit 6 — `SkillsSection`, `SkillList`, `SkillRow`
- **Files:** `components/SkillsSection.tsx`, `components/SkillList.tsx`, `components/SkillRow.tsx`, tests
- **Change:**
  - `SkillsSection`: collapsible (`<details>` or shadcn `Collapsible`), heading "Skills (N)", "+ Add skill" button.
  - `SkillList`: `useFieldArray({ name: 'skills' })`.
  - `SkillRow`: compact card with name, description, instructions (smaller textarea, 8 rows), platforms checkbox group limited to Claude Code + Gemini, scope radio, `scaffoldDirs` toggle, remove button.
- **Acceptance:** Adding two skills appears in form state under `skills[0]` and `skills[1]`; removing the first leaves the second intact.

### Unit 7 — Wire preview/generate to the new payload shape
- **Files:** `src/features/preview/hooks/usePreviewMutation.ts`, `useGenerateMutation.ts`, tests; update MSW handlers in `src/test/handlers.ts`
- **Change:** Mutations now POST a `WorkspaceDefinition`. Response shapes unchanged.
- **Acceptance:** Preview button on the rebuilt form returns files for two agents + one skill in mocked tests.

### Unit 8 — i18n keys
- **Files:** `frontend/messages/en.json`, `frontend/messages/pt-br.json`, `src/shared/i18n/parity.test.ts`
- **Change:** Add keys under `workspace.*`: `addAgent`, `removeAgent`, `renameAgent`, `maxAgentsReached`, `skills.title`, `skills.add`, `skills.platforms`, `skills.scaffoldDirs`, plus error messages from `workspaceSchema` superRefine. Parity test stays green.
- **Acceptance:** No untranslated literals in the new components; parity test passes.

## Out of Scope
- Workflow canvas UI (spec 13).
- Drag-reorder of tabs (post-MVP).
- Bulk-import of agents (post-MVP).
- A separate skill editor full-screen modal — inline row is enough for v0.2.
