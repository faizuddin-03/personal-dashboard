# WhatsApp Blast System

Single-tenant marketing-blast system on the WhatsApp Business Cloud API.

See full design: `docs/superpowers/specs/2026-05-24-whatsapp-blasting-system-design.md`

## Prerequisites

- Node.js 20+
- pnpm 9+ (`npm install -g pnpm@9`)
- Docker Desktop (for Postgres + Redis)

## First-time setup

```bash
# 1. Install deps
pnpm install

# 2. Start Postgres + Redis
docker compose up -d

# 3. Copy env files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 4. Apply DB migrations
pnpm db:migrate
# Note: the CannedReply table requires a migration — run `pnpm db:migrate` after pulling this branch.

# 5. Seed the initial admin user (prints credentials)
pnpm db:seed

# 6. (optional) Seed demo analytics history so Performance/Dashboard charts populate
pnpm db:seed:analytics
```

## Run dev

You need 3 terminals (API + worker + web):

```bash
# Terminal 1 — API on http://localhost:3000
pnpm --filter api dev

# Terminal 2 — Worker (processes blast jobs)
pnpm --filter api dev:worker

# Terminal 3 — Web on http://localhost:5173
pnpm --filter web dev
```

Visit `http://localhost:5173` and log in with the seeded admin credentials.

## Tests

```bash
# Unit + integration (NestJS + Jest)
pnpm --filter api test

# E2E smoke (Playwright) — requires API + web running
pnpm --filter e2e install-browsers   # one-time
pnpm --filter e2e test
```

## WhatsApp Cloud API setup

This project ships with `WHATSAPP_MOCK_MODE=true` so Phase 3 works without real Meta credentials. To go live:

1. Create a Meta Business Manager account at https://business.facebook.com
2. Add a WhatsApp Business Account (WABA)
3. Register a phone number to the WABA
4. Generate a System User access token with `whatsapp_business_management` and `whatsapp_business_messaging` scopes
5. Get your WABA ID and Phone Number ID from the WhatsApp Business Manager dashboard
6. Generate an app secret in Meta Developer Console
7. Choose any random string for your webhook verify token

Then update `apps/api/.env` (or your hosted env):
```env
WHATSAPP_MOCK_MODE=false
WHATSAPP_API_VERSION=v20.0
WHATSAPP_WABA_ID=<your-waba-id>
WHATSAPP_PHONE_NUMBER_ID=<your-phone-number-id>
WHATSAPP_ACCESS_TOKEN=<your-access-token>
WHATSAPP_APP_SECRET=<your-app-secret>
WHATSAPP_WEBHOOK_VERIFY_TOKEN=<any-random-string>
```

For local development you also need a public HTTPS tunnel so Meta can POST webhooks to your machine. Easiest option:
```bash
ngrok http 3000
# then in Meta Developer Console, set webhook URL to:
# https://<your-ngrok-subdomain>.ngrok.io/api/webhooks/meta
```

## Project layout

- `apps/api` — NestJS backend, Prisma, BullMQ
- `apps/web` — React SPA (Vite, Tailwind, React Query, React Router)
- `e2e`     — Playwright smoke tests
- `docs/superpowers/specs` — design spec
- `docs/superpowers/plans` — phased implementation plans

## Phase 1 — what's done

- Monorepo + Docker (Postgres, Redis)
- NestJS API with JWT auth, refresh-token cookie, JWT + roles guards
- Users module (admin-only CRUD)
- Seed script for initial admin
- React SPA with login, protected routes, settings page (user management)
- Playwright smoke tests for login + roles

## Phase 2 — what's done

- Contacts table with first-class demographic columns (gender, ethnicity, religion, occupation, language preference, location) + opt-in audit trail
- Contacts CRUD endpoints with pagination, search, demographic filtering
- CSV import endpoint with per-row error reporting and phone normalization to E.164
- Segments: saved filter expressions with live preview (count + sample)
- React pages: `/contacts` (list+filters+pagination), `/contacts/new`, `/contacts/:id` (edit), `/contacts/import`, `/segments`
- E2E smoke tests for contact CRUD and segment creation

## Phase 3 — what's done

- Templates table: multi-language, versioned, with status (DRAFT/PENDING/APPROVED/REJECTED/DISABLED)
- Meta Cloud API client (`WhatsappCloudApiService`) with mock mode toggle via `WHATSAPP_MOCK_MODE=true`
- Webhook endpoint at `POST /api/webhooks/meta` with HMAC-SHA256 signature verification
- Webhook GET verification endpoint at `GET /api/webhooks/meta` for Meta's initial setup
- Hourly cron poller (`TemplatesPoller`) as fallback for missed webhooks
- React pages: `/templates` (list with status badges + filters), `/templates/new`, `/templates/:name` (multi-language editor with submit-to-Meta action)
- E2E smoke test for full draft → submit flow (uses mock mode)

