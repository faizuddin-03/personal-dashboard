"use client";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  Search, RefreshCw, Loader2, X, Filter, ChevronDown, ChevronUp, Plus,
} from "lucide-react";
import { JiraIssue, JiraSearchResult } from "@/lib/jira";
import { useApp } from "@/components/AppShell";
import IssueCard from "@/components/IssueCard";
import IssueDrawer from "@/components/IssueDrawer";
import TokenExpiryBanner from "@/components/TokenExpiryBanner";
import clsx from "clsx";

type FilterMode = "include" | "exclude";
type FilterMap  = Record<string, FilterMode>;
type ChipField  = "statuses" | "priorities" | "issueTypes" | "assignees" | "reporters" | "labels" | "fixVersions";
type DateField  = "created" | "updated" | "dueDate";

interface DateRange { from: string; to: string; }

interface FilterState {
  statuses: FilterMap;
  priorities: FilterMap;
  issueTypes: FilterMap;
  assignees: FilterMap;
  reporters: FilterMap;
  labels: FilterMap;
  fixVersions: FilterMap;
  created:  DateRange;
  updated:  DateRange;
  dueDate:  DateRange;
}

interface FilterTab {
  id: string;
  name: string;
  crKey: string | null;
  crInput: string;
  issues: JiraIssue[];
  loading: boolean;
  error: string;
  filters: FilterState;
  filtersOpen: boolean;
}

const emptyDateRange = (): DateRange => ({ from: "", to: "" });

const emptyFilters = (): FilterState => ({
  statuses: {}, priorities: {}, issueTypes: {},
  assignees: {}, reporters: {}, labels: {}, fixVersions: {},
  created: emptyDateRange(), updated: emptyDateRange(), dueDate: emptyDateRange(),
});

function makeTab(name: string): FilterTab {
  return {
    id: crypto.randomUUID(),
    name,
    crKey: null,
    crInput: "",
    issues: [],
    loading: false,
    error: "",
    filters: emptyFilters(),
    filtersOpen: true,
  };
}

const TABS_KEY   = "jira_filter_tabs_v4";
const ACTIVE_KEY = "jira_filter_active_tab";

type SlimTab = Pick<FilterTab, "id" | "name" | "crKey" | "crInput" | "filters" | "filtersOpen">;

function persistTabs(tabs: FilterTab[], activeId: string) {
  const slim: SlimTab[] = tabs.map(({ id, name, crKey, crInput, filters, filtersOpen }) =>
    ({ id, name, crKey, crInput, filters, filtersOpen })
  );
  localStorage.setItem(TABS_KEY, JSON.stringify(slim));
  localStorage.setItem(ACTIVE_KEY, activeId);
}

function restoreTabs(): { tabs: FilterTab[]; activeId: string | null } {
  try {
    const raw     = localStorage.getItem(TABS_KEY);
    const activeId = localStorage.getItem(ACTIVE_KEY);
    if (!raw) return { tabs: [], activeId: null };
    const slim: SlimTab[] = JSON.parse(raw);
    const tabs: FilterTab[] = slim.map(s => ({
      ...s,
      filtersOpen: s.filtersOpen ?? true,
      issues: [],
      loading: false,
      error: "",
    }));
    return { tabs, activeId };
  } catch { return { tabs: [], activeId: null }; }
}

