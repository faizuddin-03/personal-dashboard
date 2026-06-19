# Chatbot REST API — Contract

REST surface for the AI chatbot's operator **inbox** and admin **console**. Implemented in
`apps/api/src/chatbot/api/` (controllers + thin query/orchestration services) over the chatbot
domain services. The machine-readable OpenAPI spec is in
[`chatbot-openapi.json`](./chatbot-openapi.json); the live Swagger UI is served at **`/docs`**.

- **Base URL:** `http://<host>:<port>/api` (global prefix `api`).
- **Auth:** every endpoint requires a Bearer JWT — `Authorization: Bearer <accessToken>`.
  Endpoints marked **ADMIN** additionally require the caller's `role` to be `ADMIN`
  (`RolesGuard` + `@Roles('ADMIN')`); all others accept any authenticated operator.
- **Content type:** `application/json` for all bodies except `POST .../documents/upload`
  (`multipart/form-data`).
- **Validation:** request bodies/queries are validated by a global `ValidationPipe`
  (`whitelist: true, transform: true`) — unknown properties are stripped; type/format
  violations return `400`.

## Conventions

### Pagination
List endpoints accept `page` (default 1) and `limit` (per-endpoint default, clamped) and return:

```json
{ "items": [ /* ... */ ], "total": 137, "page": 1, "limit": 20 }
```

### Error shape
- **Validation / not-found / generic** — NestJS default:
  ```json
  { "statusCode": 404, "message": "Document <id> not found", "error": "Not Found" }
  ```
- **Domain conflicts (HTTP 409)** carry a stable `code` so the UI can branch:
  ```json
  { "code": "NO_OPERATOR_REPLY", "message": "Cannot capture a resolution without an operator reply" }
  ```
  Codes used: `INVALID_STATE`, `NO_OPERATOR_REPLY` (close); `INVALID_DRAFT_STATE` (drafts);
  `NOTHING_TO_PROMOTE`, `ALREADY_LIVE`, `DUPLICATE` (capture promote). `DUPLICATE` also includes
  a `duplicate` object.
- **WhatsApp send failure** on manual-reply / draft approve / draft edit → `502 Bad Gateway`
  with the Meta error message.

### Enums
- `ConversationState`: `NEW | AUTO_REPLIED | ESCALATION_OFFERED | ESCALATED | AWAITING_REPLY | REPLIED | RESOLVED`
- `BotDraftState`: `PENDING | APPROVED | EDITED | REJECTED | SENT`
- `ChatbotDecisionKind`: `AUTO_SEND | ESCALATE | IGNORE`
- `KnowledgeDocumentStatus`: `DRAFT | LIVE | ARCHIVED`
- Close/capture `disposition`: `IMPORT_LIVE | SAVE_DRAFT | SKIP`
- Capture `status`: `pending | captured_live | captured_draft | skipped_by_operator | skipped_duplicate | failed | discarded`

---

## INBOX — Conversations
Operator-facing. Guard: **JWT**.

### `GET /api/chatbot/conversations`
List conversations for the inbox.

| Query | Type | Notes |
|-------|------|-------|
| `state` | `ConversationState` | optional filter |
| `assignedToId` | uuid | optional filter |
| `pinned` | boolean | optional filter |
| `search` | string | matches contact name/phone or an inbound message body |
| `page` | int ≥ 1 | default 1 |
| `limit` | int 1–100 | default 20 |

Ordered by `pinned desc, lastInboundAt desc`.

**Response 200**
```json
{
  "items": [
    {
      "id": "8f1c…", "state": "ESCALATED", "pinned": true, "tags": ["vip"],
      "assignedToId": "u-123", "lastInboundAt": "2026-06-10T01:15:00.000Z",
      "detectedLanguage": "EN",
      "contact": { "id": "c-9", "name": "Aisha", "phoneE164": "+60123456789" }
    }
  ],
  "total": 42, "page": 1, "limit": 20
}
```

### `GET /api/chatbot/conversations/:id`
Full thread for the detail view.

**Response 200** — the conversation plus `contact`, `inboundMessages` (asc), `outboundMessages`
(asc), and `botDrafts` (desc, each with `citations`). **404** if not found.

### `PATCH /api/chatbot/conversations/:id`
Update inbox metadata. Body (`UpdateConversationDto`, all optional):

