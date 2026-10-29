// screens/campaigns.jsx — Campaign list + composer wizard.

function ScreenCampaigns({ role, populated, initialView, onOpenDetail }) {
  const [view, setView] = useState(initialView || "list");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState({});
  useEffect(() => { if (initialView) setView(initialView); }, [initialView]);

  if (view === "compose") {
    return <CampaignComposer role={role} onClose={() => setView("list")} />;
  }

  const tabs = [
    { value: "all",       label: "All",         count: CAMPAIGNS.length },
    { value: "sending",   label: "Sending",     count: CAMPAIGNS.filter(c => c.status === "sending").length },
    { value: "scheduled", label: "Scheduled",   count: CAMPAIGNS.filter(c => c.status === "scheduled").length },
    { value: "draft",     label: "Drafts",      count: CAMPAIGNS.filter(c => c.status === "draft").length },
    { value: "paused",    label: "Paused",      count: CAMPAIGNS.filter(c => c.status === "paused").length },
    { value: "complete",  label: "Past",        count: CAMPAIGNS.filter(c => c.status === "complete" || c.status === "always-on").length },
  ];
  const rows = CAMPAIGNS.filter(c => {
    if (statusFilter === "all") return true;
    if (statusFilter === "complete") return c.status === "complete" || c.status === "always-on";
    return c.status === statusFilter;
  });
  const selCount = Object.values(selected).filter(Boolean).length;

  if (!populated) {
    return (
      <Page>
        <PageHead title="Campaigns" subtitle="Send Meta-approved templates to opted-in segments."
                  actions={<Button variant="primary" icon={<IcPlus size={14} />} onClick={() => setView("compose")}>New campaign</Button>} />
        <Card>
          <Empty icon={<IcSend size={20} />}
                 title="Send your first campaign"
                 body="Pick an approved template and a segment, then schedule. Drafts auto-save and can be resumed any time."
                 cta={<Button variant="primary" icon={<IcPlus size={14} />} onClick={() => setView("compose")}>New campaign</Button>} />
        </Card>
      </Page>
    );
  }

  return (
    <Page>
      <PageHead title="Campaigns"
                subtitle={`${CAMPAIGNS.length} total · daily tier 100,000 messages · used 14.8% today`}
                actions={
                  <>
                    <Button variant="secondary" icon={<IcDownload size={14} />}>Export</Button>
                    <Button variant="primary" icon={<IcPlus size={14} />} onClick={() => setView("compose")}>New campaign</Button>
                  </>
                } />

      <div className="card">
        <Tabs value={statusFilter} onChange={setStatusFilter} tabs={tabs} />
        <SelectionBar count={selCount} onClear={() => setSelected({})}
                      actions={
                        <>
                          <Button variant="ghost" size="sm" icon={<IcPause size={13} />}>Pause</Button>
                          <Button variant="ghost" size="sm" icon={<IcCopy size={13} />}>Duplicate</Button>
                          <Button variant="ghost" size="sm" icon={<IcDownload size={13} />}>Export selected</Button>
                          <Button variant="ghost" size="sm" icon={<IcTrash size={13} />} locked={role !== "admin"}>Archive</Button>
                        </>
                      } />
        <div className="toolbar">
          <FilterPill label="Owner" icon={<IcUser size={12} />} />
          <FilterPill label="Template" icon={<IcFile size={12} />} />
          <FilterPill label="Date" icon={<IcCalendar size={12} />} />
          <FilterPill label="Segment" icon={<IcFilter size={12} />} />
          <span className="grow" />
          <div className="search" style={{ width: 240, height: 26 }}>
            <IcSearch size={13} />
            <input placeholder="Search campaigns…" />
          </div>
        </div>
        <div className="table-scroll">
          <table className="table">
            <colgroup>
              <col style={{ width: 32 }} />
              <col style={{ width: "26%" }} />
              <col style={{ width: 110 }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: 140 }} />
              <col style={{ width: 140 }} />
              <col style={{ width: 80 }} />
              <col style={{ width: 96 }} />
              <col style={{ width: 32 }} />
            </colgroup>
            <thead>
              <tr>
                <th><Cbx on={selCount === rows.length} indeterminate={selCount > 0 && selCount < rows.length}
                          onChange={(v) => {
                            if (v) setSelected(Object.fromEntries(rows.map(r => [r.id, true])));
                            else setSelected({});
                          }} /></th>
                <th className="sortable">Campaign <IcChevD size={10} style={{ verticalAlign: "-1px" }} /></th>
                <th>Status</th>
                <th>Segment</th>
                <th>Schedule</th>
                <th className="num">Delivery</th>
                <th className="num">Replies</th>
                <th className="num">Cost (MYR)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(c => (
                <tr key={c.id} data-selected={!!selected[c.id]}
                    onClick={() => onOpenDetail && onOpenDetail(c.status === "complete" ? "complete" : "sending")}
                    style={{ cursor: onOpenDetail ? "pointer" : "default" }}>
                  <td onClick={(e) => e.stopPropagation()}><Cbx on={!!selected[c.id]} onChange={(v) => setSelected({ ...selected, [c.id]: v })} /></td>
                  <td>
                    <div style={{ fontWeight: 500 }} className="truncate">{c.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }} className="mono truncate">{c.template}</div>
                  </td>
                  <td><StatusPill status={c.status} /></td>
                  <td className="truncate">
                    <span className="row" style={{ gap: 6 }}>
                      <IcFilter size={11} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                      <span className="truncate">{c.segment}</span>
                    </span>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{c.audience.toLocaleString()} contacts</div>
                  </td>
                  <td className="muted">{c.scheduledAt}</td>
                  <td className="num">
                    {c.audience > 0 && c.delivered > 0 ? (
                      <>
                        <div style={{ fontVariantNumeric: "tabular-nums", fontSize: 12 }}>
                          {c.delivered.toLocaleString()} / {c.audience.toLocaleString()}
                        </div>
                        <Progress value={(c.delivered / c.audience) * 100} />
                      </>
                    ) : <span className="muted">—</span>}
                  </td>
                  <td className="num">{c.replied > 0 ? c.replied.toLocaleString() : <span className="muted">—</span>}</td>
                  <td className="num">{c.cost > 0 ? myrFmt(c.cost) : <span className="muted">—</span>}</td>
                  <td onClick={(e) => e.stopPropagation()}><IconButton icon={<IcVDots size={14} />} title="Actions" size="sm" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Page>
  );
}

