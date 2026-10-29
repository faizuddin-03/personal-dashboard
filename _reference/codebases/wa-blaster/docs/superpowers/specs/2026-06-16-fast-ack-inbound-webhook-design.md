# Fast-ack webhook + async chatbot inbound processing

- **Date:** 2026-06-16
- **Status:** Approved (design) — pending implementation plan
- **Branch:** `feat/ai-chatbot`

## Problem

`apps/api/src/whatsapp/webhook.controller.ts` processes inbound WhatsApp messages **synchronously**: the `receive()` POST handler `await`s the full chatbot pipeline (`this.chatbot.handleInbound(...)` → classify + RAG retrieve + draft + send) before returning `200` to Meta. That pipeline takes several seconds — sometimes much longer when the local Ollama LLM is slow.

Meta expects a prompt `200`. If the handler is slow Meta marks the delivery failed and **retries the webhook** (redelivery), which is the upstream cause of duplicate/late processing. A staleness guard already drops stale redeliveries (commit `04b544d`), so this is **hygiene, not correctness-critical** — but the slow ack is the root trigger and should be fixed.

### Root cause (confirmed in code)

`webhook.controller.ts` `receive()` runs everything inline before `return { received: true }`:

- `templates.applyMetaTemplateUpdate` (fast, DB)
- `blasts.applyMetaMessageEvent` per status (fast, DB)
- `blasts.applyInboundMessage` per inbound (fast, DB; **dedup gate**) → `autopilot.handleInbound(stored)` (LLM when enabled)
- `chatbot.handleInbound({ contacts, message })` per inbound (**LLM: classify → RAG → draft → send**, seconds+)

The slow part is `chatbot.handleInbound`. The HTTP response is blocked on it.

## Goal & success criteria

- The webhook returns `{ received: true }` (`200`) **immediately** after signature verification + the fast synchronous DB work + enqueuing — never blocked on the LLM.
- `chatbot.handleInbound` runs on a background **BullMQ queue + worker** (the `start:worker` process), mirroring the existing `CaptureProcessor`.
- **Preserved invariants:**
  - Signature verification stays **before** the ack.
  - `meta_message_id @unique` idempotency — a redelivery during processing does **not** double-send.
  - Per-message error isolation — one failure must not fail the batch or the webhook.
