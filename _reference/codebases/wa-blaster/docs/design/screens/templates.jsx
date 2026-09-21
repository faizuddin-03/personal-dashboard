// screens/templates.jsx — Meta-approved template library + approval queue + detail.

function ScreenTemplates({ role, populated }) {
  const [tab, setTab] = useState("all");
  const [active, setActive] = useState(TEMPLATES[0].id);

  if (!populated) {
    return (
      <Page>
        <PageHead title="Templates" subtitle="Reusable, Meta-approved message bodies."
                  actions={<Button variant="primary" icon={<IcPlus size={14} />}>New template</Button>} />
        <Card>
          <Empty icon={<IcFile size={20} />} title="Submit your first template"
                 body="Templates are pre-written message bodies. Meta reviews them within ~24 hours. Approved templates can start conversations outside the 24-hour customer service window."
                 cta={<Button variant="primary" icon={<IcPlus size={14} />}>New template</Button>} />
        </Card>
      </Page>
    );
  }

  const tabs = [
    { value: "all",      label: "All",        count: TEMPLATES.length },
    { value: "approved", label: "Approved",   count: TEMPLATES.filter(t => t.status === "approved").length },
    { value: "pending",  label: "In review",  count: TEMPLATES.filter(t => t.status === "pending").length },
    { value: "rejected", label: "Rejected",   count: TEMPLATES.filter(t => t.status === "rejected").length },
  ];
  const rows = TEMPLATES.filter(t => tab === "all" || t.status === tab);
  const sel = TEMPLATES.find(t => t.id === active) || TEMPLATES[0];

  return (
    <Page>
      <PageHead title="Templates"
                subtitle="Reusable message bodies · Meta reviews new templates within ~24h."
                actions={
                  <>
                    <Button variant="secondary" icon={<IcRefresh size={14} />}>Sync with Meta</Button>
                    <Button variant="primary" icon={<IcPlus size={14} />}>New template</Button>
                  </>
                } />

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 420px", gap: 16 }}>
        <div className="card">
          <Tabs value={tab} onChange={setTab} tabs={tabs} />
          <div className="toolbar">
            <FilterPill label="Category" />
            <FilterPill label="Language" />
            <FilterPill label="Author" />
            <span className="grow" />
            <div className="search" style={{ width: 240, height: 26 }}>
              <IcSearch size={13} />
              <input placeholder="Search templates…" />
            </div>
          </div>
          <div className="table-scroll">
            <table className="table">
              <colgroup>
                <col style={{ width: "30%" }} />
                <col style={{ width: 100 }} />
                <col style={{ width: 70 }} />
                <col style={{ width: 110 }} />
                <col style={{ width: "auto" }} />
                <col style={{ width: 90 }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Lang</th>
                  <th>Status</th>
                  <th>Last edited</th>
                  <th className="num">Sent 7d</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(t => (
                  <tr key={t.id} onClick={() => setActive(t.id)} data-selected={active === t.id} style={{ cursor: "pointer" }}>
                    <td>
                      <div className="mono" style={{ fontSize: 12, fontWeight: 500 }}>{t.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>by {t.author} · {t.vars} variables</div>
                    </td>
                    <td><Pill tone={t.category === "Marketing" ? "blue" : t.category === "Authentication" ? "amber" : "gray"}>{t.category}</Pill></td>
                    <td><span className="tag-upper">{t.language === "ms_MY" ? "MS" : "EN"}</span></td>
                    <td><StatusPill status={t.status} /></td>
                    <td className="muted"><RelTime value={t.lastEdited} exact={`Edited ${t.lastEdited} by ${t.author}`} /></td>
                    <td className="num">{t.sent7d > 0 ? t.sent7d.toLocaleString() : <span className="muted">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <TemplateDetail tmpl={sel} role={role} />
      </div>

      {tab === "pending" && role === "admin" && (
        <div style={{ marginTop: 16 }}>
          <Card title="Pending Meta approval" subtitle="Submitted templates awaiting Meta's automated and manual review.">
            <div className="col" style={{ gap: 12 }}>
              <div className="row" style={{ gap: 12, padding: 12, background: "var(--amber-50)", borderRadius: 8, color: "#B45309", fontSize: 12 }}>
                <IcClock size={14} />
                <span>Average approval time over last 30 days: <b>4h 12m</b>. Marketing templates take longer than Utility.</span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </Page>
  );
}

// ── Template detail (right panel) ──────────────────────────────────────────
function TemplateDetail({ tmpl, role }) {
  if (!tmpl) return null;
  const sampleBody = {
    raya_promo_2025: "Selamat Hari Raya Aidilfitri, {{1}}! 🌙\n\nAkses awal koleksi raya untuk VIP — diskaun sehingga {{2}}% sampai 30 April. Tekan butang di bawah untuk membeli-belah.",
    order_confirmation_v3: "Hai {{1}}, terima kasih atas pesanan #{{2}}. Jumlah RM {{3}}. Anggaran sampai dalam 3–5 hari bekerja.",
    delivery_otw: "Pesanan #{{1}} anda sedang dalam perjalanan. Track: {{2}}",
    appointment_reminder: "Hi {{1}}, this is a reminder for your appointment on {{2}} at {{3}}.",
    vip_birthday_voucher: "Hi {{1}}, happy birthday from {{2}}! 🎂 Use code {{3}} for {{4}}% off your next order.",
    feedback_survey: "Hi, mind sharing how we did? Tap below to rate. {{1}}",
    winback_60day: "Kami rindu anda, {{1}}! Kembali dan dapatkan {{2}}% off dengan kod {{3}}.",
    merdeka_flash_sale: "Merdeka! {{1}}% off semua barangan selama 31 jam sahaja. Mula sekarang ke {{2}}.",
    kyc_verification: "Your verification code is {{1}}. Do not share this code.",
  };
  const body = sampleBody[tmpl.name] || "Body content here.";

  return (
    <div className="card">
      <div className="card-head" style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div style={{ minWidth: 0 }}>
            <div className="card-title mono" style={{ fontSize: 13 }}>{tmpl.name}</div>
            <div className="card-subtitle">v3 · by {tmpl.author} · {tmpl.lastEdited}</div>
          </div>
          <div className="row" style={{ gap: 6 }}>
            <IconButton icon={<IcCopy size={14} />} title="Duplicate" size="sm" />
            <IconButton icon={<IcEdit3 size={14} />} title="Edit" size="sm" locked={role !== "admin"} />
            <IconButton icon={<IcVDots size={14} />} title="More" size="sm" />
          </div>
        </div>
        <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
          <StatusPill status={tmpl.status} />
          <Pill tone={tmpl.category === "Marketing" ? "blue" : tmpl.category === "Authentication" ? "amber" : "gray"}>{tmpl.category}</Pill>
          <Pill tone="gray">{tmpl.language === "ms_MY" ? "Bahasa Malaysia" : "English"}</Pill>
          <Pill tone="gray">{tmpl.vars} variables</Pill>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {tmpl.status === "rejected" && (
          <div style={{ padding: 12, background: "var(--red-50)", border: "0.5px solid rgba(239, 68, 68, 0.22)", borderRadius: 8, color: "#B91C1C", fontSize: 12, marginBottom: 12 }}>
            <IcAlert size={13} style={{ verticalAlign: "-2px", marginRight: 6 }} />
            <b>Rejected by Meta:</b> Promotional content not allowed in Utility category. Re-submit as <code>Marketing</code> category.
          </div>
        )}
        {tmpl.status === "pending" && (
          <div style={{ padding: 12, background: "var(--amber-50)", border: "0.5px solid rgba(245, 158, 11, 0.22)", borderRadius: 8, color: "#B45309", fontSize: 12, marginBottom: 12 }}>
            <IcClock size={13} style={{ verticalAlign: "-2px", marginRight: 6 }} />
            <b>Awaiting Meta review</b> · submitted 12 minutes ago. Typical wait 4–24 hours.
          </div>
        )}

        <div className="h3" style={{ marginBottom: 8 }}>Body</div>
        <div style={{
          background: "var(--bg-sunken)", border: "0.5px solid var(--border)",
          borderRadius: 8, padding: 12, fontSize: 13, whiteSpace: "pre-wrap", lineHeight: 1.5,
        }}>
          {body.split(/(\{\{\d+\}\})/g).map((part, i) =>
            /\{\{\d+\}\}/.test(part)
              ? <code key={i}>{part}</code>
              : <React.Fragment key={i}>{part}</React.Fragment>
          )}
        </div>

        <div className="h3" style={{ marginTop: 16, marginBottom: 8 }}>Variables</div>
        <div className="table-scroll">
          <table className="table" style={{ border: "0.5px solid var(--border)", borderRadius: 8 }}>
            <thead>
              <tr><th style={{ width: 60 }}>#</th><th>Sample value</th><th>Source</th></tr>
            </thead>
            <tbody>
              {Array.from({ length: tmpl.vars }).map((_, i) => (
                <tr key={i}>
                  <td><code>{`{{${i + 1}}}`}</code></td>
                  <td>{["Nurul", "30", "April 30", "AISYAH15"][i] || "—"}</td>
                  <td className="muted">{["contact.first_name", "promo.discount", "promo.end_date", "voucher.code"][i] || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="h3" style={{ marginTop: 16, marginBottom: 8 }}>Preview</div>
        <div style={{ background: "var(--bg-sunken)", border: "0.5px solid var(--border)", borderRadius: 8, padding: 12 }}>
          <div className="msg in" style={{ alignSelf: "flex-start", maxWidth: "100%", whiteSpace: "pre-wrap" }}>
            {body.replace(/\{\{1\}\}/g, "Nurul").replace(/\{\{2\}\}/g, "30").replace(/\{\{3\}\}/g, "April 30").replace(/\{\{4\}\}/g, "15")}
            <span className="msg-time">09:00</span>
          </div>
        </div>

        <div className="h3" style={{ marginTop: 16, marginBottom: 8 }}>Usage — last 7 days</div>
        <div className="row" style={{ gap: 12 }}>
          <Stat label="Sent"     value={tmpl.sent7d.toLocaleString()} />
          <Stat label="Delivery" value="98.2%" />
          <Stat label="Read"     value="71.4%" />
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenTemplates });
