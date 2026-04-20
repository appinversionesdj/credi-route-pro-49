# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Dev server on port 8080
npm run build      # Production build
npm run build:dev  # Dev build
npm run lint       # ESLint
npm run preview    # Preview production build
```

No test framework is configured. TypeScript type-checking runs implicitly through Vite.

## Stack

**CrediRoute Pro** — loan management and collection routing SPA (Spanish-language UI).

- React 18 + TypeScript + Vite (SWC)
- Routing: React Router v6 (all routes in `src/App.tsx`)
- Server state: TanStack React Query v5
- Auth + DB: Supabase (PostgreSQL, Auth, Realtime)
- UI: shadcn/ui + Radix UI + Tailwind CSS
- Forms: React Hook Form + Zod
- PDF export: jsPDF + jspdf-autotable
- Deployment: Vercel (SPA rewrite via `vercel.json`)

## Architecture

### Data Flow Pattern

All data access follows the same layered pattern:

1. **Supabase client** — `src/integrations/supabase/client.ts` (reads from `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY`)
2. **Custom hooks** — `src/hooks/use*.ts` — each hook owns one domain (rutas, prestamos, clientes, etc.). They wrap Supabase queries with React Query and expose `{ data, isLoading, error }` plus mutation functions.
3. **Page components** — `src/pages/` — consume hooks, delegate rendering to feature components.
4. **Feature components** — `src/components/<domain>/` — receive props from pages, no direct Supabase calls.

### Path Alias

`@/` maps to `./src/` (configured in `tsconfig.json` and `vite.config.ts`). Use this alias for all imports.

### Authentication

`src/contexts/AuthContext.tsx` wraps Supabase Auth. Protected routes check auth state; unauthenticated users are redirected to `/auth`. Session is persisted in localStorage.

### Key Domains

| Domain | Hook | Page | Components folder |
|---|---|---|---|
| Rutas (collection routes) | `useRutas` | `Rutas`, `RutaDetalle` | `src/components/rutas/` |
| Préstamos (loans) | `usePrestamos` | `Prestamos`, `PrestamoDetalle` | `src/components/prestamos/` |
| Clientes (borrowers) | `useClientes` | `Clientes` | `src/components/clientes/` |
| Conciliación (daily reconciliation) | `useConciliacion` | `BaseDiaria` | `src/components/conciliacion/` |
| Dashboard / KPIs | `useDashboard` | `Dashboard` | `src/components/dashboard/` |

### Supabase Schema (key tables)

`deudores`, `prestamos`, `cronograma_pagos`, `rutas`, `cobrador_ruta`, `usuarios`

Full schema and SQL seed script are documented in `SUPABASE_SETUP.md`. Auto-generated TypeScript types live in `src/integrations/supabase/types.ts` — do not edit manually.

### UI Conventions

- All shadcn/ui primitives are in `src/components/ui/` — prefer these over installing new component libraries.
- Tailwind CSS with HSL CSS variables for theming (primary `#2D3748`, accent `#4FD1C5`). Dark mode via `.dark` class.
- Toast notifications via `sonner` (`import { toast } from "sonner"`).
- Brand colors and design tokens documented in `COLORS_GUIDE.md`.

### PDF Generation

Report generation utilities live in `src/lib/`. They use jsPDF + jspdf-autotable directly — no server-side rendering.

## Environment Variables

```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_SUPABASE_PROJECT_ID
```

## TypeScript Notes

`tsconfig.json` has strict null checks **disabled** and `noImplicitAny` off. New code should still use explicit types, but the compiler won't enforce strictness on existing code.
