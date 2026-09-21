// ui.jsx — shared UI primitives (Button, Pill, Avatar, Cbx, Switch, Table, etc.)

const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ── Avatar ─────────────────────────────────────────────────────────────────
function Avatar({ name, initials, size = "md", color }) {
  const letters = initials || (name || "?").split(/\s+/).slice(0, 2).map(s => s[0]).join("").toUpperCase();
  return <span className={"avatar " + size} style={color ? { background: color } : null}>{letters}</span>;
}

// ── Button (icon-only via children=<icon/> + title) ─────────────────────────
function Button({ variant = "secondary", size, icon, children, locked, onClick, type = "button", title, ...rest }) {
  const cls = ["btn", "btn-" + variant, size, locked && "btn-locked"].filter(Boolean).join(" ");
  return (
    <button type={type} className={cls} onClick={locked ? (e) => e.preventDefault() : onClick} title={title} {...rest}>
      {icon}
      {children}
    </button>
  );
}

function IconButton({ icon, title, onClick, size, locked, ...rest }) {
  const cls = ["btn", "btn-ghost", "btn-icon", size, locked && "btn-locked"].filter(Boolean).join(" ");
  return (
    <button type="button" className={cls} onClick={locked ? (e) => e.preventDefault() : onClick} title={title} aria-label={title} {...rest}>
      {icon}
    </button>
  );
}

// ── Pill / tag ──────────────────────────────────────────────────────────────
function Pill({ tone = "gray", dot, children, icon }) {
  return (
    <span className="pill" data-tone={tone}>
      {dot && <i className="dot" />}
      {icon}
      {children}
    </span>
  );
}

function TagUpper({ tone, children }) {
  return <span className="tag-upper" data-tone={tone}>{children}</span>;
}

// ── Switch / Checkbox ──────────────────────────────────────────────────────
function Switch({ on, onChange }) {
  return (
    <button type="button" role="switch" aria-checked={!!on}
            className="switch" data-on={on ? "true" : "false"}
            onClick={() => onChange && onChange(!on)}><i /></button>
  );
}

function Cbx({ on, onChange, indeterminate }) {
  const state = indeterminate ? "indeterminate" : (on ? "true" : "false");
  return (
    <span role="checkbox" aria-checked={!!on} className="cbx" data-on={state}
          onClick={(e) => { e.stopPropagation(); onChange && onChange(!on); }}>
      <IcCheck size={10} />
    </span>
  );
}