```json
{ "pinned": true, "tags": ["vip", "refund"], "assignedToId": "u-123" }
```
`assignedToId: null` unassigns. **Response 200**: the updated conversation. **404** if not found.

### `POST /api/chatbot/conversations/:id/manual-reply`
Send a free-form operator reply to the customer via WhatsApp and record it (sets state `REPLIED`).

**Request**
```json
{ "body": "Hi Aisha — your replacement ships today, tracking to follow." }
```
**Response 201**
```json
{
  "outboundMessage": {
    "id": "o-77", "conversationId": "8f1c…", "kind": "OPERATOR_REPLY",
    "body": "Hi Aisha — …", "sentByUserId": "u-123",
    "metaMessageId": "wamid.HBg…", "sentAt": "2026-06-10T01:20:00.000Z"
  },
  "conversationId": "8f1c…"
}
```
**404** if not found; **502** if the WhatsApp send fails.

### `POST /api/chatbot/conversations/:id/close`
Resolve the conversation and enqueue resolution capture.

**Request** (`CloseConversationDto`)
```json
{ "disposition": "SAVE_DRAFT", "resolutionNotes": "Replacement issued", "editedAnswer": "For damaged items, reply with your order no. and we’ll ship a replacement." }
```
| Field | Type | Notes |
|-------|------|-------|
| `disposition` | `IMPORT_LIVE \| SAVE_DRAFT \| SKIP` | **required** |
| `resolutionNotes` | string | optional |
| `editedAnswer` | string | optional — authoritative KB content when captured |
| `forcedDespiteDuplicate` | boolean | optional — capture even if a near-duplicate exists |

**Response 201**: `{ "conversation": { …, "state": "RESOLVED" }, "captureId": "rc-1" }`.
**409 `INVALID_STATE`** if the conversation is not `REPLIED`/`ESCALATED`/`AWAITING_REPLY`.
**409 `NO_OPERATOR_REPLY`** for a non-`SKIP` disposition when no operator reply exists.

---

## DRAFTS
The bot's escalation drafts awaiting operator review. Guard: **JWT**.

### `GET /api/chatbot/drafts`
| Query | Type | Notes |
|-------|------|-------|
| `state` | `BotDraftState` | default `PENDING` |
| `conversationId` | uuid | optional |
| `page` / `limit` | int | default 1 / 20 (≤100) |

**Response 200**: `{ items, total, page, limit }` — each draft includes its `conversation`
(with `contact`) and `citations`.

### `POST /api/chatbot/drafts/:id/approve`
Send the draft body to the customer as-is. No request body.
Effect: draft → `SENT` (`approvedByUserId` set); an `OPERATOR_REPLY` outbound is created
(linked via `botDraftId`); conversation → `REPLIED`.

**Response 201**: `{ "draft": { …, "state": "SENT" }, "outbound": { … } }`.
**404** if not found; **409 `INVALID_DRAFT_STATE`** if the draft is not `PENDING`; **502** on WhatsApp failure.

### `POST /api/chatbot/drafts/:id/edit`
Send an edited version. **Request**: `{ "body": "Edited reply text" }`.
Effect: draft → `EDITED` (`editedBody` stored), outbound body = the edited text, conversation → `REPLIED`.
Same response/errors as approve.

### `POST /api/chatbot/drafts/:id/reject`
Discard the draft so the operator will reply manually. No send.
**Request** (optional): `{ "reason": "Tone too formal" }`.
Effect: draft → `REJECTED` (`rejectionReason` stored); conversation → `AWAITING_REPLY`.
**Response 201**: `{ "draft": { …, "state": "REJECTED" } }`. **404**; **409 `INVALID_DRAFT_STATE`**.

---

## DECISIONS
Audit log + analytics over `chatbot_decisions`. Guard: **JWT**.

### `GET /api/chatbot/decisions`
| Query | Type | Notes |
|-------|------|-------|
| `kind` | `ChatbotDecisionKind` | optional |
| `conversationId` | uuid | optional |
| `from` / `to` | ISO‑8601 | optional `created_at` bounds |
| `page` / `limit` | int | default 1 / 50 (≤200) |

**Response 200**: `{ items, total, page, limit }` — each decision includes its `conversation`
(with `contact.name`).

### `GET /api/chatbot/decisions/stats`
Aggregates over the last `days` (query `days`, default 7, 1–90).

