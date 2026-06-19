// NeedsHumanMode.tsx — ticket queue + detail with escalation divider, composer, save-to-KB modal
import { useRef, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listTickets,
  getTicket,
  assignTicket,
  resolveTicket,
  closeTicket,
  reopenTicket,
  getAgentContext,
  suggestReply,
  type Ticket,
  type TicketStatus,
} from '../../api/tickets';
import { listCannedReplies } from '../../api/cannedReplies';
import { getInboxConversation, sendInboxReply } from '../../api/inbox';
import type { BadgeTone } from '../../components/ui/Badge';
import {
  Avatar,
  Badge,
  Button,
  Empty,
  Skeleton,
  IcCheck,
  IcUser,
  IcCheckCircle,
  IcSend,
  IcAlert,
  IcMessage,
  IcChevR,
} from '../../components/ui';
import { DealerPanel } from '../../components/inbox/DealerPanel';
import { MessageBubble, EscalationDivider, type BubbleMessage } from '../../components/inbox/MessageBubble';
import { StatusTimeline } from './StatusTimeline';
import { SaveToKnowledgeModal } from './SaveToKnowledgeModal';

// ---- status tone map ----
const STATUS_TONE: Record<TicketStatus, BadgeTone> = {
  OPEN: 'human',
  IN_PROGRESS: 'blue',
  RESOLVED: 'success',
  CLOSED: 'neutral',
};

const STATUS_LABEL: Record<TicketStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

// Reason display labels
function reasonLabel(r: string): string {
  const MAP: Record<string, string> = {
    COMPLAINT: 'Complaint',
    LOW_CONFIDENCE: 'Low confidence',
    KNOWLEDGE_GAP: 'Knowledge gap',
    SENSITIVE: 'Sensitive',
  };
  return MAP[r] ?? r;
}