- Tests cover the controller (acks fast, enqueues, doesn't double-enqueue) and the new processor.

## Non-goals (scope guard / YAGNI)

- **Autopilot path stays synchronous.** It's the older parallel system, returns immediately when disabled (a settings check, no LLM), and would otherwise drag `AutopilotModule`'s `WhatsappModule`/`Auth`/`Tickets`/controller graph into the worker for a dormant path. (If autopilot is ever enabled, a parallel `autopilot-inbound` queue is added the same way — out of scope here.)
- No DB schema changes.
- No change to `chatbot.handleInbound`'s internals, the decision engine, the staleness guard, or the WhatsApp send.
- No `setImmediate`/in-process-event mechanism — the repo standard is BullMQ + the worker process (`CaptureProcessor`), and the user selected the worker-process model.

## Design

`applyInboundMessage`, status events, and template updates are all fast non-LLM DB work and **stay synchronous** (before the ack). Only the LLM-bound `chatbot.handleInbound` moves to the queue.

### Data flow (new `receive()`)

1. Verify signature (unchanged; rejects before any side effect).
2. Per `entry` → per `change`:
   - `message_template_status_update` → `templates.applyMetaTemplateUpdate` (sync).
   - `messages`:
     - statuses → `blasts.applyMetaMessageEvent` (sync).
     - inbound → `blasts.applyInboundMessage(inbound)` (sync; **autopilot path unchanged** — still `await autopilot.handleInbound(stored)` when `stored` is non-null, wrapped in its existing try/catch).
     - if `CHATBOT_ENABLED === 'true'`: **enqueue** `{ contacts, message }` to the `chatbot-inbound` queue with `jobId = message.id`. The enqueue is wrapped per-message in try/catch (a Redis hiccup is logged; the webhook still acks).
3. `return { received: true }`.

The controller **no longer injects `ChatbotService`** — it injects the queue. The chatbot stack stops instantiating in the API process.

### Idempotency — three layers (no double-send on redelivery)

1. **`jobId = wamid`.** A redelivery while the first job is queued/active/recently-completed is a no-op `add()` — no duplicate job is created.
2. **`ConversationInboundMessage.metaMessageId @unique`.** `conversations.handleInbound` does a plain `create`, which **throws** on a duplicate, aborting `handleInbound` before any send. This is the permanent backstop if a job ever re-runs after the `jobId` retention window.
3. **Staleness guard** (`decision-engine.service.ts:71-74`, keyed off `receivedAt` vs `max_inbound_age_minutes`, default 10). Moves with `handleInbound` automatically — a redelivery older than the cutoff resolves to `ignore_stale` (no send).

`applyInboundMessage` staying synchronous additionally preserves the **autopilot** path's idempotency exactly: it returns `null` on a redelivery (`InboundMessage.metaMessageId @unique`), so autopilot isn't re-invoked.

### Error isolation & retries

- One message = one job ⇒ per-message isolation is structural. A failed job can't fail sibling jobs, and nothing can fail the webhook (it already acked).
- **Processor mirrors `CaptureProcessor`:** does not swallow errors — lets them propagate so BullMQ records the failure and retries (`attempts: 3`, exponential backoff, `delay: 5000`). This is **send-safe**: a retry re-enters `handleInbound`, hits the `ConversationInboundMessage` unique-constraint `create`, and throws *before* sending again. LLM/embedding outages already resolve to `ignore_*` decisions (not throws), so retries only fire on genuine infra blips — exactly when a retry helps.
- **Deviation from capture (justified):** the inbound queue is high-frequency, so it sets `removeOnComplete: { age: 3600, count: 1000 }` and `removeOnFail: { age: 86400, count: 5000 }` rather than retaining every job forever. The 1h completed-retention comfortably exceeds Meta's realistic redelivery burst and the 10-min staleness cutoff, so the `jobId` dedup window stays effective while Redis growth is bounded.

### Components (new, mirroring `chatbot/capture/`)

- **`apps/api/src/chatbot/inbound/chatbot-inbound.queue.ts`** — canonical queue name + payload contract:
  ```ts
  export const CHATBOT_INBOUND_QUEUE = 'chatbot-inbound';
  export type ChatbotInboundJobPayload = ChatbotInboundPayload; // { contacts, message } from chatbot.service
  ```
- **`apps/api/src/chatbot/inbound/chatbot-inbound.processor.ts`** — `ChatbotInboundProcessor extends WorkerHost`, `@Processor(CHATBOT_INBOUND_QUEUE)`, injects `ChatbotService`, `process(job)` → `this.chatbot.handleInbound(job.data)`; structured log line per job; errors propagate (BullMQ retry).
- **`apps/api/src/chatbot/inbound/chatbot-inbound-worker.module.ts`** — worker-only module: imports `ChatbotModule` (provides `ChatbotService` + its graph), `BullModule.registerQueue({ name: CHATBOT_INBOUND_QUEUE })`, provides `ChatbotInboundProcessor`. Imported **only** by `WorkerAppModule`. (No `BullModule.forRootAsync` — `BlastWorkerModule` registers the global Bull root.)

### Producer-side wiring

- **`WhatsappModule`** — add `BullModule.registerQueue({ name: CHATBOT_INBOUND_QUEUE })`; remove the `forwardRef(() => ChatbotModule)` import (the controller no longer uses `ChatbotService`). Keep `AutopilotModule` (autopilot stays synchronous).
- **`WebhookController`** — drop the `@Inject(forwardRef(() => ChatbotService))` constructor param; add `@InjectQueue(CHATBOT_INBOUND_QUEUE) private readonly chatbotInboundQueue: Queue`; replace the inline `await this.chatbot.handleInbound(...)` loop with the enqueue.
- **`WorkerAppModule`** — import `ChatbotInboundWorkerModule` alongside `CaptureWorkerModule`.

### Module-wiring risks to verify at implementation time

1. **Duplicate queue registration in the worker.** `ChatbotModule` → `ConversationsModule` registers `chatbot-resolution-capture`, which `CaptureWorkerModule` also registers. `@nestjs/bullmq` tolerates the same queue name across modules (per-token providers), but the worker **must boot** — verify with a worker bootstrap / DI compile check, not just unit tests.
2. **Removing `ChatbotModule` from `WhatsappModule`.** Verify the API still builds and that the chatbot REST surface (`ChatbotApiModule`) supplies its own imports rather than relying on `WhatsappModule` re-pulling `ChatbotModule`. (`WhatsappModule` does not *export* it, so this should be safe — confirm.)

## Testing (TDD)

Run from `apps/api`: `npx jest src/chatbot src/whatsapp --runInBand`.

- **`WebhookController` (`__tests__/webhook.controller.spec.ts`, extend):**
  - Existing signature/verification/template/status/autopilot tests stay green (autopilot path unchanged).
  - Chatbot-enabled: a `messages` inbound enqueues to the queue with `jobId: message.id` and `{ contacts, message }` payload; `ChatbotService.handleInbound` is **never** called from the controller.
  - Quote-reply `context` is carried in the enqueued payload.
  - `CHATBOT_ENABLED` unset → **no** enqueue.
  - The handler returns `{ received: true }` **without awaiting** any LLM, and a rejected `queue.add` is swallowed (still acks).
  - The mock for the queue is a `{ add: jest.fn() }` provided under `getQueueToken(CHATBOT_INBOUND_QUEUE)`.
- **`ChatbotInboundProcessor` (new `chatbot-inbound.processor.spec.ts`):**
  - `process(job)` forwards `job.data` to `chatbot.handleInbound`.
  - A throw from `handleInbound` propagates out of `process` (so BullMQ applies its retry/fail semantics) — i.e. the processor does not swallow.
- **Worker boot smoke check** (manual or a lightweight DI test): `WorkerAppModule` compiles with `ChatbotInboundWorkerModule` added (covers risk #1).

## Edge cases

- Redelivery while the first job is in-flight → `jobId` dedup → single job.
- Redelivery after the `jobId` window → new job → `ConversationInboundMessage` unique `create` throws → no resend (and staleness guard would also `ignore_stale` it).
- Redis down at enqueue → logged at error, webhook still acks (the `InboundMessage` row is already persisted by `applyInboundMessage` for the autopilot/analytics side; only the chatbot auto-reply is lost — same outcome as a pre-change `handleInbound` failure).
- Non-text / unknown-contact inbound → `handleInbound`'s own pre-decision guards (in the worker) no-op it; the controller still enqueues (cheap).
- Autopilot enabled → unchanged synchronous behavior (explicitly out of scope).

## Files touched

- **New:** `apps/api/src/chatbot/inbound/chatbot-inbound.queue.ts`
- **New:** `apps/api/src/chatbot/inbound/chatbot-inbound.processor.ts` (+ `chatbot-inbound.processor.spec.ts`)
- **New:** `apps/api/src/chatbot/inbound/chatbot-inbound-worker.module.ts`
- **Edit:** `apps/api/src/whatsapp/webhook.controller.ts` (inject queue, enqueue instead of `await handleInbound`)
- **Edit:** `apps/api/src/whatsapp/whatsapp.module.ts` (register queue; drop `ChatbotModule` import)
- **Edit:** `apps/api/src/worker-app.module.ts` (import `ChatbotInboundWorkerModule`)
- **Edit:** `apps/api/src/whatsapp/__tests__/webhook.controller.spec.ts` (enqueue assertions)
