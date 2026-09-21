# Chatbot Runbook

Operational playbook for the AI chatbot module. For *what it is* and *how to enable/tune* see
[README-chatbot.md](./README-chatbot.md); for *how it works* see
[chatbot-architecture.md](./chatbot-architecture.md).

---

## Quick reference

| Action | Command |
|---|---|
| **Roll back fast (hot)** | `PATCH /api/chatbot/settings { "disable_auto_reply": true }` → next inbound escalates. |
| **Roll back clean (cold)** | `CHATBOT_ENABLED=false` in `apps/api/.env` + restart API. |
| **Re-enable** | `disable_auto_reply=false` (hot) and/or `CHATBOT_ENABLED=true` + restart. |
| **Fewer auto-sends** | `PATCH /api/chatbot/settings { "confidence_threshold": "0.92" }` |
| **Stricter retrieval** | `PATCH /api/chatbot/settings { "retrieval_min_score": "0.65" }` |
| **Inspect recent decisions** | `GET /api/chatbot/decisions?from=&to=` and `GET /api/chatbot/decisions/stats` |
| **Verify Ollama** | `ollama list` · `curl http://<host>:11434/api/tags` |
| **Capture queue depth** | `redis-cli LLEN bull:chatbot-resolution-capture:wait` |

Two gates must both be on to auto-reply: **`CHATBOT_ENABLED=true`** (env; webhook bridge) **and**
**`enabled=true`** (`chatbot_settings`; engine). The **`disable_auto_reply`** kill switch overrides
both — when true, every decision becomes `ESCALATE / kill_switch_active`.

---

## Kill-switch test

Verifies that the hot kill switch takes effect without a deploy.

**Automated** (runs in mock; part of the soak):

```bash
LLM_MOCK_MODE=true EMBEDDINGS_MOCK_MODE=true pnpm --filter api chatbot:soak
# → summary line: [PASS] Kill switch → ESCALATE/kill_switch_active
```

**Manual** (against a running API):

1. Ensure the bot auto-replies: `CHATBOT_ENABLED=true`, `enabled=true`, `disable_auto_reply=false`.
   Send a webhook for an OPTED_IN contact and confirm an AUTO_SEND decision:
   ```bash
   pnpm --filter api exec ts-node scripts/post-mock-webhook.ts 60123456789 "What time do you open?"
   curl -s "$API/api/chatbot/decisions?limit=1" -H "Authorization: Bearer $JWT" | jq '.items[0] | {kind, reason}'
   # → { "kind": "AUTO_SEND", ... }
   ```
2. Flip the kill switch:
   ```bash
   curl -s -X PATCH "$API/api/chatbot/settings" -H "Authorization: Bearer $JWT" \
     -H 'content-type: application/json' -d '{"disable_auto_reply": true}'
   ```
3. Send another webhook and confirm the next decision escalated:
   ```bash
   pnpm --filter api exec ts-node scripts/post-mock-webhook.ts 60123456789 "What time do you open?"
   curl -s "$API/api/chatbot/decisions?limit=1" -H "Authorization: Bearer $JWT" | jq '.items[0] | {kind, reason}'
   # → { "kind": "ESCALATE", "reason": "kill_switch_active" }
   ```

The `PATCH` invalidates the settings cache immediately, so the change applies on the **very next**
inbound. The "within 60s" figure is the worst case — the settings cache TTL — and only applies if
the row is changed directly in the DB, bypassing the API. Re-enable with `disable_auto_reply=false`.

---

## Incident playbook

### "Chatbot replying with wrong info"
Fix the **source document**, not the bot.
1. Find the decision: `GET /api/chatbot/decisions?from=&to=`. Look at `topChunkScore`,
   `chunksRetrieved`, `embeddingModelUsed`; open the linked `bot_draft` to see its citations.
