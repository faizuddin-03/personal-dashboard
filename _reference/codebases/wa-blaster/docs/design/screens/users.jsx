// screens/users.jsx — admin: users & roles

function ScreenUsers({ role, populated }) {
  if (role !== "admin") {
    return (
      <Page>
        <PageHead title="Users & roles" />
        <Card>
          <Empty icon={<IcLock size={20} />} title="Admin only"
                 body="User management is restricted to admin accounts. Switch role in the Tweaks panel to view." />
        </Card>
      </Page>
    );
  }

  return (
    <Page>
      <PageHead title="Users & roles"
                subtitle={`${TEAMMATES.length} active teammates · 2 pending invitations`}
                actions={
                  <>
                    <Button variant="secondary" icon={<IcDownload size={14} />}>Export</Button>
                    <Button variant="primary" icon={<IcPlus size={14} />}>Invite user</Button>
                  </>
                } />

      <div className="grid-3" style={{ marginBottom: 16 }}>
        <Stat label="Admins" value="2" icon={<IcShield size={13} style={{ color: "var(--text-muted)" }} />} />
        <Stat label="Operators" value="4" icon={<IcUser size={13} style={{ color: "var(--text-muted)" }} />} />
        <Stat label="Pending invites" value="2" icon={<IcMail size={13} style={{ color: "var(--text-muted)" }} />} />
      </div>

      <div className="card">
        <div className="toolbar">
          <FilterPill label="Role" />
          <FilterPill label="Status" />
          <FilterPill label="Last active" />
          <span className="grow" />
          <div className="search" style={{ width: 240, height: 26 }}>
            <IcSearch size={13} /><input placeholder="Search teammates…" />
          </div>
        </div>
        <div className="table-scroll">
          <table className="table">
            <colgroup>
              <col style={{ width: "26%" }} />
              <col style={{ width: 110 }} />
              <col style={{ width: "auto" }} />
              <col style={{ width: 130 }} />
              <col style={{ width: 100 }} />
              <col style={{ width: 32 }} />
            </colgroup>
            <thead><tr><th>Teammate</th><th>Role</th><th>Permissions</th><th>Last active</th><th>2FA</th><th></th></tr></thead>
            <tbody>
              {TEAMMATES.map((t, i) => (
                <tr key={t.id}>
                  <td>
                    <div className="row" style={{ gap: 10 }}>
                      <Avatar name={t.name} initials={t.initials} color={t.color} />
                      <div>
                        <div style={{ fontWeight: 500 }}>{t.name}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{["aisyah", "daniel", "priya", "hafiz", "meiling", "khairul"][i]}@modefair.com</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <Pill tone={t.role === "admin" ? "blue" : "gray"} icon={t.role === "admin" ? <IcShield size={10} /> : null}>
                      {t.role === "admin" ? "Admin" : "Operator"}
                    </Pill>
                  </td>
                  <td>
                    <div className="row" style={{ gap: 4, flexWrap: "wrap" }}>
                      {t.role === "admin"
                        ? ["All", "User management", "Template approval", "Audit log"].map(p => <Pill key={p} tone="gray">{p}</Pill>)
                        : ["Inbox", "Contacts", "Campaigns", "Reports"].map(p => <Pill key={p} tone="gray">{p}</Pill>)}
                    </div>
                  </td>
                  <td className="muted">{["32 min ago", "12 min ago", "2h ago", "Yesterday", "5 min ago", "3 days ago"][i]}</td>
                  <td>{i % 4 === 3 ? <Pill tone="amber" dot>off</Pill> : <Pill tone="green" dot>on</Pill>}</td>
                  <td><IconButton icon={<IcVDots size={14} />} title="Manage" size="sm" /></td>
                </tr>
              ))}
              <tr style={{ background: "var(--amber-50)" }}>
                <td>
                  <div className="row" style={{ gap: 10 }}>
                    <Avatar name="?" size="md" color="var(--gray-400)" />
                    <div>
                      <div style={{ fontWeight: 500, color: "var(--text-muted)" }}>Sara Hashim</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>sara@modefair.com</div>
                    </div>
                  </div>
                </td>
                <td><Pill tone="gray">Operator</Pill></td>
                <td className="muted">—</td>
                <td><Pill tone="amber" dot>Pending invite</Pill></td>
                <td className="muted">—</td>
                <td><IconButton icon={<IcVDots size={14} />} title="Manage" size="sm" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <Card title="Role permissions" subtitle="What admins and operators can do">
          <div className="table-scroll">
            <table className="table" style={{ border: "0.5px solid var(--border)", borderRadius: 8 }}>
              <thead><tr><th>Capability</th><th style={{ width: 100, textAlign: "center" }}>Operator</th><th style={{ width: 100, textAlign: "center" }}>Admin</th></tr></thead>
              <tbody>
                {[
                  ["View inbox & reply", true, true],
                  ["Send campaigns from approved templates", true, true],
                  ["Manage contacts & segments", true, true],
                  ["View reports", true, true],
                  ["Submit new templates for approval", false, true],
                  ["Approve / reject templates", false, true],
                  ["Edit chatbot knowledge base", false, true],
                  ["Manage users & roles", false, true],
                  ["View audit log", false, true],
                  ["Delete contacts (GDPR)", false, true],
                  ["Change billing & WhatsApp number", false, true],
                ].map(([cap, op, ad]) => (
                  <tr key={cap}>
                    <td>{cap}</td>
                    <td style={{ textAlign: "center" }}>{op ? <IcCheck size={14} style={{ color: "var(--green-500)" }} /> : <span className="muted">—</span>}</td>
                    <td style={{ textAlign: "center" }}>{ad ? <IcCheck size={14} style={{ color: "var(--green-500)" }} /> : <span className="muted">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </Page>
  );
}

Object.assign(window, { ScreenUsers });
