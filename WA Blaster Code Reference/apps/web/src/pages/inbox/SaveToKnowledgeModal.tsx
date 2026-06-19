// SaveToKnowledgeModal.tsx — post-resolve/close modal to import Q&A into knowledge base
import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  getKnowledgeSuggestion,
  createKnowledgeCandidate,
  type KnowledgeSuggestion,
} from '../../api/tickets';
import { Button, IcBook, IcCheck, IcX } from '../../components/ui';

interface SaveToKnowledgeModalProps {
  ticketId: string;
  ticketNum: string;
  onClose: () => void;
  onImported: () => void;
}

export function SaveToKnowledgeModal({
  ticketId,
  ticketNum,
  onClose,
  onImported,
}: SaveToKnowledgeModalProps) {
  const [suggestion, setSuggestion] = useState<KnowledgeSuggestion | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('');
  const [fetched, setFetched] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch suggestion when modal mounts
  useEffect(() => {
    getKnowledgeSuggestion(ticketId)
      .then((s) => {
        setSuggestion(s);
        setQuestion(s.question);
        setAnswer(s.answer);
        setSlug(s.suggestedSlug ?? '');
        setCategory(s.category ?? '');
        setFetched(true);
      })
      .catch((e) => {
        setFetchError((e as Error).message || 'Could not load suggestion');
        setFetched(true);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  const importMut = useMutation({
    mutationFn: () =>
      createKnowledgeCandidate(ticketId, { question, answer, slug, category }),
    onSuccess: () => {
      onImported();
    },
  });

  const canImport = question.trim().length > 0 && answer.trim().length > 0 && !importMut.isPending;

  return (
    /* backdrop */
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.35)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 540,
          background: 'var(--background)',
          borderRadius: 14,
          border: '1px solid var(--border)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div
          style={{
            padding: '20px 24px 14px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 11,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'var(--accent-fill)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IcBook size={18} style={{ color: 'var(--accent-text)' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
              Add this Q&amp;A to the knowledge base?
            </h3>
            <p style={{ margin: '1px 0 0', fontSize: 12.5, color: 'var(--text-muted)' }}>
              Captured from {ticketNum} — review and decide. Nothing is saved automatically.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              flexShrink: 0,
              width: 28,
              height: 28,
              borderRadius: 6,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
            }}
            aria-label="Close"
          >
            <IcX size={16} />
          </button>
        </div>

        {/* body */}
        <div style={{ padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {!fetched && (
            <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', padding: '12px 0' }}>
              Loading suggestion…
            </div>
          )}
          {fetchError && (
            <div style={{ fontSize: 12.5, color: 'var(--red-500, #ef4444)', padding: '4px 0' }}>
              {fetchError} — you can still fill in manually below.
            </div>
          )}

          <div>
            <label
              style={{
                display: 'block',
                fontSize: 11.5,
                fontWeight: 600,
                color: 'var(--text-muted)',
                marginBottom: 5,
                letterSpacing: '0.03em',
                textTransform: 'uppercase',
              }}
            >
              Question (dealer's message)
            </label>
            <textarea
              rows={2}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              style={{
                width: '100%',
                resize: 'vertical',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--background)',
                padding: '8px 10px',
                fontSize: 13,
                color: 'var(--foreground)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: 11.5,
                fontWeight: 600,
                color: 'var(--text-muted)',
                marginBottom: 5,
                letterSpacing: '0.03em',
                textTransform: 'uppercase',
              }}
            >
              Answer (your reply)
            </label>
            <textarea
              rows={3}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              style={{
                width: '100%',
                resize: 'vertical',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--background)',
                padding: '8px 10px',
                fontSize: 13,
                color: 'var(--foreground)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  marginBottom: 5,
                  letterSpacing: '0.03em',
                  textTransform: 'uppercase',
                }}
              >
                Slug
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                style={{
                  width: '100%',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--background)',
                  padding: '6px 10px',
                  fontSize: 13,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: '#7C5CFC',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  marginBottom: 5,
                  letterSpacing: '0.03em',
                  textTransform: 'uppercase',
                }}
              >
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: '100%',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--background)',
                  padding: '6px 10px',
                  fontSize: 13,
                  color: 'var(--foreground)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {suggestion?.suggestedSlug && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--text-muted)' }}>
              <span>Suggested doc:</span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  color: '#7C5CFC',
                  fontSize: 12,
                }}
              >
                {suggestion.suggestedSlug}
              </span>
            </div>
          )}

          {importMut.isError && (
            <div style={{ fontSize: 12, color: 'var(--red-500, #ef4444)' }}>
              {(importMut.error as Error).message || 'Failed to import'}
            </div>
          )}
        </div>

        {/* footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 9,
          }}
        >
          <Button variant="ghost" onClick={onClose}>
            Skip / don't import
          </Button>
          <Button
            variant="primary"
            disabled={!canImport}
            onClick={() => importMut.mutate()}
            icon={<IcCheck size={14} />}
          >
            {importMut.isPending ? 'Importing…' : 'Import to knowledge base'}
          </Button>
        </div>
      </div>
    </div>
  );
}