2. If the wrong chunks were retrieved → improve/split the source document into more focused docs.
3. If the cited chunk traces to a **captured ticket** (`KnowledgeDocument.category="Resolved
   tickets"`): either clean it up via `PATCH /api/chatbot/knowledge/documents/:id` (edit `contentMd`
   — auto re-ingests) or take it out of RAG via `POST /api/chatbot/knowledge/documents/:id/unpublish`
   (LIVE → DRAFT). To remove a bad captured doc entirely, `POST /api/chatbot/captures/:id/discard`
   (→ KnowledgeDocument `ARCHIVED`).

### "Chatbot stopped replying"
Check, in order:
1. `CHATBOT_ENABLED=true` (env) and `enabled=true` (`chatbot_settings`).
2. Kill switch: `disable_auto_reply` is not `true`.
3. **Ollama**: `ollama list` (chat + `bge-m3` present and downloaded), `curl http://<host>:11434/api/tags`.
4. Meta access token valid (`WHATSAPP_ACCESS_TOKEN`).

There is **no cloud-LLM fallback by design**, so any Ollama outage surfaces in
`GET /api/chatbot/decisions` as `ESCALATE / safety_escalate` with `reason=llm_exhausted` (chat down)
or `reason=embeddings_exhausted` (embedding endpoint down). Customers still get routed to a human;
nothing is silently dropped.

### "Keeps asking 'want customer support?' for things it should know"
The engine emitted `consent_offer` (KB miss or low draft confidence). Check:
1. The relevant `KnowledgeDocument` is `status=LIVE` (not `DRAFT`) — `GET /api/chatbot/knowledge/documents?status=DRAFT`.
2. `retrieval_min_score` isn't set too high (default `0.5`).
3. If `topChunkScore` is consistently low (< 0.6) for that topic → add a more specific source doc.

### "Capture job stuck / not creating docs"
1. Queue health: `redis-cli LLEN bull:chatbot-resolution-capture:wait`. A backlog means the worker
   isn't running — start it: `pnpm --filter api start:worker`.
2. Check worker logs for the most recent `CaptureProcessor` line.
3. A `ResolutionCapture` row stuck at `status='pending'` for > 5 min indicates a problem.
4. `status='failed'` rows carry the cause in `failureReason` (common: embedding endpoint down at
   capture time, or a malformed conversation with no operator reply). Inspect via
   `GET /api/chatbot/captures?status=failed`. Re-enqueue by inserting a new BullMQ job with the same
   `resolutionCaptureId` once the underlying issue is fixed.

### "Captured doc was wrong"
`POST /api/chatbot/captures/:id/discard` → the underlying `KnowledgeDocument` becomes `ARCHIVED`
(no longer queryable by RAG; the capture row is kept for audit). To replace with a corrected
version: discard, then create a fresh doc via the Knowledge admin.

### "Orphaned DRAFT doc from a failed capture"
Known limitation: if `ingest()` throws *after* the `KnowledgeDocument` row was committed, the capture
is `status='failed'` but a chunk-less document row remains for inspection. Clean up with
`DELETE /api/chatbot/knowledge/documents/:id`.

### "Embeddings drift"
After changing `EMBEDDINGS_VECTOR_DIM` or the embedding model, the stored vectors no longer match
query vectors — you must re-embed every LIVE document:
```bash
curl -s "$API/api/chatbot/knowledge/documents?status=LIVE" -H "Authorization: Bearer $JWT" \
  | jq -r '.items[].id' \
  | xargs -I{} curl -s -X POST "$API/api/chatbot/knowledge/documents/{}/reembed" -H "Authorization: Bearer $JWT"
```
If the **dimension** changed, the `embedding vector(N)` column must be dropped and recreated first.
`EMBEDDINGS_VECTOR_DIM` (default `1024`) should be treated as immutable after first ingestion.

### "Citations from re-ingest are lost"
Expected trade-off. Re-ingesting a document deletes its old chunks, which cascade-deletes their
`BotDraftCitation` rows — so the per-document "citations/day" metric resets after a re-embed. The
replies that were already sent are unaffected.

