// screens/misc.jsx — Helpline + System status (short secondary screens)

function ScreenHelpline() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const hour = now.getHours();
  const isWorkday = day >= 1 && day <= 5;
  const isOpen = isWorkday && hour >= 9 && hour < 18;
  return (
    <Page>
      <PageHead title="Helpline" subtitle="Reference for live customer service operators." />
      <div className="grid-2">
        <Card>
          <div className="row" style={{ gap: 16, marginBottom: 12 }}>
            <div style={{ width: 56, height: 56, borderRadius: 12, background: "var(--green-500)", color: "#fff", display: "grid", placeItems: "center" }}>
              <IcPhone size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <div className="card-subtitle">Internal CS hotline</div>
              <a href="tel:+60378901234" style={{ fontSize: 28, fontWeight: 500, color: "var(--text-heading)", textDecoration: "none", fontFamily: "var(--mono)", letterSpacing: "-0.01em", lineHeight: 1.1 }}>+60 3 7890 1234</a>
            </div>
          </div>
          <div className="row" style={{ gap: 10 }}>
            {isOpen
              ? <Pill tone="green" dot>We're open</Pill>
              : <Pill tone="amber" dot>We're closed</Pill>}
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Mon–Fri 09:00–18:00 (Asia/Kuala_Lumpur)</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--text-subtle)", marginTop: 12 }}>
            Escalate stuck WhatsApp conversations to this number when the chatbot can't help and the case is time-sensitive.
          </div>
        </Card>
        <Card title="Meta Business support">
          <div style={{ fontSize: 14, fontWeight: 500 }}>business.facebook.com/help</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Quality rating, template approval, billing.</div>
          <Button variant="secondary" size="sm" icon={<IcExternal size={13} />} style={{ marginTop: 8 }}>Open</Button>
        </Card>
      </div>

      <div style={{ marginTop: 16 }}>
        <Card title="Last 24h escalations" subtitle="By reason">
          <div className="col" style={{ gap: 10 }}>
            {[
              ["refund_status",       8, "var(--amber-500)"],
              ["damaged_item",        5, "var(--red-500)"],
              ["wrong_address",       3, "var(--blue-500)"],
              ["tax_invoice_request", 3, "var(--gray-400)"],
              ["double_charge",       1, "var(--red-500)"],
            ].map(([name, count, color]) => (
              <div key={name} className="row" style={{ gap: 10 }}>
                <code style={{ width: 180 }}>{name}</code>
                <div style={{ flex: 1, height: 14, background: "var(--bg-hover)", borderRadius: 4, position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: (count / 8 * 100) + "%", background: color }} />
                </div>
                <span style={{ width: 40, textAlign: "right", fontVariantNumeric: "tabular-nums", fontSize: 13 }}>{count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div style={{ marginTop: 16 }}>
        <Card title="Common escalation scripts" padding={false}>
          {[
            ["refund_status",       "Apologise, ask for order number, escalate to finance via Slack #cs-refunds. Promise reply within 1 working day."],
            ["damaged_item",        "Apologise, request photo + order ref. Auto-issue store credit up to RM 50 with code DMG-{order}."],
            ["wrong_address",       "Check fulfilment status. If not shipped, edit address. If shipped, intercept via courier portal."],
            ["double_charge",       "Take case number, refund within 3 working days. Escalate to finance if amount > RM 500."],
          ].map(([intent, body]) => (
            <div key={intent} className="row" style={{ gap: 12, padding: "12px 16px", borderTop: "0.5px solid var(--border-hair)", alignItems: "flex-start" }}>
              <code style={{ width: 160, flexShrink: 0 }}>{intent}</code>
              <span style={{ flex: 1, fontSize: 13 }}>{body}</span>
            </div>
          ))}
        </Card>
        <div style={{ fontSize: 11, color: "var(--text-subtle)", marginTop: 8, textAlign: "right" }}>
          To change the helpline number or hours, go to Settings → Chatbot knowledge.
        </div>
      </div>
    </Page>
  );
}

function ScreenStatus() {
  const services = [
    { name: "Fastify API",          status: "operational", latency: "42ms",  uptime: "99.98%" },
    { name: "Runtime Agent (worker)", status: "operational", latency: "—",    uptime: "99.94%" },
    { name: "Postgres",             status: "operational", latency: "3ms",   uptime: "100.00%" },
    { name: "Redis (queue)",        status: "operational", latency: "1ms",   uptime: "100.00%" },
    { name: "Cloudflare tunnel",    status: "operational", latency: "18ms",  uptime: "99.91%" },
    { name: "Qwen3 (LLM, port 1234)",       status: "operational", latency: "210ms", uptime: "99.84%" },
    { name: "MiniMax-M2 (LLM, port 1235)",  status: "degraded",    latency: "1.2s",  uptime: "99.42%" },
    { name: "MiMo-V2-Flash (LLM, port 1236)", status: "operational", latency: "180ms", uptime: "99.89%" },
    { name: "Claude API (cloud fallback)",  status: "operational", latency: "320ms", uptime: "99.97%" },
    { name: "Meta WhatsApp API",            status: "operational", latency: "120ms", uptime: "99.93%" },
  ];

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setTick(x => x + 1), 10000);
    return () => clearInterval(iv);
  }, []);

  const anyDegraded = services.some(s => s.status !== "operational");

  return (
    <Page>
      <PageHead title="System status"
                subtitle={`Auto-refreshes every 10 seconds · last check ${(tick * 10) % 60}s ago`}
                actions={<Button variant="ghost" size="sm" icon={<IcRefresh size={13} />} onClick={() => setTick(t => t + 1)}>Refresh</Button>} />
      <Card title={anyDegraded ? "One service is degraded" : "All systems operational"}
            action={<Pill tone={anyDegraded ? "amber" : "green"} dot>{anyDegraded ? "partial" : "up"} · last check just now</Pill>}
            padding={false}>
        {services.map(s => (
          <div key={s.name} className="row" style={{ gap: 12, padding: "12px 16px", borderTop: "0.5px solid var(--border-hair)" }}>
            <StatusIcon status={s.status} />
            <span style={{ flex: 1, fontWeight: 500 }}>{s.name}</span>
            <span style={{ fontSize: 11, color: "var(--text-subtle)", width: 80, textAlign: "right" }} className="mono">{s.latency}</span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>30d uptime</span>
            <span style={{ fontSize: 13, fontVariantNumeric: "tabular-nums", width: 70, textAlign: "right" }}>{s.uptime}</span>
            <div style={{ width: 90, height: 16, display: "flex", gap: 1 }}>
              {Array.from({ length: 30 }).map((_, i) => {
                const bad = s.status === "degraded" && i >= 26;
                const warn = s.name.startsWith("Cloudflare") && i === 7;
                return (
                  <div key={i} style={{ flex: 1, background: bad ? "var(--red-500)" : warn ? "var(--amber-500)" : "var(--green-500)", borderRadius: 1 }} />
                );
              })}
            </div>
          </div>
        ))}
      </Card>
      <div style={{ marginTop: 16 }}>
        <Card title="Incidents — last 30 days">
          {anyDegraded ? (
            <div className="col" style={{ gap: 10 }}>
              <div className="row" style={{ gap: 10, padding: 12, background: "var(--amber-50)", borderRadius: 8 }}>
                <IcAlert size={14} style={{ color: "var(--amber-500)" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>Elevated latency · MiniMax-M2</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Started 14 min ago · ongoing · routing 20% of inference to Claude fallback</div>
                </div>
                <Pill tone="amber" dot>ongoing</Pill>
              </div>
            </div>
          ) : (
            <Empty icon={<IcCheckCircle size={20} />} title="No incidents in the last 30 days"
                   body="All services have been operational for 23 days." />
          )}
        </Card>
      </div>
    </Page>
  );
}

function StatusIcon({ status }) {
  if (status === "operational") return <span style={{ color: "var(--green-500)" }}><IcCheckCircle size={14} /></span>;
  if (status === "degraded")    return <span style={{ color: "var(--amber-500)" }}><IcAlert size={14} /></span>;
  if (status === "down")        return <span style={{ color: "var(--red-500)" }}><IcX size={14} /></span>;
  return <span style={{ color: "var(--text-muted)" }}><IcInfo size={14} /></span>;
}

Object.assign(window, { ScreenHelpline, ScreenStatus });