**Response 200**
```json
{
  "days": 7,
  "total": 1280,
  "byKind": { "AUTO_SEND": 1040, "ESCALATE": 180, "IGNORE": 60 },
  "autoSendRate": 0.813,
  "escalationRate": 0.141,
  "avgTotalLatencyMs": 1830,
  "avgRetrievalLatencyMs": 240,
  "guardrailFailureCount": 12,
  "dailySeries": [ { "date": "2026-06-04", "count": 190 }, { "date": "2026-06-05", "count": 205 } ]
}
```
Rates are `0` when `total` is `0`. `citationsPerDay`-style "per day" is `count / days`.

---

## KNOWLEDGE (admin)
Guard: **JWT + ADMIN**.

### `GET /api/chatbot/knowledge/documents`
Query: `category?`, `status?` (`KnowledgeDocumentStatus`), `search?`, `page?`, `limit?` (≤100).
**Response 200**: `{ items: KnowledgeDocument[], total, page, limit }`.

### `GET /api/chatbot/knowledge/documents/:id`
**Response 200**: the document plus `chunkCount`. **404** if not found.

### `POST /api/chatbot/knowledge/documents`
**Request** (`CreateDocumentDto`)
```json
{ "name": "shipping_table.md", "title": "Shipping Rates", "category": "Logistics", "contentMd": "# Shipping Rates\n…", "autoIngest": true }
```
`autoIngest` defaults `true` (chunks + embeds immediately). **Response 201**: the `KnowledgeDocument`.
**409** if a document with the same `name` already exists.

### `POST /api/chatbot/knowledge/documents/upload`
`multipart/form-data`. Fields:
- `file` (**required**) — the markdown file. Must end in `.md` or `.markdown`, be **< 1 MB**, and be valid **UTF-8**.
- `category` (optional form field) — defaults to `General`.

The document `name` is the uploaded filename; `title` is the first markdown **H1** (`# …`) if present,
otherwise the filename without extension.

```bash
curl -X POST http://localhost:3000/api/chatbot/knowledge/documents/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@./shipping_table.md" -F "category=Logistics"
```
**Response 201**: the created `KnowledgeDocument`.
**400** if the file is missing, not `.md`/`.markdown`, ≥ 1 MB, or not valid UTF-8.

### `PATCH /api/chatbot/knowledge/documents/:id`
**Request** (`UpdateDocumentDto`, all optional): `name`, `title`, `category`, `contentMd`, `autoIngest`.
Changing `contentMd` re-ingests (unless `autoIngest: false`).
**Response 200**: `{ "document": { … }, "contentChanged": true, "reingested": true }`. **404**.

### `DELETE /api/chatbot/knowledge/documents/:id`
**Response 204**. Chunks and their citations cascade-delete.

### `POST /api/chatbot/knowledge/documents/:id/publish`
Mark `LIVE` (enters retrieval). **Response 200**: the document. **409** if it has no chunks (ingest first).

### `POST /api/chatbot/knowledge/documents/:id/unpublish`
Return to `DRAFT` (removed from retrieval). **Response 200**: the document.

### `POST /api/chatbot/knowledge/documents/:id/reembed`
Re-chunk + re-embed from current content.
**Response 201**: `{ "chunksCreated": 3, "embeddingModel": "ollama-bge-m3", "latencyMs": 412 }`.

