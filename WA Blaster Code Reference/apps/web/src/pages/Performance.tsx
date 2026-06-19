// Performance.tsx — analytics screen
// Faithful port of docs/design/screen-performance.jsx

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getKpis, getDelivery, getAutopilot, getEscalation, getAudience, type Range } from '../api/analytics';
import { stateLabel, vehicleLabel, reasonLabel, fmtDuration } from '../lib/analyticsLabels';
import { Badge } from '../components/ui/Badge';
import { IcArrowUp, IcArrowDown } from '../components/ui/icons';

// Inline download icon (not yet in icon set)
function IcDownload({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );
}

// ── CSS-var aliases (design-doc names → actual tokens) ───────────────────────
// --brand-500  → --accent         (WhatsApp green)
// --brand-600  → --green-600
// --brand-700  → --green-700
// --brand-400  → --green-500 at 70% opacity — we just use a lighter green
// --brand-soft → --accent-fill
// --brand-soft-line → --green-200
// --ink        → --text
// --ink-muted  → --text-muted
// --ink-faint  → --text-subtle
// --surface-2  → --bg-subtle / --bg-hover
// --line       → --border
// --human-500  → --amber-500
// --human-600  → #D97706
// --ai-cyan    → #67E8F9
// --green-500  → --green-500 (same)
// --green-600  → --green-600

// ── Unique-ID counter for SVG gradient IDs ───────────────────────────────────
let _uid = 0;
function uid(p: string) { return `${p}-${++_uid}`; }

// ── Small chart components ────────────────────────────────────────────────────

function LineChart({ data, color = 'var(--accent)', h = 160, min: minO, max: maxO }: {
  data: number[]; color?: string; h?: number; min?: number; max?: number;
}) {
  const W = 560, pad = { l:6, r:6, t:14, b:22 };
  const max = maxO ?? Math.max(...data) * 1.04;
  const min = minO ?? Math.min(...data) * 0.96;
  const rng = max - min || 1;
  const X = (i: number) => pad.l + (i / (data.length - 1)) * (W - pad.l - pad.r);
  const Y = (v: number) => pad.t + (1 - (v - min) / rng) * (h - pad.t - pad.b);
  const line = data.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(' ');
  const area = `${line} L${X(data.length - 1)} ${h - pad.b} L${X(0)} ${h - pad.b} Z`;
  const gid = uid('ln');
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${h}`} preserveAspectRatio="none" style={{ display:'block' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.2" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((f, i) => {
        const y = pad.t + (h - pad.t - pad.b) * f;
        return <line key={i} x1={pad.l} x2={W - pad.r} y1={y} y2={y} stroke="var(--border)" />;
      })}
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((v, i) => i === data.length - 1
        ? <circle key={i} cx={X(i)} cy={Y(v)} r="3.5" fill={color} />
        : null
      )}
    </svg>
  );
}

function BarChart({ data, color = 'var(--accent)', h = 160, target }: {
  data: { d: string; val: number }[]; color?: string; h?: number; target?: number;
}) {
  const W = 560, pad = { l:8, r:8, t:14, b:26 };
  const max = Math.max(...data.map(d => d.val), target ?? 0) * 1.12;
  const bw = ((W - pad.l - pad.r) / data.length) * 0.5;
  const step = (W - pad.l - pad.r) / data.length;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${h}`} preserveAspectRatio="none" style={{ display:'block' }}>
      {[0, 0.5, 1].map((f, i) => {
        const y = pad.t + (h - pad.t - pad.b) * f;
        return <line key={i} x1={pad.l} x2={W - pad.r} y1={y} y2={y} stroke="var(--border)" />;
      })}
      {target != null && (
        <line
          x1={pad.l} x2={W - pad.r}
          y1={h - pad.b - (h - pad.t - pad.b) * target / max}
          y2={h - pad.b - (h - pad.t - pad.b) * target / max}
          stroke="var(--amber-500)" strokeWidth="1.5" strokeDasharray="4 4"
        />
      )}
      {data.map((d, i) => {
        const bh = (h - pad.t - pad.b) * d.val / max;
        const x = pad.l + i * step + (step - bw) / 2;
        const y = h - pad.b - bh;
        const over = target != null && d.val > target;
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={bh} rx={3} fill={over ? 'var(--amber-500)' : color}>
              <title>{d.d}: {d.val} min</title>
            </rect>
            <text x={pad.l + i * step + step / 2} y={h - 8} textAnchor="middle" fontSize="11" fill="var(--text-subtle)" fontWeight="500">{d.d}</text>
          </g>
        );
      })}
    </svg>
  );
}

