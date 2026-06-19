// keyboard.jsx — global keyboard shortcuts registry + help dialog.

// Shortcuts manager. Supports:
//   - single-key shortcuts: { keys: ["?"], handler, label, scope }
//   - sequence shortcuts: { keys: ["g", "i"], handler, label }
//   - modifier+key: { keys: ["Mod+K"], handler, label }
//
// "Mod" matches ⌘ on Mac, Ctrl elsewhere.

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent || "");
const MOD_LABEL = isMac ? "⌘" : "Ctrl";

function formatShortcut(keys) {
  return keys.map((k) => {
    if (k === "Mod") return MOD_LABEL;
    if (/^Mod\+/.test(k)) return k.replace("Mod", MOD_LABEL);
    if (k === "Enter")  return "↵";
    if (k === "Escape") return "Esc";
    if (k === " ")      return "Space";
    return k.length === 1 ? k.toUpperCase() : k;
  });
}

function ShortcutHint({ keys, separator = "+" }) {
  const fmt = formatShortcut(keys);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
      {fmt.map((k, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span style={{ color: "var(--text-subtle)", fontSize: 10 }}>{separator}</span>}
          <span className="kbd">{k}</span>
        </React.Fragment>
      ))}
    </span>
  );
}

function ShortcutsHelp({ open, onClose }) {
  const groups = [
    { title: "Global", items: [
      { keys: ["Mod+K"],     label: "Open search · command palette" },
      { keys: ["Mod+,"],     label: "Open settings" },
      { keys: ["g", "i"],    label: "Go to inbox" },
      { keys: ["g", "c"],    label: "Go to contacts" },
      { keys: ["g", "s"],    label: "Go to segments" },
      { keys: ["g", "t"],    label: "Go to templates" },
      { keys: ["g", "p"],    label: "Go to campaigns" },
      { keys: ["g", "r"],    label: "Go to reports" },
      { keys: ["?"],         label: "Show this help" },
      { keys: ["Escape"],    label: "Close modal · dialog · sheet" },
    ]},
    { title: "Inbox", items: [
      { keys: ["j"],         label: "Next conversation" },
      { keys: ["k"],         label: "Previous conversation" },
      { keys: ["Mod+Enter"], label: "Send reply" },
      { keys: ["e"],         label: "Resolve conversation" },
      { keys: ["a"],         label: "Approve chatbot draft" },
    ]},
    { title: "Tables", items: [
      { keys: ["Mod+A"],     label: "Select all rows on page" },
      { keys: ["Mod+Click"], label: "Add to selection", separator: " " },
      { keys: ["Shift+Click"], label: "Range select", separator: " " },
      { keys: ["↑", "↓"],    label: "Move cursor" },
      { keys: ["↵"],         label: "Open focused row" },
    ]},
  ];

  return (
    <Dialog open={open} onClose={onClose}
            title="Keyboard shortcuts"
            width={620}
            icon={<IcCommand size={16} />}
            footer={<Button variant="ghost" size="sm" onClick={onClose}>Close</Button>}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {groups.map((g) => (
          <div key={g.title}>
            <div className="h3" style={{ marginBottom: 10 }}>{g.title}</div>
            <div className="col" style={{ gap: 8 }}>
              {g.items.map((it, i) => (
                <div key={i} className="row" style={{ justifyContent: "space-between", gap: 12, fontSize: 12 }}>
                  <span style={{ color: "var(--text-muted)", flex: 1 }}>{it.label}</span>
                  <ShortcutHint keys={it.keys} separator={it.separator} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 20, padding: 12, background: "var(--bg-subtle)", borderRadius: 8, fontSize: 11, color: "var(--text-muted)" }}>
        Shortcuts are disabled while typing in inputs. Sequence shortcuts (like <ShortcutHint keys={["g", "i"]} separator=" then " />) listen for the second key within 1 second.
      </div>
    </Dialog>
  );
}

// ── Manager hook ────────────────────────────────────────────────────────────
function useKeyboardShortcuts(handlers) {
  // handlers: { route, setRoute, openPalette, openHelp, openSettings, scope?, inboxHandlers? }
  const seqRef = useRef("");
  const seqTimer = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      // Don't fire while typing in inputs (unless modifier present).
      const tag = (e.target && e.target.tagName) || "";
      const inEditable = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || e.target?.isContentEditable;
      const hasMod = e.metaKey || e.ctrlKey;

      // Mod+K — palette (allow inside inputs too)
      if (hasMod && (e.key === "k" || e.key === "K")) { e.preventDefault(); handlers.openPalette(); return; }
      if (hasMod && e.key === ",")                    { e.preventDefault(); handlers.openSettings(); return; }

      if (inEditable && !hasMod) return;

      // ? — help (Shift+/ on US keyboards)
      if (!hasMod && (e.key === "?" || (e.shiftKey && e.key === "/"))) {
        e.preventDefault();
        handlers.openHelp();
        return;
      }

      // Inbox-specific (when current scope is inbox)
      if (handlers.scope === "inbox" && !hasMod) {
        const ih = handlers.inboxHandlers || {};
        if (e.key === "j") { e.preventDefault(); ih.next  && ih.next();    return; }
        if (e.key === "k") { e.preventDefault(); ih.prev  && ih.prev();    return; }
        if (e.key === "e") { e.preventDefault(); ih.resolve && ih.resolve(); return; }
        if (e.key === "a") { e.preventDefault(); ih.approve && ih.approve(); return; }
      }

      // Sequence handling — "g" then a letter
      if (!hasMod && !e.shiftKey && !e.altKey) {
        if (seqRef.current === "g") {
          const map = { i: "inbox", c: "contacts", s: "segments", t: "templates", p: "campaigns", r: "reports" };
          if (map[e.key]) {
            e.preventDefault();
            handlers.setRoute(map[e.key]);
            seqRef.current = "";
            clearTimeout(seqTimer.current);
            return;
          }
        }
        if (e.key === "g") {
          seqRef.current = "g";
          clearTimeout(seqTimer.current);
          seqTimer.current = setTimeout(() => { seqRef.current = ""; }, 1000);
          return;
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); clearTimeout(seqTimer.current); };
  }, [handlers]);
}

// ── Sequence indicator (shows the "g…" prefix while user is mid-sequence) ──
function SequenceIndicator() {
  const [pressed, setPressed] = useState("");
  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target && e.target.tagName) || "";
      const inEditable = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      if (inEditable || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (e.key === "g") {
        setPressed("g");
        setTimeout(() => setPressed(""), 1000);
      } else if (pressed) {
        setPressed("");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pressed]);
  if (!pressed) return null;
  return (
    <div style={{
      position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
      background: "var(--gray-900)", color: "#fff",
      padding: "6px 12px", borderRadius: 8, fontSize: 12,
      display: "flex", alignItems: "center", gap: 6, zIndex: 90,
      fontFamily: "var(--mono)",
    }}>
      <span className="kbd" style={{ background: "rgba(255,255,255,0.12)", color: "#fff", border: 0 }}>g</span>
      <span style={{ opacity: 0.6 }}>then i / c / s / t / p / r</span>
    </div>
  );
}

Object.assign(window, { useKeyboardShortcuts, ShortcutsHelp, ShortcutHint, SequenceIndicator, formatShortcut, MOD_LABEL });
