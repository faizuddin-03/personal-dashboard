// shell.jsx — Sidebar + TopBar layout chrome.

function Sidebar({ route, setRoute, collapsed, setCollapsed, role, badges }) {
  const main = [
    { id: "inbox",     label: "Inbox",       icon: <IcMessage size={18} />,  badge: badges.inbox },
    { id: "contacts",  label: "Contacts",    icon: <IcUsers size={18} /> },
    { id: "segments",  label: "Segments",    icon: <IcFilter size={18} /> },
    { id: "templates", label: "Templates",   icon: <IcFile size={18} />,    badge: badges.templates },
    { id: "campaigns", label: "Campaigns",   icon: <IcSend size={18} /> },
    { id: "reports",   label: "Reports",     icon: <IcBar size={18} /> },
    { id: "knowledge", label: "Knowledge",   icon: <IcBook size={18} />,    admin: true },
    { id: "settings",  label: "Settings",    icon: <IcSettings size={18} /> },
  ];
  const admin = [
    { id: "users",     label: "Users & roles", icon: <IcShield size={18} />,  admin: true },
    { id: "audit",     label: "Audit log",     icon: <IcList size={18} />,    admin: true },
  ];
  const second = [
    { id: "workflows", label: "Daily playbook", icon: <IcZap size={18} /> },
    { id: "helpline",  label: "Helpline",       icon: <IcPhone size={18} /> },
    { id: "status",    label: "System status",  icon: <IcActivity size={18} /> },
  ];
  const Item = ({ item }) => {
    const active = route === item.id;
    const locked = item.admin && role !== "admin";
    return (
      <button className="nav-item" data-active={active}
              title={collapsed ? item.label + (locked ? " (admin only)" : "") : ""}
              onClick={() => { if (!locked) setRoute(item.id); }}
              style={locked ? { opacity: 0.55, cursor: "not-allowed" } : null}>
        {item.icon}
        <span className="nav-label">{item.label}</span>
        {locked
          ? <IcLock size={11} style={{ color: "var(--text-subtle)" }} />
          : (item.badge != null && item.badge > 0 && <span className="nav-badge">{item.badge}</span>)}
      </button>
    );
  };
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-mark">
          <IcMessage size={16} />
        </span>
        <span className="sidebar-brand-name">Blaster</span>
        <span className="sidebar-brand-env">prod</span>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-label">Workspace</div>
        <div className="sidebar-nav">
          {main.map((it) => <Item key={it.id} item={it} />)}
        </div>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-label">Admin</div>
        <div className="sidebar-nav">
          {admin.map((it) => <Item key={it.id} item={it} />)}
        </div>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-label">Help</div>
        <div className="sidebar-nav">
          {second.map((it) => <Item key={it.id} item={it} />)}
        </div>
      </div>

      <div className="sidebar-foot">
        <button className="sidebar-collapse-btn" onClick={() => setCollapsed(!collapsed)}
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
          {collapsed ? <IcChevsLR size={14} /> : <IcChevsRL size={14} />}
        </button>
        {!collapsed && (
          <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
            <span className="dot green" />
            All systems operational
          </div>
        )}
      </div>
    </aside>
  );
}