function HBar({ data, color = 'var(--accent)' }: {
  data: { label: string; value: number }[]; color?: string;
}) {
  const max = Math.max(...data.map(d => d.value));
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      {data.map((d, i) => (
        <div key={i} style={{ display:'grid', gridTemplateColumns:'128px 1fr 52px', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:13, color:'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.label}</span>
          <div style={{ height:9, borderRadius:5, background:'var(--bg-subtle)', overflow:'hidden' }}>
            <div style={{ width:`${d.value / max * 100}%`, height:'100%', borderRadius:5, background:color, transition:'width .7s cubic-bezier(.2,.7,.3,1)' }} />
          </div>
          <span style={{ fontSize:12, fontWeight:600, textAlign:'right', fontFamily:'monospace' }}>{d.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ data, centerLabel, centerSub, size = 150, thickness = 22 }: {
  data: { label: string; value: number; color: string }[];
  centerLabel: string; centerSub: string; size?: number; thickness?: number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = (size - thickness) / 2, cx = size / 2, cy = size / 2, circ = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:22, flexWrap:'wrap' }}>
      <div style={{ position:'relative', width:size, height:size, flexShrink:0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform:'rotate(-90deg)' }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg-subtle)" strokeWidth={thickness} />
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
          <span style={{ fontSize:26, fontWeight:700, letterSpacing:'-.02em' }}>{centerLabel}</span>
          <span style={{ fontSize:11.5, color:'var(--text-muted)', fontWeight:500 }}>{centerSub}</span>
        </div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10, flex:1, minWidth:140 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:9 }}>
            <span style={{ width:9, height:9, borderRadius:'50%', background:d.color, flexShrink:0 }} />
            <span style={{ fontSize:13, color:'var(--text-muted)', flex:1 }}>{d.label}</span>
            <span style={{ fontSize:13, fontWeight:600 }}>{d.value}</span>
            <span style={{ fontSize:11, color:'var(--text-subtle)', minWidth:34, textAlign:'right', fontFamily:'monospace' }}>
              {Math.round(d.value / total * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressBar({ value, max = 100 }: { value: number; max?: number }) {
  const p = Math.min(100, (value / max) * 100);
  return (
    <div style={{ height:8, borderRadius:4, background:'var(--bg-subtle)', overflow:'hidden' }}>
      <div style={{ width:`${p}%`, height:'100%', borderRadius:4, background:'var(--accent)', transition:'width .6s cubic-bezier(.2,.7,.3,1)' }} />
    </div>
  );
}

// DBar: delivery-performance horizontal bars with "best" highlight
function DBar({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map(d => d.value));
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:11 }}>
      {data.map((d, i) => (
        <div key={d.label} style={{ display:'grid', gridTemplateColumns:'132px 1fr 52px', alignItems:'center', gap:12 }}>
          <span style={{
            fontSize:12.5,
            color: i === 0 ? 'var(--green-700)' : 'var(--text-muted)',
            fontWeight: i === 0 ? 600 : 400,
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
          }}>
            {i === 0 ? '★ ' : ''}{d.label}
          </span>
          <div style={{ height:10, borderRadius:5, background:'var(--bg-subtle)', overflow:'hidden' }}>
            <div style={{
              width:`${d.value / max * 100}%`, height:'100%', borderRadius:5,
              background: i === 0 ? 'var(--green-700)' : 'var(--accent)',
              transition:'width .6s cubic-bezier(.2,.7,.3,1)',
            }} />
          </div>
          <span style={{ fontSize:12, fontWeight:600, textAlign:'right', fontFamily:'monospace', color: i === 0 ? 'var(--green-700)' : 'var(--text)' }}>
            {d.value}%
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Section title ─────────────────────────────────────────────────────────────
function SectionTitle({ children, sub, action }: {
  children: React.ReactNode; sub?: string; action?: React.ReactNode;
}) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8, marginBottom:12 }}>
      <div>
        <div style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>{children}</div>
        {sub && <div style={{ fontSize:12.5, color:'var(--text-muted)', marginTop:2 }}>{sub}</div>}
      </div>
      {action && <div style={{ flexShrink:0 }}>{action}</div>}
    </div>
  );
}

// ── MiniStat KPI card ─────────────────────────────────────────────────────────
function MiniStat({ label, value, suffix, delta, deltaGood = true }: {
  label: string; value: string | number; suffix?: string; delta?: number; deltaGood?: boolean;
}) {
  const flat = delta === 0 || delta == null;
  const up = (delta ?? 0) > 0;
  const good = flat ? null : (up === deltaGood);
  const deltaColor = flat ? 'var(--text-subtle)' : good ? 'var(--green-600)' : '#EF4444';
  return (
    <div style={{
      padding:'16px 18px', borderRadius:12, border:'1px solid var(--border)',
      background:'var(--bg)',
    }}>
      <div style={{ fontSize:12.5, color:'var(--text-muted)', marginBottom:8 }}>{label}</div>
      <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
        <span style={{ fontSize:26, fontWeight:700, letterSpacing:'-.02em' }}>{value}</span>
        {suffix && <span style={{ fontSize:14, color:'var(--text-muted)', fontWeight:600 }}>{suffix}</span>}
        {!flat && (
          <span style={{ marginLeft:'auto', display:'inline-flex', alignItems:'center', gap:2, fontSize:12, fontWeight:600, color:deltaColor }}>
            {up ? <IcArrowUp size={13} /> : <IcArrowDown size={13} />}
            {Math.abs(delta ?? 0)}%
          </span>
        )}
      </div>
    </div>
  );
}

// ── Delivery funnel ───────────────────────────────────────────────────────────
function Funnel({ data }: { data: { label: string; value: number; color: string }[] }) {
  const top = data[0].value;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      {data.map((d, i) => {
        const pct = Math.round(d.value / top * 100);
        const conv = i > 0 ? Math.round(d.value / data[i - 1].value * 100) : 100;
        return (
          <div key={i}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5, fontSize:13 }}>
              <span style={{ fontWeight:500 }}>{d.label}</span>
              <span>
                <b>{d.value.toLocaleString()}</b>{' '}
                <span style={{ color:'var(--text-subtle)', fontSize:12 }}>· {pct}%</span>
              </span>
            </div>
            <div style={{ height:34, borderRadius:9, background:'var(--bg-subtle)', overflow:'hidden', position:'relative' }}>
              <div style={{
                width:`${pct}%`, height:'100%', borderRadius:9, background:d.color,
                transition:'width .7s cubic-bezier(.2,.7,.3,1)', display:'flex', alignItems:'center', paddingLeft:12,
              }} />
              {i > 0 && (
                <span style={{
                  position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                  fontSize:11.5, fontWeight:600, color:'var(--text-muted)', whiteSpace:'nowrap',
                }}>{conv}% of previous</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Legend ────────────────────────────────────────────────────────────────────
function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div style={{ display:'flex', gap:16, flexWrap:'wrap', alignItems:'center' }}>
      {items.map((it, i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:7 }}>
          <span style={{ width:9, height:9, background:it.color, borderRadius:'50%', display:'inline-block' }} />
          <span style={{ fontSize:12.5, color:'var(--text-muted)' }}>{it.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main Performance page ─────────────────────────────────────────────────────
export default function Performance() {
  const [range, setRange] = useState<Range>('30d');

  const kpisQ = useQuery({ queryKey: ['analytics', 'kpis', range], queryFn: () => getKpis(range) });
  const deliveryQ = useQuery({ queryKey: ['analytics', 'delivery', range], queryFn: () => getDelivery(range) });
  const autopilotQ = useQuery({ queryKey: ['analytics', 'autopilot', range], queryFn: () => getAutopilot(range) });
  const escalationQ = useQuery({ queryKey: ['analytics', 'escalation', range], queryFn: () => getEscalation(range) });
  const audienceQ = useQuery({ queryKey: ['analytics', 'audience'], queryFn: () => getAudience() });

  // Donut data for vehicle specialization
  const donutColors = ['var(--accent)','var(--blue-500)','#0891B2','var(--amber-500)','#DB2777','#65A30D','#6B7280'];
  const donutData = (audienceQ.data?.byVehicle ?? []).map((d, i) => ({
    label: vehicleLabel(d.vehicle),
    value: d.count,
    color: donutColors[i] ?? '#6B7280',
  }));

  const esc = escalationQ.data;
  const maxReason = Math.max(1, ...(esc?.byReason ?? []).map(r => r.count));
  const reasonColors: Record<string, string> = { KNOWLEDGE_GAP: 'var(--amber-500)', COMPLAINT: '#E0552E', LOW_CONFIDENCE: '#F4926A', SENSITIVE: '#C2410C' };

  return (
    <div style={{ padding:'24px 28px 40px', maxWidth:1320, margin:'0 auto', display:'flex', flexDirection:'column', gap:20 }}>

      {/* Header: range chips + export */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', gap:6 }}>
          {(['7d','30d','90d'] as const).map((id) => (
            <button
              key={id}
              onClick={() => setRange(id)}
              style={{
                padding:'5px 14px', borderRadius:99, fontSize:13, fontWeight:500, cursor:'pointer',
                border:`1px solid ${range === id ? 'var(--accent)' : 'var(--border)'}`,
                background: range === id ? 'var(--accent-fill)' : 'var(--bg)',
                color: range === id ? 'var(--green-700)' : 'var(--text-muted)',
                transition:'all .15s',
              }}
            >
              {id === '7d' ? '7 days' : id === '30d' ? '30 days' : '90 days'}
            </button>
          ))}
        </div>
        <button style={{
          display:'inline-flex', alignItems:'center', gap:6, padding:'6px 14px',
          borderRadius:8, border:'1px solid var(--border)', background:'var(--bg)',
          fontSize:13, color:'var(--text-muted)', cursor:'pointer', fontWeight:500,
        }}>
          <IcDownload size={15} />Export report
        </button>
      </div>

      {/* ── KPI strip ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
        <MiniStat label="Messages delivered" value={(kpisQ.data?.delivered.value ?? 0).toLocaleString()} delta={kpisQ.data?.delivered.deltaPct} />
        <MiniStat label="Delivery rate" value={kpisQ.data?.deliveryRate.value ?? 0} suffix="%" delta={kpisQ.data?.deliveryRate.deltaPct} />
        <MiniStat label="Avg. reply rate" value={kpisQ.data?.replyRate.value ?? 0} suffix="%" delta={kpisQ.data?.replyRate.deltaPct} />
        <MiniStat label="Auto-handle rate" value={kpisQ.data?.autoHandleRate.value ?? 0} suffix="%" delta={kpisQ.data?.autoHandleRate.deltaPct} />
      </div>

      {/* ── Row 1: Delivery funnel + Auto-handle rate trend ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <div style={{ padding:'20px 22px', borderRadius:12, border:'1px solid var(--border)', background:'var(--bg)' }}>
          <SectionTitle sub="From sent to replied — where dealers drop off">Delivery funnel</SectionTitle>
          <div style={{ marginTop:6 }}>
            <Funnel data={[
              { label: 'Sent',      value: deliveryQ.data?.funnel.sent ?? 0,      color: 'var(--green-600)' },
              { label: 'Delivered', value: deliveryQ.data?.funnel.delivered ?? 0, color: 'var(--green-500)' },
              { label: 'Read',      value: deliveryQ.data?.funnel.read ?? 0,      color: '#34D399' },
              { label: 'Replied',   value: deliveryQ.data?.funnel.replied ?? 0,   color: '#67E8F9' },
            ]} />
          </div>
        </div>
        <div style={{ padding:'20px 22px', borderRadius:12, border:'1px solid var(--border)', background:'var(--bg)' }}>
          <SectionTitle
            sub="Share of inbound the bot resolves without a human"
            action={<Badge tone="blue">14-day</Badge>}
          >Auto-handle rate trend</SectionTitle>
          <div style={{ display:'flex', alignItems:'baseline', gap:8, margin:'4px 0 6px' }}>
            <span style={{ fontSize:30, fontWeight:700, letterSpacing:'-.02em' }}>{autopilotQ.data?.autoHandleRate ?? 0}%</span>
            {kpisQ.data && (
              <span style={{ fontSize:13, fontWeight:600, color: (kpisQ.data.autoHandleRate.deltaPct ?? 0) >= 0 ? 'var(--green-600)' : '#EF4444' }}>
                {(kpisQ.data.autoHandleRate.deltaPct ?? 0) >= 0 ? '▲' : '▼'} {Math.abs(kpisQ.data.autoHandleRate.deltaPct ?? 0)}pp vs last period
              </span>
            )}
          </div>
          <LineChart data={(autopilotQ.data?.trend ?? []).map(t => t.rate)} color="var(--accent)" min={0} max={100} h={150} />
        </div>
      </div>

      {/* ── Row 2: Human response time + Dealers by state ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <div style={{ padding:'20px 22px', borderRadius:12, border:'1px solid var(--border)', background:'var(--bg)' }}>
          <SectionTitle
            sub="Average time for a human to reply after escalation (target ≤ 15 min)"
            action={<Legend items={[{ label:'Avg minutes', color:'var(--accent)' }, { label:'Over target', color:'var(--amber-500)' }]} />}
          >Human response time</SectionTitle>
          <BarChart data={(escalationQ.data?.responseTimeByDay ?? []).map(r => ({ d: new Date(r.date).toLocaleDateString('en-MY', { weekday: 'short' }), val: r.avgMinutes ?? 0 }))} color="var(--accent)" target={15} h={170} />
        </div>
        <div style={{ padding:'20px 22px', borderRadius:12, border:'1px solid var(--border)', background:'var(--bg)' }}>
          <SectionTitle sub="Where your dealer accounts are">Dealers by state</SectionTitle>
          <div style={{ marginTop:6 }}><HBar data={(audienceQ.data?.byState ?? []).map(s => ({ label: stateLabel(s.state), value: s.count }))} color="var(--blue-500)" /></div>
        </div>
      </div>

      {/* ── Row 3: Specialization donut + Top templates ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1.55fr', gap:16 }}>
        <div style={{ padding:'20px 22px', borderRadius:12, border:'1px solid var(--border)', background:'var(--bg)' }}>
          <SectionTitle sub="Dealer accounts by specialization">Specialization mix</SectionTitle>
          <div style={{ paddingTop:8 }}>
            <DonutChart
              size={150} centerLabel={String(donutData.length)} centerSub="types"
              data={donutData}
            />
          </div>
        </div>
        <div style={{ padding:'20px 22px', borderRadius:12, border:'1px solid var(--border)', background:'var(--bg)' }}>
          <SectionTitle sub="Best-converting templates by reply rate">Top templates</SectionTitle>
          <div style={{ display:'flex', flexDirection:'column', gap:2, marginTop:4 }}>
            {(deliveryQ.data?.topTemplates ?? []).map((t, i) => (
              <div key={t.templateId} style={{
                display:'grid', gridTemplateColumns:'24px 1fr 130px 56px',
                alignItems:'center', gap:12, padding:'9px 4px',
                borderTop: i ? '1px solid var(--border)' : 'none',
              }}>
                <span style={{ fontSize:13, fontWeight:700, color:'var(--text-subtle)' }}>{i + 1}</span>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'monospace', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {t.name} · {t.language}
                  </div>
                </div>
                <div><ProgressBar value={t.replyRate} /></div>
                <span style={{ fontSize:13, fontWeight:600, textAlign:'right', fontFamily:'monospace' }}>{t.replyRate}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Delivery performance by audience ── */}
      <div style={{ margin:'4px 0 -4px' }}>
        <h2 style={{ margin:0, fontSize:17, fontWeight:600 }}>Delivery performance — by audience</h2>
        <p style={{ margin:'2px 0 0', fontSize:13, color:'var(--text-muted)' }}>
          Where your blasts land best. Share of messages successfully delivered, sorted best-first.
        </p>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <div style={{ padding:'20px 22px', borderRadius:12, border:'1px solid var(--border)', background:'var(--bg)' }}>
          <SectionTitle sub="Delivery success rate by Malaysian state">By state</SectionTitle>
          <DBar data={(deliveryQ.data?.byState ?? []).map(s => ({ label: stateLabel(s.state), value: s.rate }))} />
          <div style={{
            marginTop:14, padding:'9px 12px', borderRadius:10,
            background:'var(--accent-fill)', border:'1px solid var(--green-200)',
            fontSize:12.5, color:'var(--green-700)', fontWeight:600,
          }}>
            Best responsive state: {deliveryQ.data?.byState[0] ? `${stateLabel(deliveryQ.data.byState[0].state)} — ${deliveryQ.data.byState[0].rate}%` : '—'}
          </div>
        </div>
        <div style={{ padding:'20px 22px', borderRadius:12, border:'1px solid var(--border)', background:'var(--bg)' }}>
          <SectionTitle sub="Delivery success rate by dealer specialization">By vehicle type</SectionTitle>
          <DBar data={(deliveryQ.data?.byVehicle ?? []).map(v => ({ label: vehicleLabel(v.vehicle), value: v.rate }))} />
          <div style={{
            marginTop:14, padding:'9px 12px', borderRadius:10,
            background:'var(--accent-fill)', border:'1px solid var(--green-200)',
            fontSize:12.5, color:'var(--green-700)', fontWeight:600,
          }}>
            Best responsive vehicle type: {deliveryQ.data?.byVehicle[0] ? `${vehicleLabel(deliveryQ.data.byVehicle[0].vehicle)} — ${deliveryQ.data.byVehicle[0].rate}%` : '—'}
          </div>
        </div>
      </div>

      {/* ── Escalation resolution ── */}
      <div style={{
        padding:'22px 24px', borderRadius:12,
        border:'1px solid var(--border)', borderTop:'3px solid var(--amber-500)',
        background:'var(--bg)',
      }}>
        <SectionTitle
          sub={'How the "Needs Human" ticket queue is being cleared'}
          action={<Badge tone="human">Needs-human area</Badge>}
        >Escalation resolution</SectionTitle>

        <div style={{ display:'grid', gridTemplateColumns:'1.1fr 1.4fr 1fr', gap:24, marginTop:6, alignItems:'start' }}>
          {/* Headline + trend */}
          <div>
            <div style={{ fontSize:12.5, color:'var(--text-muted)' }}>Escalation resolution rate</div>
            <div style={{ display:'flex', alignItems:'baseline', gap:8, margin:'2px 0 4px' }}>
              <span style={{ fontSize:38, fontWeight:700, letterSpacing:'-.02em' }}>{esc?.rate ?? 0}%</span>
              <span style={{ fontSize:13, fontWeight:600, color: (esc?.deltaPct ?? 0) >= 0 ? 'var(--green-600)' : '#EF4444', display:'inline-flex', alignItems:'center', gap:2 }}>
                {(esc?.deltaPct ?? 0) >= 0 ? <IcArrowUp size={14} /> : <IcArrowDown size={14} />}{Math.abs(esc?.deltaPct ?? 0)}pp
              </span>
            </div>
            <div style={{ fontSize:12, color:'var(--text-subtle)', marginBottom:10 }}>
              tickets resolved or closed · vs last period
            </div>
            <LineChart data={(esc?.trend ?? []).map(t => t.rate)} color="var(--green-500)" min={0} max={100} h={92} />
            <div style={{ fontSize:11, color:'var(--text-subtle)', marginTop:4 }}>Last 14 days</div>
          </div>

          {/* Closed by reason */}
          <div>
            <div style={{ fontSize:12.5, color:'var(--text-muted)', marginBottom:12 }}>Closed tickets by reason</div>
            <div style={{ display:'flex', flexDirection:'column', gap:11 }}>
              {(esc?.byReason ?? []).map(r => (
                <div key={r.reason} style={{ display:'grid', gridTemplateColumns:'120px 1fr 28px', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:12.5, color:'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{reasonLabel(r.reason)}</span>
                  <div style={{ height:9, borderRadius:5, background:'var(--bg-subtle)', overflow:'hidden' }}>
                    <div style={{ width:`${r.count / maxReason * 100}%`, height:'100%', borderRadius:5, background:reasonColors[r.reason] ?? 'var(--amber-500)' }} />
                  </div>
                  <span style={{ fontSize:12, fontWeight:600, textAlign:'right', fontFamily:'monospace' }}>{r.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Supporting stats */}
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {([
              ['Tickets opened',  esc?.opened ?? 0, 'var(--text)'],
              ['Tickets closed',  esc?.closed ?? 0, 'var(--green-600)'],
              ['Avg. time to close', fmtDuration(esc?.avgCloseMs ?? null), 'var(--text)'],
              ['Open remaining',  esc?.openRemaining ?? 0, '#D97706'],
            ] as [string, string | number, string][]).map(([l, v, col], i) => (
              <div key={i} style={{
                display:'flex', justifyContent:'space-between', alignItems:'center',
                padding:'10px 12px', borderRadius:10, background:'var(--bg-subtle)',
              }}>
                <span style={{ fontSize:12.5, color:'var(--text-muted)' }}>{l}</span>
                <span style={{ fontSize:17, fontWeight:700, color:col }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
