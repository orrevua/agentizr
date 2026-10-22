# Agentizr Frontend

Next.js 15 App Router + React 19, Tailwind v4, shadcn/ui, TanStack Query, RHF + Zod, next-intl.

## Package manager
**npm** (pnpm was not available on this machine; switching is a drop-in `pnpm import`).

## Dev
```
cp .env.local.example .env.local
npm install
npm run dev
```
Backend must run at `http://localhost:8000` (override with `NEXT_PUBLIC_API_BASE_URL`).
