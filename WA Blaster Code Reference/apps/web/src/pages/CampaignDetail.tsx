import { useState, type ReactElement } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cancelBlast, getBlast, getBlastStats,
  listBlastMessages, retryBlastMessage, retryFailedMessages,
  type BlastStatus, type MessageStatus, type BlastMessage,
} from '../api/blasts';
import { Page } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge, type BadgeTone } from '../components/ui/Badge';
import {
  IcChevL, IcSend, IcCalendar, IcCheck, IcClock, IcAlert, IcEdit, IcX,
} from '../components/ui/icons';
import Pagination from '../components/Pagination';
import { useToast } from '../components/toast/ToastProvider';
import { getSendTimeAdvice, type SendTimeAdviceResponse } from '../api/analytics';

/* ── status config (mirrors Campaigns.tsx) ───────────────────── */
type StatusConfig = { tone: BadgeTone; label: string; icon: ReactElement; solid: boolean };

const STATUS_CFG: Partial<Record<BlastStatus, StatusConfig>> = {
  RUNNING:   { tone: 'brand',   label: 'Sending',   icon: <IcSend size={11} />,     solid: true  },
  COMPLETED: { tone: 'success', label: 'Sent',       icon: <IcCheck size={11} />,    solid: false },
  SCHEDULED: { tone: 'blue',    label: 'Scheduled',  icon: <IcCalendar size={11} />, solid: false },
  DRAFT:     { tone: 'neutral', label: 'Draft',      icon: <IcEdit size={11} />,     solid: false },
  FAILED:    { tone: 'red',     label: 'Failed',     icon: <IcAlert size={11} />,    solid: false },
  CANCELED:  { tone: 'neutral', label: 'Canceled',   icon: <IcX size={11} />,        solid: false },
};

function getStatusCfg(s: BlastStatus): StatusConfig {
  return STATUS_CFG[s] ?? { tone: 'neutral', label: s, icon: <IcClock size={11} />, solid: false };
}

/* ── which statuses still need polling ──────────────────────── */
const ACTIVE_STATUSES: BlastStatus[] = ['SCHEDULED', 'RUNNING'];

/* ── per-message status config ───────────────────────────────── */
const MSG_STATUS_CFG: Record<MessageStatus, { tone: BadgeTone; label: string }> = {
  QUEUED:    { tone: 'neutral', label: 'Queued' },
  SENT:      { tone: 'blue',    label: 'Sent' },
  DELIVERED: { tone: 'brand',   label: 'Delivered' },
  READ:      { tone: 'success', label: 'Read' },
  FAILED:    { tone: 'red',     label: 'Failed' },
  CANCELED:  { tone: 'neutral', label: 'Canceled' },
};

const MSG_FILTERS: (MessageStatus | 'ALL')[] = ['ALL', 'FAILED', 'DELIVERED', 'READ', 'SENT', 'QUEUED'];

/* ── helpers ─────────────────────────────────────────────────── */
function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-MY', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

function pct(n: number, total: number): number {
  return total > 0 ? Math.round((n / total) * 100) : 0;
}

/* ── KPI card ────────────────────────────────────────────────── */
function KpiCard({ label, value, percent, testId }: {
  label: string; value: number; percent?: number; testId?: string;
}) {
  return (
    <div className="v-card" style={{ padding: '16px 18px' }} data-testid={testId}>
      <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 7 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
        <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>
          {value.toLocaleString()}
        </span>
        {percent != null && (
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
            {percent}%
          </span>
        )}
      </div>
    </div>
  );
}

/* ── delivery funnel ─────────────────────────────────────────── */
type FunnelRow = { label: string; value: number; color: string };

