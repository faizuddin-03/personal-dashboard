import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { listTickets } from '../api/tickets';
import { listBlasts } from '../api/blasts';
import { listAutopilotEvents } from '../api/autopilot';
import { getKpis, getVolume, getAutopilot } from '../api/analytics';
import { intentLabel } from '../lib/analyticsLabels';
import { useAuth } from '../auth/AuthContext';
import { isAdmin } from '../lib/roles';
import { AIOrb } from '../components/ui/AIOrb';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Misc';
import { Progress } from '../components/ui/Misc';
import {
  IcSend, IcCheck, IcEye, IcAlert, IcChevR, IcSparkle,
  IcBook, IcPlus, IcActivity, IcClock, IcCheckCircle, IcArrowUp, IcArrowDown,
} from '../components/ui/icons';

// ── Tiny inline SVG charts ─────────────────────────────────────────────────────

let _uid = 0;
function uid(p: string) { return `${p}-${++_uid}`; }

function Sparkline({ data, color = 'var(--accent)', w = 84, h = 30 }: {
  data: number[]; color?: string; w?: number; h?: number;
}) {
  const max = Math.max(...data), min = Math.min(...data);
  const rng = max - min || 1;
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * w,
    h - ((v - min) / rng) * (h - 4) - 2,
  ] as [number, number]);
  const line = pts.map(([x,y],i) => `${i?'L':'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const area = `${line} L${w} ${h} L0 ${h} Z`;
  const gid = uid('spk');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display:'block', overflow:'visible', flexShrink:0 }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.22" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GroupedBar({ data, h = 200 }: {
  data: { d:string; sent:number; delivered:number; replied:number }[];
  h?: number;
}) {
  const W = 660, pad = { l:8, r:8, t:14, b:28 };
  const max = Math.max(...data.flatMap(d => [d.sent, d.delivered, d.replied])) * 1.08;
  const groups = data.length;
  const gw = (W - pad.l - pad.r) / groups;
  const bw = Math.min(14, (gw * 0.6) / 3);
  const gap = 3;
  const innerW = 3 * bw + 2 * gap;
  const keys: (keyof typeof data[0])[] = ['sent','delivered','replied'];
  const colors = ['var(--accent)','#10B981','#67E8F9'];
  const ticks = 4;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${h}`} preserveAspectRatio="none" style={{ display:'block' }}>
      {Array.from({ length: ticks + 1 }).map((_, i) => {
        const y = pad.t + (h - pad.t - pad.b) * (i / ticks);
        return <line key={i} x1={pad.l} x2={W - pad.r} y1={y} y2={y} stroke="var(--border)" strokeWidth="1" />;
      })}
      {data.map((d, gi) => {
        const gx = pad.l + gi * gw + (gw - innerW) / 2;
        return (
          <g key={gi}>
            {keys.map((k, ki) => {
              const val = d[k] as number;
              const bh = (h - pad.t - pad.b) * val / max;
              const x = gx + ki * (bw + gap);
              const y = h - pad.b - bh;
              return (
                <rect key={String(k)} x={x} y={y} width={bw} height={bh} rx={3} fill={colors[ki]}>
                  <title>{String(k)}: {val.toLocaleString()}</title>
                </rect>
              );
            })}
            <text x={gx + innerW / 2} y={h - 9} textAnchor="middle" fontSize="11" fill="var(--text-muted)" fontWeight="500">
              {d.d}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function DonutChart({ data, centerLabel, centerSub, size = 160, thickness = 22 }: {
  data: { label:string; value:number; color:string }[];
  centerLabel: string; centerSub: string; size?: number; thickness?: number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = (size - thickness) / 2, cx = size / 2, cy = size / 2, circ = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
      <div style={{ position:'relative', width:size, height:size, flexShrink:0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform:'rotate(-90deg)' }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth={thickness} />
          {data.map((d, i) => {
            const frac = d.value / total, len = frac * circ;
            const dash = `${len} ${circ - len}`, off = -acc * circ; acc += frac;
            return (
              <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={d.color}
                strokeWidth={thickness} strokeDasharray={dash} strokeDashoffset={off} strokeLinecap="butt">
                <title>{d.label}: {d.value}</title>
              </circle>
            );
          })}
        </svg>
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
          <span style={{ fontSize:22, fontWeight:700, letterSpacing:'-.02em' }}>{centerLabel}</span>
          <span style={{ fontSize:11, color:'var(--text-muted)', fontWeight:500, marginTop:2 }}>{centerSub}</span>
        </div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:9, flex:1, minWidth:130 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background:d.color, flexShrink:0 }} />
            <span style={{ fontSize:12.5, color:'var(--text-muted)', flex:1 }}>{d.label}</span>
            <span style={{ fontSize:12.5, fontWeight:600 }}>{d.value}</span>
            <span style={{ fontSize:11, color:'var(--text-subtle)', minWidth:32, textAlign:'right', fontFamily:'monospace' }}>
              {Math.round(d.value / total * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HBar({ data }: { data: { label:string; value:number }[] }) {
  const max = Math.max(...data.map(d => d.value));
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:11 }}>
      {data.map((d, i) => (
        <div key={i} style={{ display:'grid', gridTemplateColumns:'130px 1fr 46px', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:11.5, color:'var(--text-muted)', fontFamily:'monospace', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {d.label}
          </span>
          <div style={{ height:8, borderRadius:4, background:'var(--bg-subtle)', overflow:'hidden' }}>
            <div style={{ width:`${d.value / max * 100}%`, height:'100%', borderRadius:4, background:'var(--accent)', transition:'width .6s cubic-bezier(.2,.7,.3,1)' }} />
          </div>
          <span style={{ fontSize:12, fontWeight:600, textAlign:'right', fontFamily:'monospace' }}>{d.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

// ── KPI card ──────────────────────────────────────────────────────────────────

function KpiCard({ label, value, suffix, delta, deltaGood = true, spark, sparkColor, icon }: {
  label: string; value: string | number; suffix?: string;
  delta: number; deltaGood?: boolean;
  spark: number[]; sparkColor?: string;
  icon: React.ReactNode;
}) {
  const up = delta > 0, flat = delta === 0;
  const goodUp = deltaGood;
  const deltaGood2 = flat ? null : (up === goodUp);
  const deltaColor = flat ? 'var(--text-subtle)' : deltaGood2 ? 'var(--accent)' : '#EF4444';
  const spColor = sparkColor ?? 'var(--accent)';

  return (
    <div style={{
      padding:'18px 20px', borderRadius:12, border:'1px solid var(--border)',
      background:'var(--bg)', display:'flex', flexDirection:'column', gap:13, minWidth:0,
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:9 }}>
        <div style={{
          width:30, height:30, borderRadius:9, flexShrink:0,
          display:'flex', alignItems:'center', justifyContent:'center',
          background:'var(--accent-fill)', color:'var(--accent)',
        }}>
          {icon}
        </div>
        <span style={{ fontSize:13, color:'var(--text-muted)', fontWeight:500, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {label}
        </span>
      </div>
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:8 }}>
        <div style={{ display:'flex', alignItems:'baseline', gap:4 }}>
          <span style={{ fontSize:28, fontWeight:700, letterSpacing:'-.03em', lineHeight:1 }}>{value}</span>
          {suffix && <span style={{ fontSize:14, fontWeight:600, color:'var(--text-muted)' }}>{suffix}</span>}
        </div>
        <Sparkline data={spark} color={spColor} />
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        {!flat && (
          <span style={{ display:'inline-flex', alignItems:'center', gap:2, fontSize:12, fontWeight:600, color:deltaColor }}>
            {up ? <IcArrowUp size={12} strokeWidth={2.5} /> : <IcArrowDown size={12} strokeWidth={2.5} />}
            {Math.abs(delta)}{typeof delta === 'number' && label.toLowerCase().includes('rate') ? 'pp' : ''}
          </span>
        )}
        {flat && <span style={{ fontSize:12, color:'var(--text-subtle)', fontWeight:500 }}>No change</span>}
        <span style={{ fontSize:12, color:'var(--text-subtle)' }}>vs last week</span>
      </div>
    </div>
  );
}

// ── Relative time helper ───────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Section title ─────────────────────────────────────────────────────────────

function SectionTitle({ children, sub, action }: {
  children: React.ReactNode; sub?: string; action?: React.ReactNode;
}) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14, gap:10 }}>
      <div>
        <div style={{ fontSize:14, fontWeight:600, color:'var(--text-heading)' }}>{children}</div>
        {sub && <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{sub}</div>}
      </div>
      {action}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const admin = isAdmin(user?.role);

  // ── Real data queries ──────────────────────────────────────────────────────
  const ticketsQ = useQuery({
    queryKey: ['tickets', 'active'],
    queryFn: () => listTickets({ tab: 'active' }),
  });

  const blastsQ = useQuery({
    queryKey: ['blasts'],
    queryFn: () => listBlasts(),
  });

  const eventsQ = useQuery({
    queryKey: ['autopilot-events'],
    queryFn: () => listAutopilotEvents({}),
  });

  const kpisQ = useQuery({ queryKey: ['analytics', 'kpis', '7d'], queryFn: () => getKpis('7d') });
  const volumeQ = useQuery({ queryKey: ['analytics', 'volume', '7d'], queryFn: () => getVolume('7d') });
  const apQ = useQuery({ queryKey: ['analytics', 'autopilot', '30d'], queryFn: () => getAutopilot('30d') });

  // ── Derived values ─────────────────────────────────────────────────────────
  const activeTickets = useMemo(
    () => (ticketsQ.data ?? []).filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS'),
    [ticketsQ.data],
  );

  const activeCampaigns = useMemo(
    () => (blastsQ.data ?? []).filter(b => b.status === 'RUNNING' || b.status === 'SCHEDULED').slice(0, 3),
    [blastsQ.data],
  );

  const events = eventsQ.data ?? [];
  const autoRatePct = apQ.data?.autoHandleRate ?? 0;
  const aiHandled = apQ.data?.handling.autoReplied ?? 0;
  const aiTotal = aiHandled + (apQ.data?.handling.escalated ?? 0);

  // Greeting
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const who = user?.name ?? (admin ? 'Aiman' : 'Priya');
  const today = new Date().toLocaleDateString('en-MY', { weekday:'long', day:'numeric', month:'long' });

  return (
    <div
      style={{ padding:'24px 28px 40px', maxWidth:1320, width:'100%', minWidth:0, margin:'0 auto', display:'flex', flexDirection:'column', gap:20 }}
    >
      {/* ── Greeting ────────────────────────────────────────────────────── */}
      {/* Visible heading carries the e2e testid `dashboard-title` */}
      <div style={{ display:'flex', alignItems:'baseline', gap:12, flexWrap:'wrap' }}>
        <h1
          data-testid="dashboard-title"
          style={{ margin:0, fontSize:22, fontWeight:600, letterSpacing:'-.02em', color:'var(--text-heading)', whiteSpace:'nowrap' }}
        >
          {greet}, {who}
        </h1>
        <span style={{ fontSize:13.5, color:'var(--text-muted)' }}>
          {today} · {admin ? 'Super Admin' : 'Customer Support'}
        </span>
      </div>

      {/* ── AI status hero ──────────────────────────────────────────────── */}
      <div style={{
        padding:'22px 26px', borderRadius:12, border:'1px solid var(--border)',
        background:'var(--bg)', display:'flex', alignItems:'center', gap:22, flexWrap:'wrap',
        overflow:'hidden',
      }}>
        <AIOrb size={56} breathe />
        <div style={{ flex:1, minWidth:240 }}>
          <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:4 }}>
            <span style={{
              display:'inline-flex', alignItems:'center', gap:5, fontSize:11.5, fontWeight:600,
              color:'var(--accent)', background:'var(--accent-fill)',
              border:'1px solid rgba(16,185,129,0.2)', padding:'2px 9px', borderRadius:999,
            }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'#10B981', display:'inline-block' }} />
              Autonomous
            </span>
            <span style={{ fontSize:12.5, color:'var(--text-muted)' }}>Updated just now</span>
          </div>
          <div style={{ fontSize:21, fontWeight:600, letterSpacing:'-.02em', color:'var(--text-heading)' }}>
            Your AI handled{' '}
            <span style={{ color:'var(--accent)' }}>{aiHandled.toLocaleString()} of {aiTotal.toLocaleString()}</span>
            {' '}conversations today
          </div>
          <div style={{ fontSize:13.5, color:'var(--text-muted)', marginTop:3 }}>
            {activeTickets.length > 0
              ? <>Everything else is running on autopilot — just{' '}
                  <strong style={{ color:'#F59E0B' }}>{activeTickets.length} need{activeTickets.length > 1 ? '' : 's'} a human</strong>.</>
              : 'Everything is running on autopilot — nothing needs you right now.'}
          </div>
        </div>
        <div style={{ display:'flex', gap:26, flexShrink:0, flexWrap:'wrap' }}>
          {[
            ['Auto-handled', `${autoRatePct}%`, '#10B981'],
            ['Needs human',  String(activeTickets.length), '#F59E0B'],
          ].map(([label, val, col]) => (
            <div key={label} style={{ textAlign:'center' }}>
              <div style={{ fontSize:24, fontWeight:700, color: col }}>{val}</div>
              <div style={{ fontSize:11.5, color:'var(--text-muted)', marginTop:2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Escalation banner ───────────────────────────────────────────── */}
      {activeTickets.length > 0 && (
        <div style={{
          padding:'16px 20px', borderRadius:12, display:'flex', alignItems:'center', gap:16,
          background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.25)',
        }}>
          <div style={{
            width:42, height:42, borderRadius:12, flexShrink:0, background:'#F59E0B',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <IcAlert size={21} style={{ color:'#fff' }} />
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15, fontWeight:600, color:'#B45309' }}>
              {activeTickets.length} conversation{activeTickets.length > 1 ? 's' : ''} need a human
            </div>
            <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:1 }}>
              The AI escalated these — open the Inbox to reply and take them over.
            </div>
          </div>
          <Button variant="primary" size="md" icon={<IcChevR size={15} />} onClick={() => navigate('/inbox')}>
            Open Inbox
          </Button>
        </div>
      )}

      {/* ── KPI strip ────────────────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
        <KpiCard label="Sent today" value={(kpisQ.data?.sentToday.value ?? 0).toLocaleString()}
          delta={kpisQ.data?.sentToday.deltaPct ?? 0} spark={kpisQ.data?.sentToday.spark ?? []}
          icon={<IcSend size={15} />} />
        <KpiCard label="Delivery rate" value={kpisQ.data?.deliveryRate.value ?? 0} suffix="%"
          delta={kpisQ.data?.deliveryRate.deltaPct ?? 0} spark={kpisQ.data?.deliveryRate.spark ?? []}
          sparkColor="#10B981" icon={<IcCheck size={15} />} />
        <KpiCard label="Read rate" value={kpisQ.data?.readRate.value ?? 0} suffix="%"
          delta={kpisQ.data?.readRate.deltaPct ?? 0} spark={kpisQ.data?.readRate.spark ?? []}
          icon={<IcEye size={15} />} />
        <KpiCard label="Cost today" value={`RM ${(kpisQ.data?.costToday.value ?? 0).toLocaleString()}`}
          delta={kpisQ.data?.costToday.deltaPct ?? 0} deltaGood={false}
          spark={kpisQ.data?.costToday.spark ?? []} sparkColor="var(--text-muted)"
          icon={<IcActivity size={15} />} />
      </div>

      {/* ── Charts row ───────────────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'1.55fr 1fr', gap:16 }}>
        {/* Message volume */}
        <div style={{ padding:'20px 22px', borderRadius:12, border:'1px solid var(--border)', background:'var(--bg)' }}>
          <SectionTitle
            sub="Sent, delivered & replied across the last 7 days"
            action={
              <div style={{ display:'flex', gap:14, flexWrap:'wrap', alignItems:'center' }}>
                {[['Sent','var(--accent)'],['Delivered','#10B981'],['Replied','#67E8F9']].map(([l,c]) => (
                  <div key={l} style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ width:8, height:8, borderRadius:'50%', background:c }} />
                    <span style={{ fontSize:12, color:'var(--text-muted)' }}>{l}</span>
                  </div>
                ))}
              </div>
            }
          >
            Message volume
          </SectionTitle>
          <GroupedBar data={(volumeQ.data?.byDay ?? []).map(d => ({ d: new Date(d.date).toLocaleDateString('en-MY', { weekday: 'short' }), sent: d.sent, delivered: d.delivered, replied: d.replied }))} h={220} />
        </div>

        {/* Reply handling donut */}
        <div style={{ padding:'20px 22px', borderRadius:12, border:'1px solid var(--border)', background:'var(--bg)' }}>
          <SectionTitle sub="How inbound messages were handled today">Reply handling</SectionTitle>
          <div style={{ paddingTop:8 }}>
            <DonutChart
              data={[
                { label: 'Auto-handled by bot', value: apQ.data?.handling.autoReplied ?? 0, color: 'var(--accent)' },
                { label: 'Escalated → human',   value: apQ.data?.handling.escalated ?? 0,   color: '#F59E0B' },
                { label: 'Resolved by team',     value: apQ.data?.handling.resolvedByTeam ?? 0, color: '#10B981' },
              ]}
              centerLabel={`${autoRatePct}%`} centerSub="auto-handled"
            />
          </div>
        </div>
      </div>

      {/* ── Attention list + Top intents ─────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'1.55fr 1fr', gap:16 }}>
        {/* Needs your attention — REAL data */}
        <div style={{ padding:'20px 22px', borderRadius:12, border:'1px solid var(--border)', background:'var(--bg)' }}>
          <SectionTitle
            sub="Escalated conversations waiting for a human reply"
            action={activeTickets.length > 0
              ? <Button variant="ghost" size="sm" icon={<IcChevR size={14} />} onClick={() => navigate('/inbox')}>View all</Button>
              : undefined}
          >
            Needs your attention
          </SectionTitle>

          {ticketsQ.isLoading && (
            <div style={{ padding:'18px 4px', color:'var(--text-muted)', fontSize:13.5 }}>Loading…</div>
          )}

          {!ticketsQ.isLoading && activeTickets.length === 0 && (
            <div style={{ display:'flex', alignItems:'center', gap:12, padding:'18px 4px', color:'var(--text-muted)' }}>
              <IcCheckCircle size={20} style={{ color:'var(--accent)', flexShrink:0 }} />
              <span style={{ fontSize:14 }}>All caught up — the bot is handling everything.</span>
            </div>
          )}

          {!ticketsQ.isLoading && activeTickets.length > 0 && (
            <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
              {activeTickets.slice(0, 5).map(ticket => (
                <div
                  key={ticket.id}
                  onClick={() => navigate('/inbox')}
                  style={{
                    display:'flex', alignItems:'center', gap:13, padding:'12px 10px',
                    borderRadius:12, cursor:'pointer', transition:'background .12s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <Avatar name={ticket.contact?.name ?? '?'} size="md" />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                      <span style={{ fontSize:11.5, fontWeight:600, color:'var(--text-muted)', fontFamily:'monospace' }}>{ticket.num}</span>
                      <span style={{ fontSize:13.5, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {ticket.contact?.name ?? '—'}
                      </span>
                      <Badge tone="human">{ticket.reason.replace('_', ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}</Badge>
                    </div>
                    <div style={{ fontSize:12.5, color:'var(--text-muted)', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {ticket.intent.replace(/_/g, ' ')}
                    </div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontSize:11.5, color:'#B45309', fontWeight:600, display:'flex', alignItems:'center', gap:4, justifyContent:'flex-end' }}>
                      <IcClock size={11} />
                      {ticket.openedAt ? relativeTime(ticket.openedAt) : '—'}
                    </div>
                    <div style={{ marginTop:4, fontSize:11, color:'var(--text-subtle)' }}>
                      {ticket.assignee ? ticket.assignee.name.split(' ')[0] : 'unassigned'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top intents */}
        <div style={{ padding:'20px 22px', borderRadius:12, border:'1px solid var(--border)', background:'var(--bg)' }}>
          <SectionTitle sub="What dealers asked about recently">Top intents</SectionTitle>
          <HBar data={(apQ.data?.topIntents ?? []).map(t => ({ label: intentLabel(t.intent), value: t.count }))} />
        </div>
      </div>

      {/* ── AI activity feed + Quick actions ─────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'1.55fr 1fr', gap:16 }}>
        {/* AI activity — REAL autopilot events */}
        <div style={{ padding:'20px 22px', borderRadius:12, border:'1px solid var(--border)', background:'var(--bg)' }}>
          <SectionTitle
            sub="What the autonomous system did recently"
            action={
              <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11.5, color:'var(--accent)', fontWeight:600 }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:'#10B981', display:'inline-block' }} />
                AI active
              </span>
            }
          >
            AI activity
          </SectionTitle>

          {eventsQ.isLoading && (
            <div style={{ padding:'18px 4px', color:'var(--text-muted)', fontSize:13.5 }}>Loading…</div>
          )}

          {!eventsQ.isLoading && events.length === 0 && (
            <div style={{ padding:'18px 4px', color:'var(--text-muted)', fontSize:13.5 }}>
              No autopilot activity yet today.
            </div>
          )}

          {!eventsQ.isLoading && events.length > 0 && (
            <div style={{ display:'flex', flexDirection:'column' }}>
              {events.slice(0, 6).map((ev, i) => {
                const contactName = ev.contact?.name ?? ev.contact?.phoneE164 ?? 'unknown';
                const isAI = ev.action === 'AUTO_REPLIED';
                const text = ev.action === 'AUTO_REPLIED'
                  ? <><strong>{contactName}</strong> — auto-replied{ev.intent ? ` · ${ev.intent.replace(/_/g,' ')}` : ''}</>
                  : ev.action === 'ESCALATED'
                  ? <><strong>{contactName}</strong> escalated{ev.reason ? ` · ${ev.reason}` : ''}</>
                  : ev.action === 'OPTED_OUT'
                  ? <><strong>{contactName}</strong> opted out</>
                  : <><strong>{contactName}</strong> — {ev.action.toLowerCase()}</>;
                const meta = [
                  ev.confidence != null ? `${Math.round(ev.confidence * 100)}% confident` : null,
                  relativeTime(ev.createdAt),
                ].filter(Boolean).join(' · ');

                return (
                  <div key={ev.id} style={{
                    display:'flex', gap:13, padding:'11px 0',
                    borderTop: i ? '1px solid var(--border)' : 'none',
                  }}>
                    {isAI
                      ? <AIOrb size={28} />
                      : <div style={{
                          width:28, height:28, borderRadius:'50%', flexShrink:0,
                          background:'rgba(245,158,11,0.1)', display:'flex', alignItems:'center', justifyContent:'center',
                        }}>
                          <IcAlert size={14} style={{ color:'#F59E0B' }} />
                        </div>}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13.5 }}>{text}</div>
                      <div style={{ fontSize:11.5, color:'var(--text-subtle)', marginTop:1 }}>{meta}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column: Quick actions + Active campaigns */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* Quick actions — role-aware */}
          <div style={{ padding:'20px 22px', borderRadius:12, border:'1px solid var(--border)', background:'var(--bg)' }}>
            <SectionTitle>Quick actions</SectionTitle>
            {admin ? (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <Button variant="primary" size="lg" icon={<IcPlus size={15} />} style={{ width:'100%' }}
                  onClick={() => navigate('/blasts/new')}>
                  New campaign
                </Button>
                <Button variant="secondary" size="lg" icon={<IcSparkle size={15} />} style={{ width:'100%' }}
                  onClick={() => navigate('/templates')}>
                  Generate a template with AI
                </Button>
                <Button variant="secondary" size="lg" icon={<IcActivity size={15} />} style={{ width:'100%' }}
                  onClick={() => navigate('/reports')}>
                  View performance
                </Button>
              </div>
            ) : (
              <Button variant="primary" size="lg" icon={<IcBook size={15} />} style={{ width:'100%' }}
                onClick={() => navigate('/inbox')}>
                Go to Inbox
              </Button>
            )}
          </div>

          {/* Active campaigns — REAL data */}
          <div style={{ padding:'20px 22px', borderRadius:12, border:'1px solid var(--border)', background:'var(--bg)', flex:1 }}>
            <SectionTitle
              sub="Running now"
              action={<Button variant="ghost" size="sm" icon={<IcChevR size={14} />} onClick={() => navigate('/blasts')}>All</Button>}
            >
              Active campaigns
            </SectionTitle>

            {blastsQ.isLoading && (
              <div style={{ fontSize:13, color:'var(--text-muted)' }}>Loading…</div>
            )}

            {!blastsQ.isLoading && activeCampaigns.length === 0 && (
              <span style={{ fontSize:13, color:'var(--text-subtle)' }}>No campaigns running.</span>
            )}

            {!blastsQ.isLoading && activeCampaigns.length > 0 && (
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {activeCampaigns.map(c => {
                  const sent = c.totalRecipients > 0
                    ? Math.round((c.uniqueContacts / c.totalRecipients) * 100)
                    : c.status === 'RUNNING' ? 50 : 0;
                  return (
                    <div key={c.id}>
                      <div style={{ display:'flex', justifyContent:'space-between', gap:10, marginBottom:6 }}>
                        <span style={{ fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {c.name}
                        </span>
                        <span style={{ fontSize:12, color:'var(--text-muted)', flexShrink:0 }}>
                          {c.totalRecipients.toLocaleString()} recipients
                        </span>
                      </div>
                      <Progress value={sent} />
                      <div style={{ marginTop:4, fontSize:11.5, color:'var(--text-subtle)' }}>
                        {c.status === 'RUNNING' ? 'Sending now' : 'Scheduled'}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
