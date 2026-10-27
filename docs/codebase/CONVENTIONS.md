# Conventions

## Core Sections (Required)

### 1) Naming

| Area | Convention | Evidence |
|------|------------|----------|
| Components | `*.component.ts`, standalone `@Component`, selector prefix `app` | `eslint.config.js`, file names under `src/app/` |
| Services | `*.service.ts` | `lead.service.ts`, `sales-personality.service.ts` |
| Server modules | `src/server/*.ts`, imported from `src/server.ts` | `src/server.ts` |
| Appwrite tables | camelCase ids in code (`chatMessages`, `email_workflows`) | `src/server/appwrite-schema.ts` |

### 2) TypeScript compiler

Strict mode enabled: `strict`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`, `strictTemplates` (Angular). Evidence: `tsconfig.json`.

Bracket notation required for index-signature records (e.g. Appwrite row maps). Evidence: `src/server/appwrite-schema.ts`, `src/server/db.ts`.

### 3) Angular style (observed)

- **Standalone components** — no `NgModule` app structure in `src/app`
- **Lazy routes** — dynamic `import()` in `app.routes.ts`
- **OnPush** — default pattern on components inspected
- **Router** — `withComponentInputBinding()`, `withViewTransitions()` in `app.config.ts`
- **Zone.js** — not a direct dependency in `package.json`; docs describe “zoneless” execution

### 4) Linting

- Flat ESLint config: `eslint.config.js`
- Angular ESLint recommended + TypeScript ESLint recommended/stylistic
- Inline templates processed via `angular.processInlineTemplates`

### 5) Forms (team policy)

- **New UI:** Signal-based forms (align with signals + OnPush).
- **Existing components:** Keep template-driven / reactive forms; migrate only during targeted refactors.

### 6) Formatting

No Biome/Prettier config detected in scan. [TODO: confirm team formatter preference]

### 7) Imports

- Relative imports dominate under `src/app/`
- Server code uses `node:` built-ins (`node:fs`, `node:path` in `agentfs.ts`)
- `src/lib/node-appwrite-stub.ts` — stub for bundling contexts [TODO: where wired]

### 8) Git / commits

Recent history uses conventional `feat:` / `refactor:` prefixes (scan). High-churn files: `app.routes.ts`, `sidebar.component.ts`, `app.ts`, `leads.component.ts`, `server.ts`.

### 9) Evidence

- `tsconfig.json`
- `eslint.config.js`
- `src/app/app.routes.ts`, `src/app/app.config.ts`
- `docs/codebase/.codebase-scan.txt` (git churn, TODO scan)

## Extended Sections (Optional)

Not added.
