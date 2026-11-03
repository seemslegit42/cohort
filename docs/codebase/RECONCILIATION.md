# Appwrite reconciliation (canonical)

**Database ID:** `crm-main` (`APPWRITE_DATABASE_ID` in [`src/server/appwrite-schema.ts`](../../src/server/appwrite-schema.ts))

**Dev-only demo data:** set `ALLOW_DEMO_DATA=true` in `.env.local` (never in production).

| Table ID | APPWRITE_TABLES | Client | Server `/api` | Action |
|----------|-----------------|--------|----------------|--------|
| `leads` | yes | Appwrite + `/api/leads` | `/api/leads` | OK |
| `contacts` | yes | `/api/contacts` | `/api/contacts` | OK |
| `tasks` | yes | `/api/tasks` | `/api/tasks` | OK |
| `notes` | yes | `/api/notes` | `/api/notes` | OK |
| `notifications` | yes | `/api/notifications` | `/api/notifications` | OK |
| `contracts` | yes | `/api/contracts` | `/api/contracts` | OK |
| `emails` | yes | `/api/emails` | `/api/emails` | OK |
| `events` | yes | `/api/events` | `/api/events` | OK |
| `chatMessages` | yes | `/api/chatMessages`, alias `/api/chat` | `/api/chatMessages`, alias `/api/chat` | Fixed alias |
| `email_workflows` | yes | `email-workflow.service`, `/api/email_workflows` | `/api/email_workflows` | Replaced legacy `workflows` |
| `newsletter_subscribers` | yes | newsletter component | `/api/newsletter_subscribers` | Added to server CRUD |
| `workflows` | no | was `appwrite.ts` | removed | Use `email_workflows` |
| `campaigns` | no | local UI state only | removed | No server table until schema added |
| `sequences` | no | cadences UI | removed | No server table until schema added |
| `leadwave-main` | n/a | legacy docs | removed | Use `crm-main` |

Generated SDK under `generated/appwrite/` is optional; runtime uses [`src/server/appwrite-schema.ts`](../../src/server/appwrite-schema.ts) + [`src/server/db.ts`](../../src/server/db.ts).
