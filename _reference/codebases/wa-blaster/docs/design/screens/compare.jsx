// screens/compare.jsx — side-by-side comparison of selected campaigns + drill-down sheet.

function ScreenCompare({ onBack }) {
  // Just pick two of the completed campaigns for the demo
  const a = CAMPAIGNS.find(c => c.id === "cm6") || CAMPAIGNS[5]; // Q3 NPS
  const b = CAMPAIGNS.find(c => c.id === "cm4") || CAMPAIGNS[3]; // Birthday Oct W4

  const [pushToast, toastNode] = useToast();

  const metrics = [
    { key: "audience",       label: "Audience size",  fmt: (v) => v.toLocaleString(), lower: false },
    { key: "delivered",      label: "Delivered",      fmt: (v) => v.toLocaleString(), lower: false },
    { key: "deliveryRate",   label: "Delivery rate",  fmt: (v) => v.toFixed(1) + "%", lower: false, derive: (c) => (c.delivered / c.audience) * 100 },
    { key: "read",           label: "Read",           fmt: (v) => v.toLocaleString(), lower: false },
    { key: "readRate",       label: "Read rate",      fmt: (v) => v.toFixed(1) + "%", lower: false, derive: (c) => (c.read / c.delivered) * 100 },
    { key: "replied",        label: "Replied",        fmt: (v) => v.toLocaleString(), lower: false },
    { key: "replyRate",      label: "Reply rate",     fmt: (v) => v.toFixed(2) + "%", lower: false, derive: (c) => (c.replied / c.delivered) * 100 },
    { key: "cost",           label: "Cost",           fmt: (v) => myrFmt(v),          lower: true },
    { key: "costPerReply",   label: "Cost / reply",   fmt: (v) => myrFmt(v),          lower: true, derive: (c) => c.cost / Math.max(1, c.replied) },
    { key: "optOut",         label: "Opt-out rate",   fmt: (v) => v.toFixed(2) + "%", lower: true,  derive: () => 0 },
  ];

  return (
    <Page>
      <div className="row" style={{ marginBottom: 16, gap: 12 }}>
        <Button variant="ghost" size="sm" icon={<IcChevL size={13} />} onClick={onBack}>Back to reports</Button>
        <div style={{ flex: 1 }}>
          <h1 className="page-title">Compare campaigns</h1>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>2 of 4 max · best result is highlighted per row</div>
        </div>
        <Button variant="secondary" size="sm" icon={<IcDownload size={13} />}
                onClick={() => pushToast("Compare exported · compare_2025-10-21.xlsx", { icon: <IcDownload size={14} /> })}>
          Export as Excel
        </Button>
      </div>

      <div className="card" style={{ overflow: "hidden", marginBottom: 16 }}>
        <div className="table-scroll">
          <table className="table" style={{ minWidth: 720 }}>
            <colgroup>
              <col style={{ width: "30%" }} />
              <col />
              <col />
            </colgroup>
            <thead>
              <tr>
                <th>Metric</th>
                <th>
                  <div style={{ fontWeight: 500, color: "var(--text)" }}>{a.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }} className="mono">{a.template}</div>
                </th>
                <th>
                  <div style={{ fontWeight: 500, color: "var(--text)" }}>{b.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }} className="mono">{b.template}</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => {
                const va = m.derive ? m.derive(a) : a[m.key];
                const vb = m.derive ? m.derive(b) : b[m.key];
                const aBest = m.lower ? va < vb : va > vb;
                const bBest = !aBest && va !== vb;
                return (
                  <tr key={m.key}>
                    <td className="muted">{m.label}</td>
                    <td className={aBest ? "highlight-best" : ""}>
                      <span className="row" style={{ gap: 6 }}>
                        <b style={{ fontVariantNumeric: "tabular-nums" }}>{m.fmt(va)}</b>
                        {aBest && <TagUpper tone="green">BEST</TagUpper>}
                      </span>
                    </td>
                    <td className={bBest ? "highlight-best" : ""}>
                      <span className="row" style={{ gap: 6 }}>
                        <b style={{ fontVariantNumeric: "tabular-nums" }}>{m.fmt(vb)}</b>
                        {bBest && <TagUpper tone="green">BEST</TagUpper>}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Card title="Visual comparison" subtitle="Key engagement metrics side-by-side">
        <div className="row" style={{ gap: 12, marginBottom: 12, justifyContent: "flex-end", fontSize: 11 }}>
          <span className="row" style={{ gap: 4 }}><span style={{ width: 10, height: 10, background: "var(--green-500)", borderRadius: 2 }} /> {a.name}</span>
          <span className="row" style={{ gap: 4 }}><span style={{ width: 10, height: 10, background: "var(--green-800)", borderRadius: 2 }} /> {b.name}</span>
        </div>
        <CompareBars groups={[
          { label: "Delivery %", a: (a.delivered / a.audience) * 100, b: (b.delivered / b.audience) * 100, max: 100 },
          { label: "Read %",     a: (a.read / a.delivered) * 100,     b: (b.read / b.delivered) * 100,     max: 100 },
          { label: "Reply %",    a: (a.replied / a.delivered) * 100,  b: (b.replied / b.delivered) * 100,  max: 30 },
        ]} />
      </Card>

      {toastNode}
    </Page>
  );
}

