// screens/campaign-detail.jsx — campaign detail in active / complete / failed states.

function ScreenCampaignDetail({ state, onBack }) {
  // state: "sending" | "complete" | "failed"
  const c = CAMPAIGNS.find(x => x.status === "sending") || CAMPAIGNS[2];
  const c2 = CAMPAIGNS.find(x => x.status === "complete") || CAMPAIGNS[3];
  const data = state === "complete" ? c2 : c;

  // Simulated live progress for the "sending" state
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (state !== "sending") return;
    const iv = setInterval(() => setTick(t => t + 1), 1400);
    return () => clearInterval(iv);
  }, [state]);
  const delivered = state === "sending"
    ? Math.min(data.audience, data.delivered + tick * 64)
    : state === "complete"
      ? data.delivered
      : Math.round(data.audience * 0.18);
  const audience = data.audience;
  const pct = (delivered / audience) * 100;
  const read = Math.round(delivered * (state === "sending" ? 0.42 : state === "complete" ? 0.86 : 0.31));
  const replied = Math.round(delivered * (state === "sending" ? 0.025 : state === "complete" ? 0.21 : 0.014));
  const failed = state === "failed" ? Math.round(audience * 0.82) : Math.round(delivered * 0.012);

  const events = [
    { t: "12:34:08", body: "Sent to +60 12 345 6789", icon: <IcSend size={11} />, tone: "muted" },
    { t: "12:34:08", body: "Delivered to +60 12 345 6789", icon: <IcCheck size={11} />, tone: "green" },
    { t: "12:34:12", body: "Read by +60 13 512 7780", icon: <IcEye size={11} />, tone: "blue" },
    { t: "12:34:16", body: "Reply received from Ahmad Faizal → Inbox", icon: <IcMessage size={11} />, tone: "green" },
    { t: "12:34:20", body: "Sent batch of 64 messages", icon: <IcSend size={11} />, tone: "muted" },
    { t: "12:34:24", body: "Delivered to +60 18 330 5512", icon: <IcCheck size={11} />, tone: "green" },
    { t: "12:34:28", body: "Failed: number not on WhatsApp", icon: <IcX size={11} />, tone: "red" },
    { t: "12:34:32", body: "Sent batch of 64 messages", icon: <IcSend size={11} />, tone: "muted" },
    { t: "12:34:36", body: "Read by +60 11 1207 8830", icon: <IcEye size={11} />, tone: "blue" },
    { t: "12:34:40", body: "Reply received from Lim Wei Jie → Inbox", icon: <IcMessage size={11} />, tone: "green" },
  ];

  return (
    <Page>
      <div className="row" style={{ marginBottom: 16, gap: 12 }}>
        <Button variant="ghost" size="sm" icon={<IcChevL size={13} />} onClick={onBack}>Back to campaigns</Button>
        <div style={{ flex: 1 }}>
          <div className="row" style={{ gap: 10 }}>
            <h1 className="page-title">{data.name}</h1>
            <StatusPill status={state === "sending" ? "sending" : state === "complete" ? "complete" : "rejected"} />
            {state === "failed" && <Pill tone="red" dot>Failed</Pill>}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }} className="row">
            <IcFilter size={11} style={{ marginRight: 4 }} /> {data.segment}
            <span style={{ margin: "0 6px", color: "var(--text-subtle)" }}>·</span>
            <code style={{ fontSize: 11 }}>{data.template}</code>
            <span style={{ margin: "0 6px", color: "var(--text-subtle)" }}>·</span>
            <IcUser size={11} style={{ marginRight: 4 }} /> {data.owner}
          </div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          {state === "sending" && (
            <>
              <Button variant="secondary" size="sm" icon={<IcPause size={13} />}>Pause</Button>
              <Button variant="secondary" size="sm" icon={<IcX size={13} />}>Cancel</Button>
            </>
          )}
          {state === "complete" && (
            <>
              <Button variant="secondary" size="sm" icon={<IcCopy size={13} />}>Duplicate</Button>
              <Button variant="primary" size="sm" icon={<IcMessage size={13} />}>Send follow-up to non-responders</Button>
            </>
          )}
          {state === "failed" && (
            <>
              <Button variant="secondary" size="sm" icon={<IcExternal size={13} />}>View Meta error log</Button>
              <Button variant="primary" size="sm" icon={<IcRefresh size={13} />}>Retry failed (1,024)</Button>
            </>
          )}
        </div>
      </div>

      {state === "failed" && (
        <div className="card" style={{ marginBottom: 16, background: "var(--red-50)", border: "0.5px solid rgba(239, 68, 68, 0.28)" }}>
          <div style={{ padding: 14, display: "flex", gap: 12 }}>
            <IcAlert size={16} style={{ color: "var(--red-500)", marginTop: 2, flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: 13 }}>
              <div style={{ fontWeight: 500, color: "#B91C1C" }}>Campaign halted after 18% sent</div>
              <div style={{ marginTop: 4, color: "var(--text-muted)" }}>
                Meta returned <code>error 132012: Parameter format does not match format in template</code>. Variable <code>{`{{3}}`}</code> received a string but the template expects a date.
              </div>
              <div style={{ marginTop: 6, fontSize: 12 }}>
                <a className="link">View Meta error log →</a>
                <span style={{ margin: "0 8px", color: "var(--text-subtle)" }}>·</span>
                <a className="link">Fix variable mapping →</a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top progress section */}
      {state === "sending" && (
        <div className="card" style={{ marginBottom: 16, padding: 18 }}>
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
            <div className="row" style={{ gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>Live progress</span>
              <Pill tone="green" dot>sending</Pill>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>ETA <b style={{ color: "var(--text)" }}>3 min 12s</b> · ~64 msg/sec</div>
          </div>
          <div className="row" style={{ gap: 12, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <div className="row" style={{ justifyContent: "space-between", marginBottom: 6, fontSize: 12 }}>
                <span>{delivered.toLocaleString()} of {audience.toLocaleString()} messages</span>
                <span style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{pct.toFixed(1)}%</span>
              </div>
              <Progress value={pct} />
            </div>
          </div>
        </div>
      )}

      <div className="kpi-strip" style={{ marginBottom: 16 }}>
        <Stat label="Sent"      value={delivered.toLocaleString()} delta={state === "sending" ? "+64/s" : null} />
        <Stat label="Delivered" value={Math.round(delivered * 0.98).toLocaleString()} foot={`${(delivered ? 98 : 0).toFixed(1)}%`} />
        <Stat label="Read"      value={read.toLocaleString()}      foot={`${delivered ? ((read / delivered) * 100).toFixed(1) : 0}%`} />
        <Stat label="Replied"   value={replied.toLocaleString()}   foot={`${delivered ? ((replied / delivered) * 100).toFixed(1) : 0}%`} />
        <Stat label="Failed"    value={failed.toLocaleString()}    foot={state === "failed" ? "82% of total" : `${delivered ? ((failed / delivered) * 100).toFixed(1) : 0}%`} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 16 }}>
        <div className="col" style={{ gap: 16 }}>
          {state !== "failed" && (
            <Card title="Send timeline" subtitle="Messages dispatched per minute">
              <BarChart height={140}
                        data={state === "sending"
                          ? [40, 60, 110, 180, 210, 240, 260, 280, 290, 270, 250, 240, 210, 180]
                          : [820, 940, 1020, 1180, 1290, 1420, 1390, 1310, 1240, 1180, 1090, 980, 880, 720]} />
              <div className="row" style={{ justifyContent: "space-between", marginTop: 6, fontSize: 11, color: "var(--text-muted)" }}>
                <span>12:30</span><span>12:42</span><span>{state === "sending" ? "now" : "13:00"}</span>
              </div>
            </Card>
          )}

          <Card title="Status breakdown">
            <div className="row" style={{ alignItems: "center", gap: 24 }}>
              <Donut value={state === "failed" ? 18 : 100} total={100} size={120} stroke={14}
                     color={state === "failed" ? "var(--red-500)" : "var(--green-500)"}
                     label={state === "failed" ? "18%" : pct.toFixed(0) + "%"} />
              <div className="col" style={{ gap: 8, flex: 1, fontSize: 13 }}>
                <div className="row" style={{ justifyContent: "space-between" }}><span><span className="dot green" /> Delivered</span><b>{Math.round(delivered * 0.98).toLocaleString()}</b></div>
                <div className="row" style={{ justifyContent: "space-between" }}><span><span className="dot blue" /> Read</span><b>{read.toLocaleString()}</b></div>
                <div className="row" style={{ justifyContent: "space-between" }}><span><span className="dot" style={{ background: "var(--green-800)" }} /> Replied</span><b>{replied.toLocaleString()}</b></div>
                <div className="row" style={{ justifyContent: "space-between" }}><span><span className="dot red" /> Failed</span><b>{failed.toLocaleString()}</b></div>
                <div className="row" style={{ justifyContent: "space-between" }}><span><span className="dot gray" /> Not sent</span><b>{(audience - delivered).toLocaleString()}</b></div>
              </div>
            </div>
          </Card>

          {state === "complete" && (
            <div className="grid-2">
              <Stat label="Cost (final)" value={myrFmt(data.cost)} foot="≈ RM 0.06 / msg" />
              <Stat label="Cost per reply" value={myrFmt(data.cost / Math.max(1, data.replied))} foot={data.replied + " replies"} />
            </div>
          )}

          <div className="row" style={{ gap: 8 }}>
            <Button variant="ghost" size="sm" icon={<IcExternal size={13} />}>View all messages →</Button>
            {state === "complete" && <Button variant="ghost" size="sm" icon={<IcMessage size={13} />}>Send follow-up to non-responders →</Button>}
          </div>
        </div>

        <Card title="Activity feed"
              subtitle={state === "sending" ? "Last 20 events · live" : "Last 20 events"}
              padding={false}>
          <div style={{ maxHeight: 480, overflowY: "auto" }}>
            {events.map((e, i) => (
              <div key={i} className="row" style={{ gap: 10, padding: "8px 14px", borderTop: "0.5px solid var(--border-hair)", fontSize: 12 }}>
                <span style={{ fontFamily: "var(--mono)", color: "var(--text-muted)", width: 60, fontSize: 11 }}>{e.t}</span>
                <span style={{
                  width: 18, height: 18, borderRadius: 4, display: "grid", placeItems: "center",
                  background: e.tone === "green" ? "var(--green-100)" : e.tone === "red" ? "var(--red-50)" : e.tone === "blue" ? "var(--blue-50)" : "var(--bg-hover)",
                  color: e.tone === "green" ? "var(--green-700)" : e.tone === "red" ? "#B91C1C" : e.tone === "blue" ? "#1D4ED8" : "var(--text-muted)",
                  flexShrink: 0,
                }}>{e.icon}</span>
                <span style={{ flex: 1, color: "var(--text)" }}>{e.body}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Page>
  );
}

Object.assign(window, { ScreenCampaignDetail });
