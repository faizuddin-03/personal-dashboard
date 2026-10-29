import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { sendInboxReply } from '../../api/inbox';
import { Button, IcSend, IcAlert } from '../../components/ui';

const MAX = 1024;

export function Composer({
  contactId,
  windowOpen,
  windowExpiresAt,
}: {
  contactId: string;
  windowOpen: boolean;
  windowExpiresAt: string | null;
}) {
  const draftKey = `inbox-draft-${contactId}`;
  const [body, setBody] = useState<string>(() => sessionStorage.getItem(draftKey) ?? '');
  const taRef = useRef<HTMLTextAreaElement>(null);
  const qc = useQueryClient();

  // Reload draft when contact switches
  useEffect(() => {
    setBody(sessionStorage.getItem(draftKey) ?? '');
  }, [draftKey]);

  // Persist draft
  useEffect(() => {
    if (body) sessionStorage.setItem(draftKey, body);
    else sessionStorage.removeItem(draftKey);
  }, [body, draftKey]);

  const sendMut = useMutation({
    mutationFn: (b: string) => sendInboxReply(contactId, b),
    onSuccess: () => {
      setBody('');
      sessionStorage.removeItem(draftKey);
      qc.invalidateQueries({ queryKey: ['inbox'] });
    },
  });

  if (!windowOpen) {
    return (
      <div
        data-testid="inbox-composer-closed"
        className="flex items-start gap-2 border-t border-border bg-amber-50 px-4 py-3 text-[12px] text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
      >
        <span className="mt-[1px] shrink-0">
          <IcAlert size={14} />
        </span>
        <div>
          <div className="font-medium">24h customer-service window expired</div>
          <div className="mt-0.5 text-foreground-muted">
            {windowExpiresAt && (
              <>Closed {new Date(windowExpiresAt).toLocaleString()}. </>
            )}
            To re-engage, send an approved template via{' '}
            <Link
              to="/blasts/new"
              className="font-medium text-accent hover:underline"
            >
              Blasts
            </Link>
            .
          </div>
        </div>
      </div>
    );
  }

  const trimmed = body.trim();
  const tooLong = body.length > MAX;
  const canSend = trimmed.length > 0 && !tooLong && !sendMut.isPending;

  return (
    <form
      className="border-t border-border bg-background p-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSend) sendMut.mutate(trimmed);
      }}
    >
      <textarea
        ref={taRef}
        data-testid="inbox-composer"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && canSend) {
            e.preventDefault();
            sendMut.mutate(trimmed);
          }
        }}
        rows={3}
        maxLength={MAX + 1}
        placeholder="Type your reply… (Cmd/Ctrl+Enter to send)"
        className="block w-full resize-none rounded-md border border-border bg-background px-2.5 py-2 text-[13px] text-foreground placeholder:text-foreground-subtle focus:outline-none focus:ring-2 focus:ring-accent"
      />
      <div className="mt-2 flex items-center justify-between">
        <span
          className={
            'text-[11px] tabular-nums ' +
            (tooLong ? 'text-red-500' : 'text-foreground-muted')
          }
        >
          {body.length}/{MAX}
        </span>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={!canSend}
          icon={<IcSend size={13} />}
          data-testid="inbox-send-button"
        >
          {sendMut.isPending ? 'Sending…' : 'Send'}
        </Button>
      </div>
      {sendMut.isError && (
        <div className="mt-2 text-[12px] text-red-500">
          {(sendMut.error as Error).message || 'Failed to send'}
        </div>
      )}
    </form>
  );
}
