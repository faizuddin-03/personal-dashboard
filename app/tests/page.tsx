"use client";
import { useState, useEffect, useMemo, useCallback, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  Plus, X, Search, CheckCircle2, CalendarDays, Trash2, Pencil, FileSpreadsheet, ChevronDown, ChevronRight,
  EyeOff, Eye, ListChecks, ExternalLink, Clock, ArrowUp, ArrowDown,
} from "lucide-react";
import clsx from "clsx";
import { useApp } from "@/components/AppShell";
import { todayLocal } from "@/lib/date";
import {
  type CREntry, type TestCase, type TsStatus, type ImportPreview,
  TRACKER_KEY, TS_TRACKER_UPDATED_EVENT, loadTracker, saveTracker, uid, newCase, withLog, logEntry,
  statusLabel, sameTs, mergeImport,
} from "@/lib/tsTrackerModel";
import { AddCRPanel } from "./AddCRPanel";
import { ImportDialog } from "./ImportDialog";
import { TsDetailDrawer } from "./TsDetailDrawer";
import { StatusControl, StatusText, AutoBadge, ProgressBar, CountsLine, countCR, countCases, fmtDay } from "./ui";
import { runTally, dismissCR, dismissTs, undismissCR } from "@/lib/tsTrackerTally";
import { fetchDeploySessions, loadDeployCache, deployRank, type DeploySession } from "@/lib/tsTrackerDeploy";
import { useDeploySessions, DeploySoonChip } from "@/lib/useDeployReminder";