const ROUTE_META = {
  workflows: { crumbs: ["Help", "Daily playbook"], title: "Daily playbook" },
  inbox:     { crumbs: ["Inbox"],     title: "Inbox" },
  contacts:  { crumbs: ["Contacts"],  title: "Contacts" },
  import:    { crumbs: ["Contacts", "Import"], title: "Import contacts" },
  segments:  { crumbs: ["Segments"],  title: "Segments" },
  "segment-builder": { crumbs: ["Segments", "New"], title: "New segment" },
  templates: { crumbs: ["Templates"], title: "Templates" },
  campaigns: { crumbs: ["Campaigns"], title: "Campaigns" },
  "campaign-new":            { crumbs: ["Campaigns", "New"], title: "New campaign" },
  "campaign-detail-sending": { crumbs: ["Campaigns", "Detail"], title: "Campaign detail" },
  "campaign-detail-complete":{ crumbs: ["Campaigns", "Detail"], title: "Campaign detail" },
  "campaign-detail-failed":  { crumbs: ["Campaigns", "Detail"], title: "Campaign detail" },
  reports:   { crumbs: ["Reports"],   title: "Reports" },
  compare:   { crumbs: ["Reports", "Compare"], title: "Compare" },
  settings:  { crumbs: ["Settings"],  title: "Settings" },
  users:     { crumbs: ["Admin", "Users & roles"], title: "Users & roles" },
  audit:     { crumbs: ["Admin", "Audit log"],     title: "Audit log" },
  knowledge: { crumbs: ["Knowledge base"],         title: "Chatbot knowledge" },
  overview:  { crumbs: ["Overview"], title: "Overview" },
  helpline:  { crumbs: ["Help", "Helpline"], title: "Helpline" },
  status:    { crumbs: ["Help", "System status"], title: "System status" },
};

function TopBar({ route, role, setRole, onSearchOpen, onHelpOpen, theme, setTheme, qualityRating, setRoute }) {
  const meta = ROUTE_META[route] || { crumbs: [route] };
  const user = role === "admin"
    ? { name: "Aisyah Rahman", initials: "AR", role: "Admin", email: "aisyah@modefair.com" }
    : { name: "Daniel Ng",     initials: "DN", role: "Operator", email: "daniel@modefair.com" };

  return (
    <header className="topbar">
      <div className="crumbs">
        <IcHome size={13} style={{ color: "var(--text-subtle)" }} />
        {meta.crumbs.map((c, i) => (
          <React.Fragment key={i}>
            <IcChevR size={11} className="crumb-sep" />
            <span className={i === meta.crumbs.length - 1 ? "crumb-cur" : ""}>{c}</span>
          </React.Fragment>
        ))}
      </div>
      <span className="grow" />

      <button className="search" onClick={onSearchOpen}
              style={{ border: "0.5px solid var(--border)", cursor: "text" }}>
        <IcSearch size={14} />
        <span style={{ flex: 1, textAlign: "left" }}>Search contacts, campaigns, templates…</span>
        <span className="kbd">⌘K</span>
      </button>

      <span className="grow" />

      <div className="topbar-actions">
        <Pill tone={qualityRating === "high" ? "green" : qualityRating === "medium" ? "amber" : "red"} dot>
          Quality: {qualityRating}
        </Pill>
        <IconButton icon={<IcCommand size={16} />} title="Keyboard shortcuts (?)" onClick={onHelpOpen} />
        <IconButton icon={theme === "dark" ? <IcSun size={16} /> : <IcMoon size={16} />}
                    title={theme === "dark" ? "Light mode" : "Dark mode"}
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")} />
        <span style={{ width: 0.5, height: 22, background: "var(--border)" }} />
        <UserMenu user={user} role={role} theme={theme} setTheme={setTheme}
                  setRoute={setRoute} onHelpOpen={onHelpOpen} />
      </div>
    </header>
  );
}

