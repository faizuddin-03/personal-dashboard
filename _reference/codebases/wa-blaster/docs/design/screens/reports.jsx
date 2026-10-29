// screens/reports.jsx — analytics / performance dashboards

function ScreenReports({ role, populated, onCompare, onDrilldown }) {
  const [range, setRange] = useState("14d");
  const [tab, setTab] = useState("overview");
  const [selected, setSelected] = useState({});
  const selIds = Object.entries(selected).filter(([, v]) => v).map(([k]) => k);
  const completedRows = CAMPAIGNS.filter(c => c.delivered > 0);

  if (!populated) {
    return (
      <Page>
        <PageHead title="Reports" />
        <Card><Empty icon={<IcBar size={20} />} title="Reports appear after your first send"
                     body="Send a campaign to start collecting delivery, read, and reply metrics. Live data populates here within minutes." /></Card>
      </Page>
    );
  }

  return (
    <Page>
      <PageHead title="Reports"
                subtitle="Performance across campaigns, templates, and segments."
                actions={
                  <>
                    <div className="row" style={{ gap: 0, border: "0.5px solid var(--border-strong)", borderRadius: 8, overflow: "hidden" }}>
                      {[["24h", "24h"], ["7d", "7 days"], ["14d", "14 days"], ["30d", "30 days"]].map(([v, l]) => (
                        <button key={v} onClick={() => setRange(v)}
                                style={{
                                  height: 32, padding: "0 12px", border: 0, background: range === v ? "var(--bg-hover)" : "var(--bg)",
                                  color: range === v ? "var(--text)" : "var(--text-muted)", fontWeight: range === v ? 500 : 400,
                                  borderLeft: v === "24h" ? 0 : "0.5px solid var(--border)",
                                  fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                                }}>{l}</button>
                      ))}
                    </div>
                    <Button variant="secondary" icon={<IcDownload size={14} />}>Export CSV</Button>
                  </>
                } />

      <div className="kpi-strip" style={{ marginBottom: 32 }}>
        <KpiTile id="sent"     title="Messages sent"    value="98,420" delta="+18.2%" foot="vs prev 14d"     onClick={onDrilldown} />
        <KpiTile id="delivery" title="Delivery rate"    value="98.1%"  delta="+0.4 pts" foot="industry: 96%" onClick={onDrilldown} />
        <KpiTile id="read"     title="Read rate"        value="71.8%"  delta="−2.1 pts" deltaDir="down" foot="industry: 70%" onClick={onDrilldown} />
        <KpiTile id="reply"    title="Reply rate"       value="13.4%"  delta="+1.6 pts" foot="industry: 9%"  onClick={onDrilldown} />
        <div className="stat" style={{ cursor: "default" }}>
          <div className="stat-label"><IcShield size={13} style={{ color: "var(--text-muted)" }} />Quality rating</div>
          <div className="stat-value" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Pill tone="green" dot>High</Pill>
          </div>
          <div className="stat-foot"><span style={{ color: "var(--text-subtle)" }}>Meta · stable 14d</span></div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 32 }}>
        <Tabs value={tab} onChange={setTab} tabs={[
          { value: "overview",  label: "Overview" },
          { value: "campaigns", label: "By campaign" },
          { value: "templates", label: "By template" },
          { value: "segments",  label: "By segment" },
          { value: "agents",    label: "By teammate" },
        ]} />

        {tab === "overview" && (
          <div style={{ padding: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }}>
              <div>
                <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
                  <div className="h2">Daily volume</div>
                  <div className="row" style={{ gap: 12, fontSize: 11 }}>
                    <span className="row" style={{ gap: 4 }}><span className="dot green" /> Sent</span>
                    <span className="row" style={{ gap: 4 }}><span className="dot blue" /> Read</span>
                    <span className="row" style={{ gap: 4 }}><span className="dot" style={{ background: "var(--green-800)" }} /> Replied</span>
                  </div>
                </div>
                <MultiBarChart height={240}
                               series={[
                                 { name: "Sent",    color: "var(--green-500)", data: SPARK_SENT },
                                 { name: "Read",    color: "var(--blue-500)",  data: SPARK_READ },
                                 { name: "Replied", color: "var(--green-800)", data: SPARK_REPLY },
                               ]} />
                <div className="row" style={{ justifyContent: "space-between", marginTop: 8, fontSize: 11, color: "var(--text-muted)" }}>
                  <span>Oct 8</span><span>Oct 15</span><span>Today</span>
                </div>
              </div>
              <div className="col" style={{ gap: 20 }}>
                <div>
                  <div className="h3" style={{ marginBottom: 12 }}>Delivery funnel</div>
                  <div className="col" style={{ gap: 8 }}>
                    <FunnelStep label="Sent"      value={98420} total={98420} color="var(--green-500)" />
                    <FunnelStep label="Delivered" value={96570} total={98420} color="var(--green-600)" />
                    <FunnelStep label="Read"      value={70681} total={98420} color="var(--blue-500)" />
                    <FunnelStep label="Replied"   value={13208} total={98420} color="var(--green-800)" />
                  </div>
                </div>
                <div>
                  <div className="h3" style={{ marginBottom: 12 }}>Cost (last 14 days)</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <Donut value={62} total={100} size={84} stroke={12} color="var(--green-500)" label={myrFmt(5905.20)} />
                    <div className="col" style={{ gap: 6, flex: 1, fontSize: 12 }}>
                      <div className="row" style={{ justifyContent: "space-between" }}><span><span className="dot green" /> Utility</span><b>{myrFmt(3661.20)}</b></div>
                      <div className="row" style={{ justifyContent: "space-between" }}><span><span className="dot blue" /> Marketing</span><b>{myrFmt(1980.00)}</b></div>
                      <div className="row" style={{ justifyContent: "space-between" }}><span><span className="dot amber" /> Auth</span><b>{myrFmt(264.00)}</b></div>
                      <div className="row" style={{ justifyContent: "space-between", marginTop: 6, paddingTop: 6, borderTop: "0.5px solid var(--border)" }}>
                        <span className="muted">Total</span><b>{myrFmt(5905.20)}</b>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "campaigns" && (
          <>
            <SelectionBar count={selIds.length} onClear={() => setSelected({})}
                          actions={
                            <Button variant="primary" size="sm" icon={<IcChevsLR size={13} />}
                                    disabled={selIds.length < 2 || selIds.length > 4}
                                    onClick={() => onCompare && onCompare(selIds)}>
                              Compare ({selIds.length})
                            </Button>
                          } />
            <div className="table-scroll">
              <table className="table">
                <thead><tr>
                  <th style={{ width: 32 }}><Cbx on={selIds.length === completedRows.length}
                                                  indeterminate={selIds.length > 0 && selIds.length < completedRows.length}
                                                  onChange={(v) => v ? setSelected(Object.fromEntries(completedRows.map(c => [c.id, true]))) : setSelected({})} /></th>
                  <th>Campaign</th><th className="num">Sent</th><th className="num sortable">Delivery <IcChevD size={10} style={{ verticalAlign: "-1px" }} /></th><th className="num">Read</th>
                  <th className="num">Reply rate</th><th className="num">Cost</th>
                </tr></thead>
                <tbody>
                  {completedRows.map(c => (
                    <tr key={c.id} data-selected={!!selected[c.id]}>
                      <td><Cbx on={!!selected[c.id]} onChange={(v) => setSelected({ ...selected, [c.id]: v })} /></td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }} className="mono">{c.template}</div>
                      </td>
                      <td className="num">{c.delivered.toLocaleString()}</td>
                      <td className="num">{((c.delivered / c.audience) * 100).toFixed(1)}%</td>
                      <td className="num">{((c.read / c.delivered) * 100).toFixed(1)}%</td>
                      <td className="num">
                        <span className="bar-cell" style={{ "--p": ((c.replied / c.delivered) * 100 * 3) + "%" }}>
                          {((c.replied / c.delivered) * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="num">{myrFmt(c.cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === "templates" && (
          <div className="table-scroll">
            <table className="table">
              <thead><tr>
                <th>Template</th><th>Category</th><th>Lang</th><th className="num">Sent 7d</th><th className="num">Delivery</th><th className="num">Read</th>
              </tr></thead>
              <tbody>
                {TEMPLATES.filter(t => t.sent7d > 0).map(t => (
                  <tr key={t.id}>
                    <td className="mono" style={{ fontSize: 12 }}>{t.name}</td>
                    <td><Pill tone={t.category === "Marketing" ? "blue" : t.category === "Authentication" ? "amber" : "gray"}>{t.category}</Pill></td>
                    <td><span className="tag-upper">{t.language === "ms_MY" ? "MS" : "EN"}</span></td>
                    <td className="num">{t.sent7d.toLocaleString()}</td>
                    <td className="num">{(97 + Math.random() * 2).toFixed(1)}%</td>
                    <td className="num">{(65 + Math.random() * 15).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "segments" && (
          <div className="table-scroll">
            <table className="table">
              <thead><tr><th>Segment</th><th className="num">Size</th><th className="num">Reachable</th><th className="num">Avg. reply rate</th></tr></thead>
              <tbody>
                {SEGMENTS.map(s => (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td className="num">{s.size.toLocaleString()}</td>
                    <td className="num">{Math.round(s.size * 0.98).toLocaleString()}</td>
                    <td className="num"><span className="bar-cell" style={{ "--p": (8 + Math.random() * 18) * 2 + "%" }}>{(8 + Math.random() * 18).toFixed(1)}%</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "agents" && (
          <div className="table-scroll">
            <table className="table">
              <thead><tr>
                <th>Teammate</th><th>Role</th><th className="num">Replies handled</th><th className="num">Avg. response time</th><th className="num">CSAT</th>
              </tr></thead>
              <tbody>
                {TEAMMATES.map((t, i) => (
                  <tr key={t.id}>
                    <td><div className="row" style={{ gap: 8 }}><Avatar name={t.name} size="sm" color={t.color} /><span style={{ fontWeight: 500 }}>{t.name}</span></div></td>
                    <td><Pill tone={t.role === "admin" ? "blue" : "gray"}>{t.role}</Pill></td>
                    <td className="num">{[418, 902, 612, 540, 198, 280][i]}</td>
                    <td className="num">{["1m 12s", "3m 04s", "2m 18s", "4m 51s", "1m 02s", "2m 47s"][i]}</td>
                    <td className="num">{[4.8, 4.6, 4.7, 4.5, 4.9, 4.4][i]} / 5</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="h2" style={{ marginBottom: 20 }}>AI performance</div>
      <div className="grid-3" style={{ marginBottom: 32 }}>
        <Card title="Classifier accuracy" subtitle="Intent classification — last 14 days">
          <div className="row" style={{ alignItems: "baseline", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 28, fontWeight: 500, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em" }}>94.2%</span>
            <span className="delta-up" style={{ fontSize: 12 }}><IcArrowUp size={11} style={{ verticalAlign: "-1px" }} /> +0.8 pts</span>
          </div>
          <Sparkline data={[91.2, 91.8, 92.4, 92.1, 92.9, 93.2, 93.0, 93.5, 93.7, 94.0, 93.8, 94.1, 94.3, 94.2]} height={48} />
        </Card>
        <Card title="Chatbot resolution rate" subtitle="% handled without operator">
          <div className="row" style={{ alignItems: "baseline", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 28, fontWeight: 500, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em" }}>76.4%</span>
            <span className="delta-up" style={{ fontSize: 12 }}><IcArrowUp size={11} style={{ verticalAlign: "-1px" }} /> +3.2 pts</span>
          </div>
          <Sparkline data={[70.2, 71.1, 71.8, 71.4, 72.6, 73.1, 72.9, 73.8, 74.4, 74.9, 75.3, 75.8, 76.2, 76.4]} height={48} />
        </Card>
        <Card title="Escalation queue volume" subtitle="By reason · last 14 days">
          <BarChart data={[42, 38, 51, 48, 56, 62, 58, 64, 71, 68, 72, 78, 81, 76]} height={56} color="var(--amber-500)" />
          <div className="row" style={{ justifyContent: "space-between", marginTop: 6, fontSize: 11, color: "var(--text-muted)" }}>
            <span><span className="dot amber" /> refund</span>
            <span><span className="dot red" /> damaged</span>
            <span><span className="dot blue" /> address</span>
            <span><span className="dot gray" /> other</span>
          </div>
        </Card>
      </div>

      <div className="grid-2">
        <Card title="Top intents (chatbot)" subtitle="Auto-classified intents over last 14 days">
          <div className="col" style={{ gap: 10 }}>
            {[
              ["order_status",       3812, "var(--green-500)"],
              ["shipping_quote",     1640, "var(--green-600)"],
              ["reschedule_booking", 1208, "var(--blue-500)"],
              ["refund_status",       820, "var(--amber-500)"],
              ["tax_invoice_request", 412, "var(--gray-400)"],
            ].map(([name, count, color]) => (
              <div key={name} className="row" style={{ gap: 10 }}>
                <code style={{ width: 180 }}>{name}</code>
                <div style={{ flex: 1, height: 18, background: "var(--bg-hover)", borderRadius: 4, position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: (count / 3812 * 100) + "%", background: color }} />
                </div>
                <span style={{ width: 60, textAlign: "right", fontVariantNumeric: "tabular-nums", fontSize: 13 }}>{count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Chatbot health" subtitle="Auto-resolution and escalation">
          <div className="col" style={{ gap: 14 }}>
            <HealthRow label="Auto-resolved" value="76.4%" tone="green" hint="Up 3.2 pts from last month" />
            <HealthRow label="Needs review queue" value="14.1%" tone="amber" hint="Drafts awaiting operator approval" />
            <HealthRow label="Escalated to human" value="9.5%" tone="blue" hint="Low confidence or sensitive intents" />
            <div className="divider" />
            <HealthRow label="Avg. confidence" value="83%" hint="Across all drafted replies" />
            <HealthRow label="Knowledge sources cited" value="218 docs" hint="Across 7 KB documents" />
          </div>
        </Card>
      </div>
    </Page>
  );
}

function FunnelStep({ label, value, total, color }) {
  const pct = (value / total) * 100;
  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 4, fontSize: 12 }}>
        <span>{label}</span>
        <span style={{ fontVariantNumeric: "tabular-nums" }}>{value.toLocaleString()} <span className="muted">({pct.toFixed(1)}%)</span></span>
      </div>
      <div style={{ height: 8, background: "var(--bg-hover)", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ width: pct + "%", height: "100%", background: color, borderRadius: 999 }} />
      </div>
    </div>
  );
}

function KpiTile({ id, title, value, delta, deltaDir = "up", foot, onClick }) {
  return (
    <button onClick={() => onClick && onClick({ id, title, value, delta })}
            className="stat"
            style={{ textAlign: "left", cursor: "pointer", fontFamily: "inherit" }}>
      <div className="stat-label">{title}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-foot">
        {delta && <span className={deltaDir === "down" ? "delta-down" : "delta-up"}>
          {deltaDir === "down" ? <IcArrowDown size={12} /> : <IcArrowUp size={12} />} {delta}
        </span>}
        {foot && <span style={{ color: "var(--text-subtle)" }}>{foot}</span>}
        <span style={{ color: "var(--text-subtle)", marginLeft: "auto" }}><IcExternal size={11} /></span>
      </div>
    </button>
  );
}

Object.assign(window, { ScreenReports });
