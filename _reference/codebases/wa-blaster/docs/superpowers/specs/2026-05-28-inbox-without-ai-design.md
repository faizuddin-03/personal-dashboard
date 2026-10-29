# Inbox (without AI) — Design Spec

**Date:** 2026-05-28
**Status:** Draft
**Author:** zhenyang@modefair.com
**Branch:** `feat/inbox` off `master` → PR to `master`
**Tag on merge:** `phase-7-inbox-no-ai-complete`

## Summary

A global, per-contact conversation inbox that lets operators see inbound WhatsApp replies grouped by sender, reply with free-form text inside the 24-hour customer-service window, and manually mark conversations as resolved. This transforms the system from send-only to send-plus-handle-replies. AI-driven tabs (auto-reply, escalation) are stubbed with "Coming Soon" empty states so the future chatbot subsystem can plug in without UI churn.

## Goals

- One screen where an operator can see *every* unresolved customer reply across all blasts.
- Send a free-form text reply inside the 24h CS window without leaving the inbox.
- Track which conversations are still open vs already handled.
- Keep the UI layout aligned with the existing design source (`docs/design/screens/inbox.jsx`) so the future chatbot subsystem only needs to fill in tabs, not change the shell.

## Non-Goals (deferred)

- AI auto-reply and escalation (the `auto-replied` and `escalated` tabs render "Coming Soon" empty states).
- Outbound template send from inside the inbox (operators use the Campaigns flow for re-engagement past 24h).
- Multi-operator assignment, ownership, or read-receipts among operators.
- Per-conversation tags, notes, or knowledge-base links (Tier 3 chatbot feature).
- Notification push to operators' phones / email.
- Conversation search across message bodies (only contact name + phone in v1).

## Decisions

