# Technology Stack

## Core Sections (Required)

### 1) Runtime Summary

| Area | Value | Evidence |
|------|-------|----------|
| Primary language | TypeScript | `tsconfig.json`, `src/**/*.ts` |
| Runtime + version | Node.js 24.19.0 (local `ng version` output) | `bun run ng version` (2026-10-27) |
| Package manager | Bun `1.4.2` (`packageManager` field, `bun.lock`) | `package.json`, `angular.json`, `bun.lock` |
| Module/build system | Angular application builder (`@angular/build:application`), SSR entry `src/server.ts` | `angular.json`, `package.json` scripts |

### 2) Production Frameworks and Dependencies

| Dependency | Version (manifest) | Role in system | Evidence |
|------------|-------------------|----------------|----------|
| `@angular/*` | `^21.0.0` (installed ~21.2.25 per `ng version`) | SPA + SSR UI | `package.json`, `src/main.ts` |
| `appwrite` | `^26.1.0` | Browser Appwrite SDK (auth, DB, teams, storage) | `package.json`, `src/app/appwrite.ts` |
| `node-appwrite` | `^26.2.0` | Server-side Appwrite API | `package.json`, `src/server/db.ts` |
| `express` | `^5.1.0` | API proxy + SSR host | `package.json`, `src/server.ts` |
| `@google/genai` | `^2.4.0` | Gemini on server routes | `package.json`, `src/server.ts` |
| `@libsql/client` | `^0.18.0` | Agent domain SQL (coaching logs, history, rules) | `package.json`, `src/server/turso.ts` |
| `agentfs-sdk` | `^0.6.4` | Agent tool audit / kv / fs on SQLite | `package.json`, `src/server/agentfs.ts` |
| `chart.js` | `^4.5.1` | Charts in UI | `package.json` |
| `motion` | `^12.23.24` | UI motion | `package.json` |
| `rxjs` | `~7.8.0` | Angular async primitives | `package.json` |
| `dotenv` | `^17.4.2` | Env loading on server | `package.json`, `src/server.ts` |

`zone.js` is not listed in `package.json` dependencies; `@angular/core` lists `zone.js` as an optional peer in the lockfile.

### 3) Development Toolchain

| Tool | Purpose | Evidence |
|------|---------|----------|
| `@angular/cli` / `@angular/build` | Build, serve, test, lint | `package.json`, `angular.json` |
| `typescript` ~5.9 | Compile | `package.json`, `tsconfig.json` |
| `eslint` + `angular-eslint` + `typescript-eslint` | Lint | `eslint.config.js`, `package.json` |
| `tailwindcss` v4 + `@tailwindcss/postcss` | Styling | `package.json`, `.postcssrc.json`, `src/styles.css` |
| `vitest` | Angular unit test runner (via `@angular/build:unit-test`) | `package.json`, `angular.json` |
| Bun | Server tests (`bun test`) | `package.json` `test:server` |

### 4) Key Commands

```bash
bun install
bun run dev
bun run build
bun run test
bun run test:server   # bun test ./src/server
bun run db:setup
bun run lint
bun run serve:ssr:app
```

### 5) Environment and Config

- Config sources: `.env.example`, `angular.json`, `appwrite.config.json`, `appwrite.json`, `metadata.json`
- Required env vars (from `.env.example` comments): `GEMINI_API_KEY`, `APP_URL`, Appwrite `NEXT_PUBLIC_*` / `APPWRITE_*`, optional agent vars `AGENT_DEFAULT_TENANT`, `AGENT_LIBSQL_URL`, `AGENT_LIBSQL_AUTH_TOKEN`, `AGENTFS_DIR`, legacy `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`
- Deployment/runtime: SSR output under `dist/app`; Express serves `/api/*` then Angular SSR (`src/server.ts`)

### 6) Evidence

- `package.json`
- `bun.lock`
- `angular.json`
- `tsconfig.json`
- `.env.example`
- `docs/codebase/.codebase-scan.txt`

## Extended Sections (Optional)

Not populated — single-app repo, no multi-environment matrix in repo.
