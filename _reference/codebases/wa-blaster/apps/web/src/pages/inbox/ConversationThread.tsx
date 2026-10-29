import { useEffect, useRef } from 'react';
import { useInboxConversation } from '../../hooks/useInboxConversation';
import type { ThreadMessage } from '../../api/inbox';
import { Avatar, Skeleton } from '../../components/ui';
import { Composer } from './Composer';
import { WindowPill } from './WindowPill';
import { NoSelection } from './EmptyStates';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function renderBody(m: ThreadMessage): string {
  if (m.body && m.body.length > 0) return m.body;
  // Legacy outbound blast messages may have null body
  if (m.direction === 'outbound' && m.source === 'BLAST' && m.blastName) {
    return `(template: ${m.blastName})`;
  }
  return '';
}

export function ConversationThread({ contactId }: { contactId: string | null }) {
  const { data, isLoading } = useInboxConversation(contactId);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [data?.messages.length, contactId]);

  if (!contactId) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <NoSelection />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full flex-col bg-background">
        <div className="border-b border-border p-4">
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="flex-1 space-y-3 p-4">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-10 w-1/2" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <span className="text-[13px] text-foreground-muted">Conversation not found.</span>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={data.contact.name} size="md" />
          <div className="min-w-0">
            <div className="truncate text-[13px] font-medium text-foreground">
              {data.contact.name}
            </div>
            <div className="truncate text-[11px] text-foreground-muted">
              {data.contact.phone}
            </div>
          </div>
        </div>
        <WindowPill
          windowOpen={data.windowOpen}
          windowExpiresAt={data.windowExpiresAt}
        />
      </header>

      {/* Messages */}
      <div
        ref={scrollerRef}
        className="flex-1 space-y-2 overflow-y-auto bg-background-subtle/40 p-4"
      >
        {data.messages.length === 0 && (
          <div className="text-center text-[12px] text-foreground-muted">
            No messages yet.
          </div>
        )}
        {data.messages.map((m) => {
          const isInbound = m.direction === 'inbound';
          const body = renderBody(m);
          return (
            <div
              key={m.id}
              className={isInbound ? 'flex justify-start' : 'flex justify-end'}
            >
              <div
                className={
                  'max-w-[75%] rounded-lg px-3 py-2 text-[13px] shadow-sm ' +
                  (isInbound
                    ? 'rounded-bl-sm bg-background text-foreground'
                    : 'rounded-br-sm bg-accent/15 text-foreground')
                }
              >
                {body ? (
                  <div className="whitespace-pre-wrap break-words">{body}</div>
                ) : (
                  <div className="italic text-foreground-muted">(empty message)</div>
                )}
                <div
                  className={
                    'mt-1 text-[10px] ' +
                    (isInbound ? 'text-foreground-muted' : 'text-foreground-muted')
                  }
                >
                  {formatTime(m.timestamp)}
                  {!isInbound && m.status && ` · ${m.status.toLowerCase()}`}
                  {!isInbound && m.source === 'BLAST' && m.blastName && ` · ${m.blastName}`}
                  {m.failureReason && ` · ${m.failureReason}`}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Composer */}
      <Composer
        contactId={data.contact.id}
        windowOpen={data.windowOpen}
        windowExpiresAt={data.windowExpiresAt}
      />
    </div>
  );
}