function ChipRow({ label, options, values, onToggle }: {
  label: string; options: string[]; values: FilterMap; onToggle: (v: string) => void;
}) {
  if (!options.length) return null;
  return (
    <div className="flex items-start gap-2 py-2.5 border-b border-slate-800/60 last:border-0">
      <span className="text-xs text-slate-500 w-24 shrink-0 pt-0.5 font-medium">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map(opt => {
          const mode = values[opt];
          return (
            <button
              key={opt}
              onClick={() => onToggle(opt)}
              title={mode === "include" ? "Click to exclude" : mode === "exclude" ? "Click to reset" : "Click to include"}
              className={clsx(
                "text-xs px-2.5 py-1 rounded-full border transition-colors",
                mode === "include" ? "bg-blue-600/20 text-blue-300 border-blue-500/50"
                : mode === "exclude" ? "bg-red-600/20 text-red-300 border-red-500/50 line-through"
                : "bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-slate-200"
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DateRow({ label, value, onChange }: {
  label: string;
  value: DateRange;
  onChange: (range: DateRange) => void;
}) {
  const hasValue = value.from || value.to;
  return (
    <div className="flex items-center gap-2 py-2.5 border-b border-slate-800/60 last:border-0">
      <span className="text-xs text-slate-500 w-24 shrink-0 font-medium">{label}</span>
      <div className="flex items-center gap-2 flex-wrap">
        <input
          type="date"
          value={value.from}
          max={value.to || undefined}
          onChange={e => onChange({ ...value, from: e.target.value })}
          className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-blue-500 [color-scheme:dark]"
        />
        <span className="text-xs text-slate-600">→</span>
        <input
          type="date"
          value={value.to}
          min={value.from || undefined}
          onChange={e => onChange({ ...value, to: e.target.value })}
          className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-blue-500 [color-scheme:dark]"
        />
        {hasValue && (
          <button
            onClick={() => onChange(emptyDateRange())}
            className="text-slate-600 hover:text-red-400 transition-colors"
            title="Clear"
          >
            <X size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function IssueFilterPage() {
  const { creds, openSettings } = useApp();

  const [tabs, setTabs]           = useState<FilterTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>("");
  const [hydrated, setHydrated]   = useState(false);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameVal, setRenameVal]   = useState("");
  const renameRef = useRef<HTMLInputElement>(null);

  // Shared search-dropdown state (for the active tab's CR input)
  const [crQuery, setCrQuery]         = useState("");
  const [crResults, setCrResults]     = useState<JiraIssue[]>([]);
  const [crSearching, setCrSearching] = useState(false);
  const [showCrSearch, setShowCrSearch] = useState(false);

  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  // ── Hydrate ────────────────────────────────────────────────
  useEffect(() => {
    const { tabs: saved, activeId } = restoreTabs();
    if (saved.length > 0) {
      setTabs(saved);
      setActiveTabId(activeId && saved.find(t => t.id === activeId) ? activeId : saved[0].id);
    } else {
      const first = makeTab("Filter 1");
      setTabs([first]);
      setActiveTabId(first.id);
    }
    setHydrated(true);
  }, []);

  // ── Persist ────────────────────────────────────────────────
  useEffect(() => {
    if (!hydrated || !activeTabId) return;
    persistTabs(tabs, activeTabId);
  }, [tabs, activeTabId, hydrated]);

  // ── Helpers ────────────────────────────────────────────────
  const updateTab = useCallback((id: string, updates: Partial<FilterTab>) => {
    setTabs(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const activeTab = useMemo(
    () => tabs.find(t => t.id === activeTabId) ?? tabs[0] ?? null,
    [tabs, activeTabId]
  );

  // Clear search dropdown state when switching tabs
  useEffect(() => {
    setCrQuery("");
    setCrResults([]);
    setShowCrSearch(false);
  }, [activeTabId]);

  // ── Fetch issues for a tab ─────────────────────────────────
  const fetchForTab = useCallback(async (tabId: string, key: string) => {
    if (!creds) return;
    setTabs(prev => prev.map(t => t.id === tabId ? { ...t, loading: true, error: "" } : t));
    try {
      const res = await fetch("/api/jira/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...creds,
          jql: `parent = "${key}" ORDER BY priority DESC, status ASC`,
          maxResults: 200,
          fields: [
            "summary", "status", "priority", "issuetype", "assignee",
            "reporter", "created", "updated", "labels", "fixVersions",
            "project", "duedate", "parent", "components",
          ],
        }),
      });
      const data: JiraSearchResult = await res.json();
      if (!res.ok) throw new Error((data as unknown as { error: string }).error ?? "Failed");
      setTabs(prev => prev.map(t =>
        t.id === tabId ? { ...t, loading: false, issues: data.issues ?? [] } : t
      ));
    } catch (e) {
      setTabs(prev => prev.map(t =>
        t.id === tabId ? { ...t, loading: false, error: e instanceof Error ? e.message : "Failed to fetch issues" } : t
      ));
    }
  }, [creds]);

  // Auto-fetch when switching to a tab that has a key but no issues yet
  useEffect(() => {
    if (!hydrated || !activeTab) return;
    if (activeTab.crKey && activeTab.issues.length === 0 && !activeTab.loading && !activeTab.error) {
      fetchForTab(activeTab.id, activeTab.crKey);
    }
  }, [activeTabId, hydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── CR search (debounced) ──────────────────────────────────
  useEffect(() => {
    if (!creds || !crQuery.trim()) { setCrResults([]); return; }
    const q       = crQuery.trim();
    const escaped = q.replace(/"/g, '\\"');
    const isId    = /^\d+$/.test(escaped);
    const isKey   = /^[A-Za-z]+-\d+$/.test(escaped);
    const resolved = isId && creds.defaultProjectKey ? `${creds.defaultProjectKey}-${escaped}` : null;
    const jql = resolved ? `key = "${resolved}" ORDER BY updated DESC`
              : isId     ? `id = ${escaped} ORDER BY updated DESC`
              : isKey    ? `key = "${escaped}" ORDER BY updated DESC`
              : `text ~ "${escaped}" ORDER BY updated DESC`;
    const t = setTimeout(async () => {
      setCrSearching(true);
      try {
        const res = await fetch("/api/jira/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...creds, jql, maxResults: 10 }),
        });
        const data: JiraSearchResult = await res.json();
        setCrResults(data.issues ?? []);
      } catch { setCrResults([]); }
      finally { setCrSearching(false); }
    }, isKey || isId ? 0 : 500);
    return () => clearTimeout(t);
  }, [creds, crQuery]);

  // ── CR actions ─────────────────────────────────────────────
  function selectCrIssue(issue: JiraIssue) {
    if (!activeTab) return;
    updateTab(activeTab.id, { crKey: issue.key, crInput: issue.key, issues: [], error: "" });
    setShowCrSearch(false);
    setCrQuery("");
    setCrResults([]);
    fetchForTab(activeTab.id, issue.key);
  }

  function applyCrInput() {
    if (!activeTab) return;
    const key = activeTab.crInput.trim().toUpperCase();
    if (!key) return;
    updateTab(activeTab.id, { crKey: key, crInput: key, issues: [], error: "" });
    setShowCrSearch(false);
    fetchForTab(activeTab.id, key);
  }

  function drillToParent(key: string) {
    if (!activeTab) return;
    updateTab(activeTab.id, { crKey: key, crInput: key, issues: [], error: "" });
    fetchForTab(activeTab.id, key);
  }

  function toggleFilter(field: ChipField, value: string) {
    if (!activeTab) return;
    const map  = activeTab.filters[field];
    const mode = map[value];
    let next: FilterMap;
    if (!mode) {
      next = { ...map, [value]: "include" };
    } else if (mode === "include") {
      next = { ...map, [value]: "exclude" };
    } else {
      const { [value]: _, ...rest } = map;
      next = rest;
    }
    updateTab(activeTab.id, { filters: { ...activeTab.filters, [field]: next } });
  }

  function setDateFilter(field: DateField, range: DateRange) {
    if (!activeTab) return;
    updateTab(activeTab.id, { filters: { ...activeTab.filters, [field]: range } });
  }

  // ── Tab management ─────────────────────────────────────────
  function addTab() {
    const tab = makeTab(`Filter ${tabs.length + 1}`);
    setTabs(prev => [...prev, tab]);
    setActiveTabId(tab.id);
  }

  function closeTab(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (tabs.length === 1) return;
    const idx  = tabs.findIndex(t => t.id === id);
    const next = tabs[idx === 0 ? 1 : idx - 1];
    setTabs(prev => prev.filter(t => t.id !== id));
    if (activeTabId === id) setActiveTabId(next.id);
  }

  function startRename(id: string, name: string, e: React.MouseEvent) {
    e.stopPropagation();
    setRenamingId(id);
    setRenameVal(name);
    setTimeout(() => { renameRef.current?.select(); }, 30);
  }

  function commitRename() {
    if (!renamingId) return;
    const trimmed = renameVal.trim();
    if (trimmed) updateTab(renamingId, { name: trimmed });
    setRenamingId(null);
  }

  // ── Derived for active tab ─────────────────────────────────
  const issues  = activeTab?.issues ?? [];
  const filters = activeTab?.filters ?? emptyFilters();

  const uniqueStatuses    = useMemo(() => [...new Set(issues.map(i => i.fields.status.name))].sort(), [issues]);
  const uniquePriorities  = useMemo(() => [...new Set(issues.map(i => i.fields.priority?.name).filter(Boolean) as string[])].sort(), [issues]);
  const uniqueTypes       = useMemo(() => [...new Set(issues.map(i => i.fields.issuetype.name))].sort(), [issues]);
  const uniqueAssignees   = useMemo(() => [...new Set(issues.map(i => i.fields.assignee?.displayName ?? "Unassigned"))].sort(), [issues]);
  const uniqueReporters   = useMemo(() => [...new Set(issues.map(i => i.fields.reporter?.displayName ?? "Unknown"))].sort(), [issues]);
  const uniqueLabels      = useMemo(() => [...new Set(issues.flatMap(i => i.fields.labels ?? []))].sort(), [issues]);
  const uniqueFixVersions = useMemo(() => [...new Set(issues.flatMap(i => (i.fields.fixVersions ?? []).map((v: { name: string }) => v.name)))].sort(), [issues]);

  const filtered = useMemo(() => {
    function checkScalar(map: FilterMap, value: string): boolean {
      const entries = Object.entries(map);
      const inc = entries.filter(([, m]) => m === "include").map(([v]) => v);
      const exc = entries.filter(([, m]) => m === "exclude").map(([v]) => v);
      if (inc.length > 0 && !inc.includes(value)) return false;
      if (exc.includes(value)) return false;
      return true;
    }
    function checkArray(map: FilterMap, values: string[]): boolean {
      const entries = Object.entries(map);
      const inc = entries.filter(([, m]) => m === "include").map(([v]) => v);
      const exc = entries.filter(([, m]) => m === "exclude").map(([v]) => v);
      if (inc.length > 0 && !inc.some(l => values.includes(l))) return false;
      if (exc.some(l => values.includes(l))) return false;
      return true;
    }
    function checkDate(range: DateRange, isoStr: string | null | undefined): boolean {
      if (!range.from && !range.to) return true;
      if (!isoStr) return false;
      const d = isoStr.slice(0, 10); // YYYY-MM-DD
      if (range.from && d < range.from) return false;
      if (range.to   && d > range.to)   return false;
      return true;
    }
    return issues.filter(issue => {
      const f = filters;
      if (!checkScalar(f.statuses,    issue.fields.status.name))                                    return false;
      if (!checkScalar(f.priorities,  issue.fields.priority?.name ?? ""))                           return false;
      if (!checkScalar(f.issueTypes,  issue.fields.issuetype.name))                                 return false;
      if (!checkScalar(f.assignees,   issue.fields.assignee?.displayName ?? "Unassigned"))          return false;
      if (!checkScalar(f.reporters,   issue.fields.reporter?.displayName ?? "Unknown"))             return false;
      if (!checkArray(f.labels,       issue.fields.labels ?? []))                                   return false;
      if (!checkArray(f.fixVersions,  (issue.fields.fixVersions ?? []).map((v: { name: string }) => v.name))) return false;
      if (!checkDate(f.created,  issue.fields.created))  return false;
      if (!checkDate(f.updated,  issue.fields.updated))  return false;
      if (!checkDate(f.dueDate,  issue.fields.duedate))  return false;
      return true;
    });
  }, [issues, filters]);

  const chipFields: ChipField[] = ["statuses","priorities","issueTypes","assignees","reporters","labels","fixVersions"];
  const dateFields: DateField[] = ["created","updated","dueDate"];
  const hasActiveFilters  =
    chipFields.some(k => Object.keys(filters[k]).length > 0) ||
    dateFields.some(k => filters[k].from || filters[k].to);
  const activeFilterCount =
    chipFields.reduce((s, k) => s + Object.keys(filters[k]).length, 0) +
    dateFields.reduce((s, k) => s + (filters[k].from ? 1 : 0) + (filters[k].to ? 1 : 0), 0);

  if (!hydrated) return null;

  if (!creds) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p className="mb-2">No Jira credentials configured.</p>
        <button onClick={openSettings} className="text-blue-400 underline text-sm">Go to Settings</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <TokenExpiryBanner expiry={creds.tokenExpiry} onSettingsClick={openSettings} />

      {/* Page header + tab bar */}
      <div className="px-6 pt-5 pb-0 border-b border-slate-800">
        <h1 className="text-xl font-semibold text-slate-100 mb-4">Issue Filter</h1>

        <div className="flex items-end gap-1 overflow-x-auto pb-0">
          {tabs.map(t => {
            const isActive   = t.id === activeTabId;
            const isRenaming = renamingId === t.id;
            return (
              <div
                key={t.id}
                onClick={() => { if (!isActive) setActiveTabId(t.id); }}
                className={clsx(
                  "group relative flex items-center gap-1.5 px-3 py-2 rounded-t-lg border border-b-0 text-sm transition-colors shrink-0 select-none",
                  isActive
                    ? "bg-slate-950 border-slate-700 text-slate-100 cursor-default"
                    : "bg-slate-800/60 border-slate-800 text-slate-500 hover:text-slate-300 hover:bg-slate-800 cursor-pointer"
                )}
              >
                {isRenaming ? (
                  <input
                    ref={renameRef}
                    value={renameVal}
                    onChange={e => setRenameVal(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={e => {
                      if (e.key === "Enter") commitRename();
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                    onClick={e => e.stopPropagation()}
                    className="bg-transparent outline-none w-28 text-sm text-slate-100 border-b border-blue-500"
                    autoFocus
                  />
                ) : (
                  <span
                    className="max-w-[140px] truncate"
                    onDoubleClick={e => startRename(t.id, t.name, e)}
                    title={isActive ? "Double-click to rename" : t.name}
                  >
                    {t.name}
                  </span>
                )}

                {t.issues.length > 0 && !isRenaming && (
                  <span className={clsx(
                    "text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 tabular-nums",
                    isActive ? "bg-slate-800 text-slate-400" : "bg-slate-700 text-slate-500"
                  )}>
                    {t.issues.length}
                  </span>
                )}

                {t.loading && (
                  <Loader2 size={11} className="animate-spin text-blue-400 shrink-0" />
                )}

                {tabs.length > 1 && !isRenaming && (
                  <button
                    onClick={e => closeTab(t.id, e)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-0.5 text-slate-600 hover:text-red-400 shrink-0"
                    title="Close tab"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            );
          })}

          <button
            onClick={addTab}
            className="flex items-center gap-1 px-2.5 py-2 mb-0 rounded-t-lg text-slate-600 hover:text-slate-200 hover:bg-slate-800 transition-colors shrink-0"
            title="New filter tab"
          >
            <Plus size={15} />
          </button>
        </div>
      </div>

      {/* Active tab body */}
      {activeTab && (
        <div className="flex flex-col flex-1 overflow-hidden">

          {/* CR selector */}
          <div className="px-6 py-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  value={activeTab.crInput}
                  onChange={e => {
                    const val = e.target.value.toUpperCase();
                    updateTab(activeTab.id, { crInput: val });
                    setCrQuery(val);
                  }}
                  onFocus={() => setShowCrSearch(true)}
                  onBlur={() => setTimeout(() => setShowCrSearch(false), 200)}
                  onKeyDown={e => {
                    if (e.key === "Enter") { setShowCrSearch(false); applyCrInput(); }
                    if (e.key === "Escape") setShowCrSearch(false);
                  }}
                  placeholder="Enter a parent ticket key or search by title"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
                {showCrSearch && activeTab.crInput.trim().length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-20 overflow-hidden">
                    {crSearching && (
                      <div className="flex items-center gap-2 px-4 py-3 text-slate-500 text-sm">
                        <Loader2 size={14} className="animate-spin" /> Searching…
                      </div>
                    )}
                    {!crSearching && crResults.map(issue => (
                      <button
                        key={issue.key}
                        onMouseDown={() => selectCrIssue(issue)}
                        className="w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-700 text-left border-b border-slate-700/40 last:border-0 transition-colors"
                      >
                        <span className="text-xs font-mono text-blue-400 shrink-0 pt-0.5">{issue.key}</span>
                        <div className="min-w-0">
                          <p className="text-sm text-slate-200 truncate">{issue.fields.summary}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {issue.fields.issuetype.name} · {issue.fields.status.name}
                          </p>
                        </div>
                      </button>
                    ))}
                    {!crSearching && activeTab.crInput.trim() && crResults.length === 0 && (
                      <div className="px-4 py-3 text-sm text-slate-600">No results found</div>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={() => { setShowCrSearch(false); applyCrInput(); }}
                disabled={!activeTab.crInput.trim() || activeTab.loading}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                {activeTab.loading
                  ? <Loader2 size={14} className="animate-spin" />
                  : <Search size={14} />}
                Fetch
              </button>

              {activeTab.crKey && (
                <button
                  onClick={() => fetchForTab(activeTab.id, activeTab.crKey!)}
                  disabled={activeTab.loading}
                  title="Refresh"
                  className="p-2.5 text-slate-500 hover:text-slate-200 bg-slate-800 border border-slate-700 rounded-xl hover:border-slate-600 transition-colors disabled:opacity-50 shrink-0"
                >
                  <RefreshCw size={14} className={activeTab.loading ? "animate-spin" : ""} />
                </button>
              )}
            </div>
          </div>

          {/* Results area */}
          <div className="flex-1 overflow-y-auto">
            {!activeTab.crKey ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-600 p-8 gap-3">
                <Filter size={40} className="opacity-20" />
                <p className="text-sm">Enter a parent ticket key above to load its child issues.</p>
              </div>
            ) : activeTab.error ? (
              <div className="m-6 p-4 bg-red-950/30 border border-red-900/40 rounded-xl text-sm text-red-400">
                {activeTab.error}
              </div>
            ) : (
              <div className="p-6 space-y-4">

                {issues.length > 0 && (
                  <p className="text-xs text-slate-600">
                    {filtered.length === issues.length
                      ? `${issues.length} issue${issues.length !== 1 ? "s" : ""}`
                      : `${filtered.length} of ${issues.length} shown`}
                  </p>
                )}

                {/* Filter panel */}
                {issues.length > 0 && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    <button
                      onClick={() => updateTab(activeTab.id, { filtersOpen: !activeTab.filtersOpen })}
                      className="w-full flex items-center justify-between px-4 py-3 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Filter size={14} />
                        <span className="font-medium">Filters</span>
                        {hasActiveFilters && (
                          <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                            {activeFilterCount}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {hasActiveFilters && (
                          <span
                            onClick={e => { e.stopPropagation(); updateTab(activeTab.id, { filters: emptyFilters() }); }}
                            className="text-xs text-slate-500 hover:text-red-400 transition-colors"
                          >
                            Clear all
                          </span>
                        )}
                        {activeTab.filtersOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>
                    </button>

                    {activeTab.filtersOpen && (
                      <div className="px-4 pb-2 border-t border-slate-800 pt-1">
                        <ChipRow label="Status"      options={uniqueStatuses}    values={filters.statuses}    onToggle={v => toggleFilter("statuses", v)} />
                        <ChipRow label="Priority"    options={uniquePriorities}  values={filters.priorities}  onToggle={v => toggleFilter("priorities", v)} />
                        <ChipRow label="Type"        options={uniqueTypes}       values={filters.issueTypes}  onToggle={v => toggleFilter("issueTypes", v)} />
                        <ChipRow label="Assignee"    options={uniqueAssignees}   values={filters.assignees}   onToggle={v => toggleFilter("assignees", v)} />
                        <ChipRow label="Reporter"    options={uniqueReporters}   values={filters.reporters}   onToggle={v => toggleFilter("reporters", v)} />
                        <ChipRow label="Label"       options={uniqueLabels}      values={filters.labels}      onToggle={v => toggleFilter("labels", v)} />
                        <ChipRow label="Fix Version" options={uniqueFixVersions} values={filters.fixVersions} onToggle={v => toggleFilter("fixVersions", v)} />
                        <DateRow label="Created"     value={filters.created}  onChange={r => setDateFilter("created", r)} />
                        <DateRow label="Updated"     value={filters.updated}  onChange={r => setDateFilter("updated", r)} />
                        <DateRow label="Due Date"    value={filters.dueDate}  onChange={r => setDateFilter("dueDate", r)} />
                      </div>
                    )}
                  </div>
                )}

                {/* Results */}
                {activeTab.loading ? (
                  <div className="flex items-center justify-center py-16 text-slate-600">
                    <Loader2 size={24} className="animate-spin" />
                  </div>
                ) : issues.length === 0 ? (
                  <div className="text-center py-16 text-slate-600 text-sm">
                    No child issues found for{" "}
                    <span className="font-mono text-slate-500">{activeTab.crKey}</span>.
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-12 text-slate-600 text-sm">
                    No issues match the selected filters.
                    <button
                      onClick={() => updateTab(activeTab.id, { filters: emptyFilters() })}
                      className="block mx-auto mt-2 text-blue-400 text-xs underline"
                    >
                      Clear filters
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filtered.map(issue => (
                      <IssueCard
                        key={issue.key}
                        issue={issue}
                        baseUrl={creds.baseUrl}
                        onClick={() => setSelectedKey(issue.key)}
                        onParentClick={drillToParent}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {selectedKey && (
        <IssueDrawer
          issueKey={selectedKey}
          creds={creds}
          onClose={() => setSelectedKey(null)}
        />
      )}
    </div>
  );
}
