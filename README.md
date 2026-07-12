# ΛΞVOS CRM — Architectural & Integration Guide

Welcome to the **ΛΞVOS CRM** production-ready workspace documentation. This system is a highly optimized, single-tenant/multi-tenant capable sales agent suite and contract workflow system. It utilizes a modern **Angular (v21 Zoneless)** client architecture integrated with **Appwrite (Account, Databases, Teams, and Storage APIs)** and features elegant, dark-theme glassmorphism dashboards.

---

## 🏗️ Architectural Overview

```
                                 ┌──────────────────────────────────┐
                                 │       ΛΞVOS CRM (Angular)        │
                                 └────────────────┬─────────────────┘
                                                  │
                  ┌───────────────────────────────┼──────────────────────────────┐
                  ▼                               ▼                              ▼
     ┌────────────────────────┐       ┌──────────────────────┐       ┌───────────────────────┐
     │  Appwrite Client SDK   │       │   Nextcloud Portal   │       │  Mail Server (IMAP/   │
     │   (State, Auth, DB,    │       │     (CalDAV API)     │       │       SMTP API)       │
     │   Teams, and Storage)  │       └──────────────────────┘       └───────────────────────┘
     └────────────────────────┘
```

The system is split into two layers:
1. **Frontend (SPA Single Page Application)**: Powered by Zoneless Angular 21, ensuring blazing fast UI renders and optimal performance by replacing Zone.js with native Signals and `ChangeDetectionStrategy.OnPush`.
2. **Backend / Third-Party Integration Layer**: Proxied securely via `server.ts` or executed directly through standard APIs to prevent API key exposure and bypass browser CORS restrictions.

---

## 🔐 Appwrite Services Integration

All core operations are managed via the `Appwrite` service provider (`src/app/appwrite.ts`), which acts as an abstraction wrapper with a unified reactive state.

### 1. User Authentication (`Account` API)
* Implements direct user login, signup, session tracking, and secure logouts.
* Reactive authentication statuses are surfaced instantly to the client via `currentUser` signals.

### 2. Multi-Tenancy & Collaboration (`Teams` API)
* **Team Isolation**: System structures workspaces using Appwrite's native Team models. Resource permissions are scoped dynamically per active team.
* Admins can invite team members and modify team roles seamlessly through the workspace view.

### 3. Databases and Schemas (`Databases` API)
The collections are stored inside the `leadwave-main` database, with automatic schema mapping:
* **Leads Collection (`leads`)**: Sales prospect tracking, metadata, dynamic lifecycle status.
* **Contacts Collection (`contacts`)**: Primary account stakeholder storage.
* **Tasks Collection (`tasks`)**: Operational assignments, deadlines, related leads.
* **Notifications Collection (`notifications`)**: Audit trails and instant agent alerts.

### 4. Secure File Storage (`Storage` API)
* Built a **Contractual Workspace Suite** inside the CRM to manage, review, and shred files like NDA and SLAs.
* Linked directly to the Appwrite Storage engine using the custom configured Bucket `contracts`.
* **View & Download Capabilities**: Provides secure links dynamically using `getFileView` and `getFileDownload`.

---

## 💾 Fail-Safe Hybrid Persistence Engine

To ensure an exceptionally fluid and robust developer & user experience in sandboxed or offline preview environments, the `Appwrite` service has been engineered with a **Fail-Safe Hybrid Persistence Engine**:

* **Live Cloud Execution**: When configured with live credentials, the service binds seamlessly to Appwrite Cloud endpoints.
* **Local Simulation Fallback**: If connection to the cloud endpoint fails or is unconfigured, the service transparently fallbacks to structured `localStorage` operations.
* This ensures that developers can run, test, and preview the CRM's complete lifecycle (creating leads, uploading contracts, sharing documents) without needing a pre-provisioned database instance immediately.

---

## 🛠️ Developer Tooling & Database Seeding

We have provided a full-stack typescript setup script (`scripts/setup-database.ts`) to automate your remote Appwrite infrastructure provisioning.

### Running Setup Seeding:
Make sure your environment variables in `.env` are set correctly, then run:
```bash
# Setup collection blueprints, attributes, and default role permissions on Appwrite Cloud
npm run setup-db
```

This creates the necessary `leads`, `contracts`, `contacts`, `tasks`, and `notifications` tables with standardized `dataPayload`, `teamId`, and `createdBy` structures automatically.

---

## 🧹 Code Quality & Resolved Linter Configurations

During development, the following engineering and linter corrections were successfully performed:
1. **Forms Accessibility (a11y)**: Fixed `@angular-eslint/template/label-has-associated-control` issues in `calendar.component.ts`, `emails.component.ts`, and `contract-suite.component.ts` by ensuring all `<label>` components are correctly associated with form controls using explicit `for="..."` and `id="..."` pairings.
2. **Typescript Strict Checks**: Cleared `Unexpected any. Specify a different type` warnings by utilizing clean model interfaces (`ContractFile`, `ContractTemplate`) and appropriate type casting (`(error as Error).message`).
3. **Dead Code Elimination**: Removed unused imports, initialized references properly, and pruned dangling local variables (`data` assignments and empty catch blocks) across components and services.
4. **Build Tool Compatibility**: Re-installed standard package dependencies and ran complete `compile_applet` tests, ensuring the bundle builds with zero errors or diagnostic warnings.

---

## 🎨 Design Language (Obsidian Iridescence)

This applet adheres to the **Obsidian Iridescence** aesthetic system:
* **Aesthetic**: Mesoamerican architecture geometry merged with dark Cyberpunk Noir.
* **Color Palette**: Deep Charcoal foundations, primary Glass Neon Teal, secondary Arcane Purple, and highlight Aztec Gold.
* **Typography**: Beautiful curves of **Comfortaa** paired with the razor-thin, readable **Lexend** for body copy and dense system data.
* **Elevation**: Layers of glassmorphism cards decorated with thin border borders and intensive backdrop blurs rather than flat standard dropshadows.
