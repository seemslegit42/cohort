# lxv CRM — System architecture (index)

This file is a **high-level map** of runtime boundaries. Operational commands, package manager, CI, and file layout live in **`README.md`**, **`package.json`**, and **`docs/codebase/`** — not here.

**Product:** lxv CRM (RevOps / sales workspace)  
**Stack snapshot:** Angular 21 (SSR + prerender), Express 5 (`src/server.ts`), Appwrite CRM data, Gemini on server, LibSQL + AgentFS for agent workloads.

---

## Layer model

```
┌─────────────────────────────────────────────────────────────┐
│  Client — Angular 21 (standalone, lazy routes, OnPush)      │
│  Signals-first UI; new forms → Signal forms (policy)        │
│  src/app/*  ·  src/app/app.routes.ts                        │
└───────────────────────────┬─────────────────────────────────┘
                            │ same-origin /api/*  +  SSR HTML
┌───────────────────────────▼─────────────────────────────────┐
│  API + SSR — Express 5 + AngularNodeAppEngine               │
│  Secrets: GEMINI_API_KEY, APPWRITE_API_KEY (server only)    │
│  src/server.ts                                              │
└───────────────┬─────────────────────────────┬─────────────────┘
                │                             │
                ▼                             ▼
   ┌────────────────────────┐    ┌────────────────────────────┐
   │  CRM persistence       │    │  Agent / AI persistence      │
   │  Appwrite (crm-main)   │    │  @libsql/client + agentfs-sdk │
   │  src/server/db.ts      │    │  src/server/turso.ts         │
   │  src/server/           │    │  src/server/agentfs.ts       │
   │  appwrite-schema.ts    │    │  .agentfs/{tenant}.db local  │
   └────────────────────────┘    │  or Turso when configured    │
                                 └────────────────────────────┘
```

### Client layer

- **Bootstrap:** `src/main.ts` (browser), `src/main.server.ts` + `src/app/app.config.server.ts` (SSR).
- **Zoneless-ready:** `zone.js` is not a direct app dependency; change detection relies on **OnPush** and **signals** (`signal`, `computed`, `inject`) across feature components.
- **Rendering:** `angular.json` uses `outputMode: "server"`; `src/app/app.routes.server.ts` prerenders all routes (`RenderMode.Prerender`).
- **Shell:** root layout and global chrome in `src/app/app.ts`, `sidebar.component.ts`, `dock.component.ts`, `command-palette.component.ts`, AI/notifications drawers.
- **CRM client API:** `src/app/appwrite.ts` (Appwrite SDK, teams, auth, storage, DB). Optional **localStorage fallback** when cloud is unavailable (preview/dev).
- **Routes:** full path list in `src/app/app.routes.ts` (lazy `loadComponent` per path).

### API layer (`src/server.ts`)

Express handles JSON APIs under **`/api/*`**, then delegates non-API traffic to Angular SSR. Representative groups (see file for the full list):

| Area | Examples |
|------|----------|
| Gemini | `/api/gemini/generate-lite`, `/api/gemini/generate-search`, `/api/gemini/sales-personality/*` |
| CRM proxy | `/api/{collection}` CRUD (collections registered in server) |
| Leads / scoring | `/api/leads/*`, `/api/lead-scoring/*`, `/api/chat` |
| Agent coaching | `/api/agent/coaching-logs`, rate endpoint |
| Integrations | `/api/nextcloud/calendar`, `/api/config/maps` |

Server-side Appwrite access and row mapping: **`src/server/db.ts`**.

### Data layer boundaries

| Concern | Technology | Notes |
|---------|------------|--------|
| **CRM entities** | Appwrite database `crm-main` | Typed columns per table; **no new `dataPayload` writes**. Legacy rows may still be read via mapper fallback (`dataPayload` + `jsonKeys`). |
| **Schema registry** | `src/server/appwrite-schema.ts` | Single source of truth for table ids, columns, permissions helpers, `mapToAppwrite` / `mapFromAppwrite`. |
| **Provisioning** | `scripts/setup-database.ts` | Run via **`bun run db:setup`** (requires server API key in env). |
| **Agent SQL** | `@libsql/client` (`src/server/turso.ts`) | Coaching logs, conversation history, sales rules tables. |
| **Agent audit / kv / fs** | `agentfs-sdk` (`src/server/agentfs.ts`) | `tools.record` and AgentFS APIs on the same SQLite file locally. |
| **Agent env tiers** | `.env.example` | **Local / single VPS:** omit remote URL or use `file:` → `.agentfs/{tenantId}.db`. **Production / multi-instance:** `AGENT_LIBSQL_URL` + `AGENT_LIBSQL_AUTH_TOKEN` (Turso). |

**Appwrite tables (registry ids):** `leads`, `contacts`, `tasks`, `notes`, `notifications`, `contracts`, `emails`, `events`, `chatMessages`, `email_workflows`, `newsletter_subscribers`.

Generated client constants (if present): `generated/appwrite/`.

### Multi-tenancy & security (summary)

- Workspaces map to **Appwrite Teams**; CRM rows carry **`teamId`**; permissions built in `appwrite-schema.ts` (`buildRowPermissions`, team roles).
- Browser never receives **GEMINI** or **Appwrite admin** keys; session auth uses Appwrite Account on the client.

### AI

- Server uses **`@google/genai`** with `GEMINI_API_KEY`.
- Sales personality coach/cringe flows persist coaching data through **LibSQL** and record tools via **AgentFS** (see `src/server.ts` + `turso.ts` + `agentfs.ts`).

### Design system (pointer only)

Dark glass UI, Tailwind CSS v4 (`src/styles.css`, `.postcssrc.json`), Material Symbols. Details: **README.md** (Obsidian Iridescence section).

---

## Detailed documentation map

Use these files for depth; keep this index short.

| Topic | Document |
|-------|----------|
| Dependencies, commands, env vars | [docs/codebase/STACK.md](docs/codebase/STACK.md) |
| Directories, entry points, routing | [docs/codebase/STRUCTURE.md](docs/codebase/STRUCTURE.md) |
| Data flow, persistence split | [docs/codebase/ARCHITECTURE.md](docs/codebase/ARCHITECTURE.md) |
| Naming, TypeScript, forms policy | [docs/codebase/CONVENTIONS.md](docs/codebase/CONVENTIONS.md) |
| Appwrite, Gemini, Turso, AgentFS, CalDAV | [docs/codebase/INTEGRATIONS.md](docs/codebase/INTEGRATIONS.md) |
| Tests and CI | [docs/codebase/TESTING.md](docs/codebase/TESTING.md) |
| Drift, debt, operational risks | [docs/codebase/CONCERNS.md](docs/codebase/CONCERNS.md) |
| Onboarding & quick start | [README.md](README.md) |

---

## Key source files (quick reference)

| Path | Role |
|------|------|
| `src/app/appwrite.ts` | Client Appwrite integration & state |
| `src/app/app.routes.ts` | Route table |
| `src/server.ts` | Express + SSR + `/api/*` |
| `src/server/appwrite-schema.ts` | Typed Appwrite schema & mapper |
| `src/server/db.ts` | Server Appwrite CRUD |
| `src/server/turso.ts` | LibSQL agent domain tables |
| `src/server/agentfs.ts` | AgentFS open + tool recording |
| `appwrite.config.json` / `appwrite.json` | Appwrite project metadata |

---

*Last aligned with repo conventions: Bun toolchain, `db:setup`, typed Appwrite schema, LibSQL + AgentFS agent split. For historical narrative or per-component specs, use git history or extend `docs/codebase/` — not this file.*
