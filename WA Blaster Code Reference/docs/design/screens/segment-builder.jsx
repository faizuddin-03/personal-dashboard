// screens/segment-builder.jsx — segment builder (Tag / Manual / Rule / AI copilot)

function ScreenSegmentBuilder({ role, onClose }) {
  const [type, setType] = useState("tag");
  const [name, setName] = useState("Raya VIP — imported");
  const [desc, setDesc] = useState("Contacts tagged from the 21 Oct CSV import");
  const [chosenTags, setChosenTags] = useState(["imported_2025_10_21"]);
  const [op, setOp] = useState("any");
  const [aiPrompt, setAiPrompt] = useState("VIP customers in Klang Valley who haven't ordered in 30 days but were active on WhatsApp last week");
  const [aiGenerated, setAiGenerated] = useState(false);
  const [pushToast, toastNode] = useToast();

  // Live count varies by selection
  const liveCount = type === "tag"
    ? (chosenTags.length === 0 ? 0 : op === "any" ? 1820 : 1142)
    : type === "manual" ? 12
    : type === "rule" ? 247
    : aiGenerated ? 84 : 0;

  const tabs = [
    { value: "tag",    label: "Tag-based" },
    { value: "manual", label: "Manual" },
    { value: "rule",   label: "Rule-based" },
    { value: "ai",     label: "AI copilot",  count: role === "admin" ? null : 0 },
  ];

  return (
    <Page>
      <div className="row" style={{ marginBottom: 16, gap: 12 }}>
        <Button variant="ghost" size="sm" icon={<IcChevL size={13} />} onClick={onClose}>Back to segments</Button>
        <div style={{ flex: 1 }}>
          <h1 className="page-title">New segment</h1>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Pick a type, define the rule, and we'll keep the contact list in sync.</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 320px", gap: 16 }}>
        <div className="col" style={{ gap: 16 }}>
          <Card title="Basics">
            <div className="field" style={{ marginBottom: 12 }}>
              <label className="field-label">Name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="field">
              <label className="field-label">Description <span style={{ color: "var(--text-muted)", fontWeight: 400, fontSize: 12 }}>(optional)</span></label>
              <input className="input" value={desc} onChange={(e) => setDesc(e.target.value)} />
            </div>
          </Card>

          <div className="card">
            <Tabs value={type} onChange={setType} tabs={tabs} />

            {type === "tag" && (
              <div style={{ padding: 16 }}>
                <Field label="Match" hint="ANY = union of tags. ALL = intersection.">
                  <div className="row" style={{ gap: 0, border: "0.5px solid var(--border-strong)", borderRadius: 8, overflow: "hidden", width: "fit-content" }}>
                    {[["any", "ANY of these tags"], ["all", "ALL of these tags"]].map(([v, l]) => (
                      <button key={v} onClick={() => setOp(v)}
                              style={{
                                height: 32, padding: "0 14px", border: 0, background: op === v ? "var(--bg-hover)" : "var(--bg)",
                                color: op === v ? "var(--text)" : "var(--text-muted)", fontWeight: op === v ? 500 : 400,
                                fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                                borderRight: v === "any" ? "0.5px solid var(--border)" : 0,
                              }}>{l}</button>
                    ))}
                  </div>
                </Field>
                <Field label="Tags">
                  <div className="row" style={{ flexWrap: "wrap", gap: 6, padding: 8, border: "0.5px solid var(--border-strong)", borderRadius: 8, minHeight: 38, background: "var(--bg)" }}>
                    {chosenTags.map((tag) => (
                      <span key={tag} className="row" style={{ gap: 4, padding: "2px 4px 2px 8px", background: "var(--green-100)", color: "var(--green-800)", fontSize: 12, borderRadius: 6 }}>
                        {tag}
                        <button onClick={() => setChosenTags(chosenTags.filter(t => t !== tag))}
                                style={{ border: 0, background: "transparent", color: "inherit", cursor: "pointer", padding: 0, display: "inline-flex" }}>
                          <IcX size={11} />
                        </button>
                      </span>
                    ))}
                    <input placeholder="Add tag…"
                           onKeyDown={(e) => {
                             if (e.key === "Enter" && e.currentTarget.value.trim()) {
                               setChosenTags([...chosenTags, e.currentTarget.value.trim()]);
                               e.currentTarget.value = "";
                             }
                           }}
                           style={{ border: 0, outline: "none", background: "transparent", fontSize: 13, flex: 1, minWidth: 100 }} />
                  </div>
                  <div className="field-hint">Type a tag and press <span className="kbd">↵</span>. Existing tags: <code>VIP</code>, <code>foodie</code>, <code>KL</code>, <code>Penang</code>, <code>lapsed</code>, <code>new</code>.</div>
                </Field>
              </div>
            )}

            {type === "manual" && (
              <div style={{ padding: 16 }}>
                <Field label="Pick contacts">
                  <div className="search" style={{ width: "100%", height: 34 }}>
                    <IcSearch size={14} />
                    <input placeholder="Search name or phone…" />
                  </div>
                </Field>
                <div className="field-label" style={{ marginTop: 12, marginBottom: 6 }}>Selected (12)</div>
                <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>
                  {CONTACTS.slice(0, 12).map((c) => (
                    <span key={c.id} className="row" style={{ gap: 6, padding: "4px 6px 4px 4px", background: "var(--bg-subtle)", border: "0.5px solid var(--border)", borderRadius: 6, fontSize: 12 }}>
                      <Avatar name={c.name} size="sm" />
                      {c.name}
                      <button style={{ border: 0, background: "transparent", color: "var(--text-muted)", cursor: "pointer", padding: 0, display: "inline-flex" }}><IcX size={11} /></button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {type === "rule" && (
              <div style={{ padding: 16 }}>
                <RuleBuilder />
              </div>
            )}

            {type === "ai" && (
              <div style={{ padding: 16 }}>
                {role !== "admin" && (
                  <div style={{ padding: 12, background: "var(--amber-50)", borderRadius: 8, color: "#B45309", fontSize: 12, marginBottom: 16 }}>
                    <IcLock size={13} style={{ verticalAlign: "-2px", marginRight: 6 }} />
                    AI copilot is restricted to admin accounts on first release.
                  </div>
                )}
                <Field label="Describe the segment in plain English">
                  <textarea className="textarea" rows="3" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)}
                            disabled={role !== "admin"} />
                  <div className="field-hint">Example: "Customers in Penang who replied to the Merdeka campaign but never ordered."</div>
                </Field>
                <Button variant="primary" size="sm" icon={<IcSparkle size={13} />}
                        onClick={() => setAiGenerated(true)} disabled={role !== "admin"}>
                  Generate rules →
                </Button>
                {aiGenerated && (
                  <>
                    <div style={{ padding: 12, background: "var(--green-50)", border: "0.5px solid var(--green-200)", borderRadius: 8, color: "var(--green-800)", fontSize: 12, marginTop: 16 }}>
                      <IcSparkle size={13} style={{ verticalAlign: "-2px", marginRight: 6 }} />
                      AI-generated. Review before saving.
                      <span className="spacer" />
                      <button style={{ float: "right", border: 0, background: "transparent", color: "inherit", cursor: "pointer", fontSize: 12, marginLeft: 8 }}>Regenerate</button>
                    </div>
                    <div style={{ marginTop: 16 }}>
                      <RuleBuilder />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="row" style={{ justifyContent: "space-between", padding: "12px 16px", background: "var(--bg)", border: "0.5px solid var(--border)", borderRadius: 12, position: "sticky", bottom: 0 }}>
            <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <div className="row" style={{ gap: 8 }}>
              <Button variant="secondary" size="sm" onClick={() => { pushToast("Segment saved · " + name); setTimeout(onClose, 600); }}>Save</Button>
              <Button variant="primary" size="sm" icon={<IcSend size={13} />}
                      onClick={() => { pushToast("Segment saved · opening campaign…"); setTimeout(onClose, 600); }}>
                Save & use in new campaign
              </Button>
            </div>
          </div>
        </div>

        <div className="col" style={{ gap: 16 }}>
          <Card title="Live match count" subtitle="Updated as you change the rule">
            <div style={{ fontSize: 30, fontWeight: 500, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em", color: "var(--text-heading)" }}>
              {liveCount.toLocaleString()}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>contacts will match · refreshed every 2s</div>
            <Button variant="ghost" size="sm" icon={<IcEye size={13} />} style={{ marginTop: 8 }}>Preview list →</Button>
          </Card>

          <Card title="Sample matches">
            <div className="col" style={{ gap: 0 }}>
              {CONTACTS.slice(0, 5).map((c) => (
                <div key={c.id} className="row" style={{ gap: 8, padding: "8px 0", borderTop: "0.5px solid var(--border-hair)", fontSize: 13 }}>
                  <Avatar name={c.name} size="sm" />
                  <span style={{ flex: 1, fontWeight: 500 }}>{c.name}</span>
                  <span className="mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>{c.phone}</span>
                </div>
              ))}
              <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-subtle)", textAlign: "center" }}>… and {(liveCount - 5).toLocaleString()} more</div>
            </div>
          </Card>
        </div>
      </div>
      {toastNode}
    </Page>
  );
}

// ── Rule builder (visual nested AND/OR groups) ─────────────────────────────
function RuleBuilder() {
  return (
    <div>
      <div className="rule-group">
        <div className="rule-group-head">
          <div className="row" style={{ gap: 4, border: "0.5px solid var(--border-strong)", borderRadius: 6, overflow: "hidden" }}>
            {["AND", "OR"].map((g, i) => (
              <button key={g} style={{
                padding: "3px 10px", border: 0, background: g === "AND" ? "var(--green-100)" : "var(--bg)",
                color: g === "AND" ? "var(--green-800)" : "var(--text-muted)", fontWeight: 500, fontSize: 11,
                cursor: "pointer", fontFamily: "inherit",
                borderRight: i === 0 ? "0.5px solid var(--border-strong)" : 0,
              }}>{g}</button>
            ))}
          </div>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Match all of the following</span>
          <span className="spacer" />
          <IconButton icon={<IcX size={12} />} title="Remove group" size="sm" />
        </div>

        <RuleRow field="opt_in"  operator="is"           value="opted in" />
        <RuleRow field="tag"     operator="contains"      value="VIP" />
        <RuleRow field="state"   operator="is"           value="Selangor" />

        <div className="rule-subgroup">
          <div className="rule-group-head">
            <div className="row" style={{ gap: 4, border: "0.5px solid var(--border-strong)", borderRadius: 6, overflow: "hidden" }}>
              {["AND", "OR"].map((g, i) => (
                <button key={g} style={{
                  padding: "3px 10px", border: 0, background: g === "OR" ? "var(--green-100)" : "var(--bg)",
                  color: g === "OR" ? "var(--green-800)" : "var(--text-muted)", fontWeight: 500, fontSize: 11,
                  cursor: "pointer", fontFamily: "inherit",
                  borderRight: i === 0 ? "0.5px solid var(--border-strong)" : 0,
                }}>{g}</button>
              ))}
            </div>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Match any of the following</span>
            <span className="spacer" />
            <IconButton icon={<IcX size={12} />} title="Remove group" size="sm" />
          </div>
          <RuleRow field="last_order_days" operator="within" value="30" suffix="days" />
          <RuleRow field="last_message_days" operator="within" value="7" suffix="days" />
          <Button variant="ghost" size="sm" icon={<IcPlus size={12} />} style={{ marginLeft: 24, marginTop: 4 }}>Add rule</Button>
        </div>

        <div className="row" style={{ gap: 6, marginTop: 8 }}>
          <Button variant="ghost" size="sm" icon={<IcPlus size={12} />}>Add rule</Button>
          <Button variant="ghost" size="sm" icon={<IcPlus size={12} />}>Add group</Button>
        </div>
      </div>
    </div>
  );
}

function RuleRow({ field, operator, value, suffix }) {
  return (
    <div className="rule-row">
      <select className="select" defaultValue={field} style={{ width: 180 }}>
        <option value="opt_in">opt_in</option>
        <option value="tag">tag</option>
        <option value="state">state</option>
        <option value="last_order_days">last_order_days</option>
        <option value="last_message_days">last_message_days</option>
        <option value="language">language</option>
        <option value="lifetime_value">lifetime_value</option>
      </select>
      <select className="select" defaultValue={operator} style={{ width: 130 }}>
        <option value="is">is</option>
        <option value="is_not">is not</option>
        <option value="contains">contains</option>
        <option value="starts_with">starts with</option>
        <option value="within">within (days)</option>
        <option value="before">before</option>
        <option value="after">after</option>
      </select>
      <input className="input" defaultValue={value} style={{ flex: 1 }} />
      {suffix && <span style={{ fontSize: 12, color: "var(--text-muted)", padding: "0 4px" }}>{suffix}</span>}
      <IconButton icon={<IcX size={12} />} title="Remove rule" size="sm" />
    </div>
  );
}

Object.assign(window, { ScreenSegmentBuilder });
