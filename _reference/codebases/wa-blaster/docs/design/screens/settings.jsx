// screens/settings.jsx — workspace settings + WhatsApp number config

function ScreenSettings({ role }) {
  const [sub, setSub] = useState("general");

  const tabs = [
    { value: "general",  label: "General" },
    { value: "number",   label: "WhatsApp number" },
    { value: "billing",  label: "Billing & tier" },
    { value: "integrations", label: "Integrations" },
    { value: "compliance", label: "Compliance & PDPA" },
    { value: "developers", label: "Developers" },
  ];

  return (
    <Page>
      <PageHead title="Settings"
                subtitle="Workspace configuration. Some sections are admin-only."
                actions={role === "admin" && <Button variant="primary" icon={<IcCheck size={14} />}>Save changes</Button>} />

      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 16 }}>
        <nav className="col" style={{ gap: 2 }}>
          {tabs.map(t => (
            <button key={t.value} onClick={() => setSub(t.value)}
                    style={{
                      padding: "8px 12px", textAlign: "left", border: 0,
                      background: sub === t.value ? "var(--bg-hover)" : "transparent",
                      color: sub === t.value ? "var(--text)" : "var(--text-muted)",
                      borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                      fontWeight: sub === t.value ? 500 : 400,
                    }}>{t.label}</button>
          ))}
        </nav>

        <div className="col" style={{ gap: 16 }}>
          {sub === "general" && (
            <>
              <Card title="Workspace">
                <Field label="Name" hint="Shown in the sidebar and on outgoing messages.">
                  <input className="input" defaultValue="Modefair MY" />
                </Field>
                <Field label="Time zone">
                  <select className="select"><option>Asia/Kuala_Lumpur (GMT+8)</option><option>Asia/Singapore</option><option>UTC</option></select>
                </Field>
                <Field label="Default language">
                  <select className="select"><option>Bahasa Malaysia</option><option>English</option></select>
                </Field>
              </Card>
              <Card title="Appearance">
                <Row label="Theme" hint="Light, dark, or follow system."><Pill tone="gray">Use the toolbar toggle</Pill></Row>
                <Row label="Sidebar density" hint="Compact reduces row height to 28px."><Switch on={false} /></Row>
              </Card>
            </>
          )}

          {sub === "number" && (
            <>
              <Card title="WhatsApp Business number"
                    action={role !== "admin" ? <AdminLockHint>Admin only to edit</AdminLockHint> : null}>
                <div className="row" style={{ gap: 16, marginBottom: 14 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 12, background: "var(--green-500)", color: "#fff", display: "grid", placeItems: "center" }}>
                    <IcPhone size={22} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="row" style={{ gap: 8 }}>
                      <div style={{ fontSize: 16, fontWeight: 500 }}>+60 19-555 0102</div>
                      <Pill tone="green" dot>Connected</Pill>
                      <Pill tone="green">Verified business</Pill>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Modefair MY · WABA ID 102937481209</div>
                  </div>
                  <Button variant="secondary" size="sm" locked={role !== "admin"}>Disconnect</Button>
                </div>
                <div className="divider" />
                <Field label="Display name">
                  <input className="input" defaultValue="Modefair MY" disabled={role !== "admin"} />
                </Field>
                <Field label="About">
                  <input className="input" defaultValue="Online fashion · Free shipping over RM150" disabled={role !== "admin"} />
                </Field>
                <Field label="Profile photo">
                  <div className="row" style={{ gap: 12 }}>
                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--green-500)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 500 }}>MF</div>
                    <Button variant="secondary" size="sm" icon={<IcUpload size={13} />} locked={role !== "admin"}>Upload</Button>
                  </div>
                </Field>
              </Card>

              <Card title="Quality & tier">
                <HealthRow label="Messaging tier" value="100K / day" tone="green" hint="Eligible for tier upgrade in 18 days at current quality" />
                <HealthRow label="Quality rating" value="High" tone="green" hint="No recent flags. Down-rating happens after 7d of low-quality signals." />
                <HealthRow label="Phone number rating" value="Green" tone="green" />
              </Card>
            </>
          )}

          {sub === "billing" && (
            <>
              <Card title="Plan">
                <div className="row" style={{ gap: 16, marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>Business · Pro</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Billed monthly · next invoice 1 Nov</div>
                  </div>
                  <Button variant="secondary" size="sm" locked={role !== "admin"}>Manage plan</Button>
                </div>
                <div className="grid-3">
                  <Stat label="Sent this month" value="84,210" foot="of 100,000 included" />
                  <Stat label="Subscription" value={myrFmt(599.00)} foot="per month" />
                  <Stat label="Overage so far" value={myrFmt(0.00)} foot="at RM 0.06 / msg" />
                </div>
              </Card>
              <Card title="Payment method">
                <div className="row" style={{ gap: 12 }}>
                  <div style={{ width: 40, height: 28, borderRadius: 4, background: "var(--bg-hover)", display: "grid", placeItems: "center", fontWeight: 500 }}>VISA</div>
                  <div style={{ flex: 1 }}>
                    <div className="mono" style={{ fontSize: 13 }}>•••• •••• •••• 4421</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Expires 11/2027 · Mei Ling Tan</div>
                  </div>
                  <Button variant="secondary" size="sm" locked={role !== "admin"}>Update</Button>
                </div>
              </Card>
            </>
          )}

          {sub === "integrations" && (
            <Card title="Connected services">
              {[
                { name: "Shopify", desc: "Sync orders, customers, and shipping events", on: true, icon: "S", color: "#95BF47" },
                { name: "Stripe",  desc: "Payment and refund webhooks",                on: true, icon: "S", color: "#635BFF" },
                { name: "Zapier",  desc: "Trigger campaigns from external apps",       on: false, icon: "Z", color: "#FF4A00" },
                { name: "Google Sheets", desc: "Push reports to Sheets daily",         on: false, icon: "G", color: "#34A853" },
              ].map(i => (
                <div key={i.name} className="row" style={{ gap: 12, padding: "12px 0", borderTop: "0.5px solid var(--border-hair)" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: i.color, color: "#fff", display: "grid", placeItems: "center", fontWeight: 500 }}>{i.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>{i.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{i.desc}</div>
                  </div>
                  {i.on
                    ? <><Pill tone="green" dot>Connected</Pill><Button variant="ghost" size="sm">Configure</Button></>
                    : <Button variant="secondary" size="sm" locked={role !== "admin"}>Connect</Button>}
                </div>
              ))}
            </Card>
          )}

          {sub === "compliance" && (
            <>
              <Card title="Opt-in & opt-out">
                <Field label="Opt-out keywords" hint="Comma-separated. Replies containing any of these auto-unsubscribe the contact.">
                  <input className="input" defaultValue="STOP, BERHENTI, UNSUBSCRIBE, OPT OUT" />
                </Field>
                <Field label="Auto-reply on opt-out">
                  <textarea className="textarea" defaultValue="Anda telah dikeluarkan dari senarai mesej kami. Reply START untuk join semula." />
                </Field>
              </Card>
              <Card title="Data retention (PDPA)">
                <Row label="Conversation history" hint="Auto-delete messages older than X."><span>180 days</span></Row>
                <Row label="Contact data export"><Button variant="secondary" size="sm" icon={<IcDownload size={13} />}>Request export</Button></Row>
                <Row label="Delete contact (right to be forgotten)"><Button variant="secondary" size="sm" icon={<IcTrash size={13} />} locked={role !== "admin"}>Find & delete contact</Button></Row>
              </Card>
            </>
          )}

          {sub === "developers" && (
            <>
              <Card title="Webhook" subtitle="POST every inbound message + status update">
                <Field label="URL"><input className="input mono" defaultValue="https://api.modefair.com/wa/inbound" disabled={role !== "admin"} /></Field>
                <Field label="Signing secret">
                  <div className="row" style={{ gap: 6 }}>
                    <input className="input mono" defaultValue="whsec_•••••••••••• 4f0a" readOnly />
                    <Button variant="secondary" size="sm" icon={<IcCopy size={13} />}>Copy</Button>
                    <Button variant="secondary" size="sm" locked={role !== "admin"}>Rotate</Button>
                  </div>
                </Field>
                <Field label="Last delivery" hint="200 OK · 12s ago"><span /></Field>
              </Card>
              <Card title="API keys">
                <div className="row" style={{ gap: 8, padding: "10px 0", borderTop: "0.5px solid var(--border-hair)" }}>
                  <IcKey size={14} style={{ color: "var(--text-muted)" }} />
                  <div style={{ flex: 1 }}>
                    <div className="mono" style={{ fontSize: 13 }}>pk_live_•••• 2810</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Created Aug 12 by Aisyah · Last used 12s ago</div>
                  </div>
                  <Button variant="ghost" size="sm" icon={<IcCopy size={13} />} title="Copy" />
                  <Button variant="ghost" size="sm" icon={<IcTrash size={13} />} locked={role !== "admin"} />
                </div>
                <Button variant="secondary" size="sm" icon={<IcPlus size={13} />} style={{ marginTop: 12 }} locked={role !== "admin"}>New API key</Button>
              </Card>
            </>
          )}
        </div>
      </div>
    </Page>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="field" style={{ marginBottom: 12 }}>
      <label className="field-label">{label}</label>
      {children}
      {hint && <div className="field-hint">{hint}</div>}
    </div>
  );
}

function Row({ label, hint, children }) {
  return (
    <div className="row" style={{ alignItems: "flex-start", padding: "10px 0", borderTop: "0.5px solid var(--border-hair)", gap: 12 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
        {hint && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{hint}</div>}
      </div>
      {children}
    </div>
  );
}

Object.assign(window, { ScreenSettings });