### "How to roll back"
- **Fast:** `PATCH /api/chatbot/settings { "disable_auto_reply": true }` — within one inbound, every
  decision becomes `ESCALATE / kill_switch_active`.
- **Clean:** `CHATBOT_ENABLED=false` in `.env` + restart API.

---

## Diagnosing a wrong / low-quality answer (detailed)

1. Find the decision: `GET /api/chatbot/decisions?from=&to=` (filter by `intent`/`kind` as needed).
2. Inspect `topChunkScore`, `chunksRetrieved`, `embeddingModelUsed`, then open the `bot_draft` to see
   its citations.
3. **Wrong chunks retrieved** → improve the source document, or split it into more focused docs.
4. **Right chunks, wrong reply** → the drafter prompt may need tuning; consider raising
   `confidence_threshold` so borderline drafts become `consent_offer` instead of auto-sending.
5. **`topChunkScore` low (< 0.6)** → a knowledge gap; add a doc covering the topic.
6. **Cited chunk is a captured ticket** (`category="Resolved tickets"`) → a low-quality resolution
   may have been promoted; `POST /api/chatbot/captures/:id/discard` to archive it.

---

## Resolution-capture workflow (admin)

When an operator closes an escalated ticket (`POST /conversations/:id/close`):

- **`IMPORT_LIVE`** → the captured doc goes **LIVE** immediately; RAG picks it up on the next matching
  query.
- **`SAVE_DRAFT`** → captured as a DRAFT for review. Admin reviews via
  `GET /api/chatbot/captures?status=captured_draft` (ordered by `closedAt` desc), inspects the
  proposed title + `contentMd` + similarity warnings + source conversation, then:
  - `POST /api/chatbot/captures/:id/promote` — re-runs dedup against the **current** LIVE KB and
    flips the doc DRAFT → LIVE. Returns `409 DUPLICATE_AT_PROMOTE_TIME` if a near-duplicate appeared
    since capture; force with `?force=true`.
  - `POST /api/chatbot/captures/:id/discard` — archives the doc.
- **`SKIP`** → captures nothing (`status='skipped_by_operator'`).

Promoted docs become LIVE; RAG uses them on the next matching query. Failed captures
(`GET /api/chatbot/captures?status=failed`) show the cause in `failureReason`.

> Captured DRAFTs are **never** auto-promoted on a schedule — an admin always promotes manually
> (design decision). The consent flow uses keyword-based YES/NO detection, not an LLM (design
> decision).

---

## Verification & smoke tools

- **Unit/integration tests:** `pnpm --filter api test`
- **CLI simulator:** `pnpm --filter api chatbot:sim` (interactive) or `... chatbot:sim -- --file=msgs.json` (batch)
- **Soak test:** `LLM_MOCK_MODE=true EMBEDDINGS_MOCK_MODE=true pnpm --filter api chatbot:soak`
  - Hard gates: 0 unhandled exceptions; p95 decision total < 5s (mock) / < 12s (real Ollama); p95
    retrieval < 500ms; per-scenario opt-out/complaint/consent assertions; close-ticket capture
    assertions (`captured_live`/`captured_draft`/`skipped_by_operator` + new-doc count).
  - Distribution (`rag_answer`/`consent_offer`/…) is **informational** — `rag_answer` and
    `out_of_hours` are unreachable under the deterministic mock adapters and appear only against real
    models with a populated KB.
- **Signed webhook:** `pnpm --filter api exec ts-node scripts/post-mock-webhook.ts <e164NoPlus> "<text>"`

---

## Known limitations

- No cloud-LLM fallback — Ollama outages escalate (`llm_exhausted` / `embeddings_exhausted`).
- Re-ingest resets per-document citation metrics (citations cascade-delete with their chunks).
- A capture that fails after the document row commits leaves a chunk-less orphan DRAFT for cleanup.
- `EMBEDDINGS_VECTOR_DIM` is effectively immutable after first ingestion (changing it requires a full
  re-embed and a column rebuild).
- Single tenant; text only; no media, reranking, or hybrid search (Phase 2).
