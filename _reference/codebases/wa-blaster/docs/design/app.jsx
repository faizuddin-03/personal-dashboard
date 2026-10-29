// app.jsx — main App: routing + URL sync + keyboard shortcuts + tweaks + theme.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "role": "admin",
  "theme": "light",
  "sidebar": "expanded",
  "populated": true,
  "showBadges": true,
  "quality": "high",
  "errorMode": false
}/*EDITMODE-END*/;

const VALID_ROUTES = new Set([
  "workflows", "inbox", "overview", "contacts", "import", "segments", "segment-builder",
  "templates", "campaigns", "campaign-new",
  "campaign-detail-sending", "campaign-detail-complete", "campaign-detail-failed",
  "reports", "compare", "users", "audit", "knowledge", "settings",
  "helpline", "status",
]);

function readRouteFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const r = params.get("r");
    if (r && VALID_ROUTES.has(r)) return r;
  } catch (e) {}
  return "inbox";
}

function writeRouteToUrl(r) {
  try {
    const params = new URLSearchParams(window.location.search);
    params.set("r", r);
    const newUrl = window.location.pathname + "?" + params.toString() + window.location.hash;
    window.history.replaceState(null, "", newUrl);
  } catch (e) {}
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, _setRoute] = useState(() => readRouteFromUrl());
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [importStep, setImportStep] = useState(1);
  const [drilldown, setDrilldown] = useState(null);

  // ── URL param overrides (for the design review document) ───────────────
  // ?empty=1   - force populated=false
  // ?error=1   - force error-state screen
  // ?help=1    - open shortcuts dialog on load
  // ?palette=1 - open command palette on load
  // ?theme=dark - force theme
  // ?role=operator - force role
  const urlParams = useMemo(() => {
    try { return new URLSearchParams(window.location.search); } catch { return new URLSearchParams(); }
  }, []);
  const forceEmpty   = urlParams.get("empty") === "1";
  const forceError   = urlParams.get("error") === "1";
  const forceHelp    = urlParams.get("help") === "1";
  const forcePalette = urlParams.get("palette") === "1";
  const forceTheme   = urlParams.get("theme");
  const forceRole    = urlParams.get("role");

  useEffect(() => {
    if (forceHelp) setHelpOpen(true);
    if (forcePalette) setPaletteOpen(true);
  }, [forceHelp, forcePalette]);

  const collapsed = t.sidebar === "collapsed";

  // Wrapper that also syncs to URL
  const setRoute = useCallback((r) => {
    _setRoute(r);
    writeRouteToUrl(r);
  }, []);

  // Apply theme via data-theme on <html>
  useEffect(() => {
    const eff = forceTheme || t.theme;
    document.documentElement.setAttribute("data-theme", eff);
  }, [t.theme, forceTheme]);

  // Back/forward support
  useEffect(() => {
    const onPop = () => _setRoute(readRouteFromUrl());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Inbox keyboard refs
  const inboxHandlersRef = useRef({});
  const setInboxHandlers = useCallback((h) => { inboxHandlersRef.current = h || {}; }, []);

  // Global keyboard shortcuts
  useKeyboardShortcuts({
    route, setRoute,
    openPalette: () => setPaletteOpen(true),
    openHelp:    () => setHelpOpen(true),
    openSettings: () => setRoute("settings"),
    scope: route === "inbox" ? "inbox" : null,
    inboxHandlers: {
      next:    () => inboxHandlersRef.current.next    && inboxHandlersRef.current.next(),
      prev:    () => inboxHandlersRef.current.prev    && inboxHandlersRef.current.prev(),
      resolve: () => inboxHandlersRef.current.resolve && inboxHandlersRef.current.resolve(),
      approve: () => inboxHandlersRef.current.approve && inboxHandlersRef.current.approve(),
    },
  });

  const role = forceRole || t.role;
  const populated = forceEmpty ? false : t.populated;
  const errorMode = forceError || t.errorMode;

  const badges = {
    inbox: t.showBadges ? CONVERSATIONS.filter(c => c.state === "esc" || c.state === "new").length : 0,
    templates: t.showBadges ? TEMPLATES.filter(x => x.status === "pending").length : 0,
  };

  // If operator hits an admin route, redirect to inbox
  useEffect(() => {
    if (role !== "admin" && ["users", "audit", "knowledge"].includes(route)) {
      setRoute("inbox");
    }
  }, [role, route, setRoute]);

  const renderScreen = () => {
    if (errorMode && ["overview", "reports", "campaigns", "templates", "contacts"].includes(route)) {
      return (
        <Page>
          <Card style={{ marginTop: 40 }}>
            <ErrorState
              title="Couldn't reach the WhatsApp API"
              body="Check your access token in Settings → Connectors. The dashboard will retry every 30 seconds in the background."
              detail="403 Forbidden · token expired 14 minutes ago"
              cta={
                <div className="row" style={{ gap: 8 }}>
                  <Button variant="secondary" size="sm" icon={<IcRefresh size={13} />}>Retry now</Button>
                  <Button variant="primary" size="sm" icon={<IcSettings size={13} />} onClick={() => setRoute("settings")}>Open Settings</Button>
                </div>
              } />
          </Card>
        </Page>
      );
    }
    switch (route) {
      case "workflows": return <ScreenWorkflows setRoute={setRoute} setSub={setImportStep} />;
      case "inbox":     return <ScreenInbox     role={role} populated={populated} showBadges={t.showBadges} registerHandlers={setInboxHandlers} />;
      case "overview":  return <ScreenOverview  role={role} populated={populated} />;
      case "contacts":  return <ScreenContacts  role={role} populated={populated} onImport={() => setRoute("import")} />;
      case "import":    return <ScreenImportWizard initialStep={importStep} onClose={() => { setImportStep(1); setRoute("contacts"); }} />;
      case "segments":  return <ScreenSegments  role={role} populated={populated} onNew={() => setRoute("segment-builder")} />;
      case "segment-builder": return <ScreenSegmentBuilder role={role} onClose={() => setRoute("segments")} />;
      case "templates": return <ScreenTemplates role={role} populated={populated} />;
      case "campaigns": return <ScreenCampaigns role={role} populated={populated} onOpenDetail={(state) => setRoute("campaign-detail-" + state)} />;
      case "campaign-new":            return <ScreenCampaigns role={role} populated={populated} initialView="compose" onOpenDetail={(state) => setRoute("campaign-detail-" + state)} />;
      case "campaign-detail-sending":  return <ScreenCampaignDetail state="sending"  onBack={() => setRoute("campaigns")} />;
      case "campaign-detail-complete": return <ScreenCampaignDetail state="complete" onBack={() => setRoute("campaigns")} />;
      case "campaign-detail-failed":   return <ScreenCampaignDetail state="failed"   onBack={() => setRoute("campaigns")} />;
      case "reports":   return <ScreenReports   role={role} populated={populated}
                                                  onCompare={() => setRoute("compare")}
                                                  onDrilldown={(kpi) => setDrilldown(kpi)} />;
      case "compare":   return <ScreenCompare onBack={() => setRoute("reports")} />;
      case "users":     return <ScreenUsers     role={role} populated={populated} />;
      case "audit":     return <ScreenAudit     role={role} />;
      case "knowledge": return <ScreenKnowledge role={role} />;
      case "settings":  return <ScreenSettings  role={role} />;
      case "helpline":  return <ScreenHelpline />;
      case "status":    return <ScreenStatus />;
      default:          return <ScreenInbox role={role} populated={populated} showBadges={t.showBadges} registerHandlers={setInboxHandlers} />;
    }
  };

  return (
    <div className="app" data-sidebar={collapsed ? "collapsed" : "expanded"}>
      <Sidebar route={route} setRoute={setRoute}
               collapsed={collapsed}
               setCollapsed={(v) => setTweak("sidebar", v ? "collapsed" : "expanded")}
               role={role} badges={badges} />
      <TopBar route={route} role={role}
              theme={t.theme} setTheme={(v) => setTweak("theme", v)}
              qualityRating={t.quality}
              setRoute={setRoute}
              onSearchOpen={() => setPaletteOpen(true)}
              onHelpOpen={() => setHelpOpen(true)} />
      <div className="main" data-screen-label={route}>{renderScreen()}</div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} setRoute={setRoute} />
      <ShortcutsHelp open={helpOpen} onClose={() => setHelpOpen(false)} />
      <KpiDrilldown open={!!drilldown} kpi={drilldown} onClose={() => setDrilldown(null)} />
      <SequenceIndicator />

      <TweaksPanel title="Tweaks">
        <TweakSection label="Workspace" />
        <TweakRadio label="Role" value={t.role} options={["operator", "admin"]} onChange={(v) => setTweak("role", v)} />
        <TweakRadio label="Theme" value={t.theme} options={["light", "dark"]} onChange={(v) => setTweak("theme", v)} />
        <TweakRadio label="Sidebar" value={t.sidebar} options={["expanded", "collapsed"]} onChange={(v) => setTweak("sidebar", v)} />

        <TweakSection label="State" />
        <TweakToggle label="Populated data" value={t.populated} onChange={(v) => setTweak("populated", v)} />
        <TweakToggle label="Show badges & unread" value={t.showBadges} onChange={(v) => setTweak("showBadges", v)} />
        <TweakToggle label="Error state" value={t.errorMode} onChange={(v) => setTweak("errorMode", v)} />
        <TweakRadio label="Quality rating" value={t.quality} options={["high", "medium", "low"]} onChange={(v) => setTweak("quality", v)} />

        <TweakSection label="Jump to" />
        <TweakSelect label="Screen" value={route} options={[
          { value: "workflows", label: "Daily playbook (Help)" },
          { value: "inbox",     label: "Inbox" },
          { value: "overview",  label: "Overview" },
          { value: "contacts",  label: "Contacts" },
          { value: "import",    label: "— Import wizard" },
          { value: "segments",  label: "Segments" },
          { value: "segment-builder", label: "— Segment builder" },
          { value: "templates", label: "Templates" },
          { value: "campaigns", label: "Campaigns" },
          { value: "campaign-new", label: "— Campaign composer" },
          { value: "campaign-detail-sending",  label: "— Campaign detail (sending)" },
          { value: "campaign-detail-complete", label: "— Campaign detail (complete)" },
          { value: "campaign-detail-failed",   label: "— Campaign detail (failed)" },
          { value: "reports",   label: "Reports" },
          { value: "compare",   label: "— Compare campaigns" },
          { value: "knowledge", label: "Knowledge (admin)" },
          { value: "users",     label: "Users (admin)" },
          { value: "audit",     label: "Audit (admin)" },
          { value: "settings",  label: "Settings" },
          { value: "helpline",  label: "Helpline" },
          { value: "status",    label: "System status" },
        ]} onChange={(v) => setRoute(v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
