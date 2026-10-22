# 06 — Frontend: Agent Builder Feature

**Status:** Draft
**Date:** 2026-06-22
**Related:** `05-frontend-foundation.md`, `AGENTIZR-SPEC.md` §7.1

## Goal
Build the main form feature: layout per spec §7.1 (sidebar = platforms/scope/output, main = definition fields), RHF + Zod, catalog-driven multi-selects, and a "Generate" button wired to spec 07's flow. Tools and MCP servers use a searchable combobox component with tooltips — the user's central UX requirement.

## Feature Folder

```
src/features/agent-builder/
├── components/
│   ├── AgentBuilder.tsx          # Server Component shell
│   ├── AgentForm.tsx             # Client; RHF root
│   ├── PlatformSelector.tsx      # Client; checkbox grid
│   ├── ScopeRadio.tsx            # Client
│   ├── OutputModeRadio.tsx       # Client
│   ├── IdentityFields.tsx        # Client; name/description/slug preview
│   ├── InstructionsField.tsx     # Client; textarea + char counter
│   ├── ActivationField.tsx       # Client; select
│   ├── ModelField.tsx            # Client; catalog-driven select
│   ├── MemoryField.tsx           # Client; select
│   ├── GlobsField.tsx            # Client; tag input
│   └── CatalogCombobox.tsx       # Client; reusable for tools + mcp servers
├── hooks/
│   ├── useAgentForm.ts
│   └── useSlugFromName.ts
├── api/
│   ├── useToolsQuery.ts
│   ├── useModelsQuery.ts
│   ├── useMcpServersQuery.ts
│   └── usePresetsQuery.ts        # used by spec 08
├── schema.ts                     # (created in spec 05 unit 6)
└── types.ts
```

## Decisions

- **One reusable `CatalogCombobox`** drives both Tools and MCP Servers. Props: `items: CatalogItem[]`, `value: string[]`, `onChange`, `placeholder`. The component is dumb; the parent supplies items from the right TanStack Query hook.
- **Field components are leaf Client Components.** `AgentForm` owns the `useForm` instance and passes `control` down; fields use `useController` rather than prop-drilling registers.
- **No if/else cascades for activation-mode-dependent visibility.** A `FIELD_VISIBILITY: Record<ActivationMode, FieldKey[]>` table drives which secondary fields show.
- **Slug field is derived, not editable, in MVP.** A small `useSlugFromName` hook watches `name` and writes `slug` via `setValue`.

## Implementation Units

### Unit 1 — TanStack Query hooks for catalogs
- **Files:** `frontend/src/features/agent-builder/api/useToolsQuery.ts`, `useModelsQuery.ts`, `useMcpServersQuery.ts`, `usePresetsQuery.ts`, `frontend/src/features/agent-builder/api/api.test.ts`
- **Change:** Each is a one-liner over `useQuery` calling `api('/catalog/tools')` etc. with `staleTime: 5min`. Export typed return shapes matching backend response models.
- **Acceptance:** Hook tests mock `api` and assert correct query keys + parsed data.

### Unit 2 — `useAgentForm` hook
- **Files:** `frontend/src/features/agent-builder/hooks/useAgentForm.ts`, `frontend/src/features/agent-builder/hooks/useSlugFromName.ts`
- **Change:** `useAgentForm(defaults?)` returns `useForm<AgentDefinition>({ resolver: zodResolver(agentDefinitionSchema), defaultValues: {...sensibleDefaults, ...defaults} })`. `useSlugFromName(form)` subscribes to `name` with `useWatch` and writes the derived slug via `setValue('slug', kebab(name), { shouldValidate: true })`.
- **Acceptance:** Unit tests prove `"Security Reviewer"` → slug `"security-reviewer"` and that defaults satisfy the schema.

### Unit 3 — `CatalogCombobox` (THE searchable multi-select)
- **Files:** `frontend/src/features/agent-builder/components/CatalogCombobox.tsx`, `frontend/src/shared/ui/{popover,command,badge,tooltip}.tsx` (shadcn add), `CatalogCombobox.test.tsx`
- **Change:**
  - Install shadcn primitives: `popover`, `command`, `badge`, `tooltip`.
  - Props: `{ items: { name: string; description: string; platforms?: string[] }[], value: string[], onChange: (next: string[]) => void, placeholder: string, emptyLabel: string }`.
  - Renders: trigger button → `Popover` containing `Command` with `CommandInput` (search), `CommandList` of `CommandItem`s. Each `CommandItem` wraps in a `Tooltip` whose content is the item's `description`. Selected items appear above the trigger as removable `Badge`s (click X to deselect).
  - Selection mutates `value` immutably; no internal state for the list.
  - Keyboard: arrow keys traverse; Enter toggles; Backspace on empty input removes last badge.
- **Acceptance:** Tests cover: search filters items, clicking an item toggles selection, tooltip content matches description, Badge × removes. Same component is rendered by Tools and MCP fields without modification.

### Unit 4 — `PlatformSelector`, `ScopeRadio`, `OutputModeRadio` (sidebar)
- **Files:** `PlatformSelector.tsx`, `ScopeRadio.tsx`, `OutputModeRadio.tsx`, sibling tests
- **Change:** Three small Client Components, each `useController`-driven. PlatformSelector is a 2-col grid of checkboxes with platform name + small description tooltip; enforces "at least one" via Zod (visual hint shown if invalid).
- **Acceptance:** Toggling all platforms off shows the schema error; selecting two yields `['claude-code','copilot']` in form state.

### Unit 5 — Identity + Instructions fields
- **Files:** `IdentityFields.tsx`, `InstructionsField.tsx`, tests
- **Change:**
  - `IdentityFields`: name input, description input, read-only slug preview (auto-derived). Char counters under each.
  - `InstructionsField`: textarea (min-height 240px), live char counter colored red past 6000 (Copilot warning band) and 50000 (hard limit).
- **Acceptance:** Counter color thresholds verified; description maxLength enforced by Zod.

### Unit 6 — Activation, Model, Memory, Globs fields
- **Files:** `ActivationField.tsx`, `ModelField.tsx`, `MemoryField.tsx`, `GlobsField.tsx`, tests
- **Change:**
  - `ActivationField`: shadcn `Select` over the 4 modes. On change, drives a `FIELD_VISIBILITY` lookup that conditionally renders `GlobsField`.
  - `ModelField`: filtered by selected platforms — pulls `MODELS` and shows only those whose `platforms` intersects current selection.
  - `MemoryField`: select over the 4 memory options; disabled if `claude-code` not selected (visual cue).
  - `GlobsField`: tag input — comma- or Enter-separated; basic glob shape hint in placeholder.
- **Acceptance:** Switching to `manual` activation hides globs input; switching back restores last value.

### Unit 7 — `AgentForm` composition
- **Files:** `AgentForm.tsx`, `AgentBuilder.tsx`, test
- **Change:**
  - `AgentBuilder` (Server Component) renders the page chrome.
  - `AgentForm` (Client) owns `useAgentForm`, lays out the two-column grid (sidebar + main per spec §7.1), composes all field components, and renders two action buttons: "Preview" and "Generate (.zip)" (wired in spec 07).
  - Use `FormProvider` so children can call `useFormContext` if needed.
- **Acceptance:** Filling all required fields and clicking Preview produces a valid `AgentDefinition` payload (logged in test).

## Out of Scope
- Preview panel rendering and zip download (spec 07).
- Preset selection UX (spec 08).
- Skill / root-context generation type toggles (post-MVP — `generation_type` is fixed to `agent` for now via hidden default).