function CompareBars({ groups }) {
  return (
    <div className="col" style={{ gap: 14 }}>
      {groups.map((g) => (
        <div key={g.label}>
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 6, fontSize: 12 }}>
            <span>{g.label}</span>
            <span style={{ color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>{g.a.toFixed(1)} vs {g.b.toFixed(1)}</span>
          </div>
          <div className="col" style={{ gap: 4 }}>
            <div style={{ height: 14, background: "var(--bg-hover)", borderRadius: 999, overflow: "hidden" }}>
              <div style={{ width: (g.a / g.max * 100) + "%", height: "100%", background: "var(--green-500)", borderRadius: 999 }} />
            </div>
            <div style={{ height: 14, background: "var(--bg-hover)", borderRadius: 999, overflow: "hidden" }}>
              <div style={{ width: (g.b / g.max * 100) + "%", height: "100%", background: "var(--green-800)", borderRadius: 999 }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── KPI drill-down sheet ─────────────────────────────────────────────────────
function KpiDrilldown({ open, onClose, kpi }) {
  if (!kpi) return <Sheet open={false} onClose={onClose} title="" />;
  const series = {
    sent:     SPARK_SENT,
    delivery: [97.8, 98.0, 98.2, 98.1, 97.9, 98.3, 98.4, 98.2, 98.0, 98.1, 98.2, 98.4, 98.3, 98.1],
    read:     [70.2, 71.1, 71.8, 71.4, 72.6, 73.1, 72.9, 73.8, 74.4, 71.9, 73.3, 72.8, 72.2, 71.8],
    reply:    [9.8, 10.4, 11.2, 11.8, 12.1, 12.4, 12.0, 12.8, 13.1, 13.0, 13.4, 13.2, 13.5, 13.4],
  }[kpi.id] || SPARK_SENT;

  return (
    <Sheet open={open} onClose={onClose}
           title={kpi.title}
           subtitle="Last 14 days — full breakdown"
           footer={
             <>
               <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
               <Button variant="primary" size="sm" icon={<IcDownload size={13} />}>Export</Button>
             </>
           }>
      <div className="row" style={{ alignItems: "baseline", gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 32, fontWeight: 500, letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums" }}>{kpi.value}</span>
        <span className="delta-up" style={{ fontSize: 13 }}>{kpi.delta}</span>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>vs previous period</span>
      </div>
      <BarChart data={series} height={180} />
      <div className="row" style={{ justifyContent: "space-between", marginTop: 6, fontSize: 11, color: "var(--text-muted)" }}>
        <span>Oct 8</span><span>Oct 14</span><span>Today</span>
      </div>

      <div className="h3" style={{ marginTop: 20, marginBottom: 10 }}>Breakdown by template</div>
      <div className="col" style={{ gap: 8 }}>
        {TEMPLATES.filter(t => t.sent7d > 0).slice(0, 5).map((t) => (
          <div key={t.id} className="row" style={{ gap: 10 }}>
            <code style={{ width: 180, fontSize: 11 }}>{t.name}</code>
            <div style={{ flex: 1, height: 14, background: "var(--bg-hover)", borderRadius: 4, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: (t.sent7d / 8920 * 100) + "%", background: "var(--green-500)" }} />
            </div>
            <span style={{ width: 60, textAlign: "right", fontVariantNumeric: "tabular-nums", fontSize: 12 }}>{t.sent7d.toLocaleString()}</span>
          </div>
        ))}
      </div>

      <div className="h3" style={{ marginTop: 20, marginBottom: 10 }}>Breakdown by segment</div>
      <div className="col" style={{ gap: 8 }}>
        {SEGMENTS.slice(0, 5).map((s) => (
          <div key={s.id} className="row" style={{ gap: 10 }}>
            <span style={{ width: 180, fontSize: 12 }}>{s.name}</span>
            <div style={{ flex: 1, height: 14, background: "var(--bg-hover)", borderRadius: 4, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: (s.size / 12480 * 100) + "%", background: "var(--green-600)" }} />
            </div>
            <span style={{ width: 60, textAlign: "right", fontVariantNumeric: "tabular-nums", fontSize: 12 }}>{s.size.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </Sheet>
  );
}

Object.assign(window, { ScreenCompare, KpiDrilldown });
