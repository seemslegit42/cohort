# Project Structure

## Core Sections (Required)

### 1) Repository layout

Single Angular application at repo root (not a monorepo). High-level tree from scan (source-focused):

| Path | Purpose |
|------|---------|
| `src/main.ts` | Browser bootstrap | 
| `src/main.server.ts` | SSR bootstrap |
| `src/server.ts` | Express + `/api/*` + Angular SSR |
| `src/app/` | Standalone components, routes, client services (~50+ `.ts` files) |
| `src/server/` | Server-only: Appwrite mapper, AgentFS, LibSQL |
| `src/lib/` | Shared stubs/helpers (`appwrite.ts`, `node-appwrite-stub.ts`) |
| `scripts/` | Appwrite DB setup (`setup-database.ts`, `setup-newsletter-db.js`) |
| `appwrite-functions/newsletter-signup/` | Appwrite function package |
| `generated/appwrite/` | Generated Appwrite types/constants |
| `public/` | Static assets |
| `docs/codebase/` | Codebase knowledge docs (this set) |

Local/runtime artefacts (gitignored in part): `.agentfs/*.db`, `agent_tenant_*.db`, `dist/`, `.angular/cache/`.

### 2) Entry points

| Entry | File |
|-------|------|
| Client | `src/main.ts` → `App` + `appConfig` |
| SSR | `src/main.server.ts` → `app.config.server.ts` |
| Server | `src/server.ts` (referenced by `angular.json` `ssr.entry`) |

### 3) Routing

- Route table: `src/app/app.routes.ts`
- Pattern: lazy `loadComponent` per path (no NgModule feature modules)
- Notable alias routes: `sequences` → `cadences`, `performance` → `sales-performance`
- Server prerender: all routes `RenderMode.Prerender` via `path: '**'` in `src/app/app.routes.server.ts`

### 4) Angular project metadata

- CLI project name: `app` (`angular.json`)
- Component selector prefix: `app` (`eslint.config.js`, `angular.json`)
- `package.json` `name`: `crm`

### 5) TypeScript paths

- `baseUrl`: `./` only — no `@/` path aliases in root `tsconfig.json`
- App compile: `tsconfig.app.json` (referenced by `angular.json`)

### 6) Evidence

- `docs/codebase/.codebase-scan.txt` (directory tree)
- `src/app/app.routes.ts`
- `angular.json`
- `tsconfig.json`, `tsconfig.app.json`
- `SYSTEM_DOCUMENTATION.md` §2 (may be partially stale vs current `src/server/` files)

## Extended Sections (Optional)

Largest source files by scan: `src/app/leads.component.ts`, `contacts.component.ts`, `campaigns.component.ts`, `cadences.component.ts`, `systems.component.ts`.
