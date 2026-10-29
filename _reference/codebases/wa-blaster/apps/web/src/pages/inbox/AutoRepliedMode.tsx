// AutoRepliedMode.tsx — Auto-replied mode: list grouped by contactId + thread with audit cards
import { useRef, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listAutopilotEvents } from '../../api/autopilot';
import type { AutopilotEvent } from '../../api/autopilot';
import { getInboxConversation } from '../../api/inbox';
import { Avatar, Badge, AIOrb, IcSearch, Empty, Skeleton, IcMessage } from '../../components/ui';
import { DealerPanel } from '../../components/inbox/DealerPanel';
import {
  MessageBubble,
  ResolvedByAIFooter,
  type BubbleMessage,
} from '../../components/inbox/MessageBubble';

// ---- Group autopilot events by contactId (latest event per contact) ----
interface ConversationRow {
  contactId: string;
  contactName: string | null;
  latestEvent: AutopilotEvent;
  allEvents: AutopilotEvent[];
}

function groupEventsByContact(events: AutopilotEvent[]): ConversationRow[] {
  const map = new Map<string, AutopilotEvent[]>();
  for (const ev of events) {
    const arr = map.get(ev.contactId) ?? [];
    arr.push(ev);
    map.set(ev.contactId, arr);
  }
  const rows: ConversationRow[] = [];
  map.forEach((evs, contactId) => {
    const sorted = [...evs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    rows.push({
      contactId,
      contactName: sorted[0].contact?.name ?? null,
      latestEvent: sorted[0],
      allEvents: sorted,
    });
  });
  // Sort rows: most recent conversation first
  rows.sort(
    (a, b) =>
      new Date(b.latestEvent.createdAt).getTime() -
      new Date(a.latestEvent.createdAt).getTime(),
  );
  return rows;
}

// ---- Thread panel for a selected contact ----
function AutoRepliedThread({
  contactId,
  events,
}: {
  contactId: string;
  events: AutopilotEvent[];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: conv, isLoading } = useQuery({
    queryKey: ['inbox', 'conversation', contactId],
    queryFn: () => getInboxConversation(contactId),
    enabled: !!contactId,
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
  });

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [conv?.messages.length, contactId]);

  if (isLoading || !conv) {
    return (
      <div className="flex flex-1 flex-col gap-3 p-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-8 w-2/3" />
      </div>
    );
  }

  // Map each outbound message to an audit event:
  //   1) by exact replyText match
  //   2) fallback: pair outbound messages to events by insertion order
  const outboundMessages = conv.messages.filter((m) => m.direction === 'outbound');
  const eventByReplyText = new Map<string, AutopilotEvent>();
  for (const ev of events) {
    if (ev.replyText) eventByReplyText.set(ev.replyText.trim(), ev);
  }

  let unmatchedEvIdx = 0;
  const unmatchedEvents = events.filter((ev) => {
    if (!ev.replyText) return true;
    return !eventByReplyText.has(ev.replyText.trim());
  });

  function auditForOutbound(body: string): AutopilotEvent | null {
    const trimmed = body.trim();
    if (eventByReplyText.has(trimmed)) return eventByReplyText.get(trimmed)!;
    // Fallback: assign by order
    if (unmatchedEvIdx < unmatchedEvents.length) {
      return unmatchedEvents[unmatchedEvIdx++];
    }
    return null;
  }

  return (
    <div className="flex flex-1 flex-col min-h-0" style={{ background: 'var(--background-subtle, #f8fafc)' }}>
      {/* Header */}
      <header
        style={{
          flex: 'none',
          minHeight: 64,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 16px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--background)',
        }}
      >
        <Avatar name={conv.contact.name} size="md" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{ fontSize: 14.5, fontWeight: 600 }}
            className="truncate"
          >
            {conv.contact.name}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
            {conv.contact.phone}
          </div>
        </div>
        <Badge tone="brand">Fully auto-handled</Badge>
      </header>

      {/* Messages */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '22px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {conv.messages.map((m) => {
          const bubbleMsg: BubbleMessage = {
            id: m.id,
            body: m.body ?? '',
            timestamp: m.timestamp,
            direction: m.direction,
            // Mark outbound as bot — all auto-replied outbound are from bot
            isBot: m.direction === 'outbound',
          };

          const audit =
            m.direction === 'outbound' ? auditForOutbound(m.body ?? '') : null;

          return (
            <MessageBubble key={m.id} message={bubbleMsg} auditEvent={audit} />
          );
        })}
        <ResolvedByAIFooter />
      </div>
    </div>
  );
}

