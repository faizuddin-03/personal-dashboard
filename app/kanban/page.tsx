"use client";
import { useState, useEffect } from "react";
import {
  DndContext, DragOverlay, closestCenter,
  useDraggable, useDroppable,
  DragStartEvent, DragEndEvent,
} from "@dnd-kit/core";
import {
  Plus, ExternalLink, Clock, AlertTriangle, CheckSquare,
  Loader2, X, GripVertical, Zap, Search, Archive, RotateCcw, Timer,
} from "lucide-react";
import clsx from "clsx";
import { useApp } from "@/components/AppShell";
import {
  KanbanCard, KanbanState, ColumnId, Priority,
  COLUMN_IDS, COLUMN_META, PRIORITY_META, ACCENT_COLORS, accentBorderClass,
  ChecklistItem, getKanbanState, saveKanbanState, isOverdue, checklistProgress,
  timeInColumn, getArchivedCards, saveArchivedCards,
} from "@/lib/kanban";

function newId() { return crypto.randomUUID(); }

function findCardColumn(cardId: string, state: KanbanState): ColumnId | null {
  for (const col of COLUMN_IDS) {
    if (state[col].some(c => c.id === cardId)) return col;
  }
  return null;
}

// ── Jira result type ──────────────────────────────────────
interface JiraResult {
  key: string; summary: string; status: string; type: string; project: string; updated: string;
}

