// screens/inbox.jsx — the hero screen.
// 3-pane: conversation list / thread / context.
// Features: chatbot draft review with confidence bar, accept/edit/reject,
// escalation flag, 24h CS-window indicator, language pill, keyboard hints.

function ScreenInbox({ role, populated, showBadges, registerHandlers }) {
  const [filter, setFilter] = useState("esc"); // tab
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState("co1");
  const [draftMode, setDraftMode] = useState({}); // per-convo: "preview" | "edit"
  const [draftText, setDraftText] = useState({});
  const [composer, setComposer] = useState("");
  const [pushToast, toastNode] = useToast();
  const [showCtx, setShowCtx] = useState(false);
  const [resolved, setResolved] = useState({});
  const [isNarrow, setIsNarrow] = useState(() => typeof window !== "undefined" && window.innerWidth <= 1280);
  const composerRef = useRef(null);

  // Track viewport width so the toggle button & default state adapt
  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth <= 1280);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // populated=false → empty inbox state
  if (!populated) {
    return (
      <div className="inbox">
        <div className="inbox-pane">
          <InboxLeftHead filter={filter} setFilter={setFilter} search={search} setSearch={setSearch} />
          <Empty icon={<IcMessage size={20} />}
                 title="Waiting for customers to reply"
                 body="Inbound messages appear here once contacts respond to your campaigns or initiate new conversations." />
        </div>
        <div className="inbox-pane" style={{ display: "grid", placeItems: "center", background: "var(--bg-sunken)" }}>
          <Empty icon={<IcSparkle size={20} />}
                 title="Pick a conversation to read"
                 body="Choose a thread on the left, or press ⌘K to jump to a specific contact." />
        </div>
      </div>
    );
  }

  const tabs = [
    { value: "all",  label: "All",            count: CONVERSATIONS.length },
    { value: "auto", label: "Auto-replied",   count: CONVERSATIONS.filter(c => c.state === "auto").length },
    { value: "esc",  label: "Escalated",      count: CONVERSATIONS.filter(c => c.state === "esc").length },
    { value: "new",  label: "Awaiting reply", count: CONVERSATIONS.filter(c => c.state === "new").length },
    { value: "reply",label: "Replied",        count: CONVERSATIONS.filter(c => c.state === "reply").length },
  ];

  const filtered = CONVERSATIONS
    .filter(c => filter === "all" || c.state === filter)
    .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.preview.toLowerCase().includes(search.toLowerCase()));

  const active = CONVERSATIONS.find(c => c.id === activeId) || filtered[0] || CONVERSATIONS[0];

  const editingDraft = draftMode[active.id] === "edit";
  const currentDraft = draftText[active.id] ?? (active.botDraft?.text || "");
  const isResolved = !!resolved[active.id];
  const composerLimit = 1024;

  const markResolved = () => {
    setResolved({ ...resolved, [active.id]: !isResolved });
    pushToast(isResolved ? "Conversation reopened" : "Marked as resolved · " + active.name);
  };

  // Register keyboard handlers with the App
  useEffect(() => {
    if (!registerHandlers) return;
    const list = filtered;
    const curIdx = list.findIndex(c => c.id === active.id);
    registerHandlers({
      next:    () => { if (list.length === 0) return; const i = Math.min(list.length - 1, curIdx + 1); setActiveId(list[i].id); },
      prev:    () => { if (list.length === 0) return; const i = Math.max(0, curIdx - 1); setActiveId(list[i].id); },
      resolve: markResolved,
      approve: () => { if (active.botDraft && active.state === "esc" && !["sent", "rejected"].includes(draftMode[active.id])) acceptDraft(); },
    });
    return () => registerHandlers({});
  });

  const acceptDraft = () => {
    pushToast("Reply sent · " + active.name, { icon: <IcCheckCircle size={14} /> });
    setDraftMode({ ...draftMode, [active.id]: "sent" });
  };
  const editDraft = () => {
    setDraftMode({ ...draftMode, [active.id]: "edit" });
    setDraftText({ ...draftText, [active.id]: active.botDraft?.text || "" });
  };
  const rejectDraft = () => {
    pushToast("Draft rejected · marked for review", { icon: <IcX size={14} /> });
    setDraftMode({ ...draftMode, [active.id]: "rejected" });
  };
  const sendComposer = () => {
    if (!composer.trim()) return;
    pushToast("Sent to " + active.name);
    setComposer("");
  };

  return (
    <div className="inbox" data-show-ctx={showCtx ? "true" : "false"}>
      {isNarrow && <div className="inbox-ctx-backdrop" onClick={() => setShowCtx(false)} />}
      {/* Left: conversation list */}
      <div className="inbox-pane">
        <InboxLeftHead filter={filter} setFilter={setFilter} search={search} setSearch={setSearch} />
        <div style={{ borderBottom: "0.5px solid var(--border)", padding: "4px 0" }}>
          <div style={{ overflowX: "auto" }}>
            <Tabs value={filter} onChange={setFilter} tabs={tabs} />
          </div>
        </div>
        <div className="conv-list">
          {filtered.map((c) => {
            const isActive = c.id === active.id;
            return (
              <button key={c.id} className="conv-item" data-active={isActive}
                      onClick={() => setActiveId(c.id)}
                      style={{ border: 0, background: isActive ? undefined : "transparent", width: "100%", textAlign: "left" }}>
                <Avatar name={c.name} initials={c.initials} color={c.color} />
                <div style={{ minWidth: 0 }}>
                  <div className="conv-row1">
                    <div className="conv-row1-l">
                      {c.unread > 0 && showBadges && <span className="unread-dot" />}
                      {c.pinned && <IcPin size={11} style={{ color: "var(--text-muted)" }} />}
                      <span className="conv-name">{c.name}</span>
                    </div>
                    <span className="conv-time" title={c.lastActivity + " (Asia/Kuala_Lumpur)"}>{c.lastActivity}</span>
                  </div>
                  <div className="conv-preview" style={{ marginTop: 4 }}>{c.preview}</div>
                  <div className="row conv-meta-row" style={{ marginTop: 8, gap: 8, flexWrap: "wrap" }}>
                    <span className="conv-state">{stateLabel(c.state)}</span>
                    <span style={{ fontSize: 10, color: "var(--text-subtle)" }}>{c.lang === "ms" ? "MS" : "EN"}</span>
                    {c.tags.slice(0, 1).map((t) => (
                      <Pill key={t} tone="gray">{t}</Pill>
                    ))}
                  </div>
                </div>
                <span />
              </button>
            );
          })}
          {filtered.length === 0 && (
            <Empty icon={<IcFilter size={20} />} title="Nothing matches that filter" body="Try a different tab, or clear the search above." />
          )}
        </div>
      </div>

      {/* Center: thread */}
      <div className="inbox-pane" style={{ background: "var(--bg-sunken)" }}>
        <div className="inbox-pane-head inbox-thread-head" style={{ justifyContent: "space-between", alignItems: "flex-start", padding: "14px 20px" }}>
          <div className="row" style={{ gap: 12, minWidth: 0, alignItems: "flex-start" }}>
            <Avatar name={active.name} initials={active.initials} color={active.color} size="lg" />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.005em" }}>
                {active.name}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }} className="mono">{active.phone}</div>
              <div className="thread-sub" style={{ marginTop: 6 }}>
                <StateTag state={active.state} />
                <span className="sep">·</span>
                <CsWindow minutesLeft={active.windowMinutesLeft} />
                {active.assignee && (
                  <>
                    <span className="sep">·</span>
                    <span>Assigned to {TEAMMATES.find(t => t.id === active.assignee)?.name}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="row" style={{ gap: 4, flexShrink: 0 }}>
            <Button variant="ghost" size="sm"
                    icon={isResolved ? <IcRefresh size={13} /> : <IcCheckCircle size={13} />}
                    onClick={markResolved}>
              {isResolved ? "Reopen" : "Mark resolved"}
            </Button>
            {isNarrow && <IconButton icon={<IcInfo size={16} />} title="Contact details"
                                     onClick={() => setShowCtx(s => !s)} />}
            <IconButton icon={<IcVDots size={16} />} title="Assign · Tag · Archive · More" />
          </div>
        </div>

        <div className="thread">
          <div className="thread-day">{active.messages[0]?.date || "Today"}</div>
          {active.messages.map((m, i) => {
            if (m.side === "system") {
              return <div key={m.id} className="msg system">{m.body} · {m.at}</div>;
            }
            const isBot = m.by === "bot";
            const operator = !isBot && m.side === "out" && m.by
              ? TEAMMATES.find(t => t.id === m.by) : null;
            const cls = isBot ? "msg bot" : "msg " + m.side;
            const confClass = m.confidence == null ? "" :
              m.confidence >= 0.85 ? "conf-hi" :
              m.confidence >= 0.75 ? "conf-mid" : "conf-lo";
            return (
              <div key={m.id} className={cls}>
                {operator && <div className="msg-by" style={{ color: "rgba(255,255,255,0.85)" }}><IcUser size={11} /> {operator.name.split(" ")[0]}</div>}
                {m.body}
                <span className="msg-time">{m.at}</span>
                {m.side === "out" && !isBot && <IcCheck size={11} style={{ color: "rgba(255,255,255,0.85)", marginLeft: 2 }} />}
                {isBot && m.intent && (
                  <div className="bot-footnote">
                    Chatbot · {m.auto ? "sent automatically" : "routed to operator"} · {Math.round(m.confidence * 100)}% confidence · <span className="mono">{m.intent}</span> · <span className="mono">{m.model}</span>
                  </div>
                )}
              </div>
            );
          })}
          {active.state === "esc" && active.botDraft && !["sent", "rejected"].includes(draftMode[active.id]) && (
            <BotDraftCard
              draft={active.botDraft}
              editing={editingDraft}
              text={currentDraft}
              onTextChange={(v) => setDraftText({ ...draftText, [active.id]: v })}
              onAccept={acceptDraft}
              onEdit={editDraft}
              onCancelEdit={() => setDraftMode({ ...draftMode, [active.id]: "preview" })}
              onReject={rejectDraft}
            />
          )}
          {draftMode[active.id] === "sent" && (
            <div className="msg out" style={{ alignSelf: "flex-end" }}>
              {currentDraft || active.botDraft?.text}
              <span className="msg-time">just now</span>
              <IcCheck size={11} style={{ color: "var(--green-600)", marginLeft: 2 }} />
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="composer">
          <div className="composer-row">
            <IconButton icon={<IcPaperclip size={16} />} title="Attach" size="sm" />
            <IconButton icon={<IcFile size={16} />} title="Insert template" size="sm" />
            <textarea ref={composerRef} value={composer} onChange={(e) => setComposer(e.target.value)}
                      placeholder="Reply to Wei Jie… (free-form within 24h CS window)"
                      onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") sendComposer(); }} />
            <Button variant="primary" size="sm" icon={<IcSend size={14} />} onClick={sendComposer}>Send</Button>
          </div>
          <div className="composer-meta">
            <span>
              <IcInfo size={11} style={{ verticalAlign: "-1px", marginRight: 4 }} />
              Free-form messages allowed inside the 24h customer-service window. Outside it, only approved templates.
            </span>
            <span className="row" style={{ gap: 8 }}>
              <span style={{ color: composer.length > composerLimit * 0.9 ? "var(--amber-500)" : "var(--text-subtle)" }}>
                {composer.length} / {composerLimit}
              </span>
              <span className="kbd">⌘↵</span><span>send</span>
            </span>
          </div>
        </div>
      </div>

      {/* Right: context pane */}
      <div className="inbox-pane ctx-pane">
        <div className="inbox-pane-head">
          <b style={{ fontSize: 13 }}>Contact</b>
          <span className="spacer" />
          <IconButton icon={<IcExternal size={14} />} title="Open contact" size="sm" />
          {isNarrow && <IconButton icon={<IcX size={14} />} title="Close" size="sm" onClick={() => setShowCtx(false)} />}
        </div>

        <div className="ctx-quiet">
          <div className="ctx-group">
            <div className="row" style={{ gap: 12, marginBottom: 16 }}>
              <Avatar name={active.name} initials={active.initials} color={active.color} size="lg" />
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{active.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }} className="mono">{active.phone}</div>
              </div>
            </div>
            <dl className="ctx-kv">
              <dt>Opt-in</dt><dd style={{ color: "var(--gray-700)" }}>Opted in · 12 Aug</dd>
              <dt>Language</dt><dd>{active.lang === "ms" ? "Bahasa Malaysia" : "English"}</dd>
              <dt>Lifetime</dt><dd>{myrFmt(active.csValueLifetime)}</dd>
              <dt>Tags</dt><dd className="row" style={{ flexWrap: "wrap", gap: 4 }}>{active.tags.map(t => <Pill key={t} tone="gray">{t}</Pill>)}</dd>
            </dl>
          </div>

          {active.botDraft && (
            <div className="ctx-group">
              <div className="ctx-group-label">AI decision</div>
              <div style={{ marginBottom: 12 }}>
                <div className="row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: "var(--gray-700)" }}>Confidence</span>
                  <span style={{ fontSize: 14, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
                    {Math.round(active.botDraft.confidence * 100)}%
                  </span>
                </div>
                <div className="confidence-bar" data-low={active.botDraft.confidence < 0.7}>
                  <i style={{ width: (active.botDraft.confidence * 100) + "%" }} />
                </div>
              </div>
              <div className="ctx-row"><span>Intent</span><code>{active.botDraft.intent}</code></div>
              <div className="ctx-row" style={{ alignItems: "flex-start" }}>
                <span>Sources used</span>
                <div className="col" style={{ gap: 4 }}>
                  {active.botDraft.knowledge.map((k, i) => (
                    <a key={i} className="src mono">{k}</a>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="ctx-group">
            <div className="ctx-group-label">Recent activity</div>
            <div className="col" style={{ gap: 12 }}>
              <ActivityRow icon={<IcSend size={14} />} label="Received: Merdeka flash 2× points" when="3h ago" />
              <ActivityRow icon={<IcCheck size={14} />} label="Opened campaign link" when="3h ago" />
              <ActivityRow icon={<IcMessage size={14} />} label="Last conversation" when="11 days ago" />
              <ActivityRow icon={<IcStar size={14} />} label="Order: #SO-43102 · {amt}" when="14 days ago" amt={myrFmt(212)} />
            </div>
          </div>

          <div className="ctx-group">
            <div className="col" style={{ gap: 4 }}>
              <Button variant="ghost" size="sm" icon={<IcFile size={13} />} style={{ justifyContent: "flex-start" }}>Send template…</Button>
              <Button variant="ghost" size="sm" icon={<IcUser size={13} />} style={{ justifyContent: "flex-start" }}>Assign to teammate…</Button>
              <Button variant="ghost" size="sm" icon={<IcArchive size={13} />} style={{ justifyContent: "flex-start" }}>Archive thread</Button>
              <Button variant="ghost" size="sm" icon={<IcAlert size={13} />} locked={role !== "admin"} style={{ justifyContent: "flex-start", color: "var(--red-500)" }}>Ban contact</Button>
            </div>
          </div>
        </div>
      </div>
      {toastNode}
    </div>
  );
}

// ── helpers ────────────────────────────────────────────────────────────────

function InboxLeftHead({ search, setSearch }) {
  return (
    <div className="inbox-pane-head" style={{ flexDirection: "column", alignItems: "stretch", gap: 8, paddingBottom: 8 }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div className="row" style={{ gap: 6 }}>
          <b style={{ fontSize: 13 }}>Conversations</b>
          <Pill tone="gray">{CONVERSATIONS.length}</Pill>
        </div>
        <div className="row" style={{ gap: 4 }}>
          <IconButton icon={<IcRefresh size={14} />} title="Refresh" size="sm" />
          <IconButton icon={<IcSliders size={14} />} title="View options" size="sm" />
        </div>
      </div>
      <div className="search" style={{ width: "100%", height: 28 }}>
        <IcSearch size={13} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or message…" />
      </div>
    </div>
  );
}

function StateTag({ state }) {
  if (state === "auto")  return <TagUpper tone="green">AUTO</TagUpper>;
  if (state === "esc")   return <TagUpper tone="amber">ESC</TagUpper>;
  if (state === "new")   return <TagUpper tone="blue">NEW</TagUpper>;
  if (state === "reply") return <TagUpper tone="green">REPLY</TagUpper>;
  return <TagUpper>—</TagUpper>;
}

function stateLabel(state) {
  if (state === "auto")  return "Auto-replied";
  if (state === "esc")   return "Escalated";
  if (state === "new")   return "Awaiting reply";
  if (state === "reply") return "Replied";
  return "—";
}

function ActivityRow({ icon, label, when, amt }) {
  return (
    <div className="row" style={{ gap: 8, fontSize: 12, color: "var(--text-muted)" }}>
      <span style={{ color: "var(--text-subtle)" }}>{icon}</span>
      <span style={{ flex: 1, color: "var(--text)" }}>{label.replace("{amt}", amt || "")}</span>
      <span style={{ color: "var(--text-subtle)" }}>{when}</span>
    </div>
  );
}

function BotDraftCard({ draft, editing, text, onTextChange, onAccept, onEdit, onCancelEdit, onReject }) {
  const pct = Math.round(draft.confidence * 100);
  const low = draft.confidence < 0.7;
  const mid = !low && draft.confidence < 0.85;
  const confLabel = low ? "LOW" : mid ? "MED" : "HIGH";
  const confColor = low ? "var(--amber-500)" : mid ? "#B45309" : "var(--green-600)";
  return (
    <div className="bot-draft" style={{ alignSelf: "stretch" }}>
      <div className="bot-draft-meta">
        <span className="row" style={{ gap: 6, fontSize: 12, color: "#B45309", fontWeight: 500 }}>
          <IcClock size={12} /> Drafted reply · awaiting your approval
        </span>
        <span className="sep">·</span>
        <span style={{ fontSize: 12, color: confColor }}>{pct}% confidence · {confLabel}</span>
      </div>

      {editing
        ? <textarea value={text} onChange={(e) => onTextChange(e.target.value)} />
        : <div className="bot-draft-body">{text}</div>}

      <div className="bot-draft-sources">
        Intent <span className="mono" style={{ color: "var(--text)" }}>{draft.intent}</span>
        <span className="sep">·</span>
        Sources {draft.knowledge.map((k, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span style={{ color: "var(--text-subtle)" }}>, </span>}
            <a className="src">{k}</a>
          </React.Fragment>
        ))}
      </div>

      <div className="bot-draft-actions">
        {editing ? (
          <>
            <Button variant="primary" size="sm" icon={<IcSend size={13} />} onClick={onAccept} title="Send edited (⌘↵)">Send edited</Button>
            <Button variant="ghost" size="sm" onClick={onCancelEdit} title="Cancel (ESC)">Cancel</Button>
          </>
        ) : (
          <>
            <Button variant="primary" size="sm" icon={<IcCheck size={13} />} onClick={onAccept} title="Approve & send (A)">Approve &amp; send</Button>
            <Button variant="ghost" size="sm" icon={<IcEdit3 size={13} />} onClick={onEdit} title="Edit (E)">Edit</Button>
            <Button variant="ghost" size="sm" icon={<IcX size={13} />} onClick={onReject} title="Reject & reply manually (R)">Reject &amp; reply manually</Button>
          </>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { ScreenInbox });
