# Inbox ↔ AI-Chatbot Integration (Bridge) — Design

**Date:** 2026-06-19
**Status:** Approved design — pending phase plans
**Author:** Claude (with desmond@modefair.com)

## 1. Problem & goal

The operator dashboard inbox (`apps/web`, the `/inbox` route) is fully built but is wired to the **legacy** inbound stack, not to the RAG chatbot. Concretely, the dashboard's two modes read:

- **Auto-replied mode** → `listAutopilotEvents({ action: 'AUTO_REPLIED' })` (the legacy **Autopilot** system).
- **Needs-Human mode** → `listTickets()` + per-ticket `suggestReply`/`agentContext`/`createKnowledgeCandidate` (the legacy **Tickets** system).
- **Conversation thread** → `getInboxConversation(contactId)` (the legacy blast `/inbox`, over the `Message`/`InboundMessage` tables).

Meanwhile the RAG chatbot built over the last sessions (`apps/api/src/chatbot/*`: `DecisionEngine`, `Conversation`/`BotDraft`, resolution-capture, pgvector KB, `/chatbot/*` API) is a **separate, parallel** stack the dashboard never touches. Both run on every inbound (Autopilot always; the chatbot when `CHATBOT_ENABLED`), and they are redundant implementations of the same concepts.

**Goal:** make the RAG chatbot the brain behind the existing dashboard inbox, **without** redesigning the dashboard — by *bridging* the chatbot's outputs into the Autopilot/Tickets surfaces the UI already reads. End state: every inbound is handled by the chatbot; the dashboard's Auto-replied list, Needs-Human ticket queue, AI suggestions, conversation thread, and save-to-KB all reflect chatbot-driven activity.

### Non-goals
- No redesign of the dashboard inbox UI (the bridge is chosen precisely to avoid that).
- No deletion of the Autopilot/Tickets/`/inbox` code or their tables; the legacy Autopilot *brain* is bypassed but left in place.
- The standalone blast `/inbox` thread endpoint stays (it backs the dashboard thread).
- The legacy autopilot's auto-reply LLM and the legacy `KnowledgeDoc` KB are not removed, only bypassed for retrieval.

## 2. Context: the two stacks

