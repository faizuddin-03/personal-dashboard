// screens/audit.jsx — admin: audit log

function ScreenAudit({ role }) {
  if (role !== "admin") {
    return (
      <Page>
        <PageHead title="Audit log" />
        <Card>
          <Empty icon={<IcLock size={20} />} title="Admin only"
                 body="Audit logs are restricted to admin accounts." />
        </Card>
      </Page>
    );
  }
  // Build a larger log by repeating with offsets
  const fullLog = [
    ...AUDIT,
    { at: "Mon 16:42", actor: "Daniel Ng", action: "Replied in inbox", target: "Mohd Iqbal", ip: "175.140.21.7", scope: "operator" },
    { at: "Mon 14:18", actor: "Aisyah Rahman", action: "Approved template", target: "appointment_reminder", ip: "203.106.84.12", scope: "admin" },
    { at: "Mon 11:02", actor: "Hafiz Bakri", action: "Imported CSV", target: "raya_vip_list.csv · 1,820 rows", ip: "60.50.18.91", scope: "operator" },
    { at: "Sun 09:31", actor: "Mei Ling Tan", action: "Deleted segment", target: "test_segment_x", ip: "203.106.84.41", scope: "admin" },
    { at: "Sun 08:14", actor: "system", action: "Daily tier reset", target: "0 / 100,000", ip: "—", scope: "system" },
  ];

  return (
    <Page>
      <PageHead title="Audit log"
                subtitle="Immutable record of all admin & operator actions, plus system events."
                actions={
                  <>
                    <Button variant="secondary" icon={<IcDownload size={14} />}>Export CSV</Button>
                    <Button variant="secondary" icon={<IcKey size={14} />}>Verify integrity</Button>
                  </>
                } />

      <div className="card">
        <div className="toolbar">
          <FilterPill label="Actor" />
          <FilterPill label="Scope" />
          <FilterPill label="Action" />
          <FilterPill label="Date" icon={<IcCalendar size={12} />} />
          <span className="grow" />
          <div className="search" style={{ width: 280, height: 26 }}>
            <IcSearch size={13} /><input placeholder="Search by target, actor, IP…" />
          </div>
        </div>
        <div className="table-scroll">
          <table className="table">
            <colgroup>
              <col style={{ width: 130 }} />
              <col style={{ width: 150 }} />
              <col style={{ width: 90 }} />
              <col style={{ width: 200 }} />
              <col style={{ width: "auto" }} />
              <col style={{ width: 120 }} />
            </colgroup>
            <thead>
              <tr><th>Timestamp</th><th>Actor</th><th>Scope</th><th>Action</th><th>Target</th><th>IP</th></tr>
            </thead>
            <tbody>
              {fullLog.map((a, i) => (
                <tr key={i}>
                  <td className="mono muted" title={a.at + " (Asia/Kuala_Lumpur)"} style={{ fontSize: 12 }}>{a.at}</td>
                  <td>
                    <div className="row" style={{ gap: 8 }}>
                      {a.actor === "system"
                        ? <span style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--bg-hover)", color: "var(--text-muted)", display: "grid", placeItems: "center" }}><IcZap size={11} /></span>
                        : <Avatar name={a.actor} size="sm" />}
                      <span style={{ fontWeight: 500 }}>{a.actor}</span>
                    </div>
                  </td>
                  <td><Pill tone={a.scope === "admin" ? "blue" : a.scope === "system" ? "gray" : "green"}>{a.scope}</Pill></td>
                  <td>{a.action}</td>
                  <td className="truncate">{a.target}</td>
                  <td className="mono muted">{a.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="row" style={{ padding: "10px 14px", borderTop: "0.5px solid var(--border)", justifyContent: "space-between", fontSize: 12, color: "var(--text-muted)" }}>
          <span>Showing {fullLog.length} of 8,412 events · retained 90 days</span>
          <div className="row" style={{ gap: 4 }}>
            <Button variant="ghost" size="sm">Load more</Button>
          </div>
        </div>
      </div>
    </Page>
  );
}

Object.assign(window, { ScreenAudit });