function DeliveryFunnel({ rows }: { rows: FunnelRow[] }) {
  const top = Math.max(rows[0]?.value ?? 1, 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {rows.map((d, i) => {
        const widthPct = Math.round((d.value / top) * 100);
        const convPct = i > 0 && rows[i - 1].value > 0
          ? Math.round((d.value / rows[i - 1].value) * 100)
          : 100;
        return (
          <div key={d.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 13 }}>
              <span style={{ fontWeight: 500 }}>{d.label}</span>
              <span>
                <b>{d.value.toLocaleString()}</b>
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}> · {widthPct}%</span>
              </span>
            </div>
            <div style={{ height: 28, borderRadius: 8, background: 'var(--bg-subtle)', overflow: 'hidden', position: 'relative' }}>
              <div style={{
                width: `${widthPct}%`, height: '100%', borderRadius: 8,
                background: d.color, transition: 'width 0.7s cubic-bezier(0.2,0.7,0.3,1)',
              }} />
              {i > 0 && (
                <span style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap',
                }}>
                  {convPct}% of previous
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── activity timeline ───────────────────────────────────────── */
type TimelineEntry = { label: string; time: string; done: boolean };

function buildTimeline(
  status: BlastStatus,
  scheduledAt: string | null | undefined,
  startedAt: string | null | undefined,
  completedAt: string | null | undefined,
  createdAt: string | null | undefined,
): TimelineEntry[] {
  const created: TimelineEntry = { label: 'Campaign created', time: fmtDateTime(createdAt), done: true };
  switch (status) {
    case 'DRAFT':
      return [{ label: 'Draft saved', time: fmtDateTime(createdAt), done: true }];
    case 'SCHEDULED':
      return [created, { label: 'Scheduled to send', time: fmtDateTime(scheduledAt), done: true },
        { label: 'Will start sending', time: fmtDateTime(scheduledAt), done: false }];
    case 'RUNNING':
      return [created, { label: 'Started sending', time: fmtDateTime(startedAt), done: true },
        { label: 'Sending in progress…', time: 'Live', done: false }];
    case 'COMPLETED':
      return [created, { label: 'Started sending', time: fmtDateTime(startedAt), done: true },
        { label: 'Finished sending', time: fmtDateTime(completedAt), done: true }];
    case 'CANCELED':
      return [created, { label: 'Started sending', time: fmtDateTime(startedAt ?? scheduledAt), done: true },
        { label: 'Canceled', time: fmtDateTime(completedAt), done: true }];
    case 'FAILED':
      return [created, { label: 'Started sending', time: fmtDateTime(startedAt), done: true },
        { label: 'Failed', time: fmtDateTime(completedAt), done: true }];
    default:
      return [created];
  }
}

function Timeline({ entries }: { entries: TimelineEntry[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {entries.map((e, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, minHeight: 48 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
            <span style={{
              width: 14, height: 14, borderRadius: '50%', flexShrink: 0, marginTop: 2,
              background: e.done ? 'var(--accent)' : 'transparent',
              border: e.done ? 'none' : '2px solid var(--border-strong)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {e.done && <IcCheck size={8} style={{ color: '#fff', strokeWidth: 3 }} />}
            </span>
            {i < entries.length - 1 && (
              <span style={{ flex: 1, width: 2, background: 'var(--border)', margin: '2px 0' }} />
            )}
          </div>
          <div style={{ paddingBottom: 14, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: e.done ? 600 : 500, color: e.done ? 'var(--text)' : 'var(--text-muted)' }}>
              {e.label}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-subtle)', marginTop: 1 }}>{e.time}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── send-time advisor ───────────────────────────────────────── */
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function fmtHour12(h: number): string {
  const period = h < 12 ? 'AM' : 'PM';
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr} ${period}`;
}

function windowLabel(rec: NonNullable<SendTimeAdviceResponse['recommendation']>): string {
  const dayPart = rec.days ? `${WD[rec.days[0]]}–${WD[rec.days[rec.days.length - 1]]} · ` : '';
  return `${dayPart}${fmtHour12(rec.hourStart)}–${fmtHour12(rec.hourEnd)}`;
}

function confidenceDots(c: SendTimeAdviceResponse['confidence']): string {
  if (c === 'HIGH') return '●●●';
  if (c === 'MEDIUM') return '●●○';
  return '●○○';
}

function SendTimeCard({ blastId }: { blastId: string }) {
  const q = useQuery({
    queryKey: ['send-time-advice', blastId],
    queryFn: () => getSendTimeAdvice(blastId),
  });

  return (
    <div className="v-card" style={{ padding: '20px 22px', marginBottom: 18 }} data-testid="send-time-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Best time to resend</h2>
        <Badge tone="brand">AI</Badge>
      </div>

      {q.isLoading && (
        <div style={{ padding: '8px 0', color: 'var(--text-muted)', fontSize: 13 }}>Analysing engagement…</div>
      )}

      {q.isError && (
        <div style={{ padding: '8px 0', color: 'var(--text-muted)', fontSize: 13 }}>
          Couldn’t load the timing insight.
        </div>
      )}

      {q.data && (
        <>
          {q.data.recommendation ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>
                {windowLabel(q.data.recommendation)}
              </span>
              <span
                title={`Confidence: ${q.data.confidence.toLowerCase()}`}
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: 'var(--text-muted)' }}
              >
                {confidenceDots(q.data.confidence)}
              </span>
            </div>
          ) : null}

          <p style={{ margin: '0 0 12px', fontSize: 13.5, lineHeight: 1.5, color: 'var(--text)' }}>
            {q.data.advice.body}
          </p>

          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            This run: <b style={{ color: 'var(--text)' }}>{q.data.thisRun.sent.toLocaleString()}</b> sent ·{' '}
            {q.data.thisRun.readRate}% read · {q.data.thisRun.replyRate}% replied
          </div>
        </>
      )}
    </div>
  );
}

/* ── page ────────────────────────────────────────────────────── */
export default function CampaignDetail() {
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

  const [statusFilter, setStatusFilter] = useState<MessageStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const { showToast } = useToast();

  const messagesQ = useQuery({
    queryKey: ['blast-messages', id, statusFilter, page],
    queryFn: () => listBlastMessages(id!, {
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      page,
      pageSize: 25,
    }),
    refetchInterval: (q) => {
      const activeBlast = !!blast && ACTIVE_STATUSES.includes(blast.status);
      const hasQueued = (q.state.data?.items ?? []).some((m: BlastMessage) => m.status === 'QUEUED');
      return activeBlast || hasQueued ? 5000 : false;
    },
  });

  const retryOne = useMutation({
    mutationFn: (messageId: string) => retryBlastMessage(id!, messageId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blast-messages', id] });
      qc.invalidateQueries({ queryKey: ['blast-stats', id] });
      showToast('Retrying message…');
    },
    onError: () => showToast('Retry failed', 'error'),
  });

  const retryAll = useMutation({
    mutationFn: () => retryFailedMessages(id!),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['blast-messages', id] });
      qc.invalidateQueries({ queryKey: ['blast-stats', id] });
      showToast(r.retried > 0
        ? `Retrying ${r.retried} failed message${r.retried === 1 ? '' : 's'}…`
        : 'No failed messages to retry');
    },
    onError: () => showToast('Retry failed', 'error'),
  });

  if (!blast || !stats) {
    return <Page><p className="text-foreground-muted">Loading…</p></Page>;
  }

  const counts = stats.counts;
  // Sent = SENT + DELIVERED + READ (progressive — once delivered it leaves SENT bucket)
  const sentCount     = (counts.SENT ?? 0) + (counts.DELIVERED ?? 0) + (counts.READ ?? 0);
  const deliveredCount = (counts.DELIVERED ?? 0) + (counts.READ ?? 0);
  const readCount      = counts.READ ?? 0;
  const repliedCount   = stats.replied ?? 0;
  const total          = stats.totalRecipients;

  const funnelRows: FunnelRow[] = [
    { label: 'Sent',      value: sentCount,      color: 'var(--accent)' },
    { label: 'Delivered', value: deliveredCount,  color: '#22c55e' },
    { label: 'Read',      value: readCount,       color: 'var(--blue-500)' },
    { label: 'Replied',   value: repliedCount,    color: '#06b6d4' },
  ];

  const hasStats = sentCount > 0 || deliveredCount > 0;
  const canCancel = ACTIVE_STATUSES.includes(blast.status);

  const cfg = getStatusCfg(blast.status);

  const timeline = buildTimeline(
    blast.status, blast.scheduledAt, blast.startedAt, blast.completedAt, blast.createdAt,
  );

  const audienceLine = blast.segmentId
    ? `Segment ${blast.segmentId.slice(0, 8)}`
    : `${blast.uniqueContacts.toLocaleString()} contacts`;

  return (
    <Page>
      {/* ── back button ── */}
      <div style={{ marginBottom: 8 }}>
        <Button variant="ghost" size="sm" onClick={() => navigate('/blasts')} icon={<IcChevL size={16} />}>
          Campaigns
        </Button>
      </div>

      {/* ── header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 22 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>{blast.name}</h1>
            <Badge tone={cfg.tone} solid={cfg.solid} icon={cfg.icon}>{cfg.label}</Badge>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 13, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{blast.templateName}</span>
            <span>·</span>
            <span>{audienceLine}</span>
            <span>·</span>
            <span><b style={{ color: 'var(--text)' }}>{blast.totalRecipients.toLocaleString()}</b> recipients</span>
            <span>·</span>
            <span>{fmtDateTime(blast.scheduledAt)}</span>
          </div>
        </div>
        {canCancel && (
          <div style={{ flexShrink: 0 }}>
            <Button
              variant="destructive"
              size="sm"
              data-testid="blast-cancel"
              disabled={cancel.isPending}
              onClick={() => {
                if (window.confirm('Cancel this blast? Already-sent messages cannot be unsent.')) cancel.mutate();
              }}
            >
              {cancel.isPending ? 'Canceling…' : 'Cancel blast'}
            </Button>
          </div>
        )}
      </div>

      {/* ── KPI strip ── */}
      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}
        data-testid="blast-counters"
      >
        <KpiCard label="Sent"      value={sentCount}      percent={pct(sentCount, total)}      testId="counter-sent" />
        <KpiCard label="Delivered" value={deliveredCount} percent={pct(deliveredCount, total)} testId="counter-delivered" />
        <KpiCard label="Read"      value={readCount}      percent={pct(readCount, total)}      testId="counter-read" />
        <KpiCard label="Replied"   value={repliedCount}   percent={pct(repliedCount, total)}   testId="counter-replied" />
      </div>

      {/* ── funnel + details grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
        {/* delivery funnel */}
        <div className="v-card" style={{ padding: '20px 22px' }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>Delivery funnel</h2>
          {hasStats
            ? <DeliveryFunnel rows={funnelRows} />
            : (
              <div style={{ padding: '24px 4px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                {blast.status === 'SCHEDULED'
                  ? 'No deliveries yet — this campaign is scheduled.'
                  : 'No deliveries recorded yet.'}
              </div>
            )}
        </div>

        {/* activity timeline */}
        <div className="v-card" style={{ padding: '20px 22px' }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>Activity</h2>
          <Timeline entries={timeline} />
        </div>
      </div>

      {/* ── send-time advisor (completed only) ── */}
      {blast.status === 'COMPLETED' && <SendTimeCard blastId={blast.id} />}

      {/* ── recipients ── */}
      <div className="v-card" style={{ padding: '20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Recipients</h2>
          <Button
            variant="secondary" size="sm" data-testid="retry-all-failed"
            disabled={retryAll.isPending}
            onClick={() => retryAll.mutate()}
          >
            {retryAll.isPending ? 'Retrying…' : 'Retry all failed'}
          </Button>
        </div>

        <div data-testid="recipient-status-filter" style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
          {MSG_FILTERS.map((f) => {
            const active = statusFilter === f;
            return (
              <button
                key={f}
                onClick={() => { setStatusFilter(f); setPage(1); }}
                style={{
                  padding: '4px 12px', borderRadius: 99, fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
                  border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                  background: active ? 'var(--accent-fill)' : 'var(--bg)',
                  color: active ? 'var(--accent-text)' : 'var(--text-muted)',
                }}
              >
                {f === 'ALL' ? 'All' : MSG_STATUS_CFG[f].label}
              </button>
            );
          })}
        </div>

        {messagesQ.isLoading && (
          <div style={{ padding: '18px 4px', color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>
        )}

        {!messagesQ.isLoading && (messagesQ.data?.items.length ?? 0) === 0 && (
          <div style={{ padding: '18px 4px', color: 'var(--text-muted)', fontSize: 13 }}>
            No recipients{statusFilter !== 'ALL' ? ` with status ${MSG_STATUS_CFG[statusFilter].label}` : ''} yet.
          </div>
        )}

        {!messagesQ.isLoading && (messagesQ.data?.items.length ?? 0) > 0 && (
          <table data-testid="recipients-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: 12 }}>
                <th style={{ padding: '6px 8px', fontWeight: 500 }}>Recipient</th>
                <th style={{ padding: '6px 8px', fontWeight: 500 }}>Status</th>
                <th style={{ padding: '6px 8px', fontWeight: 500 }}>Detail</th>
                <th style={{ padding: '6px 8px', fontWeight: 500 }}>Sent</th>
                <th style={{ padding: '6px 8px', fontWeight: 500 }} aria-label="actions" />
              </tr>
            </thead>
            <tbody>
              {messagesQ.data!.items.map((m) => {
                const cfg = MSG_STATUS_CFG[m.status];
                const rowPending = retryOne.isPending && retryOne.variables === m.id;
                return (
                  <tr key={m.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '9px 8px' }}>
                      <div style={{ fontWeight: 500 }}>{m.contactName ?? '—'}</div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: 'var(--text-muted)' }}>{m.contactPhone}</div>
                    </td>
                    <td style={{ padding: '9px 8px' }}><Badge tone={cfg.tone}>{cfg.label}</Badge></td>
                    <td style={{ padding: '9px 8px', color: 'var(--text-muted)', maxWidth: 280 }}>
                      {m.status === 'FAILED' && m.errorMessage
                        ? <span><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5 }}>{m.errorCode}</span> · {m.errorMessage}</span>
                        : '—'}
                    </td>
                    <td style={{ padding: '9px 8px', color: 'var(--text-muted)', fontSize: 12 }}>{fmtDateTime(m.sentAt)}</td>
                    <td style={{ padding: '9px 8px', textAlign: 'right' }}>
                      {m.status === 'FAILED' && (
                        <Button
                          variant="ghost" size="sm" data-testid="retry-message"
                          disabled={rowPending}
                          onClick={() => retryOne.mutate(m.id)}
                        >
                          {rowPending ? 'Retrying…' : 'Retry'}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {(messagesQ.data?.total ?? 0) > 25 && (
          <Pagination page={page} pageSize={25} total={messagesQ.data!.total} onPageChange={setPage} />
        )}
      </div>
    </Page>
  );
}
