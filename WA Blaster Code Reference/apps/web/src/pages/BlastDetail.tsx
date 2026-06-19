import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cancelBlast, getBlast, getBlastStats, type BlastStatus } from '../api/blasts';
import BlastStatusBadge from '../components/BlastStatusBadge';
import { Page, PageHead, Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const ACTIVE_STATUSES: BlastStatus[] = ['SCHEDULED', 'RUNNING'];

export default function BlastDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: blast } = useQuery({
    queryKey: ['blast', id],
    queryFn: () => getBlast(id!),
    refetchInterval: (q) => (q.state.data && ACTIVE_STATUSES.includes(q.state.data.status) ? 5000 : false),
  });

  const { data: stats } = useQuery({
    queryKey: ['blast-stats', id],
    queryFn: () => getBlastStats(id!),
    refetchInterval: (q) => (q.state.data && ACTIVE_STATUSES.includes(q.state.data.status) ? 5000 : false),
  });

  const cancel = useMutation({
    mutationFn: () => cancelBlast(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blast', id] });
      qc.invalidateQueries({ queryKey: ['blast-stats', id] });
      qc.invalidateQueries({ queryKey: ['blasts'] });
    },
  });

  if (!blast || !stats) return <Page><p className="text-foreground-muted">Loading…</p></Page>;

  const counts = stats.counts;
  const delivered = counts.DELIVERED + counts.READ;
  const sent = counts.SENT + counts.DELIVERED + counts.READ;
  const failed = counts.FAILED;
  const pct = (n: number) => Math.round((n / Math.max(1, stats.totalRecipients)) * 100);

  return (
    <Page>
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/blasts')}
          className="mb-4"
        >
          ← Back to blasts
        </Button>
        <PageHead
          title={blast.name}
          subtitle={`${blast.totalRecipients} messages · ${blast.uniqueContacts} contacts · Template: ${blast.templateName} · Scheduled: ${new Date(blast.scheduledAt).toLocaleString()}`}
          actions={
            <div className="flex items-center gap-3">
              <BlastStatusBadge status={blast.status} />
              {ACTIVE_STATUSES.includes(blast.status) && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (window.confirm('Cancel this blast? Already-sent messages cannot be unsent.')) cancel.mutate();
                  }}
                  disabled={cancel.isPending}
                  data-testid="blast-cancel"
                >
                  {cancel.isPending ? 'Canceling…' : 'Cancel blast'}
                </Button>
              )}
            </div>
          }
        />
      </div>

      {/* Live progress bar — only when active */}
      {ACTIVE_STATUSES.includes(blast.status) && (
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">Live progress</span>
            <span className="text-xs text-foreground-muted">Polling every 5 seconds</span>
          </div>
          <div className="h-2 w-full rounded-full bg-background-hover overflow-hidden">
            <div
              className="h-2 rounded-full bg-accent transition-all duration-500"
              style={{ width: `${pct(sent + counts.CANCELED + failed)}%` }}
              data-testid="progress-bar"
            />
          </div>
          <p className="mt-2 text-xs text-foreground-muted">
            The page will stop polling once the blast completes.
          </p>
        </Card>
      )}

      {/* Counters grid */}
      <div
        className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6"
        data-testid="blast-counters"
      >
        <Counter label="Total" value={stats.totalRecipients} tone="neutral" />
        <Counter label="Sent" value={sent} pct={pct(sent)} tone="blue" testId="counter-sent" />
        <Counter label="Delivered" value={delivered} pct={pct(delivered)} tone="green" testId="counter-delivered" />
        <Counter label="Read" value={counts.READ} pct={pct(counts.READ)} tone="teal" testId="counter-read" />
        <Counter label="Failed" value={failed} pct={pct(failed)} tone="red" testId="counter-failed" />
      </div>
    </Page>
  );
}

function Counter({
  label, value, pct, tone, testId,
}: {
  label: string; value: number; pct?: number; tone: 'neutral' | 'blue' | 'green' | 'teal' | 'red';
  testId?: string;
}) {
  const styles: Record<typeof tone, string> = {
    neutral: 'bg-background-subtle text-foreground border border-border',
    blue: 'bg-blue-50 text-blue-500 border border-border',
    green: 'bg-green-50 text-green-700 border border-border',
    teal: 'bg-green-50 text-green-700 border border-border',
    red: 'bg-red-50 text-red-500 border border-border',
  };
  return (
    <div
      className={`rounded-lg p-4 text-center ${styles[tone]}`}
      data-testid={testId}
    >
      <div className="text-2xl font-bold tabular-nums">{value.toLocaleString()}</div>
      <div className="mt-1 text-xs font-medium">
        {label}{pct !== undefined ? ` (${pct}%)` : ''}
      </div>
    </div>
  );
}
