# ΛΞVOS CRM — Enterprise Revenue & Operations Operating System

[![Angular](https://img.shields.io/badge/Angular-21.0.0-DD0031.svg?style=flat&logo=angular)](https://angular.dev/)
[![Appwrite](https://img.shields.io/badge/Appwrite-26.1.0-FD366E.svg?style=flat&logo=appwrite)](https://appwrite.io/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-3.8%20Flash-4285F4.svg?style=flat&logo=google)](https://ai.google.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.1.12-38B2AC.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Turso](https://img.shields.io/badge/Turso-LibSQL%20SQLite-00E599.svg?style=flat&logo=sqlite)](https://turso.tech/)

> **"The Future Needs Context — Innovate, Automate, Dominate"**  
> *ΛΞVOS (Laevos OS)* is a next-generation revenue acceleration platform and enterprise workspace suite. Built on **Zoneless Angular 21**, it pairs **Obsidian Iridescence** dark aesthetics with real-time **Appwrite Cloud**, **Turso LibSQL** edge agent storage, and **Google Gemini** generative intelligence.

---

## ⚡ Key Highlights & Capabilities

* **Zoneless Angular 21 Execution:** Native Angular Signals (`signal`, `computed`, `effect`) with `ChangeDetectionStrategy.OnPush` across all 47 components. Zero `zone.js` overhead for sub-millisecond UI rendering.
* **BEEP v2.0 & AI Sales Personality Coach:** Powered by `gemini-3.8-flash` across 4 distinctive sales archetypes (*The Reluctant Saviour*, *The Empathetic Strategist*, *The Challenger Oracle*, and *The Zen Closer*). Includes an **Anti-Slop Cringe Audit** scanner to eradicate generic corporate email templates.
* **RevOps Monte Carlo Simulator:** 1,000-iteration stochastic ARR forecaster providing probabilistic P10, P50, and P90 revenue distributions, AE ramp velocity modeling, and tiered commission accelerators.
* **Enterprise Deal War-Rooms:** Buying Committee Influence Matrix tracking Champions, Economic Buyers, and Blockers alongside Mutual Action Plans (MAP) and Objection Battlecard simulators.
* **100-Point Predictive Lead Scoring:** Dynamic dual index evaluating 50 points Demographic Fit + 50 points Behavioral Digital Intent with live calibration drawers and behavioral activity simulators.
* **Legal & Contracts Vault Suite:** Self-serve MSA, NDA, DPA, and SLA generation with an HTML5 Canvas digital signature pad, SHA-256 cryptographic verification hashes, and direct Appwrite Storage file management.
* **Fail-Safe Hybrid Persistence Engine:** Transparent failover between live Appwrite Cloud (`leadwave-main`) and structured local memory stores. Runs flawlessly in online, preview, and offline environments.
* **Ergonomic Keyboard Navigation:** Omnipresent Command Palette (`⌘K`), Web Speech API voice dictation (`Shift+V`), quick record creation (`Q`), inline pipeline search (`/`), and Gnosis Stoic Aphorism Generator (`G`).

---

## 🏗️ System Architecture

```
                                 ┌──────────────────────────────────┐
                                 │       ΛΞVOS CRM (Angular 21)     │
                                 │       Zoneless + Signals + OnPush│
                                 └────────────────┬─────────────────┘
                                                  │
                 ┌────────────────────────────────┼──────────────────────────────┐
                 ▼                                ▼                              ▼
    ┌────────────────────────┐       ┌──────────────────────┐       ┌────────────────────────┐
    │   Appwrite Client SDK  │       │ Express 5.x Gateway  │       │  Web Speech Dictation  │
    │   (Account, Databases, │       │  (SSR, Proxy, Cache) │       │  (Live Speech-to-Text  │
    │   Teams, and Storage)  │       └──────────┬───────────┘       │   Audio Waveform Note) │
    └────────────────────────┘                  │                   └────────────────────────┘
                                                │
             ┌──────────────────────────────────┼────────────────────────────────┐
             ▼                                  ▼                                ▼
┌────────────────────────┐         ┌────────────────────────┐       ┌────────────────────────┐
│  Google GenAI (Gemini) │         │  Turso LibSQL Database │       │  External Gateways     │
│  • 3.1 Flash Lite      │         │  • Database-per-Tenant │       │  • Nextcloud CalDAV    │
│  • 3.5 Flash (Search)  │         │  • Parameterized SQL   │       │  • Mailchimp/SendGrid  │
│  • 3.8 Flash (BEEP AI) │         │  • Agent Coaching Logs │       │  • Google Maps Cluster │
└────────────────────────┘         └────────────────────────┘       └────────────────────────┘
```

---

## 🧭 Navigation & Domain Route Directory (All 24 Routes)

| Domain | Route | Component | Key Feature |
| :--- | :--- | :--- | :--- |
| **Strategy** | `/deal-rooms` | `DealRoomsComponent` | Buying Committee influence matrix & Mutual Action Plans |
| **Strategy** | `/revops-simulator` | `RevopsSimulatorComponent` | 1,000-run Monte Carlo ARR forecaster & AE ramp capacity |
| **Strategy** | `/sales-personality`| `SalesPersonalityComponent`| BEEP v2.0 AI coach, cringe detector & sound FX |
| **Strategy** | `/sales-performance`| `SalesPerformanceComponent`| Rep quota leaderboard, sales velocity & superpowers |
| **Strategy** | `/cadences` | `CadencesComponent` | Outbound multi-touch sequences & Liquid templates |
| **Strategy** | `/contracts` | `ContractSuiteComponent` | MSA/NDA/SLA generator, canvas signature & SHA-256 seal |
| **Operations** | `/` | `DashboardComponent` | Executive ARR overview, discovery calendar, recent leads |
| **Operations** | `/tasks` | `TasksComponent` | Action items Kanban board with Appwrite sync |
| **Operations** | `/notes` | `NotesComponent` | Knowledge base, voice memos & meeting transcripts |
| **Operations** | `/emails` | `EmailsComponent` | Unified communications client & thread tracker |
| **Operations** | `/campaigns` | `CampaignsComponent` | Multi-channel campaigns & one-click audience sync |
| **Operations** | `/calendar` | `CalendarComponent` | Nextcloud CalDAV event scheduler |
| **Operations** | `/scheduler` | `SchedulerComponent` | Public-facing 30-min discovery call reservation portal |
| **Operations** | `/deployment-checklist` | `DeploymentChecklistComponent` | Production cloud verification matrix |
| **Analytics** | `/reports` | `ReportsComponent` | Financial telemetry, cohort breakdowns & CSV export |
| **Analytics** | `/lead-scoring` | `LeadScoringComponent` | 100-pt AI lead scoring & weights calibration drawer |
| **Analytics** | `/forecast` | `ForecastComponent` | Predictive pipeline forecasting & sensitivity sliders |
| **Analytics** | `/pipeline-signals` | `PipelineSignalsComponent` | Real-time buyer intent detection & funding alerts |
| **Analytics** | `/automations` | `AutomationsComponent` | Event-action triggers & Appwrite function webhooks |
| **Analytics** | `/workflows` | `WorkflowsComponent` | Visual DAG workflow graph for deal escalation |
| **Analytics** | `/email-workflows` | `EmailWorkflowsComponent` | Multi-step trigger workflows with integrated A/B testing |
| **Analytics** | `/newsletter` | `NewsletterComponent` | Audience segment manager & broadcast analytics |
| **Records** | `/clients` | `ClientsComponent` | Enterprise customer accounts & subscription tiers |
| **Records** | `/leads` | `LeadsComponent` | Lead management (Kanban, Table, Google Maps) |
| **Records** | `/contacts` | `ContactsComponent` | Relationship directory with 3P marketing sync |
| **Systems** | `/systems` | `SystemsComponent` | Infrastructure telemetry (Appwrite latency, uptime) |
| **Systems** | `/settings` | `SettingsComponent` | Appwrite project config, team RBAC, and API keys |

---

## ⌨️ Ergonomic Hotkeys & Dock Controls

| Hotkey | Action | Behavior |
| :--- | :--- | :--- |
| `⌘K` / `Ctrl+K` | **Command Palette** | Launches omnipresent spotlight search & quick actions |
| `Shift+V` | **Voice Dictation** | Activates Web Speech API recording with live animated audio waveform |
| `Q` | **Quick Create** | Opens instant record creation modal for leads and action items |
| `/` | **Pipeline Search** | Expands rapid inline search querying active CRM leads |
| `1` | **Dashboard** | Navigates to `/` (Executive Dashboard) |
| `2` | **War Room** | Navigates to `/deal-rooms` (Deal War-Rooms) |
| `3` | **Cadences** | Navigates to `/cadences` (Outbound Sequences) |
| `4` | **Leads** | Navigates to `/leads` (Leads Pipeline) |
| `5` | **RevOps** | Navigates to `/revops-simulator` (Monte Carlo Simulation) |
| `6` | **Tasks** | Navigates to `/tasks` (Operational Action Board) |
| `7` | **Vault** | Navigates to `/contracts` (Legal & Contracts Vault) |
| `G` | **Gnosis Oracle** | Generates stoic philosophical reflections on mortal revenue pursuits |

---

## 🛠️ Developer Setup & Database Seeding

### 1. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Populate your environment variables:
```ini
# Google Gemini API Key
GEMINI_API_KEY="your-gemini-key"

# Appwrite Cloud Config
NEXT_PUBLIC_APPWRITE_ENDPOINT="https://tor.cloud.appwrite.io/v1"
NEXT_PUBLIC_APPWRITE_PROJECT_ID="6990e2830030cacccd98"
NEXT_PUBLIC_APPWRITE_DATABASE_ID="leadwave-main"
APPWRITE_API_KEY="your-node-appwrite-key"

# Turso Agent Database (Optional: falls back to local SQLite file)
TURSO_DATABASE_URL=""
TURSO_AUTH_TOKEN=""

# Google Maps Platform Key (Optional)
GOOGLE_MAPS_PLATFORM_KEY=""

# Server Port
PORT="3000"
```

### 2. Database Schema Seeding
Run the automated TypeScript setup script to provision collections, attributes, and team permissions on Appwrite Cloud:
```bash
npm run setup-db
```

### 3. Running Development Server
```bash
# Starts Node Express server + Angular SSR dev server on port 3000
npm run dev
```

### 4. Code Quality & Linting
```bash
# Validates TypeScript strict mode and Angular ESLint rules (0 errors enforced)
npm run lint
```

### 5. Production SSR Build
```bash
# Compiles client bundle and Node.js server bundle
npm run build

# Launches production SSR instance
npm run serve:ssr:app
```

---

## 🔐 Security & Access Control

1. **Server-Side Secret Encapsulation:** Private API keys (`GEMINI_API_KEY`, `APPWRITE_API_KEY`, `TURSO_AUTH_TOKEN`) are strictly scoped to the server runtime.
2. **Team-Based Tenant Isolation:** All Appwrite queries and document creations enforce `Permission.read(Role.team(teamId))` and `Permission.write(Role.team(teamId))`.
3. **Database-per-Tenant Edge Storage:** Turso client creates isolated SQLite database instances (`agent_tenant_<key>.db`) for each tenant's AI reasoning logs.
4. **Cryptographic Sealing:** Legal contracts generated in the contract suite generate an SHA-256 digital verification hash computed from contracting parties, terms, liability caps, and date parameters.

---

## 📖 Deep Architectural Documentation

For the complete 1,000+ line specification covering all REST API request/response payloads, database schemas, TypeScript interfaces, and operational runbooks, see:
👉 **[SYSTEM_DOCUMENTATION.md](./SYSTEM_DOCUMENTATION.md)**

---

*Authored and certified for the ΛΞVOS Platform Codebase.*
