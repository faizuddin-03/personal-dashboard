"use client";
import { useState, useEffect } from "react";
import {
  DndContext, DragOverlay, closestCenter,
  useDroppable,
  DragStartEvent, DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus, ExternalLink, Clock, AlertTriangle, CheckSquare,
  Loader2, X, GripVertical, Zap, Search, Archive, RotateCcw, Timer, ChevronLeft, ChevronRight,
} from "lucide-react";
import clsx from "clsx";
import { useApp } from "@/components/AppShell";
import { reporterIs } from "@/lib/jira";
import Linkified from "@/components/Linkified";
import {
  KanbanCard, KanbanState, ColumnId, Priority,
  COLUMN_IDS, COLUMN_META, PRIORITY_META, ACCENT_COLORS, accentBorderClass,
  ChecklistItem, getKanbanState, saveKanbanState, isOverdue, checklistProgress,
  timeInColumn, getArchivedCards, saveArchivedCards,
} from "@/lib/kanban";

function newId() { return crypto.randomUUID(); }

// ── TS Tracker types & helpers ────────────────────────────
interface _TSCase  { status: "pass"|"fail"|"in-progress"|null; disabled?: boolean; }
interface _TSSuite { id: string; title: string; cases: _TSCase[]; }
interface _TSCREntry { id: string; crKey: string; crSummary: string; suites: _TSSuite[]; }

function loadTSData(): _TSCREntry[] {
  try { return JSON.parse(localStorage.getItem("test_tracker_crs") ?? "[]"); } catch { return []; }
}

function findSuite(suiteId: string, tsData: _TSCREntry[]): { cr: _TSCREntry; suite: _TSSuite } | null {
  for (const cr of tsData) {
    const suite = cr.suites.find(s => s.id === suiteId);
    if (suite) return { cr, suite };
  }
  return null;
}

