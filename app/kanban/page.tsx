"use client";
import {
  useState, useEffect, useRef, useCallback,
} from "react";
import {
  DndContext, DragOverlay, closestCenter,
  useDraggable, useDroppable,
  DragStartEvent, DragEndEvent, DragOverEvent,
} from "@dnd-kit/core";
import {
  Plus, ExternalLink, Clock, AlertTriangle, CheckSquare,
  Loader2, X, ChevronDown, GripVertical, Zap,
} from "lucide-react";
import clsx from "clsx";
import { useApp } from "@/components/AppShell";
import {
  KanbanCard, KanbanState, ColumnId, Priority,
  COLUMN_IDS, COLUMN_META, PRIORITY_META, ACCENT_COLORS, accentBorderClass,
  ChecklistItem, getKanbanState, saveKanbanState, isOverdue, checklistProgress,
} from "@/lib/kanban";

// ─── helpers ───────────────────────────────────────────────
function newId() { return crypto.randomUUID(); }

function findCardColumn(cardId: string, state: KanbanState): ColumnId | null {
  for (const col of COLUMN_IDS) {
    if (state[col].some(c => c.id === cardId)) return col;
  }
  return null;
}

// ─── AddCardModal ───────────────────────────────────────────
interface AddCardModalProps {
  targetColumn: ColumnId;
  onClose: () => void;
  onAdd: (card: KanbanCard) => void;
  creds: ReturnType<typeof useApp>["creds"];
}

type ModalTab = "custom" | "jira";

