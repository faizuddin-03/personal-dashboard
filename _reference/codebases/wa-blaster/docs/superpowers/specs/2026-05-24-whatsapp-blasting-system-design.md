# WhatsApp Blasting System — Design Spec

**Date:** 2026-05-24
**Owner:** Modefair team (single-tenant)
**Status:** Draft — awaiting review

---

## 1. Purpose

Build a single-tenant web system for sending marketing blasts over the official WhatsApp Business Platform (Cloud API), including in-system template authoring, submission to Meta, approval tracking, segmented sending by demographics, and per-blast analytics including reply tracking.

This is Phase 1 (marketing blasts). Phase 2 will add customer support / two-way conversations with a separate Python chatbot system. Phase 3 will add transactional notifications.

## 2. Scope

### In scope (this spec)
- Marketing blasts (WhatsApp template category `MARKETING`)
- Template authoring with submission to Meta and approval tracking
- All template categories visible in UI (`MARKETING`, `UTILITY`, `AUTHENTICATION`)
- Multi-language templates authored together, reviewed independently by Meta
- Contact CRUD (manual entry + CSV upload), demographic fields, opt-in tracking
- Segments (saved filters) for targeting blasts
- Blast scheduling, throttled sending, Meta tier-limit awareness
- Per-blast delivery analytics (sent / delivered / read / failed / replied)
- Reply attribution to recent blasts within a configurable window
- Admin/operator role-based auth
- Local-first development, designed for clean migration to AWS

### Out of scope (deferred)
- Two-way chatbot / inbound conversation handling (Phase 2, separate Python system)
- Transactional/utility notifications (Phase 3)
- Multi-tenancy
- Email infrastructure (invites, password resets via email)
- Public signup / OAuth / SSO
- Mobile app
- A/B testing of templates
- Template version analytics / "which template performs best" recommendations
- Multi-language UI for the admin panel itself (English only for now)
- Dark mode
- Test-send preview feature
- Backup/restore tooling beyond standard managed-DB snapshots
- PDPA data subject request tooling (handled by user out-of-band)

## 3. Architecture

### Components
- **React SPA (Vite)** — admin panel served as static assets. Communicates with the backend over HTTPS/JSON.
- **NestJS API server** — TypeScript on Node.js. REST endpoints for CRUD, auth, blast management, template management. Receives Meta webhooks. Enqueues blast jobs.
- **Blast Worker** — separate Node.js process. Consumes BullMQ jobs from Redis. Throttles sends to honor Meta tier and per-second rate limits. Calls Meta Cloud API per recipient. Updates message rows in DB.
- **PostgreSQL** — persistent data (contacts, templates, blasts, messages, events, users).
- **Redis** — BullMQ job queue, rate-limit counters, ephemeral state.
- **Meta WhatsApp Cloud API** — external. Direct integration (no BSP).

### Data flow for a blast
1. Marketer picks template + segment + variables + send time in React UI.
2. NestJS validates, resolves segment to contact list, inserts `blasts` row (status `SCHEDULED`) + N `messages` rows (status `QUEUED`).
3. NestJS enqueues N BullMQ jobs in Redis with a delay matching the scheduled send time.
4. Worker pulls jobs at the throttled rate, renders template variables per contact, POSTs to Meta Cloud API.
5. Worker updates `messages.status = SENT` with `meta_message_id` and `sent_at`.
6. Meta sends delivery/read/failure webhooks asynchronously. NestJS webhook handler writes `message_events` rows and updates the corresponding `messages` row.
7. React dashboard polls `GET /blasts/:id/stats` every 5 seconds while the blast is `RUNNING`.
8. When all `messages` reach a terminal status, `blasts.status` transitions to `COMPLETED`.

## 4. Tech Stack

| Layer | Choice |
|---|---|
| Backend | NestJS (TypeScript on Node.js) |
| Frontend | React SPA (Vite + React Query + Tailwind) |
| Worker | Node.js process using `@nestjs/bullmq` |
| Queue | BullMQ on Redis |
| Database | PostgreSQL via Prisma ORM |
| Auth | JWT (short-lived access + HTTP-only refresh cookie); bcrypt for passwords |
| Validation | `class-validator` + `class-transformer` (NestJS native) |
| Testing | Jest (unit + integration), Playwright (E2E smoke), `nock` for HTTP mocking |
| Local orchestration | Docker Compose |
| Deployment (future) | AWS — ECS Fargate (API + Worker), RDS Postgres, ElastiCache Redis, S3 + CloudFront (frontend) |

