# Inbox ↔ AI-Chatbot Bridge — Phase 3 (Testing) — Findings & Repeatable Checklist

**Date:** 2026-06-21
**Branch:** `claude/exciting-burnell-e497e4`
**Status:** Bridge verified LIVE end-to-end (real RAG). Automated smoke script added. Manual UI click-through documented below.

Phase 3 of the spec (`docs/superpowers/specs/2026-06-19-inbox-chatbot-integration-design.md` §5) calls for automated e2e + a live click-through proving the dashboard reflects chatbot-driven activity. This doc records what was verified, how to reproduce it, the gotchas discovered, and the manual UI checklist.

## 1. What was verified LIVE (real Ollama: `qwen2.5:14b` chat + `bge-m3` embeddings, against the real KB)

Stack: this branch's API + worker on an isolated port (`:3100`), Postgres + Redis (docker), `CHATBOT_ENABLED=true`, `chatbot_settings.enabled=true`, `WHATSAPP_MOCK_MODE=true`, business hours opened. Inbounds posted as **signed Meta webhooks** to `POST /api/webhooks/meta`.

| Path | Trigger | Bridge output (legacy tables the dashboard reads) | Result |
|---|---|---|---|
| **Auto-reply** | KB-answerable question | `Conversation.state=AUTO_REPLIED`; `ConversationOutboundMessage(AUTO_REPLY)` (real RAG answer); **`AutopilotEvent(AUTO_REPLIED, model=qwen2.5:14b, matchedKbDocId=NULL)`**; **`Message(source=CHATBOT, status=SENT)`** mirror | ✅ |
| **Escalation** | complaint (fresh contact) | `Conversation.state=ESCALATED`; `AutopilotEvent(ESCALATED, reason=COMPLAINT)`; **`Ticket(OPEN, reason=COMPLAINT, conversationId=<linked>)`** | ✅ |
| **Escalation (fallback)** | confident reply whose dispatch failed | `AutopilotEvent(ESCALATED, reason=SENSITIVE)` + linked `Ticket` | ✅ |
| **Operator reply** (Phase 1b) | `POST /api/inbox/conversations/:contactUuid/messages` | `recordOperatorReply` → `Conversation.state=REPLIED` + `Message` mirror | ✅ |
| **Disposition resolve→KB** (Phase 2) | `POST /api/tickets/:id/resolve {disposition:'SAVE_DRAFT', editedAnswer}` | `ResolutionCapture(SAVE_DRAFT)` → capture worker ingested 2 chunks (`ollama-bge-m3`) → **new `KnowledgeDocument(DRAFT)`** (auto-titled) | ✅ |
| **Dashboard read-model** | `GET /api/autopilot/events?action=AUTO_REPLIED`, `GET /api/tickets?tab=active` | return the bridged event + tickets the inbox renders | ✅ |

**Key confirmation for Phase 2 Task 5:** the bridged `AUTO_REPLIED` event has `matchedKbSlug = NULL` (chatbot citations live in the pgvector KB, not the legacy `KnowledgeDoc`), so the audit card's "RAG knowledge base" source label (not a slug) is exactly right.

## 2. Reproducible stack-up (local)

> Default ports (`:3000` API, `:5173` web) may be occupied by another worktree's dev stack. Run this branch's stack on isolated ports to avoid disturbing it (below uses `:3100` / `:5273`).

```bash
# infra (shared): Postgres + Redis
docker compose up -d postgres redis            # wbs_postgres:5432, wbs_redis:6379

# build this branch
pnpm --filter api build                        # produces dist/main + dist/worker

# enable the chatbot setting (DB gate, separate from the env gate)
docker exec wbs_postgres psql -U wbs -d wbs -c "UPDATE chatbot_settings SET value='true' WHERE key='enabled';"
```

**`apps/api/.env` flags required** (this file is gitignored — edit locally, do NOT commit):
```
CHATBOT_ENABLED=true            # env gate (webhook enqueues to the chatbot-inbound queue)
WHATSAPP_MOCK_MODE=true         # MUST be set in .env, not the shell (see Gotchas) — mocks ChatbotWhatsappService
CHATBOT_BUSINESS_DAYS=MON,TUE,WED,THU,FRI,SAT,SUN   # open hours so the time gate doesn't escalate
CHATBOT_BUSINESS_HOURS_START=00:00
CHATBOT_BUSINESS_HOURS_END=23:59
# LLM/EMBEDDINGS may stay real (Ollama) for a realistic run, or set *_MOCK_MODE=true for determinism.
```

```bash
# API + worker (worker hosts the chatbot-inbound + resolution-capture processors)
( cd apps/api && PORT=3100 CORS_ORIGIN=http://localhost:5273 node dist/main   & )
( cd apps/api && node dist/worker & )

# web pointed at the isolated API (CORS_ORIGIN above must match this origin)
echo 'VITE_API_BASE=http://localhost:3100/api' > apps/web/.env.local   # .env.local is gitignored
( cd apps/web && node node_modules/vite/bin/vite.js --port 5273 --strictPort & )
```

**A contact must be `OPTED_IN`** — the bot ignores `PENDING`/`OPTED_OUT` contacts (`ignore_opted_out`). The seed contact `+60123456789` (Ahmad Bin Razak) is `OPTED_IN`.