| Concern | Legacy (dashboard reads) | RAG chatbot (the brain) |
|---|---|---|
| Auto-reply record | `AutopilotEvent(action=AUTO_REPLIED)` | `ConversationOutboundMessage(kind=AUTO_REPLY)` + `BotDraft(SENT)` |
| Escalation record | `Ticket` (+ `AutopilotEvent(ESCALATED)`) | `BotDraft(PENDING)` + `Conversation.state=ESCALATED` |
| AI suggestion | `tickets.suggestReply()` → legacy KB + `llm.generateReply` | `BotDraft.suggestedReply` + RAG citations |
| KB | `KnowledgeDoc` (keyword) | `knowledge_documents`/`knowledge_chunks` (pgvector) |
| Thread store | `InboundMessage` + `Message` | `ConversationInboundMessage` + `ConversationOutboundMessage` |
| Send client | `WhatsappCloudApiService` (blasting) | `ChatbotWhatsappService` (chatbot's own) |
| Process | API (webhook calls `autopilot.handleInbound`) | Worker (`ChatbotInboundProcessor`) |

**Hard constraint:** never import or modify the blasting `WhatsappCloudApiService`. The bridge sends only via `ChatbotWhatsappService`.

## 3. Architecture — the bridge

A new **`ChatbotInboxBridge`** service, invoked from the chatbot worker orchestrator (`ChatbotService.handleInbound`) after each decision, mirrors the chatbot's outcome into the legacy tables the dashboard reads. The chatbot remains the single brain.

### 3.1 Outcome → legacy-table mapping
- **Auto-reply** (`rag_answer`): write `AutopilotEvent(action=AUTO_REPLIED, intent, confidence=draftConfidence, replyText=draftBody, model=modelUsed)`, with `matchedKbDocId = null`. (The chatbot's `citedChunkIds` are pgvector chunk IDs in a *different* KB than the legacy `KnowledgeDoc` that `matchedKbDocId`/`listEvents` resolves to a slug, so they cannot populate it — the Auto-replied audit card's KB-slug field will be blank for chatbot events; Phase 2 may instead surface the RAG citations.) → dashboard **Auto-replied mode**.
- **Escalation** (`safety_escalate`, `consent_accepted_escalate`, and the dispatch-failure fallback): write `AutopilotEvent(action=ESCALATED, reason, intent)` **and** `tickets.createFromEscalation({ contactId, reason, intent, autopilotEventId })`. → dashboard **Needs-Human mode**.
- **Consent offer / declined / still-processing / ignore_***: no ticket/event (these are chatbot-internal states), matching today's no-op behavior.

### 3.2 Reason mapping (chatbot → legacy `EscalationReason`)
Legacy enum: `COMPLAINT | LOW_CONFIDENCE | KNOWLEDGE_GAP | SENSITIVE`. Mapping:
- `complaint` → `COMPLAINT`
- `low_intent_confidence`, low `draftConfidence` → `LOW_CONFIDENCE`
- KB miss (no chunks) → `KNOWLEDGE_GAP`
- `opt_out_requested`, `guardrail_*`, `out_of_hours`, `cs_window_expired`, `kill_switch_active`, consent-accepted, dispatch-failure → `SENSITIVE` (catch-all)

If the catch-all proves too coarse during implementation, add enum value(s) via an additive migration. (Decided in Phase 1.)

### 3.3 Ticket ↔ chatbot link
Add a nullable `Ticket.conversationId` (FK → `Conversation`, `onDelete: SetNull`). The bridge sets it when creating a ticket from a chatbot escalation. This lets ticket-level actions reach the chatbot's `Conversation`/`BotDraft`.

### 3.4 AI assist fed by the chatbot
`tickets.suggestReply()` and `tickets.agentContext()` today re-run the legacy keyword KB + `llm.generateReply`. Repoint them: when the ticket has a `conversationId`, return the linked conversation's latest `BotDraft.suggestedReply` + its RAG citations (resolved to chunk/doc titles); fall back to the existing legacy path when there is no linked draft (e.g. a pre-existing ticket). Suggestion response shape gains optional `citations`.

### 3.5 Operator actions mirrored to the chatbot conversation
The dashboard operates on **Tickets** (assign / resolve / close) plus a **composer send** — there is no chatbot-style draft approve/edit/reject UI. Each action mirrors to the linked chatbot `Conversation` so the two stay consistent and the bot stands down:
- **Composer send** → chatbot `manualReply` (`ChatbotWhatsappService`; records `OPERATOR_REPLY`, advances the conversation to `REPLIED`, mirrored into `Message` per 3.6). Honors the hard constraint; replaces today's `sendInboxReply` → blast `WhatsappCloudApiService`.
- **Ticket assign / take-over** → set `Conversation.assignedToId`, so the decision engine's human-handling guard keeps the bot from replying over the operator.
- **Ticket resolve/close** → chatbot `close(conversationId, disposition)` → resolution-capture (3.7).

The chatbot's `PENDING` `BotDraft` is used only as the **suggestion source** (3.4); the operator never sees a separate approve/edit/reject flow. Once the operator sends/resolves, the conversation advances and the draft is moot.

### 3.6 Thread visibility (decision 1: mirror)
The dashboard thread reads legacy `Message`/`InboundMessage`. Customer inbounds are already written there by `blasts.applyInboundMessage` (unchanged). The bridge **mirrors each chatbot outbound** (auto-reply and operator reply) into the legacy `Message` table so the thread shows them. Add `CHATBOT` to the `MessageSource` enum (additive) to mark mirrored auto-replies, so the existing "Auto-sent" bubble styling applies; operator replies use `INBOX`.

### 3.7 Knowledge base (decision 2: chatbot KB authoritative)
The chatbot's pgvector KB is the retrieval source. "Save to KB" on ticket resolve/close routes to the chatbot's resolution-capture pipeline (`ResolutionCaptureService` / the close-with-disposition flow) instead of `createKnowledgeCandidate` writing the legacy `KnowledgeDoc`. The legacy `KnowledgeDoc` table becomes vestigial (left in place).

### 3.8 Single brain (decision 3: bypass legacy autopilot)
When `CHATBOT_ENABLED=true`, the webhook skips the legacy `autopilot.handleInbound` decision path (it stays in code but is gated off) so inbounds are not double-handled. The chatbot + bridge produce all the `AutopilotEvent`/`Ticket`/`Message` rows the dashboard needs.

### 3.9 Process-boundary wiring
`ChatbotService`/`ChatbotInboxBridge` run in the **worker**; `TicketsService`/`AutopilotService` (and their Prisma writes) are in the API graph. Import `TicketsModule` (and the autopilot-event write path, via a thin shared writer or `AutopilotModule`) into `ChatbotInboundWorkerModule`. Both processes share Prisma + the DB, so direct DI is fine. The bridge must be **best-effort**: a bridge failure logs and never breaks the chatbot reply/escalation pipeline.

## 4. Data-model changes (all additive migrations)
- `Ticket.conversationId String? @db.Uuid` (FK → `Conversation`, `onDelete: SetNull`) + index.
- `MessageSource` enum: add `CHATBOT`.
- Possibly new `EscalationReason` value(s) if the catch-all mapping is too coarse (decided in Phase 1).

Migrations are hand-authored + applied via `prisma migrate deploy` (the repo's pgvector column forces this; `migrate dev` wants to drop the raw-SQL `embedding` column — see prior migrations in this branch).

## 5. Phasing

### Phase 1 — Backend bridge (the bulk)
1. `ChatbotInboxBridge` service: outcome → `AutopilotEvent` + `Ticket` + `Message` mirror (best-effort, logged).
2. Wire it into `ChatbotService.handleInbound` at the decision-dispatch seams.
3. Gate the legacy `autopilot.handleInbound` brain off when `CHATBOT_ENABLED`.
4. Schema: `Ticket.conversationId`, `MessageSource.CHATBOT` (+ reason values if needed); migrations.
5. Repoint `tickets.suggestReply`/`agentContext` to reuse the linked `BotDraft` + citations (fallback to legacy).
6. Repoint operator send (`sendInboxReply` / ticket composer) and draft approve/edit/reject to the chatbot client/services.
7. Route ticket resolve/close "save to KB" to the chatbot resolution-capture.
8. Module/process wiring (`TicketsModule` into the worker module); best-effort error isolation.

### Phase 2 — Frontend (minimal)
- The dashboard already reads tickets/events/thread, so most of it works once Phase 1 lands. Expected touches:
  - `SaveToKnowledgeModal`: switch from `createKnowledgeCandidate` to choosing a chatbot **disposition** (IMPORT_LIVE / SAVE_DRAFT / SKIP) on resolve/close (3.7).
  - Surface that suggestions are RAG-backed (optionally show citations from 3.4).
  - Auto-replied audit card: the KB-slug field will be blank for chatbot events (3.1) — hide it or show RAG citations instead; re-verify confidence/intent/model still render from the bridged `AutopilotEvent`.

### Phase 3 — Testing (both)
- **Automated:** keep the api integration suites; add `e2e/` (Playwright) coverage following `e2e/tests/inbox.spec.ts` conventions — seed a signed Meta webhook inbound, assert the dashboard shows an auto-reply (Auto-replied mode) and an escalation (Needs-Human ticket with a RAG suggestion), approve/take-over/resolve→KB.
- **Live click-through:** stand up API + worker (`CHATBOT_ENABLED=true`, settings `enabled=true`, `EMBEDDINGS_MOCK_MODE=true`, `WHATSAPP_MOCK_MODE=true`) + `web` dev server; drive the browser preview end-to-end; deliver a repeatable manual checklist.

## 6. Error handling
- Bridge writes are best-effort: wrapped so a failure logs (`[ChatbotInboxBridge]`) and never fails the chatbot pipeline.
- `CS_WINDOW_CLOSED` and `NO_SUGGESTION` (from the chatbot send/approve paths) surface to the composer/approve UI as today.
- Reason-mapping has a `SENSITIVE` catch-all so no escalation is ever dropped for lack of a mapping.

## 7. Risks & open items
- **Double-handling** if the autopilot bypass is incomplete — Phase 1 must gate every legacy auto-reply/escalation site behind `CHATBOT_ENABLED`.
- **Two message stores**: mirroring is one-directional (chatbot → `Message`); the thread is read-only from legacy, so no sync-back needed.
- **Reason granularity**: revisit the enum if operators need finer escalation reasons.
- **Vestigial legacy KB/autopilot code**: left in place; a later cleanup task can remove them once the bridge is proven.

## 8. Rollout
Gated by the existing `CHATBOT_ENABLED` env flag + the DB `enabled` setting. With both off, behavior is unchanged (legacy autopilot/tickets). Turning them on activates the bridge. Note (Phase 1b): the operator composer (`/inbox` send) now routes through the chatbot and requires an open chatbot `Conversation`; with `CHATBOT_ENABLED` off it returns `no_active_conversation`. Since the chatbot runs 24/7 in production this is acceptable, but flipping the flag off disables the composer.
