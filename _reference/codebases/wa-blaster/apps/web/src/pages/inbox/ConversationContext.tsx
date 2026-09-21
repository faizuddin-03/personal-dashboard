import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useInboxConversation } from '../../hooks/useInboxConversation';
import {
  resolveInboxConversation,
  reopenInboxConversation,
  type ThreadMessage,
} from '../../api/inbox';
import { Button, IcCheck, IcMessage } from '../../components/ui';

function findLastBlastAttribution(messages: ThreadMessage[]): ThreadMessage | undefined {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const m = messages[i];
    if (m.direction === 'outbound' && m.source === 'BLAST' && m.blastName) {
      return m;
    }
  }
  return undefined;
}

export function ConversationContext({ contactId }: { contactId: string | null }) {
  const qc = useQueryClient();
  const { data } = useInboxConversation(contactId);

  const resolveMut = useMutation({
    mutationFn: () => resolveInboxConversation(contactId!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inbox'] }),
  });
  const reopenMut = useMutation({
    mutationFn: () => reopenInboxConversation(contactId!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inbox'] }),
  });

  if (!contactId || !data) {
    return (
      <aside className="hidden h-full flex-col gap-4 border-l border-border bg-background p-4 lg:flex" />
    );
  }

  const isResolved = !!data.resolvedAt;
  const attribution = findLastBlastAttribution(data.messages);
  const lastInbound = (() => {
    for (let i = data.messages.length - 1; i >= 0; i -= 1) {
      if (data.messages[i].direction === 'inbound') return data.messages[i];
    }
    return undefined;
  })();

  return (
    <aside className="flex h-full flex-col gap-4 overflow-y-auto border-l border-border bg-background p-4">
      <Section title="Contact">
        <div className="text-[13px] font-medium text-foreground">{data.contact.name}</div>
        <div className="text-[12px] text-foreground-muted">{data.contact.phone}</div>
      </Section>

      {attribution && (
        <Section title="Attribution">
          <div className="text-[12px] text-foreground-muted">Reply to blast</div>
          <div className="mt-1 text-[13px] font-medium text-foreground">
            {attribution.blastName}
          </div>
        </Section>
      )}

      <Section title="Window">
        <div className="text-[12px] text-foreground-muted">
          {data.windowOpen ? (
            <>
              Open until{' '}
              <span className="text-foreground">
                {data.windowExpiresAt
                  ? new Date(data.windowExpiresAt).toLocaleString()
                  : '—'}
              </span>
            </>
          ) : (
            <>
              {data.windowExpiresAt
                ? `Closed ${new Date(data.windowExpiresAt).toLocaleString()}`
                : 'Window has never been opened'}
            </>
          )}
        </div>
      </Section>

      {lastInbound && (
        <Section title="Last reply">
          <div className="text-[12px] text-foreground-muted">
            {new Date(lastInbound.timestamp).toLocaleString()}
          </div>
        </Section>
      )}

      <div className="mt-auto flex flex-col gap-2">
        {!isResolved ? (
          <Button
            type="button"
            variant="primary"
            size="md"
            icon={<IcCheck size={14} />}
            data-testid="inbox-mark-resolved"
            onClick={() => resolveMut.mutate()}
            disabled={resolveMut.isPending}
          >
            {resolveMut.isPending ? 'Marking…' : 'Mark resolved'}
          </Button>
        ) : (
          <Button
            type="button"
            variant="secondary"
            size="md"
            icon={<IcMessage size={14} />}
            data-testid="inbox-reopen"
            onClick={() => reopenMut.mutate()}
            disabled={reopenMut.isPending}
          >
            {reopenMut.isPending ? 'Reopening…' : 'Reopen'}
          </Button>
        )}
        <Link
          to="/blasts/new"
          className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border-strong bg-background px-3 py-1.5 text-[12px] font-medium text-foreground hover:bg-background-hover"
        >
          Re-engage via Blast
        </Link>
      </div>
    </aside>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-foreground-muted">
        {title}
      </h3>
      {children}
    </section>
  );
}
