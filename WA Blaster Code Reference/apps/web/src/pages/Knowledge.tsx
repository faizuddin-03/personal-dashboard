import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listKnowledge,
  listCandidates,
  updateKnowledge,
  publishKnowledge,
  dismissKnowledge,
  reindexKnowledge,
  type KnowledgeDoc,
  type KnowledgeSource,
} from '../api/knowledge';
import Modal from '../components/Modal';
import { useToast } from '../components/toast/ToastProvider';
import { Badge } from '../components/ui/Badge';
import {
  IcBook,
  IcRefresh,
  IcEdit,
  IcCheck,
  IcCheckCircle,
} from '../components/ui/icons';

// Inline inbox icon (not exported from icons.tsx)
function InboxIcon({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}

type SrcFilter = 'all' | 'SYNCED' | 'FROM_ESCALATION';

interface EditingDoc extends KnowledgeDoc {
  _isCandidate?: boolean;
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function Knowledge() {
  const qc = useQueryClient();

  const [tab, setTab] = useState<'library' | 'learned'>('library');
  const [src, setSrc] = useState<SrcFilter>('all');
  const [cat, setCat] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<EditingDoc | null>(null);
  const [editQ, setEditQ] = useState('');
  const [editA, setEditA] = useState('');

  // Toast
  const { showToast } = useToast();

  // Queries
  const { data: knowledgeDocs = [], isLoading: libLoading } = useQuery({
    queryKey: ['knowledge'],
    queryFn: () => listKnowledge(),
  });

  const { data: candidates = [], isLoading: candLoading } = useQuery({
    queryKey: ['knowledge', 'candidates'],
    queryFn: listCandidates,
  });

  // Mutations
  const reindexMut = useMutation({
    mutationFn: (id: string) => reindexKnowledge(id),
    onSuccess: () => showToast('Re-indexed'),
    onError: () => showToast('Re-index failed', 'error'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, question, answer }: { id: string; question: string; answer: string }) =>
      updateKnowledge(id, { question, answer }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['knowledge'] });
      showToast('Knowledge updated — the bot will use it');
      setEditing(null);
    },
    onError: () => showToast('Update failed', 'error'),
  });

  const publishMut = useMutation({
    mutationFn: async ({ id, question, answer, isEdited }: { id: string; question: string; answer: string; isEdited: boolean }) => {
      if (isEdited) {
        await updateKnowledge(id, { question, answer });
      }
      return publishKnowledge(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['knowledge'] });
      qc.invalidateQueries({ queryKey: ['knowledge', 'candidates'] });
      showToast('Published to knowledge base');
      setEditing(null);
    },
    onError: () => showToast('Publish failed', 'error'),
  });

  const dismissMut = useMutation({
    mutationFn: (id: string) => dismissKnowledge(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['knowledge', 'candidates'] });
      showToast('Candidate dismissed');
    },
    onError: () => showToast('Dismiss failed', 'error'),
  });

  const publishDirectMut = useMutation({
    mutationFn: (id: string) => publishKnowledge(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['knowledge'] });
      qc.invalidateQueries({ queryKey: ['knowledge', 'candidates'] });
      showToast('Published to knowledge base');
    },
    onError: () => showToast('Publish failed', 'error'),
  });

  // Derived data
  const categories = useMemo(() => {
    const cats = Array.from(new Set(knowledgeDocs.map((k) => k.category)));
    return cats.sort();
  }, [knowledgeDocs]);

  const sq = search.toLowerCase();
  const shown = useMemo(() => {
    return knowledgeDocs.filter((k) => {
      const matchSrc =
        src === 'all' ||
        (src === 'SYNCED' && k.source === 'SYNCED') ||
        (src === 'FROM_ESCALATION' && k.source === 'FROM_ESCALATION');
      const matchCat = cat === 'all' || k.category === cat;
      const matchSearch =
        !sq ||
        [k.question, k.answer, k.category, k.slug].some((v) =>
          (v || '').toLowerCase().includes(sq),
        );
      return matchSrc && matchCat && matchSearch;
    });
  }, [knowledgeDocs, src, cat, sq]);

  function openEdit(doc: KnowledgeDoc, isCandidate = false) {
    setEditing({ ...doc, _isCandidate: isCandidate });
    setEditQ(doc.question);
    setEditA(doc.answer);
  }

  function handleSave() {
    if (!editing) return;
    if (editing._isCandidate) {
      const isEdited = editQ !== editing.question || editA !== editing.answer;
      publishMut.mutate({ id: editing.id, question: editQ, answer: editA, isEdited });
    } else {
      updateMut.mutate({ id: editing.id, question: editQ, answer: editA });
    }
  }

  const modalBusy = updateMut.isPending || publishMut.isPending;

  return (
    <div style={{ padding: '24px 28px 40px', maxWidth: 1120, margin: '0 auto' }}>
      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        <button
          className="tab"
          data-on={tab === 'library' ? '1' : '0'}
          onClick={() => setTab('library')}
        >
          Library{' '}
          <span style={{ opacity: 0.6 }}>{knowledgeDocs.length}</span>
        </button>
        <button
          className="tab"
          data-on={tab === 'learned' ? '1' : '0'}
          onClick={() => setTab('learned')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}
        >
          Learned from escalations{' '}
          {candidates.length > 0 && (
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
              {candidates.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Library tab ── */}
      {tab === 'library' && (
        <>
          {/* Toolbar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 16,
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-faint)' }}>
              Source
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              {(
                [
                  ['all', 'All'],
                  ['SYNCED', 'Synced'],
                  ['FROM_ESCALATION', 'From escalation'],
                ] as [SrcFilter, string][]
              ).map(([id, label]) => (
                <button
                  key={id}
                  className="chip"
                  data-on={src === id ? '1' : '0'}
                  onClick={() => setSrc(id)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div style={{ width: 1, height: 22, background: 'var(--line)' }} />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button
                className="chip"
                data-on={cat === 'all' ? '1' : '0'}
                onClick={() => setCat('all')}
              >
                All categories
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  className="chip"
                  data-on={cat === c ? '1' : '0'}
                  onClick={() => setCat(c)}
                >
                  {c}
                </button>
              ))}
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <input
                type="search"
                placeholder="Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
            </div>
          </div>

          {/* Library list */}
          {libLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--ink-faint)', fontSize: 13 }}>
              Loading…
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {shown.map((k) => {
                const esc = k.source === 'FROM_ESCALATION';
                return (
                  <div
                    key={k.id}
                    className="v-card"
                    style={{ padding: '15px 18px', display: 'flex', gap: 14, alignItems: 'flex-start' }}
                  >
                    {/* Source icon */}
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 9,
                        background: esc ? 'var(--human-soft)' : 'var(--brand-soft)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flex: 'none',
                      }}
                    >
                      {esc ? (
                        <InboxIcon size={15} style={{ color: 'var(--human-600)' }} />
                      ) : (
                        <IcBook size={15} style={{ color: 'var(--brand-700)' }} />
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{k.question}</div>
                      <div
                        style={{
                          fontSize: 12.5,
                          color: 'var(--ink-muted)',
                          marginTop: 3,
                          lineHeight: 1.5,
                        }}
                      >
                        {k.answer}
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
                        {k.slug && (
                          <span className="mono" style={{ fontSize: 11, color: 'var(--brand-700)' }}>
                            {k.slug}
                          </span>
                        )}
                        <Badge tone="neutral">{k.category}</Badge>
                        {esc && (
                          <Badge tone="human">
                            From escalation{k.ticketId ? ` · ${k.ticketId}` : ''}
                          </Badge>
                        )}
                        <span style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>
                          used <b style={{ color: 'var(--ink-muted)' }}>{k.uses.toLocaleString()}</b>×
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 2, flex: 'none' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ width: 32, padding: 0 }}
                        title="Re-index"
                        disabled={reindexMut.isPending}
                        onClick={() => reindexMut.mutate(k.id)}
                      >
                        <IcRefresh size={14} />
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ width: 32, padding: 0 }}
                        title="Edit"
                        onClick={() => openEdit(k, false)}
                      >
                        <IcEdit size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {shown.length === 0 && (
                <div
                  style={{ padding: '40px', textAlign: 'center', color: 'var(--ink-faint)', fontSize: 13 }}
                >
                  Nothing in this view.
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Learned from escalations tab ── */}
      {tab === 'learned' && (
        <>
          {/* Header stat card */}
          <div
            className="v-card"
            style={{
              padding: '16px 20px',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              background: 'var(--human-soft)',
              border: '1px solid var(--human-soft-line)',
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 11,
                flex: 'none',
                background: 'var(--human-500)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <InboxIcon size={20} style={{ color: '#fff' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14.5, fontWeight: 600 }}>
                Answers imported from resolved tickets
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-muted)', marginTop: 1 }}>
                When an agent closes an escalation and chooses to import it, the dealer's question +
                the human's reply land here for you to review &amp; publish — so the bot can handle
                it next time.
              </div>
            </div>
            <div style={{ textAlign: 'right', flex: 'none' }}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>12</div>
              <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>imported this month</div>
              <div style={{ fontSize: 11.5, color: 'var(--green-600)', fontWeight: 600, marginTop: 2 }}>
                resolution rate +3.2 pts
              </div>
            </div>
          </div>

          {/* Candidate list */}
          {candLoading ? (
            <div
              style={{ padding: '40px', textAlign: 'center', color: 'var(--ink-faint)', fontSize: 13 }}
            >
              Loading…
            </div>
          ) : candidates.length === 0 ? (
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
              <div style={{ fontSize: 14, fontWeight: 600 }}>Queue clear</div>
              <div style={{ fontSize: 13, color: 'var(--ink-muted)', maxWidth: 320 }}>
                No imported answers waiting. New ones arrive when agents import a closed ticket's
                Q&amp;A from the Inbox.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {candidates.map((c) => (
                <div key={c.id} className="v-card" style={{ padding: '18px 20px' }}>
                  {/* Header row */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 10,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Badge tone="human">From escalation</Badge>
                    {c.ticketId && (
                      <span
                        className="mono"
                        style={{ fontSize: 12, fontWeight: 600, color: 'var(--human-600)' }}
                      >
                        {c.ticketId}
                      </span>
                    )}
                    <span style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>
                      {formatDate(c.createdAt)}
                    </span>
                  </div>

                  {/* Question */}
                  <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'var(--ink-faint)',
                        width: 60,
                        flex: 'none',
                        paddingTop: 2,
                      }}
                    >
                      QUESTION
                    </span>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{c.question}</div>
                  </div>

                  {/* Answer */}
                  <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'var(--ink-faint)',
                        width: 60,
                        flex: 'none',
                        paddingTop: 2,
                      }}
                    >
                      ANSWER
                    </span>
                    <div style={{ fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.55, flex: 1 }}>
                      {c.answer}
                    </div>
                  </div>

                  {/* Footer row */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      paddingTop: 12,
                      borderTop: '1px solid var(--line)',
                    }}
                  >
                    <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                      File under{' '}
                      <span className="mono" style={{ color: 'var(--brand-700)' }}>
                        {c.slug}
                      </span>
                    </span>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        disabled={dismissMut.isPending}
                        onClick={() => dismissMut.mutate(c.id)}
                      >
                        Dismiss
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => openEdit(c, true)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                      >
                        <IcEdit size={14} />
                        Edit
                      </button>
                      <button
                        className="btn btn-primary btn-sm"
                        disabled={publishDirectMut.isPending}
                        onClick={() => publishDirectMut.mutate(c.id)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                      >
                        <IcCheck size={15} />
                        Publish to knowledge
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Edit / Review modal ── */}
      <Modal
        open={!!editing}
        title={editing?._isCandidate ? 'Review & publish' : 'Edit answer'}
        onClose={() => setEditing(null)}
      >
        {editing && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {editing._isCandidate && (
              <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap' }}>
                <Badge tone="human">
                  From escalation{editing.ticketId ? ` · ${editing.ticketId}` : ''}
                </Badge>
                <span style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>
                  the answer below is the human agent's reply
                </span>
              </div>
            )}

            <div>
              <label className="v-label">Question / trigger</label>
              <input
                className="v-input"
                value={editQ}
                onChange={(e) => setEditQ(e.target.value)}
              />
            </div>

            <div>
              <label className="v-label">Answer the bot gives</label>
              <textarea
                className="v-textarea"
                rows={4}
                value={editA}
                onChange={(e) => setEditA(e.target.value)}
              />
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 9,
                paddingTop: 4,
              }}
            >
              <button className="btn btn-ghost" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                disabled={!editQ.trim() || !editA.trim() || modalBusy}
                onClick={handleSave}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <IcCheck size={16} />
                {editing._isCandidate ? 'Publish to knowledge' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
