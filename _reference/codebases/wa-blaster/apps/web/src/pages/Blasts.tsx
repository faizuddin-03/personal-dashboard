import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { listBlasts, type Blast } from '../api/blasts';
import BlastStatusBadge from '../components/BlastStatusBadge';
import { Page, PageHead, Empty } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { IcPlus, IcSend } from '../components/ui/icons';

export default function Blasts() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['blasts'],
    queryFn: () => listBlasts(),
  });

  return (
    <Page>
      <PageHead
        title="Blasts"
        subtitle="Outbound campaigns"
        actions={
          <Link to="/blasts/new" data-testid="new-blast">
            <Button variant="primary" icon={<IcPlus size={14} />}>New Blast</Button>
          </Link>
        }
      />

      {isLoading && <p className="text-sm text-foreground-muted">Loading…</p>}
      {error && <p className="text-sm text-red-500">Failed to load blasts.</p>}

      {data && data.length === 0 && (
        <Empty
          icon={<IcSend size={20} />}
          title="No blasts yet"
          body="Create your first blast to start sending outbound campaigns."
          cta={
            <Link to="/blasts/new">
              <Button variant="primary" icon={<IcPlus size={14} />}>New Blast</Button>
            </Link>
          }
        />
      )}

      {data && data.length > 0 && (
        <div className="space-y-2" data-testid="blasts-list">
          {data.map((b: Blast) => (
            <Link
              key={b.id}
              to={`/blasts/${b.id}`}
              className="block rounded-lg border border-border bg-background p-4 hover:bg-background-subtle"
              data-testid={`blast-row-${b.id}`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-medium text-foreground">{b.name}</div>
                  <div className="mt-0.5 text-xs text-foreground-muted">
                    {b.templateName} · {b.totalRecipients} recipients · scheduled {new Date(b.scheduledAt).toLocaleString()}
                  </div>
                </div>
                <BlastStatusBadge status={b.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </Page>
  );
}
