# Architecture

## Core Sections (Required)

### 1) System intent (from docs)

**Stated intent** (`README.md`, `SYSTEM_DOCUMENTATION.md`): lxv CRM — zoneless Angular 21 SPA with Appwrite for CRM data, Express SSR server as secure `/api` gateway, Gemini for AI features, multi-tenant teams via Appwrite.

### 2) Runtime layers

```
Browser ──► Angular 21 (standalone components, lazy routes)
              │
              ├──► Appwrite client SDK (src/app/appwrite.ts) ──► Appwrite Cloud
              └──► fetch to same-origin /api/* (sales personality, chat, etc.)

Node (src/server.ts)
  ├── Express JSON + CORS middleware
  ├── /api/gemini/*, /api/chat, /api/leads/*, collection CRUD proxies
  ├── /api/agent/* (LibSQL-backed coaching logs)
  ├── /api/nextcloud/calendar
  └── AngularNodeAppEngine SSR for non-API routes
```

Evidence: `src/server.ts` route registrations; `src/app/app.config.ts` (router only on client).

### 3) Data persistence split

| Concern | Store | Server module |
|---------|--------|---------------|
| CRM entities (leads, contacts, tasks, …) | Appwrite DB `crm-main` | `src/server/db.ts` + `src/server/appwrite-schema.ts` |
| Agent coaching / conversation / rules | LibSQL (`@libsql/client`) | `src/server/turso.ts` |
| Agent tool audit timeline | AgentFS SDK (`agent.tools.record`) | `src/server/agentfs.ts` |

**Tiered by environment** (team policy):

- **Local / single VPS:** Default when `AGENT_LIBSQL_URL` is omitted or `file:` — `.agentfs/{tenantId}.db`.
- **Production / multi-instance:** `AGENT_LIBSQL_URL` + `AGENT_LIBSQL_AUTH_TOKEN` → Turso Cloud LibSQL for shared storage across replicas.

Evidence: `src/server/turso.ts`, `src/server/agentfs.ts`, `.env.example`, `README.md`.

Legacy read path: rows may still expose merged fields from `dataPayload` via mapper (`legacyScalarKey`, `jsonKeys` in schema). Evidence: `src/server/appwrite-schema.ts`.

### 4) Appwrite schema registry

Eleven table IDs in `APPWRITE_TABLES`: `leads`, `contacts`, `tasks`, `notes`, `notifications`, `contracts`, `emails`, `events`, `chatMessages`, `email_workflows`, `newsletter_subscribers`. Evidence: `src/server/appwrite-schema.ts`.

Provisioning script: `scripts/setup-database.ts` driven by registry; `scripts/setup-database.js` exists separately.

### 5) Client state patterns

- Widespread `ChangeDetectionStrategy.OnPush` on components (grep across `src/app`)
- Signals used in shell and feature components (`signal`, `computed`, `inject` in e.g. `src/app/app.ts`)
- Central Appwrite wrapper with reactive state: `src/app/appwrite.ts` (large file)
- Domain services: e.g. `lead.service.ts`, `sales-personality.service.ts`, `email-workflow.service.ts`

Forms: mix of `FormsModule` / template-driven in places; not exclusively Signal Forms. [ASK USER] target forms strategy for new UI.

### 6) SSR / prerender

- `angular.json`: `outputMode: "server"`, SSR entry `src/server.ts`
- Build output: `dist/app` (verified by prior `ng build`)
- Known build-time logs: AgentFS SQLite lock warnings and relative `/api/...` fetch failures during prerender have been observed when multiple workers touch `.agentfs` or client calls `/api` without absolute URL during SSR. Evidence: prior build log; `sales-personality.service.ts` [TODO: confirm fetch URL construction]

### 7) Evidence

- `README.md`, `SYSTEM_DOCUMENTATION.md`
- `src/server.ts`
- `src/server/db.ts`, `src/server/appwrite-schema.ts`
- `src/server/turso.ts`, `src/server/agentfs.ts`
- `src/app/appwrite.ts`
- `src/app/app.config.ts`, `src/app/app.config.server.ts`

## Extended Sections (Optional)

Not added.
