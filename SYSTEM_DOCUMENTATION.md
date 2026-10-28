# ΛΞVOS (Laevos OS) — Master System Documentation & Architectural Specification

**System Designation:** ΛΞVOS Enterprise Revenue & Operations Operating System (RevOps OS)  
**Framework Version:** Angular v21.0.0 (Zoneless, Strict TypeScript, SSR / Client Hydration Ready)  
**Backend Infrastructure:** Node.js Express 5.x + Angular SSR (`AngularNodeAppEngine`)  
**Data & Storage Engine:** Appwrite Cloud (Endpoint: `https://tor.cloud.appwrite.io/v1`, Project: `6990e2830030cacccd98`, Database: `leadwave-main`, Storage Bucket: `contracts`, Teams Multi-Tenancy) & `node-appwrite` Server Driver  
**Edge AI & Agent Persistence:** Turso / LibSQL SQLite Database-per-Tenant (`@libsql/client`)  
**AI Intelligence:** Google Gemini API (`@google/genai` v2.4.0 — `gemini-3.1-flash-lite`, `gemini-3.5-flash` with Search Grounding, and `gemini-3.8-flash` for Sales Personality & BEEP v2.0 Coach)  
**Styling & Design System:** Tailwind CSS v4, Obsidian Iridescence (Carbon Zinc & Ancient Roman Glass / Verdigris), Tabler & Material Symbols, Motion JS  

---

## Table of Contents

