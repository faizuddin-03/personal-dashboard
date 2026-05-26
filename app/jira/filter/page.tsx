"use client";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  Search, RefreshCw, Loader2, X, Filter, ChevronDown, ChevronUp,
} from "lucide-react";
import { JiraIssue, JiraSearchResult } from "@/lib/jira";
import { useApp } from "@/components/AppShell";
import IssueCard from "@/components/IssueCard";
import IssueDrawer from "@/components/IssueDrawer";
import TokenExpiryBanner from "@/components/TokenExpiryBanner";
import clsx from "clsx";

const STORAGE_KEY = "jira_filter_cr_key";

interface FilterState {
  statuses: string[];
  priorities: string[];
  issueTypes: string[];
  assignees: string[];
  reporters: string[];
  labels: string[];
  fixVersions: string[];
}

const emptyFilters = (): FilterState => ({
  statuses: [], priorities: [], issueTypes: [],
  assignees: [], reporters: [], labels: [], fixVersions: [],
});

function ChipRow({
  label, options, selected, onToggle,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  if (!options.length) return null;
  return (
    <div className="flex items-start gap-2 py-2.5 border-b border-slate-800/60 last:border-0">
      <span className="text-xs text-slate-500 w-24 shrink-0 pt-0.5 font-medium">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map(opt => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              onClick={() => onToggle(opt)}
              className={clsx(
                "text-xs px-2.5 py-1 rounded-full border transition-colors",
                active
                  ? "bg-blue-600/20 text-blue-300 border-blue-500/50"
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

export default function IssueFilterPage() {
  const { creds, openSettings } = useApp();

  const [crInput, setCrInput] = useState("");
  const [crKey, setCrKey] = useState<string | null>(null);
  const [crIssue, setCrIssue] = useState<JiraIssue | null>(null);

  const [crQuery, setCrQuery] = useState("");
  const [crResults, setCrResults] = useState<JiraIssue[]>([]);
  const [crSearching, setCrSearching] = useState(false);
  const [showCrSearch, setShowCrSearch] = useState(false);
  const crInputRef = useRef<HTMLInputElement>(null);

  const [issues, setIssues] = useState<JiraIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState<FilterState>(emptyFilters());
  const [filtersOpen, setFiltersOpen] = useState(true);

  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setCrKey(saved);
      setCrInput(saved);
    }
  }, []);

  const fetchIssues = useCallback(async (key?: string) => {
    const target = key ?? crKey;
    if (!creds || !target) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/jira/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...creds,
          jql: `parent = "${target}" ORDER BY priority DESC, status ASC`,
          maxResults: 200,
          fields: [
            "summary", "status", "priority", "issuetype", "assignee",
            "reporter", "created", "updated", "labels", "fixVersions",
            "project", "duedate", "parent", "components",
          ],
        }),
      });
      const data: JiraSearchResult = await res.json();
      if (!res.ok) throw new Error((data as unknown as { error: string }).error ?? "Failed to fetch issues");
      setIssues(data.issues ?? []);
      setFilters(emptyFilters());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch issues");
    } finally {
      setLoading(false);
    }
  }, [creds, crKey]);

  useEffect(() => {
    if (crKey) fetchIssues();
  }, [crKey, fetchIssues]);

  // Debounced CR search
  useEffect(() => {
    if (!creds || crQuery.length < 2) { setCrResults([]); return; }
    const t = setTimeout(async () => {
      setCrSearching(true);
      try {
        const isKey = /^[A-Z]+-\d*$/i.test(crQuery.trim());
        const jql = isKey
          ? `key = "${crQuery.trim().toUpperCase()}" OR summary ~ "${crQuery}" ORDER BY updated DESC`
          : `summary ~ "${crQuery}" ORDER BY updated DESC`;
        const res = await fetch("/api/jira/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...creds, jql, maxResults: 8 }),
        });
        const data: JiraSearchResult = await res.json();
        setCrResults(data.issues ?? []);
      } catch { setCrResults([]); }
      finally { setCrSearching(false); }
    }, 400);
    return () => clearTimeout(t);
  }, [creds, crQuery]);

  function selectCrIssue(issue: JiraIssue) {
    setCrKey(issue.key);
    setCrInput(issue.key);
    setCrIssue(issue);
    setShowCrSearch(false);
    setCrQuery("");
    localStorage.setItem(STORAGE_KEY, issue.key);
  }

  function applyCrInput() {
    const trimmed = crInput.trim().toUpperCase();
    if (!trimmed) return;
    setCrIssue(null);
    setCrKey(trimmed);
    localStorage.setItem(STORAGE_KEY, trimmed);
  }

  function drillToParent(key: string) {
    setCrInput(key);
    setCrKey(key);
    setCrIssue(null);
    localStorage.setItem(STORAGE_KEY, key);
  }

  function toggleFilter(field: keyof FilterState, value: string) {
    setFilters(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value],
    }));
  }

  const hasActiveFilters = Object.values(filters).some(arr => arr.length > 0);
  const activeFilterCount = Object.values(filters).reduce((s, a) => s + a.length, 0);

  const uniqueStatuses    = useMemo(() => [...new Set(issues.map(i => i.fields.status.name))].sort(), [issues]);
  const uniquePriorities  = useMemo(() => [...new Set(issues.map(i => i.fields.priority?.name).filter(Boolean) as string[])].sort(), [issues]);
  const uniqueTypes       = useMemo(() => [...new Set(issues.map(i => i.fields.issuetype.name))].sort(), [issues]);
  const uniqueAssignees   = useMemo(() => [...new Set(issues.map(i => i.fields.assignee?.displayName ?? "Unassigned"))].sort(), [issues]);
  const uniqueReporters   = useMemo(() => [...new Set(issues.map(i => i.fields.reporter?.displayName ?? "Unknown"))].sort(), [issues]);
  const uniqueLabels      = useMemo(() => [...new Set(issues.flatMap(i => i.fields.labels ?? []))].sort(), [issues]);
  const uniqueFixVersions = useMemo(() => [...new Set(issues.flatMap(i => (i.fields.fixVersions ?? []).map((v: { name: string }) => v.name)))].sort(), [issues]);

  const filtered = useMemo(() => {
    return issues.filter(issue => {
      const f = filters;
      if (f.statuses.length    && !f.statuses.includes(issue.fields.status.name)) return false;
      if (f.priorities.length  && !f.priorities.includes(issue.fields.priority?.name ?? "")) return false;
      if (f.issueTypes.length  && !f.issueTypes.includes(issue.fields.issuetype.name)) return false;
      if (f.assignees.length   && !f.assignees.includes(issue.fields.assignee?.displayName ?? "Unassigned")) return false;
      if (f.reporters.length   && !f.reporters.includes(issue.fields.reporter?.displayName ?? "Unknown")) return false;
      if (f.labels.length      && !f.labels.some(l => (issue.fields.labels ?? []).includes(l))) return false;
      if (f.fixVersions.length && !f.fixVersions.some(v => (issue.fields.fixVersions ?? []).map((fv: { name: string }) => fv.name).includes(v))) return false;
      return true;
    });
  }, [issues, filters]);

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

      {/* Page header */}
      <div className="px-6 py-5 border-b border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-100">Issue Filter</h1>
          {crKey && issues.length > 0 && (
            <span className="text-sm text-slate-500">
              {filtered.length === issues.length
                ? `${issues.length} issue${issues.length !== 1 ? "s" : ""}`
                : `${filtered.length} of ${issues.length} shown`}
            </span>
          )}
        </div>

        {/* CR / parent selector */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              ref={crInputRef}
              value={showCrSearch ? crQuery : crInput}
              onChange={e => {
                if (showCrSearch) {
                  setCrQuery(e.target.value);
                } else {
                  setCrInput(e.target.value.toUpperCase());
                }
              }}
              onFocus={() => setShowCrSearch(true)}
              onBlur={() => setTimeout(() => setShowCrSearch(false), 200)}
              onKeyDown={e => {
                if (e.key === "Enter") { setShowCrSearch(false); applyCrInput(); }
                if (e.key === "Escape") { setShowCrSearch(false); }
              }}
              placeholder="Enter a parent ticket key (e.g. CR-123) or search by title"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />
            {showCrSearch && (crQuery.length >= 2 || crResults.length > 0) && (
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
                      <p className="text-xs text-slate-500 mt-0.5">{issue.fields.issuetype.name} · {issue.fields.status.name}</p>
                    </div>
                  </button>
                ))}
                {!crSearching && crQuery.length >= 2 && crResults.length === 0 && (
                  <div className="px-4 py-3 text-sm text-slate-600">No results found</div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => { setShowCrSearch(false); applyCrInput(); }}
            disabled={!crInput.trim() || loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            Fetch
          </button>

          {crKey && (
            <button
              onClick={() => fetchIssues()}
              disabled={loading}
              title="Refresh"
              className="p-2.5 text-slate-500 hover:text-slate-200 bg-slate-800 border border-slate-700 rounded-xl hover:border-slate-600 transition-colors disabled:opacity-50 shrink-0"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          )}
        </div>

        {/* Selected CR info */}
        {crIssue && (
          <p className="text-xs text-slate-500 truncate">
            <span className="font-mono text-blue-400">{crIssue.key}</span>
            <span className="mx-1.5 text-slate-700">·</span>
            {crIssue.fields.summary}
          </p>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {!crKey ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-600 p-8 gap-3">
            <Filter size={40} className="opacity-20" />
            <p className="text-sm">Enter a parent ticket key above to load its child issues, then use filters to narrow them down.</p>
          </div>
        ) : error ? (
          <div className="m-6 p-4 bg-red-950/30 border border-red-900/40 rounded-xl text-sm text-red-400">{error}</div>
        ) : (
          <div className="p-6 space-y-4">

            {/* Filter panel */}
            {issues.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <button
                  onClick={() => setFiltersOpen(v => !v)}
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
                        onClick={e => { e.stopPropagation(); setFilters(emptyFilters()); }}
                        className="text-xs text-slate-500 hover:text-red-400 transition-colors"
                      >
                        Clear all
                      </span>
                    )}
                    {filtersOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                </button>

                {filtersOpen && (
                  <div className="px-4 pb-2 border-t border-slate-800 pt-1">
                    <ChipRow label="Status"      options={uniqueStatuses}    selected={filters.statuses}    onToggle={v => toggleFilter("statuses", v)} />
                    <ChipRow label="Priority"    options={uniquePriorities}  selected={filters.priorities}  onToggle={v => toggleFilter("priorities", v)} />
                    <ChipRow label="Type"        options={uniqueTypes}       selected={filters.issueTypes}  onToggle={v => toggleFilter("issueTypes", v)} />
                    <ChipRow label="Assignee"    options={uniqueAssignees}   selected={filters.assignees}   onToggle={v => toggleFilter("assignees", v)} />
                    <ChipRow label="Reporter"    options={uniqueReporters}   selected={filters.reporters}   onToggle={v => toggleFilter("reporters", v)} />
                    <ChipRow label="Label"       options={uniqueLabels}      selected={filters.labels}      onToggle={v => toggleFilter("labels", v)} />
                    <ChipRow label="Fix Version" options={uniqueFixVersions} selected={filters.fixVersions} onToggle={v => toggleFilter("fixVersions", v)} />
                  </div>
                )}
              </div>
            )}

            {/* Results */}
            {loading ? (
              <div className="flex items-center justify-center py-16 text-slate-600">
                <Loader2 size={24} className="animate-spin" />
              </div>
            ) : issues.length === 0 ? (
              <div className="text-center py-16 text-slate-600 text-sm">
                No child issues found for <span className="font-mono text-slate-500">{crKey}</span>.
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-slate-600 text-sm">
                No issues match the selected filters.
                <button onClick={() => setFilters(emptyFilters())} className="block mx-auto mt-2 text-blue-400 text-xs underline">
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

      {/* Issue detail drawer */}
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