// ── AddCardModal ──────────────────────────────────────────
function AddCardModal({ targetColumn, onClose, onAdd, creds }: {
  targetColumn: ColumnId;
  onClose: () => void;
  onAdd: (card: KanbanCard) => void;
  creds: ReturnType<typeof useApp>["creds"];
}) {
  const [tab, setTab] = useState<"custom" | "jira">("custom");

  // Custom task
  const [title, setTitle]               = useState("");
  const [description, setDescription]   = useState("");
  const [priority, setPriority]         = useState<Priority>("medium");
  const [labelInput, setLabelInput]     = useState("");
  const [labels, setLabels]             = useState<string[]>([]);
  const [dueDate, setDueDate]           = useState("");
  const [estimatedHours, setEstimated]  = useState("");
  const [assignee, setAssignee]         = useState("");
  const [accentColor, setAccentColor]   = useState("");
  const [checklistInput, setClInput]    = useState("");
  const [checklist, setChecklist]       = useState<ChecklistItem[]>([]);

  // Jira search
  const [jiraQuery, setJiraQuery]       = useState("");
  const [allJira, setAllJira]           = useState<JiraResult[]>([]);
  const [jiraLoading, setJiraLoading]   = useState(false);
  const [jiraError, setJiraError]       = useState("");

  // Fetch Jira tickets when tab switches to jira
  useEffect(() => {
    if (tab !== "jira" || !creds || allJira.length > 0) return;
    setJiraLoading(true);
    setJiraError("");
    fetch("/api/jira/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...creds,
        jql: "(assignee = currentUser() OR reporter = currentUser()) ORDER BY updated DESC",
        maxResults: 80,
        fields: ["summary", "status", "issuetype", "project", "updated"],
      }),
    })
      .then(r => r.json())
      .then(data => {
        setAllJira(
          (data.issues ?? []).map((i: { key: string; fields: { summary: string; status: { name: string }; issuetype: { name: string }; project: { name: string }; updated: string } }) => ({
            key: i.key,
            summary: i.fields.summary,
            status: i.fields.status.name,
            type: i.fields.issuetype.name,
            project: i.fields.project.name,
            updated: i.fields.updated,
          }))
        );
      })
      .catch(() => setJiraError("Failed to load tickets"))
      .finally(() => setJiraLoading(false));
  }, [tab, creds, allJira.length]);

  const filteredJira = allJira.filter(r => {
    const q = jiraQuery.toLowerCase();
    return !q || r.key.toLowerCase().includes(q) || r.summary.toLowerCase().includes(q) || r.project.toLowerCase().includes(q);
  });

  function addLabel(e: React.KeyboardEvent) {
    if (e.key === "Enter" && labelInput.trim()) { setLabels(p => [...p, labelInput.trim()]); setLabelInput(""); }
  }
  function addChecklistItem(e: React.KeyboardEvent) {
    if (e.key === "Enter" && checklistInput.trim()) { setChecklist(p => [...p, { id: newId(), text: checklistInput.trim(), done: false }]); setClInput(""); }
  }

  function handleAddCustom() {
    if (!title.trim()) return;
    onAdd({
      id: newId(), columnId: targetColumn, type: "custom",
      title: title.trim(), description: description || undefined,
      priority, labels, dueDate: dueDate || undefined, checklist,
      estimatedHours: estimatedHours ? Number(estimatedHours) : undefined,
      assignee: assignee || undefined,
      accentColor: accentColor || undefined,
      createdAt: new Date().toISOString(),
    });
    onClose();
  }

  function addJiraCard(r: JiraResult) {
    onAdd({
      id: newId(), columnId: targetColumn, type: "jira",
      title: r.summary, priority: "medium", labels: [], checklist: [],
      jiraKey: r.key, jiraStatus: r.status, jiraType: r.type, jiraProject: r.project,
      createdAt: new Date().toISOString(),
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-800 shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Add Card</h2>
            <p className="text-xs text-slate-500 mt-0.5">to <span className="text-slate-300">{COLUMN_META[targetColumn].label}</span></p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X size={18} /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 shrink-0">
          {([["custom", "New Task"], ["jira", "From Jira"]] as ["custom" | "jira", string][]).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              disabled={t === "jira" && !creds}
              className={clsx(
                "px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
                tab === t ? "border-blue-500 text-blue-400" : "border-transparent text-slate-500 hover:text-slate-300",
                t === "jira" && !creds && "opacity-30 cursor-not-allowed"
              )}
            >
              {label}
              {t === "jira" && !creds && <span className="ml-1 text-xs">(no Jira)</span>}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {tab === "custom" ? (
            <div className="space-y-4">
              <div>
                <label className={lbl}>Title *</label>
                <input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="What needs to be done?" className={inp} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Priority</label>
                  <select value={priority} onChange={e => setPriority(e.target.value as Priority)} className={sel}>
                    {Object.entries(PRIORITY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Due Date</label>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={inp + " [color-scheme:dark]"} />
                </div>
                <div>
                  <label className={lbl}>Est. hours</label>
                  <input type="number" min={0} step={0.5} value={estimatedHours} onChange={e => setEstimated(e.target.value)} placeholder="e.g. 2.5" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Assignee</label>
                  <input value={assignee} onChange={e => setAssignee(e.target.value)} placeholder="Name" className={inp} />
                </div>
              </div>
              <div>
                <label className={lbl}>Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Optional details…" className={inp + " resize-none"} />
              </div>
              <div>
                <label className={lbl}>Labels <span className="text-slate-600">(Enter to add)</span></label>
                <input value={labelInput} onChange={e => setLabelInput(e.target.value)} onKeyDown={addLabel} placeholder="e.g. regression" className={inp} />
                {labels.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {labels.map(l => (
                      <span key={l} className="flex items-center gap-1 bg-slate-800 border border-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded-full">
                        {l}<button onClick={() => setLabels(p => p.filter(x => x !== l))}><X size={10} /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className={lbl}>Checklist <span className="text-slate-600">(Enter to add)</span></label>
                <input value={checklistInput} onChange={e => setClInput(e.target.value)} onKeyDown={addChecklistItem} placeholder="Add subtask…" className={inp} />
                {checklist.length > 0 && (
                  <div className="space-y-1 mt-2">
                    {checklist.map(item => (
                      <div key={item.id} className="flex items-center gap-2 text-sm text-slate-400">
                        <span className="text-slate-600">•</span>{item.text}
                        <button onClick={() => setChecklist(p => p.filter(x => x.id !== item.id))} className="ml-auto text-slate-700 hover:text-red-400"><X size={11} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className={lbl}>Accent Color</label>
                <div className="flex gap-2 mt-1">
                  {ACCENT_COLORS.map(c => (
                    <button
                      key={c.value}
                      title={c.label}
                      onClick={() => setAccentColor(c.value)}
                      className={clsx(
                        "w-6 h-6 rounded-full border-2 transition-all",
                        c.value === "" ? "bg-slate-700 border-slate-600" : "bg-slate-800",
                        accentColor === c.value ? "ring-2 ring-blue-500 ring-offset-1 ring-offset-slate-900" : "border-slate-600"
                      )}
                      style={{ borderLeftColor: c.value ? undefined : undefined }}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {!creds ? (
                <p className="text-sm text-slate-500 text-center py-8">Connect Jira in Settings first.</p>
              ) : (
                <>
                  {/* Search bar */}
                  <div className="relative">
                    <Search size={13} className="absolute left-3 top-2.5 text-slate-500" />
                    <input
                      value={jiraQuery}
                      onChange={e => setJiraQuery(e.target.value)}
                      placeholder="Filter by key, summary, or project…"
                      className={inp + " pl-8"}
                    />
                  </div>

                  {jiraLoading && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 size={20} className="animate-spin text-blue-500" />
                    </div>
                  )}

                  {jiraError && <p className="text-sm text-red-400">{jiraError}</p>}

                  {!jiraLoading && filteredJira.length === 0 && !jiraError && (
                    <p className="text-xs text-slate-600 text-center py-4">
                      {jiraQuery ? "No tickets match your filter" : "No tickets found"}
                    </p>
                  )}

                  <div className="space-y-2">
                    {filteredJira.map(r => (
                      <button
                        key={r.key}
                        onClick={() => addJiraCard(r)}
                        className="w-full text-left bg-slate-800 border border-slate-700 rounded-xl p-3 hover:border-blue-500 transition-colors group"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-blue-400 font-bold">{r.key}</span>
                          <span className="text-xs bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded">{r.status}</span>
                          <span className="text-xs text-slate-600">{r.type}</span>
                          <span className="text-xs text-slate-700 ml-auto">
                            {new Date(r.updated).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-slate-200 line-clamp-2 leading-snug">{r.summary}</p>
                        <p className="text-xs text-slate-600 mt-0.5">{r.project}</p>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {tab === "custom" && (
          <div className="p-5 border-t border-slate-800 shrink-0">
            <button onClick={handleAddCustom} disabled={!title.trim()} className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 text-sm font-medium transition-colors">
              Add Card
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Card view ─────────────────────────────────────────────
function CardView({ card, baseUrl, onClick, dragHandle }: {
  card: KanbanCard; baseUrl?: string; onClick?: () => void; dragHandle?: React.ReactNode;
}) {
  const { done, total } = checklistProgress(card);
  const over = isOverdue(card);
  const pm = PRIORITY_META[card.priority];

  return (
    <div
      onClick={onClick}
      className={clsx(
        "bg-slate-800 border border-slate-700 border-l-4 rounded-xl p-3 group cursor-pointer hover:border-slate-500 transition-all",
        accentBorderClass(card.accentColor),
        over && "border-red-800/50"
      )}
    >
      <div className="flex items-start gap-1.5 mb-2">
        {dragHandle}
        <div className="flex-1 min-w-0">
          {card.type === "jira" && card.jiraKey && (
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] font-mono text-blue-400 font-bold">{card.jiraKey}</span>
              <span className="text-[10px] bg-slate-700 text-slate-500 px-1 rounded">{card.jiraStatus}</span>
              {baseUrl && (
                <a href={`${baseUrl}/browse/${card.jiraKey}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-slate-700 hover:text-blue-400 opacity-0 group-hover:opacity-100">
                  <ExternalLink size={10} />
                </a>
              )}
            </div>
          )}
          <p className="text-sm text-slate-200 font-medium leading-snug line-clamp-2">{card.title}</p>
        </div>
      </div>
      {card.description && <p className="text-xs text-slate-500 mb-2 line-clamp-1">{card.description}</p>}
      {card.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {card.labels.map(l => <span key={l} className="text-[10px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded-full">{l}</span>)}
        </div>
      )}
      {total > 0 && (
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="flex items-center gap-1 text-[10px] text-slate-500"><CheckSquare size={10} />{done}/{total}</span>
            <span className="text-[10px] text-slate-600">{Math.round((done / total) * 100)}%</span>
          </div>
          <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(done / total) * 100}%` }} />
          </div>
        </div>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={clsx("flex items-center gap-1 text-[10px] font-medium", pm.color)}>
          <span className={clsx("w-1.5 h-1.5 rounded-full", pm.dot)} />{pm.label}
        </span>
        {card.dueDate && (
          <span className={clsx("flex items-center gap-1 text-[10px]", over ? "text-red-400" : "text-slate-500")}>
            {over ? <AlertTriangle size={10} /> : <Clock size={10} />}
            {over ? "Overdue" : new Date(card.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        )}
        <span className="flex items-center gap-0.5 text-[10px] text-slate-700 ml-auto" title="Time in column">
          <Timer size={9} />{timeInColumn(card)}
        </span>
        {card.estimatedHours && <span className="text-[10px] text-slate-600">{card.estimatedHours}h</span>}
        {card.assignee && (
          <span className="w-5 h-5 rounded-full bg-slate-700 border border-slate-600 text-[9px] text-slate-300 flex items-center justify-center font-bold" title={card.assignee}>
            {card.assignee.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Draggable card ────────────────────────────────────────
function DraggableCard({ card, baseUrl, onCardClick }: {
  card: KanbanCard; baseUrl?: string; onCardClick: (c: KanbanCard) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: card.id });
  return (
    <div ref={setNodeRef} style={{ opacity: isDragging ? 0.3 : 1 }}>
      <CardView
        card={card}
        baseUrl={baseUrl}
        onClick={() => onCardClick(card)}
        dragHandle={
          <button {...attributes} {...listeners} className="mt-0.5 text-slate-700 hover:text-slate-400 cursor-grab active:cursor-grabbing shrink-0" onClick={e => e.stopPropagation()}>
            <GripVertical size={14} />
          </button>
        }
      />
    </div>
  );
}

// ── Column ────────────────────────────────────────────────
function Column({ id, cards, baseUrl, onAddCard, onCardClick }: {
  id: ColumnId; cards: KanbanCard[]; baseUrl?: string;
  onAddCard: (col: ColumnId) => void; onCardClick: (c: KanbanCard) => void;
}) {
  const meta = COLUMN_META[id];
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex flex-col w-72 shrink-0">
      <div className={clsx("flex items-center justify-between px-3 py-2 rounded-xl border mb-2", meta.headerBg)}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-200">{meta.label}</span>
          <span className="text-xs bg-black/20 text-slate-400 px-1.5 py-0.5 rounded-full">{cards.length}</span>
        </div>
        <button onClick={() => onAddCard(id)} className="text-slate-500 hover:text-slate-200 p-0.5 rounded hover:bg-black/20 transition-colors"><Plus size={15} /></button>
      </div>
      <div
        ref={setNodeRef}
        className={clsx("flex-1 space-y-2 rounded-xl p-2 min-h-[120px] transition-colors", isOver ? "bg-slate-800/60 ring-1 ring-slate-600" : "bg-transparent")}
      >
        {cards.map(card => <DraggableCard key={card.id} card={card} baseUrl={baseUrl} onCardClick={onCardClick} />)}
        {cards.length === 0 && (
          <div className="flex items-center justify-center h-20 text-xs text-slate-700 border border-dashed border-slate-800 rounded-xl">Drop here</div>
        )}
      </div>
    </div>
  );
}

// ── Card detail drawer ────────────────────────────────────
function CardDetailDrawer({ card, onClose, onUpdate, onDelete, onArchive, baseUrl }: {
  card: KanbanCard; onClose: () => void;
  onUpdate: (c: KanbanCard) => void; onDelete: (id: string) => void;
  onArchive?: (c: KanbanCard) => void; baseUrl?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle]     = useState(card.title);
  const [description, setDesc] = useState(card.description ?? "");
  const [dueDate, setDueDate] = useState(card.dueDate ?? "");
  const [assignee, setAssignee] = useState(card.assignee ?? "");
  const [estimatedHours, setEstHours] = useState(card.estimatedHours?.toString() ?? "");
  const [checklist, setChecklist] = useState<ChecklistItem[]>(card.checklist);
  const [checklistInput, setClInput] = useState("");
  const [priority, setPriority] = useState<Priority>(card.priority);

  function save() {
    onUpdate({ ...card, title, description: description || undefined, dueDate: dueDate || undefined, assignee: assignee || undefined, estimatedHours: estimatedHours ? Number(estimatedHours) : undefined, checklist, priority });
    setEditing(false);
  }

  function addItem(e: React.KeyboardEvent) {
    if (e.key === "Enter" && checklistInput.trim()) {
      const updated = [...checklist, { id: newId(), text: checklistInput.trim(), done: false }];
      setChecklist(updated); onUpdate({ ...card, checklist: updated }); setClInput("");
    }
  }

  function toggleItem(id: string) {
    const updated = checklist.map(i => i.id === id ? { ...i, done: !i.done } : i);
    setChecklist(updated); onUpdate({ ...card, checklist: updated });
  }

  const { done, total } = checklistProgress({ ...card, checklist });
  const pm = PRIORITY_META[priority];

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50" onClick={onClose} />
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            {card.jiraKey && <span className="text-xs font-mono text-blue-400 font-bold">{card.jiraKey}</span>}
            <span className={clsx("text-xs px-2 py-0.5 rounded-full font-medium bg-slate-800", pm.color)}>{pm.label}</span>
          </div>
          <div className="flex gap-1">
            <button onClick={() => setEditing(v => !v)} className={clsx("px-2.5 py-1 text-xs rounded-lg transition-colors", editing ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800")}>{editing ? "Done" : "Edit"}</button>
            {onArchive && card.columnId === "finished" && (
              <button onClick={() => onArchive(card)} className="px-2.5 py-1 text-xs text-amber-400 hover:bg-slate-800 rounded-lg flex items-center gap-1"><Archive size={11} />Archive</button>
            )}
            <button onClick={() => { onDelete(card.id); onClose(); }} className="px-2.5 py-1 text-xs text-red-400 hover:bg-slate-800 rounded-lg">Delete</button>
            <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-300"><X size={16} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {editing ? <input value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-transparent text-slate-100 font-semibold text-base border-b border-slate-700 pb-1 focus:outline-none focus:border-blue-500" /> : <h2 className="text-base font-semibold text-slate-100">{card.title}</h2>}

          {card.jiraKey && baseUrl && (
            <a href={`${baseUrl}/browse/${card.jiraKey}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-blue-400 hover:underline">
              <ExternalLink size={12} />Open {card.jiraKey} in Jira
            </a>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-slate-600 mb-1">Priority</p>
              {editing ? (
                <select value={priority} onChange={e => setPriority(e.target.value as Priority)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none">
                  {Object.entries(PRIORITY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              ) : <span className={clsx("text-sm font-medium flex items-center gap-1.5", pm.color)}><span className={clsx("w-2 h-2 rounded-full", pm.dot)} />{pm.label}</span>}
            </div>
            <div>
              <p className="text-xs text-slate-600 mb-1">Due Date</p>
              {editing ? <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 [color-scheme:dark] focus:outline-none" />
                : <p className={clsx("text-sm font-medium", isOverdue(card) ? "text-red-400" : "text-slate-300")}>{card.dueDate ? new Date(card.dueDate).toLocaleDateString() : "—"}</p>}
            </div>
            <div>
              <p className="text-xs text-slate-600 mb-1">Assignee</p>
              {editing ? <input value={assignee} onChange={e => setAssignee(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none" />
                : <p className="text-sm text-slate-300">{card.assignee || "—"}</p>}
            </div>
            <div>
              <p className="text-xs text-slate-600 mb-1">Estimated</p>
              {editing ? <input type="number" min={0} step={0.5} value={estimatedHours} onChange={e => setEstHours(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none" />
                : <p className="text-sm text-slate-300">{card.estimatedHours ? `${card.estimatedHours}h` : "—"}</p>}
            </div>
          </div>

          {card.labels.length > 0 && (
            <div>
              <p className="text-xs text-slate-600 mb-2">Labels</p>
              <div className="flex flex-wrap gap-1">{card.labels.map(l => <span key={l} className="text-xs bg-slate-800 border border-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{l}</span>)}</div>
            </div>
          )}

          <div>
            <p className="text-xs text-slate-600 mb-1">Description</p>
            {editing ? <textarea value={description} onChange={e => setDesc(e.target.value)} rows={3} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 resize-none focus:outline-none focus:ring-1 focus:ring-blue-600" />
              : <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">{card.description || <span className="text-slate-600">No description</span>}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-600">Checklist</p>
              {total > 0 && <span className="text-xs text-slate-500">{done}/{total}</span>}
            </div>
            {total > 0 && (
              <div className="h-1 bg-slate-700 rounded-full overflow-hidden mb-3">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(done / total) * 100}%` }} />
              </div>
            )}
            <div className="space-y-2">
              {checklist.map(item => (
                <div key={item.id} className="flex items-center gap-2">
                  <button onClick={() => toggleItem(item.id)} className={clsx("w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors", item.done ? "bg-blue-600 border-blue-600" : "border-slate-600 hover:border-slate-400")}>
                    {item.done && <span className="text-white text-[10px]">✓</span>}
                  </button>
                  <span className={clsx("text-sm", item.done ? "text-slate-600 line-through" : "text-slate-300")}>{item.text}</span>
                  {editing && <button onClick={() => { const u = checklist.filter(x => x.id !== item.id); setChecklist(u); onUpdate({ ...card, checklist: u }); }} className="ml-auto text-slate-700 hover:text-red-400"><X size={11} /></button>}
                </div>
              ))}
            </div>
            <input value={checklistInput} onChange={e => setClInput(e.target.value)} onKeyDown={addItem} placeholder="Add subtask (Enter)…" className="mt-2 w-full bg-transparent border-b border-slate-800 text-sm text-slate-400 placeholder-slate-700 py-1 focus:outline-none focus:border-slate-600" />
          </div>

          <div className="flex gap-4 text-xs text-slate-700">
            <span>Created {new Date(card.createdAt).toLocaleDateString()}</span>
            <span className="flex items-center gap-1"><Timer size={10} />In column: {timeInColumn(card)}</span>
          </div>
        </div>

        {editing && (
          <div className="p-4 border-t border-slate-800 shrink-0">
            <button onClick={save} className="w-full py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Save Changes</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Archive drawer ────────────────────────────────────────
function ArchiveDrawer({ cards, onClose, onUnarchive }: {
  cards: KanbanCard[]; onClose: () => void; onUnarchive: (c: KanbanCard) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50" onClick={onClose} />
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <Archive size={16} className="text-amber-400" />
            <h2 className="text-sm font-semibold text-slate-200">Archived Cards</h2>
            <span className="text-xs bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-full">{cards.length}</span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-300"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cards.length === 0 && (
            <p className="text-xs text-slate-600 text-center py-12">No archived cards yet.<br />Finish cards then archive them to keep the board clean.</p>
          )}
          {cards.map(card => {
            const pm = PRIORITY_META[card.priority];
            return (
              <div key={card.id} className="bg-slate-800 border border-slate-700 rounded-xl p-3">
                {card.jiraKey && <p className="text-[10px] font-mono text-blue-400 font-bold mb-1">{card.jiraKey}</p>}
                <p className="text-sm text-slate-300 font-medium leading-snug mb-2">{card.title}</p>
                <div className="flex items-center gap-2">
                  <span className={clsx("text-[10px] font-medium flex items-center gap-1", pm.color)}>
                    <span className={clsx("w-1.5 h-1.5 rounded-full", pm.dot)} />{pm.label}
                  </span>
                  {card.archivedAt && (
                    <span className="text-[10px] text-slate-600 ml-auto">
                      Archived {new Date(card.archivedAt).toLocaleDateString()}
                    </span>
                  )}
                  <button onClick={() => onUnarchive(card)} className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 px-1.5 py-0.5 rounded hover:bg-slate-700 transition-colors">
                    <RotateCcw size={9} />Restore
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Urgent droppable section ──────────────────────────────
function UrgentSection({ cards, baseUrl, onAddCard, onCardClick }: {
  cards: KanbanCard[]; baseUrl?: string;
  onAddCard: (col: ColumnId) => void; onCardClick: (c: KanbanCard) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "urgent" });

  return (
    <div className="px-6 pt-5 pb-0">
      <div className="bg-red-950/30 border border-red-900/50 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-red-400" />
            <span className="text-sm font-semibold text-red-300">Urgent</span>
            <span className="text-xs bg-red-900/40 text-red-400 px-1.5 py-0.5 rounded-full">{cards.length}</span>
          </div>
          <button onClick={() => onAddCard("urgent")} className="text-red-500 hover:text-red-300 p-0.5 hover:bg-red-900/30 rounded transition-colors"><Plus size={15} /></button>
        </div>
        <div
          ref={setNodeRef}
          className={clsx("flex gap-3 overflow-x-auto pb-1 min-h-[80px] rounded-xl p-2 transition-colors", isOver && "bg-red-900/20 ring-1 ring-red-700")}
        >
          {cards.map(card => (
            <div key={card.id} className="w-64 shrink-0">
              <DraggableCard card={card} baseUrl={baseUrl} onCardClick={onCardClick} />
            </div>
          ))}
          {cards.length === 0 && (
            <div className="flex items-center justify-center w-full text-xs text-red-900 border border-dashed border-red-900/40 rounded-xl">No urgent items — drop here</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────
export default function KanbanPage() {
  const { creds } = useApp();
  const [boardState, setBoardState] = useState<KanbanState>({ urgent: [], todo: [], ongoing: [], finished: [] });
  const [addTarget, setAddTarget]   = useState<ColumnId | null>(null);
  const [selectedCard, setSelectedCard] = useState<KanbanCard | null>(null);
  const [activeId, setActiveId]     = useState<string | null>(null);
  const [showArchive, setShowArchive] = useState(false);
  const [archivedCards, setArchivedCards] = useState<KanbanCard[]>([]);

  useEffect(() => {
    setBoardState(getKanbanState());
    setArchivedCards(getArchivedCards());
  }, []);

  function persist(state: KanbanState) { setBoardState(state); saveKanbanState(state); }

  function handleArchiveCard(card: KanbanCard) {
    const next = { ...boardState };
    for (const col of COLUMN_IDS) next[col] = next[col].filter(c => c.id !== card.id);
    persist(next);
    const updated = [...archivedCards, { ...card, archived: true, archivedAt: new Date().toISOString() }];
    setArchivedCards(updated);
    saveArchivedCards(updated);
    setSelectedCard(null);
  }

  function handleUnarchiveCard(card: KanbanCard) {
    const restored = { ...card, archived: false, archivedAt: undefined, columnId: "finished" as ColumnId };
    const next = { ...boardState, finished: [...boardState.finished, restored] };
    persist(next);
    const updated = archivedCards.filter(c => c.id !== card.id);
    setArchivedCards(updated);
    saveArchivedCards(updated);
  }

  function handleAddCard(card: KanbanCard) {
    persist({ ...boardState, [card.columnId]: [...boardState[card.columnId], card] });
  }

  function handleUpdateCard(updated: KanbanCard) {
    const next = { ...boardState };
    for (const col of COLUMN_IDS) next[col] = next[col].map(c => c.id === updated.id ? updated : c);
    persist(next);
    if (selectedCard?.id === updated.id) setSelectedCard(updated);
  }

  function handleDeleteCard(id: string) {
    const next = { ...boardState };
    for (const col of COLUMN_IDS) next[col] = next[col].filter(c => c.id !== id);
    persist(next);
  }

  function handleDragStart({ active }: DragStartEvent) { setActiveId(active.id as string); }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    if (!over) return;
    const cardId = active.id as string;
    const overId = over.id as string;
    const sourceCol = findCardColumn(cardId, boardState);
    const destCol: ColumnId | null = COLUMN_IDS.includes(overId as ColumnId)
      ? (overId as ColumnId)
      : findCardColumn(overId, boardState);
    if (!sourceCol || !destCol) return;

    const sourceCards = [...boardState[sourceCol]];
    const activeIndex = sourceCards.findIndex(c => c.id === cardId);
    if (activeIndex === -1) return;
    const [movedCard] = sourceCards.splice(activeIndex, 1);
    const updatedCard = {
      ...movedCard,
      columnId: destCol,
      ...(sourceCol !== destCol ? { columnEnteredAt: new Date().toISOString() } : {}),
    };

    if (sourceCol === destCol) {
      const overIndex = COLUMN_IDS.includes(overId as ColumnId) ? sourceCards.length : sourceCards.findIndex(c => c.id === overId);
      sourceCards.splice(overIndex < 0 ? sourceCards.length : overIndex, 0, updatedCard);
      persist({ ...boardState, [sourceCol]: sourceCards });
    } else {
      const destCards = [...boardState[destCol]];
      const overIndex = COLUMN_IDS.includes(overId as ColumnId) ? destCards.length : destCards.findIndex(c => c.id === overId);
      destCards.splice(overIndex < 0 ? destCards.length : overIndex, 0, updatedCard);
      persist({ ...boardState, [sourceCol]: sourceCards, [destCol]: destCards });
    }
  }

  const activeCard = activeId ? COLUMN_IDS.flatMap(c => boardState[c]).find(c => c.id === activeId) : null;
  const totalCards = COLUMN_IDS.reduce((s, c) => s + boardState[c].length, 0);

  return (
    <div className="flex flex-col min-h-full">
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold text-slate-200">Kanban Board</h1>
          <span className="text-xs bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full">{totalCards} card{totalCards !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowArchive(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors">
            <Archive size={13} />Archive{archivedCards.length > 0 && <span className="bg-slate-700 text-slate-400 text-[10px] px-1 rounded-full">{archivedCards.length}</span>}
          </button>
          <button onClick={() => setAddTarget("todo")} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus size={13} />Add Card
          </button>
        </div>
      </header>

      {/* Single DndContext wrapping BOTH urgent and main columns */}
      <DndContext collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <UrgentSection
          cards={boardState.urgent}
          baseUrl={creds?.baseUrl}
          onAddCard={setAddTarget}
          onCardClick={setSelectedCard}
        />

        <div className="flex-1 px-6 py-5 overflow-x-auto">
          <div className="flex gap-4 pb-4 min-w-max">
            {(["todo", "ongoing", "finished"] as ColumnId[]).map(col => (
              <Column key={col} id={col} cards={boardState[col]} baseUrl={creds?.baseUrl} onAddCard={setAddTarget} onCardClick={setSelectedCard} />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeCard && <div className="rotate-1 opacity-90 w-72"><CardView card={activeCard} /></div>}
        </DragOverlay>
      </DndContext>

      {addTarget && (
        <AddCardModal targetColumn={addTarget} onClose={() => setAddTarget(null)} onAdd={handleAddCard} creds={creds} />
      )}
      {selectedCard && (
        <CardDetailDrawer card={selectedCard} onClose={() => setSelectedCard(null)} onUpdate={handleUpdateCard} onDelete={handleDeleteCard} onArchive={handleArchiveCard} baseUrl={creds?.baseUrl} />
      )}
      {showArchive && (
        <ArchiveDrawer cards={archivedCards} onClose={() => setShowArchive(false)} onUnarchive={handleUnarchiveCard} />
      )}
    </div>
  );
}

const lbl = "block text-xs font-medium text-slate-400 mb-1.5";
const inp = "w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600";
const sel = "w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-800 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600";
