# Integrations

## Core Sections (Required)

### 1) Appwrite

| Item | Value | Evidence |
|------|-------|----------|
| Endpoint (example) | `https://tor.cloud.appwrite.io/v1` | `.env.example` |
| Project / DB | `6990e2830030cacccd98`, `crm-main` | `.env.example`, `src/server/appwrite-schema.ts` |
| Client | `appwrite` SDK | `src/app/appwrite.ts` |
| Server | `node-appwrite` | `src/server/db.ts` |
| Config files | `appwrite.config.json`, `appwrite.json` | repo root |
| Functions | `appwrite-functions/newsletter-signup` | `appwrite-functions/newsletter-signup/src/index.js` |
| Generated types | `generated/appwrite/*` | `generated/appwrite/types.ts` |

Client fallback: `README.md` describes `localStorage` when cloud is unavailable — verify behavior in `src/app/appwrite.ts` before relying on docs alone.

### 2) Google Gemini

- Package: `@google/genai`
- Server routes: `/api/gemini/generate-lite`, `/api/gemini/generate-search`, sales personality coach/cringe under `/api/gemini/sales-personality/*`
- Env: `GEMINI_API_KEY` (`.env.example`)

Evidence: `src/server.ts`, `.env.example`.

### 3) Turso / LibSQL / AgentFS

| Piece | Usage |
|-------|--------|
| `@libsql/client` | CRUD for `agent_*` tables |
| `agentfs-sdk` | `AgentFS.open`, `tools.record` |
| Local files | `.agentfs/{tenant}.db` |
| Remote | `AGENT_LIBSQL_URL` + token, or `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` |

Evidence: `src/server/turso.ts`, `src/server/agentfs.ts`, `.env.example`.

Turso AgentFS product docs: https://docs.turso.tech/agentfs/sdk/typescript — SDK documents `AgentFS.open({ id })` → `.agentfs/{id}.db`; this repo also passes explicit `path` for `AGENTFS_DIR` / migration.

### 4) Nextcloud / CalDAV

- Proxy: `POST /api/nextcloud/calendar` in `src/server.ts`
- Client service: `src/app/nextcloud-calendar.service.ts`

### 5) Google Maps

- Dependency: `@angular/google-maps`
- Config endpoint: `GET /api/config/maps` in `src/server.ts`

### 6) Mail / IMAP

UI configuration for SMTP/IMAP hosts in `src/app/emails.component.ts` (template fields `imapHost`, `smtpHost`, etc.). No dedicated server IMAP client module found under `src/server/`.

### 7) Auth model

Appwrite Account + Teams; server routes use `teamId` on mutations per schema (`buildRowPermissions` in `appwrite-schema.ts`). Evidence: `SYSTEM_DOCUMENTATION.md` §8, `src/server/db.ts`.

### 8) Evidence

- `.env.example`
- `appwrite.config.json`, `appwrite.json`
- `src/app/appwrite.ts`
- `src/server/db.ts`, `src/server/appwrite-schema.ts`
- `src/server.ts`
- `src/server/turso.ts`, `src/server/agentfs.ts`
- `README.md`

## Extended Sections (Optional)

Not added.
