# lxv CRM — Architectural & Integration Guide

Welcome to the **lxv CRM** production-ready workspace documentation. This system is a highly optimized, single-tenant/multi-tenant capable sales agent suite and contract workflow system. It utilizes a modern **Angular (v21 Zoneless)** client architecture integrated with **Appwrite (Account, Databases, Teams, and Storage APIs)** and features elegant, dark-theme glassmorphism dashboards.

**Package manager:** [Bun](https://bun.sh) (`bun.lock`, `packageManager: bun@1.4.2`). Use `bun install`, `bun run <script>`, and `bun test` — not npm for day-to-day work.

---

## Quick start

```bash
bun install
cp .env.example .env   # configure Appwrite, Gemini, optional Turso agent URLs
bun run dev            # Angular dev server (port 3000)
bun run build          # production SSR build → dist/app
bun test ./src/server  # server unit tests
bun run test           # Angular unit tests (Vitest via ng)
```

Provision Appwrite tables (requires `APPWRITE_API_KEY` and related vars in `.env` / `.env.local`):

```bash
bun run db:setup
```

---

## Documentation

For a high-level architecture overview and specification index, see [SYSTEM_DOCUMENTATION.md](SYSTEM_DOCUMENTATION.md) or explore the deep dives in [`docs/codebase/`](docs/codebase/).

---

## 🏗️ Architectural Overview

```
                                 ┌──────────────────────────────────┐
                                 │       lxv CRM (Angular)        │
                                 └────────────────┬─────────────────┘
                                                  │
                  ┌───────────────────────────────┼──────────────────────────────┐
                  ▼                               ▼                              ▼
     ┌────────────────────────┐       ┌──────────────────────┐       ┌───────────────────────┐
     │  Appwrite Client SDK   │       │   Nextcloud Portal   │       │  Mail (IMAP/SMTP UI)  │
     │   (State, Auth, DB,    │       │     (CalDAV API)     │       │   in emails module    │
     │   Teams, and Storage)  │       └──────────────────────┘       └───────────────────────┘
     └────────────────────────┘
```

The system is split into two layers:

1. **Frontend (SPA)**: Zoneless-ready Angular 21 with Signals and `ChangeDetectionStrategy.OnPush`. **New forms** should use **Signal-based forms**; existing screens keep template-driven/reactive forms until opportunistic refactors.
2. **Backend**: Express in `src/server.ts` — SSR host, `/api/*` proxies (Gemini, Appwrite collections, agent coaching), secrets stay off the client bundle.

---

## 🔐 Appwrite Services Integration

All core CRM operations are managed via the `Appwrite` service provider (`src/app/appwrite.ts`).

### Multi-tenancy

Workspaces use Appwrite Teams; rows are scoped with `teamId` and team roles. Server mapping lives in `src/server/appwrite-schema.ts` and `src/server/db.ts` (typed columns with legacy `dataPayload` read support).

### Database setup

`scripts/setup-database.ts` provisions tables, attributes, and indexes from the schema registry. Run:

```bash
bun run db:setup
```

---

## 🤖 Agent persistence (LibSQL + AgentFS)

AI/agent data is **not** stored in Appwrite.

| Environment | Configuration | Behavior |
|-------------|---------------|----------|
| Local / single VPS | Omit `AGENT_LIBSQL_URL`, or set `file:...` | Per-tenant SQLite at `.agentfs/{tenantId}.db` via `@libsql/client` + `agentfs-sdk` (tool audit) |
| Production / multi-instance | `AGENT_LIBSQL_URL` (`libsql://...`) + `AGENT_LIBSQL_AUTH_TOKEN` | Remote Turso LibSQL for shared durability across replicas |

See `.env.example` for variable names. Implementation: `src/server/turso.ts`, `src/server/agentfs.ts`.

---

## 💾 Fail-Safe Hybrid Persistence Engine (CRM client)

When Appwrite cloud is unavailable or unconfigured, the client service can fall back to structured `localStorage` so previews still work (`src/app/appwrite.ts`). Live deployments should use Appwrite credentials.

---

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs on push/PR: `bun install --frozen-lockfile`, `bun test ./src/server`, `bun run build`.

---

## 🧹 Code quality

```bash
bun run lint
```

ESLint + angular-eslint; see `eslint.config.js`.

---

## 🎨 Design Language (Obsidian Iridescence)

* **Aesthetic**: Mesoamerican geometry + dark glass UI
* **Palette**: Charcoal base, teal/purple/gold accents
* **Typography**: Comfortaa + Lexend (see `src/index.html` / global styles)

Deeper architecture notes: `SYSTEM_DOCUMENTATION.md`, `docs/codebase/`.
