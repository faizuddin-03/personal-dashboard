"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { Plus, ChevronDown, ChevronRight, X, Search, Loader2, CheckCircle2, XCircle, Clock, CalendarDays, Trash2, Timer, GripVertical, Pencil } from "lucide-react";
import clsx from "clsx";
import { useApp } from "@/components/AppShell";
import { remoteSync } from "@/lib/remote-sync";
import { reporterIs } from "@/lib/jira";
import { todayLocal } from "@/lib/date";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, sortableKeyboardCoordinates, useSortable,
  verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ── Data model ────────────────────────────────────────────
export interface TestCase {
  id: string;
  tsNumber: string;
  status: "pass" | "fail" | "in-progress" | null;
  dateTested: string | null; // YYYY-MM-DD
  disabled?: boolean;
}

export interface TestSuite {
  id: string;
  title: string;
  cases: TestCase[];
}

export interface CREntry {
  id: string;
  crKey: string;
  crSummary: string;
  suites: TestSuite[];
}

const STORE_KEY = "test_tracker_crs";

function load(): CREntry[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(STORE_KEY) ?? "[]"); } catch { return []; }
}
function save(data: CREntry[]) {
  const json = JSON.stringify(data);
  localStorage.setItem(STORE_KEY, json);
  remoteSync("test_tracker_crs", json);
}
function uid() { return crypto.randomUUID(); }

// ── Jira search types ─────────────────────────────────────
interface JiraHit { key: string; summary: string; }

// ── Status chip ───────────────────────────────────────────
function StatusChip({ status, onToggle }: { status: "pass" | "fail" | "in-progress" | null; onToggle: (s: "pass" | "fail" | "in-progress" | null) => void }) {
  return (
    <div className="flex gap-1">
      <button
        onClick={() => onToggle(status === "pass" ? null : "pass")}
        className={clsx("flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border transition-colors",
          status === "pass" ? "bg-green-900/60 border-green-700 text-green-300" : "border-slate-700 text-slate-600 hover:border-green-700 hover:text-green-400"
        )}
      >
        <CheckCircle2 size={11} />Pass
      </button>
      <button
        onClick={() => onToggle(status === "in-progress" ? null : "in-progress")}
        className={clsx("flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border transition-colors",
          status === "in-progress" ? "bg-amber-900/60 border-amber-700 text-amber-300" : "border-slate-700 text-slate-600 hover:border-amber-700 hover:text-amber-400"
        )}
      >
        <Timer size={11} />WIP
      </button>
      <button
        onClick={() => onToggle(status === "fail" ? null : "fail")}
        className={clsx("flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border transition-colors",
          status === "fail" ? "bg-red-900/60 border-red-700 text-red-300" : "border-slate-700 text-slate-600 hover:border-red-700 hover:text-red-400"
        )}
      >
        <XCircle size={11} />Fail
      </button>
    </div>
  );
}

