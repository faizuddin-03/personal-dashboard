# Wiring the Knowledge dashboard to the chatbot KB — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewire `/knowledge` page (and its Captures-equivalent tab) from the empty legacy `KnowledgeDoc` endpoints to the chatbot's production `KnowledgeDocument` + `ResolutionCapture` endpoints, so imported `.md` files become visible and manageable from the dashboard.

**Architecture:** Frontend-only change. Two backend surfaces — `/chatbot/knowledge` and `/chatbot/captures` — already exist and are unchanged. Three new dashboard files, two rewrites, no Prisma migration.

**Tech Stack:** React 18, TypeScript, `@tanstack/react-query` 5, axios, vite. **No test framework in `apps/web`** — verification gates use `pnpm --filter web build` (which runs `tsc`) + manual smoke against a running dev stack.

**Branch:** `feat/wiring-knowledge-base` (worktree at `/Users/modefair/whatsapp-blasting/.worktrees/wiring-knowledge-base/`)

---

## Spec deltas (pre-flight findings, baked into this plan)

| Spec said | Reality | Plan impact |
|---|---|---|
| vitest unit tests | No test framework in `apps/web` | Manual smoke only; `tsc` is the gate between tasks. |
| Capture status: 3 values | 7 values: `pending` / `captured_live` / `captured_draft` / `skipped_by_operator` / `skipped_duplicate` / `failed` / `discarded` | 3 user-facing buckets (Pending / Captured / Archived) map to these. |
| Doc status: DRAFT/LIVE | DRAFT / LIVE / **ARCHIVED** (third state used by capture-discard) | Status filter chip exposes 4 options: All / Live (default) / Draft / Archived. |
| `react-markdown` for viewer | Not in `apps/web` deps | Use `<pre>` block with monospace styling. Add proper renderer in a follow-up. |
| List response includes chunkCount | List returns raw `KnowledgeDocument[]` — chunkCount only on `GET /:id` | Library card omits chunkCount; viewer modal shows it. |
| `KnowledgeStats` fields | Actually `embeddings` / `citationsPerDay` / `draftsGroundedPct` / `recentUses[]` (not the spec's guess) | Use the real names. |
| Item 3 (ticket-import) in scope | Requires backend change (close-with-disposition) | **Out of scope** — `SaveToKnowledgeModal` stays as-is; defer to a follow-up branch. |

---

## File structure

| Path | Action | Responsibility |
|---|---|---|
| `apps/web/src/api/knowledge.ts` | rewrite | Typed axios client for `/chatbot/knowledge/documents` (11 functions) |
| `apps/web/src/api/captures.ts` | create | Typed axios client for `/chatbot/captures` (5 functions) |
| `apps/web/src/components/knowledge/DocumentViewerModal.tsx` | create | Read-only doc view: title, metadata, chunkCount, markdown body in `<pre>`, action buttons |
| `apps/web/src/components/knowledge/DocumentEditModal.tsx` | create | Edit title/category/contentMd; Save → PATCH; toast on re-embed |
| `apps/web/src/components/knowledge/UploadDocumentModal.tsx` | create | File picker → `POST /upload` (multipart) |
| `apps/web/src/components/knowledge/CapturePreviewModal.tsx` | create | View capture's document content; Promote / Discard buttons |
| `apps/web/src/pages/Knowledge.tsx` | rewrite | Two tabs: Library (LIVE/DRAFT/ARCHIVED docs) + Captures (pending/captured/archived captures) |
| `docs/superpowers/specs/2026-06-19-wiring-knowledge-base-design.md` | edit | Add an "Implementation deltas (2026-06-19)" footer documenting the trimmed scope |

**Files explicitly NOT touched:** `apps/web/src/api/tickets.ts`, `apps/web/src/pages/inbox/SaveToKnowledgeModal.tsx`, `apps/api/src/knowledge/*`, prisma schema.

---

## Task 1: Update the spec with the pre-flight deltas

**Files:**
- Modify: `docs/superpowers/specs/2026-06-19-wiring-knowledge-base-design.md` (append a section)

- [ ] **Step 1: Append "Implementation deltas (2026-06-19)" section**

Open the spec and append at the bottom (after the "Out of scope" section):

```markdown
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
```

- [ ] **Step 2: Verify the spec file was modified correctly**

Run: `git diff docs/superpowers/specs/2026-06-19-wiring-knowledge-base-design.md`
Expected: a single appended section; no other text changed.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-06-19-wiring-knowledge-base-design.md
git commit -m "docs(knowledge): record pre-flight deltas on wiring spec"
```

---

## Task 2: Rewrite `apps/web/src/api/knowledge.ts` for the new endpoints

**Files:**
- Rewrite: `apps/web/src/api/knowledge.ts`

- [ ] **Step 1: Replace the file's entire contents**

Write to `apps/web/src/api/knowledge.ts`:

```ts
import { api } from './client';

export type DocStatus = 'DRAFT' | 'LIVE' | 'ARCHIVED';

export interface KnowledgeDocument {
  id: string;
  name: string;
  title: string;
  category: string;
  contentMd: string;
  wordCount: number;
  status: DocStatus;
  embeddingModel: string;
  capturedFromConversationId: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentDetail extends KnowledgeDocument {
  chunkCount: number;
}

export interface ListDocumentsParams {
  category?: string;
  status?: DocStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ListDocumentsResult {
  items: KnowledgeDocument[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateDocumentDto {
  name: string;
  title: string;
  category: string;
  contentMd: string;
  autoIngest?: boolean;
}

export interface UpdateDocumentDto {
  name?: string;
  title?: string;
  category?: string;
  contentMd?: string;
  autoIngest?: boolean;
}

export interface CreateResult {
  document: KnowledgeDocument;
  reingested?: boolean;
}

export interface UpdateResult {
  document: KnowledgeDocument;
  contentChanged: boolean;
  reingested: boolean;
}

export interface KnowledgeRecentUse {
  draftId: string;
  intent: string;
  draftConfidence: number;
  createdAt: string;
  contactName: string | null;
}

export interface KnowledgeStats {
  embeddings: number;
  citationsPerDay: number;
  draftsGroundedPct: number;
  recentUses: KnowledgeRecentUse[];
}

export async function listDocuments(params: ListDocumentsParams = {}): Promise<ListDocumentsResult> {
  const { data } = await api.get<ListDocumentsResult>('/chatbot/knowledge/documents', { params });
  return data;
}

export async function getDocument(id: string): Promise<DocumentDetail> {
  const { data } = await api.get<DocumentDetail>(`/chatbot/knowledge/documents/${id}`);
  return data;
}

export async function getDocumentStats(id: string): Promise<KnowledgeStats> {
  const { data } = await api.get<KnowledgeStats>(`/chatbot/knowledge/documents/${id}/stats`);
  return data;
}

export async function createDocument(dto: CreateDocumentDto): Promise<CreateResult> {
  const { data } = await api.post<CreateResult>('/chatbot/knowledge/documents', dto);
  return data;
}

export async function uploadDocument(file: File, category?: string): Promise<CreateResult> {
  const form = new FormData();
  form.append('file', file);
  if (category) form.append('category', category);
  const { data } = await api.post<CreateResult>('/chatbot/knowledge/documents/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function updateDocument(id: string, dto: UpdateDocumentDto): Promise<UpdateResult> {
  const { data } = await api.patch<UpdateResult>(`/chatbot/knowledge/documents/${id}`, dto);
  return data;
}

export async function deleteDocument(id: string): Promise<void> {
  await api.delete(`/chatbot/knowledge/documents/${id}`);
}

export async function publishDocument(id: string): Promise<KnowledgeDocument> {
  const { data } = await api.post<KnowledgeDocument>(`/chatbot/knowledge/documents/${id}/publish`);
  return data;
}

export async function unpublishDocument(id: string): Promise<KnowledgeDocument> {
  const { data } = await api.post<KnowledgeDocument>(`/chatbot/knowledge/documents/${id}/unpublish`);
  return data;
}

export async function reembedDocument(id: string): Promise<{ chunkCount: number } | KnowledgeDocument> {
  // Backend returns IngestionService.ingest() result. Caller treats opaquely or refetches via getDocument.
  const { data } = await api.post(`/chatbot/knowledge/documents/${id}/reembed`);
  return data;
}
```

> **Implementation notes for the engineer:** the `CreateResult` / `UpdateResult` shapes are based on reading `apps/api/src/chatbot/knowledge/document.service.ts:62-133`. If a runtime call surfaces a different field name (e.g. the create endpoint returns just `KnowledgeDocument` directly), narrow the type to match — these are TypeScript-only and won't be runtime-validated.

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter web build`
Expected: type errors will surface in `apps/web/src/pages/Knowledge.tsx` (because the old function names no longer exist). This is expected — Task 8 fixes them. Don't worry about errors in `Knowledge.tsx`; only confirm there are no errors **inside `api/knowledge.ts` itself**.

A focused check: `pnpm --filter web exec tsc --noEmit src/api/knowledge.ts` (if isolatedModules permits, otherwise rely on the full build catching nothing inside this file).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/api/knowledge.ts
git commit -m "feat(knowledge): typed client for /chatbot/knowledge/documents

Replaces the legacy /knowledge KnowledgeDoc client. Knowledge.tsx will
break at this commit; Task 8 rewrites it against the new client."
```

---

## Task 3: Create `apps/web/src/api/captures.ts`

**Files:**
- Create: `apps/web/src/api/captures.ts`

- [ ] **Step 1: Write the file**

```ts
import { api } from './client';
import type { DocStatus } from './knowledge';

export type CaptureStatus =
  | 'pending'
  | 'captured_live'
  | 'captured_draft'
  | 'skipped_by_operator'
  | 'skipped_duplicate'
  | 'failed'
  | 'discarded';

export type CaptureDisposition = 'IMPORT_LIVE' | 'SAVE_DRAFT' | 'SKIP';

export type CaptureBucket = 'pending' | 'captured' | 'archived';

export const CAPTURE_STATUSES_BY_BUCKET: Record<CaptureBucket, CaptureStatus[]> = {
  pending: ['pending'],
  captured: ['captured_live', 'captured_draft'],
  archived: ['discarded', 'skipped_by_operator', 'skipped_duplicate', 'failed'],
};

export interface CaptureDocumentSummary {
  id: string;
  title: string;
  category: string;
  status: DocStatus;
}

export interface CaptureContactSummary {
  name: string | null;
}

export interface CaptureConversationSummary {
  id: string;
  contact: CaptureContactSummary | null;
}

export interface ResolutionCapture {
  id: string;
  status: CaptureStatus;
  disposition: CaptureDisposition;
  closedAt: string;
  conversationId: string;
  documentId: string | null;
  duplicateOfId: string | null;
  forcedDespiteDuplicate: boolean;
  failureReason: string | null;
  resolutionNotes: string | null;
  closedByUserId: string;
  editedAnswer: string | null;
  createdAt: string;
  updatedAt: string;
  document: CaptureDocumentSummary | null;
  conversation: CaptureConversationSummary | null;
}

export interface ListCapturesParams {
  status?: CaptureStatus;
  disposition?: CaptureDisposition;
  from?: string;   // ISO-8601
  to?: string;     // ISO-8601
  page?: number;
  limit?: number;
}

export interface ListCapturesResult {
  items: ResolutionCapture[];
  total: number;
  page: number;
  limit: number;
}

export interface CapturePreviewResult {
  proposedTitle: string;
  proposedContentMd: string;
  duplicates: Array<{ documentId: string; documentTitle: string; similarityScore: number }>;
}

export interface PromoteCaptureResult {
  capture: ResolutionCapture;
  document: import('./knowledge').KnowledgeDocument;
}

export interface DuplicateConflictBody {
  code: 'DUPLICATE';
  duplicate: {
    documentId: string;
    documentTitle: string;
    similarityScore: number;
  };
  message?: string;
}

export async function listCaptures(params: ListCapturesParams = {}): Promise<ListCapturesResult> {
  const { data } = await api.get<ListCapturesResult>('/chatbot/captures', { params });
  return data;
}

export async function getCapture(id: string): Promise<ResolutionCapture> {
  const { data } = await api.get<ResolutionCapture>(`/chatbot/captures/${id}`);
  return data;
}

export async function previewCapture(conversationId: string): Promise<CapturePreviewResult> {
  const { data } = await api.post<CapturePreviewResult>('/chatbot/captures/preview', { conversationId });
  return data;
}

export async function promoteCapture(
  id: string,
  opts: { forcedDespiteDuplicate?: boolean } = {},
): Promise<PromoteCaptureResult> {
  const { data } = await api.post<PromoteCaptureResult>(`/chatbot/captures/${id}/promote`, opts);
  return data;
}

export async function discardCapture(id: string, reason?: string): Promise<ResolutionCapture> {
  const { data } = await api.post<ResolutionCapture>(`/chatbot/captures/${id}/discard`, { reason });
  return data;
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter web build`
Expected: no new errors inside `captures.ts`. Existing `Knowledge.tsx` errors from Task 2 still present — ignore.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/api/captures.ts
git commit -m "feat(knowledge): add typed client for /chatbot/captures"
```

---

## Task 4: Create `DocumentViewerModal`

**Files:**
- Create: `apps/web/src/components/knowledge/DocumentViewerModal.tsx`

- [ ] **Step 1: Write the file**

```tsx
import { useQuery } from '@tanstack/react-query';
import {
  getDocument,
  getDocumentStats,
  type DocumentDetail,
  type KnowledgeStats,
} from '../../api/knowledge';
import Modal from '../Modal';
import { Badge } from '../ui/Badge';

interface Props {
  documentId: string | null;
  onClose: () => void;
  onEdit: (doc: DocumentDetail) => void;
  onReembed: (doc: DocumentDetail) => void;
  onTogglePublish: (doc: DocumentDetail) => void;
  onDelete: (doc: DocumentDetail) => void;
}

function statusTone(status: DocumentDetail['status']) {
  if (status === 'LIVE') return 'brand';
  if (status === 'DRAFT') return 'neutral';
  return 'neutral';
}

export function DocumentViewerModal({
  documentId,
  onClose,
  onEdit,
  onReembed,
  onTogglePublish,
  onDelete,
}: Props) {
  const open = documentId !== null;

  const { data: doc, isLoading } = useQuery<DocumentDetail>({
    queryKey: ['knowledge', 'document', documentId],
    queryFn: () => getDocument(documentId as string),
    enabled: open,
  });

  const { data: stats } = useQuery<KnowledgeStats>({
    queryKey: ['knowledge', 'document', documentId, 'stats'],
    queryFn: () => getDocumentStats(documentId as string),
    enabled: open && !!doc,
  });

  return (
    <Modal open={open} title={doc?.title ?? 'Document'} onClose={onClose}>
      {isLoading || !doc ? (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-faint)' }}>Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 520 }}>
          {/* Metadata strip */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <Badge tone={statusTone(doc.status)}>{doc.status}</Badge>
            <Badge tone="neutral">{doc.category}</Badge>
            <span style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>
              {doc.chunkCount} chunks · {doc.wordCount} words
            </span>
            <span style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>
              updated {new Date(doc.updatedAt).toLocaleString('en-GB')}
            </span>
          </div>

          {/* Markdown body (pre-formatted, monospace) */}
          <pre
            style={{
              maxHeight: 360,
              overflow: 'auto',
              padding: 12,
              borderRadius: 8,
              background: 'var(--bg-subtle)',
              border: '1px solid var(--line)',
              fontSize: 12,
              lineHeight: 1.55,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {doc.contentMd}
          </pre>

          {/* Stats (lazy) */}
          {stats && (
            <div
              style={{
                display: 'flex',
                gap: 16,
                padding: '8px 12px',
                borderRadius: 8,
                background: 'var(--brand-soft)',
                fontSize: 12,
              }}
            >
              <span>
                <b>{stats.embeddings}</b> embeddings
              </span>
              <span>
                <b>{stats.citationsPerDay}</b> citations/day (7d avg)
              </span>
              <span>
                <b>{stats.draftsGroundedPct}%</b> of bot drafts ground in this doc (7d)
              </span>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => onDelete(doc)}>
              Delete
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => onReembed(doc)}>
              Re-embed
            </button>
            {doc.status === 'LIVE' ? (
              <button className="btn btn-ghost btn-sm" onClick={() => onTogglePublish(doc)}>
                Unpublish
              </button>
            ) : (
              <button className="btn btn-secondary btn-sm" onClick={() => onTogglePublish(doc)}>
                Publish
              </button>
            )}
            <button className="btn btn-primary btn-sm" onClick={() => onEdit(doc)}>
              Edit
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
```

> **Note:** This uses the existing `<Modal>` and `<Badge tone="...">` components and the `btn` / `chip` CSS classes. The engineer must verify these exist in `apps/web/src/components/` and match the API used here. If the `tone` prop values differ (e.g. `'success'` instead of `'brand'`), adapt; consistency with the existing `Knowledge.tsx` styling is the goal.

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter web build`
Expected: errors confined to `Knowledge.tsx`; this file should compile.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/knowledge/DocumentViewerModal.tsx
git commit -m "feat(knowledge): DocumentViewerModal — read-only doc view with stats"
```

---

## Task 5: Create `DocumentEditModal`

**Files:**
- Create: `apps/web/src/components/knowledge/DocumentEditModal.tsx`

- [ ] **Step 1: Write the file**

```tsx
import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateDocument, type DocumentDetail, type UpdateResult } from '../../api/knowledge';
import Modal from '../Modal';
import { useToast } from '../toast/ToastProvider';

interface Props {
  document: DocumentDetail | null;
  onClose: () => void;
}

export function DocumentEditModal({ document, onClose }: Props) {
  const qc = useQueryClient();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [contentMd, setContentMd] = useState('');

  useEffect(() => {
    if (document) {
      setTitle(document.title);
      setCategory(document.category);
      setContentMd(document.contentMd);
    }
  }, [document]);

  const saveMut = useMutation<UpdateResult, Error, void>({
    mutationFn: () => {
      if (!document) throw new Error('No document to update');
      return updateDocument(document.id, { title, category, contentMd });
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['knowledge', 'documents'] });
      qc.invalidateQueries({ queryKey: ['knowledge', 'document', document?.id] });
      if (res.reingested) {
        showToast('Saved — content re-embedded');
      } else if (res.contentChanged) {
        showToast('Saved — re-embed scheduled', 'error'); // backend logs warn; surface honestly
      } else {
        showToast('Saved');
      }
      onClose();
    },
    onError: (err) => {
      showToast(err.message || 'Save failed', 'error');
    },
  });

  const canSave =
    !!document && title.trim().length > 0 && category.trim().length > 0 && contentMd.trim().length > 0;

  return (
    <Modal open={!!document} title="Edit document" onClose={onClose}>
      {document && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 520 }}>
          <div>
            <label className="v-label">Title</label>
            <input className="v-input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="v-label">Category</label>
            <input className="v-input" value={category} onChange={(e) => setCategory(e.target.value)} />
          </div>
          <div>
            <label className="v-label">
              Content (markdown){' '}
              <span style={{ color: 'var(--ink-faint)', fontWeight: 400 }}>
                — saving with changes will re-chunk and re-embed
              </span>
            </label>
            <textarea
              className="v-textarea"
              rows={14}
              value={contentMd}
              onChange={(e) => setContentMd(e.target.value)}
              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, lineHeight: 1.5 }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              disabled={!canSave || saveMut.isPending}
              onClick={() => saveMut.mutate()}
            >
              {saveMut.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter web build`
Expected: this file compiles.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/knowledge/DocumentEditModal.tsx
git commit -m "feat(knowledge): DocumentEditModal — edit metadata + markdown body"
```

---

## Task 6: Create `UploadDocumentModal`

**Files:**
- Create: `apps/web/src/components/knowledge/UploadDocumentModal.tsx`

- [ ] **Step 1: Write the file**

```tsx
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadDocument, type CreateResult } from '../../api/knowledge';
import Modal from '../Modal';
import { useToast } from '../toast/ToastProvider';

interface Props {
  open: boolean;
  onClose: () => void;
  existingCategories: string[];
}

function previewTitleFromMarkdown(md: string, fallback: string): string {
  const h1 = md.match(/^#\s+(.+?)\s*$/m);
  return h1 ? h1[1].trim() : fallback.replace(/\.(md|markdown)$/i, '');
}

export function UploadDocumentModal({ open, onClose, existingCategories }: Props) {
  const qc = useQueryClient();
  const { showToast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState('');
  const [previewTitle, setPreviewTitle] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);

  function reset() {
    setFile(null);
    setCategory('');
    setPreviewTitle(null);
    setClientError(null);
  }

  async function onFile(f: File) {
    setClientError(null);
    setFile(f);
    const lower = f.name.toLowerCase();
    if (!lower.endsWith('.md') && !lower.endsWith('.markdown')) {
      setClientError('Only .md or .markdown files are accepted');
      setPreviewTitle(null);
      return;
    }
    if (f.size >= 1024 * 1024) {
      setClientError('File must be smaller than 1MB');
      setPreviewTitle(null);
      return;
    }
    try {
      const text = await f.text();
      setPreviewTitle(previewTitleFromMarkdown(text, f.name));
    } catch {
      setClientError('Could not read file as text');
    }
  }

  const uploadMut = useMutation<CreateResult, Error, void>({
    mutationFn: () => {
      if (!file) throw new Error('No file selected');
      return uploadDocument(file, category.trim() || undefined);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['knowledge', 'documents'] });
      showToast('Uploaded as draft — switch to "Draft" to review and publish');
      reset();
      onClose();
    },
    onError: (err) => {
      // Surface backend's BadRequestException message verbatim
      const anyErr = err as { response?: { data?: { message?: string } } };
      showToast(anyErr.response?.data?.message || err.message || 'Upload failed', 'error');
    },
  });

  return (
    <Modal
      open={open}
      title="Upload markdown document"
      onClose={() => {
        reset();
        onClose();
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 480 }}>
        <div>
          <label className="v-label">File (.md or .markdown, &lt; 1MB)</label>
          <input
            type="file"
            accept=".md,.markdown,text/markdown"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
            }}
          />
        </div>
        {previewTitle && (
          <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
            Will be titled: <b>{previewTitle}</b>
          </div>
        )}
        {clientError && (
          <div style={{ fontSize: 12, color: 'var(--red-500, #ef4444)' }}>{clientError}</div>
        )}
        <div>
          <label className="v-label">Category</label>
          <input
            className="v-input"
            list="upload-category-options"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="General"
          />
          <datalist id="upload-category-options">
            {existingCategories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            className="btn btn-ghost"
            onClick={() => {
              reset();
              onClose();
            }}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            disabled={!file || !!clientError || uploadMut.isPending}
            onClick={() => uploadMut.mutate()}
          >
            {uploadMut.isPending ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter web build`
Expected: this file compiles.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/knowledge/UploadDocumentModal.tsx
git commit -m "feat(knowledge): UploadDocumentModal — .md file upload via /upload"
```

---

## Task 7: Create `CapturePreviewModal`

**Files:**
- Create: `apps/web/src/components/knowledge/CapturePreviewModal.tsx`

- [ ] **Step 1: Write the file**

```tsx
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import {
  promoteCapture,
  discardCapture,
  type ResolutionCapture,
  type PromoteCaptureResult,
  type DuplicateConflictBody,
} from '../../api/captures';
import Modal from '../Modal';
import { Badge } from '../ui/Badge';
import { useToast } from '../toast/ToastProvider';

interface Props {
  capture: ResolutionCapture | null;
  onClose: () => void;
}

export function CapturePreviewModal({ capture, onClose }: Props) {
  const qc = useQueryClient();
  const { showToast } = useToast();
  const [confirmingDuplicate, setConfirmingDuplicate] = useState<DuplicateConflictBody['duplicate'] | null>(null);

  function invalidate() {
    qc.invalidateQueries({ queryKey: ['chatbot', 'captures'] });
    qc.invalidateQueries({ queryKey: ['knowledge', 'documents'] });
  }

  const promoteMut = useMutation<PromoteCaptureResult, AxiosError, { forced?: boolean }>({
    mutationFn: ({ forced }) => {
      if (!capture) throw new Error('No capture');
      return promoteCapture(capture.id, forced ? { forcedDespiteDuplicate: true } : {});
    },
    onSuccess: () => {
      invalidate();
      showToast('Promoted to knowledge base');
      setConfirmingDuplicate(null);
      onClose();
    },
    onError: (err) => {
      const body = err.response?.data as { code?: string; duplicate?: DuplicateConflictBody['duplicate']; message?: string } | undefined;
      if (err.response?.status === 409 && body?.code === 'DUPLICATE' && body.duplicate) {
        setConfirmingDuplicate(body.duplicate);
        return;
      }
      if (body?.code === 'ALREADY_LIVE') {
        showToast('This capture is already live', 'error');
        invalidate();
        onClose();
        return;
      }
      if (body?.code === 'NOTHING_TO_PROMOTE') {
        showToast('Nothing to promote on this capture', 'error');
        return;
      }
      showToast(body?.message || err.message || 'Promote failed', 'error');
    },
  });

  const discardMut = useMutation<ResolutionCapture, AxiosError, { reason?: string }>({
    mutationFn: ({ reason }) => {
      if (!capture) throw new Error('No capture');
      return discardCapture(capture.id, reason);
    },
    onSuccess: () => {
      invalidate();
      showToast('Capture discarded');
      onClose();
    },
    onError: (err) => {
      const body = err.response?.data as { message?: string } | undefined;
      showToast(body?.message || err.message || 'Discard failed', 'error');
    },
  });

  const isPending = capture?.status === 'pending';

  return (
    <Modal open={!!capture} title="Captured Q&A" onClose={onClose}>
      {capture && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 520 }}>
          {/* Metadata */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <Badge tone="neutral">{capture.status}</Badge>
            <Badge tone="neutral">{capture.disposition}</Badge>
            {capture.document && <Badge tone="neutral">{capture.document.category}</Badge>}
            <span style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>
              closed {new Date(capture.closedAt).toLocaleString('en-GB')}
            </span>
            {capture.failureReason && (
              <span style={{ fontSize: 11.5, color: 'var(--red-500, #ef4444)' }}>
                failed: {capture.failureReason}
              </span>
            )}
          </div>

          {/* Title */}
          {capture.document && (
            <div style={{ fontSize: 14, fontWeight: 600 }}>{capture.document.title}</div>
          )}

          {/* Conversation reference */}
          {capture.conversation && (
            <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
              From conversation with{' '}
              <b>{capture.conversation.contact?.name ?? 'unknown contact'}</b>{' '}
              <span className="mono" style={{ fontSize: 11 }}>
                conv: {capture.conversationId.substring(0, 8)}…
              </span>
            </div>
          )}

          {capture.resolutionNotes && (
            <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
              Notes: {capture.resolutionNotes}
            </div>
          )}

          {/* Duplicate confirmation gate */}
          {confirmingDuplicate && (
            <div
              style={{
                padding: 12,
                borderRadius: 8,
                background: 'var(--human-soft)',
                border: '1px solid var(--human-soft-line)',
                fontSize: 12.5,
              }}
            >
              A LIVE document similar to this already exists:{' '}
              <b>{confirmingDuplicate.documentTitle}</b> (similarity{' '}
              {Math.round(confirmingDuplicate.similarityScore * 100)}%). Promote anyway?
              <div style={{ marginTop: 8, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setConfirmingDuplicate(null)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  disabled={promoteMut.isPending}
                  onClick={() => promoteMut.mutate({ forced: true })}
                >
                  Promote anyway
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          {!confirmingDuplicate && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
              <button
                className="btn btn-ghost"
                disabled={discardMut.isPending || !isPending}
                onClick={() => {
                  const reason = window.prompt('Reason for discarding (optional):') || undefined;
                  discardMut.mutate({ reason });
                }}
              >
                Discard
              </button>
              <button
                className="btn btn-primary"
                disabled={promoteMut.isPending || !capture.documentId || capture.status === 'captured_live'}
                onClick={() => promoteMut.mutate({})}
              >
                {promoteMut.isPending ? 'Promoting…' : 'Promote to LIVE'}
              </button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter web build`
Expected: this file compiles.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/knowledge/CapturePreviewModal.tsx
git commit -m "feat(knowledge): CapturePreviewModal — promote/discard with duplicate confirm"
```

---

## Task 8: Rewrite `Knowledge.tsx` to use the new API + modals

**Files:**
- Rewrite: `apps/web/src/pages/Knowledge.tsx`

- [ ] **Step 1: Replace the file's entire contents**

```tsx
import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listDocuments,
  publishDocument,
  unpublishDocument,
  deleteDocument,
  reembedDocument,
  type DocStatus,
  type KnowledgeDocument,
  type DocumentDetail,
} from '../api/knowledge';
import {
  listCaptures,
  CAPTURE_STATUSES_BY_BUCKET,
  type CaptureBucket,
  type ResolutionCapture,
} from '../api/captures';
import { useToast } from '../components/toast/ToastProvider';
import { Badge } from '../components/ui/Badge';
import { IcBook, IcRefresh, IcEdit, IcCheck, IcCheckCircle } from '../components/ui/icons';
import { DocumentViewerModal } from '../components/knowledge/DocumentViewerModal';
import { DocumentEditModal } from '../components/knowledge/DocumentEditModal';
import { UploadDocumentModal } from '../components/knowledge/UploadDocumentModal';
import { CapturePreviewModal } from '../components/knowledge/CapturePreviewModal';

type LibraryStatus = 'ALL' | DocStatus;

function statusTone(status: DocStatus) {
  return status === 'LIVE' ? 'brand' : 'neutral';
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function Knowledge() {
  const qc = useQueryClient();
  const { showToast } = useToast();

  const [tab, setTab] = useState<'library' | 'captures'>('library');

  // Library state
  const [libStatus, setLibStatus] = useState<LibraryStatus>('LIVE');
  const [libCategory, setLibCategory] = useState<string>('all');
  const [libSearch, setLibSearch] = useState('');
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<DocumentDetail | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  // Captures state
  const [capBucket, setCapBucket] = useState<CaptureBucket>('pending');
  const [viewingCapture, setViewingCapture] = useState<ResolutionCapture | null>(null);

  // Library query
  const { data: libData, isLoading: libLoading } = useQuery({
    queryKey: ['knowledge', 'documents', { status: libStatus, category: libCategory, search: libSearch }],
    queryFn: () =>
      listDocuments({
        status: libStatus === 'ALL' ? undefined : libStatus,
        category: libCategory === 'all' ? undefined : libCategory,
        search: libSearch.trim() || undefined,
        limit: 100,
      }),
  });
  const documents = libData?.items ?? [];
  const categories = useMemo(
    () => Array.from(new Set(documents.map((d) => d.category))).sort(),
    [documents],
  );

  // Captures query (fans out across the statuses in the active bucket)
  const capStatuses = CAPTURE_STATUSES_BY_BUCKET[capBucket];
  const { data: capData, isLoading: capLoading } = useQuery({
    queryKey: ['chatbot', 'captures', { bucket: capBucket }],
    queryFn: async () => {
      const results = await Promise.all(
        capStatuses.map((status) => listCaptures({ status, limit: 100 })),
      );
      const merged = results.flatMap((r) => r.items);
      merged.sort((a, b) => new Date(b.closedAt).getTime() - new Date(a.closedAt).getTime());
      return merged;
    },
  });
  const captures = capData ?? [];

  // Library mutations
  const publishMut = useMutation({
    mutationFn: (doc: KnowledgeDocument) =>
      doc.status === 'LIVE' ? unpublishDocument(doc.id) : publishDocument(doc.id),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['knowledge', 'documents'] });
      qc.invalidateQueries({ queryKey: ['knowledge', 'document', updated.id] });
      showToast(updated.status === 'LIVE' ? 'Published to knowledge base' : 'Unpublished');
    },
    onError: (err: Error) => showToast(err.message || 'Status change failed', 'error'),
  });

  const deleteMut = useMutation({
    mutationFn: (doc: DocumentDetail) => deleteDocument(doc.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['knowledge', 'documents'] });
      showToast('Document deleted');
      setViewingId(null);
    },
    onError: (err: Error) => showToast(err.message || 'Delete failed', 'error'),
  });

  const reembedMut = useMutation({
    mutationFn: (doc: KnowledgeDocument) => reembedDocument(doc.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['knowledge', 'documents'] });
      showToast('Re-embedded');
    },
    onError: (err: Error) => showToast(err.message || 'Re-embed failed', 'error'),
  });

  // Library filtering happens server-side; client search is just the input value.

  return (
    <div style={{ padding: '24px 28px 40px', maxWidth: 1120, margin: '0 auto' }}>
      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        <button className="tab" data-on={tab === 'library' ? '1' : '0'} onClick={() => setTab('library')}>
          Library <span style={{ opacity: 0.6 }}>{documents.length}</span>
        </button>
        <button
          className="tab"
          data-on={tab === 'captures' ? '1' : '0'}
          onClick={() => setTab('captures')}
        >
          Captures{' '}
          {capBucket === 'pending' && captures.length > 0 && (
            <span
              style={{
                minWidth: 18,
                height: 18,
                padding: '0 5px',
                borderRadius: 999,
                background: 'var(--human-500)',
                color: '#fff',
                fontSize: 11,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {captures.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Library tab ── */}
      {tab === 'library' && (
        <>
          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-faint)' }}>Status</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {(
                [
                  ['ALL', 'All'],
                  ['LIVE', 'Live'],
                  ['DRAFT', 'Draft'],
                  ['ARCHIVED', 'Archived'],
                ] as [LibraryStatus, string][]
              ).map(([id, label]) => (
                <button
                  key={id}
                  className="chip"
                  data-on={libStatus === id ? '1' : '0'}
                  onClick={() => setLibStatus(id)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div style={{ width: 1, height: 22, background: 'var(--line)' }} />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button
                className="chip"
                data-on={libCategory === 'all' ? '1' : '0'}
                onClick={() => setLibCategory('all')}
              >
                All categories
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  className="chip"
                  data-on={libCategory === c ? '1' : '0'}
                  onClick={() => setLibCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <input
                type="search"
                placeholder="Search…"
                value={libSearch}
                onChange={(e) => setLibSearch(e.target.value)}
                style={{
                  fontSize: 12.5,
                  padding: '5px 10px',
                  borderRadius: 7,
                  border: '1px solid var(--line)',
                  background: 'var(--bg-subtle)',
                  color: 'var(--ink)',
                  outline: 'none',
                  width: 180,
                }}
              />
              <button className="btn btn-secondary btn-sm" onClick={() => setUploadOpen(true)}>
                Upload .md
              </button>
            </div>
          </div>

          {/* Library list */}
          {libLoading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-faint)', fontSize: 13 }}>
              Loading…
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {documents.map((d) => (
                <div
                  key={d.id}
                  className="v-card"
                  style={{ padding: '15px 18px', display: 'flex', gap: 14, alignItems: 'flex-start' }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 9,
                      background: d.capturedFromConversationId ? 'var(--human-soft)' : 'var(--brand-soft)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flex: 'none',
                    }}
                  >
                    <IcBook size={15} style={{ color: 'var(--brand-700)' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => setViewingId(d.id)}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{d.title}</div>
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--ink-muted)',
                        marginTop: 3,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {d.name}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: 8,
                        marginTop: 8,
                        alignItems: 'center',
                        flexWrap: 'wrap',
                      }}
                    >
                      <Badge tone={statusTone(d.status)}>{d.status}</Badge>
                      <Badge tone="neutral">{d.category}</Badge>
                      {d.capturedFromConversationId && <Badge tone="human">From conversation</Badge>}
                      <span style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>
                        {d.wordCount} words · updated {formatDate(d.updatedAt)}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 2, flex: 'none' }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ width: 32, padding: 0 }}
                      title="Re-embed"
                      disabled={reembedMut.isPending}
                      onClick={() => reembedMut.mutate(d)}
                    >
                      <IcRefresh size={14} />
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ width: 32, padding: 0 }}
                      title="View"
                      onClick={() => setViewingId(d.id)}
                    >
                      <IcEdit size={15} />
                    </button>
                  </div>
                </div>
              ))}
              {documents.length === 0 && (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-faint)', fontSize: 13 }}>
                  Nothing in this view.
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Captures tab ── */}
      {tab === 'captures' && (
        <>
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {(
              [
                ['pending', 'Pending'],
                ['captured', 'Captured'],
                ['archived', 'Archived'],
              ] as [CaptureBucket, string][]
            ).map(([id, label]) => (
              <button
                key={id}
                className="chip"
                data-on={capBucket === id ? '1' : '0'}
                onClick={() => setCapBucket(id)}
              >
                {label}
              </button>
            ))}
          </div>

          {capLoading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-faint)', fontSize: 13 }}>
              Loading…
            </div>
          ) : captures.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                padding: '48px 24px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: 'var(--brand-soft)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 4,
                }}
              >
                <IcCheckCircle size={22} style={{ color: 'var(--brand-700)' }} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Nothing here</div>
              <div style={{ fontSize: 13, color: 'var(--ink-muted)', maxWidth: 320 }}>
                {capBucket === 'pending'
                  ? 'No captures waiting for review. New ones arrive when operators close conversations.'
                  : 'No captures in this bucket.'}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {captures.map((c) => (
                <div
                  key={c.id}
                  className="v-card"
                  style={{ padding: '15px 18px', cursor: 'pointer' }}
                  onClick={() => setViewingCapture(c)}
                >
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
                    <Badge tone="neutral">{c.status}</Badge>
                    {c.document && <Badge tone="neutral">{c.document.category}</Badge>}
                    <span style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>
                      {formatDate(c.closedAt)}
                    </span>
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>
                    {c.document?.title ?? '(no document yet)'}
                  </div>
                  {c.conversation?.contact?.name && (
                    <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 3 }}>
                      From {c.conversation.contact.name}
                    </div>
                  )}
                  {c.failureReason && (
                    <div style={{ fontSize: 11.5, color: 'var(--red-500, #ef4444)', marginTop: 4 }}>
                      Failed: {c.failureReason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <DocumentViewerModal
        documentId={viewingId}
        onClose={() => setViewingId(null)}
        onEdit={(doc) => {
          setViewingId(null);
          setEditing(doc);
        }}
        onReembed={(doc) => reembedMut.mutate(doc)}
        onTogglePublish={(doc) => publishMut.mutate(doc)}
        onDelete={(doc) => {
          if (window.confirm(`Delete "${doc.title}"? Chunks cascade.`)) {
            deleteMut.mutate(doc);
          }
        }}
      />
      <DocumentEditModal document={editing} onClose={() => setEditing(null)} />
      <UploadDocumentModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        existingCategories={categories}
      />
      <CapturePreviewModal capture={viewingCapture} onClose={() => setViewingCapture(null)} />
    </div>
  );
}
```

- [ ] **Step 2: Typecheck the whole web app**

Run: `pnpm --filter web build`
Expected: **PASS**. All earlier-task type errors in `Knowledge.tsx` are now resolved.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/Knowledge.tsx
git commit -m "feat(knowledge): rewire Knowledge.tsx to /chatbot/knowledge + /chatbot/captures

Library tab lists KnowledgeDocument rows from /chatbot/knowledge/documents
(filterable by status: All/Live/Draft/Archived, category, free-text search).
Each card opens DocumentViewerModal with chunk count, stats, and actions.
Upload .md, edit metadata + markdown body, publish/unpublish, re-embed, delete.

Captures tab replaces 'Learned from escalations', backed by /chatbot/captures.
Three user-facing buckets (Pending / Captured / Archived) map to the 7 backend
statuses. CapturePreviewModal handles promote (with duplicate-confirm flow)
and discard.

Legacy SaveToKnowledgeModal in inbox stays as-is; its rewire requires a
backend change (close-with-disposition) and is deferred."
```

---

## Task 9: Manual smoke verification

**Goal:** confirm the user's original bug ("I can't see any KB items in the dashboard") is fixed, and that the new flows work end-to-end.

**Files:** none modified.

- [ ] **Step 1: Start the dev stack from the worktree**

Run (from `/Users/modefair/whatsapp-blasting/.worktrees/wiring-knowledge-base/`):

```bash
pnpm dev
```

This runs `pnpm --parallel --filter './apps/*' dev` — vite on the web app, NestJS on the API. Both must be up. Confirm API is reachable (default: `http://localhost:3000`) and web is reachable (default: `http://localhost:5173`).

- [ ] **Step 2: Log in as an admin and navigate to /knowledge**

Expected: the Library tab loads with cards for every `KnowledgeDocument` that has `status='LIVE'` (the default filter). If your dev DB has the Zurich/RHB/Chubb/Takaful/insurance plans ingested per memory, those should appear. **This is the fix to the original bug.** Confirm.

- [ ] **Step 3: Toggle status chip All / Live / Draft / Archived**

Expected: each chip re-queries the API with the right filter. Draft tab should be empty unless previous uploads exist; Archived likewise.

- [ ] **Step 4: Upload a small `.md` file**

Click "Upload .md", select a tiny `.md` file (<1KB) with a `# Title` first line and a paragraph or two. Pick a category. Click Upload.

Expected: toast "Uploaded as draft — switch to 'Draft' to review and publish". The Library list does NOT refresh visually (you're on Live filter, the upload went to Draft). Switch to Draft chip — the new doc appears with `wordCount > 0` and a `From conversation` badge absent (the badge only shows when `capturedFromConversationId != null`).

Click on the new doc card → DocumentViewerModal opens → shows full markdown body, `chunks > 0`, stats panel (likely all-zero stats for the new doc). Click Publish — status flips to LIVE, toast confirms, list refreshes.

- [ ] **Step 5: Edit a document**

On any LIVE doc, click the card → viewer modal → Edit. Change the title only → Save → toast "Saved" (no re-embed). Re-open → Edit → change the body → Save → toast "Saved — content re-embedded".

- [ ] **Step 6: Captures tab**

Click the Captures tab. If you have any resolved conversations with captures, they appear in the Pending bucket. If empty, that's a valid state — toggle to Captured and Archived to verify the bucket UX.

If a pending capture exists: click it → CapturePreviewModal opens. Click Promote. Two outcomes:
- **No duplicate:** capture flips to `captured_live`, modal closes, toast "Promoted to knowledge base". Captures list re-queries; that capture moves to the Captured bucket. Library list (Live filter) gains the new doc.
- **Duplicate detected:** inline confirmation appears with similarity score. Click "Promote anyway" → same success path with `forcedDespiteDuplicate: true`.

Click Discard on another pending capture → prompt asks for reason → discard succeeds → capture moves to Archived; underlying document is set to ARCHIVED status (visible in the Library Archived chip filter).

- [ ] **Step 7: Confirm legacy `SaveToKnowledgeModal` is unchanged**

Open a closed ticket from the Inbox and trigger the existing "Save to knowledge" modal. It should look exactly as before (calling the legacy endpoints that write to the empty `KnowledgeDoc` table). This branch does not touch it — its rewire is deferred.

- [ ] **Step 8: Stop the dev stack and check the worktree is clean**

Run: `git status --short`
Expected: empty. All implementation tasks committed.

Run: `git log --oneline master..HEAD`
Expected: 8 commits (Task 1 spec update + Tasks 2-8 implementation), one per task.

- [ ] **Step 9: Mark done**

This branch is ready to merge. No further commits required from the plan.

---

## What's left as follow-ups (not this branch)

1. **`SaveToKnowledgeModal` rewire** — requires backend change to `/tickets/:id/close` to accept the operator's `disposition` (IMPORT_LIVE / SAVE_DRAFT / SKIP). Once that lands, the modal becomes a thin "preview the auto-capture + pick disposition" UI calling `previewCapture(conversationId)` and submitting disposition through the updated close endpoint.
2. **Delete legacy `/knowledge` backend** — drop `apps/api/src/knowledge/*`, the `KnowledgeService`, `KnowledgeController`, the `KnowledgeDoc` Prisma model, and its migration. The dashboard no longer reads from it, but it's still being WRITTEN to by `SaveToKnowledgeModal` until #1 lands — so this can only happen after #1.
3. **Proper markdown renderer.** Install `react-markdown` + `remark-gfm` and replace the `<pre>` block in `DocumentViewerModal` with a rendered view. Small change, larger UX win.
4. **Frontend test framework.** Add vitest + `@testing-library/react` to `apps/web` and backfill tests for the API clients and the modals. Not blocking; this branch ships without them.
5. **Add a chunks panel to `DocumentViewerModal`.** The backend has the data; the UI currently shows only `chunkCount`. A panel listing chunk text + token count would aid debugging RAG behaviour.