function AddCardModal({ targetColumn, onClose, onAdd, creds }: AddCardModalProps) {
  const [tab, setTab] = useState<ModalTab>("custom");

  // Custom task state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [labelInput, setLabelInput] = useState("");
  const [labels, setLabels] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [assignee, setAssignee] = useState("");
  const [accentColor, setAccentColor] = useState("");
  const [checklistInput, setChecklistInput] = useState("");
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);

  // Jira search state
  const [jqlQuery, setJqlQuery] = useState("");
  const [jiraResults, setJiraResults] = useState<{ key: string; summary: string; status: string; type: string; project: string }[]>([]);
  const [jiraLoading, setJiraLoading] = useState(false);
  const [jiraError, setJiraError] = useState("");

  function addLabel(e: React.KeyboardEvent) {
    if (e.key === "Enter" && labelInput.trim()) {
      setLabels(prev => [...prev, labelInput.trim()]);
      setLabelInput("");
    }
  }

  function addChecklistItem(e: React.KeyboardEvent) {
    if (e.key === "Enter" && checklistInput.trim()) {
      setChecklist(prev => [...prev, { id: newId(), text: checklistInput.trim(), done: false }]);
      setChecklistInput("");
    }
  }

  function handleAddCustom() {
    if (!title.trim()) return;
    onAdd({
      id: newId(),
      columnId: targetColumn,
      type: "custom",
      title: title.trim(),
      description: description || undefined,
      priority,
      labels,
      dueDate: dueDate || undefined,
      checklist,
      estimatedHours: estimatedHours ? Number(estimatedHours) : undefined,
      assignee: assignee || undefined,
      accentColor: accentColor || undefined,
      createdAt: new Date().toISOString(),
    });
    onClose();
  }

  async function searchJira() {
    if (!creds || !jqlQuery.trim()) return;
    setJiraLoading(true);
    setJiraError("");
    try {
      const res = await fetch("/api/jira/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...creds,
          jql: jqlQuery.trim().includes(" ") ? jqlQuery.trim() : `key = "${jqlQuery.trim()}" OR summary ~ "${jqlQuery.trim()}"`,
          maxResults: 20,
          fields: ["summary", "status", "issuetype", "project"],
        }),
      });
      const data = await res.json();
      if (!res.ok) { setJiraError(data.error ?? "Search failed"); return; }
      setJiraResults(data.issues?.map((i: { key: string; fields: { summary: string; status: { name: string }; issuetype: { name: string }; project: { name: string } } }) => ({
        key: i.key,
        summary: i.fields.summary,
        status: i.fields.status.name,
        type: i.fields.issuetype.name,
        project: i.fields.project.name,
      })) ?? []);
    } catch {
      setJiraError("Network error");
    } finally {
      setJiraLoading(false);
    }
  }

  function addJiraCard(r: { key: string; summary: string; status: string; type: string; project: string }) {
    onAdd({
      id: newId(),
      columnId: targetColumn,
      type: "jira",
      title: r.summary,
      priority: "medium",
      labels: [],
      checklist: [],
      jiraKey: r.key,
      jiraStatus: r.status,
      jiraType: r.type,
      jiraProject: r.project,
      createdAt: new Date().toISOString(),
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Add Card</h2>
            <p className="text-xs text-slate-500 mt-0.5">to <span className="text-slate-300">{COLUMN_META[targetColumn].label}</span></p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X size={18} /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 shrink-0">
          {([["custom", "New Task"], ["jira", "From Jira"]] as [ModalTab, string][]).map(([t, label]) => (
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
                <input
                  autoFocus
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  className={inp}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Priority</label>
                  <select value={priority} onChange={e => setPriority(e.target.value as Priority)} className={sel}>
                    {Object.entries(PRIORITY_META).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Due Date</label>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={inp + " [color-scheme:dark]"} />
                </div>
                <div>
                  <label className={lbl}>Estimated (hrs)</label>
                  <input type="number" min={0} step={0.5} value={estimatedHours} onChange={e => setEstimatedHours(e.target.value)} placeholder="e.g. 2.5" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Assignee</label>
                  <input value={assignee} onChange={e => setAssignee(e.target.value)} placeholder="Name or initials" className={inp} />
                </div>
              </div>
              <div>
                <label className={lbl}>Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Optional details…" className={inp + " resize-none"} />
              </div>
              <div>
                <label className={lbl}>Labels <span className="text-slate-600">(press Enter to add)</span></label>
                <input value={labelInput} onChange={e => setLabelInput(e.target.value)} onKeyDown={addLabel} placeholder="e.g. regression" className={inp} />
                {labels.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {labels.map(l => (
                      <span key={l} className="flex items-center gap-1 bg-slate-800 border border-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded-full">
                        {l}
                        <button onClick={() => setLabels(prev => prev.filter(x => x !== l))}><X size={10} /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className={lbl}>Checklist <span className="text-slate-600">(press Enter to add item)</span></label>
                <input value={checklistInput} onChange={e => setChecklistInput(e.target.value)} onKeyDown={addChecklistItem} placeholder="Add subtask…" className={inp} />
                {checklist.length > 0 && (
                  <div className="space-y-1 mt-2">
                    {checklist.map(item => (
                      <div key={item.id} className="flex items-center gap-2 text-sm text-slate-400">
                        <span className="text-slate-600">•</span>{item.text}
                        <button onClick={() => setChecklist(prev => prev.filter(x => x.id !== item.id))} className="ml-auto text-slate-700 hover:text-red-400"><X size={11} /></button>
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
                      onClick={() => setAccentColor(c.value)}
                      title={c.label}
                      className={clsx(
                        "w-6 h-6 rounded-full border-2 transition-all",
                        c.value === "" ? "bg-slate-700 border-slate-600" : `border-l-4 ${c.cls} bg-slate-800`,
                        accentColor === c.value ? "ring-2 ring-blue-500 ring-offset-1 ring-offset-slate-900" : "border-slate-600"
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {!creds ? (
                <p className="text-sm text-slate-500 text-center py-8">Connect Jira in Settings first.</p>
              ) : (
                <>
                  <div className="flex gap-2">
                    <input
                      value={jqlQuery}
                      onChange={e => setJqlQuery(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && searchJira()}
                      placeholder="Ticket key (e.g. QA-123) or JQL…"
                      className={inp + " flex-1"}
                    />
                    <button onClick={searchJira} disabled={jiraLoading} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">
                      {jiraLoading ? <Loader2 size={14} className="animate-spin" /> : "Search"}
                    </button>
                  </div>
                  {jiraError && <p className="text-sm text-red-400">{jiraError}</p>}
                  <div className="space-y-2">
                    {jiraResults.map(r => (
                      <button key={r.key} onClick={() => addJiraCard(r)} className="w-full text-left bg-slate-800 border border-slate-700 rounded-xl p-3 hover:border-blue-500 transition-colors group">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-blue-400 font-bold">{r.key}</span>
                          <span className="text-xs bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded">{r.status}</span>
                          <span className="text-xs text-slate-600">{r.type}</span>
                        </div>
                        <p className="text-sm text-slate-200 line-clamp-1">{r.summary}</p>
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

// ─── Card ──────────────────────────────────────────────────
function CardView({ card, baseUrl, onClick, dragHandle }: {
  card: KanbanCard;
  baseUrl?: string;
  onClick?: () => void;
  dragHandle?: React.ReactNode;
}) {
  const { done, total } = checklistProgress(card);
  const overdue = isOverdue(card);
  const pm = PRIORITY_META[card.priority];

  return (
    <div
      onClick={onClick}
      className={clsx(
        "bg-slate-800 border border-slate-700 border-l-4 rounded-xl p-3 group cursor-pointer hover:border-slate-500 transition-all",
        accentBorderClass(card.accentColor),
        overdue && "border-red-800/50"
      )}
    >
      {/* Top row */}
      <div className="flex items-start gap-1.5 mb-2">
        {dragHandle}
        <div className="flex-1 min-w-0">
          {card.type === "jira" && card.jiraKey && (
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] font-mono text-blue-400 font-bold">{card.jiraKey}</span>
              <span className="text-[10px] bg-slate-700 text-slate-500 px-1 rounded">{card.jiraStatus}</span>
              {baseUrl && (
                <a href={`${baseUrl}/browse/${card.jiraKey}`} target="_blank" rel="noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="text-slate-700 hover:text-blue-400 opacity-0 group-hover:opacity-100">
                  <ExternalLink size={10} />
                </a>
              )}
            </div>
          )}
          <p className="text-sm text-slate-200 font-medium leading-snug line-clamp-2">{card.title}</p>
        </div>
      </div>

      {/* Description preview */}
      {card.description && (
        <p className="text-xs text-slate-500 mb-2 line-clamp-1">{card.description}</p>
      )}

      {/* Labels */}
      {card.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {card.labels.map(l => (
            <span key={l} className="text-[10px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded-full">{l}</span>
          ))}
        </div>
      )}

      {/* Checklist progress bar */}
      {total > 0 && (
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="flex items-center gap-1 text-[10px] text-slate-500">
              <CheckSquare size={10} />{done}/{total}
            </span>
            <span className="text-[10px] text-slate-600">{Math.round((done / total) * 100)}%</span>
          </div>
          <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(done / total) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={clsx("flex items-center gap-1 text-[10px] font-medium", pm.color)}>
          <span className={clsx("w-1.5 h-1.5 rounded-full", pm.dot)} />
          {pm.label}
        </span>

        {card.dueDate && (
          <span className={clsx("flex items-center gap-1 text-[10px]", overdue ? "text-red-400" : "text-slate-500")}>
            {overdue ? <AlertTriangle size={10} /> : <Clock size={10} />}
            {overdue ? "Overdue" : new Date(card.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        )}

        {card.estimatedHours && (
          <span className="text-[10px] text-slate-600 ml-auto">{card.estimatedHours}h</span>
        )}

        {card.assignee && (
          <span className="w-5 h-5 rounded-full bg-slate-700 border border-slate-600 text-[9px] text-slate-300 flex items-center justify-center font-bold ml-auto" title={card.assignee}>
            {card.assignee.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── DraggableCard ──────────────────────────────────────────
function DraggableCard({ card, baseUrl, onCardClick }: {
  card: KanbanCard;
  baseUrl?: string;
  onCardClick: (card: KanbanCard) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: card.id });

  return (
    <div ref={setNodeRef} style={{ opacity: isDragging ? 0.35 : 1 }}>
      <CardView
        card={card}
        baseUrl={baseUrl}
        onClick={() => onCardClick(card)}
        dragHandle={
          <button
            {...attributes}
            {...listeners}
            className="mt-0.5 text-slate-700 hover:text-slate-400 cursor-grab active:cursor-grabbing shrink-0"
            onClick={e => e.stopPropagation()}
          >
            <GripVertical size={14} />
          </button>
        }
      />
    </div>
  );
}

// ─── Column ────────────────────────────────────────────────
function Column({ id, cards, baseUrl, onAddCard, onCardClick }: {
  id: ColumnId;
  cards: KanbanCard[];
  baseUrl?: string;
  onAddCard: (col: ColumnId) => void;
  onCardClick: (card: KanbanCard) => void;
}) {
  const meta = COLUMN_META[id];
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex flex-col w-72 shrink-0">
      {/* Header */}
      <div className={clsx("flex items-center justify-between px-3 py-2 rounded-xl border mb-2", meta.headerBg)}>
        <div className="flex items-center gap-2">
          {id === "urgent" && <Zap size={13} className="text-red-400" />}
          <span className={clsx("text-sm font-semibold", id === "urgent" ? "text-red-300" : "text-slate-200")}>{meta.label}</span>
          <span className="text-xs bg-black/20 text-slate-400 px-1.5 py-0.5 rounded-full">{cards.length}</span>
        </div>
        <button onClick={() => onAddCard(id)} className="text-slate-500 hover:text-slate-200 p-0.5 rounded hover:bg-black/20 transition-colors">
          <Plus size={15} />
        </button>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={clsx(
          "flex-1 space-y-2 rounded-xl p-2 min-h-[120px] transition-colors",
          isOver ? "bg-slate-800/60 ring-1 ring-slate-600" : "bg-transparent"
        )}
      >
        {cards.map(card => (
          <DraggableCard key={card.id} card={card} baseUrl={baseUrl} onCardClick={onCardClick} />
        ))}
        {cards.length === 0 && (
          <div className="flex items-center justify-center h-20 text-xs text-slate-700 border border-dashed border-slate-800 rounded-xl">
            Drop here
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Card Detail Drawer ─────────────────────────────────────
function CardDetailDrawer({ card, onClose, onUpdate, onDelete, baseUrl }: {
  card: KanbanCard;
  onClose: () => void;
  onUpdate: (card: KanbanCard) => void;
  onDelete: (id: string) => void;
  baseUrl?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description ?? "");
  const [dueDate, setDueDate] = useState(card.dueDate ?? "");
  const [assignee, setAssignee] = useState(card.assignee ?? "");
  const [estimatedHours, setEstimatedHours] = useState(card.estimatedHours?.toString() ?? "");
  const [checklist, setChecklist] = useState<ChecklistItem[]>(card.checklist);
  const [checklistInput, setChecklistInput] = useState("");
  const [priority, setPriority] = useState<Priority>(card.priority);

  function save() {
    onUpdate({
      ...card,
      title,
      description: description || undefined,
      dueDate: dueDate || undefined,
      assignee: assignee || undefined,
      estimatedHours: estimatedHours ? Number(estimatedHours) : undefined,
      checklist,
      priority,
    });
    setEditing(false);
  }

  function addItem(e: React.KeyboardEvent) {
    if (e.key === "Enter" && checklistInput.trim()) {
      const updated = [...checklist, { id: newId(), text: checklistInput.trim(), done: false }];
      setChecklist(updated);
      onUpdate({ ...card, checklist: updated });
      setChecklistInput("");
    }
  }

  function toggleItem(id: string) {
    const updated = checklist.map(i => i.id === id ? { ...i, done: !i.done } : i);
    setChecklist(updated);
    onUpdate({ ...card, checklist: updated });
  }

  const { done, total } = checklistProgress({ ...card, checklist });
  const pm = PRIORITY_META[priority];

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50" onClick={onClose} />
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            {card.jiraKey && (
              <span className="text-xs font-mono text-blue-400 font-bold">{card.jiraKey}</span>
            )}
            <span className={clsx("text-xs px-2 py-0.5 rounded-full font-medium", pm.color, "bg-slate-800")}>{pm.label}</span>
          </div>
          <div className="flex gap-1">
            <button onClick={() => setEditing(v => !v)} className={clsx("px-2.5 py-1 text-xs rounded-lg transition-colors", editing ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800")}>
              {editing ? "Done" : "Edit"}
            </button>
            <button onClick={() => { onDelete(card.id); onClose(); }} className="px-2.5 py-1 text-xs text-red-400 hover:bg-slate-800 rounded-lg">Delete</button>
            <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-300"><X size={16} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Title */}
          {editing ? (
            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-transparent text-slate-100 font-semibold text-base border-b border-slate-700 pb-1 focus:outline-none focus:border-blue-500" />
          ) : (
            <h2 className="text-base font-semibold text-slate-100 leading-snug">{card.title}</h2>
          )}

          {/* Jira link */}
          {card.jiraKey && baseUrl && (
            <a href={`${baseUrl}/browse/${card.jiraKey}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-blue-400 hover:underline">
              <ExternalLink size={12} />Open {card.jiraKey} in Jira
            </a>
          )}

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-slate-600 mb-1">Priority</p>
              {editing ? (
                <select value={priority} onChange={e => setPriority(e.target.value as Priority)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none">
                  {Object.entries(PRIORITY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              ) : (
                <span className={clsx("text-sm font-medium flex items-center gap-1.5", pm.color)}>
                  <span className={clsx("w-2 h-2 rounded-full", pm.dot)} />{pm.label}
                </span>
              )}
            </div>
            <div>
              <p className="text-xs text-slate-600 mb-1">Due Date</p>
              {editing ? (
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 [color-scheme:dark] focus:outline-none" />
              ) : (
                <p className={clsx("text-sm font-medium", isOverdue(card) ? "text-red-400" : "text-slate-300")}>
                  {card.dueDate ? new Date(card.dueDate).toLocaleDateString() : "—"}
                </p>
              )}
            </div>
            <div>
              <p className="text-xs text-slate-600 mb-1">Assignee</p>
              {editing ? (
                <input value={assignee} onChange={e => setAssignee(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none" />
              ) : (
                <p className="text-sm text-slate-300">{card.assignee || "—"}</p>
              )}
            </div>
            <div>
              <p className="text-xs text-slate-600 mb-1">Estimated</p>
              {editing ? (
                <input type="number" min={0} step={0.5} value={estimatedHours} onChange={e => setEstimatedHours(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none" />
              ) : (
                <p className="text-sm text-slate-300">{card.estimatedHours ? `${card.estimatedHours}h` : "—"}</p>
              )}
            </div>
          </div>

          {/* Labels */}
          {card.labels.length > 0 && (
            <div>
              <p className="text-xs text-slate-600 mb-2">Labels</p>
              <div className="flex flex-wrap gap-1">
                {card.labels.map(l => <span key={l} className="text-xs bg-slate-800 border border-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{l}</span>)}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <p className="text-xs text-slate-600 mb-1">Description</p>
            {editing ? (
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 resize-none focus:outline-none focus:ring-1 focus:ring-blue-600" />
            ) : (
              <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">{card.description || <span className="text-slate-600">No description</span>}</p>
            )}
          </div>

          {/* Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-600">Checklist</p>
              {total > 0 && <span className="text-xs text-slate-500">{done}/{total}</span>}
            </div>
            {total > 0 && (
              <div className="h-1 bg-slate-700 rounded-full overflow-hidden mb-3">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(done / total) * 100}%` }} />
              </div>
            )}
            <div className="space-y-2">
              {checklist.map(item => (
                <div key={item.id} className="flex items-center gap-2">
                  <button
                    onClick={() => toggleItem(item.id)}
                    className={clsx("w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors", item.done ? "bg-blue-600 border-blue-600" : "border-slate-600 hover:border-slate-400")}
                  >
                    {item.done && <span className="text-white text-[10px]">✓</span>}
                  </button>
                  <span className={clsx("text-sm", item.done ? "text-slate-600 line-through" : "text-slate-300")}>{item.text}</span>
                  {editing && (
                    <button onClick={() => { const u = checklist.filter(x => x.id !== item.id); setChecklist(u); onUpdate({ ...card, checklist: u }); }} className="ml-auto text-slate-700 hover:text-red-400"><X size={11} /></button>
                  )}
                </div>
              ))}
            </div>
            <input
              value={checklistInput}
              onChange={e => setChecklistInput(e.target.value)}
              onKeyDown={addItem}
              placeholder="Add subtask (Enter to add)…"
              className="mt-2 w-full bg-transparent border-b border-slate-800 text-sm text-slate-400 placeholder-slate-700 py-1 focus:outline-none focus:border-slate-600"
            />
          </div>

          <p className="text-xs text-slate-700">Created {new Date(card.createdAt).toLocaleDateString()}</p>
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

// ─── Main Kanban Page ───────────────────────────────────────
export default function KanbanPage() {
  const { creds } = useApp();
  const [boardState, setBoardState] = useState<KanbanState>({ urgent: [], todo: [], ongoing: [], finished: [] });
  const [addTarget, setAddTarget] = useState<ColumnId | null>(null);
  const [selectedCard, setSelectedCard] = useState<KanbanCard | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overColumnId, setOverColumnId] = useState<ColumnId | null>(null);

  useEffect(() => {
    setBoardState(getKanbanState());
  }, []);

  function persist(state: KanbanState) {
    setBoardState(state);
    saveKanbanState(state);
  }

  function handleAddCard(card: KanbanCard) {
    const col = card.columnId;
    const next = { ...boardState, [col]: [...boardState[col], card] };
    persist(next);
  }

  function handleUpdateCard(updated: KanbanCard) {
    const next = { ...boardState };
    for (const col of COLUMN_IDS) {
      next[col] = next[col].map(c => c.id === updated.id ? updated : c);
    }
    persist(next);
    if (selectedCard?.id === updated.id) setSelectedCard(updated);
  }

  function handleDeleteCard(id: string) {
    const next = { ...boardState };
    for (const col of COLUMN_IDS) {
      next[col] = next[col].filter(c => c.id !== id);
    }
    persist(next);
  }

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string);
  }

  function handleDragOver({ over }: DragOverEvent) {
    if (!over) { setOverColumnId(null); return; }
    const overId = over.id as string;
    if (COLUMN_IDS.includes(overId as ColumnId)) {
      setOverColumnId(overId as ColumnId);
    } else {
      setOverColumnId(findCardColumn(overId, boardState));
    }
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    setOverColumnId(null);
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
    const updatedCard = { ...movedCard, columnId: destCol };

    if (sourceCol === destCol) {
      const overIndex = COLUMN_IDS.includes(overId as ColumnId)
        ? sourceCards.length
        : sourceCards.findIndex(c => c.id === overId);
      const insertAt = overIndex < 0 ? sourceCards.length : overIndex;
      sourceCards.splice(insertAt, 0, updatedCard);
      persist({ ...boardState, [sourceCol]: sourceCards });
    } else {
      const destCards = [...boardState[destCol]];
      const overIndex = COLUMN_IDS.includes(overId as ColumnId)
        ? destCards.length
        : destCards.findIndex(c => c.id === overId);
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
        <button
          onClick={() => setAddTarget("todo")}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={13} />
          Add Card
        </button>
      </header>

      {/* Urgent row — full width strip */}
      <div className="px-6 pt-5">
        <div className="bg-red-950/30 border border-red-900/50 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-red-400" />
              <span className="text-sm font-semibold text-red-300">Urgent</span>
              <span className="text-xs bg-red-900/40 text-red-400 px-1.5 py-0.5 rounded-full">{boardState.urgent.length}</span>
            </div>
            <button onClick={() => setAddTarget("urgent")} className="text-red-500 hover:text-red-300 p-0.5 rounded hover:bg-red-900/30 transition-colors">
              <Plus size={15} />
            </button>
          </div>
          <DndContext collisionDetection={closestCenter} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
            <UrgentDropZone cards={boardState.urgent} baseUrl={creds?.baseUrl} onCardClick={setSelectedCard} />
            <DragOverlay>
              {activeCard && <div className="rotate-2 opacity-90 w-64"><CardView card={activeCard} /></div>}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      {/* Main board columns */}
      <div className="flex-1 px-6 py-5 overflow-x-auto">
        <DndContext collisionDetection={closestCenter} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 pb-4 min-w-max">
            {(["todo", "ongoing", "finished"] as ColumnId[]).map(col => (
              <Column
                key={col}
                id={col}
                cards={boardState[col]}
                baseUrl={creds?.baseUrl}
                onAddCard={setAddTarget}
                onCardClick={setSelectedCard}
              />
            ))}
          </div>
          <DragOverlay>
            {activeCard && <div className="rotate-1 opacity-90 w-72"><CardView card={activeCard} /></div>}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Add card modal */}
      {addTarget && (
        <AddCardModal
          targetColumn={addTarget}
          onClose={() => setAddTarget(null)}
          onAdd={handleAddCard}
          creds={creds}
        />
      )}

      {/* Card detail drawer */}
      {selectedCard && (
        <CardDetailDrawer
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
          onUpdate={handleUpdateCard}
          onDelete={handleDeleteCard}
          baseUrl={creds?.baseUrl}
        />
      )}
    </div>
  );
}

// ─── Urgent drop zone (horizontal) ─────────────────────────
function UrgentDropZone({ cards, baseUrl, onCardClick }: {
  cards: KanbanCard[];
  baseUrl?: string;
  onCardClick: (c: KanbanCard) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "urgent" });

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        "flex gap-3 overflow-x-auto pb-1 min-h-[80px] rounded-xl p-2 transition-colors",
        isOver && "bg-red-900/20 ring-1 ring-red-700"
      )}
    >
      {cards.map(card => (
        <div key={card.id} className="w-64 shrink-0">
          <DraggableCard card={card} baseUrl={baseUrl} onCardClick={onCardClick} />
        </div>
      ))}
      {cards.length === 0 && (
        <div className="flex items-center justify-center w-full text-xs text-red-900 border border-dashed border-red-900/40 rounded-xl">
          No urgent items
        </div>
      )}
    </div>
  );
}

// ─── Shared mini styles ─────────────────────────────────────
const lbl = "block text-xs font-medium text-slate-400 mb-1.5";
const inp = "w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600";
const sel = "w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-800 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600";
// suppress unused warning
void ChevronDown;