// ── Campaign composer (wizard) ─────────────────────────────────────────────
function CampaignComposer({ role, onClose }) {
  const DRAFT_KEY = "blaster_campaign_draft_v1";
  const initialDraft = (() => {
    try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || "null"); } catch { return null; }
  })();

  const [step, setStep] = useState(1);
  const [name, setName] = useState("Raya VIP early access");
  const [tmpl, setTmpl] = useState("raya_promo_2025");
  const [segment, setSegment] = useState("s2");
  const [schedule, setSchedule] = useState("now");
  const [sendingPct, setSendingPct] = useState(0);
  const [launchOpen, setLaunchOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [showResumePrompt, setShowResumePrompt] = useState(!!initialDraft);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [pushToast, toastNode] = useToast();

  // Auto-save (debounced) whenever any field changes
  useEffect(() => {
    if (confirmed) return;
    const id = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ step, name, tmpl, segment, schedule, savedAt: Date.now() }));
        setLastSavedAt(Date.now());
      } catch {}
    }, 800);
    return () => clearTimeout(id);
  }, [step, name, tmpl, segment, schedule, confirmed]);

  // Clear draft once successfully launched
  useEffect(() => {
    if (sendingPct >= 100 && confirmed) {
      try { localStorage.removeItem(DRAFT_KEY); } catch {}
    }
  }, [sendingPct, confirmed]);

  const resumeDraft = () => {
    if (initialDraft) {
      setName(initialDraft.name || name);
      setTmpl(initialDraft.tmpl || tmpl);
      setSegment(initialDraft.segment || segment);
      setSchedule(initialDraft.schedule || schedule);
      setStep(initialDraft.step || 1);
      pushToast("Draft resumed");
    }
    setShowResumePrompt(false);
  };
  const discardDraft = () => {
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
    setShowResumePrompt(false);
  };

  const tmplObj = TEMPLATES.find(t => t.name === tmpl) || TEMPLATES[0];
  const segObj = SEGMENTS.find(s => s.id === segment) || SEGMENTS[0];
  const audience = segObj.size;
  const estCost = audience * 0.06; // RM 0.06/msg estimate

  // Simulate progress after the user confirms launch
  useEffect(() => {
    if (step !== 4 || schedule !== "now" || !confirmed) return;
    setSendingPct(0);
    const iv = setInterval(() => {
      setSendingPct(p => {
        if (p >= 100) { clearInterval(iv); return 100; }
        return Math.min(100, p + 7);
      });
    }, 220);
    return () => clearInterval(iv);
  }, [step, schedule, confirmed]);

  const steps = [
    { n: 1, label: "Template" },
    { n: 2, label: "Audience" },
    { n: 3, label: "Schedule" },
    { n: 4, label: "Review & send" },
  ];

  const next = () => setStep(s => Math.min(4, s + 1));
  const back = () => setStep(s => Math.max(1, s - 1));

  return (
    <Page>
      <div className="row" style={{ marginBottom: 16, gap: 12 }}>
        <Button variant="ghost" size="sm" icon={<IcChevL size={13} />} onClick={onClose}>Back to campaigns</Button>
        <div style={{ flex: 1 }}>
          <h1 className="page-title">New campaign</h1>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            {lastSavedAt
              ? <>Draft auto-saved <span className="mono">{Math.max(1, Math.round((Date.now() - lastSavedAt) / 1000))}s ago</span></>
              : "Draft auto-saves every change"}
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => pushToast("Draft saved")}>Save draft</Button>
      </div>

      {showResumePrompt && (
        <div style={{ marginBottom: 16, padding: 14, background: "var(--green-50)", border: "0.5px solid var(--green-200)", borderRadius: 12, display: "flex", alignItems: "center", gap: 12 }}>
          <IcInfo size={16} style={{ color: "var(--green-700)", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--green-800)" }}>Resume previous draft?</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              You started a campaign on {initialDraft && new Date(initialDraft.savedAt).toLocaleString("en-MY", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })} — picked up at step {initialDraft && initialDraft.step}.
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={discardDraft}>Discard</Button>
          <Button variant="primary" size="sm" onClick={resumeDraft}>Resume</Button>
        </div>
      )}

      {/* Stepper */}
      <div className="card" style={{ marginBottom: 16, padding: 0 }}>
        <div className="row" style={{ padding: "14px 20px", gap: 0 }}>
          {steps.map((s, i) => (
            <React.Fragment key={s.n}>
              <div className="row" style={{ gap: 10, flex: i === steps.length - 1 ? "0 0 auto" : 1 }}>
                <span style={{
                  width: 22, height: 22, borderRadius: "50%",
                  display: "grid", placeItems: "center",
                  background: step > s.n ? "var(--green-500)" : step === s.n ? "var(--green-100)" : "var(--bg-hover)",
                  color: step > s.n ? "#fff" : step === s.n ? "var(--green-800)" : "var(--text-muted)",
                  fontSize: 11, fontWeight: 500,
                  border: step === s.n ? "0.5px solid var(--green-500)" : "0",
                }}>
                  {step > s.n ? <IcCheck size={11} /> : s.n}
                </span>
                <div>
                  <div style={{ fontSize: 12, color: "var(--text-subtle)" }}>Step {s.n}</div>
                  <div style={{ fontSize: 13, fontWeight: step === s.n ? 500 : 400, color: step >= s.n ? "var(--text)" : "var(--text-muted)" }}>{s.label}</div>
                </div>
              </div>
              {i < steps.length - 1 && (
                <div style={{ flex: 1, height: 0.5, background: step > s.n ? "var(--green-500)" : "var(--border)", margin: "0 16px", marginTop: 11 }} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 16 }}>
        <div className="col" style={{ gap: 16 }}>
          {step === 1 && (
            <Card title="Choose a template" subtitle="Only Meta-approved templates can be used in marketing campaigns.">
              <div className="field" style={{ marginBottom: 12 }}>
                <label className="field-label">Campaign name</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="field">
                <label className="field-label">Template</label>
                <div className="col" style={{ gap: 0, border: "0.5px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
                  {TEMPLATES.filter(t => t.status === "approved").map((t) => (
                    <label key={t.id} className="row"
                           style={{ padding: 12, gap: 12, cursor: "pointer",
                                    borderTop: "0.5px solid var(--border-hair)",
                                    background: tmpl === t.name ? "var(--green-50)" : "transparent" }}>
                      <input type="radio" name="t" checked={tmpl === t.name} onChange={() => setTmpl(t.name)} style={{ accentColor: "var(--green-500)" }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="row" style={{ gap: 6 }}>
                          <span className="mono" style={{ fontSize: 12, fontWeight: 500 }}>{t.name}</span>
                          <Pill tone="gray">{t.category}</Pill>
                          <span className="tag-upper">{t.language === "ms_MY" ? "MS" : "EN"}</span>
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Updated {t.lastEdited} · {t.vars} variables · {t.sent7d.toLocaleString()} sent in last 7d</div>
                      </div>
                      <StatusPill status={t.status} />
                    </label>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {step === 2 && (
            <Card title="Pick an audience" subtitle="Only opted-in contacts will receive the message.">
              <div className="col" style={{ gap: 0, border: "0.5px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
                {SEGMENTS.map((s) => (
                  <label key={s.id} className="row"
                         style={{ padding: 12, gap: 12, cursor: "pointer",
                                  borderTop: "0.5px solid var(--border-hair)",
                                  background: segment === s.id ? "var(--green-50)" : "transparent" }}>
                    <input type="radio" name="s" checked={segment === s.id} onChange={() => setSegment(s.id)} style={{ accentColor: "var(--green-500)" }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{s.name}</div>
                      <code style={{ fontSize: 11, marginTop: 4, display: "inline-block" }}>{s.rule}</code>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 14, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{s.size.toLocaleString()}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>contacts</div>
                    </div>
                  </label>
                ))}
              </div>
              <div className="row" style={{ marginTop: 12, padding: 12, background: "var(--amber-50)", borderRadius: 8, gap: 10, color: "#B45309" }}>
                <IcAlert size={14} />
                <span style={{ fontSize: 12 }}><b>Heads up:</b> sending to {audience.toLocaleString()} contacts will use {((audience / 100000) * 100).toFixed(1)}% of today's tier (100,000 / day).</span>
              </div>
            </Card>
          )}

          {step === 3 && (
            <Card title="When to send" subtitle="Schedules respect Malaysian time (GMT+8).">
              <div className="col" style={{ gap: 0, border: "0.5px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
                {[
                  { v: "now",       title: "Send now",                desc: "Start delivering immediately at full rate." },
                  { v: "scheduled", title: "Schedule for later",      desc: "Pick a specific date and time." },
                  { v: "smart",     title: "Smart send (best time)",  desc: "AI picks the best send-time per contact, within a 24h window." },
                ].map((o) => (
                  <label key={o.v} className="row"
                         style={{ padding: 12, gap: 12, cursor: "pointer",
                                  borderTop: "0.5px solid var(--border-hair)",
                                  background: schedule === o.v ? "var(--green-50)" : "transparent" }}>
                    <input type="radio" name="when" checked={schedule === o.v} onChange={() => setSchedule(o.v)} style={{ accentColor: "var(--green-500)" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{o.title}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{o.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
              {schedule === "scheduled" && (
                <div className="row" style={{ marginTop: 12, gap: 10 }}>
                  <div className="field" style={{ flex: 1 }}>
                    <label className="field-label">Date</label>
                    <div className="input row" style={{ alignItems: "center" }}><IcCalendar size={13} style={{ color: "var(--text-muted)", marginRight: 6 }} /> 22 Oct 2025</div>
                  </div>
                  <div className="field" style={{ flex: 1 }}>
                    <label className="field-label">Time</label>
                    <div className="input row" style={{ alignItems: "center" }}><IcClock size={13} style={{ color: "var(--text-muted)", marginRight: 6 }} /> 09:00 MYT</div>
                  </div>
                </div>
              )}
              <div className="field" style={{ marginTop: 12 }}>
                <label className="field-label">Rate limit</label>
                <select className="select"><option>Auto (recommended)</option><option>250 msg/sec</option><option>500 msg/sec</option><option>1000 msg/sec</option></select>
                <div className="field-hint">Current tier allows up to 1,000 msg/sec. Auto throttles based on quality rating.</div>
              </div>
            </Card>
          )}

          {step === 4 && schedule !== "now" && (
            <Card title="Review">
              <div className="col" style={{ gap: 14 }}>
                <ReviewRow label="Name"     value={name} />
                <ReviewRow label="Template" value={<><code>{tmplObj.name}</code> <Pill tone="gray">{tmplObj.category}</Pill> <StatusPill status={tmplObj.status} /></>} />
                <ReviewRow label="Segment"  value={<>{segObj.name} <span className="muted">· {segObj.size.toLocaleString()} contacts</span></>} />
                <ReviewRow label="Schedule" value={schedule === "scheduled" ? "22 Oct 2025, 09:00 MYT" : "Smart send within 24h"} />
                <ReviewRow label="Cost"     value={<><b>{myrFmt(estCost)}</b> <span className="muted">est. at RM 0.06 / message</span></>} />
                <div style={{ padding: 12, background: "var(--green-50)", borderRadius: 8, border: "0.5px solid var(--green-200)", color: "var(--green-800)", fontSize: 12 }}>
                  <IcCheckCircle size={13} style={{ verticalAlign: "-2px", marginRight: 6 }} />
                  All checks passed: contacts opted in, template approved, rate within tier.
                </div>
              </div>
            </Card>
          )}

          {step === 4 && schedule === "now" && !confirmed && (
            <Card title="Review" subtitle="You will start sending immediately after launch.">
              <div className="col" style={{ gap: 14 }}>
                <ReviewRow label="Name"     value={name} />
                <ReviewRow label="Template" value={<><code>{tmplObj.name}</code> <Pill tone="gray">{tmplObj.category}</Pill> <StatusPill status={tmplObj.status} /></>} />
                <ReviewRow label="Segment"  value={<>{segObj.name} <span className="muted">· {segObj.size.toLocaleString()} contacts</span></>} />
                <ReviewRow label="Schedule" value="Send now" />
                <ReviewRow label="Cost"     value={<><b>{myrFmt(estCost)}</b> <span className="muted">est. at RM 0.06 / message</span></>} />
                <div style={{ padding: 12, background: "var(--green-50)", borderRadius: 8, border: "0.5px solid var(--green-200)", color: "var(--green-800)", fontSize: 12 }}>
                  <IcCheckCircle size={13} style={{ verticalAlign: "-2px", marginRight: 6 }} />
                  All checks passed: contacts opted in, template approved, rate within tier.
                </div>
              </div>
            </Card>
          )}

          {step === 4 && schedule === "now" && confirmed && (
            <Card title="Sending…" subtitle={`To ${audience.toLocaleString()} contacts in "${segObj.name}"`}>
              <div className="col" style={{ gap: 14 }}>
                <div>
                  <div className="row" style={{ justifyContent: "space-between", marginBottom: 6, fontSize: 12 }}>
                    <span>{Math.round((sendingPct / 100) * audience).toLocaleString()} of {audience.toLocaleString()} delivered</span>
                    <span style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{Math.round(sendingPct)}%</span>
                  </div>
                  <Progress value={sendingPct} />
                </div>
                <div className="grid-3">
                  <Stat label="Delivered" value={Math.round((sendingPct / 100) * audience * 0.98).toLocaleString()} />
                  <Stat label="Read" value={Math.round((sendingPct / 100) * audience * 0.31).toLocaleString()} />
                  <Stat label="Replied" value={Math.round((sendingPct / 100) * audience * 0.02).toLocaleString()} />
                </div>
                {sendingPct >= 100 && (
                  <div style={{ padding: 12, background: "var(--green-50)", borderRadius: 8, border: "0.5px solid var(--green-200)", color: "var(--green-800)", fontSize: 13 }}>
                    <IcCheckCircle size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} /> Send complete. View the report for full breakdown.
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Footer nav */}
          <div className="row" style={{ justifyContent: "space-between" }}>
            <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <div className="row" style={{ gap: 8 }}>
              {step > 1 && <Button variant="secondary" size="sm" onClick={back} icon={<IcChevL size={13} />}>Back</Button>}
              {step < 4 && <Button variant="primary" size="sm" onClick={next}>Continue <IcChevR size={13} /></Button>}
              {step === 4 && schedule !== "now" && <Button variant="primary" size="sm" icon={<IcCalendar size={13} />} onClick={() => { pushToast("Campaign scheduled · 22 Oct 09:00"); onClose(); }}>Schedule send</Button>}
              {step === 4 && schedule === "now" && !confirmed && <Button variant="primary" size="sm" icon={<IcSend size={13} />} onClick={() => setLaunchOpen(true)}>Launch campaign</Button>}
              {step === 4 && schedule === "now" && confirmed && sendingPct >= 100 && <Button variant="primary" size="sm" onClick={onClose}>Done</Button>}
            </div>
          </div>
        </div>

        {/* Right: preview */}
        <div className="col" style={{ gap: 16 }}>
          <Card title="Preview">
            <div style={{
              background: "var(--bg-sunken)", borderRadius: 8,
              padding: 16, display: "flex", flexDirection: "column", gap: 8,
              border: "0.5px solid var(--border)"
            }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center" }}>Modefair MY · Business</div>
              <div className="msg in" style={{ alignSelf: "flex-start", maxWidth: "85%" }}>
                Selamat Hari Raya Aidilfitri dari Modefair! 🌙<br />
                Akses awal koleksi raya untuk VIP — diskaun hingga <b>30%</b> sampai 30 April.<br />
                Tekan butang di bawah untuk shop.
                <span className="msg-time">09:00</span>
              </div>
              <button style={{
                background: "var(--green-500)", color: "#fff", border: 0, borderRadius: 8,
                padding: "8px 12px", fontWeight: 500, fontSize: 13, cursor: "pointer", alignSelf: "stretch",
                fontFamily: "inherit",
              }}>Shop koleksi raya</button>
              <div style={{ fontSize: 10, color: "var(--text-subtle)", textAlign: "center", marginTop: 4 }}>
                Reply STOP to opt out
              </div>
            </div>
          </Card>

          <Card title="Sanity checks">
            <div className="col" style={{ gap: 10, fontSize: 13 }}>
              <CheckRow ok label="Template approved by Meta" />
              <CheckRow ok label="All recipients opted in" />
              <CheckRow ok label="Within daily tier" foot={`${audience.toLocaleString()} of 100,000`} />
              <CheckRow ok label="Quality rating: High" />
              <CheckRow warn={audience > 1000} label={audience > 1000 ? "Large send — start with a sample?" : "Sample run recommended"} />
            </div>
          </Card>
        </div>
      </div>
      {toastNode}
      <Dialog open={launchOpen} onClose={() => setLaunchOpen(false)}
              title={`Launch campaign to ${audience.toLocaleString()} contacts?`}
              tone="warning"
              icon={<IcAlert size={16} />}
              footer={
                <>
                  <Button variant="ghost" size="sm" onClick={() => setLaunchOpen(false)}>Cancel</Button>
                  <Button variant="primary" size="sm" icon={<IcSend size={13} />}
                          onClick={() => { setLaunchOpen(false); setConfirmed(true); pushToast("Campaign launched", { icon: <IcSend size={14} /> }); }}>
                    Yes, launch
                  </Button>
                </>
              }>
        <p style={{ margin: "0 0 10px" }}>
          You are about to send <b>{audience.toLocaleString()}</b> WhatsApp messages immediately to <b>{segObj.name}</b>. This action cannot be undone.
        </p>
        <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 12 }}>
          Recipients who reply will appear in your Inbox. Estimated cost: <b style={{ color: "var(--text)" }}>{myrFmt(estCost)}</b>. Today's tier usage will jump from 14.8% to <b style={{ color: "var(--text)" }}>{(14.8 + (audience / 100000) * 100).toFixed(1)}%</b>.
        </p>
      </Dialog>
    </Page>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div className="row" style={{ alignItems: "flex-start", gap: 12 }}>
      <div style={{ width: 110, fontSize: 12, color: "var(--text-muted)" }}>{label}</div>
      <div style={{ flex: 1, fontSize: 13 }}>{value}</div>
    </div>
  );
}

function CheckRow({ ok, warn, label, foot }) {
  return (
    <div className="row" style={{ gap: 8 }}>
      {ok && <IcCheckCircle size={13} style={{ color: "var(--green-500)" }} />}
      {warn && <IcAlert size={13} style={{ color: "var(--amber-500)" }} />}
      <span style={{ flex: 1 }}>{label}</span>
      {foot && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{foot}</span>}
    </div>
  );
}

Object.assign(window, { ScreenCampaigns });
