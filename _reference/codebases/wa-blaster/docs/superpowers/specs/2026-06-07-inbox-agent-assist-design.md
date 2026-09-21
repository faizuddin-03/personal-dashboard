# Inbox Agent-Assist — Context Card + AI Draft + Canned Replies — Design Spec

**Date:** 2026-06-07
**Author:** Soon Zhen Yang (with Claude)
**Status:** Draft — awaiting spec review
**Context:** Hackathon. eAuto dealer + AI console (`apps/web` + `apps/api`). Slice E of the remaining-work roadmap (after Real Analytics PR #16 and Per-recipient Delivery PR #17).

---

## 1. Purpose

The Needs-Human inbox composer is a bare textarea + Send. A human agent picking up an escalated ticket has the dealer context panel (tier/credits) but no help *answering*: no view of why the bot escalated, no relevant knowledge surfaced, no draft to start from, and no saved replies. This slice adds an **agent-assist** experience around the composer plus a **canned-replies** library.

Two cohesive clusters:
- **Agent assist** reuses the existing autopilot infrastructure (`KnowledgeService.retrieve` + `LlmService.generateReply`) — no new data model.
- **Canned replies** is a self-contained new module (a content store + management UI).

### Decisions taken into this spec (from brainstorming)

- **Canned replies: full feature** — `CannedReply` model + full CRUD + a management surface in **Settings** + a composer picker.
- **Context card: richer** — intent + escalation reason + confidence (from the ticket's linked autopilot event) **plus** freshly-retrieved "suggested knowledge" the agent can insert.
- **AI draft reuses the existing mock LLM** grounded in KB (the autopilot's `generateReply` path) — deterministic, demoable; LLM stays mock.
- **`reasonTone()` fix** included (it always returns `'human'` today).
- Agent-assist endpoints live on `TicketsService` (which already injects `KnowledgeService`); it gains `LlmService`.
- One branch / one PR despite the size; structured as two independent clusters.

### Key architectural finding

A ticket's linked `autopilotEvent` (`Ticket.autopilotEventId`) carries **intent + reason + confidence**, but **not** a matched-KB doc — `matchedKbDocId`/`replyText` are only recorded on `AUTO_REPLIED` events, never on escalations (`autopilot.service.ts:153-168`). So "relevant knowledge beside the composer" comes from a **fresh `knowledge.retrieve()`** on the dealer's latest inbound message (the same retrieval the AI-draft needs), not from the event.

---

## 2. Scope

### In scope

1. **`GET /tickets/:id/agent-context`** — intent/reason/confidence (+ escalation time) + top-3 suggested KB docs.
2. **`POST /tickets/:id/suggest-reply`** — a KB-grounded mock-LLM draft reply.
3. **`CannedReply` model + `canned-replies` module** — list/create/update/delete + seeded starter set.
4. **Frontend:** agent context card + "Suggest draft" + "Saved replies" picker in the Needs-Human composer; a "Canned replies" management tab in Settings; `reasonTone()` fix; client fns.
5. **Tests:** API unit tests (mocked Prisma + mocked Knowledge/LLM) for the two ticket methods and canned-replies CRUD; a Playwright spec (run deferred).

### Out of scope (deferred)

- A real LLM provider (stays `MockLlmService`).
- Dealer conversation-history grouping of past tickets (separate inbox gap, not this slice).
- Per-canned-reply variables/placeholders, categories filtering UI beyond a simple list, sharing/permissions on canned replies.
- Applying the DB migration / running the seed / e2e (deferred — no Postgres in the build session).

---

## 3. Architecture

### 3.1 Cluster 1 — Agent assist (TicketsService additions)

`TicketsService` gains `LlmService` (alongside the existing `KnowledgeService`). Two methods + two routes on `TicketsController` (JWT-guarded).

**`agentContext(id)` → `GET /tickets/:id/agent-context`:**
1. `getOrThrow(id)` (404 if missing).
2. If `ticket.autopilotEventId`, load that `AutopilotEvent` (for `confidence`, `createdAt`).
3. Find the latest inbound: `prisma.inboundMessage.findFirst({ where: { contactId }, orderBy: { receivedAt: 'desc' } })` (mirrors `suggestKnowledge`).
4. `suggestedKnowledge` = `knowledge.retrieve(inbound?.body ?? '', { intent: ticket.intent ?? undefined, limit: 3 })` mapped to `{ id, slug, question, answer, category }`; `[]` when there is no inbound body.
5. Return:
```ts
{
  intent: string | null;          // ticket.intent
  reason: EscalationReason;       // ticket.reason
  confidence: number | null;      // linked event's confidence, else null
  escalatedAt: string;            // event.createdAt ?? ticket.openedAt
  suggestedKnowledge: { id: string; slug: string; question: string; answer: string; category: string }[];
}
```

**`suggestReply(id)` → `POST /tickets/:id/suggest-reply`:**
1. `getOrThrow(id)`; load `contact` (for `dealerName`); find the latest inbound (as above).
2. If no inbound body → `{ text: '', confidence: 0 }` (UI shows "nothing to draft from").
3. `hits = knowledge.retrieve(body, { intent, limit: 3 })`; `reply = llm.generateReply({ message: body, intent, knowledge: hits.map(h => ({ question: h.doc.question, answer: h.doc.answer })), dealerName: contact?.picName ?? contact?.name ?? undefined })`.
4. Return `{ text: reply.text, confidence: reply.confidence }`.

(`LlmModule` is `@Global`; if not, `TicketsModule` imports it. `KnowledgeService.retrieve` and `LlmService.generateReply` signatures are exactly those the autopilot uses — `autopilot.service.ts:77,85`.)

### 3.2 Cluster 2 — Canned replies (new module)

**Prisma model** (`schema.prisma`):
```prisma
model CannedReply {
  id          String   @id @default(uuid()) @db.Uuid
  title       String
  body        String
  category    String?
  createdById String?  @map("created_by") @db.Uuid
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt       @map("updated_at")

  @@map("canned_replies")
}
```

**New module** `apps/api/src/canned-replies/` (controller + service + DTOs), `@UseGuards(JwtAuthGuard)`, registered in `app.module.ts`:
- `GET /canned-replies` → `CannedReply[]` (ordered by `title asc`).
- `POST /canned-replies` `{ title, body, category? }` → created row (sets `createdById` from `req.user`).
- `PATCH /canned-replies/:id` `{ title?, body?, category? }` → updated row (404 if missing).
- `DELETE /canned-replies/:id` → 204 (404 if missing).

**Seed** (`seed.ts`, idempotent — skip if any `cannedReply` exists): ~6 starter replies (e.g. transfer steps, credit top-up, road-tax renewal, "looking into it", opening hours, escalation acknowledgement).

### 3.3 Frontend

**Client (`apps/web/src/api`):**
- `tickets.ts`: `AgentContext` type + `getAgentContext(id)`; `SuggestedReply` type + `suggestReply(id)`.
- New `cannedReplies.ts`: `CannedReply` type + `listCannedReplies`/`createCannedReply`/`updateCannedReply`/`deleteCannedReply`.

**`NeedsHumanMode.tsx`** (in `TicketDetail`, where `draft`/`setDraft` live):
- **Agent context card** rendered above the composer (only when the window is open / composer shown): a compact card with intent + reason + confidence chips, and a "Suggested knowledge" list (top-3) where each row shows the KB question and an **Insert answer** button that appends the KB answer to the draft.
- **Composer toolbar** (a row above the textarea): **✨ Suggest draft** (calls `suggestReply`, sets the draft to the returned text; disabled while pending; shows the returned confidence subtly) and **Saved replies ▾** (a dropdown listing canned replies from `listCannedReplies`; selecting one appends/sets its `body` into the draft).
- **Insert semantics:** if the draft is empty, replace; otherwise append on a new line. "Suggest draft" replaces the draft (it's a full reply); KB "Insert answer" and canned-reply insert append.
- **`reasonTone()` fix:** a `REASON_TONE` map → `KNOWLEDGE_GAP: 'blue'`, `LOW_CONFIDENCE: 'human'`, `COMPLAINT: 'red'`, `SENSITIVE: 'brand'` (distinct, sensible BadgeTones).

**`Settings.tsx`** — new **"Canned replies"** tab: a list of replies (title + body preview + category) with **Add** / **Edit** / **Delete**, using the existing `Modal` for the add/edit form and the existing local-toast pattern. Admin-guarded like the other Settings management (the endpoints are JWT-guarded; the tab follows the page's existing role handling).

### 3.4 DB / environment

The `CannedReply` model requires a Prisma migration. With Postgres down:
- Add the model to `schema.prisma` and run **`pnpm db:generate`** (`prisma generate` needs no DB) so the client exposes `prisma.cannedReply` → backend **builds + unit-tests** pass.
- **Deferred (need Postgres):** `pnpm db:migrate` (apply the migration), the canned-replies seed run, and all e2e. Documented in the plan + README.

---

## 4. Data flow

1. Agent selects an escalated ticket → `agent-context` loads → context card shows why-escalated + suggested KB.
2. Agent clicks **Suggest draft** → `suggest-reply` retrieves KB + mock-LLM drafts a reply → fills the composer.
3. Agent optionally inserts a KB answer or a **Saved reply**, edits, and Sends (existing `sendInboxReply`).
4. Settings → Canned replies: admin manages the library via the CRUD endpoints.

---

## 5. Error / empty / loading

- **Auth:** all new routes behind `JwtAuthGuard`.
- **Missing ticket / canned reply:** 404. **Empty/no-inbound ticket:** `agent-context` returns `suggestedKnowledge: []`; `suggest-reply` returns `{ text: '', confidence: 0 }` and the UI surfaces "nothing to draft from" rather than filling an empty draft.
- **Context card / picker load failures:** render inline ("couldn't load suggestions") without blocking the composer — the agent can always type manually.
- **Loading:** card + buttons show pending states; "Suggest draft" disabled while in flight.
- The composer's existing 24h-window + closed-ticket gating is unchanged; the assist card/toolbar render only when the composer is shown.

---

## 6. Testing strategy

- **API unit** (mocked Prisma + mocked `KnowledgeService`/`LlmService`, mirroring `tickets.service.spec.ts`):
  - `agentContext`: 404 on missing; maps event confidence; calls `knowledge.retrieve` with the latest inbound body + intent; returns `[]` suggestedKnowledge when no inbound; maps hits → `{id,slug,question,answer,category}`.
  - `suggestReply`: 404 on missing; `{ text:'', confidence:0 }` when no inbound; otherwise calls `llm.generateReply` with the retrieved KB + dealerName and returns its `{text,confidence}`.
  - canned-replies service: list ordering, create (sets createdById), update (404 on missing), delete (404 on missing).
- **Generator/seed:** canned-reply seed is idempotent.
- **E2E** (`e2e/tests/inbox-agent-assist.spec.ts`, Playwright; run deferred): open an escalated ticket, assert the context card + Suggest-draft button + Saved-replies picker render; (Settings) the Canned replies tab lists seeded replies. Local `loginAsAdmin` convention.

---

## 7. File-by-file change list

**API (new):**
- `apps/api/src/canned-replies/canned-replies.module.ts`, `canned-replies.controller.ts`, `canned-replies.service.ts`, `dto/create-canned-reply.dto.ts`, `dto/update-canned-reply.dto.ts`, `__tests__/canned-replies.service.spec.ts`.

**API (edit):**
- `apps/api/prisma/schema.prisma` — `CannedReply` model.
- `apps/api/src/app.module.ts` — register `CannedRepliesModule`.
- `apps/api/src/tickets/tickets.service.ts` — `agentContext` + `suggestReply` (+ inject `LlmService`).
- `apps/api/src/tickets/tickets.controller.ts` — 2 routes.
- `apps/api/src/tickets/tickets.module.ts` — import `LlmModule` if not global.
- `apps/api/src/tickets/__tests__/tickets.service.spec.ts` — new tests.
- `apps/api/prisma/seed.ts` — canned-reply starter set.

**Web (new):**
- `apps/web/src/api/cannedReplies.ts`.

**Web (edit):**
- `apps/web/src/api/tickets.ts` — `getAgentContext`/`suggestReply` + types.
- `apps/web/src/pages/inbox/NeedsHumanMode.tsx` — context card, composer toolbar (Suggest draft + Saved replies), `reasonTone` fix.
- `apps/web/src/pages/Settings.tsx` — "Canned replies" management tab.

**E2E (new):** `e2e/tests/inbox-agent-assist.spec.ts`.

**Docs:** `README.md` — note `pnpm db:migrate` is required for the new table.

---

## 8. Sequencing (for the implementation plan)

1. `CannedReply` model + `pnpm db:generate` + `canned-replies` module CRUD + DTOs + tests + register in app.module + seed.
2. `agentContext` on TicketsService + route + tests.
3. `suggestReply` on TicketsService + route + tests (+ inject LlmService / import LlmModule).
4. Web client fns: `cannedReplies.ts` + tickets `getAgentContext`/`suggestReply`.
5. `NeedsHumanMode.tsx`: context card + Suggest-draft + Saved-replies picker + `reasonTone` fix.
6. `Settings.tsx`: Canned replies management tab.
7. E2E spec + README note.

Backend-first (1–3) so the UI has real endpoints; canned-replies module (1) is independent and can land first; reasonTone fix rides along with the NeedsHumanMode work (5).

---

## 9. Open questions / risks

1. **`TicketsService` growth:** adding `agentContext`/`suggestReply` (KB + LLM) alongside the KB-candidate methods grows the service. Acceptable for now; if it becomes unwieldy, a future `AgentAssistService` extraction is the cleanup. Not done in this slice.
2. **Migration deferral:** the backend builds/tests via `prisma generate`, but the `canned_replies` table only exists after `pnpm db:migrate` on a live DB. The Settings tab + picker will error against the API until then — expected and documented.
3. **Mock-LLM draft quality:** `MockLlmService.generateReply` returns a deterministic, KB-shaped reply. It's demoable but obviously not "smart"; swapping a real provider is the deferred LLM work.
4. **`knowledge.retrieve('')` on a ticket with no inbound:** guarded by returning `[]`/empty draft rather than calling retrieve with an empty query.
5. **Insert UX:** "Suggest draft" replaces the draft; KB/canned inserts append. If an agent has typed and clicks Suggest draft, their text is replaced — acceptable (it's an explicit "draft for me" action), but worth confirming in review.