// CR list order (Faizuddin, 2026-10-22): ticket number, date added to the
// tracker, or deployment session from the Jira fix version (lib/tsTrackerDeploy.ts).
type CrSort = "number" | "added" | "deploy";
const SORT_KEY = "ts_tracker_cr_sort";
const SORT_LABEL: Record<CrSort, string> = { number: "Ticket number", added: "Date added", deploy: "Deployment session" };
function readSort(): { by: CrSort; desc: boolean } {
  try {
    const v = JSON.parse(localStorage.getItem(SORT_KEY) ?? "null");
    if (v && (v.by === "number" || v.by === "added" || v.by === "deploy")) return { by: v.by, desc: !!v.desc };
  } catch { /* ignore */ }
  return { by: "added", desc: false };
}
const crNum = (key: string) => Number(key.match(/-(\d+)$/)?.[1] ?? Number.MAX_SAFE_INTEGER);
function fmtSession(d: DeploySession): string {
  const day = d.date ? new Date(`${d.date}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short" }) : "";
  return [day, d.session].filter(Boolean).join(" · ");
}

// Types live in lib/tsTrackerModel.ts; re-exported for older importers.
export type { TestCase, TestSuite, CREntry } from "@/lib/tsTrackerModel";

const SELECTED_KEY = "ts_tracker_selected_cr";

type Filter = "all" | "none" | "in-progress" | "pass" | "fail" | "deprio";
const FILTERS: { v: Filter; label: string }[] = [
  { v: "all", label: "All" }, { v: "none", label: "Not started" }, { v: "in-progress", label: "WIP" },
  { v: "pass", label: "Pass" }, { v: "fail", label: "Fail" }, { v: "deprio", label: "Deprioritized" },
];

function readSelected(): string | null {
  try { return localStorage.getItem(SELECTED_KEY); } catch { return null; }
}
function writeSelected(id: string) {
  try { localStorage.setItem(SELECTED_KEY, id); } catch { /* blocked */ }
}

/** First load: every CR without a log start gets one now, so old cases say "Log starts <date>" truthfully. */
function loadStamped(): CREntry[] {
  const data = loadTracker();
  let changed = false;
  const now = new Date().toISOString();
  for (const cr of data) if (!cr.logSince) { cr.logSince = now; changed = true; }
  if (changed) saveTracker(data);
  return data;
}

const noopSubscribe = () => () => {};

const COLS = "md:grid-cols-[112px_minmax(0,1fr)_auto_132px_32px_150px]";

export default function TestTrackerPage() {
  const { creds } = useApp();
  // Client-only data: render nothing until mounted, so server and first client render match.
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const [data, setData] = useState<CREntry[]>(() => (typeof window === "undefined" ? [] : loadStamped()));
  const [view, setView] = useState<"cr" | "date">("cr");
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const d = loadTracker();
    const sel = readSelected();
    return d.some(c => c.id === sel) ? sel : d[0]?.id ?? null;
  });
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState(() => todayLocal());
  const [showAddCR, setShowAddCR] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [notice, setNotice] = useState("");
  const [openCaseId, setOpenCaseId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [confirmDeleteCR, setConfirmDeleteCR] = useState(false);
  const [confirmDeleteSuite, setConfirmDeleteSuite] = useState<string | null>(null);
  const [editCR, setEditCR] = useState<string | null>(null);
  const [editSuite, setEditSuite] = useState<{ id: string; value: string } | null>(null);
  const [addTs, setAddTs] = useState<{ suiteId: string; tsNumber: string; objective: string; error: string } | null>(null);
  const [addSuite, setAddSuite] = useState<string | null>(null);
  const [sort, setSort] = useState<{ by: CrSort; desc: boolean }>(() => (typeof window === "undefined" ? { by: "added", desc: false } : readSort()));
  const [deploy, setDeploy] = useState<Record<string, DeploySession | null>>(() => loadDeployCache());
  const [deployMsg, setDeployMsg] = useState("");
  const [deployBusy, setDeployBusy] = useState(false);
  // Deployment within 7 days → amber notice on the CR (lib/useDeployReminder.tsx).
  const deploySoon = useDeploySessions();
  const sessionFor = (key: string) => deploy[key.toUpperCase()] ?? deploySoon.forKey(key);

  // Automation runs write the tracker from AppShell (lib/tsTrackerSync.ts);
  // reload so this page shows them live and never saves over them.
  useEffect(() => {
    const reload = () => setData(loadTracker());
    const onStorage = (e: StorageEvent) => { if (e.key === TRACKER_KEY) reload(); };
    window.addEventListener(TS_TRACKER_UPDATED_EVENT, reload);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(TS_TRACKER_UPDATED_EVENT, reload);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // Keep in step with /tickets: CRs, TS lists, status from the last saved run.
  useEffect(() => { void runTally(); }, []);

  const persist = useCallback((next: CREntry[]) => { setData(next); saveTracker(next); }, []);

  function select(id: string) {
    setSelectedId(id); writeSelected(id);
    setConfirmDeleteCR(false); setEditCR(null); setAddTs(null); setAddSuite(null);
  }

  const cr = data.find(c => c.id === selectedId) ?? null;

  // ── Case ops ─────────────────────────────────────────────
  function mapCase(caseId: string, fn: (tc: TestCase) => TestCase) {
    persist(data.map(c => ({ ...c, suites: c.suites.map(s => ({ ...s, cases: s.cases.map(tc => tc.id === caseId ? fn(tc) : tc) })) })));
  }
  function setStatus(tc: TestCase, s: TsStatus) {
    if (tc.disabled || s === tc.status) return;
    mapCase(tc.id, c => withLog(
      { ...c, status: s, dateTested: s ? todayLocal() : null, autoUpdatedAt: undefined, autoNote: undefined },
      logEntry("status", "manual", { from: statusLabel(c.status), to: statusLabel(s) }),
    ));
  }
  function setDate(tc: TestCase, d: string | null) {
    if ((tc.dateTested ?? null) === d) return;
    mapCase(tc.id, c => withLog({ ...c, dateTested: d }, logEntry("date", "manual", { from: c.dateTested ?? "", to: d ?? "" })));
  }
  function toggleDeprio(tc: TestCase) {
    mapCase(tc.id, c => withLog({ ...c, disabled: !c.disabled }, logEntry(c.disabled ? "restored" : "deprioritized", "manual")));
  }
  function addNote(tc: TestCase, text: string) {
    mapCase(tc.id, c => withLog(c, logEntry("note", "manual", { text })));
  }
  function renameCase(tc: TestCase, tsNumber: string) {
    mapCase(tc.id, c => withLog({ ...c, tsNumber }, logEntry("note", "manual", { text: `TS No. changed ${c.tsNumber} → ${tsNumber}` })));
  }
  function setObjective(tc: TestCase, objective: string) {
    mapCase(tc.id, c => withLog({ ...c, objective: objective || undefined }, logEntry("note", "manual", { text: "Objective edited" })));
  }
  function removeCase(caseId: string) {
    for (const c of data) for (const s of c.suites) for (const tc of s.cases) if (tc.id === caseId) dismissTs(c.crKey, tc.tsNumber);
    persist(data.map(c => ({ ...c, suites: c.suites.map(s => ({ ...s, cases: s.cases.filter(tc => tc.id !== caseId) })) })));
    setOpenCaseId(null);
  }
  function submitAddTs() {
    if (!cr || !addTs) return;
    const ts = addTs.tsNumber.trim();
    if (!ts) return;
    if (cr.suites.some(s => s.cases.some(c => sameTs(c.tsNumber, ts, cr.crKey)))) {
      setAddTs({ ...addTs, error: `${ts} already exists in ${cr.crKey}.` });
      return;
    }
    const tc = newCase(ts, "manual", { objective: addTs.objective.trim() || undefined });
    persist(data.map(c => c.id !== cr.id ? c : { ...c, suites: c.suites.map(s => s.id !== addTs.suiteId ? s : { ...s, cases: [...s.cases, tc] }) }));
    setAddTs({ suiteId: addTs.suiteId, tsNumber: "", objective: "", error: "" });
  }

  // ── Suite / CR ops ──────────────────────────────────────
  function submitAddSuite() {
    if (!cr || !addSuite?.trim()) return;
    persist(data.map(c => c.id !== cr.id ? c : { ...c, suites: [...c.suites, { id: uid(), title: addSuite.trim(), cases: [] }] }));
    setAddSuite(null);
  }
  function renameSuite() {
    if (!cr || !editSuite) return;
    const t = editSuite.value.trim();
    if (t) persist(data.map(c => c.id !== cr.id ? c : { ...c, suites: c.suites.map(s => s.id !== editSuite.id ? s : { ...s, title: t }) }));
    setEditSuite(null);
  }
  function removeSuite(suiteId: string) {
    if (!cr) return;
    persist(data.map(c => c.id !== cr.id ? c : { ...c, suites: c.suites.filter(s => s.id !== suiteId) }));
    setConfirmDeleteSuite(null);
  }
  function addCR(key: string, summary: string) {
    undismissCR(key);
    const entry: CREntry = { id: uid(), crKey: key, crSummary: summary, suites: [], logSince: new Date().toISOString() };
    persist([...data, entry]);
    select(entry.id);
    setShowAddCR(false);
  }
  function removeCR() {
    if (!cr) return;
    const next = data.filter(c => c.id !== cr.id);
    dismissCR(cr.crKey);
    persist(next);
    setConfirmDeleteCR(false);
    if (next[0]) select(next[0].id); else setSelectedId(null);
  }
  function renameCR(value: string) {
    if (!cr) return;
    if (value.trim()) persist(data.map(c => c.id !== cr.id ? c : { ...c, crSummary: value.trim() }));
    setEditCR(null);
  }
  function toggleAutoSync() {
    if (!cr) return;
    persist(data.map(c => c.id !== cr.id ? c : { ...c, autoSync: c.autoSync === false }));
  }
  function applyImport(preview: ImportPreview) {
    const { data: next, summary } = mergeImport(data, preview);
    for (const c of next) if (!c.logSince) c.logSince = new Date().toISOString();
    persist(next);
    setShowImport(false);
    const first = next.find(c => c.crKey.toUpperCase() === preview.crs[0]?.crKey.toUpperCase());
    if (first) select(first.id);
    setView("cr");
    setNotice(`Imported ${preview.filename}: ${summary.casesAdded} TS added, ${summary.objectivesUpdated} objective${summary.objectivesUpdated === 1 ? "" : "s"} updated, ${summary.crsCreated} new CR${summary.crsCreated === 1 ? "" : "s"}.`);
  }

  function changeSort(next: { by: CrSort; desc: boolean }) {
    setSort(next);
    try { localStorage.setItem(SORT_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  }
  const crKeysJoined = data.map(c => c.crKey).join(",");
  const refreshDeploy = useCallback(async () => {
    setDeployBusy(true);
    const r = await fetchDeploySessions(crKeysJoined.split(",").filter(Boolean), creds);
    setDeploy(r.map);
    setDeployMsg(r.error ?? "");
    setDeployBusy(false);
  }, [crKeysJoined, creds]);
  // Read the sessions from Jira whenever this order is chosen (and when CRs change).
  useEffect(() => { if (sort.by === "deploy") void refreshDeploy(); }, [sort.by, refreshDeploy]);

  // ── Derived ─────────────────────────────────────────────
  const sorted = useMemo(() => {
    const list = data.map((c, i) => ({ c, i }));
    const key = (x: { c: CREntry; i: number }): string | number =>
      sort.by === "number" ? crNum(x.c.crKey) : sort.by === "deploy" ? deployRank(deploy[x.c.crKey.toUpperCase()]) : x.i;
    list.sort((a, b) => {
      const ka = key(a), kb = key(b);
      const cmp = ka < kb ? -1 : ka > kb ? 1 : a.i - b.i;
      return sort.desc ? -cmp : cmp;
    });
    return list.map(x => x.c);
  }, [data, sort, deploy]);
  const crCounts = useMemo(() => new Map(data.map(c => [c.id, countCR(c)])), [data]);

  const q = search.trim().toLowerCase();
  const matches = (tc: TestCase) => {
    const f = filter === "all" ? true : filter === "deprio" ? !!tc.disabled
      : !tc.disabled && (filter === "none" ? !tc.status : tc.status === filter);
    if (!f) return false;
    return !q || tc.tsNumber.toLowerCase().includes(q) || (tc.objective ?? "").toLowerCase().includes(q);
  };
  const filtering = filter !== "all" || !!q;

  let open: { cr: CREntry; suiteTitle: string; tc: TestCase } | null = null;
  if (openCaseId) {
    for (const c of data) for (const s of c.suites) {
      const tc = s.cases.find(x => x.id === openCaseId);
      if (tc && !open) open = { cr: c, suiteTitle: s.title, tc };
    }
  }

  const dateGroups = useMemo(() => {
    const groups: { cr: CREntry; suiteTitle: string; cases: TestCase[] }[] = [];
    for (const c of data) for (const s of c.suites) {
      const cases = s.cases.filter(tc => !tc.disabled && tc.dateTested === filterDate);
      if (cases.length) groups.push({ cr: c, suiteTitle: s.title, cases });
    }
    return groups;
  }, [data, filterDate]);
  const dateCounts = useMemo(() => countCases(dateGroups.flatMap(g => g.cases)), [dateGroups]);

  if (!hydrated) return null;

  const crStats = cr ? crCounts.get(cr.id)! : null;
  const tested = crStats ? crStats.pass + crStats.fail + crStats.wip : 0;

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-4 sm:px-6 h-14 flex items-center gap-2">
        <div className="min-w-0">
          <h1 className="text-sm font-semibold text-slate-200">TS Tracker</h1>
          <p className="text-xs text-slate-500 hidden sm:block truncate">Track TS progress per CR · click a TS for its log and evidence</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-0.5">
            {([["cr", "By CR"], ["date", "By date"]] as const).map(([v, label]) => (
              <button key={v} onClick={() => setView(v)}
                className={clsx("px-2.5 sm:px-3 py-1 text-xs rounded-md transition-colors",
                  view === v ? "bg-slate-700 text-slate-100 font-medium" : "text-slate-500 hover:text-slate-300")}>
                {label}
              </button>
            ))}
          </div>
          <button onClick={() => setShowImport(true)} title="Import TS from Excel"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs border border-slate-700 text-slate-200 rounded-lg hover:bg-slate-800">
            <FileSpreadsheet size={13} /><span className="hidden sm:inline">Import TS from Excel</span>
          </button>
          <button onClick={() => setShowAddCR(v => !v)} title="Add CR from Jira"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus size={13} /><span className="hidden sm:inline">Add CR</span>
          </button>
        </div>
      </header>

      <div className="flex-1 px-4 py-4 sm:p-6 w-full max-w-7xl mx-auto min-w-0">
        {showAddCR && (
          <div className="mb-4">
            <AddCRPanel creds={creds} existingKeys={data.map(c => c.crKey)} onAdd={addCR} onClose={() => setShowAddCR(false)} />
          </div>
        )}
        {notice && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-green-900 bg-green-950/30 px-3 py-2 text-xs text-green-300">
            <CheckCircle2 size={13} className="mt-0.5 shrink-0" /><span className="flex-1">{notice}</span>
            <button onClick={() => setNotice("")} className="text-green-500 hover:text-green-300" aria-label="Dismiss"><X size={12} /></button>
          </div>
        )}

        {view === "cr" && data.length === 0 && (
          <div className="flex flex-col items-center py-20 text-slate-500 text-center">
            <ListChecks size={30} className="mb-3 opacity-40" />
            <p className="text-sm text-slate-300">No CRs tracked yet</p>
            <p className="text-xs mt-1">Import your TS workbook, or add a CR from Jira and add TS by hand.</p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowImport(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700"><FileSpreadsheet size={13} />Import TS from Excel</button>
              <button onClick={() => setShowAddCR(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-slate-700 text-slate-200 rounded-lg hover:bg-slate-800"><Plus size={13} />Add CR</button>
            </div>
          </div>
        )}

        {/* ── BY CR ── */}
        {view === "cr" && data.length > 0 && (
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500">Order tickets by</span>
            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-0.5">
              {(["number", "added", "deploy"] as const).map(b => (
                // Click a type to use it; click it again to flip oldest-first (↑) / newest-first (↓).
                <button key={b} onClick={() => changeSort(sort.by === b ? { by: b, desc: !sort.desc } : { by: b, desc: false })}
                  title={sort.by === b ? (sort.desc ? "Newest first — click for oldest first" : "Oldest first — click for newest first") : "Oldest first"}
                  className={clsx("inline-flex items-center gap-1 px-2.5 py-1 rounded-md", sort.by === b ? "bg-slate-700 text-slate-100" : "text-slate-400 hover:text-slate-200")}>
                  {SORT_LABEL[b]}
                  {sort.by === b && (sort.desc ? <ArrowDown size={12} /> : <ArrowUp size={12} />)}
                </button>
              ))}
            </div>
            {sort.by === "deploy" && (
              <button onClick={() => void refreshDeploy()} disabled={deployBusy}
                className="px-2.5 py-1 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-50">
                {deployBusy ? "Reading Jira…" : "Refresh from Jira"}
              </button>
            )}
            {sort.by === "deploy" && deployMsg && <span className="text-amber-400">{deployMsg}</span>}
          </div>
        )}
        {view === "cr" && data.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-4 items-start">
            {/* CR switcher — narrow */}
            <div className="lg:hidden flex gap-2 overflow-x-auto pb-1">
              {sorted.map(c => {
                const k = crCounts.get(c.id)!;
                return (
                  <button key={c.id} onClick={() => select(c.id)}
                    className={clsx("shrink-0 w-44 text-left rounded-xl border px-3 py-2",
                      c.id === selectedId ? "border-blue-700 bg-blue-950/30" : "border-slate-800 bg-slate-900")}>
                    <span className="block text-xs font-mono font-bold text-blue-400">{c.crKey}</span>
                    <DeploySoonChip session={sessionFor(c.crKey)} className="mt-1" />
                    <span className="block text-[11px] text-slate-400 truncate">{c.crSummary}</span>
                    <ProgressBar c={k} className="mt-1.5" />
                  </button>
                );
              })}
            </div>

            {/* CR list — wide */}
            <aside className="hidden lg:block sticky top-[4.5rem] max-h-[calc(100vh-6rem)] overflow-y-auto space-y-2 pr-1">
              {sorted.map(c => {
                const k = crCounts.get(c.id)!;
                const done = k.pass + k.fail + k.wip;
                return (
                  <button key={c.id} onClick={() => select(c.id)}
                    className={clsx("w-full text-left rounded-xl border px-3 py-2.5 transition-colors",
                      c.id === selectedId ? "border-blue-700 bg-blue-950/30" : "border-slate-800 bg-slate-900 hover:border-slate-700")}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-blue-400">{c.crKey}</span>
                      <DeploySoonChip session={sessionFor(c.crKey)} />
                      <span className="ml-auto text-[11px] text-slate-500">{done}/{k.total}</span>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-2 mt-0.5">{c.crSummary}</p>
                    {deploy[c.crKey.toUpperCase()] && (
                      <p className="mt-1 text-[11px] text-violet-300" title={`Fix version ${deploy[c.crKey.toUpperCase()]!.name}`}>
                        Deploy: {fmtSession(deploy[c.crKey.toUpperCase()]!)}
                      </p>
                    )}
                    <ProgressBar c={k} className="mt-2" />
                    <div className="mt-1.5"><CountsLine c={k} compact /></div>
                  </button>
                );
              })}
            </aside>

            {/* Selected CR */}
            {cr && crStats && (
              <section className="min-w-0 space-y-3">
                <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                  <div className="flex items-start gap-3 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <Link href={`/jira/${cr.crKey}`} className="inline-flex items-center gap-1 text-xs font-mono font-bold text-blue-400 hover:text-blue-300">
                        {cr.crKey}<ExternalLink size={10} />
                      </Link>
                      <DeploySoonChip session={sessionFor(cr.crKey)} className="ml-2 align-middle" />
                      {editCR !== null ? (
                        <input autoFocus value={editCR} onChange={e => setEditCR(e.target.value)}
                          onBlur={() => renameCR(editCR)}
                          onKeyDown={e => { if (e.key === "Enter") renameCR(editCR); if (e.key === "Escape") setEditCR(null); }}
                          className="mt-1 w-full text-sm bg-slate-800 border border-blue-600 rounded px-2 py-1 text-slate-200 focus:outline-none" />
                      ) : (
                        <p className="text-sm text-slate-200 font-medium mt-0.5 group">
                          {cr.crSummary}
                          <button onClick={() => setEditCR(cr.crSummary)} title="Edit summary" aria-label="Edit summary"
                            className="ml-1.5 text-slate-600 hover:text-slate-300 align-middle"><Pencil size={11} /></button>
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => setShowImport(true)}
                        className="flex items-center gap-1.5 px-2.5 py-1 text-xs border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800">
                        <FileSpreadsheet size={12} />Import
                      </button>
                      {!confirmDeleteCR ? (
                        <button onClick={() => setConfirmDeleteCR(true)} title="Delete CR" aria-label="Delete CR"
                          className="p-1.5 text-slate-600 hover:text-red-400 rounded-lg hover:bg-slate-800"><Trash2 size={13} /></button>
                      ) : (
                        <span className="flex items-center gap-1 text-xs">
                          <span className="text-red-400">Delete CR?</span>
                          <button onClick={removeCR} className="px-2 py-0.5 bg-red-700 text-white rounded hover:bg-red-600">Yes</button>
                          <button onClick={() => setConfirmDeleteCR(false)} className="px-2 py-0.5 border border-slate-700 text-slate-400 rounded hover:bg-slate-800">No</button>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <ProgressBar c={crStats} className="flex-1" />
                    <span className="text-xs text-slate-400 shrink-0">{tested}/{crStats.total} tested · <span className="text-green-400 font-semibold">{crStats.total ? Math.round((crStats.pass / crStats.total) * 100) : 0}% pass</span></span>
                  </div>
                  <div className="mt-2 flex items-center gap-3 flex-wrap">
                    <CountsLine c={crStats} />
                    <label className="ml-auto flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none"
                      title="When on, automation runs record Pass / Fail and evidence on matching TS numbers in this CR">
                      <input type="checkbox" checked={cr.autoSync !== false} onChange={toggleAutoSync} className="accent-blue-600" />
                      Update from automation runs
                    </label>
                  </div>
                </div>

                {/* Filter bar */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex gap-1 overflow-x-auto">
                    {FILTERS.map(f => (
                      <button key={f.v} onClick={() => setFilter(f.v)}
                        className={clsx("shrink-0 px-2.5 py-1 text-xs rounded-lg border transition-colors",
                          filter === f.v ? "border-blue-700 bg-blue-950/40 text-blue-200" : "border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700")}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                  <div className="relative sm:ml-auto sm:w-64">
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search TS no. or objective"
                      className="w-full pl-7 pr-7 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-600" />
                    {search && <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300" aria-label="Clear search"><X size={12} /></button>}
                  </div>
                </div>

                {/* Sections */}
                {cr.suites.length === 0 && (
                  <p className="text-xs text-slate-500 rounded-xl border border-dashed border-slate-800 px-4 py-6 text-center">
                    No sections yet. Import the TS workbook or add a section below.
                  </p>
                )}
                {cr.suites.map(suite => {
                  const rows = suite.cases.filter(matches);
                  if (filtering && rows.length === 0) return null;
                  const sc = countCases(suite.cases);
                  const isCollapsed = collapsed[suite.id] ?? false;
                  return (
                    <div key={suite.id} className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
                      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-800">
                        <button onClick={() => setCollapsed(p => ({ ...p, [suite.id]: !isCollapsed }))}
                          className="text-slate-500 hover:text-slate-300" aria-label={isCollapsed ? "Expand section" : "Collapse section"}>
                          {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                        </button>
                        {editSuite?.id === suite.id ? (
                          <input autoFocus value={editSuite.value} onChange={e => setEditSuite({ id: suite.id, value: e.target.value })}
                            onBlur={renameSuite}
                            onKeyDown={e => { if (e.key === "Enter") renameSuite(); if (e.key === "Escape") setEditSuite(null); }}
                            className="flex-1 min-w-0 text-xs font-medium bg-slate-800 border border-blue-600 rounded px-2 py-0.5 text-slate-200 focus:outline-none" />
                        ) : (
                          <p className="flex-1 min-w-0 text-xs font-semibold text-slate-200 truncate" title={suite.title}>
                            {suite.title}
                            <button onClick={() => setEditSuite({ id: suite.id, value: suite.title })} title="Rename section" aria-label="Rename section"
                              className="ml-1.5 text-slate-600 hover:text-slate-300 align-middle"><Pencil size={10} /></button>
                          </p>
                        )}
                        <span className="hidden sm:inline text-[11px] text-slate-500 shrink-0">{sc.pass + sc.fail + sc.wip}/{sc.total} tested</span>
                        <ProgressBar c={sc} className="w-16 shrink-0" />
                        {confirmDeleteSuite !== suite.id ? (
                          <button onClick={() => setConfirmDeleteSuite(suite.id)} title="Remove section" aria-label="Remove section"
                            className="text-slate-600 hover:text-red-400 p-0.5"><X size={13} /></button>
                        ) : (
                          <span className="flex items-center gap-1 text-xs shrink-0">
                            <span className="text-red-400 hidden sm:inline">Remove section and {suite.cases.length} TS?</span>
                            <button onClick={() => removeSuite(suite.id)} className="px-2 py-0.5 bg-red-700 text-white rounded hover:bg-red-600">Yes</button>
                            <button onClick={() => setConfirmDeleteSuite(null)} className="px-2 py-0.5 border border-slate-700 text-slate-400 rounded hover:bg-slate-800">No</button>
                          </span>
                        )}
                      </div>

                      {!isCollapsed && (
                        <>
                          {rows.length > 0 && (
                            <div className={clsx("hidden md:grid gap-3 px-3 py-1.5 border-b border-slate-800/70 text-[11px] uppercase tracking-wider text-slate-500", COLS)}>
                              <span>TS No.</span><span>Objective</span><span>Status</span><span>Date tested</span><span title="Deprioritize">Dep.</span><span>Last automation</span>
                            </div>
                          )}
                          {rows.map(tc => (
                            <div key={tc.id} role="button" tabIndex={0}
                              onClick={() => setOpenCaseId(tc.id)}
                              onKeyDown={e => { if (e.key === "Enter" && e.target === e.currentTarget) setOpenCaseId(tc.id); }}
                              className={clsx("flex flex-wrap md:grid items-center gap-x-3 gap-y-2 px-3 py-2.5 border-b border-slate-800/50 last:border-0 cursor-pointer hover:bg-slate-800/30 focus:outline-none focus-visible:bg-slate-800/40",
                                COLS, openCaseId === tc.id && "bg-slate-800/40")}>
                              <div className="basis-full md:contents">
                                <span className={clsx("text-xs font-mono", tc.disabled ? "text-slate-600 line-through" : "text-slate-200")}>{tc.tsNumber}</span>
                                <span className={clsx("block md:inline text-xs mt-0.5 md:mt-0 min-w-0 md:line-clamp-2", tc.disabled ? "text-slate-600" : "text-slate-400")}>
                                  {tc.objective || <span className="text-slate-700">—</span>}
                                  {tc.disabled && <span className="ml-1.5 text-[10px] uppercase tracking-wider text-slate-500 border border-slate-700 rounded px-1">Deprioritized</span>}
                                </span>
                              </div>
                              <StatusControl status={tc.status} disabled={tc.disabled} onChange={s => setStatus(tc, s)} />
                              <div onClick={e => e.stopPropagation()}>
                                <input type="date" value={tc.dateTested ?? ""} disabled={tc.disabled} aria-label="Date tested"
                                  onChange={e => setDate(tc, e.target.value || null)}
                                  className="w-[128px] text-xs text-slate-300 bg-transparent border border-transparent hover:border-slate-700 focus:border-blue-600 rounded px-1 py-0.5 focus:outline-none [color-scheme:dark] disabled:opacity-40" />
                              </div>
                              <button onClick={e => { e.stopPropagation(); toggleDeprio(tc); }}
                                title={tc.disabled ? "Restore (count in progress again)" : "Deprioritize (exclude from progress)"}
                                aria-label={tc.disabled ? "Restore" : "Deprioritize"}
                                className={clsx("p-1 rounded hover:bg-slate-800", tc.disabled ? "text-amber-400" : "text-slate-600 hover:text-slate-300")}>
                                {tc.disabled ? <Eye size={13} /> : <EyeOff size={13} />}
                              </button>
                              <div className="min-w-0"><AutoBadge tc={tc} /></div>
                            </div>
                          ))}
                          {filtering && rows.length === 0 && <p className="px-3 py-3 text-xs text-slate-600">No TS match.</p>}

                          {/* Add TS */}
                          {addTs?.suiteId === suite.id ? (
                            <div className="px-3 py-2 border-t border-slate-800/60 space-y-1.5">
                              <div className="flex flex-col sm:flex-row gap-2">
                                <input autoFocus value={addTs.tsNumber} placeholder="TS No., e.g. 12412_TS13"
                                  onChange={e => setAddTs({ ...addTs, tsNumber: e.target.value, error: "" })}
                                  onKeyDown={e => { if (e.key === "Enter") submitAddTs(); if (e.key === "Escape") setAddTs(null); }}
                                  className="sm:w-40 text-xs font-mono bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-600" />
                                <input value={addTs.objective} placeholder="Objective (optional)"
                                  onChange={e => setAddTs({ ...addTs, objective: e.target.value })}
                                  onKeyDown={e => { if (e.key === "Enter") submitAddTs(); if (e.key === "Escape") setAddTs(null); }}
                                  className="flex-1 min-w-0 text-xs bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-600" />
                                <div className="flex gap-1">
                                  <button onClick={submitAddTs} className="px-2.5 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">Add</button>
                                  <button onClick={() => setAddTs(null)} className="px-2 py-1.5 text-xs text-slate-400 hover:text-slate-200" aria-label="Cancel"><X size={13} /></button>
                                </div>
                              </div>
                              {addTs.error && <p className="text-xs text-red-400">{addTs.error}</p>}
                            </div>
                          ) : !filtering && (
                            <button onClick={() => setAddTs({ suiteId: suite.id, tsNumber: "", objective: "", error: "" })}
                              className="w-full flex items-center gap-1.5 px-3 py-2 text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800/30 border-t border-slate-800/60">
                              <Plus size={11} />Add TS
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}

                {/* Add section */}
                {addSuite !== null ? (
                  <div className="flex items-center gap-2">
                    <input autoFocus value={addSuite} onChange={e => setAddSuite(e.target.value)} placeholder="Section title, e.g. A. UCD — INVOICE"
                      onKeyDown={e => { if (e.key === "Enter") submitAddSuite(); if (e.key === "Escape") setAddSuite(null); }}
                      className="flex-1 min-w-0 text-xs bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-600" />
                    <button onClick={submitAddSuite} className="px-2.5 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add</button>
                    <button onClick={() => setAddSuite(null)} className="text-slate-500 hover:text-slate-300" aria-label="Cancel"><X size={13} /></button>
                  </div>
                ) : (
                  <button onClick={() => setAddSuite("")} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 py-1">
                    <Plus size={11} />Add section
                  </button>
                )}
              </section>
            )}
          </div>
        )}

        {/* ── BY DATE ── */}
        {view === "date" && (
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5">
                <CalendarDays size={14} className="text-slate-400" />
                <input type="date" value={filterDate} max={todayLocal()} aria-label="Date"
                  onChange={e => e.target.value && setFilterDate(e.target.value)}
                  className="text-sm text-slate-200 bg-transparent [color-scheme:dark] focus:outline-none" />
              </div>
              {filterDate !== todayLocal() && (
                <button onClick={() => setFilterDate(todayLocal())}
                  className="text-xs text-blue-400 hover:text-blue-300 border border-blue-900 px-2.5 py-1.5 rounded-lg hover:bg-blue-950/30">Today</button>
              )}
              {dateGroups.length > 0 && <div className="sm:ml-auto"><CountsLine c={dateCounts} compact /></div>}
            </div>
            {dateGroups.length === 0 ? (
              <div className="flex flex-col items-center py-20 text-slate-600">
                <Clock size={28} className="mb-3 opacity-40" />
                <p className="text-sm">Nothing tested on {filterDate === todayLocal() ? "today" : fmtDay(filterDate)}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dateGroups.map(g => (
                  <div key={`${g.cr.id}::${g.suiteTitle}`} className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-800 min-w-0">
                      <button onClick={() => { select(g.cr.id); setView("cr"); }} className="text-xs font-mono font-bold text-blue-400 hover:text-blue-300 shrink-0">{g.cr.crKey}</button>
                      <span className="text-slate-700">·</span>
                      <span className="text-xs text-slate-400 truncate">{g.suiteTitle}</span>
                    </div>
                    {g.cases.map(tc => (
                      <button key={tc.id} onClick={() => setOpenCaseId(tc.id)}
                        className="w-full text-left flex flex-wrap sm:flex-nowrap items-center gap-x-3 gap-y-1 px-3 py-2 border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30">
                        <span className="text-xs font-mono text-slate-200 sm:w-28 shrink-0">{tc.tsNumber}</span>
                        <span className="text-xs text-slate-400 flex-1 min-w-0 basis-full sm:basis-auto order-last sm:order-none truncate">{tc.objective || "—"}</span>
                        <StatusText status={tc.status} />
                        <AutoBadge tc={tc} />
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showImport && <ImportDialog existing={data} onApply={applyImport} onClose={() => setShowImport(false)} />}
      {open && (
        <TsDetailDrawer key={open.tc.id} cr={open.cr} suiteTitle={open.suiteTitle} tc={open.tc}
          onClose={() => setOpenCaseId(null)}
          onStatus={s => setStatus(open.tc, s)}
          onDate={d => setDate(open.tc, d)}
          onToggleDeprio={() => toggleDeprio(open.tc)}
          onNote={t => addNote(open.tc, t)}
          onRename={t => renameCase(open.tc, t)}
          onObjective={o => setObjective(open.tc, o)}
          onDelete={() => removeCase(open.tc.id)} />
      )}
    </div>
  );
}