## Phase 4 — what's done

- Blast scheduling: `Blast` row + one `Message` per recipient per blast
- BullMQ queue + separate worker process (`apps/api/src/worker.ts`)
- Throttling: per-second rate via BullMQ concurrency + 24h tier via Redis sliding window
- Language selection per recipient (uses contact.languagePreference, falls back to blast default)
- Variable rendering (`{{1}}` etc.) from contact fields or literal values
- Webhook handler now also processes `messages.statuses` events (delivered/read/failed)
- Mid-flight cancellation: drains BullMQ delayed/waiting jobs + marks QUEUED messages CANCELED
- React pages: `/blasts` list, `/blasts/new` wizard, `/blasts/:id` detail with 5-second live polling and cancel button
- Seeded APPROVED test template (`sample_promo_2026` EN + MS) so blasts work in mock mode

## Phase 5 — what's done

- `inbound_messages` table + `messages.replied_at` column for reply tracking
- Inbound webhook handling: parses `messages.messages` from Meta, stores reply, attributes to most recent blast within configurable window (default 7 days)
- Per-recipient reply attribution stamps `messages.replied_at` on the matched outgoing message (first reply wins)
- New backend endpoints: `GET /blasts/:id/replies`, `GET /blasts/:id/recipients` (paginated + status filter), `GET /blasts/:id/timeline` (hourly buckets), `GET /blasts/:id/recipients.csv` (CSV download)
- Admin endpoints: `GET /system-settings`, `PATCH /system-settings` for Meta tier + attribution window
- Frontend: Replied KPI + paginated recipients table + SVG delivery timeline chart + Download CSV button on blast detail page
- Frontend: `/blasts/:id/replies` page showing inbound replies attributed to the blast
- Frontend: System Config section in Settings (admin-only) to set tier + attribution window

## Phase 6 — what's done

- Refresh-token rotation endpoint (`POST /api/auth/refresh`) with throttling (10/min/IP)
- Logout endpoint (`POST /api/auth/logout`) that clears the refresh cookie
- Login route throttled (5/min/IP) to deter brute-force
- Self-deletion guard on `DELETE /api/users/:id` (admins can't delete themselves)
- `process.env.NODE_ENV` replaced with `ConfigService.get('NODE_ENV')` in auth controller (consistency)
- Startup warning when `WHATSAPP_MOCK_MODE=false` but `WHATSAPP_ACCESS_TOKEN` is empty (catches local `.env` drift)
- Frontend auth persists across page reloads: AuthContext calls `/auth/refresh` on mount and shows a brief "Loading…" state via `ProtectedRoute`
- Axios interceptor auto-refreshes on 401 mid-session and retries the original request transparently
- Password reset uses a modal + toast feedback instead of `window.prompt`/silent UX
- E2E coverage for operator role (cannot see Settings link, cannot access `/settings` even via direct URL)
- E2E coverage for auth persistence (page reload keeps the session; logout clears it)
- Contacts E2E pagination flakiness fixed via search filter

## Inbox

Global per-contact conversation view. See all inbound replies grouped by sender,
respond with free-form text inside the 24-hour customer-service window, and
mark conversations as resolved.

- 3-pane layout: list / thread / context
- Tabs: All · Awaiting reply · Replied · (Auto-replied & Escalated reserved for the future chatbot subsystem)
- Auto-resolve on reply; manual Mark resolved / Reopen for edge cases
- Sidebar badge shows unresolved count
- 5-second polling for new replies; 30-second polling for the sidebar count
- Outbound past the 24h window must use a template via Blasts

API: `/api/inbox/*` (see `docs/superpowers/specs/2026-05-28-inbox-without-ai-design.md`).

## State-based language blasting

Blasts can target template language by the contact's Malaysian state instead of
their individual preference. Admins configure a per-state language mapping in
Settings (e.g. Penang → Mandarin + English, Kelantan → Malay). In state mode,
each contact receives one message per language mapped to their state; contacts
whose state is unmapped or unknown get the blast's default language.

- Per-blast toggle: "Language by contact preference / contact state"
- Multiple languages per state → a contact may receive multiple messages
- Wizard shows "X messages to Y contacts" and blocks launch if a required
  language has no approved template variant
- State is a canonical enum (16 MY states/territories); CSV import normalizes
  common spellings (Pulau Pinang → Penang)

API: `/api/state-language-mappings/*` + `/api/blasts/preview-state-languages`
(see `docs/superpowers/specs/2026-06-02-state-language-blast-design.md`).

## All phases complete

All phases of the design spec are complete. Tagged `v1.0.0`. Future work is genuinely new scope: AWS migration, real customer onboarding, the optional Python chatbot subsystem (mentioned in spec section 15), and the deferred items listed at the end of each phase plan.