## 5. Data Model

### `users`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `email` | text unique | |
| `password_hash` | text | bcrypt |
| `role` | enum | `ADMIN`, `OPERATOR` |
| `created_at` | timestamptz | |

### `contacts`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `phone_e164` | text unique | `+60123456789` format |
| `name` | text | |
| `date_of_birth` | date | nullable — age computed at query time |
| `gender` | enum | `MALE`, `FEMALE`, `OTHER`, `UNKNOWN` |
| `ethnicity` | enum | `MALAY`, `CHINESE`, `INDIAN`, `OTHER`, `UNKNOWN` |
| `religion` | enum | `ISLAM`, `BUDDHISM`, `HINDUISM`, `CHRISTIANITY`, `OTHER`, `UNKNOWN` |
| `occupation` | enum | `STUDENT`, `EMPLOYED`, `SELF_EMPLOYED`, `UNEMPLOYED`, `RETIRED`, `OTHER`, `UNKNOWN` |
| `language_preference` | enum | `EN`, `MS`, `ZH`, `TA`, `OTHER` |
| `city` | text | |
| `state` | text | Malaysian state name |
| `attributes` | jsonb | Flexible bag for additional fields (customer_tier, lifetime_value, etc.) |
| `opt_in_status` | enum | `OPTED_IN`, `OPTED_OUT`, `PENDING` |
| `opt_in_source` | text | e.g. `csv:filename.csv`, `manual:user_id` |
| `opt_in_at` | timestamptz | |
| `opt_out_at` | timestamptz | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

Indexes on `phone_e164` (unique), `ethnicity`, `gender`, `language_preference`, `state`, `opt_in_status`.

### `contact_segments`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `name` | text | |
| `filter_json` | jsonb | Structured filter expression (e.g. `{ethnicity:"MALAY", age_min:25, age_max:45, states:["KL","SGR"]}`) |
| `created_by` | uuid | FK to `users.id` |
| `created_at` | timestamptz | |

### `templates`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `name` | text | Meta template name (e.g. `raya_promo_2026`) |
| `version` | int | Auto-incrementing per `name`. Old rejected versions retained as audit history. |
| `language` | enum | `EN`, `MS`, `ZH`, `TA`, etc. One row per language per name+version. |
| `category` | enum | `MARKETING`, `UTILITY`, `AUTHENTICATION` |
| `body_text` | text | Template body with `{{1}}`, `{{2}}` placeholders |
| `header_json` | jsonb | Optional header (text/image/video/document) |
| `footer_text` | text | nullable |
| `buttons_json` | jsonb | Optional buttons (URL / quick-reply / call) |
| `variables` | text[] | Friendly names for placeholders (e.g. `["customer_name","order_id"]`) |
| `meta_template_id` | text | Returned by Meta on submit |
| `status` | enum | `DRAFT`, `PENDING`, `APPROVED`, `REJECTED`, `DISABLED` |
| `rejection_reason` | text | Populated when status=REJECTED |
| `submitted_at` | timestamptz | nullable |
| `approved_at` | timestamptz | nullable |
| `created_by` | uuid | FK to `users.id` |
| `created_at` | timestamptz | |

Unique index on `(name, version, language)`.