## 3. Automated smoke test (browser-free)

`e2e/verify-chatbot-bridge.mjs` — posts a signed webhook and asserts the bridge mirrored the chatbot's auto-reply into `AutopilotEvent(AUTO_REPLIED)` (hard gate), then soft-probes the escalation→Ticket path. No browser required.

```bash
API_BASE=http://localhost:3100 \
WHATSAPP_APP_SECRET=<value from apps/api/.env> \
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='ChangeMe123!' \
TEST_PHONE=+60123456789 \
node e2e/verify-chatbot-bridge.mjs
# → "✅ PASS — AUTO_REPLY bridge verified live end-to-end"
```

## 4. Manual UI click-through checklist

With the stack up (above) and the web on `:5273`, log in as `admin@example.com` / `ChangeMe123!`:

1. **Seed an auto-reply** (signed webhook with a KB question, or run the smoke script). In **Inbox → Auto-replied mode**, open the contact's thread → the bot's reply bubble shows with the "Auto-sent" style; click it → the **audit card** shows intent, confidence, model, and **"Source: RAG knowledge base"** (no KB slug, because chatbot events have none).
2. **Seed an escalation** (fresh `OPTED_IN` contact + a complaint reliably escalates). In **Inbox → Needs-Human**, the new **ticket** appears (reason badge). Select it → the agent-context card shows "Suggested knowledge · RAG" when the draft carried citations.
3. **Reply**: type in the composer and Send → the message posts via the chatbot client (mock) and the thread updates.
4. **Resolve → disposition**: click **Resolve** → the **SaveToKnowledgeModal** opens FIRST as a disposition chooser (Publish / Save draft / Don't save). Pick **Save as draft** → the answer preview is editable → confirm → ticket resolves and a **DRAFT KnowledgeDocument** is captured (visible under Knowledge after the capture worker runs). "Don't save" (SKIP) resolves without capturing.

## 5. Automated test coverage map (what protects this going forward)

- **Bridge mapping (deterministic):** `apps/api/src/chatbot/bridge/chatbot-inbox-bridge.service.spec.ts` (outcome → AutopilotEvent/Ticket/Message).
- **Disposition resolve/close (deterministic, live DB):** `apps/api/src/tickets/tickets.service.spec.ts` (`resolve`/`close` with `SAVE_DRAFT` → `ResolutionCapture`; non-SKIP-without-reply surfaces the conflict; SKIP default).
- **Live end-to-end smoke (this phase):** `e2e/verify-chatbot-bridge.mjs`.
- **UI disposition modal:** `e2e/tests/inbox-agent-assist.spec.ts` — the "Resolve opens the disposition chooser" test is `test.skip` (needs a Playwright browser binary + a seeded active ticket + the chatbot stack). Un-skip and run it manually during a Phase-3 stack session; the data-testids it targets (`resolve-ticket`, `save-kb-modal`, `disposition-*`, `kb-confirm`) ship in Phase 2.

## 6. Gotchas discovered (Phase 3)

- **`WHATSAPP_MOCK_MODE` must be set in `apps/api/.env`, not the shell.** `ChatbotWhatsappService` reads it via `ConfigService`, which lets the `.env` file value win over a shell-exported override. (Plain `process.env` reads like `PORT` in `main.ts` *do* honor the shell — hence the inconsistency.) If it's `false`, a confident auto-reply hits the real Meta API and fails (`#131030 Recipient not in allowed list`).
- **Two gates, both required:** env `CHATBOT_ENABLED=true` (webhook enqueues) AND DB `chatbot_settings.enabled=true` (decision engine).
- **Opt-in required:** the bot ignores non-`OPTED_IN` contacts. Brand-new webhook contacts default to `PENDING` → `ignore_opted_out`.
- **Replies route by contact UUID, not phone:** `POST /api/inbox/conversations/:contactId/messages` expects the contact's UUID (a phone `+…` yields a 500 "Error creating UUID").
- **Live escalation is decision-engine-dependent, not deterministic:** a capable LLM with good KB coverage returns high confidence and **auto-replies most inputs (including complaints)**. A fresh-contact complaint escalated; the same complaint on a contact with rich context auto-replied. Don't write content-triggered escalation assertions expecting determinism — assert the bridge mapping via the integration test instead.
- **Playwright `webServer` is not configured** — the e2e harness assumes a running stack (consistent with `inbox.spec.ts`). The Playwright **browser binary is not installed** in this environment (`playwright install chromium` needed to run the browser specs).
- **Worktree env:** the chatbot reply path requires the **worker** running (`node dist/worker`), not just the API.

## 7. Phase 3 status

- ✅ Live end-to-end verification of the full bridge (auto-reply, escalation, operator reply, disposition→capture→KB) with real RAG.
- ✅ Browser-free smoke script committed and green.
- ✅ Reproducible procedure + manual UI checklist documented.
- ⏳ Browser-driven Playwright run of the disposition-modal UI spec is deferred (needs a browser binary + the stack on default ports); the spec + data-testids exist and the underlying flow is proven via the smoke script and integration tests.
