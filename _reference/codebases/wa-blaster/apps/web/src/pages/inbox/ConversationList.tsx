import { useState } from 'react';
import type { ConversationListItem, InboxTab } from '../../api/inbox';
import { useInboxConversations } from '../../hooks/useInboxConversations';
import { Avatar, IcSearch, Skeleton } from '../../components/ui';
import { EmptyInbox, EmptyTab, ComingSoonAI } from './EmptyStates';

function formatRelative(iso: string | null): string {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60 * 1000) return 'just now';
  if (ms < 60 * 60 * 1000) return `${Math.floor(ms / (60 * 1000))}m`;
  if (ms < 24 * 60 * 60 * 1000) return `${Math.floor(ms / (60 * 60 * 1000))}h`;
  return `${Math.floor(ms / (24 * 60 * 60 * 1000))}d`;
}

export function ConversationList({
  tab,
  selectedContactId,
  onSelect,
  showResolved,
  onToggleResolved,
}: {
  tab: InboxTab | 'auto' | 'esc';
  selectedContactId: string | null;
  onSelect: (contactId: string) => void;
  showResolved: boolean;
  onToggleResolved: () => void;
}) {
  const [search, setSearch] = useState('');

  if (tab === 'auto' || tab === 'esc') {
    return (
      <div className="flex h-full flex-col border-r border-border bg-background">
        <ComingSoonAI />
      </div>
    );
  }

  return (
    <ConversationListInner
      tab={tab}
      selectedContactId={selectedContactId}
      onSelect={onSelect}
      showResolved={showResolved}
      onToggleResolved={onToggleResolved}
      search={search}
      setSearch={setSearch}
    />
  );
}

function ConversationListInner({
  tab,
  selectedContactId,
  onSelect,
  showResolved,
  onToggleResolved,
  search,
  setSearch,
}: {
  tab: InboxTab;
  selectedContactId: string | null;
  onSelect: (contactId: string) => void;
  showResolved: boolean;
  onToggleResolved: () => void;
  search: string;
  setSearch: (v: string) => void;
}) {
  const effectiveTab: InboxTab = showResolved ? 'resolved' : tab;
  const { data, isLoading } = useInboxConversations({
    tab: effectiveTab,
    search: search || undefined,
  });
  const items = data?.items ?? [];

  return (
    <div className="flex h-full flex-col border-r border-border bg-background">
      {/* Search */}
      <div className="border-b border-border p-3">
        <label className="relative flex items-center">
          <span className="absolute left-2.5 text-foreground-muted">
            <IcSearch size={14} />
          </span>
          <input
            type="text"
            data-testid="inbox-search"
            placeholder="Search by name or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-border bg-background py-1.5 pl-8 pr-2 text-[13px] text-foreground placeholder:text-foreground-subtle focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="space-y-2 p-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}
        {!isLoading && items.length === 0 && (
          showResolved ? <EmptyTab tab="resolved" /> : <EmptyInbox />
        )}
        {!isLoading && items.length > 0 && (
          <ul role="listbox" className="divide-y divide-border">
            {items.map((c: ConversationListItem) => {
              const selected = selectedContactId === c.contact.id;
              return (
                <li key={c.contact.id}>
                  <button
                    type="button"
                    data-testid={`inbox-conversation-row-${c.contact.id}`}
                    aria-pressed={selected}
                    onClick={() => onSelect(c.contact.id)}
                    className={
                      'flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-background-hover ' +
                      (selected
                        ? 'border-l-2 border-accent bg-background-hover'
                        : 'border-l-2 border-transparent')
                    }
                  >
                    <Avatar name={c.contact.name} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="truncate text-[13px] font-medium text-foreground">
                          {c.contact.name}
                        </div>
                        <div className="shrink-0 text-[11px] text-foreground-muted">
                          {formatRelative(c.lastInboundAt ?? c.lastOutboundAt)}
                        </div>
                      </div>
                      <div className="mt-0.5 truncate text-[12px] text-foreground-muted">
                        {c.lastPreview || (c.lastDirection === 'outbound' ? '(no preview)' : '')}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5">
                        {c.windowOpen ? (
                          <span className="text-[10px] font-medium text-green-700">In window</span>
                        ) : (
                          <span className="text-[10px] font-medium text-amber-500">Window closed</span>
                        )}
                        {c.attribution && (
                          <span className="truncate text-[10px] text-foreground-subtle">
                            · {c.attribution.blastName}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Show resolved toggle */}
      <button
        type="button"
        data-testid="inbox-show-resolved-toggle"
        onClick={onToggleResolved}
        aria-pressed={showResolved}
        className="flex items-center justify-between border-t border-border px-3 py-2.5 hover:bg-background-hover"
      >
        <span className="text-[12px] text-foreground-muted">Show resolved</span>
        <span
          aria-hidden="true"
          className={
            'relative inline-block h-[18px] w-[30px] shrink-0 rounded-full transition-colors ' +
            (showResolved ? 'bg-accent' : 'bg-foreground-subtle/40')
          }
        >
          <i
            className={
              'absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white transition-transform ' +
              (showResolved ? 'translate-x-[14px]' : 'translate-x-0.5')
            }
          />
        </span>
      </button>
    </div>
  );
}