const REASON_TONE: Record<string, BadgeTone> = {
  KNOWLEDGE_GAP: 'blue',
  LOW_CONFIDENCE: 'human',
  COMPLAINT: 'red',
  SENSITIVE: 'brand',
};
function reasonTone(r: string): BadgeTone {
  return REASON_TONE[r] ?? 'human';
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

// ---- Ticket queue (left pane) ----
interface TicketQueueProps {
  tab: 'active' | 'closed';
  onTabChange: (t: 'active' | 'closed') => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function TicketQueue({ tab, onTabChange, selectedId, onSelect }: TicketQueueProps) {
  const { data: activeTickets = [], isLoading: loadingActive } = useQuery({
    queryKey: ['tickets', 'active'],
    queryFn: () => listTickets({ tab: 'active' }),
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
  });
  const { data: closedTickets = [], isLoading: loadingClosed } = useQuery({
    queryKey: ['tickets', 'closed'],
    queryFn: () => listTickets({ tab: 'closed' }),
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });

  const list = tab === 'active' ? activeTickets : closedTickets;
  const isLoading = tab === 'active' ? loadingActive : loadingClosed;

  return (
    <div
      style={{
        width: 320,
        flex: 'none',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--background)',
      }}
    >
      {/* tab chips */}
      <div
        style={{
          padding: '12px 14px 8px',
          display: 'flex',
          gap: 6,
          borderBottom: '1px solid var(--border)',
        }}
      >
        <button
          type="button"
          onClick={() => onTabChange('active')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            height: 28,
            padding: '0 12px',
            borderRadius: 999,
            fontSize: 12.5,
            fontWeight: 600,
            cursor: 'pointer',
            border: '1px solid',
            background: tab === 'active' ? 'rgba(245,158,11,0.10)' : 'transparent',
            borderColor: tab === 'active' ? 'rgba(245,158,11,0.20)' : 'var(--border)',
            color: tab === 'active' ? 'var(--amber-500, #f59e0b)' : 'var(--text-muted)',
          }}
        >
          Active
          {activeTickets.length > 0 && (
            <span style={{ fontWeight: 700 }}>{activeTickets.length}</span>
          )}
        </button>
        <button
          type="button"
          onClick={() => onTabChange('closed')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            height: 28,
            padding: '0 12px',
            borderRadius: 999,
            fontSize: 12.5,
            fontWeight: 600,
            cursor: 'pointer',
            border: '1px solid',
            background: tab === 'closed' ? 'var(--background-hover)' : 'transparent',
            borderColor: tab === 'closed' ? 'var(--border-strong, var(--border))' : 'var(--border)',
            color: tab === 'closed' ? 'var(--foreground)' : 'var(--text-muted)',
          }}
        >
          Closed
          {closedTickets.length > 0 && (
            <span style={{ fontWeight: 700, opacity: 0.7 }}>{closedTickets.length}</span>
          )}
        </button>
      </div>

      {/* list */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '6px 10px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {isLoading && (
          <>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </>
        )}
        {!isLoading && list.length === 0 && (
          <Empty
            icon={<IcCheckCircle size={20} />}
            title={tab === 'active' ? 'No open tickets' : 'No closed tickets yet'}
            body={
              tab === 'active'
                ? 'The bot is handling everything right now.'
                : 'Resolved tickets will appear here.'
            }
          />
        )}
        {!isLoading &&
          list.map((t) => {
            const isSelected = t.id === selectedId;
            const st = STATUS_TONE[t.status];
            const firstInbound =
              t.contact?.name ?? '—';

            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelect(t.id)}
                style={{
                  textAlign: 'left',
                  padding: '12px 13px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  border: isSelected ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                  boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.08)' : '0 1px 2px rgba(0,0,0,0.04)',
                  background: isSelected ? 'var(--background-hover)' : 'var(--background)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                    }}
                  >
                    {t.num}
                  </span>
                  <Badge tone={reasonTone(t.reason)} style={{ height: 19, fontSize: 10 }}>
                    {reasonLabel(t.reason)}
                  </Badge>
                  <span style={{ marginLeft: 'auto' }}>
                    <Badge tone={st} style={{ height: 19, fontSize: 10 }}>
                      {STATUS_LABEL[t.status]}
                    </Badge>
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <Avatar name={t.contact?.name ?? undefined} size="md" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {t.contact?.name ?? '—'}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--text-muted)',
                        marginTop: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {t.intent ?? reasonLabel(t.reason)}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 9 }}>
                  {t.assignee ? (
                    <span
                      style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)' }}
                    >
                      <Avatar name={t.assignee.name} size="sm" />
                      {t.assignee.name.split(' ')[0]}
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, color: 'var(--amber-500, #f59e0b)', fontWeight: 600 }}>
                      Unassigned
                    </span>
                  )}
                </div>
              </button>
            );
          })}
      </div>
    </div>
  );
}

// ---- Ticket detail (center pane) ----
interface TicketDetailProps {
  ticketId: string;
  onSaveKbNeeded: (ticketId: string, ticketNum: string) => void;
}