| # | Decision | Choice |
|---|---|---|
| 1 | Outbound capability | Free-form text within 24h CS window. No template send from inbox. |
| 2 | Conversation grouping | One conversation per contact, lifetime. |
| 3 | Resolution model | Hybrid — auto-resolve on outbound, manual "Mark resolved" + "Reopen" buttons. |
| 4 | Tab structure | Keep all 5 design tabs. Auto-replied + Escalated render "Coming Soon". |
| 5 | Branch base | `master` (the frontend reskin is already merged via PRs #5/#6). |

## Data Model

### New table

```prisma
model InboxConversationState {
  contactId       String     @id @map("contact_id") @db.Uuid
  contact         Contact    @relation(fields: [contactId], references: [id], onDelete: Cascade)
  lastInboundAt   DateTime?  @map("last_inbound_at")
  lastOutboundAt  DateTime?  @map("last_outbound_at")
  resolvedAt      DateTime?  @map("resolved_at")
  createdAt       DateTime   @default(now()) @map("created_at")
  updatedAt       DateTime   @updatedAt       @map("updated_at")

  @@index([resolvedAt, lastInboundAt(sort: Desc)])
  @@map("inbox_conversation_state")
}
```

One row per contact that has ever had inbox activity. Lazy upserted on inbound webhook or first outbound from inbox. The composite index makes "open conversations sorted by recency" O(log n) for the most common query.

### Modifications to existing `Message`

```prisma
enum MessageSource {
  BLAST
  INBOX
}

model Message {
  // ... existing fields
  blastId  String?       @map("blast_id") @db.Uuid    // was: required, now nullable
  source   MessageSource @default(BLAST)               // new column
  // ...
}
```

- `blastId` becomes nullable so inbox-originated outbound messages (which don't belong to any blast) live in the same table as blast-originated outbound. One join path for "all messages to/from this contact".
- `source` tags origin for analytics ("don't count INBOX-source outbound in campaign delivery rate").

### State transitions

| Event | Effect on `InboxConversationState` |
|---|---|
| Inbound webhook arrives | Upsert row. Set `lastInboundAt = receivedAt`. Clear `resolvedAt`. |
| Operator sends outbound from inbox | Set `lastOutboundAt = now`. Set `resolvedAt = now` (auto-resolve). |
| Operator clicks "Mark resolved" | Set `resolvedAt = now`. |
| Operator clicks "Reopen" | Clear `resolvedAt`. |

All transitions happen inside a single Prisma transaction with the corresponding `Message` / `InboundMessage` insert.

## API Surface

All endpoints under `/api/inbox`. Require `JwtAuthGuard`. Both `ADMIN` and `OPERATOR` roles accepted (per the design's role matrix).

```
GET    /api/inbox/conversations?tab=all|awaiting|replied|resolved&cursor=<id>&limit=50
GET    /api/inbox/conversations/:contactId
POST   /api/inbox/conversations/:contactId/messages          { body: string }
POST   /api/inbox/conversations/:contactId/resolve
POST   /api/inbox/conversations/:contactId/reopen
GET    /api/inbox/unread-count
```

The two AI tabs (`auto-replied`, `escalated`) are handled entirely client-side — no API call. Tab click renders a "Coming Soon" empty state component.

### Response shapes

**Conversation list item**

```ts
{
  contact:          { id: string, name: string, phone: string },
  lastInboundAt:    string | null,                     // ISO 8601
  lastOutboundAt:   string | null,                     // ISO 8601
  resolvedAt:       string | null,                     // ISO 8601; null = open
  lastPreview:      string,                            // first 100 chars of most recent message
  lastDirection:    "inbound" | "outbound",
  windowExpiresAt:  string | null,                     // lastInboundAt + 24h
  windowOpen:       boolean,                           // derived: now < windowExpiresAt
  attribution:      { blastId: string, blastName: string } | null
}
```

**Thread message**

```ts
{
  id:             string,
  direction:      "inbound" | "outbound",
  body:           string,
  timestamp:      string,                              // ISO 8601
  status?:        "SENT" | "DELIVERED" | "READ" | "FAILED",  // outbound only
  source?:        "BLAST" | "INBOX",                          // outbound only
  blastName?:     string,                                     // outbound BLAST only
  failureReason?: string
}
```

### Pagination

Cursor-based on `GREATEST(lastInboundAt, lastOutboundAt)` descending (most recent activity first). Cursor opaque ID format consistent with the existing Contacts and Templates pagination.

### Tab filters (server-side)

- `all` — `resolvedAt IS NULL`
- `awaiting` — `resolvedAt IS NULL AND (lastOutboundAt IS NULL OR lastInboundAt > lastOutboundAt)`
- `replied` — `resolvedAt IS NULL AND lastOutboundAt > lastInboundAt`
- `resolved` — `resolvedAt IS NOT NULL`

### Send reply validation

```
POST /api/inbox/conversations/:contactId/messages
Body: { body: string }
```

- `400` if `body` is empty, whitespace-only, or > 1024 characters (DTO via `class-validator`)
- `404` if no `InboxConversationState` row exists for `contactId` (contact has never sent inbound — nothing to reply to)
- `409` if `windowOpen === false` at the time the server processes the request:
  ```json
  {
    "error": "window_closed",
    "message": "24h customer-service window has expired. Use a template via Campaigns to re-engage.",
    "windowExpiredAt": "2026-05-27T08:00:00Z"
  }
  ```
- `200` on success — returns the created `ThreadMessage` plus the updated `ConversationListItem` (with new `lastOutboundAt`, `resolvedAt` set)

### Module structure

New `InboxModule` registered in `app.module.ts`. The service has these methods:

```ts
class InboxService {
  listConversations(tab, cursor, limit): Promise<{ items, nextCursor }>
  getConversation(contactId): Promise<{ contact, messages, windowOpen, windowExpiresAt, attribution }>
  sendReply(contactId, body): Promise<{ message, conversation }>
  markResolved(contactId): Promise<ConversationListItem>
  reopen(contactId): Promise<ConversationListItem>
  unreadCount(): Promise<number>
  handleInbound(contactId, receivedAt): Promise<void>  // called by BlastsService on webhook
}
```

### Extension to `WhatsappCloudApiService`

New method:

```ts
async sendFreeFormText(
  recipientPhone: string,
  body: string,
): Promise<{ metaMessageId: string }>
```

Posts to Meta Cloud API with payload `{ messaging_product: "whatsapp", recipient_type: "individual", to, type: "text", text: { body } }`. Honors `WHATSAPP_MOCK_MODE=true` by returning `wamid.mock-{uuid}` without an HTTP call. Reuses the verbose Meta error logging added in Phase 6.

### Webhook integration

`BlastsService.applyInboundMessage` already runs attribution and stamps `messages.repliedAt`. Add one call:

```
Meta webhook → BlastsService.applyInboundMessage()
                ├─ insert InboundMessage          (existing)
                ├─ run attribution                (existing)
                ├─ stamp messages.repliedAt       (existing)
                └─ inboxService.handleInbound()   ← NEW (wrapped in try/catch; webhook stays idempotent)
```

If `handleInbound` throws, the error is logged but the webhook still returns 200 — `InboundMessage` is persisted regardless, so a recovery query can reconstruct inbox state if needed.

## UI / UX

Route: `/inbox` (currently a `ComingSoon` stub — replaced). Deep-link variant: `/inbox/:contactId`.

### Three-pane layout

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Tabs: All · Auto-replied 🔒 · Escalated 🔒 · Awaiting · Replied              │
│  ────────────────────────────────────────────────────────────────────────    │
│                                                                              │
│  ┌─────────────────┐  ┌──────────────────────────┐  ┌──────────────────┐   │
│  │ Search…         │  │   ┌─ Aisyah ─ +6012… ──┐ │  │ Contact          │   │
│  │ ▸ Aisyah   12m  │  │   │ 12h left · Eid promo│ │  │ Aisyah Hashim    │   │
│  │   Daniel   1h   │  │   └─────────────────────┘ │  │ +60 12 345 6789  │   │
│  │   Priya    3h   │  │                          │  │                  │   │
│  │   ...           │  │ [thread of messages,     │  │ Attribution      │   │
│  │                 │  │  inbound left, outbound  │  │ Last blast:      │   │
│  │ [Show resolved] │  │  right, with status]     │  │ "Eid promo 2026" │   │
│  │                 │  │                          │  │                  │   │
│  │                 │  │ ─────────────────────────│  │ [Mark resolved]  │   │
│  │                 │  │ [composer textarea]  Send│  │ [Reopen]         │   │
│  │                 │  │ 312/1024 · 12h left      │  │                  │   │
│  └─────────────────┘  └──────────────────────────┘  └──────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Left pane — conversation list

- Search input filters by contact name OR phone (server-side via `?search=` on the list query).
- One row per conversation: `Avatar` (initials + deterministic color from contact ID), name, last-message preview, relative timestamp, small status pill.
- Selected row gets the existing reskin's left-accent-bar treatment.
- Bottom toggle: "Show resolved" — flips list to `?tab=resolved`.
- Empty state per tab (worded contextually — see Empty States section).

### Center pane — thread

- Header: contact name, phone, window pill (`12h left` green / `Window closed` amber).
- Messages ordered oldest-first.
  - Inbound: left-aligned, neutral background.
  - Outbound BLAST: right-aligned, primary tint, footer shows `{blastName} · {status}`.
  - Outbound INBOX: right-aligned, primary tint, footer shows just `{status}`.
  - Failed messages: red footer with `failureReason`.
- Lazy-load older messages on scroll-up (initial load = most recent 50).
- Composer at bottom:
  - Autosizing `<textarea>` with `0/1024` character counter.
  - Send button enabled only when: body non-empty, body ≤ 1024 chars, AND `windowOpen === true`.
  - `Cmd/Ctrl+Enter` submits.
  - Optimistic update — message appears in thread immediately with `status = SENT`; server response confirms or replaces with FAILED + reason.
  - Composer draft persisted to `sessionStorage` keyed by `contactId`. Cleared on successful send. Switching to a different conversation does NOT clear other drafts — they remain available when the operator returns.
- When `windowOpen === false`, composer is replaced by inline notice: *"24h customer-service window expired ({relative time}). To re-engage, send an approved template via Campaigns."* with a link to `/campaigns/new?contactId={contactId}`.

### Right pane — context

- Contact card: name, phone, tags (if any).
- Attribution: "Reply to: *{blastName}*" with link to that blast detail page. Only shown when `attribution !== null`.
- Action buttons:
  - **Mark resolved** — visible when `resolvedAt === null`. Optimistic update; calls `POST /resolve`.
  - **Reopen** — visible when `resolvedAt !== null`. Calls `POST /reopen`.

### Polling

- Conversation list: 5s (matches Phase 5 `BlastReplies` pattern).
- Active thread: 5s.
- Sidebar badge count: 30s.
- Pauses on `document.hidden` (React Query default).

### Sidebar badge

The existing sidebar "Inbox" link gets a `Pill` showing the unresolved-count number. Hidden when count is 0. Polls `/api/inbox/unread-count`.

### Keyboard shortcuts

Active only when the inbox is the focused page AND the composer is NOT focused (avoid hijacking typing).

| Key | Action |
|---|---|
| `j` / `↓` | Next conversation in list |
| `k` / `↑` | Previous conversation in list |
| `r` | Focus composer |
| `e` | Mark resolved (or Reopen if already resolved) |
| `Esc` | Blur composer / deselect conversation |

(Dropped `a` for "approve" — that was AI-only.)

### Empty states

| Scenario | Message |
|---|---|
| No inbox activity at all | "No conversations yet — they'll appear here when contacts reply to your campaigns." Link to `/campaigns`. |
| Active tab empty | "No {tab name} conversations right now." |
| AI tab clicked (Auto-replied / Escalated) | "Coming Soon — auto-reply and escalation arrive with the chatbot subsystem in a future phase. For now, all replies route to your human inbox." |
| Conversation selected but window closed | Composer area shows the expiry notice (above), thread remains visible. |
| No conversation selected | Center pane shows neutral "Select a conversation to start" placeholder. |

### `data-testid` contracts (for E2E)

- `inbox-tab-{all|auto|esc|awaiting|replied}`
- `inbox-conversation-row-{contactId}`
- `inbox-search`
- `inbox-composer`
- `inbox-send-button`
- `inbox-mark-resolved`
- `inbox-reopen`
- `inbox-window-pill`
- `inbox-show-resolved-toggle`

## File-by-File Scope

### Backend — `apps/api`

**New:**

- `prisma/migrations/<ts>_add_inbox_conversation_state/migration.sql`
- `src/inbox/inbox.module.ts`
- `src/inbox/inbox.controller.ts`
- `src/inbox/inbox.service.ts`
- `src/inbox/dto/list-conversations.query.ts`
- `src/inbox/dto/send-reply.dto.ts`
- `src/inbox/__tests__/inbox.service.spec.ts`
- `src/inbox/__tests__/inbox.controller.spec.ts`

**Modified:**

- `prisma/schema.prisma` — add `InboxConversationState`, `MessageSource` enum, modify `Message.blastId` to nullable + add `source`
- `src/app.module.ts` — register `InboxModule`
- `src/blasts/blasts.module.ts` — import `InboxModule`
- `src/blasts/blasts.service.ts` — call `inboxService.handleInbound()` from `applyInboundMessage` (wrapped in try/catch)
- `src/blasts/__tests__/blasts.service.spec.ts` — assert the handleInbound call happens
- `src/whatsapp/whatsapp-cloud-api.service.ts` — add `sendFreeFormText(phone, body)`
- `src/whatsapp/__tests__/whatsapp-cloud-api.service.spec.ts` — cover the new method (mock + real mode)

### Frontend — `apps/web`

**New:**

- `src/pages/Inbox.tsx` — main page
- `src/pages/inbox/ConversationList.tsx`
- `src/pages/inbox/ConversationThread.tsx`
- `src/pages/inbox/ConversationContext.tsx`
- `src/pages/inbox/Composer.tsx`
- `src/pages/inbox/WindowPill.tsx`
- `src/pages/inbox/EmptyStates.tsx`
- `src/api/inbox.ts` — typed axios client
- `src/hooks/useInboxConversations.ts` — 5s polling
- `src/hooks/useInboxConversation.ts` — 5s polling
- `src/hooks/useInboxUnreadCount.ts` — 30s polling
- `src/hooks/useInboxKeyboardShortcuts.ts`

**Modified:**

- `src/App.tsx` — replace `<ComingSoon title="Inbox" />` with `<Inbox />`; add `/inbox/:contactId` nested route
- `src/components/Sidebar.tsx` — add unread badge to the existing `/inbox` nav item using `useInboxUnreadCount`

### E2E — `e2e`

**New:**

- `tests/inbox.spec.ts` — follows the existing convention of inlining helpers (login + seed) in the test file rather than a shared fixtures directory. Inbound messages are seeded by POSTing a signed payload to `/api/webhooks/meta` (the real ingestion path) — keeps the test honest end-to-end.

### Docs

**New:**

- `docs/superpowers/specs/2026-05-28-inbox-without-ai-design.md` (this file)
- `docs/superpowers/plans/2026-05-28-inbox-without-ai-plan.md` (via writing-plans next)

**Modified:**

- `README.md` — short "Inbox" section under Features

**Totals:** ~21 new files, ~9 modified.

## Testing Strategy

### Unit tests (TDD, Jest)

**`src/inbox/__tests__/inbox.service.spec.ts`** — service against test DB (existing per-test transaction rollback pattern):

- `listConversations`: tab filters correct, ordering by activity DESC, cursor pagination, `limit` capped at 100.
- `getConversation`: messages interleaved by timestamp, both BLAST and INBOX outbound present, `windowExpiresAt` correctly computed, 404 when no state.
- `sendReply`: 404 / 409 / 400 paths, calls `sendFreeFormText` once, inserts `Message(source=INBOX, blastId=null)`, atomically updates `lastOutboundAt` and `resolvedAt`.
- `markResolved` / `reopen`: toggle `resolvedAt`, idempotent.
- `handleInbound`: upserts row, sets `lastInboundAt`, clears `resolvedAt` if previously resolved.
- `unreadCount`: counts `resolvedAt IS NULL`.

**`src/inbox/__tests__/inbox.controller.spec.ts`:**

- 401 without JWT; 403 for unknown roles (sanity).
- Both ADMIN and OPERATOR pass.
- DTO validation: `body` length, `tab` enum, `limit` numeric.

**`src/whatsapp/__tests__/whatsapp-cloud-api.service.spec.ts` (modify):**

- `sendFreeFormText` in mock mode: returns `wamid.mock-*`, no axios call.
- Real mode: posts the correct `type: "text"` payload to the right URL.
- Meta error: throws with verbose error format (matches Phase 6 logging).

**`src/blasts/__tests__/blasts.service.spec.ts` (modify):**

- `applyInboundMessage` calls `inboxService.handleInbound` exactly once with the right args.
- If `handleInbound` throws, `applyInboundMessage` still completes successfully (try/catch wrap).

### E2E tests (Playwright)

Setup pattern: inline `loginAsAdmin` / `loginAsOperator` helpers (matches `blasts.spec.ts`), plus an inline `seedInboundMessage(contactId, body, receivedAt?)` helper that POSTs a signed payload to `/api/webhooks/meta`. Using the real webhook path exercises the full ingestion → attribution → inbox-state-upsert chain in each test.

`e2e/tests/inbox.spec.ts`:

1. Empty inbox → "No conversations yet" empty state with campaigns link.
2. Seed inbound → conversation appears in `Awaiting reply` with correct preview and time.
3. Send reply → conversation moves to `Replied`, message in thread, auto-resolved (visible under "Show resolved").
4. Window closed (seed `receivedAt = now - 25h`) → composer disabled, expiry notice shown.
5. Mark resolved manually → conversation leaves active list, visible via Show resolved.
6. Reopen → returns to active list.
7. AI tabs clicked → "Coming Soon" empty state, no API request fired.
8. Sidebar badge: 0 → seed 2 inbound → badge shows `2` within polling window → resolve one → `1` → resolve other → hidden.
9. Polling: another session seeds inbound, first session shows it within ~5s without reload.
10. Operator role: all flows work the same as admin (no 403s).

### Performance check (one-off)

After seeding 1,000 inbox conversations, run `EXPLAIN ANALYZE` on the list query for each tab. Confirm the `(resolvedAt, lastInboundAt DESC)` index is used and queries return in <50ms. Adjust the index if not.

### Out of scope

- Webhook signature verification (already tested in Phase 5).
- Meta API error response handling (already tested in `whatsapp-cloud-api.service.spec.ts`).
- AI tab behavior beyond rendering the Coming Soon empty state.

## Rollout & Migration

### Forward migration

Single Prisma migration, four DDL ops in order:

1. `CREATE TYPE "MessageSource" AS ENUM ('BLAST', 'INBOX');`
2. `ALTER TABLE messages ADD COLUMN source "MessageSource" NOT NULL DEFAULT 'BLAST';`
3. `ALTER TABLE messages ALTER COLUMN blast_id DROP NOT NULL;`
4. `CREATE TABLE inbox_conversation_state (...)` with PK on `contact_id`, FK with `ON DELETE CASCADE` to `contacts(id)`, and composite index `(resolved_at, last_inbound_at DESC)`.

### Backfill (same migration file)

```sql
INSERT INTO inbox_conversation_state
  (contact_id, last_inbound_at, last_outbound_at, resolved_at, created_at, updated_at)
SELECT
  inbound.contact_id,
  MAX(inbound.received_at)                              AS last_inbound_at,
  (SELECT MAX(m.sent_at) FROM messages m
     WHERE m.contact_id = inbound.contact_id
       AND m.status IN ('SENT','DELIVERED','READ'))      AS last_outbound_at,
  NULL                                                   AS resolved_at,
  NOW(), NOW()
FROM inbound_messages inbound
GROUP BY inbound.contact_id;
```

All pre-existing inbound conversations show as open on day one — operators see the full backlog.

### Rollback (manual, operator-run)

Prisma's generated `down` is insufficient; document this sequence:

1. `DROP TABLE inbox_conversation_state;`
2. `DELETE FROM messages WHERE source = 'INBOX';` (clears the only rows with NULL `blast_id`)
3. `ALTER TABLE messages ALTER COLUMN blast_id SET NOT NULL;`
4. `ALTER TABLE messages DROP COLUMN source;`
5. `DROP TYPE "MessageSource";`

### Deployment sequence

1. Merge PR `feat/inbox` → `master`.
2. Pull master on the host.
3. `pnpm install` — no new top-level deps in this feature, but safe to run.
4. `pnpm db:migrate` — applies migration + backfill.
5. Restart API + worker + web.
6. Tag the merge commit `phase-7-inbox-no-ai-complete`.

### No feature flag

Single-tenant pre-prod. The "Coming Soon" empty states on AI tabs are the only feature-flag-style indirection needed.

### No background jobs

24h window expiry is derived on read. No scheduler tick or auto-archive job in v1.

### Pricing safety

Free-form replies inside the 24h CS window are free under Meta's pricing (customer-initiated). The UI prevents sending past 24h — the only out-of-window path is the existing Campaigns/template flow, which already has cost awareness.

### PII / GDPR

No new PII surface (data already in the database). The `Contact → InboxConversationState` FK with `ON DELETE CASCADE` ensures the GDPR contact-delete flow also clears inbox state. Existing cascades on `inbound_messages` and `messages` are intact.

### Risks & mitigations

| Risk | Mitigation |
|---|---|
| Operator sends reply right as window closes (race) | Server re-checks `windowOpen` inside the transaction; returns 409 if expired by ms. Client shows toast and refreshes thread. |
| Backfill produces incorrect `last_outbound_at` | Backfill filters on `status IN ('SENT','DELIVERED','READ')` — same statuses the existing attribution uses. |
| `handleInbound` throws inside the webhook | Wrapped in try/catch; structured error log; webhook still 200s to Meta. `InboundMessage` is persisted regardless. |
| Composer draft lost on accidental tab close | Persist per-contact draft in `sessionStorage` (~15 LoC). |
| Concurrent operators editing the same conversation | Out of scope for v1 (small team, low concurrency). Last-writer wins on `resolvedAt`. Revisit if it becomes a problem. |

## Open Questions

None — all scope decisions are recorded in the Decisions section above.

## Acceptance Criteria

Feature is complete when:

1. All unit tests pass (`pnpm --filter api test`).
2. All E2E scenarios listed above pass (`pnpm e2e`).
3. Performance check: list queries <50ms with 1,000 conversations seeded.
4. Empty `/inbox` route shows the empty state (not a crash).
5. Inbound webhook → conversation appears in inbox within 5s.
6. Operator can send a free-form reply, receive a `wamid.mock-*` (mock mode) or real `wamid.HBg...` (real mode), and see auto-resolve happen.
7. Window-closed conversation prevents send and points to Campaigns.
8. Manual Mark resolved / Reopen flows work and are reflected in the sidebar badge.
9. AI tabs render "Coming Soon" without firing API requests.
10. Migration applies cleanly on a fresh DB and on a DB with existing Phase 5 inbound data (backfill populates state).
