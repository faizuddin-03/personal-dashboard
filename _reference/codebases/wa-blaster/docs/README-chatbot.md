# AI Chatbot Module

An auto-reply + RAG + escalation layer for inbound WhatsApp customer messages, living inside
`apps/api` as a set of NestJS modules. It reads a knowledge base, drafts grounded replies with a
local LLM, auto-sends only when it is confident, and otherwise either offers to connect the customer
to a human or escalates silently to the operator inbox.

It is **off by default** (`CHATBOT_ENABLED=false`) and shares the existing Postgres, Redis and Meta
WhatsApp credentials — no new infrastructure.

- **Architecture & diagrams:** [chatbot-architecture.md](./chatbot-architecture.md)
- **Incident playbook:** [chatbot-runbook.md](./chatbot-runbook.md)
- **REST API for the dashboard:** [chatbot-api-contract.md](./chatbot-api-contract.md) · [chatbot-openapi.json](./chatbot-openapi.json) (UI at `/docs`)

---

## What it does

For every inbound text message (within the 24h WhatsApp customer-service window) the bot runs a
safety → consent → RAG pipeline and produces exactly one decision:

| Decision | Sub-kinds | Customer sees |
|---|---|---|
| **AUTO_SEND** | `rag_answer` | A confident, citation-grounded answer. |
| | `consent_offer` | "I'm not sure I can answer that — connect you to support? YES/NO" |
| | `escalation_declined_ack` | "No problem, let me know if you need anything else." |
| | `still_being_processed` | "Your previous enquiry is still being handled." |
| **ESCALATE** | `safety_escalate` | *(nothing — an operator draft is queued)* |
| | `consent_accepted_escalate` | "Got it — passed to our support team." + operator draft |
| **IGNORE** | `ignore_disabled`, `ignore_opted_out` | *(nothing)* |