1. [Executive Summary & System Identity](#1-executive-summary--system-identity)
2. [High-Level Architecture & Data Flow](#2-high-level-architecture--data-flow)
3. [Technology Stack & Dependency Matrix](#3-technology-stack--dependency-matrix)
4. [Project File Tree & Directory Topology](#4-project-file-tree--directory-topology)
5. [Global Shell & Ergonomic Navigation Engine](#5-global-shell--ergonomic-navigation-engine)
   - 5.1 Root Shell (`app.ts` & Aurora Canvas)
   - 5.2 Responsive Categorized Sidebar (`sidebar.component.ts`)
   - 5.3 Bottom Floating Ergonomic Dock (`dock.component.ts`)
   - 5.4 ⌘K Command Center & Web Speech Voice Dictation (`command-palette.component.ts`)
   - 5.5 AI Copilot Assistant Drawer (`ai-copilot-drawer.component.ts`)
   - 5.6 Real-Time Telemetry & Notifications Drawer (`notifications-drawer.component.ts`)
6. [Comprehensive Domain & Route Registry (All 24 Routes)](#6-comprehensive-domain--route-registry)
   - 6.1 Revenue & Strategy Domain (`/deal-rooms`, `/revops-simulator`, `/cadences`, `/contracts`, `/sales-personality`, `/sales-performance`)
   - 6.2 Core Operations Domain (`/`, `/tasks`, `/notes`, `/emails`, `/campaigns`, `/calendar`, `/scheduler`, `/deployment-checklist`)
   - 6.3 Analytics & Intelligence Domain (`/reports`, `/lead-scoring`, `/forecast`, `/pipeline-signals`, `/automations`, `/workflows`, `/email-workflows`, `/newsletter`)
   - 6.4 Records & Systems Domain (`/clients`, `/leads`, `/contacts`, `/systems`, `/settings`)
7. [AI Intelligence & Sales Personality Engine (BEEP v2.0)](#7-ai-intelligence--sales-personality-engine-beep-v20)
   - 7.1 The 4 Sales Archetypes
   - 7.2 Anti-Slop Directive & Cringe Audit Scanner
   - 7.3 Google Search Grounding with Gemini 3.5 Flash
8. [Multi-Engine Data Persistence & Storage Architecture](#8-multi-engine-data-persistence--storage-architecture)
   - 8.1 Appwrite Cloud Integration (`leadwave-main`)
   - 8.2 Turso LibSQL Agent Database-per-Tenant
   - 8.3 Fail-Safe Hybrid Persistence Engine (Cloud vs Local vs In-Memory)
   - 8.4 Third-Party Integrations (Mailchimp, SendGrid, HubSpot, CalDAV Nextcloud, Google Maps)
9. [Complete Server REST API Reference](#9-complete-server-rest-api-reference)
10. [Data Models & TypeScript Interface Contracts](#10-data-models--typescript-interface-contracts)
11. [Multi-Tenancy, Security & RBAC Enforcement](#11-multi-tenancy-security--rbac-enforcement)
12. [Design Language, Typography & Visual Contracts](#12-design-language-typography--visual-contracts)
13. [Developer Runbook, Seeding & Deployment](#13-developer-runbook-seeding--deployment)

---

## 1. Executive Summary & System Identity

**ΛΞVOS (pronounced *LAY-voss*)** is a high-performance, single-page enterprise operating system tailored for revenue acceleration, sales pipeline engineering, predictive forecasting, and autonomous deal operations. 

Unlike conventional SaaS platforms bogged down by bloated frameworks, slow re-renders, and robotic corporate templates, ΛΞVOS is built on three core pillars:
1. **Zero-Overhead Reactive Execution:** Engineered on modern Angular 21 without `zone.js`, leveraging signal graphs and fine-grained change detection for near-instantaneous UI reactivity.
2. **Human-First Sales Intelligence:** Powered by Google Gemini (`gemini-3.8-flash` & `gemini-3.5-flash`) and **BEEP v2.0**, an AI sales coach that eliminates robotic corporate "slop," eradicates awkward check-in cliches, and assists sales reps with emotional intelligence, pricing detachment, and deal objection framing.
3. **Resilient Multi-Engine Architecture:** Combines Appwrite Cloud for unified multi-tenant database and file vault operations, Turso / LibSQL for tenant-isolated agent logs, and transparent failover mechanisms ensuring that the platform operates seamlessly in offline, sandboxed, and high-concurrency cloud environments.

### Brand Signature & Watermark
Every authorized interface across ΛΞVOS bears the platform seal:
```
ΛΞV Inc
The Future Needs Context
Innovate, Automate, Dominate
```

---

## 2. High-Level Architecture & Data Flow

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CLIENT LAYER (Browser)                                │
│                                                                                        │
│   Angular 21 (Zoneless Signals) ─── Tailwind CSS v4 (Obsidian Glass) ─── Motion JS     │
│   ├─ 24 Domain Routes (War Rooms, RevOps Monte Carlo, Lead Scoring, Contracts Vault)   │
│   ├─ Global Ergonomic Dock (Q, /, Hotkeys 1-7, Gnosis Stoic Generator)                │
│   ├─ Command Palette (⌘K) with Web Speech API Audio Dictation                          │
│   └─ AI Copilot & Real-Time Sentinel Telemetry Drawers                                 │
└─────────────────────────────────────────┬──────────────────────────────────────────────┘
                                          │  HTTP / Client SDK / Realtime WebSockets
                                          ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              APPLICATION SERVER (Node.js)                              │
│                                                                                        │
│   Express 5.x Gateway ─── AngularNodeAppEngine (SSR + Hydration)                      │
│   ├─ Performance & Security Middleware (X-Response-Time, CSP, Clickjacking Guards)   │
│   ├─ In-Memory LRU Cache (60s - 120s TTL for High-Frequency AI & Data)                │
│   ├─ Google GenAI Client (@google/genai) — Low-Latency, Grounded Search, BEEP Coach   │
│   ├─ CalDAV / WebDAV Nextcloud XML Reverse Proxy Gateway                              │
│   └─ Collection REST Engine (/api/:collection with Team Permission Injection)         │
└──────────────┬──────────────────────────┬─────────────────────────────┬────────────────┘
               │                          │                             │
               ▼                          ▼                             ▼
┌──────────────────────────┐ ┌──────────────────────────┐ ┌──────────────────────────┐
│      APPWRITE CLOUD      │ │     TURSO / LIBSQL       │ │   EXTERNAL GATEWAYS      │
│                          │ │                          │ │                          │
│ • Database: leadwave-main│ │ • Database-per-Tenant    │ │ • Nextcloud CalDAV API   │
│ • 12 Collections         │ │ • SQLite parameterized   │ │ • Mailchimp / SendGrid / │
│ • Teams Multi-Tenancy    │ │ • agent_coaching_logs    │ │   HubSpot Marketing Sync │
│ • Storage: contracts     │ │ • agent_sales_rules      │ │ • Google Maps Platform   │
│ • Serverless Functions   │ │ • Edge file sync fallback│ │   Geocoding & Clusters   │
└──────────────────────────┘ └──────────────────────────┘ └──────────────────────────┘
```

---

## 3. Technology Stack & Dependency Matrix

| Category | Component / Tool | Version / Spec | Primary Role |
| :--- | :--- | :--- | :--- |
| **Runtime & Bundler** | Bun | `v1.4.0` | High-performance JS runtime, bundler, and test runner |
| **Frontend Framework** | Angular | `v21.0.0` (Zoneless) | Core reactive UI engine without `zone.js` |
| **Component Architecture** | Standalone Components | Angular 21 | Modular, tree-shakeable components with `OnPush` |
| **Styling & Theme** | Tailwind CSS | `v4.1.12` | Obsidian Iridescence, GPU-accelerated auroras |
| **Typography** | Comfortaa & Lexend Deca | Google Fonts | Monolithic curved brand titles & ultra-legible body |
| **Iconography** | Material Symbols & Tabler | Modern SVG/Webfont | Semantic UI actions, status indicators, badges |
| **Animation Engine** | Motion JS | `v12.23.24` | Layout transitions, staggered lists, spring physics |
| **Charts & Visuals** | Recharts / Chart.js | `v4.5.1` | Financial area charts, radar curves, win funnels |
| **Server Framework** | Express | `v5.1.0` | SSR hosting, security proxy, AI routing gateway |
| **SSR Engine** | `@angular/ssr` | `v21.0.0` | `AngularNodeAppEngine` with client hydration |
| **Cloud Database & Auth** | Appwrite Web & Node SDK | `v26.1.0` / `v26.2.0` | Teams, Account, Databases, Storage, Realtime |
| **Edge Agent Database** | `@libsql/client` (Turso) | `v0.18.0` | Tenant-isolated SQLite logs, feedback ratings |
| **Generative AI** | `@google/genai` | `v2.4.0` | Flash-Lite, Grounded Flash Search, BEEP 3.8 Flash |
| **Calendar Standard** | WebDAV / CalDAV | RFC 4791 | Nextcloud enterprise calendar integration |
| **Voice Dictation** | Web Speech API | Native Browser | Real-time speech-to-text voice memos |

---

## 4. Project File Tree & Directory Topology

```
/
├── .env.example                          # Environment variable specifications & defaults
├── .gitignore                            # Artifact exclusions (node_modules, dist, db files)
├── .postcssrc.json                       # PostCSS + Tailwind CSS v4 compiler binding
├── angular.json                          # Angular CLI build, asset, and SSR options
├── appwrite.cli.json                     # Appwrite CLI infrastructure blueprint (renamed to avoid Bun conflict)
├── appwrite.config.json                  # Appwrite configuration sync
├── eslint.config.js                      # ESLint 9 + TypeScript-ESLint + Angular-ESLint
├── metadata.json                         # AI Studio applet capabilities & metadata
├── package.json                          # Core scripts, dependencies, devDependencies
├── tsconfig.json                         # TypeScript root configuration (Strict Mode)
├── tsconfig.app.json                     # Application TypeScript compilation config
├── scripts/
│   ├── setup-database.ts                 # Full TypeScript Appwrite database setup script
│   ├── setup-database.js                 # Node.js Appwrite schema seeding runner
│   └── setup-newsletter-db.js            # Newsletter collection initialization script
├── appwrite-functions/
│   └── newsletter-signup/                # Serverless event trigger for newsletter sync
│       ├── package.json
│       └── src/index.js
├── generated/
│   └── appwrite/                         # Type bindings generated from Appwrite schema
│       ├── constants.ts
│       ├── databases.ts
│       ├── index.ts
│       └── types.ts
├── public/
│   └── favicon.ico                       # Platform favicon
└── src/
    ├── index.html                        # Root HTML shell with font preconnects & meta
    ├── main.ts                           # Client bootstrapper (zoneless, hydration)
    ├── main.server.ts                    # SSR server entry point (BootstrapContext)
    ├── server.ts                         # Express server, Gemini GenAI, Turso LibSQL, CalDAV
    ├── styles.css                        # Aurora animations, scrollbars, Tailwind v4 imports
    ├── server/
    │   ├── db.ts                         # Server-side Appwrite database adapter & mappers
    │   └── turso.ts                      # Turso LibSQL Database-per-Tenant SQLite client
    └── app/
        ├── app.ts                        # Master layout, atmospheric canvas, header
        ├── app.html                      # Layout template with drawer overlays
        ├── app.css                       # Layout CSS variables & responsive tweaks
        ├── app.routes.ts                 # 24 core routes with lazy-loaded components
        ├── app.config.ts                 # Client application config (providers, routing)
        ├── app.config.server.ts          # Server application config
        ├── appwrite.ts                   # Core Appwrite Service (Auth, DB, Teams, Storage)
        ├── lead.service.ts               # Lead CRUD, scoring index, activity simulation
        ├── email-marketing.service.ts    # Mailchimp, SendGrid, HubSpot sync provider
        ├── email-workflow.service.ts     # Automated trigger sequence & A/B test engine
        ├── nextcloud-calendar.service.ts # CalDAV event fetching & sync
        ├── sales-personality.service.ts  # BEEP v2.0 AI persona service & cringe audit
        ├── agent-insights.ts             # Heuristic CRM anomaly detection engine
        │
        ├── sidebar.component.ts          # Responsive navigation sidebar with haptic feedback
        ├── dock.component.ts             # Bottom floating ergonomic action dock (Hotkeys)
        ├── command-palette.component.ts  # ⌘K search & Web Speech API voice dictation
        ├── ai-copilot-drawer.component.ts# Slide-out Gemini AI assistant drawer
        ├── notifications-drawer.component.ts # Activity & Sentinel telemetry stream
        │
        ├── dashboard.component.ts        # Executive ARR overview, discovery calendar
        ├── deal-rooms.component.ts       # War rooms, buying committee influence matrix
        ├── revops-simulator.component.ts # 1,000-iteration Monte Carlo ARR forecasting
        ├── cadences.component.ts         # Outbound sequences with Liquid templates
        ├── contract-suite.component.ts   # Legal contracts, digital canvas signature, SHA-256
        ├── sales-personality.component.ts# BEEP v2.0 AI coaching, cringe roast, sound FX
        ├── sales-performance.component.ts# Rep performance, superpowers, velocity curves
        ├── tasks.component.ts            # Action items & Kanban task board
        ├── notes.component.ts            # Rich notes, transcripts & pinned voice memos
        ├── emails.component.ts           # Unified email client with template insertion
        ├── campaigns.component.ts        # Multi-channel marketing & provider sync
        ├── calendar.component.ts         # Nextcloud CalDAV event scheduler
        ├── scheduler.component.ts        # Client-facing discovery call booking portal
        ├── deployment-checklist.component.ts # Cloud readiness verification matrix
        ├── reports.component.ts          # Financial telemetry & cohort conversion charts
        ├── lead-scoring.component.ts     # AI 100-pt lead scoring & weights calibration
        ├── forecast.component.ts         # Weighted pipeline forecast & sensitivity modeling
        ├── pipeline-signals.component.ts # Real-time buyer intent & website telemetry
        ├── automations.component.ts      # Event-action triggers & Appwrite function alerts
        ├── workflows.component.ts        # Visual DAG workflow graph engine
        ├── email-workflows.component.ts  # Multi-touch email sequence builder
        ├── newsletter.component.ts       # Broadcast email & audience segments
        ├── clients.component.ts          # Enterprise customer accounts & subscriptions
        ├── leads.component.ts            # Lead pipeline (Kanban, Table, Google Maps)
        ├── contacts.component.ts         # Relationship directory with 3P sync & deals
        ├── systems.component.ts          # Infrastructure monitor (Appwrite latency, memory)
        └── settings.component.ts         # Workspace config, Appwrite keys, team settings
```

---

## 5. Global Shell & Ergonomic Navigation Engine

### 5.1 Root Shell (`src/app/app.ts`)
The root application component hosts the **Atmospheric Breathing Canvas** — a three-layer dynamic ambient glow combining Verdigris Cyan (`#06b6d4`), Arcane Purple (`#a855f7`), and Emerald (`#10b981`) rendered across CSS keyframes with zero CPU overhead.

**Key Responsibilities:**
* **Navigation Overlay State:** Manages signals for `isSidebarOpen`, `isNotificationDrawerOpen`, `isAICopilotOpen`, and `isCommandPaletteOpen`.
* **Universal Search Bar:** Centrally positioned search input in the persistent header that launches the Command Palette (`⌘K`).
* **CRM Sentinel Status Badge:** Live indicator showing real-time connectivity status to Appwrite Cloud and the active workspace tenant.
* **Responsive Breakpoint Adapters:** Smooth collapsible drawer controls for mobile, tablet, and widescreen monitors.

### 5.2 Responsive Categorized Sidebar (`src/app/sidebar.component.ts`)
A fixed left rail on desktop (280px) and slide-out mobile drawer organizing the application's 24 views into five clean operational domains:
1. **Main:** Dashboard, Notifications, Tasks, Notes, Emails, Campaigns, Calendar, Deployment Checklist.
2. **Revenue & Strategy:** Sales Personality (BEEP v2.0), Deal Rooms, Email Sequences / Cadences, RevOps Monte Carlo, Legal & Contracts Vault.
3. **Analytics & Performance:** Sales Performance, Reports, AI Lead Scoring, AI Forecast, Pipeline Signals, Automations, Workflows, Email Workflows, Newsletter.
4. **Records:** Clients, Leads Pipeline, Contacts Directory.
5. **Systems:** Systems Hub, Appwrite Config / Settings.

*Ergonomic Touch:* Integrates `navigator.vibrate(10)` haptic feedback on navigation triggers where supported. Includes the official watermark of **ΛΞV Inc**.

### 5.3 Bottom Floating Ergonomic Dock (`src/app/dock.component.ts`)
Designed for professional operators who prioritize keyboard productivity:
* **Quick Create (`Q`):** Pops an instant record creation dialog with full validation for leads and action items.
* **Inline Pipeline Inquiry (`/`):** Expands an immediate search input filtering active leads by title, company, or value.
* **Direct Routing Hotkeys (`1`–`7`):**
  * `1` → Executive Dashboard (`/`)
  * `2` → Deal War-Rooms (`/deal-rooms`)
  * `3` → Outbound Sequences (`/cadences`)
  * `4` → Leads Pipeline (`/leads`)
  * `5` → RevOps Monte Carlo (`/revops-simulator`)
  * `6` → Action Tasks (`/tasks`)
  * `7` → Legal & Contracts Vault (`/contracts`)
* **Gnosis Oracle (`G`):** Generates stoic and philosophical reflections on mortal revenue pursuits drawn from Epictetus, Seneca, and Marcus Aurelius.

### 5.4 ⌘K Command Center & Web Speech Voice Dictation (`src/app/command-palette.component.ts`)
* **Global Access:** Triggered via `⌘K`, `Ctrl+K`, or header search.
* **Instant Action Filtering:** Fast fuzzy-matching across every system view, quick record creations, and active lead / task queries.
* **Web Speech Audio Dictation (`Shift+V`):** Uses the browser's native `webkitSpeechRecognition` / `SpeechRecognition` API. Displays a live animated audio waveform, transcribes spoken words in real time, allows manual post-editing, and saves directly to the user's `notes` collection in Appwrite with one click.

### 5.5 AI Copilot Assistant Drawer (`src/app/ai-copilot-drawer.component.ts`)
A slide-out AI assistant docked on the right margin:
* Provides context-aware quick actions: *Analyze Pipeline Risk*, *Draft Follow-Up Email*, *Simulate Buyer Objections*, *Summarize Deal Velocity*.
* Maintains a live conversation stream with copy-to-clipboard actions and direct insertion into outreach drafts.

### 5.6 Real-Time Telemetry & Notifications Drawer (`src/app/notifications-drawer.component.ts`)
* Real-time activity feed connected to Appwrite's `notifications` collection and Sentinel health checks.
* Categorized badges for high-priority alerts, contract sign events, inbound lead qualification, and third-party sync confirmations.

---

## 6. Comprehensive Domain & Route Registry

### 6.1 Revenue & Strategy Domain

#### 1. Deal War-Rooms (`/deal-rooms` — `DealRoomsComponent`)
* **Buying Committee Influence Matrix:** Tracks multi-stakeholder enterprise deals. Evaluates Champions, Economic Buyers, Technical Evaluators, Legal Counsel, and Blockers with political influence scores (1–10) and sentiment tracking (*Strong Positive* to *Hostile*).
* **Mutual Action Plan (MAP):** Shared deal execution milestones across Discovery, Architecture Review, InfoSec Audit, and Legal Procurement with customer sign-offs.
* **Objection Battlecard Simulator:** Interactive counter-framing engine with pre-built strategic answers for budget freezes, procurement redlines, and legacy competitor displacement.

#### 2. RevOps Monte Carlo Simulation Engine (`/revops-simulator` — `RevopsSimulatorComponent`)
* **1,000-Iteration Stochastic ARR Engine:** Computes probabilistic revenue distributions using Gaussian random sampling over pipeline volume, baseline win rates, deal volatility, and sales cycle length.
* **P10, P50, and P90 Visual Distributions:** Calculates conservative, expected, and optimistic ARR forecasts with percentile indicators.
* **AE Ramp & Hiring Capacity Planner:** Simulates ramp trajectories (0% to 100% over 6 months) for newly onboarded account executives and computes required quota multipliers.
* **Commission Accelerator Calculator:** Models tiered commission plans (100%, 120%, 150% quota tiers) with multi-year contract multipliers.

#### 3. Outbound Cadence Studio (`/cadences` — `CadencesComponent`)
* **Multi-Touch Sequence Orchestration:** Builds time-delayed sequences across Automated Emails, LinkedIn Connects, Phone Calls, and Video Messages.
* **Liquid Template Synthesizer:** Real-time token substitution for `{{first_name}}`, `{{company}}`, `{{arr_growth}}`, and `{{pain_point}}`.
* **Funnel Performance Metrics:** Real-time analytics tracking delivery rate (98.8%), open rate (68.4%), reply rate (22.8%), and meeting booking rate (14.6%).

#### 4. Legal & Contracts Vault Suite (`/contracts` — `ContractSuiteComponent`)
* **Template Synthesizer:** Configurable MSA, NDA, DPA, and SLA generation with live clause calibration (Liability caps, uptime SLAs 99.9%–99.99%, governing jurisdictions).
* **HTML5 Canvas Digital Signature Pad:** Smooth touch and mouse signature capture with reset and confirmation triggers.
* **Cryptographic SHA-256 Digest:** Generates an immutable verification hash computed from signatory identities, monetary value, liability terms, and date stamps.
* **Appwrite Storage Vault:** Integrated document bucket (`contracts`) with direct upload, preview (`getFileView`), download (`getFileDownload`), and deletion.

#### 5. AI Sales Personality & BEEP v2.0 Coach (`/sales-personality` — `SalesPersonalityComponent`)
* **4 AI Archetypes:** The Reluctant Saviour (BEEP v2.0), The Empathetic Strategist, The Challenger Oracle, and The Zen Closer.
* **Audio & Audio-Synthesizer Banter:** Audio feedback effects on action triggers.
* **Real-Time Coaching Advice:** Evaluates target lead profiles and yields tactical tips, witty disarming retorts, and psychological threat assessments.
* **Anti-Slop Cringe Audit:** Paste any sales email to detect buzzword spam and generate an authentic rewrite with a witty BEEP roast.
* **Turso SQLite Feedback Logging:** Rates coaching advice (+1 / -1) and persists directly to the tenant's isolated Turso database.

#### 6. Sales Performance & Rep Intel (`/sales-performance` — `SalesPerformanceComponent`)
* **Executive Revenue Pacing:** Quota attainment pacing, quarterly ARR contribution, and average sales velocity curves.
* **Rep Leaderboard & Superpower Badges:** Highlighting individual rep specialties (*The Technical Sniper*, *The Enterprise Closer*, *The Velocity Demon*) with win-story breakdowns.
* **Conversion Funnel Visualization:** Mapped across Discovery → Solution Design → Procurement → Signed.

#### 7. ADHD Reverse Psychology Gauntlet & Chaos Engine (`/reverse-gauntlet` — `AdhdGamificationComponent`)
* **Satirical Reverse Dares:** Powered by Google Gemini (`gemini-3.8-flash`) via `POST /api/gemini/adhd/reverse-dare` to issue bite-sized, high-urgency dares (*"DO NOT touch this \$250k lead, you lack the discipline to draft 2 sentences"*).
* **The Forbidden Tasks Chamber:** Labeled CRM tasks from Appwrite marked as restricted, rewarding Spite Points and paying down Procrastination Debt when spite-completed.
* **The Distraction Hedge Fund:** Satirical Wall Street ticker (`$SPITE`, `$DOOM`, `$HYPR`, `$EXDF`) allowing users to short-sell their own distractions.
* **Emergency Chaos Reframe Portal:** AI reframe engine turning ADHD rabbit-holes into immediate rebellious momentum.
* **Audio Synthesizers & Binaural Ambience:** Native Web Audio API 40Hz Gamma binaural beat generator, ascending harmonic victory chords, and dissonant surrender hums.

---

### 6.2 Core Operations Domain

* **Dashboard (`/` — `DashboardComponent`):** Executive overview featuring quarterly ARR progress bars, upcoming discovery sessions, deal velocity charts, and recent lead flow with quick-action status toggles.
* **Tasks (`/tasks` — `TasksComponent`):** Action items board with priority badges (High, Medium, Low), category segmentation (Discovery, Follow-up, Legal), due date filtering, and Appwrite cloud persistence.
* **Notes (`/notes` — `NotesComponent`):** Centralized knowledge base supporting Markdown formatting, meeting transcripts, pinned voice memos from the Command Palette, and tagged searching.
* **Emails (`/emails` — `EmailsComponent`):** Unified communications interface with email composition, inbox threads, and template insertion.
* **Campaigns (`/campaigns` — `CampaignsComponent`):** Multi-channel marketing campaign manager with budget tracking, lead attribution, ROI metrics, and one-click bulk audience synchronization to external providers.
* **Calendar (`/calendar` — `CalendarComponent`):** Interactive event scheduler integrated with Nextcloud via CalDAV WebDAV XML reverse proxy. Supports event creation, attendee management, and multi-timezone display.
* **Scheduler (`/scheduler` — `SchedulerComponent`):** Standalone public-facing meeting reservation portal for prospects to book 30-minute discovery calls directly into the agent's schedule.
* **Deployment Checklist (`/deployment-checklist` — `DeploymentChecklistComponent`):** Interactive verification matrix checking SSL certificates, Appwrite credentials, CORS origins, and environment secrets prior to production deployment.

---

### 6.3 Analytics & Intelligence Domain

* **Reports (`/reports` — `ReportsComponent`):** Detailed revenue analytics, cohort conversion breakdowns, pipeline aging, average deal size trends, and CSV export.
* **AI Predictive Lead Scoring (`/lead-scoring` — `LeadScoringComponent`):**
  * **100-Point Dual Index:** 50 points Demographic Fit (industry tier, company scale, seniority, deal value) + 50 points Behavioral Intent (web visits, clicks, asset downloads, webinars).
  * **Configurable Weights Calibration Drawer:** Operator controls to adjust scoring point allocations in real time.
  * **Behavioral Event Simulator:** Trigger mock email opens, clicks, whitepaper downloads, and webinar attendance to observe real-time score recalculation.
* **Sales Forecasting & Scenario Modeling (`/forecast` — `ForecastComponent`):**
  * Multi-tier pipeline projection (Commit, Best Case, Weighted Expected Forecast) against target quota.
  * Sensitivity sliders for win rate multiplier (0.5x–2.0x), growth factor (-50% to +100%), and sales cycle velocity.
  * Granular opportunity overrides to exclude or commit specific deals.
* **Pipeline Signals (`/pipeline-signals` — `PipelineSignalsComponent`):** Real-time buyer intent detection capturing funding announcements, executive hiring, and website pricing page visits.
* **Automations (`/automations` — `AutomationsComponent`):** Event-action automation builder triggering Appwrite serverless functions and Slack webhook alerts upon pipeline status changes.
* **Workflows (`/workflows` — `WorkflowsComponent`):** Visual DAG workflow graph mapping complex enterprise onboarding and deal escalation workflows.
* **Email Workflows (`/email-workflows` — `EmailWorkflowsComponent`):** Trigger-based multi-step nurture workflows with integrated A/B testing, open/reply action handlers, and Liquid personalization.
* **Newsletter (`/newsletter` — `NewsletterComponent`):** Audience broadcast manager with subscriber segments, campaign drafts, and delivery analytics.

---

### 6.4 Records & Systems Domain

* **Clients (`/clients` — `ClientsComponent`):** Enterprise customer account profiles, subscription tier status, contract values, and key contacts.
* **Leads (`/leads` — `LeadsComponent`):** Lead management suite featuring Kanban board view, tabular view, Google Maps geographic cluster view, and CSV data importer.
* **Contacts (`/contacts` — `ContactsComponent`):** Stakeholder relationship directory with 3P marketing sync (Mailchimp, SendGrid, HubSpot), associated deal tracking, and CSV export.
* **Systems Hub (`/systems` — `SystemsComponent`):** Infrastructure monitoring console tracking Appwrite cloud latency, API uptime, database collection sizes, and memory usage.
* **Settings (`/settings` — `SettingsComponent`):** Appwrite Project ID, Endpoint, Database ID, Collection mappings, Team management, and API key configurations.

---

## 7. AI Intelligence & Sales Personality Engine (BEEP v2.0)

### 7.1 The 4 Sales Archetypes
Located in `src/app/sales-personality.service.ts` and powered by `gemini-3.8-flash`:

| Persona Key | Name | Philosophy & Voice | Primary Use Case |
| :--- | :--- | :--- | :--- |
| `reluctant_saviour` | **The Reluctant Saviour (BEEP v2.0)** | Sassy, deadpan, fourth-wall breaking AI that despises corporate jargon and generic outreach. Tough love, cosmic intelligence. | Call preparation, cringe detection, cold email rewriting |
| `empathetic_strategist` | **The Empathetic Strategist** | Ultra-high EQ mentor focused on psychological safety, stakeholder career fears, and trust architecture. | Discovery calls, executive alignment, price pushback |
| `challenger_oracle` | **The Challenger Oracle** | High-status, provocative commercial advisor that challenges the customer's status quo with industry data. | Competitive bake-offs, RFP displacement, executive pitches |
| `zen_closer` | **The Zen Closer** | Non-needy emotional detachment, master of comfortable silence, banishes discount-begging. | Contract negotiation, final commercial closing, legal terms |

### 7.2 Anti-Slop Directive & Cringe Audit Scanner
The server endpoint `POST /api/gemini/sales-personality/cringe-audit` analyzes user-submitted text:
* Identifies buzzwords ("just checking in", "touching base", "synergy", "circle back").
* Computes a **Cringe Score (0 to 100)**:
  * `0 - 25`: Authentic, human, punchy.
  * `26 - 60`: Moderate corporate fluff; needs tightening.
  * `61 - 100`: High cringe robotic slop; flagged for immediate rewrite.
* Outputs a roast from BEEP v2.0 alongside an authentic, high-converting alternative.

### 7.3 Google Search Grounding with Gemini 3.5 Flash
The server endpoint `POST /api/gemini/generate-search` leverages `gemini-3.5-flash` with Google Search grounding:
* Gathers fresh intelligence on target enterprise prospects (recent executive hiring, funding rounds, strategic initiatives).
* Returns grounded text accompanied by verifiable web citations (`title` and `uri`).

---

## 8. Multi-Engine Data Persistence & Storage Architecture

### 8.1 Appwrite Cloud Integration (`leadwave-main`)
Primary operational data resides in Appwrite Cloud under database `leadwave-main`:
* **Collections:**
  1. `leads`: Prospect metadata, deal size, stage, priority, scoring factors.
  2. `contracts`: Legal agreements, SLA parameters, cryptographic signature hashes.
  3. `contacts`: Stakeholders, phone numbers, corporate addresses, associated deals.
  4. `tasks`: Operational action items, due dates, completion states, lead assignments.
  5. `notifications`: Real-time system activity and Sentinel alert logs.
  6. `chatMessages`: Copilot dialogue history.
  7. `notes`: Rich knowledge notes, meeting minutes, and audio dictation records.
  8. `events`: Scheduled meetings, calendar appointments, and discovery sessions.
  9. `emails`: Inbound and outbound message logs.
  10. `workflows`: DAG workflow execution definitions.
  11. `campaigns`: Marketing broadcast campaigns and provider delivery metrics.
  12. `sequences`: Multi-touch cadence definitions and step statistics.
* **Storage Bucket:** `contracts` bucket configured for encrypted PDF/document storage with dynamic view and download URL tokens.

### 8.2 Turso LibSQL Agent Database-per-Tenant
Located in `src/server/turso.ts`:
* Dynamically instantiates `@libsql/client` per active tenant (`getTenantTursoClient(tenantKey)`).
* Auto-provisions the SQLite schema on server startup:
  * `agent_coaching_logs`: Stores prompt, advice, cringe score, BEEP comments, and feedback rating (`+1` or `-1`).
  * `agent_conversation_history`: Retains session reasoning logs and multi-turn context.
  * `agent_sales_rules`: Stores curated sales anti-patterns and replacement strategies.
* Transparent fallback to local file `agent_tenant_<sanitized_key>.db` when cloud Turso credentials are not configured.

### 8.3 Fail-Safe Hybrid Persistence Engine
To guarantee zero platform disruption in preview or offline environments:
* **Live Mode:** Connects to Appwrite Cloud endpoints and Turso database URLs when valid credentials exist in `.env`.
* **Hybrid Simulation Mode:** If cloud network requests fail or environment variables are missing, client and server services seamlessly fall back to local `localStorage` and structured in-memory stores.
* All UI workflows (creating leads, uploading contracts, scheduling meetings, running simulations) function without requiring pre-provisioned infrastructure.

### 8.4 Third-Party Integrations
* **Mailchimp, SendGrid, HubSpot:** Managed by `EmailMarketingService` for one-click contact audience synchronization.
* **Nextcloud CalDAV:** Authenticated XML `PROPFIND` reverse proxy via `POST /api/nextcloud/calendar`.
* **Google Maps Platform:** Provides geographic cluster coordinates for visual lead mapping.

---

## 9. Complete Server REST API Reference

All backend routes are served via Express 5.x in `src/server.ts`:

### AI & Intelligence Endpoints

#### `POST /api/gemini/generate-lite`
High-speed content synthesis using `gemini-3.1-flash-lite` with 120-second caching.
* **Request Body:** `{ "prompt": string, "systemInstruction"?: string }`
* **Response (200):** `{ "text": string }`

#### `POST /api/gemini/generate-search`
Search-grounded intelligence generation using `gemini-3.5-flash` with Google Search tools.
* **Request Body:** `{ "prompt": string, "systemInstruction"?: string }`
* **Response (200):** `{ "text": string, "citations": [{ "title": string, "uri": string }] }`

#### `POST /api/gemini/sales-personality/coach`
AI sales personality coaching powered by `gemini-3.8-flash` and persisted to Turso LibSQL.
* **Request Body:**
  ```json
  {
    "lead": { "name": "Stark Industries", "value": 250000, "industry": "Cyber Security" },
    "interactionType": "call_prep",
    "userInput": "Prospect asking for a 30% discount before signing",
    "persona": "reluctant_saviour",
    "tenantKey": "default"
  }
  ```
* **Response (200):**
  ```json
  {
    "id": "coach_1727654000_abcde",
    "persona": "reluctant_saviour",
    "interactionType": "call_prep",
    "coachingTip": "Stop negotiating against yourself. Ask what scope they want removed.",
    "wittyRetort": "\"We can certainly adjust the price to fit your budget, which core security module should we delete?\"",
    "psychologicalInsight": "They have the budget; procurement is testing your confidence.",
    "cringeScore": 15,
    "flaggedCliches": [],
    "beepCommentary": "If you discount this without removing scope, I am shutting off your WiFi.",
    "humanCentricRewrite": "Totally understand budget guardrails. If $180k is the hard ceiling, let's defer Phase 2."
  }
  ```

#### `POST /api/gemini/sales-personality/cringe-audit`
Anti-slop corporate jargon scanner powered by `gemini-3.8-flash`.
* **Request Body:** `{ "text": string, "leadContext"?: string }`
* **Response (200):**
  ```json
  {
    "cringeScore": 75,
    "verdict": "High Cringe - Robotic SaaS Slop Detected",
    "flaggedPhrases": ["just checking in", "touch base", "synergy"],
    "rewrite": "Hey John, saw your team just opened a new DC office. Still looking at hybrid database latency?",
    "roast": "BEEP: \"Reading this caused a thermal throttle in my neural engine. Burn it immediately.\""
  }
  ```

#### `GET /api/agent/coaching-logs`
Retrieves past coaching interactions from the tenant's Turso database.
* **Query Params:** `tenant` (string, default `default`), `limit` (number, default `25`).
* **Response (200):** `{ "logs": [AgentCoachingLogRow] }`

#### `POST /api/agent/coaching-logs/:id/rate`
Submits feedback rating (`+1` or `-1`) for a specific coaching advice record.
* **Request Body:** `{ "rating": 1, "tenantKey": "default" }`
* **Response (200):** `{ "success": true, "id": string, "rating": number }`

---

### Lead & Scoring Endpoints

#### `GET /api/leads/:id/score`
Calculates the 100-point algorithmic score for a specific lead.
* **Response (200):**
  ```json
  {
    "leadId": "1",
    "leadName": "Acme Corp",
    "score": 88,
    "demographicScore": 85,
    "activityScore": 90,
    "scoreCategory": "Hot",
    "grade": "A",
    "scoreFactors": [
      { "factor": "Tier-1 Strategic Industry (SaaS)", "points": 20, "type": "demographic" },
      { "factor": "Enterprise Scale (500+ employees)", "points": 25, "type": "demographic" }
    ],
    "humanRepCoaching": {
      "openerVibe": "Bold executive punchline",
      "actionableTip": "High buying intent detected (88/100). Focus on ROI timeline."
    }
  }
  ```

#### `GET /api/leads/:id/extended`
Fetches a lead record aggregated with assigned tasks, score breakdown, and interaction timeline.
* **Response (200):** `{ "lead": Lead, "score": ScoreResult, "assignedTasks": Task[], "history": [] }`

#### `POST /api/leads/:id/tasks`
Creates and assigns a task directly to a specified lead.
* **Request Body:** `{ "title": string, "priority": string, "dueDate": string, "category": string }`
* **Response (201):** `{ "item": Task }`

#### `POST /api/leads/:id/activities`
Logs a behavioral activity event (call, email, note, demo) and appends to the lead's history.
* **Request Body:** `{ "type": string, "detail": string, "date"?: string }`
* **Response (200):** `{ "success": true, "activity": Object, "history": Array }`

#### `POST /api/leads/score`
Calculates score and grading on an arbitrary unpersisted lead payload.
* **Request Body:** `{ "lead": LeadRecord, "weights"?: ScoringWeights }`
* **Response (200):** `ScoreResult`

#### `GET /api/lead-scoring/weights`
Returns the active scoring weights schema and default point allocations.
* **Response (200):** `{ "weights": DEFAULT_WEIGHTS }`

---

### Collection CRUD Gateway Endpoints
Dynamically mapped across all 12 system collections (`leads`, `contracts`, `contacts`, `tasks`, `notifications`, `chatMessages`, `notes`, `events`, `emails`, `workflows`, `campaigns`, `sequences`):

* `GET /api/:collection` — Lists documents with team scoping and default fallbacks.
* `GET /api/:collection/:id` — Retrieves a specific document by ID.
* `POST /api/:collection` — Creates a document with team role permissions.
* `PATCH /api/:collection/:id` — Updates document fields while preserving immutable IDs.
* `DELETE /api/:collection/:id` — Deletes document by ID (204 No Content).

---

### Third-Party Gateway Endpoints

#### `POST /api/nextcloud/calendar`
Reverse proxy forwarding authenticated XML `PROPFIND` calendar queries to Nextcloud CalDAV instances to bypass browser CORS restrictions.
* **Request Body:** `{ "url": string, "username": string, "password": string }`
* **Response (200):** `{ "success": true, "xml": string }`

#### `GET /api/config/maps`
Securely exposes the Google Maps Platform API key to authenticated client sessions.
* **Response (200):** `{ "key": string }`

---

## 10. Data Models & TypeScript Interface Contracts

```typescript
// 1. Lead Record
export interface Lead {
  $id?: string;
  name: string;
  email: string;
  phone?: string;
  source: string;
  status: 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Closed' | string;
  value: number;
  industry?: string;
  company?: string;
  region?: string;
  jobTitle?: string;
  companySize?: 'Enterprise' | 'Mid-Market' | 'Small Business' | 'Startup' | string;
  annualRevenue?: number;
  budgetTier?: string;
  lat?: number;
  lng?: number;
  aiInsights?: string;
  priority?: 'High' | 'Medium' | 'Low' | string;
  expectedCloseDate?: string;
  createdAt?: string;
  websiteActivity?: 'High' | 'Medium' | 'Low' | string;
  emailEngagement?: 'High' | 'Medium' | 'Low' | string;
  websiteVisits?: number;
  emailOpens?: number;
  emailClicks?: number;
  downloads?: string[];
  webinarsAttended?: string[];
  score?: number;
  demographicScore?: number;
  activityScore?: number;
  scoreCategory?: 'Hot' | 'Warm' | 'Cold' | string;
  grade?: 'A+' | 'A' | 'B' | 'C' | 'D';
  scoreFactors?: ScoreFactor[];
  history?: { type: string; date: string; content: string }[];
  teamId?: string;
}

// 2. Contract Agreement
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

// 3. Operational Task
export interface Task {
  $id?: string;
  title: string;
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  dueDate: string;
  description?: string;
  completed: boolean;
  leadId?: string;
  leadName?: string;
  status?: 'todo' | 'in_progress' | 'done';
  teamId?: string;
}

// 4. Contact Stakeholder
export interface ContactRecord {
  $id: string;
  name: string;
  email?: string;
  phone?: string;
  company: string;
  address?: string;
  notes?: string;
  status: 'Lead' | 'Opportunity' | 'Customer' | string;
  dealValue: number;
  lastContacted?: string;
  associatedDeals?: { id: string; title: string; stage: string; value: number }[];
  teamId?: string;
}

// 5. Buying Committee Stakeholder
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

// 6. Email Workflow & Multi-Touch Sequence
export interface EmailWorkflow {
  $id: string;
  teamId: string;
  name: string;
  description: string;
  status: 'active' | 'draft' | 'paused' | 'archived';
  trigger: {
    type: 'lead_created' | 'stage_changed' | 'lead_score_reached' | 'deal_value_exceeded' | 'tag_added' | 'inactivity_detected';
    targetStage?: string;
    minScore?: number;
    minDealValue?: number;
    tag?: string;
    inactivityDays?: number;
  };
  steps: EmailWorkflowStep[];
  enrolledCount: number;
  completedCount: number;
  convertedCount: number;
  replyRate: number;
  openRate: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface EmailWorkflowStep {
  id: string;
  stepOrder: number;
  name: string;
  delayValue: number;
  delayUnit: 'minutes' | 'hours' | 'days';
  subject: string;
  body: string;
  previewText?: string;
  abTest?: {
    enabled: boolean;
    variantSubject?: string;
    variantBody?: string;
    splitRatio?: number;
    statsA?: StepStats;
    statsB?: StepStats;
  };
  actionOnOpen?: 'notify_rep' | 'increase_score' | 'change_stage' | 'create_task' | 'none';
  actionOnReply?: 'stop_sequence' | 'notify_rep' | 'mark_hot_lead' | 'none';
  stats: StepStats;
}

export interface StepStats {
  sent: number;
  opened: number;
  clicked: number;
  replied: number;
  bounced: number;
}
```

---

## 11. Multi-Tenancy, Security & RBAC Enforcement

### Tenant Partitioning
Multi-tenancy is enforced natively through Appwrite's **Teams Model**:
1. **Workspace Boundary:** Each business tenant maps to an Appwrite Team ID (`teamId`).
2. **Row-Level Security:** Documents created through the server driver inject team permission boundaries:
   ```typescript
   permissions = [
     Permission.read(Role.team(teamId, 'member')),
     Permission.update(Role.team(teamId, 'admin')),
     Permission.delete(Role.team(teamId, 'owner'))
   ];
   ```
3. **Database-per-Tenant Edge Isolation:** The Turso LibSQL agent client creates distinct parameterized SQLite database instances (`agent_tenant_<sanitized_key>.db`) ensuring zero cross-tenant contamination for AI reasoning logs.

### Secret Encapsulation
* Sensitive credentials (`GEMINI_API_KEY`, `APPWRITE_API_KEY`, `TURSO_AUTH_TOKEN`) are strictly scoped to the server runtime.
* The Angular client accesses AI and database functionality via proxy endpoints (`/api/*`), guaranteeing that API keys are never exposed in browser bundles.

### Cryptographic Sealing
* Legal contracts generated in `/contracts` compute an **SHA-256 digital digest envelope** over the client name, monetary value, liability caps, SLA percentage, and timestamp.
* Any tampering with contract terms invalidates the signature verification hash.

---

## 12. Design Language, Typography & Visual Contracts

### Obsidian Iridescence Aesthetic
The design system combines **Mesoamerican monolithic architectural geometry** with **Cyberpunk Noir** and **oxidized Roman glass**:
* **Background Canvas:** Carbon Zinc (`#07070a`) layered with GPU-accelerated atmospheric auroras.
* **Palette Accents:**
  * Primary Verdigris Cyan: `#14b8a6` / `#06b6d4`
  * Strategic Arcane Purple: `#a855f7` / `#6A0DAD`
  * Operational Emerald: `#10b981` / `#3EB991`
  * Aztec Gold / Amber: `#f59e0b` / `#FFD700`
* **Card Elevation:** Translucent glassmorphism (`bg-zinc-900/80 backdrop-blur-xl border border-zinc-800`) with subtle rim highlights (`border-white/5` or `border-teal-500/20`).

### Typography Contracts
1. **Display & Logos:** `Comfortaa` — soft, geometric, modern letterforms.
2. **Body Copy & UI:** `Lexend Deca` — engineered for rapid reading, open apertures, and zero visual fatigue.
3. **Telemetry & Numbers:** Monospace (`ui-monospace`, `SFMono-Regular`) for currency figures, ARR values, SHA-256 hashes, and timestamps.

---

## 13. Developer Runbook, Seeding & Deployment

### Environment Configuration
Create a `.env` file based on `.env.example`:
```bash
# Gemini AI API Key (Server-Side)
GEMINI_API_KEY="your-gemini-api-key"

# Appwrite Cloud Config
NEXT_PUBLIC_APPWRITE_ENDPOINT="https://tor.cloud.appwrite.io/v1"
NEXT_PUBLIC_APPWRITE_PROJECT_ID="6990e2830030cacccd98"
NEXT_PUBLIC_APPWRITE_DATABASE_ID="leadwave-main"
APPWRITE_API_KEY="your-appwrite-server-key"

# Turso Agent Database (Optional)
TURSO_DATABASE_URL=""
TURSO_AUTH_TOKEN=""

# Google Maps Platform Key (Optional)
GOOGLE_MAPS_PLATFORM_KEY=""

# Server Port
PORT="3000"
```

### Database Seeding & Schema Setup
Run the automated schema provisioning script to initialize collections, attributes, and indexes on Appwrite Cloud:
```bash
# Execute Bun setup runner
bun scripts/setup-database.js
```

### Development & Build Commands
```bash
# Start full-stack dev server (port 3000)
bun run dev

# Run ESLint validation (0 errors enforced)
bun run lint

# Run unit tests with Bun Test runner
bun run test

# Compile production SSR bundle (Angular + Optimized Bun Server)
bun run build

# Start production server
bun run serve:ssr:app
```

---

*Authored and certified for the ΛΞVOS Platform Codebase.*
