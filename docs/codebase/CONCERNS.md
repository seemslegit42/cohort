# Concerns

## Core Sections (Required)

### 1) Documentation vs code drift

| Doc claim | Code reality | Evidence |
|-----------|--------------|----------|
| README / SYSTEM_DOCUMENTATION stale Appwrite `dataPayload` story | Typed schema + `bun run db:setup`; legacy read path only | `README.md`, `package.json`, `src/server/appwrite-schema.ts` |
| `src/server/` only `db.ts` in SYSTEM_DOCUMENTATION tree | Also `appwrite-schema.ts`, `turso.ts`, `agentfs.ts`, specs | `SYSTEM_DOCUMENTATION.md` §2 vs `src/server/` |
| “47 components” count | 42 `*.component.ts` files under `src/app/` (glob count) | `SYSTEM_DOCUMENTATION.md` |

### 2) Security / secrets

- API keys expected via env (`GEMINI_API_KEY`, `APPWRITE_API_KEY`) — not committed in `.env.example` placeholders
- No Dependabot/Snyk/SECURITY.md in repo scan
- Server proxies reduce browser exposure of keys; client still uses Appwrite session model

### 3) Operational / performance

- Production bundle initial budget warning at 500 kB (build exceeds ~850 kB initial)
- Large components (`leads.component.ts` ~114 KB source) — maintenance and test cost
- Dual SQLite access (LibSQL client + AgentFS) on same file can cause `database is locked` under parallel SSR prerender
- SSR: relative `fetch('/api/...')` without base URL can fail during prerender (invalid URL errors observed in build logs)

### 4) Tech debt signals

- Single production TODO in scan: `src/app/tasks.component.ts` (template comment)
- Canonical Appwrite provisioning: `bun run db:setup` → `scripts/setup-database.ts`; `.js` stub may still exist
- Remote Turso LibSQL vs local AgentFS file for `tools.record` when only cloud LibSQL is configured — [TODO: verify in production]

### 5) High-churn / fragile areas (90-day git scan)

`src/app/app.routes.ts`, `sidebar.component.ts`, `app.ts`, `command-palette.component.ts`, `dashboard.component.ts`, `leads.component.ts`, `server.ts`, `appwrite.ts`

### 6) Beta upstream

AgentFS SDK documented as BETA on Turso docs; `agentfs-sdk@^0.6.4` in production dependency tree.

### 7) Evidence

- `README.md`, `SYSTEM_DOCUMENTATION.md`
- `package.json`, `angular.json`
- `docs/codebase/.codebase-scan.txt`
- Prior `ng build` output (budget warnings, AgentFS/prerender logs)
- `src/server/turso.ts`, `src/server/agentfs.ts`

## Extended Sections (Optional)

Not added.
