# Fix Reply-Quote Regression — Persist Inbound at Webhook Receipt

**Date:** 2026-06-18
**Branch:** `feat/ai-chatbot` (push, no PR)
**Status:** Approved — proceeding to implementation plan

## Problem (regression, root-caused)

The chatbot's **conditional reply-quoting** stopped working: in a rapid multi-question burst, the bot's
auto-replies no longer quote the question they answer (so when several answers come back, the customer
can't tell which answer maps to which question). A single question answered directly still — correctly —
shows no quote.

### Root cause (git-confirmed)

- `5dcece8` *"quote the original question only when a reply is out of order"* added
  `ConversationService.hasActivityAfterInbound`, which quotes a reply iff some inbound/outbound row has a
  `createdAt` **strictly later** than the inbound being answered (`conversation.service.ts:121`). Ordering
  by `createdAt` was deliberate ("immune to Meta-timestamp backdating"). **This worked at the time.**
- `ce5558f` *"fast-ack webhook, process inbound on a worker queue"* — a **descendant** of `5dcece8` —
  changed `webhook.controller.ts` from `await chatbot.handleInbound(...)` (synchronous, which persisted the
  `ConversationInboundMessage` **at receipt**) to `await chatbotInboundQueue.add(...)` (enqueue only). It did
  **not** touch the quote code.

After fast-ack, the inbound row is created inside the **worker** at processing time
(`chatbot.service.ts:76` → `conversations.handleInbound`), and the worker is **sequential** (BullMQ default
concurrency 1, `chatbot-inbound.processor.ts`). So each message is *created → answered* within one job,
**before the next message's job persists its row**. When message N is answered, message N+1 doesn't exist
in the DB yet, and message N is itself the newest row → `hasActivityAfterInbound(N)` is false → no quote.
The condition is now structurally unsatisfiable on the normal path.

Before fast-ack it worked because rapid messages arrive as separate concurrent webhooks, each persisting
its inbound at receipt; by the time the (slow) reply to an earlier message was composed, the later
siblings were already in the DB with later `createdAt`.

### Why it slipped through

The unit test for `hasActivityAfterInbound` inserts rows directly and tests the function in isolation. It
can't observe the worker-timing interaction, so it stayed green through the regression.

## Goal

Restore the intended behavior — **single question → clean reply (no quote); rapid multi-question burst →
each reply quotes the question it answers** — without giving up the fast-ack property (the webhook never
blocks on the LLM).

## Non-goals

- No change to `hasActivityAfterInbound`'s logic or its `createdAt` ordering (it's correct once the
  precondition is restored).
- No change to the slow pipeline (classify → RAG → draft → send) staying in the worker.
- No change to the autopilot/blast inbound path.

## Approach

