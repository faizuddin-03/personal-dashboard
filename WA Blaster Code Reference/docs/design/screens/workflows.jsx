// screens/workflows.jsx — flow diagrams for the three core daily workflows.
// Each step is a clickable node that navigates the prototype to the matching screen.

function ScreenWorkflows({ setRoute, setSub }) {
  const flows = [
    {
      id: "A",
      title: "Import contacts → tag → segment",
      time: "≈ 3 min for a 500-row CSV",
      hero: "Get a new opt-in list ready to send to.",
      color: "var(--green-500)",steps: [
        { label: "Contacts",       caption: "Click Import CSV",      icon: <IcUsers size={14} />,    go: () => setRoute("contacts") },
        { label: "Upload",         caption: "Drop file",              icon: <IcUpload size={14} />,   go: () => { setRoute("import"); setSub && setSub(1); } },
        { label: "Map columns",    caption: "Phone → +60…",          icon: <IcCorner size={14} />,   go: () => { setRoute("import"); setSub && setSub(2); } },
        { label: "Review",         caption: "Confirm count",          icon: <IcCheckCircle size={14} />, go: () => { setRoute("import"); setSub && setSub(3); } },
        { label: "Importing…",     caption: "Live progress",          icon: <IcRefresh size={14} />,  go: () => { setRoute("import"); setSub && setSub(4); } },
        { label: "Contacts (filtered)", caption: "Auto-filter to import", icon: <IcFilter size={14} />, go: () => setRoute("contacts") },
        { label: "Bulk: add tag",  caption: "Select all → tag",       icon: <IcTag size={14} />,      go: () => setRoute("contacts") },
        { label: "New segment",    caption: "Tag-based",              icon: <IcPlus size={14} />,     go: () => setRoute("segment-builder") },
      ],
    },
    {
      id: "B",
      title: "Create campaign → schedule → monitor",
      time: "≈ 5 min · highest stakes",
      hero: "Launching is irreversible. Friction is intentional.",
      color: "var(--blue-500)",
      steps: [
        { label: "Campaigns",      caption: "Click New campaign",     icon: <IcSend size={14} />,     go: () => setRoute("campaigns") },
        { label: "Name + segment", caption: "Live count",             icon: <IcEdit3 size={14} />,    go: () => setRoute("campaign-new") },
        { label: "Template",       caption: "Variables + preview",    icon: <IcFile size={14} />,     go: () => setRoute("campaign-new") },
        { label: "Schedule",       caption: "Now / later / smart",    icon: <IcCalendar size={14} />, go: () => setRoute("campaign-new") },
        { label: "Review",         caption: "Quota + cost check",     icon: <IcCheckCircle size={14} />, go: () => setRoute("campaign-new") },
        { label: "Launch dialog",  caption: "Heavy friction",         icon: <IcAlert size={14} />,    tone: "warn", go: () => setRoute("campaign-new") },
        { label: "Detail · sending", caption: "Live progress",        icon: <IcActivity size={14} />, go: () => setRoute("campaign-detail-sending") },
        { label: "Detail · done",  caption: "Final report",           icon: <IcBar size={14} />,      go: () => setRoute("campaign-detail-complete") },
      ],
      altEnd: { label: "Detail · failed", caption: "Reason + retry",   icon: <IcAlert size={14} />, tone: "danger", go: () => setRoute("campaign-detail-failed") },
    },
    {
      id: "C",
      title: "Review reports → compare → export",
      time: "≈ 2 min",
      hero: "Look back across last 30–90 days, then dig in.",
      color: "var(--green-700)",
      steps: [
        { label: "Reports",        caption: "KPI strip + table",      icon: <IcBar size={14} />,      go: () => setRoute("reports") },
        { label: "Date range 90d", caption: "Cards refresh",          icon: <IcCalendar size={14} />, go: () => setRoute("reports") },
        { label: "Sort by delivery", caption: "Sortable column",      icon: <IcChevD size={14} />,    go: () => setRoute("reports") },
        { label: "Select 2 rows",  caption: "Compare button arms",    icon: <IcCheck size={14} />,    go: () => setRoute("reports") },
        { label: "Compare view",   caption: "Side-by-side",           icon: <IcChevsLR size={14} />,  go: () => setRoute("compare") },
        { label: "Export Excel",   caption: "Downloads .xlsx",        icon: <IcDownload size={14} />, go: () => setRoute("compare") },
        { label: "KPI drill-down", caption: "Sheet opens",            icon: <IcExternal size={14} />, go: () => setRoute("reports") },
      ],
    },
  ];

  return (
    <Page>
      <PageHead title="Daily playbook"
                subtitle="Three core workflows mapped end-to-end. Click any step to jump into that screen — this is reference material to return to, not a one-time onboarding."
                actions={<Button variant="ghost" size="sm" icon={<IcDownload size={13} />}>Export PDF</Button>} />

      <div className="col" style={{ gap: 24 }}>
        {flows.map((f) => (
          <FlowCard key={f.id} flow={f} />
        ))}
      </div>

      <div style={{ marginTop: 24, padding: 14, background: "var(--bg-subtle)", borderRadius: 8, fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 10 }}>
        <IcInfo size={13} />
        Every step is clickable. State is preserved on return — try opening a flow, jumping mid-step, then coming back.
      </div>
    </Page>
  );
}

function FlowCard({ flow }) {
  return (
    <div className="card flow-card">
      <div className="flow-card-head" style={{ borderLeft: `3px solid ${flow.color}` }}>
        <div className="flow-id" style={{ color: flow.color }}>Workflow {flow.id}</div>
        <div>
          <div className="flow-title">{flow.title}</div>
          <div className="flow-hero">{flow.hero}</div>
        </div>
        <span className="spacer" />
        <Pill tone="gray"><IcClock size={11} /> {flow.time}</Pill>
      </div>

      <div className="flow-track">
        {flow.steps.map((s, i) => (
          <React.Fragment key={i}>
            <FlowNode n={i + 1} step={s} accent={flow.color} />
            {i < flow.steps.length - 1 && <FlowArrow />}
          </React.Fragment>
        ))}
        {flow.altEnd && (
          <>
            <div className="flow-branch">or</div>
            <FlowNode n={flow.steps.length} step={flow.altEnd} accent={flow.color} />
          </>
        )}
      </div>
    </div>
  );
}

function FlowNode({ n, step, accent }) {
  const toneClass = step.tone === "warn"   ? "warn"
                  : step.tone === "danger" ? "danger"
                  : "default";
  return (
    <button className="flow-node" data-tone={toneClass} onClick={step.go}>
      <div className="flow-node-head">
        <span className="flow-node-num" style={toneClass === "default" ? { color: accent } : null}>{String(n).padStart(2, "0")}</span>
        <span className="flow-node-icon" style={toneClass === "default" ? { color: accent } : null}>{step.icon}</span>
      </div>
      <div className="flow-node-label">{step.label}</div>
      <div className="flow-node-caption">{step.caption}</div>
    </button>
  );
}

function FlowArrow() {
  return (
    <span className="flow-arrow" aria-hidden="true">
      <svg width="20" height="10" viewBox="0 0 20 10" fill="none">
        <path d="M0 5 H17" stroke="currentColor" strokeWidth="1" />
        <path d="M13 1 L17 5 L13 9" stroke="currentColor" strokeWidth="1" fill="none" strokeLinejoin="round" strokeLinecap="round"/>
      </svg>
    </span>
  );
}

Object.assign(window, { ScreenWorkflows });
