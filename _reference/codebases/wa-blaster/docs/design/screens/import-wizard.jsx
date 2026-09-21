// screens/import-wizard.jsx — Contacts CSV import. 3 steps + progress + success.

function ScreenImportWizard({ initialStep = 1, onClose }) {
  const [step, setStep] = useState(initialStep || 1);
  const [progress, setProgress] = useState(0);
  const [pushToast, toastNode] = useToast();

  useEffect(() => { setStep(initialStep); }, [initialStep]);

  useEffect(() => {
    if (step !== 4) return;
    setProgress(0);
    const iv = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(iv); setTimeout(() => setStep(5), 400); return 100; }
        return Math.min(100, p + 6);
      });
    }, 140);
    return () => clearInterval(iv);
  }, [step]);

  const steps = [
    { n: 1, label: "Upload" },
    { n: 2, label: "Map columns" },
    { n: 3, label: "Review" },
  ];

  return (
    <Page>
      <div className="row" style={{ marginBottom: 16, gap: 12 }}>
        <Button variant="ghost" size="sm" icon={<IcChevL size={13} />} onClick={onClose}>Back to contacts</Button>
        <div style={{ flex: 1 }}>
          <h1 className="page-title">Import contacts</h1>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>CSV or TSV up to 50 MB · phone numbers will be normalised to E.164</div>
        </div>
      </div>

      {step <= 3 && (
        <div className="card" style={{ marginBottom: 16, padding: 0 }}>
          <div className="row" style={{ padding: "14px 20px", gap: 0 }}>
            {steps.map((s, i) => (
              <React.Fragment key={s.n}>
                <div className="row" style={{ gap: 10, flex: i === steps.length - 1 ? "0 0 auto" : 1 }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: "50%", display: "grid", placeItems: "center",
                    background: step > s.n ? "var(--green-500)" : step === s.n ? "var(--green-100)" : "var(--bg-hover)",
                    color: step > s.n ? "#fff" : step === s.n ? "var(--green-800)" : "var(--text-muted)",
                    fontSize: 11, fontWeight: 500,
                    border: step === s.n ? "0.5px solid var(--green-500)" : "0",
                  }}>{step > s.n ? <IcCheck size={11} /> : s.n}</span>
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
      )}

      {/* Step 1 */}
      {step === 1 && (
        <Card title="Upload your CSV"
              subtitle="We accept .csv or .tsv up to 50 MB. Phone numbers can be in any format — we'll normalise to E.164 in the next step.">
          <div style={{
            border: "1.5px dashed var(--green-200)",
            borderRadius: 12,
            padding: 40,
            background: "var(--green-50)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            minHeight: 240,
            justifyContent: "center",
            cursor: "pointer",
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, background: "var(--green-100)", color: "var(--green-700)",
              display: "grid", placeItems: "center",
            }}>
              <IcUpload size={20} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Drop your CSV here, or click to browse</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Accepts .csv or .tsv · max 50 MB</div>
          </div>

          <div className="row" style={{ gap: 12, padding: "14px 12px", border: "0.5px solid var(--border)", borderRadius: 8, marginTop: 16 }}>
            <span style={{ width: 36, height: 36, borderRadius: 8, background: "var(--bg-hover)", display: "grid", placeItems: "center", color: "var(--text-muted)" }}>
              <IcFile size={16} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="mono" style={{ fontSize: 13, fontWeight: 500 }}>raya_vip_list.csv</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>240 KB · 1,820 rows detected · UTF-8 · 5 columns</div>
            </div>
            <Pill tone="green" dot>Valid</Pill>
            <IconButton icon={<IcX size={14} />} title="Remove" size="sm" />
          </div>

          <div className="row" style={{ justifyContent: "flex-end", marginTop: 16, gap: 8 }}>
            <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={() => setStep(2)}>Continue <IcChevR size={13} /></Button>
          </div>
        </Card>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <Card title="Map columns to fields" subtitle="Auto-detected mappings are highlighted. Mark unused columns as Skip.">
          <div className="table-scroll">
            <table className="table" style={{ minWidth: 720 }}>
              <colgroup>
                <col style={{ width: "28%" }} />
                <col style={{ width: "32%" }} />
                <col style={{ width: "26%" }} />
                <col style={{ width: "14%" }} />
              </colgroup>
              <thead>
                <tr><th>CSV column</th><th>Sample values</th><th>Map to field</th><th>Status</th></tr>
              </thead>
              <tbody>
                {[
                  { csv: "nama_penuh",  sample: ["Nurul Izzah", "Ahmad Faizal", "Lim Wei Jie"],   field: "Name",  detected: true },
                  { csv: "no_telefon",  sample: ["012-345 6789", "+60135127780", "0188-321 0098"], field: "Phone", detected: true, preview: "→ +60 12 345 6789" },
                  { csv: "email",       sample: ["nurul@…", "ahmad@…", "wei@…"],                    field: "Email", detected: true },
                  { csv: "negeri",      sample: ["Selangor", "WP Kuala Lumpur", "Pulau Pinang"],    field: "State (custom)", detected: true },
                  { csv: "bahasa",      sample: ["ms", "ms", "en"],                                  field: "Language", detected: true },
                  { csv: "notes_lama",  sample: ["VIP since 2021", "—", "loyal"],                    field: "Skip", detected: false },
                ].map((r, i) => (
                  <tr key={i}>
                    <td className="mono" style={{ fontSize: 12, fontWeight: 500 }}>{r.csv}</td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {r.sample.join(", ")}
                      {r.preview && <div style={{ marginTop: 4, color: "var(--green-700)", fontFamily: "var(--mono)", fontSize: 11 }}>{r.preview}</div>}
                    </td>
                    <td>
                      <select className="select" defaultValue={r.field} style={r.detected ? { borderColor: "var(--green-500)", background: "var(--green-50)" } : null}>
                        <option>Name</option>
                        <option>Phone</option>
                        <option>Email</option>
                        <option>Tags</option>
                        <option>Language</option>
                        <option>State (custom)</option>
                        <option>City (custom)</option>
                        <option>Skip</option>
                      </select>
                    </td>
                    <td>{r.detected ? <Pill tone="green">Auto</Pill> : <Pill tone="gray">Manual</Pill>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 16, padding: 12, background: "var(--bg-subtle)", border: "0.5px solid var(--border)", borderRadius: 8 }}>
            <div className="row" style={{ gap: 10 }}>
              <span className="dot green" />
              <span style={{ fontSize: 13, fontWeight: 500 }}>1,798 valid rows</span>
              <span style={{ color: "var(--text-muted)", fontSize: 12 }}>·</span>
              <span className="dot red" />
              <span style={{ fontSize: 13, fontWeight: 500 }}>22 invalid</span>
              <span className="spacer" />
              <Button variant="ghost" size="sm" icon={<IcDownload size={12} />}>Download invalid rows</Button>
            </div>
            <details style={{ marginTop: 8 }}>
              <summary style={{ fontSize: 12, color: "var(--text-muted)", cursor: "pointer" }}>22 issues — expand</summary>
              <div style={{ marginTop: 8, fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-muted)", lineHeight: 1.7 }}>
                Row 41: phone "01-2345" too short<br/>
                Row 67: phone empty<br/>
                Row 102: invalid email "ali@@gmail"<br/>
                Row 188: duplicate phone (matches row 12)<br/>
                <span style={{ color: "var(--text-subtle)" }}>… and 18 more</span>
              </div>
            </details>
          </div>

          <div className="row" style={{ justifyContent: "space-between", marginTop: 16 }}>
            <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <div className="row" style={{ gap: 8 }}>
              <Button variant="secondary" size="sm" onClick={() => setStep(1)} icon={<IcChevL size={13} />}>Back</Button>
              <Button variant="primary" size="sm" onClick={() => setStep(3)}>Continue <IcChevR size={13} /></Button>
            </div>
          </div>
        </Card>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <Card title="Review & confirm" subtitle="A summary before we touch your contacts list.">
          <div className="grid-3" style={{ marginBottom: 16 }}>
            <Stat label="To import" value="1,798" foot="new contacts" />
            <Stat label="Duplicates" value="14" foot="will be merged" />
            <Stat label="Invalid" value="22" foot="will be skipped" />
          </div>

          <div className="field" style={{ marginBottom: 12 }}>
            <label className="field-label">Default opt-in</label>
            <div className="row" style={{ gap: 12 }}>
              <Switch on={true} onChange={() => null} />
              <span style={{ fontSize: 13 }}>Mark all as <b>opted in</b> with today's date</span>
            </div>
            <div className="field-hint">Only enable if you have evidence of consent. PDPA requires proof of opt-in.</div>
          </div>

          <div className="field">
            <label className="field-label">Tag for this batch</label>
            <input className="input" defaultValue="imported_2025_10_21" />
            <div className="field-hint">Imported contacts will be tagged with this value so you can find them later.</div>
          </div>

          <div className="row" style={{ justifyContent: "space-between", marginTop: 20 }}>
            <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <div className="row" style={{ gap: 8 }}>
              <Button variant="secondary" size="sm" onClick={() => setStep(2)} icon={<IcChevL size={13} />}>Back</Button>
              <Button variant="primary" size="sm" icon={<IcUpload size={13} />} onClick={() => setStep(4)}>
                Import 1,798 contacts
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Step 4 — progress */}
      {step === 4 && (
        <Card title="Importing…" subtitle="Don't close this tab. Roughly 30 seconds remaining.">
          <div className="col" style={{ gap: 16 }}>
            <div>
              <div className="row" style={{ justifyContent: "space-between", marginBottom: 6, fontSize: 12 }}>
                <span>Inserting rows · {Math.round((progress / 100) * 1798).toLocaleString()} of 1,798</span>
                <span style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
            <div style={{ padding: 12, background: "var(--bg-subtle)", borderRadius: 8, fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-muted)", lineHeight: 1.8 }}>
              ✓ Validated 1,820 rows<br/>
              ✓ Normalised phone numbers to E.164<br/>
              {progress > 30 && <>✓ Deduplicated 14 matches against existing contacts<br/></>}
              {progress > 60 && <>✓ Inserted {Math.round((progress / 100) * 1798).toLocaleString()} new contacts<br/></>}
              {progress > 80 && <>✓ Tagged with <code>imported_2025_10_21</code><br/></>}
              {progress >= 100 && <span style={{ color: "var(--green-600)" }}>✓ Done.</span>}
            </div>
          </div>
        </Card>
      )}

      {/* Step 5 — success */}
      {step === 5 && (
        <Card>
          <Empty icon={<span style={{ color: "var(--green-500)" }}><IcCheckCircle size={24} /></span>}
                 title="Imported 1,798 contacts"
                 body="14 merged with existing contacts. 22 skipped (download the report from the toast)."
                 cta={
                   <div className="row" style={{ gap: 8 }}>
                     <Button variant="primary" size="sm" icon={<IcUsers size={13} />} onClick={onClose}>View contacts (filtered)</Button>
                     <Button variant="secondary" size="sm" icon={<IcPlus size={13} />} onClick={onClose}>Create segment from tag</Button>
                   </div>
                 } />
        </Card>
      )}

      {toastNode}
    </Page>
  );
}

Object.assign(window, { ScreenImportWizard });
