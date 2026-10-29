# Wiring the dashboard Knowledge page to the chatbot's knowledge base

**Date:** 2026-06-19
**Branch:** `feat/wiring-knowledge-base` (from `master@c2a130d`)
**Scope:** frontend-only rewire of the dashboard's Knowledge page (and one ticket-page callsite) from the legacy `KnowledgeDoc` endpoints to the chatbot's `KnowledgeDocument` and `ResolutionCapture` endpoints.

## Problem

The dashboard ships a polished `Knowledge.tsx` page at `/knowledge`. The page is wired to `GET /knowledge` (legacy `KnowledgeService.list()`), which reads the `KnowledgeDoc` Prisma model. That model has no production rows: every KB ingestion path — the `ingest-plan-kb.ts` script, the `publish-plan-kb.ts` script, the chatbot's own resolution-capture worker, and the `POST /chatbot/knowledge/documents/upload` endpoint — writes to a different table, `KnowledgeDocument`. As a result, imported `.md` files are invisible in the dashboard even though they are live in the chatbot's RAG. A second wiring gap exists in the "Learned from escalations" tab (legacy `/knowledge/candidates` vs the modern `/chatbot/captures`), and a third in the ticket-page "import to knowledge" action (`/tickets/:id/knowledge-suggestion`, `/knowledge-candidate` — both legacy).

## Goals

1. Show every `KnowledgeDocument` row (LIVE by default; toggleable to All/DRAFT) on the Library tab.
2. Allow admins to upload, view, edit, publish/unpublish, reembed, and delete documents from the dashboard.
3. Replace the "Learned from escalations" tab with a Captures tab backed by `/chatbot/captures`, with promote/discard actions.
4. Rewire the ticket-page "import to knowledge" action to the captures preview/promote flow.
5. Preserve the existing visual style (two-tab shell, card layout, badges, toast pattern, modal style).

## Non-goals

- No backend changes. The `chatbot/api/knowledge.controller`, `chatbot/api/captures.controller`, and capture worker are already in production and untouched.
- No Prisma migration. The legacy `KnowledgeDoc` model and `apps/api/src/knowledge/*` code stay in place; deleting them is a follow-up cleanup PR.
- No semantic-search-preview tool (the `POST /chatbot/knowledge/search` endpoint stays unused by the dashboard).
- No inline per-doc stats in the list view (stats remain available on-demand from the document viewer modal only).
- No rich markdown editor; plain monospace textarea is sufficient.

## Architecture

Purely client-side rewire across one page, two API client modules, and a small patch to one ticket-page callsite.

```
apps/web (dashboard)
  pages/Knowledge.tsx ─┬─► api/knowledge.ts ─► /chatbot/knowledge/...
                       └─► api/captures.ts ─► /chatbot/captures/...
  api/tickets.ts (patch) ─► /chatbot/captures/preview, /promote

apps/api (no changes)
  chatbot/api/knowledge.controller ─► KnowledgeDocument table
  chatbot/api/captures.controller  ─► ResolutionCapture table
```

Status states map:

| Legacy `KnowledgeDoc.status` | New `KnowledgeDocument.status` |
|---|---|
| PUBLISHED | LIVE |
| CANDIDATE | (lives on the capture row: `ResolutionCapture.status=PENDING`) |
| DISMISSED | (lives on the capture row: `ResolutionCapture.status=DISCARDED`) |

The candidate/dismissed lifecycle moves out of the document model entirely; it lives on the capture row, with the underlying document held in DRAFT until promoted. This is already how the production backend works — only the dashboard was unaware.

## Components

### `apps/web/src/api/knowledge.ts` (rewrite)

Replace all functions and types. New surface:

```ts
type DocStatus = 'DRAFT' | 'LIVE';

interface KnowledgeDocument {
  id: string;
  name: string;
  title: string;
  category: string;
  status: DocStatus;
  wordCount: number;
  chunkCount: number;
  embeddingModel: string;
  capturedFromConversationId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface DocumentStats {
  citationsLast30d: number;
  groundedRate: number;
  lastUsedAt: string | null;
}

listDocuments(params: { status?; category?; search?; page?; limit? })   // GET /chatbot/knowledge/documents
getDocument(id)                                                          // GET .../:id
getDocumentStats(id)                                                     // GET .../:id/stats
createDocument(dto)                                                      // POST .../
uploadDocument(file: File, category?: string)                            // POST .../upload (multipart)
updateDocument(id, dto)                                                  // PATCH .../:id
deleteDocument(id)                                                       // DELETE .../:id
publishDocument(id)                                                      // POST .../:id/publish
unpublishDocument(id)                                                    // POST .../:id/unpublish
reembedDocument(id)                                                      // POST .../:id/reembed
```

### `apps/web/src/api/captures.ts` (new)

```ts
type CaptureStatus = 'PENDING' | 'PROMOTED' | 'DISCARDED';

interface ResolutionCapture {
  id: string;
  status: CaptureStatus;
  disposition: string;       // mirror backend's CaptureDisposition enum verbatim
  closedAt: string;
  conversationId: string;
  documentId: string;
  document: { id; title; category; contentMd; status; wordCount; chunkCount };
}

listCaptures(params: { status?; closedAfter?; closedBefore?; page?; limit? })
getCapture(id)
previewCapture(conversationId): { proposedTitle; proposedContentMd; duplicates: [...] }
promoteCapture(id, { forcedDespiteDuplicate?: boolean })
discardCapture(id, reason?: string)
```

The exact backend DTO shapes (enum values, optional fields) must be re-read from `apps/api/src/chatbot/dto/captures.dto.ts` during implementation to avoid drift; this spec lists names and intent, not exact types.

### `apps/web/src/pages/Knowledge.tsx` (rewrite, preserve visual style)

Two tabs in the existing shell:

**Library tab**
- Toolbar: category chips (derived from current page's documents), status chip (Live / Draft / All; default Live), search input, **Upload .md** button (opens `UploadDocumentModal`).
- Card list: per-document card with title, category badge, status badge (LIVE in brand, DRAFT in muted), `{chunkCount} chunks · {wordCount} words`, last-updated date. Per-card actions: View (opens `DocumentViewerModal`), Edit (opens `DocumentEditModal`), Reembed (icon button), Publish / Unpublish (status-dependent).

**Captures tab** (renamed from "Learned from escalations")
- Toolbar status chips: Pending / Promoted / Discarded (default Pending).
- Card list: per-capture card showing the source conversation link, the proposed document's title + first paragraph of `contentMd`, dedup-warning badge when present. Per-card actions: View (opens `CapturePreviewModal`), Promote, Discard.

### New modal components in `apps/web/src/components/knowledge/`

- `DocumentViewerModal.tsx` — read-only markdown render. Header shows title, category, status badge, last updated, chunk count, "View stats" expand (lazy-loads `getDocumentStats`). Footer: Edit, Reembed, Publish/Unpublish, Delete (with typed-confirm). Renderer: if `react-markdown` is already in `apps/web` deps, use it; else `<pre>` block of `contentMd`. (Verify during implementation.)
- `DocumentEditModal.tsx` — title input, category input, `contentMd` markdown textarea (monospace, auto-grow). Save triggers PATCH; backend re-ingests when `contentMd` changes. Toast announces re-embed count from response.
- `UploadDocumentModal.tsx` — drag-drop or file picker for a single `.md`/`.markdown` file <1MB. Category dropdown derived from existing categories with a free-text fallback. Parses the first H1 client-side to preview the resulting title (purely cosmetic; server is authoritative).
- `CapturePreviewModal.tsx` — read-only preview of the capture's `document.title` + `document.contentMd`. Promote / Discard buttons.

### `apps/web/src/api/tickets.ts` patch

- Delete `getKnowledgeSuggestion` and `addKnowledgeCandidate` functions (legacy).
- Find the ticket-page callsite(s) and replace with `previewCapture(conversationId)` + `promoteCapture(captureId)` from `api/captures.ts`. The user-facing UX in the ticket page stays the same — same button label, same modal-or-confirm pattern — only the backend target changes.
- The exact wiring (preview-then-promote vs navigate-to-captures-tab) depends on whether the resolution-capture worker auto-creates captures for every closed conversation, or only when capture-criteria fire. This is resolved during implementation by reading the worker code — both options have a clean UX, the choice is which is closer to "no surprises for the agent."

## Data flow

### Load Library tab

`Knowledge.tsx` mounts → `useQuery(['knowledge', 'documents', filters])` → `listDocuments(filters)` → `GET /chatbot/knowledge/documents`. Default filter on first load: `status=LIVE`. Response shape: `{ items: KnowledgeDocument[], total, page, limit }`. Render card list.

### Upload `.md`

User clicks Upload → `UploadDocumentModal` → selects file → client previews H1-as-title → user chooses category → submits. `uploadDocument(file, category)` posts multipart to `POST /chatbot/knowledge/documents/upload`. Backend validates (extension, size, UTF-8), extracts H1 title (or falls back to filename), runs `autoIngest` (chunk + embed), returns the created document (`status=DRAFT`, `chunkCount>0`). Modal closes, `['knowledge', 'documents']` invalidates, toast: "Uploaded — review and publish."

**Why dashboard upload lands in DRAFT, not LIVE:** the existing seeding scripts (`ingest-plan-kb.ts` / `publish-plan-kb.ts`) explicitly call publish after ingest, because they're a curated bulk path. The dashboard upload is ad-hoc, so a review step before going LIVE is safer. User clicks Publish on the resulting card to flip to LIVE.

### Edit a document

User clicks Edit → `DocumentEditModal` prefills from `getDocument(id)`. Save → `updateDocument(id, dto)` → `PATCH /chatbot/knowledge/documents/:id`. If `contentMd` changed, backend re-runs ingestion (chunks rebuilt). Invalidate document list + the single-doc query. Toast announces re-embed.

### Captures tab — promote

`listCaptures({status: 'PENDING'})` → render cards. Promote → `POST /chatbot/captures/:id/promote`. Two outcomes:
- **Success:** capture flips to PROMOTED, underlying document flips to LIVE. Invalidate `['chatbot', 'captures']` and `['knowledge', 'documents']`. Toast: "Promoted to knowledge base."
- **409 duplicate:** server returns `{ duplicate: { id, title } }`. Dashboard shows confirm dialog: "A LIVE document with similar content already exists: \"X\". Promote anyway?" → on confirm, retry with `{ forcedDespiteDuplicate: true }`.

Discard → confirm with optional reason → `POST /:id/discard` → invalidate captures.

### Ticket → "import to knowledge"

Agent clicks Import on a closed ticket. The exact flow is decided during implementation based on the resolution-capture worker's behaviour:
- **If the worker auto-creates a capture for every closed conversation:** the Import button navigates to the Captures tab filtered to that conversation, agent promotes from there.
- **If the worker only fires conditionally:** the Import button calls `previewCapture(conversationId)` → shows inline preview → on confirm, calls `promoteCapture(...)` (which requires the capture already exists — so we may need an additional API call to *create* the capture; this is the variant requiring backend confirmation during implementation).

Either way, the user-facing button stays where it is, with the same label.

### Cache invalidation summary

| Mutation | Invalidate |
|---|---|
| create / upload / update / publish / unpublish / delete / reembed doc | `['knowledge', 'documents']`, `['knowledge', 'document', id]` |
| promote / discard capture | `['chatbot', 'captures']`, `['knowledge', 'documents']` (promote creates a LIVE doc) |
| stats fetch | own key, no invalidation |

## Error handling

| Action | Failure | UX |
|---|---|---|
| List documents | network / 5xx | Empty state with retry button; React-Query auto-retries 3× |
| Upload `.md` | 400 (extension / size / UTF-8) | Inline error in modal — render backend's `BadRequestException.message` verbatim |
| Upload `.md` | 409 filename collision (`@@unique name`) | Inline error: "A document named `foo.md` already exists — rename or delete the existing one" |
| Edit / update | 4xx validation | Inline field-level error if available; else toast |
| Publish | 422 (no chunks) | Toast: "Can't publish — document has no embedded chunks. Try Reembed first." |
| Reembed | 5xx (embeddings service down) | Toast: "Reembed failed — embeddings service unreachable. Try again." |
| Delete | preflight confirm | Typed-confirm dialog if pattern exists in app; else simple confirm |
| Promote capture | 409 duplicate | Two-stage promote with `forcedDespiteDuplicate` retry |

Auth: page route is already `adminOnly: true` (`apps/web/src/lib/roles.ts:24`); JWT-expiry 401 handling lives in the existing axios interceptor. Server is always authoritative for validation; frontend pre-checks are cosmetic.

**Explicitly not handled:** optimistic locking on edits (last-write-wins; low contention, admin-only), partial-failure mid-upload (a doc created in DRAFT with `chunkCount=0` shows up correctly and disables Publish until Reembed succeeds — already the backend's behaviour).

## Testing

### Frontend unit tests (vitest)

| Target | Cases |
|---|---|
| `api/knowledge.ts` | URL + params for each function (mock axios) |
| `api/captures.ts` | URL + params for each function |
| `Knowledge.tsx` Library tab | renders from mocked `listDocuments`; status chip re-queries with correct params; search debounces; empty state; filter combinators (status + category + search) |
| `Knowledge.tsx` Captures tab | renders captures; promote button calls `promoteCapture`; 409-duplicate path triggers confirm + retry with `forcedDespiteDuplicate` |
| `DocumentEditModal` | reembed toast on `contentMd` change; no reembed when only title/category changes |
| `UploadDocumentModal` | client validation (extension, size); H1-preview parse |

### Backend tests

No new tests. Existing specs for `chatbot/api/knowledge.controller.spec.ts`, `chatbot/api/captures.controller.spec.ts`, `chatbot/knowledge/document.service.spec.ts`, `chatbot/knowledge/resolution-capture.service.spec.ts` already cover the endpoints.

### Manual verification

Run in the worktree against a local API + DB or the live dev DB:
1. Confirm `KnowledgeDocument` rows exist (seed if needed).
2. `pnpm dev` → Knowledge page → confirm cards render (the original bug is gone).
3. Upload a small `.md` → card appears with DRAFT + `chunkCount>0`; Publish flips to LIVE.
4. Captures tab → confirm any captured-from-resolution rows render, or the empty state is correct.
5. From a closed ticket, click Import to knowledge → confirm the new preview/promote flow works.

### Regression boundary

`apps/api/src/knowledge/*` and the `KnowledgeDoc` table stay untouched. A greppy sanity pass during implementation confirms no other dashboard module hits the legacy endpoints (audit already showed only `Knowledge.tsx` and the `tickets.ts` two functions do).

## Implementation order (rough)

1. Rewrite `api/knowledge.ts` (typed surface for the new endpoints) + tests.
2. Add `api/captures.ts` + tests.
3. Build modal components in `components/knowledge/`.
4. Rewrite `Knowledge.tsx` against the new APIs and modals.
5. Patch `api/tickets.ts` + the ticket-page callsite (after confirming the worker behaviour for the import flow).
6. Delete the now-orphaned `getKnowledgeSuggestion` / `addKnowledgeCandidate` and their tests.
7. Manual smoke per the verification list.

Tracked in detail by the writing-plans handoff that follows this spec.

## Open questions (to resolve during implementation, not now)

- Does the resolution-capture worker auto-create a capture for every closed conversation, or only when criteria fire? Decides the ticket-import flow variant.
- Is `react-markdown` already in `apps/web` deps, or do we need a `<pre>` fallback for the viewer? (Verify in package.json; small either way.)
- What is the exact field name for the "promoted-anyway" flag on the backend DTO (`forcedDespiteDuplicate` vs another name)? Re-read `apps/api/src/chatbot/dto/captures.dto.ts` before wiring.

## Out of scope (follow-up branches)

- Delete `apps/api/src/knowledge/*`, drop the `KnowledgeDoc` Prisma model and migration. Small cleanup; deferred so this branch stays focused.
- A semantic-search-preview tool in the dashboard using `POST /chatbot/knowledge/search`. Useful for admins debugging retrieval, but not blocking.
- Inline per-doc stats in the list (citations/day badge) — would multiply queries; revisit if needed.
- Rich markdown editor (toolbar, live preview side-by-side). The textarea is enough for now.

## Implementation deltas (2026-06-19, pre-flight)

The following corrections were applied during plan-writing after reading the production code. They refine but do not invalidate the design.

- **No frontend test framework.** `apps/web/package.json` has no vitest/jest/testing-library. The "Testing" section's vitest plan is dropped. Verification gate per task is `pnpm --filter web build` (typecheck) + a manual smoke pass after the page rewrite. Setting up vitest is a separate follow-up.
- **Capture status has 7 values, not 3.** Backend enum (`apps/api/src/chatbot/dto/captures.dto.ts`): `pending` / `captured_live` / `captured_draft` / `skipped_by_operator` / `skipped_duplicate` / `failed` / `discarded`. Dashboard exposes three user-facing buckets:
  - **Pending** = `pending`
  - **Captured** = `captured_live` + `captured_draft`
  - **Archived** = `discarded` + `skipped_by_operator` + `skipped_duplicate` + `failed`
- **Document status has 3 values, not 2.** `DRAFT` / `LIVE` / `ARCHIVED`. Discarding a capture sets the underlying doc to `ARCHIVED`. Library filter chip: All / Live (default) / Draft / Archived.
- **List response does not include `chunkCount`.** Only `GET /chatbot/knowledge/documents/:id` (single-doc) returns chunkCount. Library card list omits it; the viewer modal shows it.
- **`KnowledgeStats` shape:** real fields are `embeddings`, `citationsPerDay`, `draftsGroundedPct`, `recentUses[]` (each `{ draftId, intent, draftConfidence, createdAt, contactName }`).
- **No `react-markdown` in deps.** The viewer renders the markdown body in a `<pre>` block with monospace styling. Add a proper renderer in a follow-up if desired.
- **Item 3 (ticket-import action) is out of scope for this branch.** The legacy `SaveToKnowledgeModal` calls `/tickets/:id/knowledge-candidate`, which still writes to the empty legacy `KnowledgeDoc` table. The proper rewire requires the operator's disposition (`IMPORT_LIVE` / `SAVE_DRAFT` / `SKIP`) to be persisted on the auto-created `ResolutionCapture` row at ticket-close time. That needs a backend change to `/tickets/:id/close` (or a new endpoint) and is deferred to a follow-up branch.

**Confirmed (resolves earlier open questions):**
- ✅ `ConversationService.close()` auto-creates a `ResolutionCapture` with `status='pending'` and a disposition for the worker to act on.
- ✅ `POST /chatbot/captures/:id/promote` 409 error codes: `DUPLICATE` (with `duplicate: { documentId, documentTitle, similarityScore }`), `NOTHING_TO_PROMOTE`, `ALREADY_LIVE`.
- ✅ The "promote despite duplicate" flag is exactly `forcedDespiteDuplicate: boolean`.
