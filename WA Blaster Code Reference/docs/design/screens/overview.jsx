// screens/overview.jsx — home dashboard

function ScreenOverview({ role, populated }) {
  const greeting = role === "admin" ? "Aisyah" : "Daniel";

  if (!populated) {
    return (
      <Page>
        <PageHead title={`Welcome, ${greeting}`} subtitle="Set up your workspace to start sending campaigns." />
        <div className="grid-2" style={{ gap: 24 }}>
          <Card title="1. Connect your WhatsApp number" subtitle="Verify your Meta Business account and number">
            <Button variant="primary" icon={<IcPhone size={14} />}>Connect number</Button>
          </Card>
          <Card title="2. Import your contacts" subtitle="Upload an opted-in CSV (max 50k rows)">
            <Button variant="secondary" icon={<IcUpload size={14} />}>Import CSV</Button>
          </Card>
          <Card title="3. Submit your first template" subtitle="Meta review takes ~24 hours">
            <Button variant="secondary" icon={<IcPlus size={14} />}>Create template</Button>
          </Card>
          <Card title="4. Run your first campaign" subtitle="Pick a segment, choose a template, schedule">
            <Button variant="secondary" icon={<IcSend size={14} />} disabled>Send (after steps 1–3)</Button>
          </Card>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <PageHead title={`Welcome, ${greeting}`}
                subtitle={`Tuesday, 21 October · ${role === "admin" ? "Admin" : "Operator"} view`}
                actions={
                  <>
                    <Button variant="secondary" icon={<IcUpload size={14} />}>Import CSV</Button>
                    <Button variant="primary" icon={<IcSend size={14} />}>New campaign</Button>
                  </>
                } />

      <div className="kpi-strip" style={{ marginBottom: 32 }}>
        <Stat label="Sent today" value="14,820" delta="+12% vs Mon" />
        <Stat label="Delivery rate" value="98.4%" delta="+0.3 pts" foot="last 24h" />
        <Stat label="Read rate" value="72.1%" delta="−1.8 pts" deltaDir="down" foot="last 24h" />
        <Stat label="Cost today" value={myrFmt(889.20)} foot="≈ RM 0.06/msg" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24, marginBottom: 32 }}>
        <Card title="Message volume — last 14 days"
              subtitle="Sent · read · replied"
              action={<div className="row" style={{ gap: 12, fontSize: 11 }}>
                <span className="row" style={{ gap: 4 }}><span className="dot green" /> Sent</span>
                <span className="row" style={{ gap: 4 }}><span className="dot blue" /> Read</span>
                <span className="row" style={{ gap: 4 }}><span className="dot" style={{ background: "var(--green-800)" }} /> Replied</span>
              </div>}>
          <MultiBarChart height={180}
                         series={[
                           { name: "Sent",    color: "var(--green-500)", data: SPARK_SENT },
                           { name: "Read",    color: "var(--blue-500)",  data: SPARK_READ },
                           { name: "Replied", color: "var(--green-800)", data: SPARK_REPLY },
                         ]} />
          <div className="row" style={{ justifyContent: "space-between", marginTop: 8, fontSize: 11, color: "var(--text-muted)" }}>
            <span>Oct 8</span><span>Oct 14</span><span>Today</span>
          </div>
        </Card>

        <Card title="Account health" subtitle="Meta Business · +60 19-555 0102">
          <div className="col" style={{ gap: 14 }}>
            <HealthRow label="Quality rating" tone="green" value="High" hint="No recent flags" />
            <HealthRow label="Messaging tier" value="100K / day" hint="Used 14.8% today">
              <Progress value={14.8} />
            </HealthRow>
            <HealthRow label="Phone number status" tone="green" value="Connected" hint="Verified 12 Aug 2025" />
            <HealthRow label="Display name" value="Modefair MY" hint="Approved" />
            <HealthRow label="Webhook" tone="green" value="Receiving" hint="last event 12s ago" />
          </div>
        </Card>
      </div>

      <div className="grid-2" style={{ gap: 24 }}>
        <Card title="Active campaigns"
              action={<Button variant="ghost" size="sm" onClick={() => null}>View all <IcArrowRight size={12} /></Button>}
              padding={false}>
          <div className="table-scroll">
            <table className="table">
              <thead><tr>
                <th style={{ width: "45%" }}>Name</th>
                <th>Status</th>
                <th className="num">Progress</th>
                <th className="num">Replies</th>
              </tr></thead>
              <tbody>
                {CAMPAIGNS.filter(c => ["sending", "scheduled", "paused"].includes(c.status)).map(c => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }} className="mono">{c.template}</div>
                    </td>
                    <td><StatusPill status={c.status} /></td>
                    <td className="num">
                      <div style={{ fontVariantNumeric: "tabular-nums" }}>
                        {c.delivered.toLocaleString()} / {c.audience.toLocaleString()}
                      </div>
                      <Progress value={(c.delivered / c.audience) * 100} />
                    </td>
                    <td className="num">{c.replied.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Inbox needs attention"
              subtitle={CONVERSATIONS.filter(c => c.state === "esc").length + " drafts waiting · " + CONVERSATIONS.filter(c => c.state === "new").length + " awaiting reply"}
              action={<Button variant="ghost" size="sm">Open inbox <IcArrowRight size={12} /></Button>}
              padding={false}>
          <div style={{ padding: "4px 0" }}>
            {CONVERSATIONS.filter(c => c.state !== "auto").slice(0, 5).map(c => (
              <div key={c.id} className="row" style={{ gap: 10, padding: "10px 16px", borderTop: "0.5px solid var(--border-hair)" }}>
                <Avatar name={c.name} initials={c.initials} color={c.color} size="sm" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="row" style={{ gap: 6, justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }} className="truncate">{c.name}</span>
                    <span style={{ fontSize: 11, color: "var(--text-subtle)" }}>{c.lastActivity}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }} className="truncate">{c.preview}</div>
                </div>
                <StateTag state={c.state} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="divider" />

      <Card title="Recent activity" subtitle={`${role === "admin" ? "Everyone" : "You & teammates"}`} padding={false}>
        <div style={{ padding: "4px 0" }}>
          {AUDIT.slice(0, 6).map((a, i) => (
            <div key={i} className="row" style={{ gap: 12, padding: "10px 16px", borderTop: "0.5px solid var(--border-hair)", fontSize: 13 }}>
              <span style={{ width: 64, fontSize: 11, color: "var(--text-muted)" }} className="mono">{a.at}</span>
              <Avatar name={a.actor} size="sm" color={a.actor === "system" ? "var(--gray-400)" : undefined} />
              <span style={{ fontWeight: 500 }}>{a.actor}</span>
              <span style={{ color: "var(--text-muted)" }}>{a.action}</span>
              <span style={{ flex: 1, color: "var(--text)" }} className="truncate">{a.target}</span>
              <span style={{ fontSize: 11, color: "var(--text-subtle)" }} className="mono">{a.ip}</span>
            </div>
          ))}
        </div>
      </Card>
    </Page>
  );
}

function HealthRow({ label, value, tone, hint, children }) {
  return (
    <div className="row" style={{ alignItems: "flex-start", gap: 12 }}>
      <div style={{ width: 130, fontSize: 12, color: "var(--text-muted)" }}>{label}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="row" style={{ gap: 6, marginBottom: hint ? 2 : 0 }}>
          {tone && <span className={"dot " + tone} />}
          <span style={{ fontSize: 13, fontWeight: 500 }}>{value}</span>
        </div>
        {hint && <div style={{ fontSize: 11, color: "var(--text-subtle)" }}>{hint}</div>}
        {children && <div style={{ marginTop: 6 }}>{children}</div>}
      </div>
    </div>
  );
}

Object.assign(window, { ScreenOverview });
