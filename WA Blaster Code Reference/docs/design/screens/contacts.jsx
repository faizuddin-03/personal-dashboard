// screens/contacts.jsx — contact table with filters, opt-in status, segment count.

function ScreenContacts({ role, populated, onImport }) {
  const [selected, setSelected] = useState({});
  const [tag, setTag] = useState(null);
  const [deletedIds, setDeletedIds] = useState({});
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);
  const [pushToast, toastNode] = useToast();

  if (!populated) {
    return (
      <Page>
        <PageHead title="Contacts" subtitle="Master list of customers who can receive messages."
                  actions={<Button variant="primary" icon={<IcUpload size={14} />}>Import CSV</Button>} />
        <Card>
          <Empty icon={<IcUsers size={20} />} title="Add your first contact"
                 body="Import a CSV of opted-in customers, or add a contact manually. Required columns: name, phone, opt_in_date."
                 cta={<div className="row" style={{ gap: 8 }}>
                   <Button variant="primary" icon={<IcUpload size={14} />} onClick={onImport}>Import CSV</Button>
                   <Button variant="secondary" icon={<IcPlus size={14} />}>Add contact</Button>
                 </div>} />
        </Card>
      </Page>
    );
  }

  const rows = (tag ? CONTACTS.filter(c => c.tags.includes(tag)) : CONTACTS).filter(c => !deletedIds[c.id]);
  const selCount = Object.values(selected).filter(Boolean).length;
  const selIds = Object.entries(selected).filter(([, v]) => v).map(([k]) => k);

  const doDelete = () => {
    if (selIds.length === 0) return;
    setDeletedIds({ ...deletedIds, ...Object.fromEntries(selIds.map(id => [id, true])) });
    setSelected({});
    pushToast(`Deleted ${selIds.length} contact${selIds.length === 1 ? "" : "s"}`, {
      icon: <IcTrash size={14} />,
      tone: "destructive",
      undo: () => {
        const restore = { ...deletedIds };
        selIds.forEach(id => delete restore[id]);
        setDeletedIds(restore);
        pushToast("Restored " + selIds.length + " contact" + (selIds.length === 1 ? "" : "s"));
      },
    });
  };

  const doOptOut = () => {
    if (selIds.length === 0) return;
    setSelected({});
    pushToast(`${selIds.length} contact${selIds.length === 1 ? "" : "s"} opted out`, {
      icon: <IcCheck size={14} />,
      undo: () => pushToast("Re-opted back in"),
    });
  };

  const addTag = (tagName) => {
    pushToast(`Tagged ${selIds.length} contact${selIds.length === 1 ? "" : "s"} as "${tagName}"`, {
      icon: <IcTag size={14} />,
      undo: () => pushToast("Tag removed"),
    });
    setTagPopoverOpen(false);
    setSelected({});
  };

  return (
    <Page>
      <PageHead title="Contacts"
                subtitle={`${CONTACTS.length.toLocaleString()} of 12,480 shown · ${CONTACTS.filter(c => c.optIn).length} opted in`}
                actions={
                  <>
                    <Button variant="secondary" icon={<IcDownload size={14} />}>Export</Button>
                    <Button variant="secondary" icon={<IcUpload size={14} />} onClick={onImport}>Import CSV</Button>
                    <Button variant="primary" icon={<IcPlus size={14} />}>Add contact</Button>
                  </>
                } />

      <div className="card">
        <SelectionBar count={selCount} onClear={() => setSelected({})}
                      actions={
                        <>
                          <div style={{ position: "relative" }}>
                            <Button variant="ghost" size="sm" icon={<IcTag size={13} />} onClick={() => setTagPopoverOpen(!tagPopoverOpen)}>Add tag</Button>
                            {tagPopoverOpen && (
                              <div style={{
                                position: "absolute", top: "calc(100% + 6px)", left: 0,
                                width: 240, background: "var(--bg)", border: "0.5px solid var(--border)",
                                borderRadius: 8, padding: 8, zIndex: 20,
                                boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
                              }} onClick={(e) => e.stopPropagation()}>
                                <input className="input" placeholder="Type a tag name…"
                                       autoFocus
                                       onKeyDown={(e) => { if (e.key === "Enter" && e.currentTarget.value.trim()) addTag(e.currentTarget.value.trim()); if (e.key === "Escape") setTagPopoverOpen(false); }}
                                       style={{ height: 30, fontSize: 13 }} />
                                <div style={{ fontSize: 11, color: "var(--text-subtle)", margin: "8px 4px 4px" }}>Or pick existing:</div>
                                <div className="row" style={{ flexWrap: "wrap", gap: 4 }}>
                                  {["VIP", "lapsed", "foodie", "KL", "Penang", "new"].map(t => (
                                    <button key={t} onClick={() => addTag(t)}
                                            style={{ padding: "2px 8px", border: "0.5px solid var(--border-strong)", background: "var(--bg)", color: "var(--text)", borderRadius: 999, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>{t}</button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <Button variant="ghost" size="sm" icon={<IcFilter size={13} />}>Add to segment</Button>
                          <Button variant="ghost" size="sm" icon={<IcX size={13} />} onClick={doOptOut}>Opt out</Button>
                          <Button variant="ghost" size="sm" icon={<IcDownload size={13} />}>Export</Button>
                          <Button variant="ghost" size="sm" icon={<IcTrash size={13} />} onClick={doDelete} locked={role !== "admin"}>Delete</Button>
                        </>
                      } />
        {tagPopoverOpen && <div style={{ position: "fixed", inset: 0, zIndex: 19 }} onClick={() => setTagPopoverOpen(false)} />}
        <div className="toolbar">
          <FilterPill label="Opt-in" value="opted in" icon={<IcCheck size={12} />} active />
          <FilterPill label="Tag" value={tag} icon={<IcTag size={12} />} onClick={() => setTag(tag ? null : "VIP")} />
          <FilterPill label="Language" icon={<IcGlobe size={12} />} />
          <FilterPill label="Last seen" icon={<IcClock size={12} />} />
          <FilterPill label="State" icon={<IcGlobe size={12} />} />
          <span className="grow" />
          <div className="search" style={{ width: 240, height: 26 }}>
            <IcSearch size={13} />
            <input placeholder="Search name or phone…" />
          </div>
          <IconButton icon={<IcSliders size={14} />} title="Column settings" size="sm" />
        </div>

        <div className="table-scroll">
          <table className="table">
            <colgroup>
              <col style={{ width: 32 }} />
              <col style={{ width: "22%" }} />
              <col style={{ width: 150 }} />
              <col style={{ width: 80 }} />
              <col style={{ width: "auto" }} />
              <col style={{ width: 60 }} />
              <col style={{ width: 100 }} />
              <col style={{ width: 120 }} />
              <col style={{ width: 32 }} />
            </colgroup>
            <thead>
              <tr>
                <th><Cbx on={selCount === rows.length} indeterminate={selCount > 0 && selCount < rows.length}
                         onChange={(v) => v ? setSelected(Object.fromEntries(rows.map(r => [r.id, true]))) : setSelected({})} /></th>
                <th className="sortable">Name</th>
                <th>Phone</th>
                <th>Opt-in</th>
                <th>Tags</th>
                <th>Lang</th>
                <th>Last seen</th>
                <th className="num">Lifetime (MYR)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(c => (
                <tr key={c.id} data-selected={!!selected[c.id]}>
                  <td><Cbx on={!!selected[c.id]} onChange={(v) => setSelected({ ...selected, [c.id]: v })} /></td>
                  <td>
                    <div className="row" style={{ gap: 8 }}>
                      <Avatar name={c.name} size="sm" />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 500 }} className="truncate">{c.name}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>in {c.segments} segments</div>
                      </div>
                    </div>
                  </td>
                  <td className="mono">{c.phone}</td>
                  <td>
                    {c.optIn
                      ? <Pill tone="green" dot>opted in</Pill>
                      : <Pill tone="gray">opted out</Pill>}
                  </td>
                  <td>
                    <div className="row" style={{ gap: 4, flexWrap: "wrap" }}>
                      {c.tags.slice(0, 3).map(t => <Pill key={t} tone="gray">{t}</Pill>)}
                    </div>
                  </td>
                  <td><span className="tag-upper">{c.lang.toUpperCase()}</span></td>
                  <td className="muted"><RelTime value={c.lastSeen} exact={c.lastSeenExact} /></td>
                  <td className="num">{myrFmt(c.lifetime)}</td>
                  <td><IconButton icon={<IcVDots size={14} />} title="Actions" size="sm" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="row" style={{ padding: "10px 14px", borderTop: "0.5px solid var(--border)", justifyContent: "space-between", fontSize: 12, color: "var(--text-muted)" }}>
          <span>1–{rows.length} of 12,480</span>
          <div className="row" style={{ gap: 4 }}>
            <Button variant="ghost" size="sm" icon={<IcChevL size={12} />} disabled>Prev</Button>
            <Button variant="ghost" size="sm">Next <IcChevR size={12} /></Button>
          </div>
        </div>
      </div>
      {toastNode}
    </Page>
  );
}

Object.assign(window, { ScreenContacts });