// ── Add CR search panel ───────────────────────────────────
function AddCRPanel({ creds, existingKeys, onAdd, onClose }: {
  creds: ReturnType<typeof useApp>["creds"];
  existingKeys: string[];
  onAdd: (key: string, summary: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<JiraHit[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  // Initial load
  useEffect(() => {
    if (!creds || results.length > 0) return;
    setLoading(true);
    const jql = `${reporterIs(creds)} AND issuetype = Task AND resolution = Unresolved ORDER BY updated DESC`;
    fetch("/api/jira/search", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...creds, jql, maxResults: 30, fields: ["summary"] }) })
      .then(r => r.json()).then(d => setResults((d.issues ?? []).map((i: { key: string; fields: { summary: string } }) => ({ key: i.key, summary: i.fields.summary }))))
      .catch(() => {}).finally(() => setLoading(false));
  }, [creds]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search
  useEffect(() => {
    if (!creds || query.length < 2) return;
    const pk = creds.defaultProjectKey;
    const isKey = /^[A-Za-z]+-\d+$/.test(query.trim());
    const isNum = /^\d+$/.test(query.trim());
    const resolved = isNum && pk ? `${pk}-${query.trim()}` : null;
    const jql = resolved ? `key = "${resolved}"` : isKey ? `key = "${query.trim()}"` : pk ? `project = "${pk}" AND issuetype = Task AND text ~ "${query.trim()}"` : `issuetype = Task AND text ~ "${query.trim()}"`;
    const t = setTimeout(() => {
      setLoading(true);
      fetch("/api/jira/search", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...creds, jql: `${jql} ORDER BY updated DESC`, maxResults: 20, fields: ["summary"] }) })
        .then(r => r.json()).then(d => setResults((d.issues ?? []).map((i: { key: string; fields: { summary: string } }) => ({ key: i.key, summary: i.fields.summary }))))
        .catch(() => {}).finally(() => setLoading(false));
    }, 400);
    return () => clearTimeout(t);
  }, [query, creds]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = query.length >= 2 ? results : results.filter(r => {
    const q = query.toLowerCase();
    return !q || r.key.toLowerCase().includes(q) || r.summary.toLowerCase().includes(q);
  });

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 mt-3 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-slate-300">Add CR</p>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X size={14} /></button>
      </div>
      <div className="relative mb-3">
        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Search CR by key or title…"
          className="w-full pl-7 pr-7 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-600" />
        {loading && <Loader2 size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin text-blue-400" />}
      </div>
      <div className="max-h-52 overflow-y-auto space-y-1">
        {filtered.length === 0 && !loading && (
          <p className="text-xs text-slate-600 text-center py-4">{query ? "No results" : "Loading recent CRs…"}</p>
        )}
        {filtered.map(r => {
          const already = existingKeys.includes(r.key);
          return (
            <button key={r.key} disabled={already} onClick={() => onAdd(r.key, r.summary)}
              className={clsx("w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors",
                already ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-800"
              )}>
              <span className="font-mono text-blue-400 font-bold mr-2">{r.key}</span>
              <span className="text-slate-300 line-clamp-1">{r.summary}</span>
              {already && <span className="text-slate-600 ml-1">(added)</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Sortable row handle ───────────────────────────────────
function SortableRow({ id, children }: { id: string; children: (handle: React.ReactNode) => React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  const handle = (
    <span {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-slate-700 hover:text-slate-500 shrink-0 touch-none">
      <GripVertical size={13} />
    </span>
  );
  return <div ref={setNodeRef} style={style}>{children(handle)}</div>;
}

// ── Main page ─────────────────────────────────────────────
export default function TestTrackerPage() {
  const { creds } = useApp();
  const [data, setData] = useState<CREntry[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [view, setView] = useState<"cr" | "date">("cr");
  const [filterDate, setFilterDate] = useState(() => todayLocal());
  const [showAddCR, setShowAddCR] = useState(false);
  const [expandedCRs, setExpandedCRs] = useState<Record<string, boolean>>({});
  const [expandedSuites, setExpandedSuites] = useState<Record<string, boolean>>({});
  // add states
  const [editingSuiteId, setEditingSuiteId] = useState<string | null>(null);
  const [newSuiteTitle, setNewSuiteTitle] = useState("");
  const [addingCaseToSuite, setAddingCaseToSuite] = useState<string | null>(null);
  const [newCaseTsNumber, setNewCaseTsNumber] = useState("");
  // inline rename states
  const [editingCRId, setEditingCRId] = useState<string | null>(null);
  const [editingCRValue, setEditingCRValue] = useState("");
  const [editingSuiteTitleId, setEditingSuiteTitleId] = useState<string | null>(null);
  const [editingSuiteTitleValue, setEditingSuiteTitleValue] = useState("");
  const [editingCaseId, setEditingCaseId] = useState<string | null>(null);
  const [editingCaseValue, setEditingCaseValue] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => { setData(load()); setHydrated(true); }, []);

  function persist(next: CREntry[]) { setData(next); save(next); }

  function handleDragEndSuites(crId: string, e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const cr = data.find(c => c.id === crId);
    if (!cr) return;
    const oldIdx = cr.suites.findIndex(s => s.id === active.id);
    const newIdx = cr.suites.findIndex(s => s.id === over.id);
    persist(data.map(c => c.id !== crId ? c : { ...c, suites: arrayMove(c.suites, oldIdx, newIdx) }));
  }

  function handleDragEndCases(crId: string, suiteId: string, e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    persist(data.map(cr => cr.id !== crId ? cr : {
      ...cr, suites: cr.suites.map(s => {
        if (s.id !== suiteId) return s;
        const oldIdx = s.cases.findIndex(c => c.id === active.id);
        const newIdx = s.cases.findIndex(c => c.id === over.id);
        return { ...s, cases: arrayMove(s.cases, oldIdx, newIdx) };
      }),
    }));
  }

  // ── CR ops ───────────────────────────────────────────────
  function addCR(key: string, summary: string) {
    persist([...data, { id: uid(), crKey: key, crSummary: summary, suites: [] }]);
    setExpandedCRs(p => ({ ...p, [key]: true }));
    setShowAddCR(false);
  }
  function removeCR(id: string) {
    persist(data.filter(c => c.id !== id));
  }

  // ── Suite ops ────────────────────────────────────────────
  function addSuite(crId: string) {
    if (!newSuiteTitle.trim()) return;
    const suiteId = uid();
    persist(data.map(cr => cr.id !== crId ? cr : { ...cr, suites: [...cr.suites, { id: suiteId, title: newSuiteTitle.trim(), cases: [] }] }));
    setExpandedSuites(p => ({ ...p, [suiteId]: true }));
    setEditingSuiteId(null);
    setNewSuiteTitle("");
  }
  function removeSuite(crId: string, suiteId: string) {
    persist(data.map(cr => cr.id !== crId ? cr : { ...cr, suites: cr.suites.filter(s => s.id !== suiteId) }));
  }

  // ── Test case ops ────────────────────────────────────────
  function addCase(suiteId: string) {
    if (!newCaseTsNumber.trim()) return;
    const crId = data.find(cr => cr.suites.some(s => s.id === suiteId))?.id;
    if (!crId) return;
    persist(data.map(cr => cr.id !== crId ? cr : {
      ...cr, suites: cr.suites.map(s => s.id !== suiteId ? s : {
        ...s, cases: [...s.cases, { id: uid(), tsNumber: newCaseTsNumber.trim(), status: null, dateTested: null }]
      })
    }));
    setNewCaseTsNumber("");
  }
  function updateCase(caseId: string, patch: Partial<TestCase>) {
    persist(data.map(cr => ({
      ...cr, suites: cr.suites.map(s => ({
        ...s, cases: s.cases.map(c => c.id !== caseId ? c : { ...c, ...patch })
      }))
    })));
  }
  function removeCase(caseId: string) {
    persist(data.map(cr => ({
      ...cr, suites: cr.suites.map(s => ({ ...s, cases: s.cases.filter(c => c.id !== caseId) }))
    })));
  }

  function renameCR(crId: string, summary: string) {
    if (!summary.trim()) return;
    persist(data.map(cr => cr.id !== crId ? cr : { ...cr, crSummary: summary.trim() }));
    setEditingCRId(null);
  }
  function renameSuite(crId: string, suiteId: string, title: string) {
    if (!title.trim()) return;
    persist(data.map(cr => cr.id !== crId ? cr : {
      ...cr, suites: cr.suites.map(s => s.id !== suiteId ? s : { ...s, title: title.trim() })
    }));
    setEditingSuiteTitleId(null);
  }
  function renameCase(caseId: string, tsNumber: string) {
    if (!tsNumber.trim()) return;
    persist(data.map(cr => ({
      ...cr, suites: cr.suites.map(s => ({
        ...s, cases: s.cases.map(c => c.id !== caseId ? c : { ...c, tsNumber: tsNumber.trim() })
      }))
    })));
    setEditingCaseId(null);
  }

  function toggleStatus(tc: TestCase, newStatus: "pass" | "fail" | "in-progress" | null) {
    updateCase(tc.id, {
      status: newStatus,
      dateTested: newStatus ? todayLocal() : null,
    });
  }

  // ── By Date view data ────────────────────────────────────
  type DateRow = { crKey: string; crSummary: string; suiteTitle: string; tc: TestCase };
  function rowsForDate(date: string): DateRow[] {
    const rows: DateRow[] = [];
    for (const cr of data) {
      for (const s of cr.suites) {
        for (const tc of s.cases) {
          if (!tc.disabled && tc.dateTested === date) rows.push({ crKey: cr.crKey, crSummary: cr.crSummary, suiteTitle: s.title, tc });
        }
      }
    }
    return rows;
  }

  // ── Stats helpers ────────────────────────────────────────
  // Memoize per-CR and per-suite stats — only recomputes when data changes
  const crStatsMap = useMemo(() => {
    const map = new Map<string, { total: number; done: number; pass: number; fail: number; wip: number; passPct: number }>();
    for (const cr of data) {
      const all = cr.suites.flatMap(s => s.cases).filter(c => !c.disabled);
      const pass = all.filter(c => c.status === "pass").length;
      const fail = all.filter(c => c.status === "fail").length;
      const wip  = all.filter(c => c.status === "in-progress").length;
      map.set(cr.id, { total: all.length, done: pass + fail + wip, pass, fail, wip, passPct: all.length ? Math.round((pass / all.length) * 100) : 0 });
    }
    return map;
  }, [data]);

  const suiteStatsMap = useMemo(() => {
    const map = new Map<string, { total: number; pass: number; fail: number; wip: number; passPct: number }>();
    for (const cr of data) {
      for (const suite of cr.suites) {
        const active = suite.cases.filter(c => !c.disabled);
        const pass = active.filter(c => c.status === "pass").length;
        const fail = active.filter(c => c.status === "fail").length;
        const wip  = active.filter(c => c.status === "in-progress").length;
        map.set(suite.id, { total: active.length, pass, fail, wip, passPct: active.length ? Math.round((pass / active.length) * 100) : 0 });
      }
    }
    return map;
  }, [data]);

  // Memoize date-view rows — only recomputes when data or filterDate changes
  const dateRows = useMemo(() => rowsForDate(filterDate), [data, filterDate]); // eslint-disable-line react-hooks/exhaustive-deps
  const groupedByDate = useMemo(() => {
    const grouped: Record<string, DateRow[]> = {};
    for (const r of dateRows) {
      const k = `${r.crKey}::${r.suiteTitle}`;
      (grouped[k] ??= []).push(r);
    }
    return grouped;
  }, [dateRows]);

  if (!hydrated) return null;

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-4 sm:px-6 h-14 flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold text-slate-200">TS Tracker</h1>
          <p className="text-xs text-slate-500 italic font-normal">Single click to deprio</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-0.5">
            {([["cr", "By CR"], ["date", "By Date"]] as const).map(([v, label]) => (
              <button key={v} onClick={() => setView(v)}
                className={clsx("px-3 py-1 text-xs rounded-md transition-colors",
                  view === v ? "bg-slate-700 text-slate-100 font-medium" : "text-slate-500 hover:text-slate-300"
                )}>
                {label}
              </button>
            ))}
          </div>
          {view === "cr" && (
            <button onClick={() => setShowAddCR(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Plus size={13} />Add CR
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 px-3 py-4 sm:p-6 max-w-4xl mx-auto w-full">
        {/* ── BY CR VIEW ── */}
        {view === "cr" && (
          <>
            {showAddCR && (
              <AddCRPanel creds={creds} existingKeys={data.map(c => c.crKey)} onAdd={addCR} onClose={() => setShowAddCR(false)} />
            )}

            {data.length === 0 && !showAddCR && (
              <div className="flex flex-col items-center py-20 text-slate-600">
                <CheckCircle2 size={28} className="mb-3 opacity-30" />
                <p className="text-sm">No CRs tracked yet</p>
                <p className="text-xs mt-1 text-slate-700">Click "Add CR" to get started</p>
              </div>
            )}

            <div className="space-y-3 mt-3">
              {data.map(cr => {
                const isOpen = expandedCRs[cr.crKey] ?? false;
                const stats = crStatsMap.get(cr.id)!;
                return (
                  <div key={cr.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    {/* CR header */}
                    <div className="flex items-center gap-2 px-4 py-3 cursor-pointer select-none hover:bg-slate-800/50 transition-colors"
                      onClick={() => setExpandedCRs(p => ({ ...p, [cr.crKey]: !isOpen }))}>
                      {isOpen ? <ChevronDown size={15} className="text-slate-500 shrink-0" /> : <ChevronRight size={15} className="text-slate-500 shrink-0" />}
                      <span className="text-xs font-mono text-blue-400 font-bold shrink-0">{cr.crKey}</span>
                      {editingCRId === cr.id ? (
                        <input
                          autoFocus
                          value={editingCRValue}
                          onChange={e => setEditingCRValue(e.target.value)}
                          onBlur={() => renameCR(cr.id, editingCRValue)}
                          onKeyDown={e => {
                            e.stopPropagation();
                            if (e.key === "Enter") renameCR(cr.id, editingCRValue);
                            if (e.key === "Escape") setEditingCRId(null);
                          }}
                          onClick={e => e.stopPropagation()}
                          className="flex-1 text-sm font-medium bg-slate-800 border border-blue-600 rounded px-2 py-0.5 text-slate-200 focus:outline-none min-w-0"
                        />
                      ) : (
                        <span className="text-sm text-slate-200 font-medium flex-1 line-clamp-1 group/cr">
                          {cr.crSummary}
                          <button
                            onClick={e => { e.stopPropagation(); setEditingCRId(cr.id); setEditingCRValue(cr.crSummary); }}
                            className="ml-1.5 opacity-0 group-hover/cr:opacity-100 pointer-events-none group-hover/cr:pointer-events-auto text-slate-600 hover:text-slate-300 transition-opacity align-middle"
                            title="Edit summary"
                          >
                            <Pencil size={11} />
                          </button>
                        </span>
                      )}
                      {stats.total > 0 && (
                        <div className="flex items-center gap-2 shrink-0">
                          {stats.wip > 0 && <span className="text-xs text-amber-400 font-medium">{stats.wip} wip</span>}
                          {stats.fail > 0 && <span className="text-xs text-red-400 font-medium">{stats.fail} fail</span>}
                          {stats.pass > 0 && <span className="text-xs text-green-400 font-medium">{stats.pass} pass</span>}
                          <span className="text-xs text-slate-500">{stats.done}/{stats.total}</span>
                          <span className="text-xs font-semibold text-green-400">{stats.passPct}%</span>
                          <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden flex">
                            <div className="h-full bg-green-500" style={{ width: `${stats.passPct}%` }} />
                            <div className="h-full bg-red-500" style={{ width: `${stats.total ? Math.round((stats.fail / stats.total) * 100) : 0}%` }} />
                          </div>
                        </div>
                      )}
                      <button onClick={e => { e.stopPropagation(); removeCR(cr.id); }}
                        className="ml-1 text-slate-700 hover:text-red-400 p-0.5 shrink-0" title="Remove CR">
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {isOpen && (
                      <div className="border-t border-slate-800 px-4 py-3 space-y-3">
                        <DndContext sensors={sensors} collisionDetection={closestCenter}
                          onDragEnd={e => handleDragEndSuites(cr.id, e)}>
                          <SortableContext items={cr.suites.map(s => s.id)} strategy={verticalListSortingStrategy}>
                            {cr.suites.map(suite => {
                              const suiteOpen = expandedSuites[suite.id] ?? false;
                              const ss = suiteStatsMap.get(suite.id)!;
                              return (
                                <SortableRow key={suite.id} id={suite.id}>{handle => (
                                  <div className="bg-slate-950/60 border border-slate-800 rounded-lg overflow-hidden">
                                    {/* Suite header */}
                                    <div className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-slate-800/40 transition-colors"
                                      onClick={() => setExpandedSuites(p => ({ ...p, [suite.id]: !suiteOpen }))}>
                                      <span onClick={e => e.stopPropagation()}>{handle}</span>
                                      {suiteOpen ? <ChevronDown size={13} className="text-slate-600 shrink-0" /> : <ChevronRight size={13} className="text-slate-600 shrink-0" />}
                                      {editingSuiteTitleId === suite.id ? (
                                        <input
                                          autoFocus
                                          value={editingSuiteTitleValue}
                                          onChange={e => setEditingSuiteTitleValue(e.target.value)}
                                          onBlur={() => renameSuite(cr.id, suite.id, editingSuiteTitleValue)}
                                          onKeyDown={e => {
                                            e.stopPropagation();
                                            if (e.key === "Enter") renameSuite(cr.id, suite.id, editingSuiteTitleValue);
                                            if (e.key === "Escape") setEditingSuiteTitleId(null);
                                          }}
                                          onClick={e => e.stopPropagation()}
                                          className="flex-1 text-xs font-medium bg-slate-800 border border-blue-600 rounded px-2 py-0.5 text-slate-200 focus:outline-none min-w-0"
                                        />
                                      ) : (
                                        <span className="text-xs font-medium text-slate-300 flex-1 group/suite">
                                          {suite.title}
                                          <button
                                            onClick={e => { e.stopPropagation(); setEditingSuiteTitleId(suite.id); setEditingSuiteTitleValue(suite.title); }}
                                            className="ml-1.5 opacity-0 group-hover/suite:opacity-100 pointer-events-none group-hover/suite:pointer-events-auto text-slate-600 hover:text-slate-300 transition-opacity align-middle"
                                            title="Edit title"
                                          >
                                            <Pencil size={10} />
                                          </button>
                                        </span>
                                      )}
                                      <span className="text-xs text-slate-600">{ss.total} TS</span>
                                      {ss.wip > 0 && <span className="text-xs text-amber-400">{ss.wip} wip</span>}
                                      {ss.fail > 0 && <span className="text-xs text-red-400">{ss.fail}✗</span>}
                                      {ss.pass > 0 && <span className="text-xs text-green-400">{ss.pass}✓</span>}
                                      {ss.total > 0 && <span className="text-xs font-semibold text-green-400">{ss.passPct}%</span>}
                                      <button onClick={e => { e.stopPropagation(); removeSuite(cr.id, suite.id); }}
                                        className="text-slate-700 hover:text-red-400 p-0.5 ml-1" title="Remove suite">
                                        <X size={12} />
                                      </button>
                                    </div>

                                    {suiteOpen && (
                                      <div className="border-t border-slate-800 overflow-x-auto">
                                        {/* Column headers */}
                                        {suite.cases.length > 0 && (
                                          <div className="grid grid-cols-[16px_1fr_180px_100px] sm:grid-cols-[16px_1fr_220px_110px] gap-2 px-3 py-1.5 border-b border-slate-800/60 min-w-[340px]">
                                            <span />
                                            <span className="text-xs text-slate-600 uppercase tracking-wider">TS Number</span>
                                            <span className="text-xs text-slate-600 uppercase tracking-wider">Status</span>
                                            <span className="text-xs text-slate-600 uppercase tracking-wider">Date Tested</span>
                                          </div>
                                        )}

                                        {/* Test cases */}
                                        <DndContext sensors={sensors} collisionDetection={closestCenter}
                                          onDragEnd={e => handleDragEndCases(cr.id, suite.id, e)}>
                                          <SortableContext items={suite.cases.map(c => c.id)} strategy={verticalListSortingStrategy}>
                                            {suite.cases.map(tc => (
                                              <SortableRow key={tc.id} id={tc.id}>{caseHandle => (
                                                <div
                                                  onClick={() => updateCase(tc.id, { disabled: !tc.disabled })}
                                                  className={clsx(
                                                    "relative grid grid-cols-[16px_1fr_180px_100px] sm:grid-cols-[16px_1fr_220px_110px] gap-2 items-center px-3 py-2.5 border-b border-slate-800/40 hover:bg-slate-800/20 group transition-opacity cursor-pointer min-w-[340px]",
                                                    tc.disabled && "opacity-30 grayscale"
                                                  )}>
                                                  {tc.disabled && (
                                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                                      <span className="text-xs font-bold italic text-slate-400 tracking-widest">DEPRIORITIZED</span>
                                                    </div>
                                                  )}
                                                  <span onClick={e => e.stopPropagation()}>{caseHandle}</span>
                                                  {editingCaseId === tc.id ? (
                                                    <input
                                                      autoFocus
                                                      value={editingCaseValue}
                                                      onChange={e => setEditingCaseValue(e.target.value)}
                                                      onBlur={() => renameCase(tc.id, editingCaseValue)}
                                                      onKeyDown={e => {
                                                        e.stopPropagation();
                                                        if (e.key === "Enter") renameCase(tc.id, editingCaseValue);
                                                        if (e.key === "Escape") setEditingCaseId(null);
                                                      }}
                                                      onClick={e => e.stopPropagation()}
                                                      className="text-xs font-mono bg-slate-800 border border-blue-600 rounded px-1.5 py-0.5 text-slate-200 focus:outline-none w-full"
                                                    />
                                                  ) : (
                                                    <span className={clsx(
                                                      "text-xs font-mono select-none",
                                                      tc.disabled ? "text-slate-500 line-through" : "text-slate-300"
                                                    )}>
                                                      {tc.tsNumber}
                                                    </span>
                                                  )}
                                                  <div onClick={e => e.stopPropagation()}>
                                                    <StatusChip status={tc.status} onToggle={s => !tc.disabled && toggleStatus(tc, s)} />
                                                  </div>
                                                  <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                                                    {tc.dateTested ? (
                                                      <input type="date" value={tc.dateTested}
                                                        onChange={e => e.target.value && updateCase(tc.id, { dateTested: e.target.value })}
                                                        className="text-xs text-slate-400 bg-transparent border-b border-transparent hover:border-slate-700 focus:border-blue-600 focus:outline-none [color-scheme:dark] cursor-pointer" />
                                                    ) : (
                                                      <span className="text-xs text-slate-700">—</span>
                                                    )}
                                                    <button onClick={() => { setEditingCaseId(tc.id); setEditingCaseValue(tc.tsNumber); }}
                                                      className="opacity-0 group-hover:opacity-100 text-slate-700 hover:text-slate-400 ml-auto transition-opacity">
                                                      <Pencil size={10} />
                                                    </button>
                                                    <button onClick={() => removeCase(tc.id)}
                                                      className="opacity-0 group-hover:opacity-100 text-slate-700 hover:text-red-400 transition-opacity">
                                                      <X size={11} />
                                                    </button>
                                                  </div>
                                                </div>
                                              )}</SortableRow>
                                            ))}
                                          </SortableContext>
                                        </DndContext>

                                        {/* Add test case row */}
                                        {addingCaseToSuite === suite.id ? (
                                          <div className="flex items-center gap-2 px-3 py-2">
                                            <input
                                              autoFocus
                                              value={newCaseTsNumber}
                                              onChange={e => setNewCaseTsNumber(e.target.value)}
                                              onKeyDown={e => {
                                                if (e.key === "Enter") { addCase(suite.id); }
                                                if (e.key === "Escape") { setAddingCaseToSuite(null); setNewCaseTsNumber(""); }
                                              }}
                                              placeholder="TS number (Enter to add)"
                                              className="flex-1 text-xs bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                            />
                                            <button onClick={() => addCase(suite.id)} className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1.5 rounded hover:bg-slate-800">Add</button>
                                            <button onClick={() => { setAddingCaseToSuite(null); setNewCaseTsNumber(""); }} className="text-slate-600 hover:text-slate-400"><X size={13} /></button>
                                          </div>
                                        ) : (
                                          <button onClick={() => setAddingCaseToSuite(suite.id)}
                                            className="w-full flex items-center gap-1.5 px-3 py-2 text-xs text-slate-600 hover:text-slate-400 hover:bg-slate-800/30 transition-colors">
                                            <Plus size={11} />Add TS
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}</SortableRow>
                              );
                            })}
                          </SortableContext>
                        </DndContext>

                        {/* Add suite row */}
                        {editingSuiteId === cr.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              autoFocus
                              value={newSuiteTitle}
                              onChange={e => setNewSuiteTitle(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === "Enter") addSuite(cr.id);
                                if (e.key === "Escape") { setEditingSuiteId(null); setNewSuiteTitle(""); }
                              }}
                              placeholder="Suite title (Enter to add)"
                              className="flex-1 text-xs bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                            />
                            <button onClick={() => addSuite(cr.id)} className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1.5 rounded hover:bg-slate-800">Add</button>
                            <button onClick={() => { setEditingSuiteId(null); setNewSuiteTitle(""); }} className="text-slate-600 hover:text-slate-400"><X size={13} /></button>
                          </div>
                        ) : (
                          <button onClick={() => setEditingSuiteId(cr.id)}
                            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-400 transition-colors py-1">
                            <Plus size={11} />Add Suite
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── BY DATE VIEW ── */}
        {view === "date" && (
          <div className="mt-3">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2">
                <CalendarDays size={14} className="text-slate-400" />
                <input type="date" value={filterDate} max={todayLocal()}
                  onChange={e => e.target.value && setFilterDate(e.target.value)}
                  className="text-sm text-slate-200 bg-transparent [color-scheme:dark] focus:outline-none" />
              </div>
              {filterDate !== todayLocal() && (
                <button onClick={() => setFilterDate(todayLocal())}
                  className="text-xs text-blue-400 hover:text-blue-300 border border-blue-800/50 px-2.5 py-1.5 rounded-lg hover:bg-blue-900/20 transition-colors">
                  Today
                </button>
              )}
              {dateRows.length > 0 && (
                <div className="flex items-center gap-2 ml-auto text-xs text-slate-500">
                  <span className="text-green-400">{dateRows.filter(r => r.tc.status === "pass").length} pass</span>
                  <span className="text-amber-400">{dateRows.filter(r => r.tc.status === "in-progress").length} wip</span>
                  <span className="text-red-400">{dateRows.filter(r => r.tc.status === "fail").length} fail</span>
                  <span>{dateRows.length} total</span>
                </div>
              )}
            </div>

            {dateRows.length === 0 ? (
              <div className="flex flex-col items-center py-20 text-slate-600">
                <Clock size={28} className="mb-3 opacity-30" />
                <p className="text-sm">No tests recorded on {filterDate === todayLocal() ? "today" : new Date(filterDate + "T12:00:00").toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(groupedByDate).map(([groupKey, rows]) => {
                  const [crKey, suiteTitle] = groupKey.split("::");
                  const cr = data.find(c => c.crKey === crKey);
                  const passed = rows.filter(r => r.tc.status === "pass").length;
                  const failed = rows.filter(r => r.tc.status === "fail").length;
                  return (
                    <div key={groupKey} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800">
                        <span className="text-xs font-mono text-blue-400 font-bold">{crKey}</span>
                        <span className="text-slate-600">·</span>
                        <span className="text-xs text-slate-400">{suiteTitle}</span>
                        <div className="ml-auto flex items-center gap-2 text-xs">
                          {failed > 0 && <span className="text-red-400">{failed} fail</span>}
                          {passed > 0 && <span className="text-green-400">{passed} pass</span>}
                        </div>
                      </div>
                      <div>
                        <div className="grid grid-cols-[1fr_100px] sm:grid-cols-[1fr_120px] gap-2 px-3 sm:px-4 py-1.5 border-b border-slate-800/60">
                          <span className="text-xs text-slate-600 uppercase tracking-wider">TS Number</span>
                          <span className="text-xs text-slate-600 uppercase tracking-wider">Status</span>
                        </div>
                        {rows.map(({ tc }) => (
                          <div key={tc.id} className="grid grid-cols-[1fr_100px] sm:grid-cols-[1fr_120px] gap-2 items-center px-3 sm:px-4 py-2 border-b border-slate-800/40 last:border-0">
                            <span className="text-xs font-mono text-slate-300">{tc.tsNumber}</span>
                            <div className="flex items-center gap-1.5">
                              {tc.status === "pass" && <span className="flex items-center gap-1 text-xs text-green-400 font-medium"><CheckCircle2 size={11} />Pass</span>}
                              {tc.status === "in-progress" && <span className="flex items-center gap-1 text-xs text-amber-400 font-medium"><Timer size={11} />In Progress</span>}
                              {tc.status === "fail" && <span className="flex items-center gap-1 text-xs text-red-400 font-medium"><XCircle size={11} />Fail</span>}
                              {!tc.status && <span className="text-xs text-slate-600">—</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
