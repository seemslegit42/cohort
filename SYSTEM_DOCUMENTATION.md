# ΛΞVOS (Laevos OS) — Comprehensive Master System Documentation & Architectural Specification

**System Designation:** ΛΞVOS Enterprise Revenue & Operations Operating System  
**Framework Version:** Angular v21.0.0 (Zoneless, SSR / Hydration Ready, Strict TypeScript)  
**Backend Infrastructure:** Node.js Express 5.x + Angular SSR (`AngularNodeAppEngine`)  
**Data & Storage Engine:** Appwrite Cloud (Database: `leadwave-main`, Storage Buckets, Teams Multi-Tenancy) & `node-appwrite`  
**AI Intelligence:** Google Gemini API (`@google/genai` v2.4.0 — `gemini-3.1-flash-lite` & `gemini-3.5-flash` with Google Search Grounding)  
**Styling & Design System:** Tailwind CSS v4, Iridescent Verdigris & Ancient Glass Dark OS Canvas, Material Symbols, Motion JS  

---

## Table of Contents

1. [Architectural Overview & Core Paradigms](#1-architectural-overview--core-paradigms)
2. [Project File Tree & Structure](#2-project-file-tree--structure)
3. [Global Layout & Shell Components](#3-global-layout--shell-components)
   - `src/app/app.ts` (Root Canvas & Header)
   - `src/app/sidebar.component.ts` (Categorized Navigation System)
   - `src/app/dock.component.ts` (Universal Bottom Action Dock)
   - `src/app/command-palette.component.ts` (⌘K Omni-Engine & Voice Dictation)
   - `src/app/ai-copilot-drawer.component.ts` (Gemini AI Sales Sentinel)
   - `src/app/notifications-drawer.component.ts` (Realtime Telemetry & Audit Stream)
4. [Domain Modules & Route Registry (All 24 Routes)](#4-domain-modules--route-registry)
   - 4.1 Revenue & Strategy (`/deal-rooms`, `/revops-simulator`, `/cadences`, `/contracts`)
   - 4.2 Core Operations (`/`, `/tasks`, `/notes`, `/emails`, `/campaigns`, `/calendar`, `/deployment-checklist`)
   - 4.3 Analytics & Intelligence (`/reports`, `/lead-scoring`, `/forecast`, `/pipeline-signals`, `/automations`, `/workflows`, `/newsletter`)
   - 4.4 Records & Systems (`/clients`, `/leads`, `/contacts`, `/systems`, `/settings`)
5. [Data Services & State Management](#5-data-services--state-management)
   - `src/app/appwrite.ts` (Appwrite SDK, Auth, Teams, Storage, Database, Fallbacks)
   - `src/app/lead.service.ts` (Lead Entity, Scoring Algorithms, In-Memory & REST CRUD)
   - `src/app/nextcloud-calendar.service.ts` (CalDAV WebDAV Integration)
   - `src/app/agent-insights.ts` (Heuristic AI Insights Provider)
6. [Server-Side Architecture & API Endpoints](#6-server-side-architecture--api-endpoints)
   - `src/server.ts` (Express App, SSR Middleware, GenAI Proxy, CalDAV Proxy)
   - `src/server/db.ts` (Node-Appwrite Server Driver & Collection Mappings)
7. [Data Models & TypeScript Interface Specifications](#7-data-models--typescript-interface-specifications)
8. [Security, Access Control & Multi-Tenancy Engine](#8-security-access-control--multi-tenancy-engine)
9. [Design Philosophy, Typography & Aesthetic Contracts](#9-design-philosophy-typography--aesthetic-contracts)

---

## 1. Architectural Overview & Core Paradigms

ΛΞVOS is architected from first principles as an enterprise revenue acceleration and revenue operations (RevOps) operating system.

### Core Architectural Pillars:
1. **Zoneless Angular 21 Execution**: Does not use `zone.js`. All reactivity is driven natively by Angular Signals (`signal`, `computed`, `effect`, `input`, `output`) with `ChangeDetectionStrategy.OnPush` enforced across all 47 components.
2. **Hybrid SSR / Full-Stack Integration**: Integrated Express server serving as both the server-side rendering host and the secure API proxy gateway (`/api/*`), guaranteeing that zero sensitive credentials (`GEMINI_API_KEY`, `APPWRITE_API_KEY`) touch browser client bundles.
3. **Multi-Tenant Team Isolation**: Every data query and mutation is bound to an Appwrite Team ID (`teamId`) with role-based permissions (`Role.team(teamId, 'member')`, `Role.team(teamId, 'admin')`, `Role.team(teamId, 'owner')`).
4. **Resilient Dual-Mode Data Layer**: Transparent fallback system that operates flawlessly against live Appwrite Cloud databases when credentials are supplied, and falls back to structured client/server mock stores during offline or development operations without UI disruption.

---

## 2. Project File Tree & Structure

```
├── package.json                   # Dependencies: Angular 21, Appwrite 26, @google/genai, Tailwind 4, Express
├── tsconfig.json                  # Root TypeScript configuration (Strict Mode)
├── tsconfig.app.json              # Application compilation config
├── angular.json                   # Angular CLI build & SSR configuration
├── .postcssrc.json                # PostCSS + Tailwind CSS 4 plugin loader
├── src/
│   ├── index.html                 # HTML shell with Google Fonts & Material Symbols
│   ├── main.ts                    # Client-side bootstrap (Zoneless `provideClientHydration`)
│   ├── main.server.ts             # SSR server bootstrap (`BootstrapContext` forwarded)
│   ├── server.ts                  # Node.js Express server + Gemini GenAI + WebDAV + Collection proxy
│   ├── styles.css                 # Global CSS variables, Aurora keyframes, typography
│   ├── server/
│   │   └── db.ts                  # Server-side Appwrite database adapter & schema mapper
│   └── app/
│       ├── app.ts                 # Root shell component & persistent layout
│       ├── app.html               # Root layout template
│       ├── app.css                # Root component styling
│       ├── app.routes.ts          # Complete route mapping (24 routes)
│       ├── app.config.ts          # Client application configuration
│       ├── app.config.server.ts   # Server application configuration
│       ├── appwrite.ts            # Core Appwrite SDK & State Service (1,300+ lines)
│       ├── lead.service.ts        # Lead Management & AI Scoring Service
│       ├── nextcloud-calendar.service.ts # CalDAV / Nextcloud WebDAV calendar service
│       ├── agent-insights.ts      # Automated CRM heuristic agent service
│       │
│       ├── sidebar.component.ts   # Main left navigation sidebar
│       ├── dock.component.ts      # Bottom floating ergonomic action dock
│       ├── command-palette.component.ts # ⌘K command center with Voice Memo Dictation
│       ├── ai-copilot-drawer.component.ts # Slide-out Gemini AI assistant drawer
│       ├── notifications-drawer.component.ts # Activity & Sentinel alert drawer
│       │
│       ├── dashboard.component.ts # Executive operations overview
│       ├── deal-rooms.component.ts # Enterprise deal war-rooms & buying committee
│       ├── revops-simulator.component.ts # 1,000-run Monte Carlo ARR forecaster
│       ├── cadences.component.ts  # Outbound sequence builder with Liquid templates
│       ├── contract-suite.component.ts # Legal contract builder & SHA-256 seal
│       ├── tasks.component.ts     # Action items & Kanban task board
│       ├── notes.component.ts     # Rich notes & voice memo repository
│       ├── emails.component.ts    # Communications client & automated follow-ups
│       ├── campaigns.component.ts # Marketing campaign tracker & budget manager
│       ├── calendar.component.ts  # Event scheduler & calendar engine
│       ├── deployment-checklist.component.ts # Production readiness checklist
│       │
│       ├── reports.component.ts   # Revenue analytics & executive charts
│       ├── lead-scoring.component.ts # AI lead prioritization matrix
│       ├── forecast.component.ts  # Probability pipeline forecasting
│       ├── pipeline-signals.component.ts # Realtime intent & buying signals
│       ├── automations.component.ts # Triggers, actions & Appwrite functions
│       ├── workflows.component.ts # Visual DAG workflow graph engine
│       ├── newsletter.component.ts # Broadcast email & audience segments
│       │
│       ├── clients.component.ts   # Enterprise accounts directory
│       ├── leads.component.ts     # Lead pipeline with Kanban & Maps
│       ├── contacts.component.ts  # Contact cards with enrichment
│       ├── systems.component.ts   # System telemetry, database latency & uptime
│       └── settings.component.ts  # Appwrite & workspace configuration
```

---

## 3. Global Layout & Shell Components

### 3.1 `App` (`src/app/app.ts`)
* **Role:** Master layout container coordinating the atmospheric background, top header, left sidebar, bottom dock, and modal/drawer overlay states.
* **Key Features:**
  * **The Breathing Canvas:** Three-layer ambient aurora orbs (Purple `#a855f7`, Emerald `#10b981`, Cyan `#06b6d4`) animated via GPU-accelerated CSS keyframes.
  * **Top Persistent Header:** 
    * Mobile drawer hamburger trigger.
    * Brand wordmark `ΛΞVOS` in `Comfortaa` typography.
    * Realtime `CRM Sentinel` tenant status badge.
    * Universal search bar opening the `CommandPalette` (`⌘K`).
    * AI Copilot drawer trigger with glowing active badge.
    * Notification center trigger with unread indicator (`unreadCount` computed signal).
  * **Navigation Drawer Overlays:** State signals for `isSidebarOpen`, `isNotificationDrawerOpen`, `isAICopilotOpen`, and `isCommandPaletteOpen`.

### 3.2 `SidebarComponent` (`src/app/sidebar.component.ts`)
* **Role:** Desktop and responsive mobile drawer navigation tree.
* **Sections:**
  1. **Main:** Dashboard (`/`), Notifications (`/notifications`), Tasks (`/tasks`), Notes (`/notes`), Emails (`/emails`), Campaigns (`/campaigns`), Calendar (`/calendar`), Deployment (`/deployment-checklist`).
  2. **Revenue & Strategy:** Deal Rooms (`/deal-rooms`), Outbound Cadences (`/cadences`), RevOps Monte Carlo (`/revops-simulator`), Legal & Contracts Vault (`/contracts`).
  3. **Analytics:** Reports (`/reports`), AI Lead Scoring (`/lead-scoring`), AI Forecast (`/forecast`), Pipeline Signals (`/pipeline-signals`), Automations (`/automations`), Workflows (`/workflows`), Newsletter (`/newsletter`).
  4. **Records:** Clients (`/clients`), Leads Pipeline (`/leads`), Contacts (`/contacts`).
  5. **Systems:** Systems Hub (`/systems`), Appwrite Config (`/settings`).
* **Footer:** Brand watermark signature: *"ΛΞV Inc — The Future Needs Context — Innovate, Automate, Dominate"* and active user profile badge.

### 3.3 `DockComponent` (`src/app/dock.component.ts`)
* **Role:** Bottom floating ergonomic action bar designed for rapid keyboard navigation and touch devices.
* **Controls & Triggers:**
  * **Create Record (`Q`):** Modal dialog to affirm prospects or register action items with full form validation.
  * **Gnoseological Inquiry (`/`):** Expandable inline search box querying the lead pipeline.
  * **Hotkeys `1`–`7`:** Instant routing (`1` Home, `2` War Room, `3` Cadence, `4` Leads, `5` RevOps, `6` Tasks, `7` Vault).
  * **Gnosis Oracle (`G`):** Stoic nihilistic CRM aphorism generator providing philosophical reflections on mortal revenue pursuits (Epictetus, Seneca, Marcus Aurelius).

### 3.4 `CommandPaletteComponent` (`src/app/command-palette.component.ts`)
* **Role:** Omnipresent spot search (`⌘K` / `Ctrl+K`) and speech dictation engine.
* **Features:**
  * **Web Speech API Dictation (`Shift+V`):** Live speech-to-text recording with animated waveform, manual editing, and one-click database note persistence.
  * **Categorized Action Matching:** Quick actions (`Create Lead`, `Schedule Call`, `Launch AI Copilot`, `Run RevOps Simulation`), navigation links, and dynamic real-time lead and task search.

### 3.5 `AICopilotDrawerComponent` (`src/app/ai-copilot-drawer.component.ts`)
* **Role:** Interactive slide-out AI assistant powered by Gemini.
* **Features:**
  * Context-aware prompt suggestions (Deal Strategy, Email Drafting, Pipeline Risk Analysis).
  * Real-time conversation stream with copy-to-clipboard actions and prompt grounding.

---

## 4. Domain Modules & Route Registry

### 4.1 Revenue & Strategy Domain

#### A. Deal War-Rooms (`/deal-rooms` — `DealRoomsComponent`)
* **Purpose:** High-stakes enterprise opportunity orchestration.
* **Core Capabilities:**
  * **Buying Committee Influence Matrix:** Tracks Champions, Economic Buyers, Technical Evaluators, Legal Counsel, and Blockers with political influence scores (1–10) and sentiment tracking.
  * **Mutual Action Plan (MAP):** Shared timeline across Discovery, Tech Evaluation, Security & Legal, and Executive Procurement with sign-off checkpoints.
  * **Objection Simulator:** Interactive counter-framing battlecard engine generating tactical responses for budget freezes, procurement delays, and competitor displacement.

#### B. RevOps Monte Carlo Engine (`/revops-simulator` — `RevopsSimulatorComponent`)
* **Purpose:** Stochastic probability modeling for enterprise revenue forecasting.
* **Core Capabilities:**
  * **1,000-Iteration Simulation:** Computes probabilistic P10 (Conservative), P50 (Expected), and P90 (Optimistic) ARR outcomes based on pipeline value, baseline win rates, deal volatility, and sales cycle length.
  * **AE Ramp & Capacity Planner:** Models rep ramp velocity (0%–100% over 6 months), hiring plans, and required quota coverage multipliers.
  * **Commission Accelerator Calculator:** Dynamic tier calculator modeling base salary, OTE, tier thresholds (100%, 120%, 150%), and multi-year contract multipliers.

#### C. Outbound Cadence Studio (`/cadences` — `CadencesComponent`)
* **Purpose:** Omnichannel multi-touch outbound sequence orchestration.
* **Core Capabilities:**
  * **Step Sequence Builder:** Configures time-delayed touchpoints across Automated Emails, LinkedIn Connects, Phone Calls, and Video Messages.
  * **Liquid Template Synthesizer:** Live parser previewing dynamic variables (`{{first_name}}`, `{{company}}`, `{{arr_growth}}`, `{{pain_point}}`).
  * **Performance Funnel:** Real-time analytics tracking open rate (68.4%), reply rate (22.8%), bounce rate (1.2%), and meeting booking rate (14.6%).

#### D. Legal & Contracts Vault Suite (`/contracts` — `ContractSuiteComponent`)
* **Purpose:** Contract generation, cryptographic sealing, and encrypted storage.
* **Core Capabilities:**
  * **Contract Blueprint Synthesizer:** Configurable MSA, NDA, DPA, and SLA templates with live clause adjustment (Liability caps, uptime %, jurisdiction).
  * **HTML5 Canvas Digital Signature Pad:** Touch/mouse signature capture with SHA-256 cryptographic digest envelope.
  * **Appwrite Storage Vault:** Drag-and-drop file uploader with direct download, view, and document deletion.

---

### 4.2 Core Operations Domain

* **Dashboard (`/` — `DashboardComponent`):** High-level ARR metrics, quarterly pipeline progress, dynamic chart widgets, upcoming discovery meetings, and recent lead flow.
* **Tasks (`/tasks` — `TasksComponent`):** Action items board with priority tagging, category filtering, due dates, completion toggles, and Appwrite synchronization.
* **Notes (`/notes` — `NotesComponent`):** Knowledge base notes, meeting transcripts, pinned voice memos, and tag filtering.
* **Emails (`/emails` — `EmailsComponent`):** Unified communications interface with email composition, inbox threads, and template insertion.
* **Campaigns (`/campaigns` — `CampaignsComponent`):** Multi-channel outbound campaign management with budget tracking, lead attribution, and ROI metrics.
* **Calendar (`/calendar` — `CalendarComponent`):** Interactive event scheduler with CalDAV Nextcloud synchronizer, time slot selection, and attendee management.
* **Deployment Checklist (`/deployment-checklist` — `DeploymentChecklistComponent`):** Interactive verification matrix for production cloud deployment, Appwrite configuration, SSL certificates, and environment secrets.

---

### 4.3 Analytics & Intelligence Domain

* **Reports (`/reports` — `ReportsComponent`):** Financial telemetry, cohort conversion breakdown, pipeline aging analysis, and CSV export.
* **AI Lead Scoring (`/lead-scoring` — `LeadScoringComponent`):** Multi-factor scoring engine evaluating company size, industry category, website interaction frequency, email engagement, and deal magnitude to categorize leads into Hot, Warm, or Cold.
* **AI Forecast (`/forecast` — `ForecastComponent`):** Machine-assisted pipeline forecasting factoring historical win-rates and seasonal deal velocity.
* **Pipeline Signals (`/pipeline-signals` — `PipelineSignalsComponent`):** Real-time intent detection stream capturing funding announcements, executive hiring, and website pricing page visits.
* **Automations (`/automations` — `AutomationsComponent`):** Event-action automation builder triggering Appwrite serverless functions and Slack webhook alerts upon pipeline status changes.
* **Workflows (`/workflows` — `WorkflowsComponent`):** Visual DAG workflow graph mapping complex enterprise onboarding and deal escalation workflows.
* **Newsletter (`/newsletter` — `NewsletterComponent`):** Audience broadcast manager with subscriber segments, campaign drafts, and delivery analytics.

---

### 4.4 Records & Systems Domain

* **Clients (`/clients` — `ClientsComponent`):** Enterprise customer account profiles, subscription tier status, contract values, and key contacts.
* **Leads (`/leads` — `LeadsComponent`):** Full-featured lead management with Kanban board view, tabular view, Google Maps geographic cluster view, and CSV data importer.
* **Contacts (`/contacts` — `ContactsComponent`):** Direct individual stakeholder directory with one-click data enrichment and communication links.
* **Systems Hub (`/systems` — `SystemsComponent`):** Infrastructure monitoring console tracking Appwrite cloud latency, API uptime, database collection sizes, and memory usage.
* **Settings (`/settings` — `SettingsComponent`):** Appwrite Project ID, Endpoint, Database ID, Collection mappings, Team management, and API key configurations.

---

## 5. Data Services & State Management

### 5.1 `Appwrite` Service (`src/app/appwrite.ts`)
* **Singleton Root Service:** Manages client-side connection to Appwrite Cloud.
* **State Signals:**
  * `currentUser: Signal<User | null>`
  * `activeTeam: Signal<Team | null>`
  * `userTeams: Signal<Team[]>`
  * `contracts: Signal<Contract[]>`
  * `contacts: Signal<Contact[]>`
  * `tasks: Signal<Task[]>`
  * `notes: Signal<Note[]>`
  * `notifications: Signal<Notification[]>`
  * `emails: Signal<Email[]>`
* **Methods:**
  * `login(email, password)`, `register(email, password, name)`, `logout()`
  * `loadUserTeams()`, `createWorkspaceTeam(name)`, `inviteMember(email, name, roles)`
  * `uploadFile(file, bucketId)`, `listFiles(bucketId)`, `deleteFile(fileId, bucketId)`
  * `addContract()`, `updateContractStatus()`, `deleteContract()`
  * `addTask()`, `updateTask()`, `deleteTask()`, `toggleTaskCompleted()`
  * `addNote()`, `updateNote()`, `deleteNote()`
  * `addNotification()`, `markNotificationRead()`, `deleteNotification()`

### 5.2 `LeadService` (`src/app/lead.service.ts`)
* **Scoring Engine:** Algorithmic calculation factoring Industry (+20), Company Size (+25), Website Activity (+25), Email Engagement (+30), and Deal Value (+20).
* **State Signals:** `leads: Signal<Lead[]>`, `loading: Signal<boolean>`, `error: Signal<string | null>`.
* **CRUD Methods:** `loadLeads()`, `createLead(lead)`, `updateLead(id, updates)`, `deleteLead(id)`.

---

## 6. Server-Side Architecture & API Endpoints

### 6.1 Server Architecture (`src/server.ts`)
* **Engine:** Express 5.x initialized with `@angular/ssr/node` (`AngularNodeAppEngine`).
* **AI Model Integrations:**
  * `POST /api/gemini/generate-lite`: High-speed generation using `gemini-3.1-flash-lite`.
  * `POST /api/gemini/generate-search`: Search-grounded generation using `gemini-3.5-flash` with Google Search tool definitions.
* **REST Collection Routing:**
  * `GET /api/:collection` -> Lists collection documents from `node-appwrite`.
  * `POST /api/:collection` -> Creates new record with team permissions.
  * `PATCH /api/:collection/:id` -> Partial document update.
  * `DELETE /api/:collection/:id` -> Deletes document by ID.
* **CalDAV Nextcloud Gateway:**
  * `POST /api/nextcloud/calendar` -> Relays authenticated XML PROPFIND queries to private Nextcloud calendar endpoints.
* **Maps Configuration:**
  * `GET /api/config/maps` -> Securely passes Google Maps API key to authorized client sessions.

---

## 7. Data Models & TypeScript Interface Specifications

```typescript
// Lead Model
export interface Lead {
  $id?: string;
  name: string;
  email: string;
  phone?: string;
  source: string;
  status: 'New' | 'Contacted' | 'Qualified' | 'Closed' | string;
  value: number;
  industry?: string;
  region?: string;
  lat?: number;
  lng?: number;
  aiInsights?: string;
  priority?: 'High' | 'Medium' | 'Low' | string;
  expectedCloseDate?: string;
  createdAt?: string;
  companySize?: string;
  websiteActivity?: 'High' | 'Medium' | 'Low' | string;
  emailEngagement?: 'High' | 'Medium' | 'Low' | string;
  score?: number;
  scoreCategory?: 'Hot' | 'Warm' | 'Cold' | string;
  teamId?: string;
}

// Contract Model
export interface Contract {
  $id?: string;
  title: string;
  clientName: string;
  clientEmail: string;
  type: 'MSA' | 'NDA' | 'DPA' | 'SLA' | 'Custom';
  status: 'Draft' | 'In Review' | 'Signed' | 'Executed';
  value: number;
  slaUptime?: string;
  liabilityCap?: number;
  jurisdiction?: string;
  signatureHash?: string;
  teamId?: string;
  createdAt?: string;
}

// Task Model
export interface Task {
  $id?: string;
  title: string;
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  dueDate: string;
  description?: string;
  completed: boolean;
  teamId?: string;
}

// Buying Committee Stakeholder Model
export interface Stakeholder {
  id: string;
  name: string;
  title: string;
  role: 'Champion' | 'Economic Buyer' | 'Technical Evaluator' | 'Legal Counsel' | 'Blocker';
  sentiment: 'Strong Positive' | 'Positive' | 'Neutral' | 'Skeptical' | 'Hostile';
  influence: number; // 1 - 10
  priorities: string[];
  contactStatus: 'Engaged' | 'Meeting Scheduled' | 'Pending Intro' | 'Unresponsive';
}
```

---

## 8. Security, Access Control & Multi-Tenancy Engine

1. **Strict Key Encapsulation**: Private API keys (`GEMINI_API_KEY`, `APPWRITE_API_KEY`) are accessed strictly inside server processes.
2. **Tenant Scoping**: All database rows created through the server driver enforce `Permission.read(Role.team(teamId))` and `Permission.write(Role.team(teamId))`.
3. **Cryptographic Sealing**: Legal contracts generated in the contract suite generate an SHA-256 digital verification hash computed from contracting parties, terms, liability caps, and date parameters.

---

## 9. Design Philosophy, Typography & Aesthetic Contracts

* **The Anti-Slop Directive**: No ungrounded SaaS metrics, no fake 3D glossy shapes, and no purple gradient spam.
* **Palette**: Carbon zinc base (`#07070a`), illuminated by Verdigris and oxidized ancient Roman glass tones (Teal `#14b8a6`, Emerald `#10b981`, Amber `#f59e0b`, Purple `#a855f7`).
* **Typography**:
  * Display / Headers / Wordmarks: `Comfortaa` (Cursive Geometric Sans-Serif).
  * Body / UI Controls: `Lexend Deca` (Legible, open-aperture Modern Sans).
  * Telemetry / Numbers: System Monospace (`ui-monospace`, `SFMono-Regular`).
* **Single-Line Controls**: Strict adherence to single-line button labels and touch targets ≥ 40px across all mobile and desktop viewports.

---

*Authored and verified for the ΛΞVOS platform codebase.*
