# 08 — i18n & Presets

**Status:** Draft
**Date:** 2026-06-22
**Related:** `05-frontend-foundation.md`, `06-frontend-agent-builder.md`, `03-backend-catalogs.md`

## Goal
Complete the bilingual UX (EN + PT-BR) and the preset selection flow. All UI strings live in `messages/{locale}.json`; presets are fetched from `/catalog/presets` and applied to the form via `reset()`.

## Decisions

- **Message namespacing by feature**: `common.*`, `agentBuilder.*`, `preview.*`, `presets.*`, `validation.*`. Avoids one giant flat namespace.
- **Validation messages live in messages files**, not in the Zod schema. The schema uses a custom `errorMap` that resolves message keys via a passed-in translator. Schema stays language-agnostic.
- **Preset application uses `form.reset(merge(currentDefaults, preset.definition))`** — never field-by-field `setValue`. Single atomic state update.
- **PT-BR is first-class, not an afterthought.** Both locales must have parity; the contract test in spec 09 enforces key parity.

## Implementation Units

### Unit 1 — Message file structure & EN baseline
- **Files:** `frontend/messages/en.json`, `frontend/messages/pt-br.json`
- **Change:** Define the full nested key tree (~80 keys). Sections: `common` (appName, save, cancel, loading), `agentBuilder` (titles, field labels, placeholders, helpers), `preview` (panel title, copy, download, empty state), `presets` (button, dialog title, descriptions), `validation` (one per Zod rule). EN has real strings; PT-BR is seeded with translations (don't leave placeholders).
- **Acceptance:** Both files parse as JSON; `Object.keys` produce identical nested key sets (verified by a test in spec 09).

### Unit 2 — Zod schema integration with i18n
- **Files:** `frontend/src/features/agent-builder/schema.ts` (modify), `frontend/src/features/agent-builder/i18n.ts`
- **Change:**
  - Schema fields use `.min(2, { message: 'validation.name.tooShort' })` — keys, not literals.
  - `i18n.ts` exports `useLocalizedResolver()` that wires `zodResolver(schema)` with a custom error formatter resolving message keys via `useTranslations('validation')`.
- **Acceptance:** Submitting an invalid form in PT-BR shows Portuguese error text.

### Unit 3 — Locale toggle component
- **Files:** `frontend/src/shared/ui/locale-toggle.tsx`, test
- **Change:** Client Component using next-intl's `useRouter` and `usePathname` to switch the locale segment. Persists last choice to `localStorage` (read on mount to override URL only if URL is default).
- **Acceptance:** Clicking toggles between `/en` and `/pt-br`; persistence verified.

### Unit 4 — Apply translations across existing components
- **Files:** all `frontend/src/features/agent-builder/components/*.tsx` (modify)
- **Change:** Replace hardcoded English strings with `t('agentBuilder.xxx')` calls. Each field component reads from its scoped namespace.
- **Acceptance:** Searching the `src/features/agent-builder` tree for raw English placeholder strings returns zero hits (lint rule or manual check).

### Unit 5 — Preset picker UI
- **Files:** `frontend/src/features/agent-builder/components/PresetPicker.tsx`, `frontend/src/features/agent-builder/hooks/useApplyPreset.ts`, test
- **Change:**
  - `PresetPicker`: shadcn `Dialog` triggered by a "Load preset" button in the form header. Body lists `PRESETS` from `usePresetsQuery` as cards (label + description). Clicking a card calls `applyPreset(preset)` and closes the dialog.
  - `useApplyPreset(form)`: returns `(preset) => form.reset({ ...currentDefaults, ...preset.definition })`. Slug auto-recomputes via existing `useSlugFromName`.
- **Acceptance:** Selecting "Security Auditor" fills tools, activation mode, and starter instructions; form remains valid.

### Unit 6 — Output language wiring
- **Files:** `frontend/src/features/agent-builder/components/OutputLanguageField.tsx`, test
- **Change:** A `Select` over `en` / `pt-br` that drives `AgentDefinition.outputLanguage`. Defaults to current UI locale on first render (using `useLocale`). User can override independently from UI locale.
- **Acceptance:** Switching UI locale doesn't override an explicit user choice for `outputLanguage`; default tracks UI locale only on initial mount.

### Unit 7 — Backend template translations
- **Files:** `backend/app/generators/templates/en/*.md`, `backend/app/generators/templates/pt-br/*.md`, modify any generator that uses templates
- **Change:** Move hardcoded English strings out of `agents_md.py` and `readme.py` into template files. Generator selects template via `TEMPLATES: dict[OutputLanguage, dict[str, str]]` lookup keyed by file name.
- **Acceptance:** Round-trip: `output_language='pt-br'` produces README and AGENTS.md with Portuguese boilerplate; structural keys (headings, paths) remain unchanged.

## Out of Scope
- Translating tool/MCP catalog descriptions (English only in catalog responses; UI overlays a translated tooltip if the locale-specific copy exists — deferred).
- Right-to-left support.
- Pluralization / ICU message format (none of the strings need it for MVP).
