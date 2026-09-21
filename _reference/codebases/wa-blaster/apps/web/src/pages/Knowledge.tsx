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
import { IcBook, IcRefresh, IcEdit, IcCheckCircle } from '../components/ui/icons';
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

  const [libStatus, setLibStatus] = useState<LibraryStatus>('LIVE');
  const [libCategory, setLibCategory] = useState<string>('all');
  const [libSearch, setLibSearch] = useState('');
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<DocumentDetail | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  const [capBucket, setCapBucket] = useState<CaptureBucket>('pending');
  const [viewingCapture, setViewingCapture] = useState<ResolutionCapture | null>(null);

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
  // categories are derived from the current page; when libCategory != 'all' the list collapses to that one chip
  const categories = useMemo(
    () => Array.from(new Set(documents.map((d) => d.category))).sort(),
    [documents],
  );

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

  return (
    <div style={{ padding: '24px 28px 40px', maxWidth: 1120, margin: '0 auto' }}>
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

      {tab === 'library' && (
        <>
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
                  style={{ padding: '15px 18px', display: 'flex', gap: 14, alignItems: 'flex-start', cursor: 'pointer' }}
                  onClick={() => setViewingId(d.id)}
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
                  <div style={{ flex: 1, minWidth: 0 }}>
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
                      onClick={(e) => {
                        e.stopPropagation();
                        reembedMut.mutate(d);
                      }}
                    >
                      <IcRefresh size={14} />
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ width: 32, padding: 0 }}
                      title="View"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingId(d.id);
                      }}
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
