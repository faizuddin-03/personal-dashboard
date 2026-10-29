# WhatsApp simulator — QA test harness for chatbot + blasts

- **Date:** 2026-06-21
- **Status:** Approved (design) — pending implementation plan
- **Branch:** `feat/whatsapp-simulator` (to be created off `master`)

## Problem

QA can only test the WhatsApp chatbot and blasts by using a **real phone on real WhatsApp**: opt a number in, wait for a blast to arrive, type replies, and eyeball what the bot sends back. That is slow, non-repeatable, depends on live Meta credentials (`WHATSAPP_MOCK_MODE=false`), and can't be scripted for regression coverage.

The engine to test all of this **already runs fully offline**:

- `ChatbotService.handleInbound(payload)` runs the whole pipeline (classify → retrieve → draft → guardrails → decide → send) against a Meta-shaped payload and is **already instantiated in the API process** (`apps/api/src/app.module.ts:49` imports `ChatbotModule`).
- A CLI simulator (`apps/api/src/chatbot/sim/sim.command.ts`, `pnpm --filter api chatbot:sim`) already drives `handleInbound` end-to-end and reads the decision/reply/citations back out of Prisma into a `SimResult`.
- A 120-scenario soak (`chatbot:soak`) and an LLM-judge grader (`scripts/grade-bm-eval.ts`) already exist.
- All external calls have mock modes that default safe: `WHATSAPP_MOCK_MODE`, `LLM_MOCK_MODE`, `EMBEDDINGS_MOCK_MODE`.

What's missing is a **front door QA can actually use**: a browser "fake phone" to chat with the bot and watch blasts arrive, plus an HTTP seam that automated scripts can drive. This spec adds exactly that on top of the existing engine — no changes to the decision engine, the blast pipeline, or the production webhook.

## Goal & success criteria

- A QA user can open a **`/simulator` page** in the web app, pick or type a phone number, send a message, and see the bot's reply appear in a WhatsApp-style thread — with **no real phone and no Meta call**.
- The same page shows **blasts that target the simulated number** (rendered with the correct per-recipient language and `{{n}}` substitution) as incoming messages, and lets QA **reply to them** — exercising reply attribution → chatbot pickup.
- A new **`POST /api/sim/inbound`** endpoint runs the chatbot **synchronously in the API process** and returns the decision + reply (the existing `SimResult` shape). The web UI and the automation runner both drive this one seam.
- An **HTTP scenario runner** replays JSON scenario files (turns + expected outcomes) against `/api/sim/inbound`, resets between scenarios, and asserts on the returned decision. In mock-LLM mode it asserts deterministically on `subKind`/`reason`; in real-Ollama mode it can defer answer-content checks to the existing LLM-judge grader.
- **Safety:** the simulator is **off by default** and **refuses to run unless `WHATSAPP_MOCK_MODE=true`**, so it can never send a real WhatsApp message.
- New endpoints + the scenario runner have tests following repo conventions; the page has a Playwright smoke.

## Non-goals (scope guard / YAGNI)

- **No full webhook → BullMQ → worker path.** Decision: synchronous in-process invocation. The decision engine is byte-identical either way; only the transport differs. (The existing signed-webhook injector `scripts/post-mock-webhook.ts` already covers the async path for anyone who wants it.)
- **No real outbound to Meta, ever.** Enforced by the mock-mode gate (below).
- **Text messages only** — matches the bot, which ignores non-text inbound.
- **No changes to the decision engine, the chatbot pipeline internals, the blast pipeline, the production webhook controller, or the autopilot path.**
- **No new persistent "simulator session" model.** Simulated traffic reuses the real `Contact` / `Conversation` / `Message` tables, scoped by a recognizable sandbox marker on the contact (below) and resettable per number.
- **No standalone app.** It's a page inside the existing SPA.

## Design

### Safety gating (the important part)

`POST /api/sim/inbound` calls the real `ChatbotService.handleInbound`, whose terminal step is `ChatbotWhatsappService.sendTextMessage(...)`. If `WHATSAPP_MOCK_MODE` were `false`, that would POST to `graph.facebook.com` with the live token and message whatever number QA typed. So the simulator is gated **three independent ways**, all enforced server-side:

1. **`SIMULATOR_ENABLED` env (default `false`).** When unset/false, the `SimulatorModule` routes return `404`/are inert. Keeps it out of production entirely.
2. **`WHATSAPP_MOCK_MODE` must be `true`.** A `SimulatorGuard` (applied to every `/api/sim/*` route) reads `ConfigService` and **refuses with `412 Precondition Failed`** + a clear message (`"Simulator requires WHATSAPP_MOCK_MODE=true"`) if it isn't. This is checked at request time, not just boot, so flipping the env can't silently arm a live send.
3. **ADMIN auth.** Reuse the existing `JwtAuthGuard` + role guard (same pattern as `apps/api/src/chatbot/api/*` controllers).