// ---- Main auto-replied mode ----
export function AutoRepliedMode() {
  const [search, setSearch] = useState('');
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['autopilot', 'events', 'AUTO_REPLIED'],
    queryFn: () => listAutopilotEvents({ action: 'AUTO_REPLIED' }),
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
  });

  // events for selected contact (all AUTO_REPLIED for that contact)
  const { data: contactEvents = [] } = useQuery({
    queryKey: ['autopilot', 'events', 'AUTO_REPLIED', selectedContactId],
    queryFn: () =>
      listAutopilotEvents({ action: 'AUTO_REPLIED', contactId: selectedContactId! }),
    enabled: !!selectedContactId,
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
  });

  const rows = groupEventsByContact(events);

  // Filter by search
  const sq = search.trim().toLowerCase();
  const filtered = sq
    ? rows.filter(
        (r) =>
          (r.contactName ?? '').toLowerCase().includes(sq) ||
          r.latestEvent.intent?.toLowerCase().includes(sq) ||
          r.latestEvent.replyText?.toLowerCase().includes(sq),
      )
    : rows;

  // Auto-select first item
  useEffect(() => {
    if (!selectedContactId && filtered.length > 0) {
      setSelectedContactId(filtered[0].contactId);
    }
  }, [filtered.length, selectedContactId]);

  if (isLoading) {
    return (
      <div className="flex flex-1 gap-3 p-4">
        <div className="w-[330px] flex-none space-y-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
        <div className="flex-1 space-y-2">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-10 w-1/2" />
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Empty
          icon={<IcMessage size={20} />}
          title="No auto-replied conversations yet"
          body="Conversations the AI handles on its own will appear here, with full audit trails."
        />
      </div>
    );
  }

  const selectedRow = filtered.find((r) => r.contactId === selectedContactId) ?? null;

  return (
    <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
      {/* Left: conversation list */}
      <div
        style={{
          width: 330,
          flex: 'none',
          borderRight: '1px solid var(--border)',
          background: 'var(--background)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Search */}
        <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
          <label style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span
              style={{
                position: 'absolute',
                left: 10,
                color: 'var(--text-muted)',
                pointerEvents: 'none',
              }}
            >
              <IcSearch size={14} />
            </span>
            <input
              type="text"
              placeholder="Search conversations…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--background)',
                padding: '6px 10px 6px 32px',
                fontSize: 13,
                color: 'var(--foreground)',
                outline: 'none',
              }}
            />
          </label>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filtered.length === 0 && (
            <div style={{ padding: '24px 12px', textAlign: 'center', fontSize: 12.5, color: 'var(--text-muted)' }}>
              No results
            </div>
          )}
          {filtered.map((row) => {
            const isSelected = row.contactId === selectedContactId;
            return (
              <button
                key={row.contactId}
                type="button"
                onClick={() => setSelectedContactId(row.contactId)}
                style={{
                  display: 'flex',
                  gap: 11,
                  padding: '11px 12px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  background: isSelected ? 'var(--background-hover)' : 'transparent',
                  border: isSelected ? '1.5px solid var(--accent)' : '1.5px solid transparent',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                <Avatar name={row.contactName ?? undefined} size="md" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{ fontSize: 13.5, fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {row.contactName ?? row.contactId}
                    </span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                        fontSize: 10,
                        color: '#7C5CFC',
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      <AIOrb size={12} />
                      auto
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      marginTop: 2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {row.latestEvent.replyText ?? ''}
                  </div>
                  {row.latestEvent.intent && (
                    <div style={{ marginTop: 5 }}>
                      <Badge tone="neutral" mono style={{ height: 19, fontSize: 10.5 }}>
                        {row.latestEvent.intent}
                      </Badge>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Center: thread */}
      {selectedContactId && selectedRow ? (
        <AutoRepliedThread contactId={selectedContactId} events={contactEvents} />
      ) : (
        <div className="flex flex-1 items-center justify-center text-sm text-foreground-muted">
          Select a conversation
        </div>
      )}

      {/* Right: dealer panel */}
      <DealerPanel contactId={selectedContactId} />
    </div>
  );
}
