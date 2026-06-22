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
    <Modal open={open} title={doc?.title ?? 'Document'} onClose={onClose} size="2xl">
      {isLoading || !doc ? (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-faint)' }}>Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
