import { useState, type ReactElement } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { listBlasts, getBlastStats, type Blast, type BlastStatus } from '../api/blasts';
import { Page, PageHead, Empty } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge, type BadgeTone } from '../components/ui/Badge';
import { Progress } from '../components/ui/Misc';
import {
  IcPlus, IcSend, IcCalendar, IcCheck, IcClock, IcAlert, IcEdit, IcX,
} from '../components/ui/icons';

/* ── status config ──────────────────────────────────────────── */
type StatusConfig = {
  tone: BadgeTone;
  label: string;
  icon: ReactElement;
  pulse: boolean;
  solid: boolean;
};

const STATUS_CFG: Partial<Record<BlastStatus, StatusConfig>> = {
  RUNNING:   { tone: 'brand',   label: 'Sending',   icon: <IcSend size={11} />,     pulse: true,  solid: true  },
  COMPLETED: { tone: 'success', label: 'Sent',       icon: <IcCheck size={11} />,    pulse: false, solid: false },
  SCHEDULED: { tone: 'blue',    label: 'Scheduled',  icon: <IcCalendar size={11} />, pulse: false, solid: false },
  DRAFT:     { tone: 'neutral', label: 'Draft',      icon: <IcEdit size={11} />,     pulse: false, solid: false },
  FAILED:    { tone: 'red',     label: 'Failed',     icon: <IcAlert size={11} />,    pulse: false, solid: false },
  CANCELED:  { tone: 'neutral', label: 'Canceled',   icon: <IcX size={11} />,        pulse: false, solid: false },
};

function getStatusCfg(s: BlastStatus): StatusConfig {
  return STATUS_CFG[s] ?? { tone: 'neutral', label: s, icon: <IcClock size={11} />, pulse: false, solid: false };
}

/* ── pulsing dot for RUNNING status ─────────────────────────── */
function PulseDot() {
  return (
    <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8, flexShrink: 0 }}>
      <span style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: 'currentColor', opacity: 0.45,
        animation: 'ping 1.2s cubic-bezier(0,0,0.2,1) infinite',
      }} />
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
    </span>
  );
}

/* ── helpers ─────────────────────────────────────────────────── */
function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });
}

function audienceLabel(b: Blast): string {
  if (b.segmentId) return `Segment ${b.segmentId.slice(0, 8)}`;
  if (b.uniqueContacts > 0) return `${b.uniqueContacts.toLocaleString()} contacts`;
  return 'All opted-in contacts';
}

/* ── campaign card ───────────────────────────────────────────── */
function CampaignCard({ blast }: { blast: Blast }) {
  const navigate = useNavigate();
  const cfg = getStatusCfg(blast.status);

  const { data: stats } = useQuery({
    queryKey: ['blast-stats', blast.id],
    queryFn: () => getBlastStats(blast.id),
    enabled: blast.status === 'RUNNING',
    refetchInterval: blast.status === 'RUNNING' ? 5000 : false,
  });
  const progressPct = stats && stats.totalRecipients > 0
    ? Math.round(((stats.totalRecipients - (stats.counts.QUEUED ?? 0)) / stats.totalRecipients) * 100)
    : 0;

  const hasProgress = blast.status === 'RUNNING';
  const dateStr = blast.completedAt
    ? fmtDate(blast.completedAt)
    : blast.startedAt
    ? fmtDate(blast.startedAt)
    : fmtDate(blast.scheduledAt);

  return (
    <div
      className="v-card hoverable"
      role="button"
      tabIndex={0}
      data-testid={`blast-row-${blast.id}`}
      onClick={() => navigate(`/blasts/${blast.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/blasts/${blast.id}`); }
      }}
      style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12, cursor: 'pointer' }}
    >
      {/* row 1: name + status badge · template · audience + date/recipients */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 15, fontWeight: 600 }} className="truncate">{blast.name}</span>
            <Badge
              tone={cfg.tone}
              solid={cfg.solid}
              icon={cfg.pulse ? <PulseDot /> : cfg.icon}
            >
              {cfg.label}
            </Badge>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, fontSize: 12.5, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{blast.templateName}</span>
            <span>·</span>
            <span className="truncate">{audienceLabel(blast)}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, whiteSpace: 'nowrap' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{dateStr}</div>
          <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>
            {blast.totalRecipients.toLocaleString()} recipients
          </div>
        </div>
      </div>

      {/* progress bar — visible only while RUNNING */}
      {hasProgress && (
        <div style={{ marginTop: 2 }}>
          <Progress value={progressPct} />
        </div>
      )}
    </div>
  );
}

/* ── page ────────────────────────────────────────────────────── */
export default function Campaigns() {
  const [statusFilter, setStatusFilter] = useState<BlastStatus | 'ALL'>('ALL');
  const { data, isLoading, error } = useQuery({
    queryKey: ['blasts', statusFilter],
    queryFn: () => listBlasts(statusFilter === 'ALL' ? undefined : [statusFilter]),
  });

  return (
    <Page>
      <PageHead
        title="Campaigns"
        subtitle="Outbound WhatsApp campaigns"
        actions={
          <Link to="/blasts/new" data-testid="new-blast">
            <Button variant="primary" icon={<IcPlus size={14} />}>New campaign</Button>
          </Link>
        }
      />

      <div data-testid="status-filter" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {(['ALL', 'SCHEDULED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELED', 'DRAFT'] as const).map((s) => {
          const active = statusFilter === s;
          const label = s === 'ALL' ? 'All' : (STATUS_CFG[s]?.label ?? s);
          return (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              style={{
                padding: '4px 12px', borderRadius: 999, fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
                border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                background: active ? 'var(--accent-fill)' : 'var(--bg)',
                color: active ? 'var(--accent-text)' : 'var(--text-muted)',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {isLoading && <p className="text-sm text-foreground-muted">Loading…</p>}
      {error && <p className="text-sm text-red-500">Failed to load campaigns.</p>}

      {data && data.length === 0 && statusFilter === 'ALL' && (
        <Empty
          icon={<IcSend size={20} />}
          title="No campaigns yet"
          body="Create your first campaign to start sending outbound WhatsApp messages."
          cta={
            <Link to="/blasts/new">
              <Button variant="primary" icon={<IcPlus size={14} />}>New campaign</Button>
            </Link>
          }
        />
      )}
      {data && data.length === 0 && statusFilter !== 'ALL' && (
        <p className="text-sm text-foreground-muted">No campaigns match this filter.</p>
      )}

      {data && data.length > 0 && (
        <div className="space-y-3" data-testid="blasts-list">
          {data.map((b: Blast) => (
            <CampaignCard key={b.id} blast={b} />
          ))}
        </div>
      )}
    </Page>
  );
}