function TicketDetail({ ticketId, onSaveKbNeeded }: TicketDetailProps) {
  const qc = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState('');
  const draftKey = `inbox-draft-${ticketId}`;

  const { data: ticket, isLoading: loadingTicket } = useQuery({
    queryKey: ['tickets', ticketId],
    queryFn: () => getTicket(ticketId),
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
  });

  const { data: conv, isLoading: loadingConv } = useQuery({
    queryKey: ['inbox', 'conversation', ticket?.contactId],
    queryFn: () => getInboxConversation(ticket!.contactId),
    enabled: !!ticket?.contactId,
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
  });

  // Draft persistence
  useEffect(() => {
    setDraft(sessionStorage.getItem(draftKey) ?? '');
  }, [draftKey]);

  useEffect(() => {
    if (draft) sessionStorage.setItem(draftKey, draft);
    else sessionStorage.removeItem(draftKey);
  }, [draft, draftKey]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [conv?.messages.length, ticketId]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['tickets'] });
    if (ticket?.contactId) {
      qc.invalidateQueries({ queryKey: ['inbox', 'conversation', ticket.contactId] });
    }
  };

  const assignMut = useMutation({
    mutationFn: () => assignTicket(ticketId),
    onSuccess: invalidate,
  });
  const resolveMut = useMutation({
    mutationFn: () => resolveTicket(ticketId),
    onSuccess: () => {
      invalidate();
      onSaveKbNeeded(ticketId, ticket?.num ?? ticketId);
    },
  });
  const closeMut = useMutation({
    mutationFn: () => closeTicket(ticketId),
    onSuccess: () => {
      invalidate();
      onSaveKbNeeded(ticketId, ticket?.num ?? ticketId);
    },
  });
  const reopenMut = useMutation({
    mutationFn: () => reopenTicket(ticketId),
    onSuccess: invalidate,
  });

  const sendMut = useMutation({
    mutationFn: (body: string) => sendInboxReply(ticket!.contactId, body),
    onSuccess: () => {
      setDraft('');
      sessionStorage.removeItem(draftKey);
      invalidate();
    },
  });

  const { data: agentCtx } = useQuery({
    queryKey: ['tickets', ticketId, 'agent-context'],
    queryFn: () => getAgentContext(ticketId),
    enabled: !!ticket && ticket.status !== 'CLOSED',
  });

  const { data: cannedReplies = [] } = useQuery({
    queryKey: ['canned-replies'],
    queryFn: () => listCannedReplies(),
  });

  const suggestMut = useMutation({
    mutationFn: () => suggestReply(ticketId),
    onSuccess: (r) => { if (r.text) setDraft(r.text); },
  });

  const insertText = (text: string) =>
    setDraft((prev) => (prev.trim() ? `${prev.trimEnd()}\n${text}` : text));

  const handleSend = () => {
    const trimmed = draft.trim();
    if (!trimmed || !ticket) return;
    sendMut.mutate(trimmed);
  };

  if (loadingTicket) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-6">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-10 w-2/3" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-foreground-muted">
        Ticket not found.
      </div>
    );
  }

  const isClosed = ticket.status === 'CLOSED';
  const isResolved = ticket.status === 'RESOLVED';
  const windowOpen = conv?.windowOpen ?? false;
  const canSend = draft.trim().length > 0 && !sendMut.isPending && windowOpen && !isClosed;

  // Build message list with escalation divider:
  // The transition from inbound→first_outbound is where escalation happened.
  // We insert divider just before the first outbound after the bot escalation.
  const messages = conv?.messages ?? [];
  const contactName = ticket.contact?.name ?? conv?.contact?.name ?? 'Customer';

  // Find first outbound index (after escalation from AI, first agent reply)
  const firstOutboundIdx = messages.findIndex((m) => m.direction === 'outbound');

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--background-subtle, #f8fafc)' }}>
      {/* Header */}
      <div
        style={{
          flex: 'none',
          padding: '13px 16px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--background)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 15,
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              {ticket.num}
            </span>
            <Badge tone={STATUS_TONE[ticket.status]}>{STATUS_LABEL[ticket.status]}</Badge>
            <Badge tone={reasonTone(ticket.reason)}>{reasonLabel(ticket.reason)}</Badge>
          </div>
          <div
            style={{
              fontSize: 11.5,
              color: 'var(--text-muted)',
              marginTop: 2,
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{contactName}</span>
            <span>·</span>
            <span>
              {ticket.assignee ? `Assigned to ${ticket.assignee.name}` : 'Unassigned'}
            </span>
          </div>
        </div>

        {/* action buttons */}
        <div style={{ display: 'flex', gap: 7, flexShrink: 0, flexWrap: 'wrap' }}>
          {!ticket.assignee && !isClosed && (
            <Button
              variant="secondary"
              size="sm"
              icon={<IcUser size={14} />}
              onClick={() => assignMut.mutate()}
              disabled={assignMut.isPending}
            >
              {assignMut.isPending ? 'Assigning…' : 'Assign'}
            </Button>
          )}
          {!isResolved && !isClosed && (
            <Button
              variant="secondary"
              size="sm"
              icon={<IcCheck size={14} />}
              onClick={() => resolveMut.mutate()}
              disabled={resolveMut.isPending}
            >
              {resolveMut.isPending ? 'Resolving…' : 'Resolve'}
            </Button>
          )}
          {!isClosed && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => closeMut.mutate()}
              disabled={closeMut.isPending}
            >
              {closeMut.isPending ? 'Closing…' : 'Close'}
            </Button>
          )}
          {isClosed && (
            <Button
              variant="secondary"
              size="sm"
              icon={<IcMessage size={14} />}
              onClick={() => reopenMut.mutate()}
              disabled={reopenMut.isPending}
            >
              {reopenMut.isPending ? 'Reopening…' : 'Reopen'}
            </Button>
          )}
        </div>
      </div>

      {/* Thread */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '18px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {loadingConv && (
          <>
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-10 w-1/2" />
          </>
        )}

        {!loadingConv &&
          messages.map((m, i) => {
            const bubbleMsg: BubbleMessage = {
              id: m.id,
              body: m.body ?? '',
              timestamp: m.timestamp,
              direction: m.direction,
            };

            const showDivider =
              i === firstOutboundIdx && firstOutboundIdx > 0 && firstOutboundIdx < messages.length;

            return (
              <div key={m.id}>
                {showDivider && <EscalationDivider reason={reasonLabel(ticket.reason)} />}
                <MessageBubble message={bubbleMsg} agentName="You" />
              </div>
            );
          })}

        {/* Status timeline */}
        <StatusTimeline ticket={ticket} />
      </div>

      {/* Composer */}
      {isClosed ? (
        <div
          style={{
            flex: 'none',
            padding: '14px 20px',
            borderTop: '1px solid var(--border)',
            background: 'var(--background)',
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            color: 'var(--text-muted)',
            fontSize: 13,
          }}
        >
          This ticket is closed. A new message from this dealer opens a new ticket.
        </div>
      ) : !windowOpen ? (
        <div
          style={{
            flex: 'none',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            borderTop: '1px solid var(--border)',
            background: 'rgba(245,158,11,0.05)',
            padding: '12px 20px',
            fontSize: 12,
            color: 'var(--amber-500, #f59e0b)',
          }}
        >
          <IcAlert size={14} style={{ marginTop: 1, flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 600 }}>24h customer-service window expired</div>
            <div style={{ marginTop: 2, color: 'var(--text-muted)' }}>
              {conv?.windowExpiresAt && (
                <>Closed {new Date(conv.windowExpiresAt).toLocaleString()}. </>
              )}
              To re-engage, send a template via Blasts.
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            flex: 'none',
            padding: '12px 20px 16px',
            borderTop: '1px solid var(--border)',
            background: 'var(--background)',
          }}
        >
          {/* Agent context card */}
          {agentCtx && (
            <div
              data-testid="agent-context-card"
              style={{ marginBottom: 10, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--background-subtle, #f8fafc)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: agentCtx.suggestedKnowledge.length ? 8 : 0 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Why escalated</span>
                <Badge tone={reasonTone(agentCtx.reason)} style={{ height: 19, fontSize: 10 }}>{reasonLabel(agentCtx.reason)}</Badge>
                {agentCtx.intent && <Badge tone="neutral" style={{ height: 19, fontSize: 10 }}>{agentCtx.intent}</Badge>}
                {agentCtx.confidence != null && (
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{Math.round(agentCtx.confidence * 100)}% confident</span>
                )}
              </div>
              {agentCtx.suggestedKnowledge.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Suggested knowledge</span>
                  {agentCtx.suggestedKnowledge.map((k) => (
                    <div key={k.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500 }}>{k.question}</div>
                        <div style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{k.answer}</div>
                      </div>
                      <Button variant="ghost" size="sm" data-testid="insert-kb" onClick={() => insertText(k.answer)}>Insert</Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Assist toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <Button
              variant="secondary" size="sm" data-testid="suggest-draft"
              disabled={suggestMut.isPending}
              onClick={() => suggestMut.mutate()}
            >
              {suggestMut.isPending ? 'Drafting…' : '✨ Suggest draft'}
            </Button>
            {cannedReplies.length > 0 && (
              <select
                data-testid="saved-replies"
                value=""
                onChange={(e) => {
                  const r = cannedReplies.find((c) => c.id === e.target.value);
                  if (r) insertText(r.body);
                  e.currentTarget.value = '';
                }}
                style={{ height: 30, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--background)', fontSize: 12.5, color: 'var(--text-muted)', padding: '0 8px' }}
              >
                <option value="">Saved replies…</option>
                {cannedReplies.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            )}
            {suggestMut.data?.text && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>draft · {Math.round(suggestMut.data.confidence * 100)}% conf</span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <textarea
              rows={2}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                  e.preventDefault();
                  if (canSend) handleSend();
                }
              }}
              placeholder="Write your reply…  (⌘/Ctrl+Enter to send)"
              style={{
                flex: 1, resize: 'none', minHeight: 44, borderRadius: 8,
                border: '1px solid var(--border)', background: 'var(--background)',
                padding: '8px 10px', fontSize: 13, color: 'var(--foreground)', outline: 'none',
              }}
            />
            <Button
              variant="primary" size="md" disabled={!canSend} onClick={handleSend}
              icon={<IcSend size={15} />} style={{ height: 44 }}
            >
              {sendMut.isPending ? 'Sending…' : 'Send'}
            </Button>
          </div>
          {sendMut.isError && (
            <div style={{ marginTop: 6, fontSize: 11.5, color: 'var(--red-500, #ef4444)' }}>
              {(sendMut.error as Error).message || 'Failed to send'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---- Main needs-human mode ----
export function NeedsHumanMode() {
  const [tab, setTab] = useState<'active' | 'closed'>('active');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saveKbState, setSaveKbState] = useState<{ ticketId: string; ticketNum: string } | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const { data: activeTickets = [] } = useQuery({
    queryKey: ['tickets', 'active'],
    queryFn: () => listTickets({ tab: 'active' }),
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
  });

  // Auto-select first active ticket
  useEffect(() => {
    if (!selectedId && activeTickets.length > 0) {
      setSelectedId(activeTickets[0].id);
    }
  }, [activeTickets.length, selectedId]);

  // Toast auto-dismiss
  useEffect(() => {
    if (toastMsg) {
      const t = setTimeout(() => setToastMsg(null), 3500);
      return () => clearTimeout(t);
    }
  }, [toastMsg]);

  // Get selected ticket's contactId for DealerPanel
  const { data: selectedTicket } = useQuery({
    queryKey: ['tickets', selectedId],
    queryFn: () => getTicket(selectedId!),
    enabled: !!selectedId,
  });

  return (
    <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden', position: 'relative' }}>
      {/* Queue */}
      <TicketQueue
        tab={tab}
        onTabChange={(t) => { setTab(t); setSelectedId(null); }}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />

      {/* Detail */}
      {selectedId ? (
        <TicketDetail
          ticketId={selectedId}
          onSaveKbNeeded={(tid, tnum) => setSaveKbState({ ticketId: tid, ticketNum: tnum })}
        />
      ) : (
        <div className="flex flex-1 items-center justify-center text-sm text-foreground-muted">
          Select a ticket
        </div>
      )}

      {/* Dealer panel */}
      <DealerPanel contactId={selectedTicket?.contactId ?? null} />

      {/* Save-to-knowledge modal */}
      {saveKbState && (
        <SaveToKnowledgeModal
          ticketId={saveKbState.ticketId}
          ticketNum={saveKbState.ticketNum}
          onClose={() => setSaveKbState(null)}
          onImported={() => {
            setSaveKbState(null);
            setToastMsg('Added to the knowledge base');
          }}
        />
      )}

      {/* Simple toast */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 2000,
            background: 'var(--accent)',
            color: '#fff',
            padding: '10px 18px',
            borderRadius: 10,
            fontSize: 13.5,
            fontWeight: 600,
            boxShadow: '0 4px 16px rgba(0,0,0,0.16)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <IcCheckCircle size={16} />
          {toastMsg}
        </div>
      )}
    </div>
  );
}
