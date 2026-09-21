// screens/segments.jsx — saved groups of contacts (rule-based)

function ScreenSegments({ role, populated, onNew }) {
  const [active, setActive] = useState(SEGMENTS[1].id);

  if (!populated) {
    return (
      <Page>
        <PageHead title="Segments" subtitle="Saved rule-based groups of contacts."
                  actions={<Button variant="primary" icon={<IcPlus size={14} />} onClick={onNew}>New segment</Button>} />
        <Card>
          <Empty icon={<IcFilter size={20} />} title="Create your first segment"
                 body="Group contacts by tag, opt-in status, or activity. Default segments will appear automatically once contacts are loaded." />
        </Card>
      </Page>
    );
  }

  const sel = SEGMENTS.find(s => s.id === active) || SEGMENTS[0];

  return (
    <Page>
      <PageHead title="Segments"
                subtitle="Rule-based groups, updated live or on schedule."
                actions={<Button variant="primary" icon={<IcPlus size={14} />} onClick={onNew}>New segment</Button>} />

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 400px", gap: 16 }}>
        <div className="card" style={{ padding: 0 }}>
          <div className="table-scroll">
            <table className="table">
              <colgroup>
                <col style={{ width: "30%" }} />
                <col />
                <col style={{ width: 90 }} />
                <col style={{ width: 110 }} />
                <col style={{ width: 130 }} />
                <col style={{ width: 32 }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Rule</th>
                  <th className="num">Size</th>
                  <th>Refresh</th>
                  <th>Owner</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {SEGMENTS.map(s => (
                  <tr key={s.id} onClick={() => setActive(s.id)} data-selected={active === s.id} style={{ cursor: "pointer" }}>
                    <td>
                      <div className="row" style={{ gap: 8 }}>
                        <IcFilter size={13} style={{ color: "var(--text-muted)" }} />
                        <span style={{ fontWeight: 500 }}>{s.name}</span>
                      </div>
                    </td>
                    <td><code style={{ fontSize: 11 }}>{s.rule}</code></td>
                    <td className="num" style={{ fontVariantNumeric: "tabular-nums" }}>{s.size.toLocaleString()}</td>
                    <td>{s.updated === "live" ? <Pill tone="green" dot>live</Pill> : <span className="muted">{s.updated}</span>}</td>
                    <td className="muted">{s.owner === "system" ? <span className="row" style={{ gap: 4 }}><IcZap size={11} /> system</span> : s.owner}</td>
                    <td><IconButton icon={<IcVDots size={14} />} title="Actions" size="sm" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-head" style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div>
                <div className="card-title">{sel.name}</div>
                <div className="card-subtitle">{sel.size.toLocaleString()} contacts · owned by {sel.owner}</div>
              </div>
              <IconButton icon={<IcEdit3 size={14} />} title="Edit segment" locked={role !== "admin" && sel.owner === "system"} />
            </div>
          </div>
          <div style={{ padding: 16 }}>
            <div className="h3" style={{ marginBottom: 8 }}>Rule</div>
            <div style={{ padding: 12, background: "var(--bg-sunken)", border: "0.5px solid var(--border)", borderRadius: 8, fontFamily: "var(--mono)", fontSize: 12, lineHeight: 1.6 }}>
              {sel.rule}
            </div>

            <div className="h3" style={{ marginTop: 16, marginBottom: 8 }}>Growth — 14 days</div>
            <Sparkline data={[750, 780, 800, 820, 810, 825, 840, 838, 836, 840, 841, 842, 842, 842]} height={48} />

            <div className="h3" style={{ marginTop: 16, marginBottom: 8 }}>Sample contacts</div>
            <div className="col" style={{ gap: 0 }}>
              {CONTACTS.filter(c => c.tags.includes("VIP")).slice(0, 5).map(c => (
                <div key={c.id} className="row" style={{ gap: 8, padding: "8px 0", borderTop: "0.5px solid var(--border-hair)", fontSize: 13 }}>
                  <Avatar name={c.name} size="sm" />
                  <span style={{ flex: 1, fontWeight: 500 }}>{c.name}</span>
                  <span className="mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>{c.phone}</span>
                </div>
              ))}
            </div>
            <Button variant="ghost" size="sm" style={{ marginTop: 8 }}>View all {sel.size.toLocaleString()} →</Button>
          </div>
        </div>
      </div>
    </Page>
  );
}

Object.assign(window, { ScreenSegments });