### `blasts`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `name` | text | Human-friendly name |
| `template_name` | text | The logical template group (multi-language) |
| `segment_id` | uuid | nullable FK; OR captured ad-hoc list |
| `recipient_snapshot` | jsonb | Snapshot of contact IDs at scheduling time (so changes to segment don't change a scheduled blast) |
| `variable_mapping` | jsonb | Mapping from `{{1}}` etc. to source fields (e.g. `{1: "contact.name"}`) |
| `scheduled_at` | timestamptz | |
| `status` | enum | `DRAFT`, `SCHEDULED`, `RUNNING`, `COMPLETED`, `FAILED`, `CANCELED` |
| `total_recipients` | int | |
| `created_by` | uuid | FK to `users.id` |
| `created_at` | timestamptz | |
| `started_at` | timestamptz | nullable |
| `completed_at` | timestamptz | nullable |

### `messages`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `blast_id` | uuid | FK |
| `contact_id` | uuid | FK |
| `template_id` | uuid | FK — the specific language version sent |
| `meta_message_id` | text | nullable, set after Meta accepts the send |
| `status` | enum | `QUEUED`, `SENT`, `DELIVERED`, `READ`, `FAILED`, `CANCELED` |
| `error_code` | text | nullable |
| `error_message` | text | nullable |
| `sent_at` | timestamptz | nullable |
| `delivered_at` | timestamptz | nullable |
| `read_at` | timestamptz | nullable |
| `replied_at` | timestamptz | nullable — set when first reply attributed |

Indexes on `blast_id`, `contact_id`, `meta_message_id`, `status`, `sent_at`.

### `message_events`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `message_id` | uuid | nullable FK (null for inbound-only events) |
| `meta_event_type` | text | e.g. `delivered`, `read`, `failed`, `message_template_status_update` |
| `payload_json` | jsonb | Raw webhook payload |
| `received_at` | timestamptz | |

### `inbound_messages`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `contact_id` | uuid | FK (created on-the-fly if first contact) |
| `meta_message_id` | text | |
| `body` | text | |
| `attributed_blast_id` | uuid | nullable FK to `blasts` — null if no recent blast matches |
| `received_at` | timestamptz | |
| `routed_to` | enum | `ANALYTICS`, `CHATBOT`, `NONE` (chatbot is the Phase 2 system) |

### `system_settings`
| Column | Type | Notes |
|---|---|---|
| `key` | text | PK |
| `value` | text | |

Initial keys: `meta_phone_number_id`, `meta_waba_id`, `meta_access_token` (encrypted), `meta_webhook_verify_token`, `current_messaging_tier` (`TIER_1` / `TIER_2` / `TIER_3` / `UNLIMITED`), `reply_attribution_window_days` (default 7), `messages_per_second_limit` (default 80).

## 6. Template Lifecycle

States: `DRAFT` → `PENDING` → `APPROVED` | `REJECTED`. `DISABLED` is reached when Meta later disables an approved template — this happens automatically when the template's quality rating drops too low (high opt-out / block rates). Meta sends a `message_template_quality_update` webhook; NestJS transitions the row to `DISABLED`, and the template stops being usable in new blasts until a new version is submitted and approved.

Transitions:
1. **Draft creation** — marketer composes in UI. Client-side validation enforces Meta's rules (length limits, button counts, no promotional content in UTILITY templates).
2. **Submission** — NestJS POSTs to `/v18.0/{WABA_ID}/message_templates` per language. Each language gets its own `meta_template_id`. All language rows transition to `PENDING`.
3. **Approval/rejection** — Meta webhook `message_template_status_update` arrives per language. NestJS updates the corresponding `templates` row. Languages can have different outcomes.
4. **Rejection handling** — marketer edits and resubmits. A new row is created with `version = previous + 1`. Old rejected row is retained for audit.
5. **Polling fallback** — hourly cron polls Meta for any `templates` row still `PENDING` for > 1 hour, in case a webhook is missed.

## 7. Blast Lifecycle

States: `DRAFT` → `SCHEDULED` → `RUNNING` → `COMPLETED` | `CANCELED` | `FAILED`.

Behavior:
- **Partial failures tolerated** — individual `messages` failures (recipient not on WhatsApp, blocked the number, etc.) are marked `FAILED` and the blast continues with the rest.
- **Cancelable mid-flight** — marketer can cancel a running blast. BullMQ jobs in the queue are drained; already-sent messages remain sent (cannot be unsent). Unsent ones become `CANCELED`.
- **Throttling** — worker honors `messages_per_second_limit` (default 80/sec) and the 24-hour tier cap (counted via Redis sliding window). If a blast would exceed the remaining tier quota, the worker pauses, alerts admin (UI banner), and resumes the next day.

### Language selection per recipient

For multi-language templates, the worker selects the language version per contact:

1. Look up the contact's `language_preference`.
2. Find the matching APPROVED template row in the template's logical group (same `name`, highest `version`, matching `language`).
3. If no matching language version exists or it isn't APPROVED, fall back to the blast's configured **default language** (set at blast creation; defaults to `EN`).
4. If even the default language isn't APPROVED, mark the message `FAILED` with `error_code = NO_APPROVED_LANGUAGE` and continue.

This selection is stored per-row in `messages.template_id` so analytics can break down delivery by language.

### Tier awareness
- Tier 1: 1,000 unique recipients per 24h
- Tier 2: 10,000
- Tier 3: 100,000
- Tier 4: Unlimited

The active tier is stored in `system_settings.current_messaging_tier`. The admin updates it manually when Meta promotes the number (Meta surfaces tier in Business Manager).

## 8. Reply Tracking

- All inbound webhooks land in `inbound_messages`.
- Attribution logic: on inbound arrival, look up sender by `phone_e164`. Find the most recent `messages` row for that contact where status ∈ {`SENT`,`DELIVERED`,`READ`} and `sent_at` falls within `reply_attribution_window_days` (default 7). If found, set `inbound_messages.attributed_blast_id` and `messages.replied_at`.
- Blast detail page shows **Replied: N (X%)** alongside delivery/read counts.
- `/blasts/:id/replies` lists the actual reply messages for marketing review.
- **24-hour customer service window** is surfaced as a per-conversation badge ("window closes in X hours"). Future chatbot must honor this (free-form within 24h, template-only after).

## 9. Admin UI

Pages (React SPA, all under JWT auth):
- `/` — **Dashboard**: KPI cards (total contacts, approved templates, active blasts), recent blasts feed
- `/contacts` — **Contacts list**: searchable, filterable by demographics, "+ Add Contact" + "Import CSV" actions
- `/contacts/segments` — **Segments**: list/create/edit saved segment filters
- `/templates` — **Template library**: color-coded by status, filterable by category and status
- `/templates/new` and `/templates/:id` — **Template editor**: language tabs for multi-language authoring, "Submit to Meta" action
- `/blasts` — **Blast list**
- `/blasts/new` — **Blast wizard** (5 steps: template → audience → variables → schedule → review)
- `/blasts/:id` — **Blast detail / analytics**: KPI cards, time-series chart, recipient list with per-message status, "Export CSV" action
- `/blasts/:id/replies` — **Replies list**
- `/settings` — **System config**: Meta credentials display, tier setting, attribution window, user list with role and add-user form

## 10. Auth Model

- Email + password (bcrypt-hashed).
- JWT access token (short-lived, e.g., 15 min) + refresh token (HTTP-only secure cookie, e.g., 14 days).
- Two roles:
  - **`ADMIN`** — full access including Settings (Meta credentials, user management, tier setting)
  - **`OPERATOR`** — contacts, templates, segments, blasts; no Settings access
- **No public signup**. Admin creates users from Settings → Add User form, providing initial password directly. New user logs in and changes their password.
- **Password reset** is manual: admin sets a new temporary password from Settings → User list → Reset.
- **No email service required** in Phase 1.

## 11. Error Handling & Retries

| Failure | Handling |
|---|---|
| Meta API 429 (rate limit) | BullMQ exponential backoff: 1s → 5s → 30s → 5m, up to 5 retries |
| Meta API 5xx (transient) | Same exponential backoff |
| Meta API 4xx (bad request, deleted template, etc.) | Mark message `FAILED` immediately, no retry. Store `error_code` and `error_message` for surfacing in UI. |
| Worker crash mid-job | BullMQ stalled-job detection re-queues automatically |
| NestJS API crash | Docker auto-restart (and ECS auto-restart in AWS) |
| Webhook signature invalid | Reject 401, log security event |
| Missed webhook (template status) | Hourly cron polls for `PENDING > 1h` templates |
| Missed webhook (message status) | Rely on Meta's 24h webhook retry policy |

## 12. Testing Strategy

- **Unit tests (Jest)** — services, validators, segment-filter evaluators, throttling logic. Target ~70% coverage on business logic.
- **Integration tests (Jest + Docker Postgres)** — request/response through controllers against a real test database. Cover happy path + 1-2 edge cases per endpoint.
- **Worker tests** — mock Meta API with `nock`. Verify throttling, retries, status transitions.
- **E2E smoke (Playwright)** — one critical path: login → create template → schedule blast → see results. Runs in CI before deploy.
- **No DB mocking** — tests hit a real Postgres in Docker.
- **Seed fixtures** — `prisma/seed.ts` creates 1 admin user, 100 sample contacts with mixed demographics, 3 sample templates (APPROVED, PENDING, REJECTED).

## 13. Hosting

### Local development
- All services orchestrated by `docker-compose.yml`: Postgres, Redis, NestJS API (watch mode), Worker, Vite dev server.
- **Public tunnel required for Meta webhooks** — developer runs `ngrok http 3000` or `cloudflared tunnel` to expose the local NestJS port. Tunnel URL is configured in Meta's webhook settings.

### Future AWS deployment
- Docker images pushed to ECR.
- API + Worker as ECS Fargate services.
- Postgres on RDS, Redis on ElastiCache.
- React SPA built as static assets and hosted on S3 + CloudFront.
- Secrets in AWS Secrets Manager; config in environment variables (twelve-factor).
- Singapore region for Malaysian latency.
- Migration effort estimated at 1-2 days because no code refactor required — config swap only.

## 14. WhatsApp Number Setup

- **Phone number**: dedicated new Malaysian prepaid SIM (Maxis/Celcom/Digi/U Mobile) used only for this system. Must not have been used on personal WhatsApp recently.
- **Meta Business Manager** account at `business.facebook.com`.
- **WhatsApp Business Account (WABA)** created under the business.
- Phone number added in WABA settings, verified via SMS/voice code.
- **System User access token** generated for API calls (long-lived).
- **Webhook URL** set to the deployed NestJS endpoint (tunnel URL during dev, public domain in production).
- **First 1,000 conversations/month free**; thereafter Meta bills directly per conversation.

## 15. Forward Compatibility (Phase 2 — Chatbot)

The Python chatbot will be a separate process. Committed integration approach:

- The NestJS webhook handler **publishes every inbound message to a Redis Pub/Sub channel** (`whatsapp:inbound`) immediately after writing the `inbound_messages` row. Phase 1 has no subscriber; Phase 2's Python chatbot subscribes to this channel.
- The chatbot **does not call WhatsApp directly**. To send replies, it calls a NestJS internal endpoint (`POST /internal/outbound-message`) which handles authentication with Meta, enforces the 24-hour window rule, and writes a `messages` row. This keeps WhatsApp credentials in one place.
- The NestJS webhook handler sets `inbound_messages.routed_to`: in Phase 1 always `ANALYTICS`; in Phase 2 it becomes `CHATBOT` whenever the chatbot is enabled (a `system_settings.chatbot_enabled` flag).

This boundary is captured in the data model (`inbound_messages.routed_to`) and the Pub/Sub topic so Phase 2 doesn't require schema or routing changes — only the chatbot subscriber and the `/internal/outbound-message` endpoint need to be added.

## 16. Open Questions / Deferred Decisions

- **Custom domain**: deferred until AWS migration.
- **Backup policy**: deferred (managed DB snapshots sufficient in Phase 1).
- **Activity log / audit trail page**: not in Phase 1; can be added later from `message_events` and DB triggers.
- **PDPA data subject request tooling**: handled by user out-of-band per their decision.
- **Specific BullMQ retry/timeout tuning**: defaults chosen in spec, may need adjustment after first real blast.

---

## Appendix A — Decisions Log

Decisions made during brainstorming, with rationale:

| Decision | Rationale |
|---|---|
| Direct Cloud API (no BSP) | Saves cost, full control, simpler long-term, first 1K conv/month free |
| NestJS over Express / Next.js full-stack | Opinionated structure for a growing system; clean boundary for future Python chatbot |
| React SPA frontend (not Next.js) | Internal admin panel; Next.js's SSR/SEO benefits don't apply; cleaner separation from NestJS backend |
| PostgreSQL over MySQL | JSONB support for flexible `attributes`, native arrays, stronger correctness defaults |
| Direct demographic columns (not all JSONB) | Frequently filtered fields benefit from indexes; segment builder UI maps naturally |
| Store DoB, not age | Age changes; DoB doesn't |
| One row per recipient in `messages` | Enables per-contact analytics without re-querying Meta |
| BullMQ over Temporal / simple cron | Right tool for high-throughput, rate-limited, retryable jobs at this scale |
| 5-second dashboard polling (not WebSocket) | Simpler infra; sufficient at this scale |
| Partial-failure-tolerant blasts | Industry-standard expectation for marketing blasts |
| Local + Docker now, AWS later | Faster Phase 1 iteration; clean migration path designed in |
| Two roles (`ADMIN`, `OPERATOR`) | Small team — granular roles are premature |
| No email service in Phase 1 | YAGNI — admin creates accounts directly |
| Reply attribution window default 7 days | Reasonable for marketing campaigns; configurable |