// ── Tabs ───────────────────────────────────────────────────────────────────
function Tabs({ value, onChange, tabs }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button key={t.value} role="tab" aria-selected={value === t.value}
                className="tab" data-active={value === t.value}
                onClick={() => onChange(t.value)}>
          {t.label}
          {t.count != null && <span className="tab-count">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

// ── Stat tile ──────────────────────────────────────────────────────────────
function Stat({ label, value, delta, deltaDir = "up", foot, icon }) {
  return (
    <div className="stat">
      <div className="stat-label">{icon}{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-foot">
        {delta && <span className={deltaDir === "down" ? "delta-down" : "delta-up"}>
          {deltaDir === "down" ? <IcArrowDown size={12} /> : <IcArrowUp size={12} />} {delta}
        </span>}
        {foot && <span style={{ color: "var(--text-subtle)" }}>{foot}</span>}
      </div>
    </div>
  );
}

// ── Card ────────────────────────────────────────────────────────────────────
function Card({ title, subtitle, action, children, padding = true, head = true, style }) {
  return (
    <div className="card" style={style}>
      {head && (title || action) && (
        <div className="card-head">
          <div>
            {title && <div className="card-title">{title}</div>}
            {subtitle && <div className="card-subtitle">{subtitle}</div>}
          </div>
          {action}
        </div>
      )}
      <div style={padding ? { padding: 24 } : null}>{children}</div>
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────
function Empty({ icon, title, body, cta }) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      {body && <div className="empty-body">{body}</div>}
      {cta && <div style={{ marginTop: 8 }}>{cta}</div>}
    </div>
  );
}

// ── Error state ────────────────────────────────────────────────────────────
function ErrorState({ title, body, detail, cta }) {
  return (
    <div className="empty">
      <div className="empty-icon" style={{ background: "var(--red-50)", color: "#B91C1C" }}>
        <IcAlert size={20} />
      </div>
      <div className="empty-title">{title || "Something went wrong"}</div>
      {body && <div className="empty-body">{body}</div>}
      {detail && <code style={{ marginTop: 6, fontSize: 11, padding: "4px 8px" }}>{detail}</code>}
      {cta && <div style={{ marginTop: 8 }}>{cta}</div>}
    </div>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────
function Skeleton({ w, h = 12, br = 4, style }) {
  return <span className="skel" style={{
    display: "inline-block", width: w, height: h, borderRadius: br,
    background: "linear-gradient(90deg, var(--bg-hover) 0%, var(--bg-subtle) 50%, var(--bg-hover) 100%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.4s linear infinite",
    ...style,
  }} />;
}

// ── Relative time with tooltip showing exact UTC ───────────────────────────
function RelTime({ value, exact }) {
  let tip = exact;
  if (!tip && typeof value === "string" && /\d{4}-\d{2}-\d{2}/.test(value)) {
    try { tip = new Date(value).toISOString().replace("T", " ").slice(0, 19) + " UTC"; } catch {}
  }
  return <span title={tip || undefined}
               style={{ borderBottom: tip ? "0.5px dotted var(--text-subtle)" : "none", cursor: tip ? "help" : "default" }}>
    {value}
  </span>;
}

// ── Sparkline (SVG line) ────────────────────────────────────────────────────
function Sparkline({ data, height = 32, color, fill }) {
  if (!data || data.length === 0) return null;
  const w = 100, h = 32;
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => [i * step, h - ((v - min) / range) * (h - 4) - 2]);
  const d = pts.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const area = d + " L" + (w).toFixed(1) + "," + h + " L0," + h + " Z";
  const stroke = color || "var(--green-500)";
  const fillCol = fill || "rgba(37, 211, 102, 0.10)";
  return (
    <svg className="spark" style={{ height }} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <path d={area} fill={fillCol} />
      <path d={d} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

// ── Bar chart (simple) ──────────────────────────────────────────────────────
function BarChart({ data, height = 140, color = "var(--green-500)", labels }) {
  const w = 100, h = height;
  const max = Math.max(...data) || 1;
  const barW = (w - 2) / data.length;
  return (
    <svg style={{ width: "100%", height: h, display: "block" }} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      {data.map((v, i) => {
        const bh = (v / max) * (h - 18);
        return <rect key={i} x={i * barW + 1} y={h - bh - 14} width={barW - 2} height={bh} fill={color} rx="1" />;
      })}
    </svg>
  );
}

// ── Stacked bars (delivered / read / replied) ───────────────────────────────
function MultiBarChart({ series, height = 160 }) {
  // series: [{ name, color, data: [...] }]
  const cols = series[0].data.length;
  const w = 100, h = height;
  const groupW = (w - 4) / cols;
  const barW = groupW / series.length - 0.5;
  const max = Math.max(...series.flatMap(s => s.data)) || 1;
  return (
    <svg style={{ width: "100%", height: h }} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      {series.map((s, si) => s.data.map((v, ci) => {
        const x = 2 + ci * groupW + si * (barW + 0.4);
        const bh = (v / max) * (h - 14);
        return <rect key={si + "-" + ci} x={x} y={h - bh - 8} width={barW} height={bh} fill={s.color} rx="0.6" />;
      }))}
    </svg>
  );
}

// ── Donut ───────────────────────────────────────────────────────────────────
function Donut({ value, total, size = 80, stroke = 10, color = "var(--green-500)", track = "var(--bg-hover)", label }) {
  const r = (size - stroke) / 2;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  const off = circ - (value / total) * circ;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={c} cy={c} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth={stroke}
                strokeDasharray={circ} strokeDashoffset={off}
                transform={`rotate(-90 ${c} ${c})`} strokeLinecap="round" />
      </svg>
      {label && <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 12, fontWeight: 500 }}>
        {label}
      </div>}
    </div>
  );
}

// ── Status pill helpers ────────────────────────────────────────────────────
function StatusPill({ status }) {
  const map = {
    approved:   { tone: "green", label: "Approved", dot: true },
    pending:    { tone: "amber", label: "Pending",  dot: true },
    rejected:   { tone: "red",   label: "Rejected", dot: true },
    draft:      { tone: "gray",  label: "Draft" },
    scheduled:  { tone: "blue",  label: "Scheduled", dot: true },
    sending:    { tone: "green", label: "Sending",  dot: true },
    complete:   { tone: "gray",  label: "Complete" },
    paused:     { tone: "amber", label: "Paused" },
    "always-on":{ tone: "blue",  label: "Always on" },
    live:       { tone: "green", label: "Live", dot: true },
  };
  const m = map[status] || { tone: "gray", label: status };
  return <Pill tone={m.tone} dot={m.dot}>{m.label}</Pill>;
}

// ── CS-window ring (24h) ───────────────────────────────────────────────────
function CsWindow({ minutesLeft }) {
  const total = 24 * 60;
  const pct = Math.max(0, Math.min(100, (minutesLeft / total) * 100));
  const h = Math.floor(minutesLeft / 60);
  const m = minutesLeft % 60;
  const tone = minutesLeft < 120 ? "amber" : "green";
  const color = tone === "amber" ? "var(--amber-500)" : "var(--green-500)";
  return (
    <span className="cs-window" title={`${h}h ${m}m left in 24-hour customer service window`}>
      <span className="ring" style={{ "--p": pct + "%", background: `conic-gradient(${color} ${pct}%, var(--bg-hover) 0)` }} />
      {h > 0 ? `${h}h` : `${m}m`} left
    </span>
  );
}

// ── Filter pill (table filter chip) ────────────────────────────────────────
function FilterPill({ label, value, icon, onClick, dashed = true, active }) {
  return (
    <button className="filter-pill" data-on={!!value || active}
            onClick={onClick}>
      {icon}
      {value
        ? <><span className="lbl-key">{label}:</span> <span className="lbl-val">{value}</span></>
        : <>{label}</>}
      <IcChevD size={10} />
    </button>
  );
}

// ── Selection bar (sits above table when rows selected) ────────────────────
function SelectionBar({ count, onClear, actions }) {
  if (!count) return null;
  return (
    <div className="select-bar">
      <span><b>{count}</b> selected</span>
      <span className="spacer" />
      {actions}
      <button className="btn btn-ghost sm" onClick={onClear}>Clear</button>
    </div>
  );
}

// ── Page chrome ────────────────────────────────────────────────────────────
function PageHead({ title, subtitle, actions }) {
  return (
    <div className="page-head">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <div className="page-subtitle">{subtitle}</div>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

function Page({ children }) {
  return <div className="page"><div className="page-inner">{children}</div></div>;
}

// ── Progress bar ───────────────────────────────────────────────────────────
function Progress({ value, max = 100 }) {
  const p = Math.max(0, Math.min(100, (value / max) * 100));
  return <div className="progress-bar"><i style={{ width: p + "%" }} /></div>;
}

// ── Locked indicator for admin-only menu items ─────────────────────────────
function AdminLockHint({ children }) {
  return <span title="Admin only" style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--text-subtle)" }}>
    <IcLock size={11} /> {children}
  </span>;
}

// ── Dialog (modal) ─────────────────────────────────────────────────────
function Dialog({ open, onClose, title, children, footer, tone = "default", width = 460, icon }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose && onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div onClick={onClose}
         style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.42)",
                  display: "grid", placeItems: "center", zIndex: 200, padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()}
           style={{ width, maxWidth: "100%", background: "var(--bg)",
                    border: "0.5px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px 0", display: "flex", gap: 12, alignItems: "flex-start" }}>
          {icon && (
            <span style={{ width: 32, height: 32, borderRadius: 8, display: "grid", placeItems: "center",
                           background: tone === "destructive" ? "var(--red-50)" : tone === "warning" ? "var(--amber-50)" : "var(--green-100)",
                           color: tone === "destructive" ? "#B91C1C" : tone === "warning" ? "#B45309" : "var(--green-800)",
                           flexShrink: 0 }}>{icon}</span>
          )}
          <div style={{ flex: 1 }}>
            {title && <div style={{ fontSize: 16, fontWeight: 500, color: "var(--text)" }}>{title}</div>}
          </div>
          <button onClick={onClose} aria-label="Close"
                  style={{ width: 28, height: 28, border: 0, background: "transparent", color: "var(--text-muted)", borderRadius: 6, cursor: "pointer" }}>
            <IcX size={14} />
          </button>
        </div>
        <div style={{ padding: "12px 20px 16px", fontSize: 13, color: "var(--text)", lineHeight: 1.55 }}>
          {children}
        </div>
        {footer && (
          <div style={{ padding: "12px 20px", borderTop: "0.5px solid var(--border)",
                        background: "var(--bg-subtle)", display: "flex", gap: 8, justifyContent: "flex-end" }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Toast (with optional undo action + countdown) ─────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const remove = useCallback((id) => setToasts((t) => t.filter(x => x.id !== id)), []);
  const push = useCallback((msg, opts = {}) => {
    const id = Date.now() + Math.random();
    const duration = opts.duration || (opts.undo ? 5000 : 2600);
    const startedAt = Date.now();
    setToasts((t) => [...t, {
      id, msg, icon: opts.icon,
      tone: opts.tone || "default",
      undo: opts.undo, undoLabel: opts.undoLabel || "Undo",
      duration, startedAt,
    }]);
    setTimeout(() => remove(id), duration);
    return id;
  }, [remove]);

  const node = (
    <div className="toast-host">
      {toasts.map((t) => <ToastNode key={t.id} t={t} onClose={() => remove(t.id)} />)}
    </div>
  );
  return [push, node];
}

function ToastNode({ t, onClose }) {
  const [pct, setPct] = useState(100);
  const [secs, setSecs] = useState(Math.ceil(t.duration / 1000));
  useEffect(() => {
    if (!t.undo) return;
    const iv = setInterval(() => {
      const elapsed = Date.now() - t.startedAt;
      const ratio = 1 - elapsed / t.duration;
      setPct(Math.max(0, ratio * 100));
      setSecs(Math.max(0, Math.ceil((t.duration - elapsed) / 1000)));
      if (elapsed >= t.duration) clearInterval(iv);
    }, 80);
    return () => clearInterval(iv);
  }, [t]);

  const toneStyle = t.tone === "destructive" ? { background: "#7f1d1d" } : null;
  return (
    <div className="toast" style={{ ...toneStyle, paddingRight: t.undo ? 6 : 14, gap: 12, position: "relative", overflow: "hidden" }}>
      {t.icon || <IcCheckCircle size={14} />}
      <span style={{ flex: 1 }}>{t.msg}</span>
      {t.undo && (
        <button onClick={() => { t.undo(); onClose(); }}
                style={{
                  background: "transparent", border: 0, color: "#5BE391",
                  padding: "4px 10px", borderRadius: 6, cursor: "pointer",
                  fontSize: 12, fontWeight: 500, fontFamily: "inherit",
                  display: "flex", alignItems: "center", gap: 6,
                }}>
          {t.undoLabel} <span style={{ color: "rgba(255,255,255,0.5)", fontFamily: "var(--mono)", fontSize: 11 }}>{secs}s</span>
        </button>
      )}
      {t.undo && (
        <span style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 2, background: "rgba(255,255,255,0.08)" }}>
          <span style={{ display: "block", height: "100%", width: pct + "%", background: "#5BE391" }} />
        </span>
      )}
    </div>
  );
}

// ── Sheet (right-side drawer) ──────────────────────────────────────────────
function Sheet({ open, onClose, title, subtitle, children, footer, width }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose && onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  return (
    <>
      <div className="sheet-backdrop" data-open={open} onClick={onClose} />
      <aside className="sheet" data-open={open} style={width ? { width } : null}
             role="dialog" aria-modal="true" aria-hidden={!open}>
        <div className="sheet-head">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="sheet-title">{title}</div>
            {subtitle && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{subtitle}</div>}
          </div>
          <IconButton icon={<IcX size={14} />} title="Close" size="sm" onClick={onClose} />
        </div>
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-foot">{footer}</div>}
      </aside>
    </>
  );
}

Object.assign(window, {
  Avatar, Button, IconButton, Pill, TagUpper, Switch, Cbx, Tabs, Stat, Card, Empty,
  ErrorState, Skeleton, RelTime,
  Sparkline, BarChart, MultiBarChart, Donut, StatusPill, CsWindow, FilterPill,
  SelectionBar, PageHead, Page, Progress, AdminLockHint, useToast, Dialog, Sheet,
});
