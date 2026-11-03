# AGENTS.md — lxv CRM

Angular 21 standalone-component CRM (zoneless, SSR) + Express backend in `src/server/`. Package manager is **bun@1.4.2** (not npm).

## Commands

- Install: `bun install` (CI uses `--frozen-lockfile`)
- Dev server: `bun run dev` — **`ng build --watch`** (parallel) + **`bun --hot scripts/dev-server.ts`** (`Bun.serve` on :3000 with **`development: { hmr, console }`**, embedded `/api`). Optional faster Angular rebuilds: `bun run dev:angular` (`ng serve` + Bun hot API). Production SSR: `bun run build` then `bun run serve:ssr:app` or `bun run compile:ssr`.
- Build: `bun run build` → **production SSR** (slow: browser + server bundle + minify). Quick compile check: `bun run build:fast` (static CSR, no server graph). Daily work: `bun run dev`.
- Serve SSR: `bun run serve:ssr:app`
- Lint: `bun run lint` (ESLint + angular-eslint)
- Angular tests: `bun run test` (Vitest via ng)
- Server tests: `bun test ./src/server` (bun test runner)
- DB setup: `bun run db:setup` (provisions Appwrite tables; needs `APPWRITE_API_KEY`)

CI order: `bun install --frozen-lockfile` → `bun test ./src/server` → `bun run build`.

## Architecture

- Frontend components: all standalone, live in `src/app/*.component.ts`; shared services `src/app/*.service.ts`.
- Server (SSR + `/api/*` proxies, secrets off client bundle): `src/server.ts`, `src/server/*.ts`.
- Shared clients/stubs: `src/lib/`.
- Appwrite schema registry: `src/server/appwrite-schema.ts`, `src/server/db.ts` (typed columns + legacy `dataPayload` read support).
- Agent persistence (LibSQL/Turso): `src/server/turso.ts`, `src/server/agentfs.ts`; local per-tenant SQLite at `.agentfs/{tenantId}.db`.
- Multi-tenant via Appwrite Teams; rows scoped by `teamId`.

## Conventions

- `ChangeDetectionStrategy.OnPush` + signals for new reactive state; prefer signal-based forms for new forms.
- Component selector: element, prefix `app`, kebab-case; directive: attribute, prefix `app`, camelCase (enforced by ESLint).
- TypeScript strict mode (`strict: true`, `noImplicitReturns`, etc.); target ES2022.
- Tailwind 4 CSS-first config (`@tailwindcss/postcss`); no `tailwind.config.js`.
- Use `inject()` for DI.
- Package manager bun; do not commit `node_modules` or lockfile drift.

## Testing quirks

- Server tests use bun's runner (`bun test ./src/server`), Angular tests use Vitest via `ng test`.
- DB setup requires Appwrite env vars in `.env`/`.env.local`.

## Existing instruction sources

- `.github/copilot-instructions.md` — comprehensive Copilot guidance.
- `SYSTEM_DOCUMENTATION.md`, `docs/codebase/` — architecture deep dives.
