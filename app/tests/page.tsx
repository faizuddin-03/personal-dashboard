"use client";
import { useState, useEffect, useRef } from "react";
import { Plus, ChevronDown, ChevronRight, X, Search, Loader2, CheckCircle2, XCircle, Clock, CalendarDays, Trash2, Timer } from "lucide-react";
import clsx from "clsx";
import { useApp } from "@/components/AppShell";
import { reporterIs } from "@/lib/jira";
import { todayLocal } from "@/lib/date";

// ── Data model ────────────────────────────────────────────
export interface TestCase {
  id: string;
  tsNumber: string;
  status: "pass" | "fail" | "in-progress" | null;
  dateTested: string | null; // YYYY-MM-DD
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
function save(data: CREntry[]) { localStorage.setItem(STORE_KEY, JSON.stringify(data)); }
function uid() { return crypto.randomUUID(); }

// ── Jira search types ─────────────────────────────────────
interface JiraHit { key: string; summary: string; }

// ── Status chip ───────────────────────────────────────────
function StatusChip({ status, onToggle }: { status: "pass" | "fail" | "in-progress" | null; onToggle: (s: "pass" | "fail" | "in-progress" | null) => void }) {
  return (
    <div className="flex gap-1">
      <button
        onClick={() => onToggle(status === "pass" ? null : "pass")}
        className={clsx("flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border transition-colors",
          status === "pass" ? "bg-green-900/60 border-green-700 text-green-300" : "border-slate-700 text-slate-600 hover:border-green-700 hover:text-green-400"
        )}
      >
        <CheckCircle2 size={11} />Pass
      </button>
      <button
        onClick={() => onToggle(status === "in-progress" ? null : "in-progress")}
        className={clsx("flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border transition-colors",
          status === "in-progress" ? "bg-amber-900/60 border-amber-700 text-amber-300" : "border-slate-700 text-slate-600 hover:border-amber-700 hover:text-amber-400"
        )}
      >
        <Timer size={11} />WIP
      </button>
      <button
        onClick={() => onToggle(status === "fail" ? null : "fail")}
        className={clsx("flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border transition-colors",
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
  // editing states
  const [editingSuiteId, setEditingSuiteId] = useState<string | null>(null);
  const [newSuiteTitle, setNewSuiteTitle] = useState("");
  const [addingCaseToSuite, setAddingCaseToSuite] = useState<string | null>(null);
  const [newCaseTsNumber, setNewCaseTsNumber] = useState("");

  useEffect(() => { setData(load()); setHydrated(true); }, []);

  function persist(next: CREntry[]) { setData(next); save(next); }

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

  function toggleStatus(tc: TestCase, newStatus: "pass" | "fail" | "in-progress" | null) {
    updateCase(tc.id, {
      status: newStatus,
      dateTested: newStatus ? (tc.dateTested ?? todayLocal()) : null,
    });
  }

  // ── By Date view data ────────────────────────────────────
  type DateRow = { crKey: string; crSummary: string; suiteTitle: string; tc: TestCase };
  function rowsForDate(date: string): DateRow[] {
    const rows: DateRow[] = [];
    for (const cr of data) {
      for (const s of cr.suites) {
        for (const tc of s.cases) {
          if (tc.dateTested === date) rows.push({ crKey: cr.crKey, crSummary: cr.crSummary, suiteTitle: s.title, tc });
        }
      }
    }
    return rows;
  }

  // ── Stats helpers ────────────────────────────────────────
  function crStats(cr: CREntry) {
    const all = cr.suites.flatMap(s => s.cases);
    const pass = all.filter(c => c.status === "pass").length;
    const fail = all.filter(c => c.status === "fail").length;
    const wip = all.filter(c => c.status === "in-progress").length;
    const done = pass + fail + wip;
    const passPct = all.length ? Math.round((pass / all.length) * 100) : 0;
    return { total: all.length, done, pass, fail, wip, passPct };
  }

  function suiteStats(suite: TestSuite) {
    const pass = suite.cases.filter(c => c.status === "pass").length;
    const fail = suite.cases.filter(c => c.status === "fail").length;
    const wip = suite.cases.filter(c => c.status === "in-progress").length;
    const passPct = suite.cases.length ? Math.round((pass / suite.cases.length) * 100) : 0;
    return { total: suite.cases.length, pass, fail, wip, passPct };
  }

  if (!hydrated) return null;

  const dateRows = rowsForDate(filterDate);
  const groupedByDate: Record<string, DateRow[]> = {};
  for (const r of dateRows) {
    const k = `${r.crKey}::${r.suiteTitle}`;
    (groupedByDate[k] ??= []).push(r);
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-6 h-14 flex items-center justify-between">
        <h1 className="text-sm font-semibold text-slate-200">Test Scenario Tracker</h1>
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

      <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
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
                const stats = crStats(cr);
                return (
                  <div key={cr.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    {/* CR header */}
                    <div className="flex items-center gap-2 px-4 py-3 cursor-pointer select-none hover:bg-slate-800/50 transition-colors"
                      onClick={() => setExpandedCRs(p => ({ ...p, [cr.crKey]: !isOpen }))}>
                      {isOpen ? <ChevronDown size={15} className="text-slate-500 shrink-0" /> : <ChevronRight size={15} className="text-slate-500 shrink-0" />}
                      <span className="text-xs font-mono text-blue-400 font-bold shrink-0">{cr.crKey}</span>
                      <span className="text-sm text-slate-200 font-medium flex-1 line-clamp-1">{cr.crSummary}</span>
                      {stats.total > 0 && (
                        <div className="flex items-center gap-2 shrink-0">
                          {stats.wip > 0 && <span className="text-[10px] text-amber-400 font-medium">{stats.wip} wip</span>}
                          {stats.fail > 0 && <span className="text-[10px] text-red-400 font-medium">{stats.fail} fail</span>}
                          {stats.pass > 0 && <span className="text-[10px] text-green-400 font-medium">{stats.pass} pass</span>}
                          <span className="text-[10px] text-slate-500">{stats.done}/{stats.total}</span>
                          <span className="text-[10px] font-semibold text-green-400">{stats.passPct}%</span>
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
                        {cr.suites.map(suite => {
                          const suiteOpen = expandedSuites[suite.id] ?? false;
                          const ss = suiteStats(suite);
                          return (
                            <div key={suite.id} className="bg-slate-950/60 border border-slate-800 rounded-lg overflow-hidden">
                              {/* Suite header */}
                              <div className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-slate-800/40 transition-colors"
                                onClick={() => setExpandedSuites(p => ({ ...p, [suite.id]: !suiteOpen }))}>
                                {suiteOpen ? <ChevronDown size={13} className="text-slate-600 shrink-0" /> : <ChevronRight size={13} className="text-slate-600 shrink-0" />}
                                <span className="text-xs font-medium text-slate-300 flex-1">{suite.title}</span>
                                <span className="text-[10px] text-slate-600">{ss.total} TS</span>
                                {ss.wip > 0 && <span className="text-[10px] text-amber-400">{ss.wip} wip</span>}
                                {ss.fail > 0 && <span className="text-[10px] text-red-400">{ss.fail}✗</span>}
                                {ss.pass > 0 && <span className="text-[10px] text-green-400">{ss.pass}✓</span>}
                                {ss.total > 0 && <span className="text-[10px] font-semibold text-green-400">{ss.passPct}%</span>}
                                <button onClick={e => { e.stopPropagation(); removeSuite(cr.id, suite.id); }}
                                  className="text-slate-700 hover:text-red-400 p-0.5 ml-1" title="Remove suite">
                                  <X size={12} />
                                </button>
                              </div>

                              {suiteOpen && (
                                <div className="border-t border-slate-800">
                                  {/* Column headers */}
                                  {suite.cases.length > 0 && (
                                    <div className="grid grid-cols-[1fr_220px_110px] gap-2 px-3 py-1.5 border-b border-slate-800/60">
                                      <span className="text-[10px] text-slate-600 uppercase tracking-wider">TS Number</span>
                                      <span className="text-[10px] text-slate-600 uppercase tracking-wider">Status</span>
                                      <span className="text-[10px] text-slate-600 uppercase tracking-wider">Date Tested</span>
                                    </div>
                                  )}

                                  {/* Test cases */}
                                  {suite.cases.map(tc => (
                                    <div key={tc.id} className="grid grid-cols-[1fr_220px_110px] gap-2 items-center px-3 py-2 border-b border-slate-800/40 hover:bg-slate-800/20 group">
                                      <span className="text-xs font-mono text-slate-300">{tc.tsNumber}</span>
                                      <StatusChip status={tc.status} onToggle={s => toggleStatus(tc, s)} />
                                      <div className="flex items-center gap-1.5">
                                        {tc.dateTested ? (
                                          <input type="date" value={tc.dateTested}
                                            onChange={e => e.target.value && updateCase(tc.id, { dateTested: e.target.value })}
                                            className="text-[11px] text-slate-400 bg-transparent border-b border-transparent hover:border-slate-700 focus:border-blue-600 focus:outline-none [color-scheme:dark] cursor-pointer" />
                                        ) : (
                                          <span className="text-[11px] text-slate-700">—</span>
                                        )}
                                        <button onClick={() => removeCase(tc.id)}
                                          className="opacity-0 group-hover:opacity-100 text-slate-700 hover:text-red-400 ml-auto transition-opacity">
                                          <X size={11} />
                                        </button>
                                      </div>
                                    </div>
                                  ))}

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
                          );
                        })}

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
                        <div className="ml-auto flex items-center gap-2 text-[11px]">
                          {failed > 0 && <span className="text-red-400">{failed} fail</span>}
                          {passed > 0 && <span className="text-green-400">{passed} pass</span>}
                        </div>
                      </div>
                      <div>
                        <div className="grid grid-cols-[1fr_120px] gap-2 px-4 py-1.5 border-b border-slate-800/60">
                          <span className="text-[10px] text-slate-600 uppercase tracking-wider">TS Number</span>
                          <span className="text-[10px] text-slate-600 uppercase tracking-wider">Status</span>
                        </div>
                        {rows.map(({ tc }) => (
                          <div key={tc.id} className="grid grid-cols-[1fr_120px] gap-2 items-center px-4 py-2 border-b border-slate-800/40 last:border-0">
                            <span className="text-xs font-mono text-slate-300">{tc.tsNumber}</span>
                            <div className="flex items-center gap-1.5">
                              {tc.status === "pass" && <span className="flex items-center gap-1 text-[11px] text-green-400 font-medium"><CheckCircle2 size={11} />Pass</span>}
                              {tc.status === "in-progress" && <span className="flex items-center gap-1 text-[11px] text-amber-400 font-medium"><Timer size={11} />In Progress</span>}
                              {tc.status === "fail" && <span className="flex items-center gap-1 text-[11px] text-red-400 font-medium"><XCircle size={11} />Fail</span>}
                              {!tc.status && <span className="text-[11px] text-slate-600">—</span>}
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
