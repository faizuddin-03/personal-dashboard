// StatusTimeline.tsx — horizontal timeline Opened › Assigned › Resolved › Closed
import type { Ticket } from '../../api/tickets';
import { IcChevR } from '../../components/ui';

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

interface Stage {
  label: string;
  ts: string | null | undefined;
}

export function StatusTimeline({ ticket }: { ticket: Ticket }) {
  const stages: Stage[] = [
    { label: 'Opened', ts: ticket.openedAt },
    { label: 'Assigned', ts: ticket.assignedAt },
    { label: 'Resolved', ts: ticket.resolvedAt },
    { label: 'Closed', ts: ticket.closedAt },
  ].filter((s) => s.ts); // only show completed stages

  if (stages.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
        fontSize: 11,
        color: 'var(--text-subtle, var(--text-muted))',
      }}
    >
      {stages.map((s, i) => (
        <span key={s.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          {i > 0 && <IcChevR size={11} style={{ opacity: 0.5 }} />}
          <span>
            <b style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{s.label}</b>{' '}
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5 }}>
              {fmtDate(s.ts)}
            </span>
          </span>
        </span>
      ))}
    </div>
  );
}