function buildJiraJql(q: string, projectKey?: string): string {
  const escaped = q.trim().replace(/"/g, "");
  const isId  = /^\d+$/.test(escaped);
  const isKey = /^[A-Za-z]+-\d+$/.test(escaped);
  const resolvedKey = isId && projectKey ? `${projectKey}-${escaped}` : null;
  if (resolvedKey) return `key = "${resolvedKey}" ORDER BY updated DESC`;
  if (isId)        return `id = ${escaped} ORDER BY updated DESC`;
  if (isKey)       return `key = "${escaped}" ORDER BY updated DESC`;
  return `text ~ "${escaped}" ORDER BY updated DESC`;
}

function parseJiraResults(data: { issues?: unknown[] }): JiraResult[] {
  return (data.issues ?? []).map((i) => {
    const issue = i as { key: string; fields: { summary: string; status: { name: string }; issuetype: { name: string }; project: { name: string }; updated: string } };
    return {
      key: issue.key,
      summary: issue.fields.summary,
      status: issue.fields.status.name,
      type: issue.fields.issuetype.name,
      project: issue.fields.project.name,
      updated: issue.fields.updated,
    };
  });
}

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
  const [dueTime, setDueTime]           = useState("");
  const [estimatedHours, setEstimated]  = useState("");
  const [assignee, setAssignee]         = useState("");
  const [accentColor, setAccentColor]   = useState("");
  const [boardType, setBoardType]       = useState<"task" | "cr">("task");
  const [checklistInput, setClInput]    = useState("");
  const [checklist, setChecklist]       = useState<ChecklistItem[]>([]);

  // Jira link (custom tab)
  const [showJiraLink, setShowJiraLink]       = useState(false);
  const [jiraLinkQuery, setJiraLinkQuery]     = useState("");
  const [jiraLinkResults, setJiraLinkResults] = useState<JiraResult[]>([]);
  const [jiraLinkLoading, setJiraLinkLoading] = useState(false);
  const [jiraLinkSearching, setJiraLinkSearching] = useState(false);
  const [linkedJiraKey, setLinkedJiraKey]     = useState("");
  const [linkedJiraSummary, setLinkedJiraSummary] = useState("");

  // Jira search (jira tab)
  const [jiraQuery, setJiraQuery]       = useState("");
  const [allJira, setAllJira]           = useState<JiraResult[]>([]);
  const [jiraLoading, setJiraLoading]   = useState(false);
  const [jiraSearchLoading, setJiraSearchLoading] = useState(false);
  const [jiraError, setJiraError]       = useState("");

  const buildJql = (q: string) => buildJiraJql(q, creds?.defaultProjectKey);

  // Initial load: assigned/reported tickets
  useEffect(() => {
    if (tab !== "jira" || !creds || allJira.length > 0) return;
    setJiraLoading(true);
    setJiraError("");
    fetch("/api/jira/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...creds,
        jql: `${reporterIs(creds!)} ORDER BY updated DESC`,
        maxResults: 80,
        fields: ["summary", "status", "issuetype", "project", "updated"],
      }),
    })
      .then(r => r.json())
      .then(data => setAllJira(parseJiraResults(data)))
      .catch(() => setJiraError("Failed to load tickets"))
      .finally(() => setJiraLoading(false));
  }, [tab, creds, allJira.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced smart search (number, key, or text)
  useEffect(() => {
    if (tab !== "jira" || !creds || jiraQuery.length < 2) return;
    const timer = setTimeout(() => {
      setJiraSearchLoading(true);
      fetch("/api/jira/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...creds,
          jql: buildJql(jiraQuery),
          maxResults: 50,
          fields: ["summary", "status", "issuetype", "project", "updated"],
        }),
      })
        .then(r => r.json())
        .then(data => setAllJira(parseJiraResults(data)))
        .catch(() => {})
        .finally(() => setJiraSearchLoading(false));
    }, 500);
    return () => clearTimeout(timer);
  }, [jiraQuery, tab, creds]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredJira = jiraQuery.length >= 2 ? allJira : allJira.filter(r => {
    const q = jiraQuery.toLowerCase();
    return !q || r.key.toLowerCase().includes(q) || r.summary.toLowerCase().includes(q) || r.project.toLowerCase().includes(q);
  });

  // Initial load for jira link panel (custom tab)
  useEffect(() => {
    if (!showJiraLink || !creds || jiraLinkResults.length > 0) return;
    setJiraLinkLoading(true);
    fetch("/api/jira/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...creds,
        jql: `${reporterIs(creds!)} ORDER BY updated DESC`,
        maxResults: 80,
        fields: ["summary", "status", "issuetype", "project", "updated"],
      }),
    })
      .then(r => r.json())
      .then(data => setJiraLinkResults(parseJiraResults(data)))
      .catch(() => {})
      .finally(() => setJiraLinkLoading(false));
  }, [showJiraLink, creds]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search for jira link panel (custom tab)
  useEffect(() => {
    if (!showJiraLink || !creds || jiraLinkQuery.length < 2) return;
    const timer = setTimeout(() => {
      setJiraLinkSearching(true);
      fetch("/api/jira/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...creds,
          jql: buildJql(jiraLinkQuery),
          maxResults: 50,
          fields: ["summary", "status", "issuetype", "project", "updated"],
        }),
      })
        .then(r => r.json())
        .then(data => setJiraLinkResults(parseJiraResults(data)))
        .catch(() => {})
        .finally(() => setJiraLinkSearching(false));
    }, 500);
    return () => clearTimeout(timer);
  }, [jiraLinkQuery, showJiraLink, creds]); // eslint-disable-line react-hooks/exhaustive-deps

  function addLabel(e: React.KeyboardEvent) {
    if (e.key === "Enter" && labelInput.trim()) { setLabels(p => [...p, labelInput.trim()]); setLabelInput(""); }
  }
  function addChecklistItem(e: React.KeyboardEvent) {
    if (e.key === "Enter" && checklistInput.trim()) { setChecklist(p => [...p, { id: newId(), text: checklistInput.trim(), done: false }]); setClInput(""); }
  }

  function handleAddCustom() {
    if (!title.trim()) return;
    onAdd({
      id: newId(), columnId: targetColumn, type: "custom", boardType: "task",
      title: title.trim(), description: description || undefined,
      priority, labels, dueDate: dueDate || undefined, dueTime: dueTime || undefined, checklist,
      estimatedHours: estimatedHours ? Number(estimatedHours) : undefined,
      assignee: assignee || undefined,
      accentColor: accentColor || undefined,
      jiraKey: linkedJiraKey || undefined,
      createdAt: new Date().toISOString(),
    });
    onClose();
  }

  function addJiraCard(r: JiraResult) {
    onAdd({
      id: newId(), columnId: targetColumn, type: "jira", boardType,
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  <label className={lbl}>Due Time</label>
                  <input type="time" value={dueTime} onChange={e => setDueTime(e.target.value)} className={inp + " [color-scheme:dark]"} />
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
              {creds && (
                <div>
                  <div className="flex items-center justify-between">
                    <label className={lbl}>Link Jira Ticket <span className="text-slate-600">(optional)</span></label>
                    {!showJiraLink && !linkedJiraKey && (
                      <button onClick={() => setShowJiraLink(true)} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">+ Link</button>
                    )}
                  </div>
                  {linkedJiraKey ? (
                    <div className="flex items-center justify-between mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-mono text-blue-400 font-bold shrink-0">{linkedJiraKey}</span>
                        <span className="text-xs text-slate-400 truncate">{linkedJiraSummary}</span>
                      </div>
                      <button onClick={() => { setLinkedJiraKey(""); setLinkedJiraSummary(""); setShowJiraLink(false); }} className="text-slate-600 hover:text-red-400 ml-2 shrink-0"><X size={13} /></button>
                    </div>
                  ) : showJiraLink && (
                    <div className="mt-1">
                      <div className="relative">
                        <Search size={13} className="absolute left-3 top-2.5 text-slate-500 pointer-events-none" />
                        <input
                          autoFocus
                          value={jiraLinkQuery}
                          onChange={e => setJiraLinkQuery(e.target.value)}
                          placeholder="Search by number, key, or summary…"
                          className={inp + " pl-8 pr-8"}
                        />
                        {jiraLinkSearching && <Loader2 size={13} className="absolute right-3 top-2.5 text-blue-400 animate-spin" />}
                      </div>
                      {jiraLinkLoading ? (
                        <div className="flex items-center justify-center py-4"><Loader2 size={16} className="animate-spin text-blue-500" /></div>
                      ) : jiraLinkResults.length === 0 ? (
                        <p className="text-xs text-slate-600 text-center py-3">{jiraLinkQuery.length >= 2 ? "No results" : "Loading recent tickets…"}</p>
                      ) : (
                        <div className="max-h-40 overflow-y-auto mt-1.5 space-y-1.5">
                          {(jiraLinkQuery.length >= 2 ? jiraLinkResults : jiraLinkResults.filter(r => {
                            const q = jiraLinkQuery.toLowerCase();
                            return !q || r.key.toLowerCase().includes(q) || r.summary.toLowerCase().includes(q);
                          })).map(r => (
                            <button
                              key={r.key}
                              onClick={() => { setLinkedJiraKey(r.key); setLinkedJiraSummary(r.summary); setShowJiraLink(false); }}
                              className="w-full text-left bg-slate-800 border border-slate-700 rounded-xl p-2.5 hover:border-blue-500 transition-colors"
                            >
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-xs font-mono text-blue-400 font-bold">{r.key}</span>
                                <span className="text-xs bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded">{r.status}</span>
                              </div>
                              <p className="text-xs text-slate-300 line-clamp-1">{r.summary}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              <div>
                <label className={lbl}>Accent Color</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {ACCENT_COLORS.map(c => (
                    <button
                      key={c.value}
                      title={c.label}
                      onClick={() => setAccentColor(c.value)}
                      className={clsx(
                        "w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all hover:scale-110",
                        accentColor === c.value ? "border-white shadow-lg scale-110" : "border-transparent"
                      )}
                      style={{ backgroundColor: c.swatch }}
                    >
                      {accentColor === c.value && (
                        <svg viewBox="0 0 12 12" width="12" height="12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className={lbl}>Board Type</label>
                <div className="flex gap-1.5 mt-1">
                  {([["task", "Task"], ["cr", "CR Ticket"]] as const).map(([bt, label]) => (
                    <button
                      key={bt}
                      type="button"
                      onClick={() => setBoardType(bt)}
                      className={clsx(
                        "px-3 py-1.5 text-xs rounded-lg border transition-colors",
                        boardType === bt ? "bg-blue-600/20 border-blue-500 text-blue-400" : "border-slate-700 text-slate-500 hover:text-slate-300"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
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
                      placeholder="Search by number, key, or summary…"
                      className={inp + " pl-8 pr-8"}
                    />
                    {jiraSearchLoading && <Loader2 size={13} className="absolute right-3 top-2.5 text-blue-400 animate-spin" />}
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
function CardView({ card, baseUrl, onClick, dragHandle, tsData, allCards }: {
  card: KanbanCard; baseUrl?: string; onClick?: () => void; dragHandle?: React.ReactNode;
  tsData?: _TSCREntry[]; allCards?: KanbanCard[];
}) {
  const { done, total } = checklistProgress(card);
  const over = isOverdue(card);
  const pm = PRIORITY_META[card.priority];

  const isCR = card.boardType === "cr";

  // Linked task progress (CR cards only)
  const linkedTaskIds = card.linkedTaskIds ?? [];
  const linkedTasks = allCards ? allCards.filter(c => linkedTaskIds.includes(c.id)) : [];
  const tasksTotal = linkedTasks.length;
  const tasksDone = linkedTasks.filter(c => c.columnId === "finished").length;

  // TS Suite progress
  const tsLinked = card.linkedTSSuiteId && tsData ? findSuite(card.linkedTSSuiteId, tsData) : null;
  const tsStats = tsLinked ? (() => {
    const activeCases = tsLinked.suite.cases.filter(c => !c.disabled);
    const tsTotal = activeCases.length;
    const pass = activeCases.filter(c => c.status === "pass").length;
    const fail = activeCases.filter(c => c.status === "fail").length;
    const inProgress = activeCases.filter(c => c.status === "in-progress").length;
    const notRun = activeCases.filter(c => c.status === null).length;
    return { tsTotal, pass, fail, inProgress, notRun };
  })() : null;

  return (
    <div
      onClick={onClick}
      className={clsx(
        "border border-l-4 rounded-xl p-3 group cursor-pointer hover:border-slate-500 transition-all",
        isCR ? "bg-indigo-950/50 border-slate-700" : "bg-slate-800 border-slate-700",
        accentBorderClass(card.accentColor),
        over && "border-red-800/50"
      )}
    >
      <div className="flex items-start gap-1.5 mb-2">
        {dragHandle}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            {isCR
              ? <span className="text-xs bg-indigo-900/60 text-indigo-300 border border-indigo-700/50 px-1.5 py-0.5 rounded-full font-medium">CR</span>
              : <span className="text-xs bg-slate-700/80 text-slate-400 border border-slate-600/50 px-1.5 py-0.5 rounded-full font-medium">Task</span>
            }
            {card.jiraKey && (
              <>
                <span className="text-xs font-mono text-blue-400 font-bold">{card.jiraKey}</span>
                {baseUrl && (
                  <a href={`${baseUrl}/browse/${card.jiraKey}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-slate-700 hover:text-blue-400 opacity-0 group-hover:opacity-100">
                    <ExternalLink size={10} />
                  </a>
                )}
              </>
            )}
          </div>
          <p className="text-sm text-slate-200 font-medium leading-snug line-clamp-2">{card.title}</p>
        </div>
      </div>
      {card.description && <p className="text-xs text-slate-500 mb-2 line-clamp-1">{card.description}</p>}
      {card.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {card.labels.map(l => <span key={l} className="text-xs bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded-full">{l}</span>)}
        </div>
      )}
      {total > 0 && (
        <div className="mb-2">
          <p className="text-xs text-slate-500 mb-1">Checklist</p>
          <div className="flex items-center justify-between mb-1">
            <span className="flex items-center gap-1 text-xs text-slate-500"><CheckSquare size={10} />{done}/{total}</span>
            <span className="text-xs text-slate-600">{Math.round((done / total) * 100)}%</span>
          </div>
          <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(done / total) * 100}%` }} />
          </div>
        </div>
      )}
      {isCR && tasksTotal > 0 && (
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-500">Tasks</span>
            <span className="text-xs text-slate-500">{tasksDone}/{tasksTotal} done</span>
          </div>
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${(tasksDone / tasksTotal) * 100}%` }} />
          </div>
        </div>
      )}
      {tsStats && tsStats.tsTotal > 0 && (
        <div className="mb-2">
          <p className="text-xs text-slate-500 mb-1">TS Progress</p>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-500">{tsStats.pass} pass · {tsStats.fail} fail · {tsStats.pass + tsStats.fail}/{tsStats.tsTotal}</span>
            <span className="text-xs text-slate-600">{Math.round(((tsStats.pass + tsStats.fail) / tsStats.tsTotal) * 100)}%</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden flex bg-slate-700">
            {tsStats.pass > 0 && <div className="bg-green-500" style={{ width: `${(tsStats.pass / tsStats.tsTotal) * 100}%`, minWidth: 0 }} />}
            {tsStats.fail > 0 && <div className="bg-red-500" style={{ width: `${(tsStats.fail / tsStats.tsTotal) * 100}%`, minWidth: 0 }} />}
            {tsStats.inProgress > 0 && <div className="bg-amber-500" style={{ width: `${(tsStats.inProgress / tsStats.tsTotal) * 100}%`, minWidth: 0 }} />}
          </div>
        </div>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={clsx("flex items-center gap-1 text-xs font-medium", pm.color)}>
          <span className={clsx("w-1.5 h-1.5 rounded-full", pm.dot)} />{pm.label}
        </span>
        {card.dueDate && (
          <span className={clsx("flex items-center gap-1 text-xs", over ? "text-red-400" : "text-slate-500")}>
            {over ? <AlertTriangle size={10} /> : <Clock size={10} />}
            {over ? "Overdue" : `${new Date(card.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}${card.dueTime ? ` ${card.dueTime}` : ""}`}
          </span>
        )}
        <span className="flex items-center gap-0.5 text-xs text-slate-700 ml-auto" title="Time in column">
          <Timer size={9} />{timeInColumn(card)}
        </span>
        {card.estimatedHours && <span className="text-xs text-slate-600">{card.estimatedHours}h</span>}
        {card.assignee && (
          <span className="w-5 h-5 rounded-full bg-slate-700 border border-slate-600 text-xs text-slate-300 flex items-center justify-center font-bold" title={card.assignee}>
            {card.assignee.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Draggable card ────────────────────────────────────────
function DraggableCard({ card, baseUrl, onCardClick, tsData, allCards }: {
  card: KanbanCard; baseUrl?: string; onCardClick: (c: KanbanCard) => void;
  tsData?: _TSCREntry[]; allCards?: KanbanCard[];
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={{ ...style, opacity: isDragging ? 0.3 : 1 }}>
      <CardView
        card={card}
        baseUrl={baseUrl}
        tsData={tsData}
        allCards={allCards}
        onClick={() => onCardClick(card)}
        dragHandle={
          <button {...attributes} {...listeners} aria-label="Drag to reorder" className="mt-0.5 p-1 -ml-1 text-slate-600 hover:text-slate-300 cursor-grab active:cursor-grabbing shrink-0" onClick={e => e.stopPropagation()}>
            <GripVertical size={18} />
          </button>
        }
      />
    </div>
  );
}

// ── Column ────────────────────────────────────────────────
function Column({ id, cards, baseUrl, onAddCard, onCardClick, collapsed, onToggleCollapse, tsData, allCards }: {
  id: ColumnId; cards: KanbanCard[]; baseUrl?: string;
  onAddCard: (col: ColumnId) => void; onCardClick: (c: KanbanCard) => void;
  collapsed?: boolean; onToggleCollapse?: () => void;
  tsData?: _TSCREntry[]; allCards?: KanbanCard[];
}) {
  const meta = COLUMN_META[id];
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex flex-col w-72 shrink-0 h-full">
      <div className={clsx("flex items-center justify-between px-3 py-2 rounded-xl border mb-2", meta.headerBg)}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-200">{meta.label}</span>
          <span className="text-xs bg-black/20 text-slate-400 px-1.5 py-0.5 rounded-full">{cards.length}</span>
        </div>
        <div className="flex items-center gap-0.5">
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              aria-label={collapsed ? `Expand ${meta.label}` : `Collapse ${meta.label}`}
              className="text-slate-500 hover:text-slate-200 p-0.5 rounded hover:bg-black/20 transition-colors"
              title={collapsed ? "Expand" : "Collapse"}
            >
              {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
            </button>
          )}
          <button onClick={() => onAddCard(id)} aria-label={`Add card to ${meta.label}`} className="text-slate-500 hover:text-slate-200 p-0.5 rounded hover:bg-black/20 transition-colors"><Plus size={15} /></button>
        </div>
      </div>
      {collapsed ? (
        <div className="flex items-center justify-center py-3 text-xs text-slate-700 border border-dashed border-slate-800 rounded-xl select-none">
          {cards.length} card{cards.length !== 1 ? "s" : ""} hidden
        </div>
      ) : (
        <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={clsx("flex-1 space-y-2 rounded-xl p-2 overflow-y-auto transition-colors", isOver ? "bg-slate-800/60 ring-1 ring-slate-600" : "bg-transparent")}
        >
          {cards.map(card => <DraggableCard key={card.id} card={card} baseUrl={baseUrl} onCardClick={onCardClick} tsData={tsData} allCards={allCards} />)}
          {cards.length === 0 && (
            <div className="flex items-center justify-center h-20 text-xs text-slate-700 border border-dashed border-slate-800 rounded-xl">Drop here</div>
          )}
        </div>
        </SortableContext>
      )}
    </div>
  );
}

// ── Card detail drawer ────────────────────────────────────
function CardDetailDrawer({ card, onClose, onUpdate, onDelete, onArchive, baseUrl, creds, tsData, allCards }: {
  card: KanbanCard; onClose: () => void;
  onUpdate: (c: KanbanCard) => void; onDelete: (id: string) => void;
  onArchive?: (c: KanbanCard) => void; baseUrl?: string;
  creds: ReturnType<typeof useApp>["creds"];
  tsData: _TSCREntry[];
  allCards: KanbanCard[];
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle]     = useState(card.title);
  const [description, setDesc] = useState(card.description ?? "");
  const [dueDate, setDueDate] = useState(card.dueDate ?? "");
  const [dueTime, setDueTime] = useState(card.dueTime ?? "");
  const [assignee, setAssignee] = useState(card.assignee ?? "");
  const [estimatedHours, setEstHours] = useState(card.estimatedHours?.toString() ?? "");
  const [checklist, setChecklist] = useState<ChecklistItem[]>(card.checklist);
  const [checklistInput, setClInput] = useState("");
  const [priority, setPriority] = useState<Priority>(card.priority);
  const [labels, setLabels] = useState<string[]>(card.labels);
  const [labelInput, setLabelInput] = useState("");
  const [accentColor, setAccentColor] = useState(card.accentColor ?? "");
  const [cardBoardType, setCardBoardType] = useState<"task" | "cr">(card.boardType ?? "task");
  const [confirmArchive, setConfirmArchive] = useState(false);

  // TS Suite link
  const [linkedTSSuiteId, setLinkedTSSuiteId] = useState<string>(card.linkedTSSuiteId ?? "");
  const [showSuitePicker, setShowSuitePicker] = useState(false);
  const [pickedCRId, setPickedCRId] = useState("");

  // Linked tasks (CR cards only)
  const [linkedTaskIds, setLinkedTaskIds] = useState<string[]>(card.linkedTaskIds ?? []);
  const [taskSearchQuery, setTaskSearchQuery] = useState("");
  const [showTaskPicker, setShowTaskPicker] = useState(false);
  const allTaskCards = allCards.filter(c => c.boardType === "task");

  // Jira link (custom cards only)
  const [editLinkedKey, setEditLinkedKey]           = useState(card.jiraKey ?? "");
  const [showJiraLinkEdit, setShowJiraLinkEdit]     = useState(false);
  const [jiraEditQuery, setJiraEditQuery]           = useState("");
  const [jiraEditResults, setJiraEditResults]       = useState<JiraResult[]>([]);
  const [jiraEditLoading, setJiraEditLoading]       = useState(false);
  const [jiraEditSearching, setJiraEditSearching]   = useState(false);

  // Initial load when link panel opens
  useEffect(() => {
    if (!showJiraLinkEdit || !creds || jiraEditResults.length > 0) return;
    setJiraEditLoading(true);
    fetch("/api/jira/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...creds, jql: `${reporterIs(creds!)} ORDER BY updated DESC`, maxResults: 80, fields: ["summary", "status", "issuetype", "project", "updated"] }),
    })
      .then(r => r.json()).then(d => setJiraEditResults(parseJiraResults(d)))
      .catch(() => {}).finally(() => setJiraEditLoading(false));
  }, [showJiraLinkEdit, creds]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search in link panel
  useEffect(() => {
    if (!showJiraLinkEdit || !creds || jiraEditQuery.length < 2) return;
    const t = setTimeout(() => {
      setJiraEditSearching(true);
      fetch("/api/jira/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...creds, jql: buildJiraJql(jiraEditQuery, creds.defaultProjectKey), maxResults: 50, fields: ["summary", "status", "issuetype", "project", "updated"] }),
      })
        .then(r => r.json()).then(d => setJiraEditResults(parseJiraResults(d)))
        .catch(() => {}).finally(() => setJiraEditSearching(false));
    }, 500);
    return () => clearTimeout(t);
  }, [jiraEditQuery, showJiraLinkEdit, creds]); // eslint-disable-line react-hooks/exhaustive-deps

  function save() {
    onUpdate({ ...card, title, description: description || undefined, dueDate: dueDate || undefined, dueTime: dueTime || undefined, assignee: assignee || undefined, estimatedHours: estimatedHours ? Number(estimatedHours) : undefined, checklist, priority, labels, accentColor: accentColor || undefined, boardType: cardBoardType, jiraKey: editLinkedKey || undefined, linkedTSSuiteId: linkedTSSuiteId || undefined, linkedTaskIds: linkedTaskIds.length > 0 ? linkedTaskIds : undefined });
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
            {onArchive && card.columnId === "finished" && !confirmArchive && (
              <button onClick={() => setConfirmArchive(true)} className="px-2.5 py-1 text-xs text-amber-400 hover:bg-slate-800 rounded-lg flex items-center gap-1" aria-label="Archive card">
                <Archive size={11} />Archive
              </button>
            )}
            {confirmArchive && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-amber-400">Archive?</span>
                <button onClick={() => { onArchive?.(card); }} className="px-2 py-0.5 text-xs bg-amber-700 text-white rounded hover:bg-amber-600">Yes</button>
                <button onClick={() => setConfirmArchive(false)} className="px-2 py-0.5 text-xs border border-slate-700 text-slate-400 rounded hover:bg-slate-800">No</button>
              </div>
            )}
            <button onClick={() => { onDelete(card.id); onClose(); }} className="px-2.5 py-1 text-xs text-red-400 hover:bg-slate-800 rounded-lg" aria-label="Delete card">Delete</button>
            <button onClick={onClose} aria-label="Close" className="p-1 text-slate-500 hover:text-slate-300"><X size={16} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {editing ? <input value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-transparent text-slate-100 font-semibold text-base border-b border-slate-700 pb-1 focus:outline-none focus:border-blue-500" /> : <h2 className="text-base font-semibold text-slate-100">{card.title}</h2>}

          {/* Jira link — view mode shows open link; edit mode shows link/change/remove */}
          {card.type === "custom" && editing && creds ? (
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-slate-600">Jira Link</p>
                {!showJiraLinkEdit && !editLinkedKey && (
                  <button onClick={() => setShowJiraLinkEdit(true)} className="text-xs text-blue-400 hover:text-blue-300">+ Link</button>
                )}
              </div>
              {editLinkedKey ? (
                <div className="flex items-center justify-between px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-mono text-blue-400 font-bold shrink-0">{editLinkedKey}</span>
                    {baseUrl && <a href={`${baseUrl}/browse/${editLinkedKey}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-slate-600 hover:text-blue-400 shrink-0"><ExternalLink size={11} /></a>}
                  </div>
                  <div className="flex gap-2 ml-2">
                    <button onClick={() => { setShowJiraLinkEdit(true); setJiraEditQuery(""); }} className="text-xs text-slate-500 hover:text-slate-300">Change</button>
                    <button onClick={() => { setEditLinkedKey(""); setShowJiraLinkEdit(false); }} className="text-slate-600 hover:text-red-400"><X size={13} /></button>
                  </div>
                </div>
              ) : showJiraLinkEdit && (
                <div>
                  <div className="relative">
                    <Search size={13} className="absolute left-3 top-2.5 text-slate-500 pointer-events-none" />
                    <input
                      autoFocus
                      value={jiraEditQuery}
                      onChange={e => setJiraEditQuery(e.target.value)}
                      placeholder="Search by number, key, or summary…"
                      className="w-full pl-8 pr-8 px-3 py-2 border border-slate-700 rounded-lg text-xs bg-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    {jiraEditSearching && <Loader2 size={13} className="absolute right-3 top-2.5 text-blue-400 animate-spin" />}
                  </div>
                  {jiraEditLoading ? (
                    <div className="flex items-center justify-center py-4"><Loader2 size={16} className="animate-spin text-blue-500" /></div>
                  ) : jiraEditResults.length === 0 ? (
                    <p className="text-xs text-slate-600 text-center py-3">{jiraEditQuery.length >= 2 ? "No results" : "Loading recent tickets…"}</p>
                  ) : (
                    <div className="max-h-40 overflow-y-auto mt-1.5 space-y-1.5">
                      {(jiraEditQuery.length >= 2 ? jiraEditResults : jiraEditResults.filter(r => {
                        const q = jiraEditQuery.toLowerCase();
                        return !q || r.key.toLowerCase().includes(q) || r.summary.toLowerCase().includes(q);
                      })).map(r => (
                        <button
                          key={r.key}
                          onClick={() => { setEditLinkedKey(r.key); setShowJiraLinkEdit(false); }}
                          className="w-full text-left bg-slate-800 border border-slate-700 rounded-xl p-2.5 hover:border-blue-500 transition-colors"
                        >
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-mono text-blue-400 font-bold">{r.key}</span>
                            <span className="text-xs bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded">{r.status}</span>
                          </div>
                          <p className="text-xs text-slate-300 line-clamp-1">{r.summary}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (editLinkedKey || card.jiraKey) && baseUrl ? (
            <a href={`${baseUrl}/browse/${editLinkedKey || card.jiraKey}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-blue-400 hover:underline">
              <ExternalLink size={12} />Open {editLinkedKey || card.jiraKey} in Jira
            </a>
          ) : null}

          {/* TS Suite link */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-slate-600">TS Suite</p>
              {!showSuitePicker && !linkedTSSuiteId && (
                <button onClick={() => setShowSuitePicker(true)} className="text-xs text-blue-400 hover:text-blue-300">+ Link</button>
              )}
            </div>
            {linkedTSSuiteId ? (() => {
              const found = findSuite(linkedTSSuiteId, tsData);
              if (!found) return (
                <div className="flex items-center justify-between px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg">
                  <span className="text-xs text-slate-500 italic">Suite not found</span>
                  <button onClick={() => { setLinkedTSSuiteId(""); onUpdate({ ...card, linkedTSSuiteId: undefined }); }} className="text-slate-600 hover:text-red-400 ml-2"><X size={13} /></button>
                </div>
              );
              const activeCases = found.suite.cases.filter(c => !c.disabled);
              const tsTotal = activeCases.length;
              const tsPass = activeCases.filter(c => c.status === "pass").length;
              return (
                <div className="flex items-center justify-between px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg">
                  <div className="min-w-0">
                    <span className="text-xs font-mono text-blue-400 font-bold">{found.cr.crKey}</span>
                    <span className="text-xs text-slate-400"> › {found.suite.title}</span>
                    <p className="text-xs text-slate-500 mt-0.5">{tsPass}/{tsTotal} pass</p>
                  </div>
                  <div className="flex gap-2 ml-2 shrink-0">
                    <button onClick={() => { setShowSuitePicker(true); setPickedCRId(""); }} className="text-xs text-slate-500 hover:text-slate-300">Change</button>
                    <button onClick={() => { setLinkedTSSuiteId(""); onUpdate({ ...card, linkedTSSuiteId: undefined }); }} className="text-slate-600 hover:text-red-400"><X size={13} /></button>
                  </div>
                </div>
              );
            })() : showSuitePicker ? (
              <div className="space-y-1.5">
                <select
                  value={pickedCRId}
                  onChange={e => setPickedCRId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">— Select CR —</option>
                  {tsData.map(cr => <option key={cr.id} value={cr.id}>{cr.crKey} — {cr.crSummary}</option>)}
                </select>
                {pickedCRId && (
                  <select
                    value=""
                    onChange={e => {
                      const suiteId = e.target.value;
                      if (!suiteId) return;
                      setLinkedTSSuiteId(suiteId);
                      onUpdate({ ...card, linkedTSSuiteId: suiteId });
                      setShowSuitePicker(false);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="">— Select Suite —</option>
                    {tsData.find(cr => cr.id === pickedCRId)?.suites.map(s => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                )}
                <button onClick={() => { setShowSuitePicker(false); setPickedCRId(""); }} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Cancel</button>
              </div>
            ) : null}
          </div>

          {/* Linked Tasks — CR cards only */}
          {(card.boardType === "cr" || cardBoardType === "cr") && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-slate-600">Linked Tasks</p>
                <button
                  onClick={() => { setShowTaskPicker(v => !v); setTaskSearchQuery(""); }}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {showTaskPicker ? "Done" : "+ Link Task"}
                </button>
              </div>

              {/* Linked task list */}
              {linkedTaskIds.length > 0 && (
                <div className="space-y-1 mb-2">
                  {linkedTaskIds.map(tid => {
                    const t = allTaskCards.find(c => c.id === tid);
                    if (!t) return null;
                    const isDone = t.columnId === "finished";
                    return (
                      <div key={tid} className="flex items-center justify-between px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={clsx("w-1.5 h-1.5 rounded-full shrink-0", isDone ? "bg-green-500" : "bg-slate-500")} />
                          {t.jiraKey && <span className="text-xs font-mono text-blue-400 font-bold shrink-0">{t.jiraKey}</span>}
                          <span className="text-xs text-slate-300 truncate">{t.title}</span>
                        </div>
                        <div className="flex items-center gap-2 ml-2 shrink-0">
                          <span className="text-xs text-slate-600">{COLUMN_META[t.columnId].label}</span>
                          <button
                            onClick={() => {
                              const next = linkedTaskIds.filter(id => id !== tid);
                              setLinkedTaskIds(next);
                              onUpdate({ ...card, linkedTaskIds: next.length > 0 ? next : undefined });
                            }}
                            className="text-slate-600 hover:text-red-400"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Task picker */}
              {showTaskPicker && (
                <div className="border border-slate-700 rounded-lg overflow-hidden">
                  <div className="relative">
                    <Search size={12} className="absolute left-3 top-2.5 text-slate-500 pointer-events-none" />
                    <input
                      autoFocus
                      value={taskSearchQuery}
                      onChange={e => setTaskSearchQuery(e.target.value)}
                      placeholder="Search tasks…"
                      className="w-full pl-8 pr-3 py-2 bg-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none border-b border-slate-700"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto bg-slate-800/50">
                    {allTaskCards
                      .filter(t => {
                        const q = taskSearchQuery.toLowerCase();
                        return !q || t.title.toLowerCase().includes(q) || (t.jiraKey ?? "").toLowerCase().includes(q);
                      })
                      .map(t => {
                        const checked = linkedTaskIds.includes(t.id);
                        const isDone = t.columnId === "finished";
                        return (
                          <button
                            key={t.id}
                            onClick={() => {
                              const next = checked
                                ? linkedTaskIds.filter(id => id !== t.id)
                                : [...linkedTaskIds, t.id];
                              setLinkedTaskIds(next);
                              onUpdate({ ...card, linkedTaskIds: next.length > 0 ? next : undefined });
                            }}
                            className={clsx(
                              "w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-700/50 transition-colors border-b border-slate-700/50 last:border-0",
                              checked && "bg-blue-900/20"
                            )}
                          >
                            <div className={clsx("w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors", checked ? "bg-blue-600 border-blue-600" : "border-slate-600")}>
                              {checked && <span className="text-white text-[10px] leading-none">✓</span>}
                            </div>
                            <span className={clsx("w-1.5 h-1.5 rounded-full shrink-0", isDone ? "bg-green-500" : "bg-slate-500")} />
                            {t.jiraKey && <span className="text-xs font-mono text-blue-400 font-bold shrink-0">{t.jiraKey}</span>}
                            <span className="text-xs text-slate-300 truncate flex-1">{t.title}</span>
                            <span className="text-xs text-slate-600 shrink-0">{COLUMN_META[t.columnId].label}</span>
                          </button>
                        );
                      })}
                    {allTaskCards.length === 0 && (
                      <p className="text-xs text-slate-600 text-center py-4">No task cards yet</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-slate-600 mb-1">Priority</p>
              {editing ? (
                <select value={priority} onChange={e => setPriority(e.target.value as Priority)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none">
                  {Object.entries(PRIORITY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              ) : <span className={clsx("text-sm font-medium flex items-center gap-1.5", pm.color)}><span className={clsx("w-2 h-2 rounded-full", pm.dot)} />{pm.label}</span>}
            </div>
            <div>
              <p className="text-xs text-slate-600 mb-1">Board Type</p>
              {editing ? (
                <div className="flex gap-1">
                  {([["task", "Task"], ["cr", "CR"]] as const).map(([bt, label]) => (
                    <button key={bt} type="button" onClick={() => setCardBoardType(bt)}
                      className={clsx("px-2 py-1 text-xs rounded border transition-colors", cardBoardType === bt ? "bg-blue-600/20 border-blue-500 text-blue-400" : "border-slate-700 text-slate-500 hover:text-slate-300")}>
                      {label}
                    </button>
                  ))}
                </div>
              ) : <p className="text-sm text-slate-300">{card.boardType === "cr" ? "CR Ticket" : "Task"}</p>}
            </div>
            <div>
              <p className="text-xs text-slate-600 mb-1">Due Date</p>
              {editing ? <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 [color-scheme:dark] focus:outline-none" />
                : <p className={clsx("text-sm font-medium", isOverdue(card) ? "text-red-400" : "text-slate-300")}>{card.dueDate ? new Date(card.dueDate).toLocaleDateString() : "—"}</p>}
            </div>
            <div>
              <p className="text-xs text-slate-600 mb-1">Due Time</p>
              {editing ? <input type="time" value={dueTime} onChange={e => setDueTime(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 [color-scheme:dark] focus:outline-none" />
                : <p className="text-sm text-slate-300">{card.dueTime || "—"}</p>}
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

          <div>
            <p className="text-xs text-slate-600 mb-2">Labels</p>
            {editing ? (
              <div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {labels.map(l => (
                    <span key={l} className="flex items-center gap-1 bg-slate-800 border border-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded-full">
                      {l}
                      <button onClick={() => setLabels(p => p.filter(x => x !== l))} aria-label={`Remove label ${l}`}><X size={10} /></button>
                    </span>
                  ))}
                </div>
                <input
                  value={labelInput}
                  onChange={e => setLabelInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && labelInput.trim()) { setLabels(p => [...p, labelInput.trim()]); setLabelInput(""); } }}
                  placeholder="Add label (Enter)…"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
            ) : (
              labels.length > 0
                ? <div className="flex flex-wrap gap-1">{labels.map(l => <span key={l} className="text-xs bg-slate-800 border border-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{l}</span>)}</div>
                : <p className="text-sm text-slate-600">No labels</p>
            )}
          </div>

          {editing && (
            <div>
              <p className="text-xs text-slate-600 mb-2">Accent Color</p>
              <div className="flex gap-2 flex-wrap">
                {ACCENT_COLORS.map(c => (
                  <button
                    key={c.value}
                    title={c.label}
                    aria-label={`Accent color: ${c.label}`}
                    onClick={() => setAccentColor(c.value)}
                    className={clsx(
                      "w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all hover:scale-110",
                      accentColor === c.value ? "border-white shadow-lg scale-110" : "border-transparent"
                    )}
                    style={{ backgroundColor: c.swatch }}
                  >
                    {accentColor === c.value && (
                      <svg viewBox="0 0 12 12" width="12" height="12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs text-slate-600 mb-1">Description</p>
            {editing ? <textarea value={description} onChange={e => setDesc(e.target.value)} rows={3} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 resize-none focus:outline-none focus:ring-1 focus:ring-blue-600" />
              : card.description
                  ? <Linkified text={card.description} className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap" />
                  : <p className="text-sm text-slate-600">No description</p>
              }
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
                    {item.done && <span className="text-white text-xs">✓</span>}
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
          <button onClick={onClose} aria-label="Close archive drawer" className="p-1 text-slate-500 hover:text-slate-300"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cards.length === 0 && (
            <p className="text-xs text-slate-600 text-center py-12">No archived cards yet.<br />Finish cards then archive them to keep the board clean.</p>
          )}
          {cards.map(card => {
            const pm = PRIORITY_META[card.priority];
            return (
              <div key={card.id} className="bg-slate-800 border border-slate-700 rounded-xl p-3">
                {card.jiraKey && <p className="text-xs font-mono text-blue-400 font-bold mb-1">{card.jiraKey}</p>}
                <p className="text-sm text-slate-300 font-medium leading-snug mb-2">{card.title}</p>
                <div className="flex items-center gap-2">
                  <span className={clsx("text-xs font-medium flex items-center gap-1", pm.color)}>
                    <span className={clsx("w-1.5 h-1.5 rounded-full", pm.dot)} />{pm.label}
                  </span>
                  {card.archivedAt && (
                    <span className="text-xs text-slate-600 ml-auto">
                      Archived {new Date(card.archivedAt).toLocaleDateString()}
                    </span>
                  )}
                  <button onClick={() => onUnarchive(card)} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 px-1.5 py-0.5 rounded hover:bg-slate-700 transition-colors">
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
function UrgentSection({ cards, baseUrl, onAddCard, onCardClick, tsData, allCards }: {
  cards: KanbanCard[]; baseUrl?: string;
  onAddCard: (col: ColumnId) => void; onCardClick: (c: KanbanCard) => void;
  tsData?: _TSCREntry[]; allCards?: KanbanCard[];
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
        <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={clsx("flex gap-3 overflow-x-auto pb-1 min-h-[80px] rounded-xl p-2 transition-colors", isOver && "bg-red-900/20 ring-1 ring-red-700")}
        >
          {cards.map(card => (
            <div key={card.id} className="w-64 shrink-0">
              <DraggableCard card={card} baseUrl={baseUrl} onCardClick={onCardClick} tsData={tsData} allCards={allCards} />
            </div>
          ))}
          {cards.length === 0 && (
            <div className="flex items-center justify-center w-full text-xs text-red-900 border border-dashed border-red-900/40 rounded-xl">No urgent items — drop here</div>
          )}
        </div>
        </SortableContext>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────
export default function KanbanPage() {
  const { creds } = useApp();
  const [boardState, setBoardState] = useState<KanbanState>({ urgent: [], todo: [], ongoing: [], "on-hold": [], finished: [] });
  const [addTarget, setAddTarget]   = useState<ColumnId | null>(null);
  const [selectedCard, setSelectedCard] = useState<KanbanCard | null>(null);
  const [activeId, setActiveId]     = useState<string | null>(null);
  const [showArchive, setShowArchive] = useState(false);
  const [archivedCards, setArchivedCards] = useState<KanbanCard[]>([]);
  const [collapsedCols, setCollapsedCols] = useState<Partial<Record<ColumnId, boolean>>>({ finished: false });
  const [activeBoardType, setActiveBoardType] = useState<"task" | "cr">("task");
  const [tsData, setTsData] = useState<_TSCREntry[]>([]);

  function toggleCollapse(col: ColumnId) {
    setCollapsedCols(prev => ({ ...prev, [col]: !prev[col] }));
  }

  useEffect(() => {
    setBoardState(getKanbanState());
    setArchivedCards(getArchivedCards());
    setTsData(loadTSData());
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
    setActiveBoardType(card.boardType ?? "task"); // switch view so the new card is visible
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
    if (!over || active.id === over.id) return;
    const cardId = active.id as string;
    const overId = over.id as string;
    const sourceCol = findCardColumn(cardId, boardState);
    const destCol: ColumnId | null = COLUMN_IDS.includes(overId as ColumnId)
      ? (overId as ColumnId)
      : findCardColumn(overId, boardState);
    if (!sourceCol || !destCol) return;

    if (sourceCol === destCol) {
      const items = boardState[sourceCol];
      const oldIdx = items.findIndex(c => c.id === cardId);
      const newIdx = COLUMN_IDS.includes(overId as ColumnId)
        ? items.length - 1
        : items.findIndex(c => c.id === overId);
      if (oldIdx === -1 || newIdx === -1) return;
      persist({ ...boardState, [sourceCol]: arrayMove(items, oldIdx, newIdx) });
    } else {
      const movedCard = { ...boardState[sourceCol].find(c => c.id === cardId)!, columnId: destCol, columnEnteredAt: new Date().toISOString() };
      const sourceCards = boardState[sourceCol].filter(c => c.id !== cardId);
      const destCards = [...boardState[destCol]];
      const overIdx = COLUMN_IDS.includes(overId as ColumnId) ? destCards.length : destCards.findIndex(c => c.id === overId);
      destCards.splice(overIdx < 0 ? destCards.length : overIdx, 0, movedCard);
      persist({ ...boardState, [sourceCol]: sourceCards, [destCol]: destCards });
    }
  }

  const allCards = COLUMN_IDS.flatMap(col => boardState[col]);
  const activeCard = activeId ? allCards.find(c => c.id === activeId) : null;
  function visibleCards(col: ColumnId) {
    return boardState[col].filter(c => (c.boardType ?? "task") === activeBoardType);
  }

  return (
    <div className="flex flex-col min-h-full">
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold text-slate-200">Kanban</h1>
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-0.5">
            {([["task", "Tasks"], ["cr", "CR Tickets"]] as const).map(([bt, label]) => (
              <button
                key={bt}
                onClick={() => setActiveBoardType(bt)}
                className={clsx(
                  "px-3 py-1 text-xs rounded-md transition-colors",
                  activeBoardType === bt ? "bg-slate-700 text-slate-100 font-medium" : "text-slate-500 hover:text-slate-300"
                )}
              >
                {label}
                <span className={clsx("ml-1.5 text-xs px-1 rounded-full", activeBoardType === bt ? "bg-slate-600 text-slate-300" : "bg-slate-700/50 text-slate-600")}>
                  {COLUMN_IDS.reduce((s, c) => s + boardState[c].filter(card => (card.boardType ?? "task") === bt).length, 0)}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowArchive(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors">
            <Archive size={13} />Archive{archivedCards.length > 0 && <span className="bg-slate-700 text-slate-400 text-xs px-1 rounded-full">{archivedCards.length}</span>}
          </button>
          <button onClick={() => setAddTarget("todo")} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus size={13} />Add Card
          </button>
        </div>
      </header>

      {/* Single DndContext wrapping BOTH urgent and main columns */}
      <DndContext collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <UrgentSection
          cards={visibleCards("urgent")}
          baseUrl={creds?.baseUrl}
          onAddCard={setAddTarget}
          onCardClick={setSelectedCard}
          tsData={tsData}
          allCards={allCards}
        />

        <div className="flex-1 flex flex-col px-6 py-5 overflow-x-auto overflow-y-hidden">
          <div className="flex gap-4 pb-4 min-w-max flex-1 items-stretch">
            {(["todo", "ongoing", "on-hold", "finished"] as ColumnId[]).map(col => (
              <Column
                key={col} id={col} cards={visibleCards(col)} baseUrl={creds?.baseUrl}
                onAddCard={setAddTarget} onCardClick={setSelectedCard}
                collapsed={collapsedCols[col] ?? false}
                onToggleCollapse={() => toggleCollapse(col)}
                tsData={tsData}
                allCards={allCards}
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeCard && <div className="rotate-1 opacity-90 w-72"><CardView card={activeCard} tsData={tsData} allCards={allCards} /></div>}
        </DragOverlay>
      </DndContext>

      {addTarget && (
        <AddCardModal targetColumn={addTarget} onClose={() => setAddTarget(null)} onAdd={handleAddCard} creds={creds} />
      )}
      {selectedCard && (
        <CardDetailDrawer card={selectedCard} onClose={() => setSelectedCard(null)} onUpdate={handleUpdateCard} onDelete={handleDeleteCard} onArchive={handleArchiveCard} baseUrl={creds?.baseUrl} creds={creds} tsData={tsData} allCards={allCards} />
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