// ── User menu (trigger + dropdown) ─────────────────────────────────────────
function UserMenu({ user, role, theme, setTheme, setRoute, onHelpOpen }) {
  const [open, setOpen] = useState(false);
  const [submenu, setSubmenu] = useState(null); // "appearance" | null
  const [cursor, setCursor] = useState(-1);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [whatsnewOpen, setWhatsnewOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const [pushToast, toastNode] = useToast();

  // The menu items as data (order matters for keyboard nav)
  const items = useMemo(() => ([
    { id: "profile",       label: "My profile",            icon: <IcUser size={16} />,    action: () => { setRoute && setRoute("settings"); close(); } },
    { id: "notifications", label: "Notification preferences", icon: <IcBell size={16} />, action: () => { setRoute && setRoute("settings"); close(); } },
    { id: "shortcuts",     label: "Keyboard shortcuts",    icon: <IcCommand size={16} />, foot: "?", action: () => { onHelpOpen && onHelpOpen(); close(); } },
    { id: "appearance",    label: "Appearance",            icon: theme === "dark" ? <IcMoon size={16} /> : <IcSun size={16} />, hasSubmenu: true,
                           action: () => setSubmenu(submenu === "appearance" ? null : "appearance") },
    { divider: true,       id: "div1" },
    { id: "help",          label: "Help & documentation",  icon: <IcHelp size={16} />,    foot: "↗", action: () => { window.open("https://example.com", "_blank"); close(); } },
    { id: "whatsnew",      label: "What's new",            icon: <IcSparkle size={16} />, action: () => { setWhatsnewOpen(true); close(); } },
    { id: "report",        label: "Report a problem",      icon: <IcWarnMsg size={16} />, action: () => { setReportOpen(true); close(); } },
    { divider: true,       id: "div2" },
    { id: "signout",       label: "Sign out",              icon: <IcLogout size={16} />, destructive: true,
                           action: () => { setSignOutOpen(true); close(); } },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ]), [theme, submenu, setRoute, onHelpOpen]);

  const focusableIdx = items.map((it, i) => it.divider ? null : i).filter(i => i !== null);

  const close = () => { setOpen(false); setSubmenu(null); setCursor(-1); };

  // Click outside
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)
          && triggerRef.current && !triggerRef.current.contains(e.target)) {
        close();
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  // Keyboard nav inside the menu
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") { e.preventDefault(); close(); triggerRef.current?.focus(); return; }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const curPos = focusableIdx.indexOf(cursor);
        const next = focusableIdx[(curPos + 1) % focusableIdx.length] ?? focusableIdx[0];
        setCursor(next);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const curPos = focusableIdx.indexOf(cursor);
        const prev = focusableIdx[(curPos - 1 + focusableIdx.length) % focusableIdx.length] ?? focusableIdx[focusableIdx.length - 1];
        setCursor(prev);
      } else if (e.key === "Enter" && cursor >= 0 && items[cursor]) {
        e.preventDefault();
        items[cursor].action && items[cursor].action();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, cursor, items, focusableIdx]);

  // Reset cursor when menu opens
  useEffect(() => { if (open) setCursor(focusableIdx[0] ?? -1); }, [open]);

  const themeOptions = [
    { id: "light",  label: "Light",  icon: <IcSun size={14} /> },
    { id: "dark",   label: "Dark",   icon: <IcMoon size={14} /> },
    { id: "system", label: "System", icon: <IcMonitor size={14} /> },
  ];

  const handleThemeChoice = (id) => {
    if (id === "system") {
      const prefers = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(prefers ? "dark" : "light");
    } else {
      setTheme(id);
    }
    pushToast("Appearance set to " + id);
  };

  return (
    <>
      <button ref={triggerRef} className="usermenu" data-open={open ? "true" : "false"}
              aria-haspopup="menu" aria-expanded={open}
              onClick={() => setOpen((v) => !v)} title="Account menu">
        <Avatar name={user.name} initials={user.initials} size="md" />
        <div className="who">
          <span className="name">{user.name}</span>
          <span className="role">{user.role} · Modefair</span>
        </div>
        <IcChevD size={12} className="chev" />

        {open && (
          <div ref={dropdownRef} className="um-dropdown" role="menu" onClick={(e) => e.stopPropagation()}>
            <div className="um-header">
              <Avatar name={user.name} initials={user.initials} size="lg" />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="who-name">{user.name}</div>
                <div className="who-email">{user.email}</div>
                <div className="who-pill">
                  <Pill tone={user.role === "Admin" ? "blue" : "gray"} icon={user.role === "Admin" ? <IcShield size={10} /> : null}>
                    {user.role}
                  </Pill>
                </div>
              </div>
            </div>

            <div className="um-list">
              {items.map((it, i) => {
                if (it.divider) return <div key={it.id} className="um-divider" />;
                const isActive = cursor === i;
                const isAppearanceOpen = it.id === "appearance" && submenu === "appearance";
                return (
                  <React.Fragment key={it.id}>
                    <button className="um-item"
                            data-active={isActive ? "true" : "false"}
                            data-destructive={it.destructive ? "true" : "false"}
                            role="menuitem"
                            onMouseEnter={() => setCursor(i)}
                            onClick={it.action}>
                      <span className="um-icon">{it.icon}</span>
                      <span className="um-label">{it.label}</span>
                      {it.foot && <span className="um-foot">{it.foot}</span>}
                      {it.hasSubmenu && (
                        <IcChevD size={12}
                                 style={{ color: "var(--text-muted)",
                                          transform: isAppearanceOpen ? "rotate(180deg)" : "rotate(0deg)",
                                          transition: "transform 0.12s" }} />
                      )}
                    </button>
                    {isAppearanceOpen && (
                      <div className="um-sub">
                        {themeOptions.map(t => (
                          <button key={t.id} className="um-sub-item"
                                  data-active={(t.id === theme || (t.id === "system" && false)) ? "true" : "false"}
                                  onClick={() => handleThemeChoice(t.id)}>
                            <span style={{ color: "var(--text-muted)", display: "inline-flex", marginRight: 8 }}>{t.icon}</span>
                            <span>{t.label}</span>
                            <span className="check"><IcCheck size={14} /></span>
                          </button>
                        ))}
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}
      </button>

      {/* Sign out confirmation */}
      <Dialog open={signOutOpen} onClose={() => setSignOutOpen(false)}
              title="Sign out?"
              tone="destructive"
              icon={<IcLogout size={16} />}
              width={400}
              footer={
                <>
                  <Button variant="ghost" size="sm" onClick={() => setSignOutOpen(false)}>Cancel</Button>
                  <Button variant="destructive" size="sm" icon={<IcLogout size={13} />}
                          onClick={() => { setSignOutOpen(false); pushToast("Signed out", { icon: <IcCheck size={14} /> }); setTimeout(() => { window.location.href = "login.html"; }, 600); }}>
                    Sign out
                  </Button>
                </>
              }>
        You'll need to sign back in to access the dashboard.
      </Dialog>

      {/* What's new sheet — placeholder for now, will design fully next pass */}
      <Sheet open={whatsnewOpen} onClose={() => setWhatsnewOpen(false)}
             title="What's new"
             subtitle="Recent updates to Blaster"
             footer={<Button variant="ghost" size="sm" onClick={() => setWhatsnewOpen(false)}>Close</Button>}>
        <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
          Changelog content — full design in the next pass.
        </div>
      </Sheet>

      {/* Report a problem dialog — placeholder */}
      <Dialog open={reportOpen} onClose={() => setReportOpen(false)}
              title="Report a problem"
              width={480}
              icon={<IcWarnMsg size={16} />}
              footer={
                <>
                  <Button variant="ghost" size="sm" onClick={() => setReportOpen(false)}>Cancel</Button>
                  <Button variant="primary" size="sm" onClick={() => { setReportOpen(false); pushToast("Report sent · thank you"); }}>Send report</Button>
                </>
              }>
        <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
          Form design — full design in the next pass.
        </div>
      </Dialog>

      {toastNode}
    </>
  );
}

// ── Command palette overlay ────────────────────────────────────────────────
function CommandPalette({ open, onClose, setRoute }) {
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  useEffect(() => { if (open && inputRef.current) inputRef.current.focus(); if (!open) { setQ(""); setCursor(0); } }, [open]);

  // Build the full flat result list, filtered by query
  const all = useMemo(() => {
    const groups = [];

    const isQuery = q.trim().length > 0;
    const ql = q.toLowerCase().trim();

    // Navigate
    const nav = [
      { id: "n-workflows", label: "Go to Workflows", icon: <IcZap size={14} />,     keys: ["Workflows"], action: () => setRoute("workflows") },
      { id: "n-inbox",     label: "Go to Inbox",     icon: <IcMessage size={14} />, keys: ["g", "i"],   action: () => setRoute("inbox") },
      { id: "n-contacts",  label: "Go to Contacts",  icon: <IcUsers size={14} />,   keys: ["g", "c"],   action: () => setRoute("contacts") },
      { id: "n-segments",  label: "Go to Segments",  icon: <IcFilter size={14} />,  keys: ["g", "s"],   action: () => setRoute("segments") },
      { id: "n-templates", label: "Go to Templates", icon: <IcFile size={14} />,    keys: ["g", "t"],   action: () => setRoute("templates") },
      { id: "n-campaigns", label: "Go to Campaigns", icon: <IcSend size={14} />,    keys: ["g", "p"],   action: () => setRoute("campaigns") },
      { id: "n-reports",   label: "Go to Reports",   icon: <IcBar size={14} />,     keys: ["g", "r"],   action: () => setRoute("reports") },
      { id: "n-settings",  label: "Open Settings",   icon: <IcSettings size={14} />, keys: ["Mod", ","], action: () => setRoute("settings") },
    ];
    groups.push({ group: "Navigate", items: nav });

    // Actions
    const actions = [
      { id: "a-newcamp", label: "New campaign",            icon: <IcPlus size={14} />,    action: () => setRoute("campaign-new") },
      { id: "a-newtmpl", label: "Submit new template",     icon: <IcPlus size={14} />,    action: () => setRoute("templates") },
      { id: "a-import",  label: "Import contacts (CSV)",   icon: <IcUpload size={14} />,  action: () => setRoute("import") },
      { id: "a-newseg",  label: "Create segment",          icon: <IcPlus size={14} />,    action: () => setRoute("segment-builder") },
    ];
    groups.push({ group: "Actions", items: actions });

    // Contacts
    if (isQuery && ql.length > 0) {
      const matched = CONTACTS.filter(c => c.name.toLowerCase().includes(ql) || c.phone.includes(ql)).slice(0, 6);
      if (matched.length) {
        groups.push({ group: "Contacts", items: matched.map(c => ({
          id: "c-" + c.id,
          label: c.name,
          foot: c.phone,
          icon: <Avatar name={c.name} size="sm" />,
          action: () => setRoute("contacts"),
        })) });
      }

      const cms = CAMPAIGNS.filter(c => c.name.toLowerCase().includes(ql) || c.template.includes(ql)).slice(0, 4);
      if (cms.length) {
        groups.push({ group: "Campaigns", items: cms.map(c => ({
          id: "cm-" + c.id, label: c.name, foot: c.template, icon: <IcSend size={14} />,
          action: () => setRoute(c.status === "complete" ? "campaign-detail-complete" : "campaign-detail-sending"),
        })) });
      }

      const tmpls = TEMPLATES.filter(t => t.name.includes(ql)).slice(0, 4);
      if (tmpls.length) {
        groups.push({ group: "Templates", items: tmpls.map(t => ({
          id: "t-" + t.id, label: t.name, foot: t.category + " · " + (t.language === "ms_MY" ? "MS" : "EN"), icon: <IcFile size={14} />,
          action: () => setRoute("templates"),
        })) });
      }

      const segs = SEGMENTS.filter(s => s.name.toLowerCase().includes(ql)).slice(0, 4);
      if (segs.length) {
        groups.push({ group: "Segments", items: segs.map(s => ({
          id: "s-" + s.id, label: s.name, foot: s.size.toLocaleString() + " contacts", icon: <IcFilter size={14} />,
          action: () => setRoute("segments"),
        })) });
      }
    } else {
      // No query — show "Recent"
      groups.push({ group: "Recent", items: [
        { id: "r1", label: "Merdeka flash 2× points", icon: <IcSend size={14} />,   foot: "Campaign · sending", action: () => setRoute("campaign-detail-sending") },
        { id: "r2", label: "raya_promo_2025",         icon: <IcFile size={14} />,   foot: "Template · pending", action: () => setRoute("templates") },
        { id: "r3", label: "VIP — Klang Valley",      icon: <IcFilter size={14} />, foot: "Segment · 842 contacts", action: () => setRoute("segments") },
        { id: "r4", label: "Nurul Izzah",             icon: <Avatar name="Nurul Izzah" size="sm" />, foot: "Contact · VIP", action: () => setRoute("inbox") },
      ]});
    }

    // Filter by query (label only, except contacts/campaigns/etc which we already filtered)
    if (isQuery) {
      for (const g of groups) {
        if (["Navigate", "Actions"].includes(g.group)) {
          g.items = g.items.filter(it => it.label.toLowerCase().includes(ql));
        }
      }
    }

    return groups.filter(g => g.items.length > 0);
  }, [q, setRoute]);

  // Flattened list for arrow keys
  const flat = useMemo(() => {
    const out = [];
    all.forEach(g => g.items.forEach(it => out.push(it)));
    return out;
  }, [all]);

  useEffect(() => { setCursor(0); }, [q]);

  useEffect(() => {
    const onKey = (e) => {
      if (!open) return;
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setCursor(c => Math.min(flat.length - 1, c + 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setCursor(c => Math.max(0, c - 1)); }
      else if (e.key === "Enter") {
        e.preventDefault();
        const item = flat[cursor];
        if (item && item.action) { item.action(); onClose(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, flat, cursor]);

  // Scroll cursor into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector(`[data-idx="${cursor}"]`);
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  if (!open) return null;

  let idx = -1;
  return (
    <div onClick={onClose}
         style={{
           position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.32)",
           backdropFilter: "blur(2px)",
           display: "grid", placeItems: "start center", paddingTop: 96, zIndex: 100,
         }}>
      <div onClick={(e) => e.stopPropagation()}
           style={{
             width: 600, maxWidth: "calc(100vw - 32px)",
             background: "var(--bg)", border: "0.5px solid var(--border)",
             borderRadius: 12, overflow: "hidden",
             boxShadow: "0 24px 48px rgba(0,0,0,0.18), 0 1px 0 rgba(255,255,255,0.05) inset",
           }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 14px", borderBottom: "0.5px solid var(--border)" }}>
          <IcSearch size={16} style={{ color: "var(--text-muted)" }} />
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)}
                 placeholder="Search contacts, campaigns, templates, segments…"
                 style={{ flex: 1, border: 0, outline: "none", background: "transparent", color: "var(--text)", fontSize: 14 }} />
          <span className="kbd">ESC</span>
        </div>
        <div ref={listRef} style={{ maxHeight: 380, overflowY: "auto" }}>
          {all.map(g => (
            <div key={g.group}>
              <div style={{ padding: "8px 14px 4px", fontSize: 11, color: "var(--text-subtle)", letterSpacing: "0.04em" }}>{g.group}</div>
              {g.items.map(it => {
                idx++;
                const active = idx === cursor;
                const localIdx = idx;
                return (
                  <button key={it.id} data-idx={localIdx}
                          onClick={() => { if (it.action) it.action(); onClose(); }}
                          onMouseEnter={() => setCursor(localIdx)}
                          style={{
                            width: "100%", display: "flex", alignItems: "center", gap: 10,
                            padding: "8px 14px", border: 0,
                            background: active ? "var(--bg-subtle)" : "transparent",
                            fontSize: 13, color: "var(--text)", textAlign: "left", cursor: "pointer",
                            fontFamily: "inherit",
                          }}>
                    <span style={{ color: "var(--text-muted)", display: "inline-flex" }}>{it.icon}</span>
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.label}</span>
                    {it.foot && <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{it.foot}</span>}
                    {it.keys && <ShortcutHint keys={it.keys} separator={it.keys.length > 1 && it.keys[0] === "g" ? " " : "+"} />}
                  </button>
                );
              })}
            </div>
          ))}
          {flat.length === 0 && (
            <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
              No matches for "{q}"
            </div>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 14px", borderTop: "0.5px solid var(--border)", fontSize: 11, color: "var(--text-subtle)" }}>
          <span><span className="kbd">↑↓</span> navigate · <span className="kbd">↵</span> open</span>
          <span><span className="kbd">?</span> shortcuts</span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Sidebar, TopBar, CommandPalette, ROUTE_META });
