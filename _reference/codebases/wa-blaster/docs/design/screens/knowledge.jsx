// screens/knowledge.jsx — chatbot knowledge base (admin)

function ScreenKnowledge({ role }) {
  const [active, setActive] = useState(KB_DOCS[0].id);
  const sel = KB_DOCS.find(d => d.id === active) || KB_DOCS[0];

  if (role !== "admin") {
    return (
      <Page>
        <PageHead title="Chatbot knowledge" />
        <Card>
          <Empty icon={<IcLock size={20} />} title="Admin only"
                 body="Editing the chatbot knowledge base is restricted to admin accounts. Switch role in Tweaks to preview." />
        </Card>
      </Page>
    );
  }

  return (
    <Page>
      <PageHead title="Chatbot knowledge"
                subtitle={`${KB_DOCS.length} documents · ${KB_DOCS.reduce((s, d) => s + d.embeds, 0).toLocaleString()} embeddings indexed`}
                actions={
                  <>
                    <Button variant="secondary" icon={<IcUpload size={14} />}>Upload file</Button>
                    <Button variant="primary" icon={<IcPlus size={14} />}>New document</Button>
                  </>
                } />

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16 }}>
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: 12, borderBottom: "0.5px solid var(--border)" }}>
            <div className="search" style={{ height: 28 }}>
              <IcSearch size={13} /><input placeholder="Search docs…" />
            </div>
          </div>
          <div className="col" style={{ gap: 0 }}>
            {KB_DOCS.map(d => (
              <button key={d.id} onClick={() => setActive(d.id)}
                      style={{
                        textAlign: "left", padding: "10px 14px", border: 0, background: active === d.id ? "var(--green-50)" : "transparent",
                        borderLeft: active === d.id ? "2px solid var(--green-500)" : "2px solid transparent",
                        cursor: "pointer", fontFamily: "inherit",
                      }}>
                <div className="row" style={{ gap: 6 }}>
                  <IcFile size={13} style={{ color: "var(--text-muted)" }} />
                  <span className="mono" style={{ fontSize: 12, fontWeight: 500, flex: 1 }}>{d.title}</span>
                  {d.status === "draft" && <TagUpper tone="amber">DRAFT</TagUpper>}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, paddingLeft: 19 }}>
                  {d.category} · {d.words.toLocaleString()} words · {d.embeds} embeds
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title mono" style={{ fontSize: 14 }}>{sel.title}</div>
              <div className="card-subtitle">{sel.category} · updated {sel.updated} · by {sel.author}</div>
            </div>
            <div className="row" style={{ gap: 6 }}>
              {sel.status === "draft" ? <TagUpper tone="amber">DRAFT</TagUpper> : <Pill tone="green" dot>live</Pill>}
              <IconButton icon={<IcRefresh size={14} />} title="Re-index" size="sm" />
              <IconButton icon={<IcCopy size={14} />} title="Copy markdown" size="sm" />
              <IconButton icon={<IcTrash size={14} />} title="Delete" size="sm" />
            </div>
          </div>

          <div style={{ padding: 16 }}>
            <div className="h3" style={{ marginBottom: 8 }}>Content</div>
            <div style={{
              background: "var(--bg-sunken)", border: "0.5px solid var(--border)",
              borderRadius: 8, padding: 16, fontSize: 13, lineHeight: 1.6,
              fontFamily: "var(--mono)", whiteSpace: "pre-wrap",
              minHeight: 200,
            }}>
{`# Shipping table — Klang Valley

| Zone        | Speed    | Fee      | ETA          |
|-------------|----------|----------|--------------|
| KL Sentral  | Same-day | RM 8     | < 4 hours    |
| Cheras      | Express  | RM 12    | 1–2 hours    |
| Petaling Jaya | Standard | RM 6   | next day     |
| Shah Alam   | Standard | RM 6     | next day     |

## Rules

- Free shipping for orders > RM 150.
- Express delivery available Mon–Sat 10:00–20:00.
- Cash on delivery (COD) supported for amounts < RM 500.

## Public holidays

No deliveries on Hari Raya Aidilfitri (day 1 & 2),
Hari Kebangsaan, Deepavali, and Christmas day.`}
            </div>

            <div className="grid-3" style={{ marginTop: 16 }}>
              <Stat label="Embeddings" value={sel.embeds.toString()} foot="text-embedding-3-small" />
              <Stat label="Citations / day" value="84" foot="last 7d avg" />
              <Stat label="Drafts grounded" value="92%" foot="of bot replies citing this doc" />
            </div>

            <div className="h3" style={{ marginTop: 16, marginBottom: 8 }}>Recent uses</div>
            <div className="col" style={{ gap: 0 }}>
              {[
                { who: "Mohd Iqbal", ts: "9 min ago",  intent: "shipping_quote",     conf: 84 },
                { who: "Lim Wei Jie", ts: "23 min ago", intent: "delivery_time",     conf: 91 },
                { who: "Raj Kumar",  ts: "1h ago",     intent: "express_shipping",   conf: 76 },
                { who: "Farah Khairudin", ts: "2h ago", intent: "shipping_quote",    conf: 88 },
              ].map((u, i) => (
                <div key={i} className="row" style={{ gap: 10, padding: "8px 0", borderTop: "0.5px solid var(--border-hair)", fontSize: 13 }}>
                  <Avatar name={u.who} size="sm" />
                  <span style={{ fontWeight: 500, width: 160 }}>{u.who}</span>
                  <code style={{ flex: 1 }}>{u.intent}</code>
                  <span style={{ width: 60, textAlign: "right", fontSize: 12, color: "var(--text-muted)" }}>{u.conf}% conf</span>
                  <span style={{ width: 80, textAlign: "right", fontSize: 11, color: "var(--text-subtle)" }}>{u.ts}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}

Object.assign(window, { ScreenKnowledge });
