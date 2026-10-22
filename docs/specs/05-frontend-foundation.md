# 05 — Frontend Foundation

**Status:** Draft
**Date:** 2026-06-22
**Related:** `00-overview.md`

## Goal
Stand up the Next.js 15 app with the architectural conventions the user explicitly asked for: feature-sliced layout, Server Components by default, TanStack Query for all backend I/O, RHF + Zod for forms, shadcn/ui + Tailwind v4, next-intl for i18n. No business code yet — only the scaffold every other frontend spec assumes.

## Decisions

- **Next.js 15 App Router + React 19.** Server Components by default; mark Client Components explicitly with `"use client"` only at interaction leaves (form fields, preview tabs, locale toggle).
- **Feature-sliced layout.** Code lives in `src/features/<feature>/`, never in a flat `components/` dump. Shared primitives in `src/shared/`.
- **No barrel files.** Imports are deep (`@/features/agent-builder/components/AgentForm`) so dead-code elimination and refactors stay sharp.
- **Tailwind v4 with CSS-first config** (`@theme` block in `globals.css`).
- **shadcn/ui** for primitives — installed component-by-component as needed, lives in `src/shared/ui/`.
- **TanStack Query v5** as the single I/O layer. A tiny `apiClient` wraps `fetch` with base URL + JSON handling; all hooks live in `features/*/api/`.
- **Zod schema is hand-mirrored from Pydantic.** Justification: the schema is small, RHF uses Zod natively, and we want UI-tunable error messages. A contract test (spec 09) catches drift.
- **next-intl** with locale segment routing (`app/[locale]/...`). Default locale: `en`. Supported: `en`, `pt-br`.
- **lucide-react** for icons. No icon font, no SVG sprite custom system.
- **Path alias:** `@/*` → `src/*` via `tsconfig.json`.

## Folder Layout

```
frontend/
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts          # minimal — most config lives in globals.css
├── postcss.config.mjs
├── components.json             # shadcn config
├── messages/
│   ├── en.json
│   └── pt-br.json
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── layout.tsx      # Server Component: providers, intl
│   │   │   └── page.tsx        # Server Component: composes <AgentBuilder/>
│   │   ├── globals.css
│   │   └── favicon.ico
│   ├── features/
│   │   ├── agent-builder/      # spec 06
│   │   ├── preview/            # spec 07
│   │   └── catalogs/           # hooks for /catalog/* (spec 06 uses)
│   └── shared/
│       ├── ui/                 # shadcn primitives (Button, Input, ...)
│       ├── lib/
│       │   ├── api-client.ts   # fetch wrapper
│       │   ├── env.ts          # typed env access
│       │   └── cn.ts           # clsx + tw-merge
│       ├── i18n/
│       │   ├── routing.ts
│       │   └── request.ts
│       └── providers/
│           ├── QueryProvider.tsx
│           └── IntlProvider.tsx
└── tests/
    └── e2e/                    # Playwright (spec 09)
```

## Implementation Units

### Unit 1 — Next.js scaffold
- **Files:** `frontend/package.json`, `frontend/next.config.ts`, `frontend/tsconfig.json`, `frontend/postcss.config.mjs`, `frontend/src/app/globals.css`
- **Change:** Initialize via `pnpm create next-app@latest frontend --typescript --tailwind --app --src-dir --import-alias "@/*"`. Then strip the demo `page.tsx` content to a placeholder. Pin: Next 15.x, React 19.x.
- **Acceptance:** `pnpm dev` boots; visiting `/` renders a placeholder; `pnpm build` succeeds.

### Unit 2 — Tailwind v4 + shadcn init
- **Files:** `frontend/src/app/globals.css`, `frontend/components.json`, `frontend/src/shared/lib/cn.ts`, `frontend/src/shared/ui/button.tsx`
- **Change:** Replace `globals.css` with Tailwind v4 `@import "tailwindcss";` plus an `@theme` block (radius, neutral palette). Run `pnpm dlx shadcn@latest init` configured to install into `src/shared/ui`. Install one primitive (`button`) as a smoke test.
- **Acceptance:** `<Button/>` importable from `@/shared/ui/button`; tailwind classes resolve in dev.

### Unit 3 — Env + API client
- **Files:** `frontend/src/shared/lib/env.ts`, `frontend/src/shared/lib/api-client.ts`, `frontend/.env.example`
- **Change:**
  - `env.ts`: validate `NEXT_PUBLIC_API_BASE_URL` with Zod at module load, export typed `env`.
  - `api-client.ts`: `async function api<T>(path: string, init?: RequestInit): Promise<T>` — prefixes base URL, sets `Content-Type: application/json`, throws an `ApiError` containing the normalized error body on non-2xx.
- **Acceptance:** Missing env var fails fast; unit test mocks `fetch` and verifies error shape parsing.

### Unit 4 — TanStack Query provider
- **Files:** `frontend/src/shared/providers/QueryProvider.tsx`, modify `frontend/src/app/[locale]/layout.tsx`
- **Change:** Client Component `QueryProvider` wrapping `QueryClientProvider` with sensible defaults (`staleTime: 5min` for catalogs, `retry: 1`). Layout (Server Component) renders it around children.
- **Acceptance:** `useQuery` works in a leaf Client Component; React Query Devtools available in dev.

### Unit 5 — next-intl routing
- **Files:** `frontend/src/shared/i18n/routing.ts`, `frontend/src/shared/i18n/request.ts`, `frontend/src/middleware.ts`, `frontend/messages/en.json`, `frontend/messages/pt-br.json`, `frontend/src/app/[locale]/layout.tsx` (modify)
- **Change:** Configure `defineRouting({ locales: ['en','pt-br'], defaultLocale: 'en' })`. Middleware redirects `/` to `/{detected-locale}`. Layout uses `NextIntlClientProvider` with messages loaded server-side. Seed message files with a `common.appName` key.
- **Acceptance:** `/en` and `/pt-br` both render; `/` redirects; `useTranslations('common')('appName')` works in a Client Component.

### Unit 6 — Shared Zod schema (mirrors Pydantic)
- **Files:** `frontend/src/features/agent-builder/schema.ts`, `frontend/src/features/agent-builder/types.ts`, `frontend/src/features/agent-builder/schema.test.ts`
- **Change:** A single `agentDefinitionSchema` Zod object using camelCase keys matching the backend's aliases. Includes the same min/max constraints and enum unions as `01-backend-foundation` Unit 4. `type AgentDefinition = z.infer<typeof agentDefinitionSchema>`. No I/O — pure schema module.
- **Acceptance:** Tests cover slug regex, min/max bounds, `targetPlatforms` non-empty. The exported `AgentDefinition` type is referenced by every other frontend module.

### Unit 7 — Root page composition
- **Files:** `frontend/src/app/[locale]/page.tsx`, `frontend/src/features/agent-builder/components/AgentBuilder.tsx` (placeholder)
- **Change:** Server Component `page.tsx` renders `<AgentBuilder/>` placeholder + header from a `<Header/>` Server Component in `src/shared/ui/header.tsx`. Header includes app name and a Client-Component locale toggle.
- **Acceptance:** `/en` shows "Agentizr" header + placeholder; locale toggle switches messages.

## Out of Scope
- The form itself (spec 06), the preview panel (spec 07), presets UX (spec 08), tests beyond unit-level (spec 09).
- Auth, analytics, OG image generation.