**Persist the chatbot inbound row at webhook *receipt* again (fast, idempotent DB write — mirroring the
autopilot path's `blasts.applyInboundMessage`), and make `handleInbound` idempotent on `metaMessageId` so
the worker's existing call finds that receipt-row instead of inserting a new processing-time one.** With the
row created at receipt, `createdAt` is once more ≈ arrival order (sub-second, monotonic), so the existing
quote logic works unchanged — and the worker/queue contract is untouched.

Rejected alternatives: switching `hasActivityAfterInbound` to `receivedAt` — doesn't help alone (a later
sibling still isn't persisted when an earlier message is processed) and `receivedAt` is only
second-resolution (ties on bursts). Persisting at receipt + keeping `createdAt` is both sufficient and
finer-grained.

## Components

### 1. `ConversationService.handleInbound` → idempotent on `metaMessageId`
Meta redelivers webhooks, so persisting at receipt must tolerate a duplicate `metaMessageId`. If a
`ConversationInboundMessage` with that `metaMessageId` already exists, return the existing
`{conversation, inboundMessage}` instead of `create` (which throws on the `@unique`). This is true
idempotency, complementing the in-flight `jobId=wamid` dedup. Window refresh on a duplicate is a no-op
(or harmlessly re-applied).

### 2. Webhook (`webhook.controller.ts`) — persist then enqueue
In the chatbot block, for each message, do the **fast synchronous DB work** before enqueueing:
- Apply the existing guards here so non-deliverable messages are never persisted/enqueued: skip non-text
  (`msg.type !== 'text'`), skip unknown contact (no `Contact` for the phone).
- `const { conversation, inboundMessage } = await conversations.handleInbound({ contactId, metaMessageId:
  msg.id, body, receivedAt, rawJson })` (idempotent).
- Enqueue `{ contacts, message, conversationId, inboundMessageId }` with the existing options (jobId=wamid,
  attempts, backoff).
- A persist **or** enqueue failure is caught and logged and never fails the webhook (same contract as the
  autopilot path; Meta redelivers).

Dependency change: `WhatsappModule` imports `ConversationsModule` (+ a way to look up `Contact` by phone —
`PrismaService` is already app-global). This re-introduces a **narrow** dependency (persistence only — not
`ChatbotService`/LLM), so fast-ack's "no slow work in the webhook" property is preserved. **(User-approved.)**

### 3. Worker, job payload, processor — UNCHANGED
Because `handleInbound` is now idempotent on `metaMessageId`, the worker keeps calling
`conversations.handleInbound(...)` exactly as today — but that call now **finds the row the webhook
already created** and returns it with its receipt-time `createdAt`, instead of inserting a new
processing-time row. So:
- `ChatbotInboundPayload` / `ChatbotInboundJobPayload` are **not** changed (still `{ contacts, message }`).
- `ChatbotService.handleInbound` and `ChatbotInboundProcessor` are **not** changed.
- Direct callers that bypass the webhook — the CLI sim / `grade-bm-eval.ts` (`sim.command.ts` →
  `chatbot.handleInbound`) — have no prior receipt-persist, so their idempotent `handleInbound` call simply
  creates the row itself (single message → no sibling → no quote; behavior unchanged).

This makes the change additive (idempotency guard + webhook persist) with zero edits to the worker/queue
contract, and it can't regress the sim/eval path I rely on for the reranker work.

## Data flow (after fix)

```
Meta webhook (per message)
  → verify signature
  → [chatbot block] skip non-text / unknown contact
  → conversations.handleInbound(...)          ← PERSIST at receipt (idempotent); createdAt ≈ arrival
  → chatbotInboundQueue.add({ contacts, message }, {jobId: wamid})   ← payload unchanged
  → 200 { received: true }                     ← still fast (one indexed insert, no LLM)
        … worker (sequential) …
  → ChatbotService.handleInbound(payload)      ← conversations.handleInbound FINDS the receipt row (idempotent); no new row
  → decide → send(reply, quoteWamid)           ← hasActivityAfterInbound now sees receipt-time siblings
```

## Error handling / idempotency

Three layers, unchanged in spirit: `jobId=wamid` (no duplicate job for an in-flight redelivery) +
**idempotent `handleInbound`** (redelivery after the job was removed no longer throws) + the decision
engine's `receivedAt` staleness guard (a genuinely stale redelivery is dropped before replying). Webhook
persist/enqueue failures never fail the webhook.

## Testing

- **Regression test (the gap that let this through):** an integration-style test that drives **two**
  inbounds through the worker path with the row persisted at receipt for both, and asserts the **first**
  reply is sent with a `quoteWamid` (and a lone inbound is sent **without** one). This must FAIL on the
  current code and PASS after the fix.
- **Idempotency unit test:** `ConversationService.handleInbound` called twice with the same `metaMessageId`
  returns the same inbound row and does not throw.
- **Webhook spec:** assert the chatbot block persists at receipt (calls `conversations.handleInbound`) then
  enqueues the unchanged `{ contacts, message }` payload, and that a non-text / unknown-contact message is
  neither persisted nor enqueued.
- **Manual confirmation** (Ollama tunnel up): replay a two-question burst in the sim or live and confirm the
  first answer quotes.

## Rollout

Pure behavior fix, no new flag. Lands on `feat/ai-chatbot`; the live Mac Studio build picks it up on next
deploy. No data migration (schema unchanged).