### `GET /api/chatbot/knowledge/documents/:id/stats`
Powers the dashboard stat cards. **404** if the document is missing.
```json
{
  "embeddings": 142,
  "citationsPerDay": 84,
  "draftsGroundedPct": 92,
  "recentUses": [
    { "draftId": "bd-1", "intent": "shipping_cost", "draftConfidence": 0.91, "createdAt": "2026-06-10T00:55:00.000Z", "contactName": "Aisha" }
  ]
}
```
- `embeddings` — chunk count for the document.
- `citationsPerDay` — citations to this doc in the last 7 days ÷ 7 (1 dp).
- `draftsGroundedPct` — of all bot drafts in the last 7 days, the % with ≥ 1 citation to this doc.
- `recentUses` — last 10 drafts that cited this doc (with the conversation's contact name).

### `POST /api/chatbot/knowledge/search`
Admin preview of the bot's retriever.
**Request** (`SearchKnowledgeDto`): `{ "query": "do you ship to penang", "topK": 5, "minScore": 0.5, "category": "Logistics" }`.
**Response 201**
```json
{
  "chunks": [
    { "chunkId": "k-1", "text": "…", "tokenCount": 180, "similarityScore": 0.74, "rank": 1,
      "document": { "id": "d-1", "name": "shipping_table.md", "title": "Shipping Rates", "category": "Logistics" } }
  ],
  "embeddingLatencyMs": 120, "searchLatencyMs": 30, "totalLatencyMs": 150,
  "queryEmbeddingModel": "ollama-bge-m3"
}
```

---

## CAPTURES (admin)
Review the resolution captures produced when operators close tickets. Guard: **JWT + ADMIN**.

### `POST /api/chatbot/captures/preview`
Called by the close-ticket modal when it opens.
**Request**: `{ "conversationId": "8f1c…" }`.
**Response 201**
```json
{
  "proposedTitle": "How to get a replacement for a damaged order",
  "proposedContentMd": "# How to get a replacement…\n\n## Question\n\n…\n\n## Answer\n\n…\n",
  "duplicates": [ { "documentId": "d-7", "documentTitle": "Damaged item policy", "similarityScore": 0.88 } ]
}
```
**409 `NO_OPERATOR_REPLY`** if the conversation has no operator reply.

### `GET /api/chatbot/captures`
Query: `status?`, `disposition?`, `from?`/`to?` (ISO‑8601 on `closed_at`), `page?`, `limit?` (≤100).
**Response 200**: `{ items, total, page, limit }` — each capture includes its `document`
(`id,title,status,category`) and `conversation` (`contact.name`). Ordered by `closedAt desc`.

### `GET /api/chatbot/captures/:id`
**Response 200**: the capture plus its `document` and `conversation` (contact + first inbound message).
**404** if not found.

### `POST /api/chatbot/captures/:id/promote`
Promote a captured **DRAFT** doc to **LIVE**. Re-runs dedup against the live KB at promote time,
ingests if the doc has no chunks, then publishes.
**Request** (optional): `{ "forcedDespiteDuplicate": true }`.
**Response 201**: `{ "capture": { …, "status": "captured_live" }, "document": { …, "status": "LIVE" } }`.
- **404** if the capture is missing.
- **409 `NOTHING_TO_PROMOTE`** if the capture has no document (e.g. `SKIP`/`failed`).
- **409 `ALREADY_LIVE`** if already promoted.
- **409 `DUPLICATE`** if a near-duplicate LIVE doc exists and `forcedDespiteDuplicate` is not set:
  ```json
  { "code": "DUPLICATE", "duplicate": { "documentId": "d-7", "documentTitle": "Damaged item policy", "similarityScore": 0.9 } }
  ```

### `POST /api/chatbot/captures/:id/discard`
Archive the captured doc and mark the capture discarded.
**Request** (optional): `{ "reason": "Superseded by the official policy doc" }`.
Effect: the linked document → `ARCHIVED`; capture `status` → `discarded` (the reason is appended to
`resolutionNotes`). **Response 201**: the updated capture. **404** if not found.

---

## SETTINGS (admin)
Guard: **JWT + ADMIN**.

### `GET /api/chatbot/settings`
**Response 200** — every row in `chatbot_settings`, value coerced to its real type:
```json
[
  { "key": "enabled", "value": false, "valueType": "boolean", "description": "Master switch for the chatbot.", "updatedAt": "2026-06-09T12:00:00.000Z" },
  { "key": "confidence_threshold", "value": 0.85, "valueType": "number", "description": "Minimum draft confidence required to auto-send.", "updatedAt": "2026-06-09T12:00:00.000Z" }
]
```

### `PATCH /api/chatbot/settings`
Partial update — only the provided keys are written; `valueType` is inferred from the JS type.
**Request** (`UpdateSettingsDto`, all optional)
```json
{ "enabled": true, "confidence_threshold": 0.9, "business_hours_end": "18:00", "retrieval_top_k": 5 }
```
| Key | Type | Constraint |
|-----|------|-----------|
| `enabled`, `disable_auto_reply` | boolean | |
| `confidence_threshold`, `retrieval_min_score` | number | 0–1 |
| `retrieval_top_k` | number | 1–20 |
| `business_name`, `business_hours_timezone`, `business_days`, `escalation_phone` | string | |
| `business_hours_start` | string | `HH:MM` |
| `business_hours_end` | string | `HH:MM` or `24:00` |

**Response 200**: the full, refreshed settings array (same shape as `GET`).
