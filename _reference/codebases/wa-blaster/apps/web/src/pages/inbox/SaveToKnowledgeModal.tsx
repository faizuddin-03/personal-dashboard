// SaveToKnowledgeModal.tsx — opened on Resolve/Close: pick how the chatbot resolution is captured into the KB,
// then perform the ticket resolve/close with that disposition. Replaces the legacy createKnowledgeCandidate flow.
import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import {
  getKnowledgeSuggestion,
  resolveTicket,
  closeTicket,
  type CloseDisposition,
} from '../../api/tickets';
import { Button, IcBook, IcCheck, IcX } from '../../components/ui';

export type TicketCloseAction = 'resolve' | 'close';

interface SaveToKnowledgeModalProps {
  ticketId: string;
  ticketNum: string;
  action: TicketCloseAction;
  onClose: () => void;
  onDone: () => void;
}

const OPTIONS: { value: CloseDisposition; label: string; help: string }[] = [
  { value: 'IMPORT_LIVE', label: 'Publish to knowledge base', help: 'The bot can use this answer immediately.' },
  { value: 'SAVE_DRAFT', label: 'Save as draft for review', help: 'Stored as a draft before it goes live.' },
  { value: 'SKIP', label: "Don't save", help: 'Just close the ticket — capture nothing.' },
];

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)',
  marginBottom: 5, letterSpacing: '0.03em', textTransform: 'uppercase',
};

export function SaveToKnowledgeModal({ ticketId, ticketNum, action, onClose, onDone }: SaveToKnowledgeModalProps) {
  const [disposition, setDisposition] = useState<CloseDisposition>('IMPORT_LIVE');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [notes, setNotes] = useState('');
  const [fetched, setFetched] = useState(false);

  // Prefill the Q&A preview from the latest inbound + operator reply (best-effort).
  useEffect(() => {
    getKnowledgeSuggestion(ticketId)
      .then((s) => {
        setQuestion(s.question);
        setAnswer(s.answer);
        setFetched(true);
      })
      .catch(() => setFetched(true));
  }, [ticketId]);

  const mut = useMutation({
    mutationFn: () => {
      const opts =
        disposition === 'SKIP'
          ? { disposition }
          : { disposition, editedAnswer: answer.trim() || undefined, resolutionNotes: notes.trim() || undefined };
      return action === 'resolve' ? resolveTicket(ticketId, opts) : closeTicket(ticketId, opts);
    },
    onSuccess: () => onDone(),
  });

  // The backend rejects a non-SKIP capture (409) when the conversation has no operator reply yet.
  const conflictCode =
    isAxiosError(mut.error) && mut.error.response?.status === 409
      ? (mut.error.response.data as { code?: string } | undefined)?.code
      : undefined;
  const needsReply = conflictCode === 'NO_OPERATOR_REPLY';

  const verb = action === 'resolve' ? 'Resolve' : 'Close';
  const submitLabel =
    disposition === 'SKIP' ? `${verb} without saving`
    : disposition === 'IMPORT_LIVE' ? `${verb} & publish`
    : `${verb} & save draft`;
  const captureNeedsAnswer = disposition !== 'SKIP';
  const canSubmit = !mut.isPending && (!captureNeedsAnswer || answer.trim().length > 0);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        data-testid="save-kb-modal"
        style={{
          width: '100%', maxWidth: 540, background: 'var(--background)', borderRadius: 14,
          border: '1px solid var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div style={{ padding: '20px 24px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-fill)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <IcBook size={18} style={{ color: 'var(--accent-text)' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{verb} {ticketNum}</h3>
            <p style={{ margin: '1px 0 0', fontSize: 12.5, color: 'var(--text-muted)' }}>
              Choose how this resolution is saved to the bot's knowledge base.
            </p>
          </div>
          <button
            type="button" onClick={onClose} aria-label="Close"
            style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}
          >
            <IcX size={16} />
          </button>
        </div>

        {/* body */}
        <div style={{ padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {OPTIONS.map((o) => {
              const selected = disposition === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  data-testid={`disposition-${o.value}`}
                  onClick={() => setDisposition(o.value)}
                  style={{
                    textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                    borderRadius: 10, cursor: 'pointer',
                    border: selected ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                    background: selected ? 'var(--background-hover)' : 'var(--background)',
                  }}
                >
                  <span style={{ width: 16, height: 16, borderRadius: 999, flexShrink: 0, border: selected ? '5px solid var(--accent)' : '2px solid var(--border)' }} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 13, fontWeight: 600 }}>{o.label}</span>
                    <span style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)' }}>{o.help}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {captureNeedsAnswer && (
            <>
              {question && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  <span style={{ fontWeight: 600 }}>Dealer asked:</span> {question}
                </div>
              )}
              <div>
                <label style={labelStyle}>Answer to save</label>
                <textarea
                  rows={3} value={answer} onChange={(e) => setAnswer(e.target.value)}
                  placeholder={fetched ? 'The answer the bot should learn…' : 'Loading your reply…'}
                  style={{ width: '100%', resize: 'vertical', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--background)', padding: '8px 10px', fontSize: 13, color: 'var(--foreground)', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={labelStyle}>Notes (optional)</label>
                <input
                  type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Internal note about this resolution"
                  style={{ width: '100%', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--background)', padding: '6px 10px', fontSize: 13, color: 'var(--foreground)', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </>
          )}

          {needsReply && (
            <div style={{ fontSize: 12.5, color: 'var(--amber-500, #f59e0b)' }}>
              Send a reply to the dealer before saving to the knowledge base — there's nothing to capture yet.
              You can still {verb.toLowerCase()} without saving.
            </div>
          )}
          {mut.isError && !needsReply && (
            <div style={{ fontSize: 12, color: 'var(--red-500, #ef4444)' }}>
              {(mut.error as Error).message || `Failed to ${verb.toLowerCase()}`}
            </div>
          )}
        </div>

        {/* footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 9 }}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary" data-testid="kb-confirm" disabled={!canSubmit}
            onClick={() => mut.mutate()} icon={<IcCheck size={14} />}
          >
            {mut.isPending ? 'Saving…' : submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
