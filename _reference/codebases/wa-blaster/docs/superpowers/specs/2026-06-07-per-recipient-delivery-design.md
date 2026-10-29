# Per-Recipient Campaign Delivery + Retry — Design Spec

**Date:** 2026-06-07
**Author:** Soon Zhen Yang (with Claude)
**Status:** Draft — awaiting spec review
**Context:** Hackathon. eAuto dealer + AI console (`apps/web` + `apps/api`). Slice C of the remaining-work roadmap (after Real Analytics, merged via PR #16).

---

## 1. Purpose

`CampaignDetail.tsx` shows aggregate KPIs + a delivery funnel, but the **Recipients** card (`CampaignDetail.tsx:311-325`) is a placeholder: *"Per-recipient delivery status is not yet available via the API — coming soon."* There is no endpoint to list a blast's individual messages, and no way to retry a message that failed to send.

`Message` rows already carry everything needed — `status`, `errorCode`/`errorMessage` (set on failure in `blasts.service.ts:288-291` and `blast.processor.ts:118`), and the `sentAt`/`deliveredAt`/`readAt`/`repliedAt` timestamps. This slice surfaces them as a real, paginated, filterable per-recipient table with per-row and bulk **Retry** for failures.

### Decisions taken into this spec (from brainstorming)

- **Retry scope:** per-row Retry on FAILED rows **plus** a "Retry all failed" bulk action.
- **Demo data:** add ~3–4% FAILED messages (with realistic WhatsApp error codes) to the existing `seed-analytics.ts` generator so the table + retry are demoable on seeded data.
- **Module placement:** extend the existing `blasts` module/controller (where `stats`/`cancel` live), not a new module.
- **List query technique:** Prisma `findMany` + a separate `contact.findMany` merged in JS (no `Message→Contact` relation exists) — unit-testable with mocked Prisma, consistent with the analytics endpoints. (Raw-SQL join rejected: harder to unit-test in this jest setup.)
- **Retry & blast status:** retry does NOT mutate the blast's status. The `BlastProcessor`'s existing "no QUEUED remain → COMPLETED" check re-fires harmlessly. This avoids a stuck-`RUNNING` state when a retry fails again.
- **Retry transport:** retry uses the normal send path, so it follows `WHATSAPP_MOCK_MODE` (mock in dev, live when configured) — no special-casing.

---

## 2. Scope

### In scope

1. **`GET /blasts/:id/messages`** — paginated, status-filterable per-recipient list with contact name/phone, status, error, and delivery timestamps.
2. **`POST /blasts/:id/messages/:messageId/retry`** — re-enqueue one FAILED message.
3. **`POST /blasts/:id/retry-failed`** — re-enqueue all FAILED messages in the blast.
4. **Frontend:** replace the Recipients placeholder in `CampaignDetail.tsx` with a real table (status filter, pagination, per-row Retry, "Retry all failed"); typed client fns in `api/blasts.ts`.
5. **Demo data:** ~3–4% FAILED messages in `seed-analytics.ts`.
6. **Tests:** API unit tests (mocked Prisma + queue) for list + both retry paths; a Playwright spec (run deferred — needs DB/servers).

### Out of scope (deferred)

- Pause/resume, reschedule, send-now, duplicate, rename, archive/delete, the campaign-row ⋯ menu (separate roadmap items).
- CSV export of recipients (slice G).
- Live-WhatsApp going-live decisions / rate-limit tuning (retry just reuses the existing send path + tier limiter).
- Changing the blast lifecycle/state machine beyond what retry needs.

---

## 3. Architecture

Three units, each independently testable:

```
┌───────────────────────────────┐     ┌─────────────────────────────┐
│ BlastsController (extended)    │────▶│ BlastsService (extended)    │
│  GET  :id/messages             │     │  listMessages()             │
│  POST :id/messages/:mid/retry  │     │  retryMessage()             │
│  POST :id/retry-failed         │     │  retryFailed()              │
└───────────────────────────────┘     └─────┬───────────────┬───────┘
                                             │ Prisma        │ BullMQ queue.add
                                             ▼               ▼
                                       messages+contacts   BlastProcessor (unchanged)
┌───────────────────────────────┐
│ CampaignDetail.tsx             │  RecipientsTable: filter + pagination + retry
│ api/blasts.ts (client fns)     │  polls while active OR a row is QUEUED
└───────────────────────────────┘
```

### 3.1 `GET /blasts/:id/messages`

**DTO** (`ListBlastMessagesDto`): `status?: MessageStatus` (`@IsOptional @IsEnum`), `page?: number` (default 1, `@IsInt @Min(1)`, `@Type(() => Number)`), `pageSize?: number` (default 25, max 100).

**Service `listMessages(blastId, dto)`:**
1. `findOne(blastId)` (404 if missing).
2. `where = { blastId, ...(dto.status ? { status: dto.status } : {}) }`.
3. `total = message.count({ where })`.
4. `rows = message.findMany({ where, orderBy: [{ sentAt: { sort: 'desc', nulls: 'last' } }, { id: 'asc' }], skip: (page-1)*pageSize, take: pageSize, select: { id, contactId, status, errorCode, errorMessage, sentAt, deliveredAt, readAt, repliedAt } })`.
5. `contacts = contact.findMany({ where: { id: { in: [...distinct contactIds] } }, select: { id, name, phoneE164 } })`; build a map.
6. Map each row → `RecipientRow`.

**Response:**
```ts
{ items: RecipientRow[]; total: number; page: number; pageSize: number }
// RecipientRow = {
//   id: string; contactName: string | null; contactPhone: string;
//   status: MessageStatus; errorCode: string | null; errorMessage: string | null;
//   sentAt: string | null; deliveredAt: string | null; readAt: string | null; repliedAt: string | null;
// }
```
(`Message` has no `createdAt`, so ordering keys off `sentAt`; QUEUED/CANCELED rows with null `sentAt` sort last, then by `id` for determinism.)

### 3.2 `POST /blasts/:id/messages/:messageId/retry`

**Service `retryMessage(blastId, messageId)`:**
1. `msg = message.findUnique({ where: { id: messageId } })`; if `!msg || msg.blastId !== blastId` → `NotFoundException`.
2. If `msg.status !== 'FAILED'` → `BadRequestException('Only failed messages can be retried')`.
3. `update`: `{ status: 'QUEUED', errorCode: null, errorMessage: null, metaMessageId: null }`.
4. `queue.add(BLAST_QUEUE, { messageId }, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } })`.
5. Return the updated `RecipientRow` (re-fetch contact for the row, or return the message; the UI optimistically shows QUEUED).

The blast's `status` is left unchanged.

### 3.3 `POST /blasts/:id/retry-failed`

**Service `retryFailed(blastId)`:**
1. `findOne(blastId)` (404 if missing).
2. `failed = message.findMany({ where: { blastId, status: 'FAILED' }, select: { id: true } })`.
3. If empty → `{ retried: 0 }`.
4. `message.updateMany({ where: { blastId, status: 'FAILED' }, data: { status: 'QUEUED', errorCode: null, errorMessage: null, metaMessageId: null } })`.
5. For each failed id: `queue.add(...)` (same options as 3.2).
6. Return `{ retried: failed.length }`.

### 3.4 Frontend — `CampaignDetail.tsx` Recipients table

Replace the placeholder card (`:311-325`) with a `RecipientsTable` section:
- **Status filter chips:** All · Failed · Delivered · Read · Sent · Queued (each sets the `status` param; "All" clears it). Resets `page` to 1 on change.
- **Table:** columns — Recipient (name + monospace phone), Status (badge reusing the existing status palette), Detail (error code + message for FAILED rows; em-dash otherwise), Sent / Delivered / Read times (compact).
- **Per-row Retry:** a small button on FAILED rows → `retryBlastMessage`; optimistic/loading state; on success invalidate the messages + stats queries.
- **Retry all failed:** a header button shown when the current data contains failures (or always, disabled when none) → `retryFailedMessages`; shows the returned count via toast.
- **Pagination:** prev/next + "page X of Y" using `total`/`pageSize` (reuse the existing `Pagination` component if suitable).
- **Polling:** the messages query uses `refetchInterval` that fires (5s) when the blast is `SCHEDULED`/`RUNNING` **or** any row on the current page is `QUEUED` — so a retry-in-flight on a COMPLETED blast updates live.

**`api/blasts.ts` additions:** `BlastMessage`/`BlastMessagesPage` types; `listBlastMessages(id, { status?, page?, pageSize? })`; `retryBlastMessage(id, messageId)`; `retryFailedMessages(id)`.

### 3.5 Demo data — `seed-analytics.ts`

In the message-generation loop, after the delivered/read/replied funnel, mark a small share (~3–4%) of messages `FAILED` instead: `status: 'FAILED'`, `sentAt` set (attempt happened), `deliveredAt/readAt/repliedAt: null`, and an `errorCode`/`errorMessage` drawn from a small realistic set:
- `131026` — "Message undeliverable"
- `131047` — "Re-engagement message (24h window closed)"
- `132000` — "Template parameter count mismatch"
- `470` — "Message failed to send (re-engagement)"

Deterministic via the existing LCG. This makes the table show mixed statuses and the retry flow demoable. Keep idempotency intact (still guarded by the existing `message.count() > 0` check).

---

## 4. Data flow

1. User opens a campaign → `CampaignDetail` fetches blast + stats (existing) + the new messages page.
2. `listMessages` returns the page joined with contact name/phone.
3. User filters by status / pages → re-keyed query refetches.
4. User clicks **Retry** (row) or **Retry all failed** → POST → message(s) reset to QUEUED + enqueued → `BlastProcessor` sends (mock/live per env) → status transitions to SENT/FAILED, webhooks update DELIVERED/READ.
5. The messages query polls while any row is QUEUED, so the row updates from QUEUED → SENT/FAILED without a manual refresh.

---

## 5. Error / empty / loading

- **Auth:** all routes behind `JwtAuthGuard` (controller-level).
- **Missing blast / message:** 404. **Retry on non-FAILED:** 400 (`Only failed messages can be retried`).
- **Empty blast / filtered-empty page:** `{ items: [], total: 0 }`; the table shows a friendly empty row, never crashes.
- **Retry failure:** the message returns to `FAILED` (processor catch path); the row reflects it after the next poll. A failed retry never leaves the blast stuck.
- **Loading:** table shows a "Loading…" state; retry buttons show a pending state and are disabled while in flight.

---

## 6. Testing strategy

- **API unit** (`blasts.service.spec.ts` or a focused new spec, mocked Prisma + mocked `queue`, mirroring the existing `BlastsService` test construction):
  - `listMessages`: builds `where` with/without `status`; paginates (skip/take); merges contact name/phone; returns `{ items, total, page, pageSize }`.
  - `retryMessage`: non-FAILED → `BadRequestException`; wrong-blast/missing → `NotFoundException`; FAILED → resets fields + `queue.add` called once with `{ messageId }`.
  - `retryFailed`: resets all FAILED + enqueues N; returns `{ retried: N }`; returns `{ retried: 0 }` + no enqueue when none.
- **Generator:** the FAILED branch keeps the seed deterministic + idempotent; produces a non-zero FAILED count.
- **E2E** (`e2e/tests/campaign-recipients.spec.ts`, Playwright; run **deferred** — needs Postgres + dev servers): open a seeded completed campaign, assert the recipients table renders rows, filter to Failed shows failures, a Retry button is present on a failed row. Follows the existing `loginAsAdmin` local-helper convention.

---

## 7. File-by-file change list

**API (edit):**
- `apps/api/src/blasts/blasts.controller.ts` — 3 new routes.
- `apps/api/src/blasts/blasts.service.ts` — `listMessages`, `retryMessage`, `retryFailed`.
- `apps/api/src/blasts/dto/list-blast-messages.dto.ts` — **new** DTO.
- `apps/api/src/blasts/__tests__/blasts.service.spec.ts` — new tests (or a new `*.spec.ts`).
- `apps/api/prisma/seed-analytics.ts` — ~3–4% FAILED messages.

**Web (edit):**
- `apps/web/src/api/blasts.ts` — `BlastMessage`/`BlastMessagesPage` types + 3 client fns.
- `apps/web/src/pages/CampaignDetail.tsx` — replace Recipients placeholder with the table + retry actions + polling.

**E2E (new):**
- `e2e/tests/campaign-recipients.spec.ts`.

---

## 8. Sequencing (for the implementation plan)

1. `ListBlastMessagesDto` + `listMessages` service + `GET :id/messages` route + unit test.
2. `retryMessage` service + `POST :id/messages/:mid/retry` route + unit tests (guards).
3. `retryFailed` service + `POST :id/retry-failed` route + unit test.
4. Demo-generator FAILED messages.
5. `api/blasts.ts` client fns + types.
6. `CampaignDetail.tsx` recipients table (filter + pagination + per-row retry + retry-all + polling).
7. E2E spec.

Backend-first (1–4) so the table has real endpoints + seeded failures to render; then the client (5) and UI (6); e2e last (7).

---

## 9. Open questions / risks

1. **Retry job attempts:** `attempts: 3` with exponential backoff balances transient-failure recovery against predictability for a manual action. (Original blast jobs use `attempts: 5`.) Acceptable; tune later.
2. **Ordering with null `sentAt`:** Prisma `nulls: 'last'` is Postgres-supported; QUEUED/CANCELED rows sort after sent ones. Fine.
3. **Retry-all on a huge blast:** enqueues one job per FAILED message in a loop. For demo scale (thousands max) this is fine; a very large blast could enqueue many jobs — acceptable for now, bounded by the tier rate-limiter at send time.
4. **COMPLETED blast + in-flight retry:** the blast shows COMPLETED while a retried message is QUEUED/SENDING; the table polls on the QUEUED row so it still updates. Status briefly "lags" the row — acceptable and avoids the stuck-RUNNING failure mode.