Every decision is persisted to `chatbot_decisions` for analytics, and confident answers record a
`SENT` `BotDraft` with its citations. Non-text messages and unknown contacts are skipped. When an
operator closes an escalated ticket, the resolution can be captured back into the knowledge base
(see the runbook's capture workflow).

**Out of scope (Phase 2 / other dev):** dashboard UI, media (image/voice) handling, reranking,
hybrid keyword search, multi-tenant KBs, real-time push, cloud-LLM fallback. The chatbot ships the
REST API only.

---

## Quick start (local, mock mode — no Ollama needed)

```bash
# Postgres + Redis (pgvector image) come up via docker compose at the repo root.
docker compose up -d

# 1. Try decisions interactively without sending anything real:
pnpm --filter api chatbot:sim
#    → prompts for phone + message, prints the decision, reply and citations.
#    Batch: pnpm --filter api chatbot:sim -- --file=msgs.json   ([{ "phone": "...", "message": "..." }])

# 2. Load test the whole pipeline (120 scenarios + close-ticket flow):
LLM_MOCK_MODE=true EMBEDDINGS_MOCK_MODE=true pnpm --filter api chatbot:soak

# 3. Drive it via a signed webhook against a running API:
pnpm --filter api dev           # in one terminal (needs CHATBOT_ENABLED=true)
pnpm --filter api exec ts-node scripts/post-mock-webhook.ts 60123456789 "What time do you open?"
```

The simulator and soak default `WHATSAPP_MOCK_MODE`, `LLM_MOCK_MODE` and `EMBEDDINGS_MOCK_MODE` to
`true` when unset, so they never make a real Meta/Ollama call by accident.

> **Mock-mode note:** the deterministic mock LLM returns an empty draft body, so `rag_answer` is
> unreachable and `out_of_hours` is never reached in mock — those appear only against real models.
> The soak reports this and gates pass/fail on the deterministic checks (0 errors, latency,
> opt-out/complaint/consent/capture assertions). Run against real Ollama + a populated KB to
> validate the `rag_answer` distribution.

---

## Enabling in production

There are **two independent gates** — both must be on for the bot to auto-reply:

1. **`CHATBOT_ENABLED=true`** (env var) — the webhook bridge skips the chatbot entirely when false.
   Requires an API restart to change.
2. **`enabled=true`** (the `enabled` row in `chatbot_settings`) — the decision engine's master
   switch. Hot-patchable via `PATCH /api/chatbot/settings`.

Steps:

1. Ollama running on the production host with `OLLAMA_KEEP_ALIVE=-1`; pull the chat model
   (`qwen2.5:14b` or larger) and the embedding model (`bge-m3`). Verify: `ollama list` and
   `curl http://<host>:11434/api/tags`.
2. In `apps/api/.env`: `CHATBOT_ENABLED=true`, `LLM_MOCK_MODE=false`, `EMBEDDINGS_MOCK_MODE=false`,
   `WHATSAPP_MOCK_MODE=false`. Restart the API **and** the worker (`pnpm --filter api start:worker`).
3. `PATCH /api/chatbot/settings { "enabled": true }`.
4. Ingest the real business documents (Knowledge admin, or `scripts/ingest-seeded-docs.ts`).
5. Send a test WhatsApp message → confirm a row appears in `GET /api/chatbot/decisions`.

---

## Disabling (incident response, no deploy)

- **Fast (hot):** `PATCH /api/chatbot/settings { "disable_auto_reply": true }`. The settings cache is
  invalidated immediately, so the very next inbound becomes `ESCALATE / kill_switch_active` — every
  message goes to the operator inbox instead of being auto-answered. (Worst-case staleness is the
  60s settings-cache TTL if the row is changed directly in the DB, bypassing the API.)
- **Clean (cold):** `CHATBOT_ENABLED=false` in `.env` + restart. The webhook bridge stops calling the
  chatbot at all.

See the runbook's **"How to roll back"** entry.

---

## Tuning

Runtime knobs live in `chatbot_settings` (hot, via `PATCH /api/chatbot/settings`):

| Setting | Default | Effect |
|---|---|---|
| `enabled` | `false` | Engine master switch. |
| `disable_auto_reply` | `false` | Kill switch — forces every decision to ESCALATE. |
| `confidence_threshold` | `0.85` | Min draft confidence to auto-send (higher → fewer auto-sends). |
| `retrieval_min_score` | `0.5` | Min cosine similarity to keep a chunk (higher → stricter matches). |
| `retrieval_top_k` | `5` | Chunks retrieved per query. |
| `business_hours_start` / `_end` | `09:00` / `18:00` | Outside hours → escalate instead of auto-answer. |
| `business_days` | `MON..FRI` | Days the bot auto-answers. |
| `business_name` | — | Injected into the drafter prompt. |
| `escalation_phone` | — | Operator phone for escalations. |

Boot-time knobs live in `.env` (`apps/api`): `CHATBOT_ENABLED`, `CHATBOT_LOG_BODIES`,
`CHATBOT_RETRIEVAL_TOP_K`, `CHATBOT_RETRIEVAL_MIN_SCORE`, `CHATBOT_CHUNK_SIZE_TOKENS`,
`CHATBOT_CHUNK_OVERLAP_TOKENS`, `CHATBOT_CAPTURE_DEDUP_THRESHOLD`,
`CHATBOT_RERANK_ENABLED` / `CHATBOT_RERANK_CANDIDATE_K` / `CHATBOT_RERANK_TOP_N` (relevance reranker;
off by default — prerequisite for `CHATBOT_CONFIDENCE_DECOUPLE_LANG`), `LLM_OLLAMA_*`, `EMBEDDINGS_*`.
`EMBEDDINGS_VECTOR_DIM` (default `1024`) **must not change after first ingestion** — see the runbook's
"Embeddings drift" entry.

---

## Observability

`ChatbotService.handleInbound` emits one structured `[ChatbotService]` line per handled inbound:

```
decision conversationId=<uuid> inboundMessageId=<uuid> decisionKind=AUTO_SEND subKind=consent_offer \
  reason=escalation_offer_sent:no_kb chunksRetrieved=0 topChunkScore= retrievalLatencyMs=18 totalLatencyMs=24
```

- Required fields on every decision-path line: `conversationId`, `inboundMessageId`, `decisionKind`,
  `reason`, `chunksRetrieved`, `topChunkScore`, `totalLatencyMs` (plus `subKind`, `retrievalLatencyMs`).
- A failed dispatch logs `dispatch_failed error=... <fields>` at `error` level.
- **PII:** message bodies are logged **only** when `CHATBOT_LOG_BODIES=true` (off by default).
- Pre-decision guards (`ignored_non_text`, `unknown_contact`) log before a conversation exists, so
  they carry only the fields available at that point.

For aggregate analytics use `GET /api/chatbot/decisions/stats` rather than scraping logs.