The web `/simulator` route is likewise behind `ProtectedRoute` (ADMIN) and only linked in the nav when a `VITE_SIMULATOR_ENABLED` flag is set; the server gate is the real enforcement, the client flag just hides the link.

### Backend: `apps/api/src/simulator/` (new, API-process, dev-only)

A small module imported by `AppModule` only when `SIMULATOR_ENABLED=true` (conditional `imports` in `app.module.ts`, mirroring how optional modules are toggled). It depends on `ChatbotModule` (for `ChatbotService` — already in the API graph), `PrismaModule`, and `TemplatesModule` (to fetch a template for blast render-on-read).

Endpoints (all under the global `/api` prefix, all behind `SimulatorGuard` + ADMIN):

| Method & route | Body / params | Returns |
|---|---|---|
| `POST /api/sim/inbound` | `{ phone: string, text: string }` | `SimResult` (existing shape from `sim.command.ts`) |
| `GET /api/sim/thread/:phone` | path `phone` | `{ phone, contactId, items: ThreadItem[] }` (chronological) |
| `POST /api/sim/reset/:phone` | path `phone` | `{ deleted: { conversations, outbound, inbound } }` |
| `GET /api/sim/status` | — | `{ simulatorEnabled, whatsappMock, llmMock, embeddingsMock, chatbotEnabled }` |

`SimulatorService` owns the logic:

- **`simulateInbound(phone, text): Promise<SimResult>`** — normalize phone → E.164; **ensure the sandbox contact** (see below); ensure the chatbot is enabled (mirrors the CLI's `ensureReady`: patches `chatbot_settings.enabled=true`, `disable_auto_reply=false`); build the Meta-shaped `ChatbotInboundPayload` with a unique `wamid.sim-*` id; `await chatbot.handleInbound(payload)`; then read the decision/outbound/draft back into a `SimResult`.
- **`getThread(phone)`** — build the unified timeline (below).
- **`reset(phone)`** — delete the contact's `Conversation`(s) and their `ConversationInboundMessage`/`ConversationOutboundMessage`/`BotDraft`/`ChatbotDecision` rows (cascade where the schema allows; explicit deletes otherwise), leaving the sandbox `Contact` intact so the next turn starts a fresh conversation. Does **not** touch blast `Message` rows (those belong to a blast the QA created and may want to keep).
- **`status()`** — read the four mock flags + `SIMULATOR_ENABLED` from `ConfigService` and the chatbot `enabled` setting.

### Shared read-back helper (avoid CLI/HTTP drift)

The CLI `ChatbotSimulator.simulate`/`readBack`/`ensureReady` and `SimulatorService.simulateInbound` must produce **identical** `SimResult`s. To keep one source of truth, extract the pure pieces into a module-free helper `apps/api/src/chatbot/sim/sim-readback.ts`:

- `ensureSimContact(prisma, settings, phoneE164)` — the `ensureReady` upsert + settings patch.
- `readBackSimResult(prisma, phoneE164, text): Promise<SimResult>` — the existing `readBack` body (decision + last outbound + last PENDING draft + citations), plus `deriveSubKind`.

Both `ChatbotSimulator` (CLI) and `SimulatorService` (HTTP) call these. `SimResult` and `deriveSubKind` move here (re-exported from `sim.command.ts` so existing imports keep working). This is the "improve the code you're working in" change — it removes the only real duplication this feature would otherwise create.

### Thread timeline construction

The phone's timeline unions three sources for the contact, each mapped to a `ThreadItem` with a **direction from the phone's point of view** and a timestamp, then sorted ascending:

```ts
type ThreadItem = {
  id: string;
  at: string;                       // ISO timestamp used for ordering
  direction: 'incoming' | 'outgoing'; // incoming = business→phone (left bubble); outgoing = phone→business (right)
  kind: 'chat_inbound' | 'bot_reply' | 'operator_reply' | 'blast';
  body: string;
  meta?: {                          // kind-specific extras for the UI
    subKind?: string;               // bot_reply: the decision sub-kind
    status?: string;                // blast: QUEUED | SENT | DELIVERED | READ | FAILED
    templateName?: string;          // blast
    language?: string;              // blast: the per-recipient language used
  };
};
```

Sources:

1. **`ConversationInboundMessage`** (what QA typed) → `outgoing` / `chat_inbound`, `at = receivedAt`.
2. **`ConversationOutboundMessage`** (bot/operator) → `incoming`, `kind = bot_reply` (`AUTO_REPLY`) or `operator_reply` (`OPERATOR_REPLY`), `at = sentAt ?? createdAt`. (This is the chatbot's own outbound table — it does **not** write to `Message`.)
3. **Blast & inbox `Message`** rows for the contact → `incoming`. `source='BLAST'` → `kind='blast'`; `source='INBOX'` → `operator_reply`. `at = sentAt ?? createdAt`.

**Blast render-on-read (the fiddly bit):** `Message.body` is **never persisted** for blasts — `blast.processor.ts` only writes `status`/`metaMessageId`/`sentAt` on send. So for each blast `Message` the thread endpoint must reconstruct the displayed text: resolve the **per-recipient language** for the contact (reuse the same selection the blast worker uses), pick the matching `Template` row for the blast's template family, and `renderTemplate(template.bodyText, blast.variableMapping, contact)` (the pure function in `blasts/variable-renderer.ts`). Show `status` as a small indicator so a still-`QUEUED` blast (worker not running) is visible but distinguishable from a sent one. Inbox replies already store `body`, so they need no rendering.

### Sandbox contact model

When QA sends to a number that has no `Contact`, `simulateInbound` **creates one on the fly**, `OPTED_IN`, tagged `optInSource = 'simulator'` and a recognizable default name (`"Sim <last-4-digits>"`). The tag makes simulator contacts: (a) distinguishable in the contacts list, (b) safe to bulk-reset, and (c) obviously not real dealers. QA can equally point the simulator at an **existing seeded dealer number** to test against realistic contact attributes (tier, language, state) — in that case no contact is created and the existing one is reused (its opt-in is ensured for the duration).

### Web: `/simulator` page

- **`apps/web/src/pages/Simulator.tsx`** — a WhatsApp-style phone column: a header showing the active number + a mode banner (driven by `GET /api/sim/status`: e.g. "Mock LLM — replies are canned & deterministic" vs "Ollama — real RAG answers"), a scrollable thread (incoming = left bubbles, outgoing = right), and a composer. A small control to switch/enter the phone number and a "Reset conversation" button (`POST /api/sim/reset`).
- **Data:** `GET /api/sim/thread/:phone` via React Query with `refetchInterval` ~2s (same polling pattern as the inbox/blast-detail screens), so bot replies and newly-sent blasts surface without a manual refresh. Sending a message calls `POST /api/sim/inbound` (a mutation) then invalidates the thread query.
- **`apps/web/src/api/simulator.ts`** — axios + React Query hooks following the existing `api/*.ts` pattern (`api` instance from `api/client.ts`, `withCredentials`, JWT interceptor).
- **Routing/nav:** add a `<Route path="/simulator" element={<ProtectedRoute><Layout><Simulator/></Layout></ProtectedRoute>} />` in `apps/web/src/App.tsx`; add a nav link gated on `import.meta.env.VITE_SIMULATOR_ENABLED`.

### Automation: HTTP scenario runner

- **`apps/api/scripts/sim-scenarios.ts`** (new) + a corpus JSON. Each scenario reuses the existing `bm-eval`/`soak` vocabulary:
  ```jsonc
  {
    "id": "optout-01",
    "phone": "60123456789",
    "turns": ["stop"],
    "expectSubKind": "safety_escalate",   // asserted in mock LLM mode
    "expectReason": "opt_out_requested",   // optional
    "expect": { "fact": "...", "mustNotSay": ["..."] }  // optional, judged in real mode
  }
  ```
- The runner `POST`s each turn to `/api/sim/inbound` (API must be running), calls `POST /api/sim/reset/:phone` before each scenario for isolation, and asserts on the returned `SimResult`:
  - **Mock LLM mode** (`LLM_MOCK_MODE=true`): deterministic — assert `subKind`/`reason` match. This is the regression-safety mode (opt-out → escalate, no-KB → consent offer, etc.).
  - **Real Ollama mode**: defer answer-content to the existing LLM-judge (`scripts/grade-bm-eval.ts` logic) using the `expect.fact`/`mustNotSay` fields.
- Add a package script: `"chatbot:scenarios": "ts-node scripts/sim-scenarios.ts"` in `apps/api/package.json`. Runner exits non-zero on any failed assertion (CI-friendly).

## Error handling & edge cases

- **Mock mode off** → `412` from `SimulatorGuard` before any side effect (no contact created, no send).
- **Simulator disabled** (`SIMULATOR_ENABLED` unset) → routes inert / `404`.
- **Empty `text`** → `400`.
- **`handleInbound` ignores the message** (e.g. `ignore_*`): `readBackSimResult` still finds the `ChatbotDecision` row and returns it with `customerReply: null`; the UI shows the decision (e.g. "ignored: opted_out") rather than a phantom reply. (The CLI already relies on a decision row existing; if a message is dropped *before* the engine runs, surface a clear error.)
- **Reply to a blast:** the inbound goes through `handleInbound`, which runs reply attribution against recent blasts exactly as production does; the thread shows the question and the bot's follow-up. No special-casing in the simulator.
- **Blast still `QUEUED`** (blast worker not running): the thread shows it as an incoming message with a `QUEUED` badge — see operational note. The chat path is unaffected (fully synchronous, API-only).
- **Concurrency:** each `simulateInbound` uses a unique `wamid.sim-*`, so the `ConversationInboundMessage.metaMessageId @unique` idempotency never collides across turns.

## Operational notes

- **Chat needs only the API** (`pnpm --filter api dev`) — `handleInbound` is synchronous and in-process.
- **Blast lifecycle needs the worker too** (`pnpm --filter api dev:worker`): without it, a blast stays `QUEUED` (the thread still renders it via render-on-read, badged `QUEUED`); with it, the mock send flips it to `SENT` and status webhooks aren't involved (mock mode). Document both in the runbook.
- The simulator **flips the global `chatbot_settings.enabled` to true** (same as the CLI `ensureReady`). On a QA box that's expected; note it so it isn't surprising.
- `.env` for a QA box: `WHATSAPP_MOCK_MODE=true`, `SIMULATOR_ENABLED=true`, `CHATBOT_ENABLED=true`, and `LLM_MOCK_MODE` / `EMBEDDINGS_MOCK_MODE` per whether you want deterministic flows or real RAG answers.

## Testing (TDD)

Run from `apps/api`: `npx jest src/simulator`.

- **`SimulatorGuard`** — `412` when `WHATSAPP_MOCK_MODE !== 'true'`; passes when `true`; inert when `SIMULATOR_ENABLED` is off.
- **`SimulatorService`** (service-direct with a hand-rolled Prisma/Config stub + a stub `ChatbotService`, per repo convention):
  - `simulateInbound` ensures the sandbox contact (tags `optInSource='simulator'`), calls `chatbot.handleInbound` once with a well-formed payload, and returns a `SimResult` from the read-back.
  - `getThread` merges all three sources in timestamp order with correct `direction`; a blast `Message` is rendered via `renderTemplate` with the per-recipient language.
  - `reset` deletes conversation rows for the phone and leaves the contact + blast messages.
- **`sim-readback.ts`** — a focused unit test that the extracted `readBackSimResult` returns the same shape the CLI relied on (guards the refactor).
- **Scenario runner** — a couple of mock-mode scenarios asserting `subKind` (e.g. opt-out, no-KB consent offer) run green against a test API context.
- **Web** — one Playwright smoke: log in (ADMIN), open `/simulator`, send "stop", assert the thread shows the inbound and a decision/escalation indicator. (`E2E_BASE_URL`, existing auth helper.)
- **No regression** to existing chatbot tests — the `sim.command.ts` refactor must keep `chatbot:sim`/`chatbot:soak` green.

## Files touched

- **New:** `apps/api/src/simulator/simulator.module.ts`
- **New:** `apps/api/src/simulator/simulator.controller.ts`
- **New:** `apps/api/src/simulator/simulator.service.ts`
- **New:** `apps/api/src/simulator/simulator.guard.ts`
- **New:** `apps/api/src/simulator/__tests__/simulator.service.spec.ts`, `simulator.guard.spec.ts`
- **New:** `apps/api/src/chatbot/sim/sim-readback.ts` (extracted shared helper) + spec
- **New:** `apps/api/scripts/sim-scenarios.ts` + `apps/api/scripts/sim-scenarios.json`
- **New:** `apps/web/src/pages/Simulator.tsx`, `apps/web/src/api/simulator.ts`
- **New:** `e2e/tests/simulator.spec.ts`
- **Edit:** `apps/api/src/app.module.ts` (conditionally import `SimulatorModule` when `SIMULATOR_ENABLED`)
- **Edit:** `apps/api/src/chatbot/sim/sim.command.ts` (delegate to `sim-readback.ts`; re-export `SimResult`/`deriveSubKind`)
- **Edit:** `apps/api/package.json` (add `chatbot:scenarios` script)
- **Edit:** `apps/web/src/App.tsx` (route), nav component (gated link)
- **Edit:** `apps/api/.env.example`, `apps/web/.env.example` (document `SIMULATOR_ENABLED` / `VITE_SIMULATOR_ENABLED`)
- **Edit:** `CLAUDE.md` or a runbook note (how to run the simulator + worker)

## Future (out of scope, noted for later)

- A "full path" toggle that posts a signed webhook and polls, for occasional integration-fidelity runs (the injector script already exists).
- Surfacing the operator-draft / escalation queue inline in the simulator so QA can test the human-handoff side.
- Persisting rendered blast bodies on `Message` (would simplify the thread and aid auditing) — deferred because it touches the blast pipeline.
