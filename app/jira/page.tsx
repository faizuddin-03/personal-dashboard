"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  RefreshCw, Loader2, SearchX, Layers, UserCheck, Bug,
  ChevronDown, ChevronRight, X, Ticket, Plus, CheckCheck,
  BookOpen, Search,
} from "lucide-react";
import {
  JiraIssue, JiraSearchResult, reporterIs,
} from "@/lib/jira";
import { useApp } from "@/components/AppShell";
import IssueCard from "@/components/IssueCard";
import IssueDrawer from "@/components/IssueDrawer";
import StatsBar from "@/components/StatsBar";
import TokenExpiryBanner from "@/components/TokenExpiryBanner";
import clsx from "clsx";
import { remoteSync, remoteDelete } from "@/lib/remote-sync";

type Tab = "assigned" | "reported";
type SortKey = "updated" | "created" | "priority";
const PRIORITY_ORDER: Record<string, number> = { Highest: 0, Critical: 0, High: 1, Medium: 2, Low: 3, Lowest: 4 };

function statusChipCls(colorName: string) {
  if (colorName === "green")     return "bg-green-950/50 text-green-300";
  if (colorName === "yellow")    return "bg-amber-950/60 text-amber-300";
  if (colorName === "blue-grey") return "bg-slate-700 text-slate-300";
  return "bg-blue-950/50 text-blue-300";
}

// ── localStorage helpers ───────────────────────────────────────
const ASSIGNED_CR_STORE = "jira_assigned_cr_keys";
const BUG_CR_STORE      = "jira_bug_cr_key";

function loadAssignedCrKeys(): string[] {
  try { return JSON.parse(localStorage.getItem(ASSIGNED_CR_STORE) ?? "[]"); } catch { return []; }
}
function saveAssignedCrKeys(keys: string[]) {
  const json = JSON.stringify(keys);
  localStorage.setItem(ASSIGNED_CR_STORE, json);
  remoteSync("jira_assigned_cr_keys", json);
}
function loadBugCrKey(): string | null {
  return localStorage.getItem(BUG_CR_STORE) ?? null;
}
function saveBugCrKey(key: string | null) {
  if (key) { localStorage.setItem(BUG_CR_STORE, key); remoteSync("jira_bug_cr_key", key); }
  else { localStorage.removeItem(BUG_CR_STORE); remoteDelete("jira_bug_cr_key"); }
}

export default function JiraPage() {
  const { creds, openSettings } = useApp();

  // ── Core issues ────────────────────────────────────────────
  const [assigned, setAssigned]   = useState<JiraIssue[]>([]);
  const [reported, setReported]   = useState<JiraIssue[]>([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("assigned");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [search, setSearch]       = useState("");
  const [sort, setSort]           = useState<SortKey>("updated");
  const [statusFilter, setStatusFilter] = useState("all");

  // ── Waiting on Me ──────────────────────────────────────────
  const [waitingOnMe, setWaitingOnMe]               = useState<JiraIssue[]>([]);
  const [waitingOnMeLoading, setWaitingOnMeLoading] = useState(false);

  // ── Bugs This Week ─────────────────────────────────────────
  const [bugsThisWeek, setBugsThisWeek]               = useState<JiraIssue[]>([]);
  const [bugsThisWeekLoading, setBugsThisWeekLoading] = useState(false);
  const [bugsThisWeekError, setBugsThisWeekError]     = useState("");

  // ── Assigned CR ────────────────────────────────────────────
  const [assignedCrKeys, setAssignedCrKeys]           = useState<string[]>([]);
  const [assignedCrData, setAssignedCrData]           = useState<Record<string, JiraIssue>>({});
  const [assignedCrLoading, setAssignedCrLoading]     = useState(false);
  const [assignedCrChildren, setAssignedCrChildren]   = useState<Record<string, JiraIssue[]>>({});
  const [assignedCrChildLoading, setAssignedCrChildLoading] = useState<Record<string, boolean>>({});
  const [assignedCrExpanded, setAssignedCrExpanded]   = useState<Record<string, boolean>>({});
  const [showAddCr, setShowAddCr]                     = useState(false);
  const [addCrQuery, setAddCrQuery]                   = useState("");
  const [addCrResults, setAddCrResults]               = useState<JiraIssue[]>([]);
  const [addCrSearching, setAddCrSearching]           = useState(false);
  const addCrInputRef = useRef<HTMLInputElement>(null);

  // ── Bug Tickets (CR-scoped) ────────────────────────────────
  const [bugCrKey, setBugCrKey]             = useState<string | null>(null);
  const [bugCrIssue, setBugCrIssue]         = useState<JiraIssue | null>(null);
  const [bugChildren, setBugChildren]       = useState<JiraIssue[]>([]);
  const [bugLoading, setBugLoading]         = useState(false);
  const [showSelectBugCr, setShowSelectBugCr] = useState(false);
  const [selectBugCrQuery, setSelectBugCrQuery] = useState("");
  const [selectBugCrResults, setSelectBugCrResults] = useState<JiraIssue[]>([]);
  const [selectBugCrSearching, setSelectBugCrSearching] = useState(false);
  const selectBugInputRef = useRef<HTMLInputElement>(null);

  // ── Search ─────────────────────────────────────────────────
  const [jiraSearchResults, setJiraSearchResults] = useState<JiraIssue[]>([]);
  const [jiraSearchLoading, setJiraSearchLoading] = useState(false);

  // ── On mount: restore localStorage ───────────────────────
  useEffect(() => {
    setAssignedCrKeys(loadAssignedCrKeys());
    setBugCrKey(loadBugCrKey());
  }, []);

  // ── Auto-focus add CR input when panel opens ──────────────
  useEffect(() => {
    if (showAddCr) setTimeout(() => addCrInputRef.current?.focus(), 50);
  }, [showAddCr]);
  useEffect(() => {
    if (showSelectBugCr) setTimeout(() => selectBugInputRef.current?.focus(), 50);
  }, [showSelectBugCr]);

  // ── Fetch core issues ──────────────────────────────────────
  const fetchIssues = useCallback(async () => {
    if (!creds) return;
    setLoading(true); setError("");
    try {
      const [ar, rr] = await Promise.all([
        fetch("/api/jira/search", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...creds, jql: "assignee = currentUser() AND statusCategory != Done ORDER BY updated DESC", maxResults: 100 }) }),
        fetch("/api/jira/search", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...creds, jql: `${reporterIs(creds)} AND assignee != currentUser() ORDER BY updated DESC`, maxResults: 100 }) }),
      ]);
      const [aData, rData]: [JiraSearchResult, JiraSearchResult] = await Promise.all([ar.json(), rr.json()]);
      if (!ar.ok) throw new Error((aData as unknown as { error: string }).error ?? "Failed");
      if (!rr.ok) throw new Error((rData as unknown as { error: string }).error ?? "Failed");
      setAssigned(aData.issues ?? []);
      setReported(rData.issues ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load issues");
    } finally { setLoading(false); }
  }, [creds]);

  useEffect(() => {
    if (creds) fetchIssues();
    else { setAssigned([]); setReported([]); }
  }, [creds, fetchIssues]);

  // ── Pending From Others + Bugs This Week ─────────────────
  useEffect(() => {
    if (!creds) { setWaitingOnMe([]); setBugsThisWeek([]); return; }
    const pk = creds.defaultProjectKey;

    setWaitingOnMeLoading(true);
    fetch("/api/jira/search", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...creds, jql: `${reporterIs(creds)} AND assignee != currentUser() AND status not in (Closed, Done, Resolved) ORDER BY updated DESC`, maxResults: 50 }) })
      .then(r => r.json()).then(d => setWaitingOnMe(d.issues ?? []))
      .catch(() => setWaitingOnMe([]))
      .finally(() => setWaitingOnMeLoading(false));

    const bugsJql = pk
      ? `project = "${pk}" AND issuetype = Bug AND ${reporterIs(creds)} AND created >= startOfWeek() ORDER BY priority DESC`
      : `issuetype = Bug AND ${reporterIs(creds)} AND created >= startOfWeek() ORDER BY priority DESC`;
    setBugsThisWeekLoading(true);
    fetch("/api/jira/search", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...creds, jql: bugsJql, maxResults: 50 }) })
      .then(r => r.json()).then(d => {
        if (d.errorMessages?.length || d.error) {
          setBugsThisWeekError(d.errorMessages?.[0] ?? d.error ?? "Jira error");
          setBugsThisWeek([]);
        } else {
          setBugsThisWeek(d.issues ?? []);
        }
      })
      .catch(e => setBugsThisWeekError(e?.message ?? "Network error"))
      .finally(() => setBugsThisWeekLoading(false));
  }, [creds]);

  // ── Fetch assigned CR ticket data ──────────────────────────
  useEffect(() => {
    if (!creds || assignedCrKeys.length === 0) { setAssignedCrData({}); return; }
    const missing = assignedCrKeys.filter(k => !assignedCrData[k]);
    if (missing.length === 0) return;
    setAssignedCrLoading(true);
    const jql = `key in (${missing.map(k => `"${k}"`).join(",")})`;
    fetch("/api/jira/search", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...creds, jql, maxResults: 50 }) })
      .then(r => r.json()).then(d => {
        const issues: JiraIssue[] = d.issues ?? [];
        setAssignedCrData(prev => {
          const next = { ...prev };
          issues.forEach(i => { next[i.key] = i; });
          return next;
        });
      })
      .catch(() => {})
      .finally(() => setAssignedCrLoading(false));
  }, [creds, assignedCrKeys]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch children when a CR is expanded in Assigned CR ───
  function toggleAssignedCrExpand(crKey: string) {
    const nowOpen = !assignedCrExpanded[crKey];
    setAssignedCrExpanded(prev => ({ ...prev, [crKey]: nowOpen }));
    if (nowOpen && !assignedCrChildren[crKey] && !assignedCrChildLoading[crKey]) {
      setAssignedCrChildLoading(prev => ({ ...prev, [crKey]: true }));
      fetch("/api/jira/search", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...creds, jql: `parent = "${crKey}" ORDER BY status ASC`, maxResults: 100 }) })
        .then(r => r.json()).then(d => setAssignedCrChildren(prev => ({ ...prev, [crKey]: d.issues ?? [] })))
        .catch(() => setAssignedCrChildren(prev => ({ ...prev, [crKey]: [] })))
        .finally(() => setAssignedCrChildLoading(prev => ({ ...prev, [crKey]: false })));
    }
  }

  function completeCr(crKey: string) {
    const next = assignedCrKeys.filter(k => k !== crKey);
    setAssignedCrKeys(next);
    saveAssignedCrKeys(next);
    setAssignedCrData(prev => { const n = { ...prev }; delete n[crKey]; return n; });
    setAssignedCrChildren(prev => { const n = { ...prev }; delete n[crKey]; return n; });
    setAssignedCrExpanded(prev => { const n = { ...prev }; delete n[crKey]; return n; });
  }

  function addCr(issue: JiraIssue) {
    if (assignedCrKeys.includes(issue.key)) return;
    const next = [...assignedCrKeys, issue.key];
    setAssignedCrKeys(next);
    saveAssignedCrKeys(next);
    setAssignedCrData(prev => ({ ...prev, [issue.key]: issue }));
    setShowAddCr(false);
    setAddCrQuery("");
    setAddCrResults([]);
  }

  // ── Add CR search ─────────────────────────────────────────
  useEffect(() => {
    if (!creds || !showAddCr) return;
    const pk = creds.defaultProjectKey;
    const q = addCrQuery.trim();
    let jql: string;
    if (!q) {
      jql = pk
        ? `project = "${pk}" AND issuetype = Task AND resolution = Unresolved ORDER BY updated DESC`
        : `issuetype = Task AND resolution = Unresolved AND (assignee = currentUser() OR reporter = currentUser()) ORDER BY updated DESC`;
    } else {
      const isKey = /^[A-Za-z]+-\d+$/.test(q);
      const isNum = /^\d+$/.test(q);
      const resolved = isNum && pk ? `${pk}-${q}` : null;
      jql = resolved ? `key = "${resolved}" ORDER BY updated DESC`
          : isKey    ? `key = "${q}" ORDER BY updated DESC`
          : pk       ? `project = "${pk}" AND issuetype = Task AND text ~ "${q}" ORDER BY updated DESC`
          : `issuetype = Task AND text ~ "${q}" ORDER BY updated DESC`;
    }
    const t = setTimeout(() => {
      setAddCrSearching(true);
      fetch("/api/jira/search", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...creds, jql, maxResults: 20 }) })
        .then(r => r.json()).then(d => setAddCrResults(d.issues ?? []))
        .catch(() => setAddCrResults([]))
        .finally(() => setAddCrSearching(false));
    }, q ? 400 : 0);
    return () => clearTimeout(t);
  }, [addCrQuery, showAddCr, creds]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Bug Tickets: fetch CR + children when bugCrKey changes ─
  useEffect(() => {
    if (!creds || !bugCrKey) { setBugCrIssue(null); setBugChildren([]); return; }
    setBugLoading(true);
    Promise.all([
      fetch("/api/jira/search", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...creds, jql: `key = "${bugCrKey}"`, maxResults: 1 }) }).then(r => r.json()),
      fetch("/api/jira/search", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...creds, jql: `parent = "${bugCrKey}" ORDER BY status ASC, priority DESC`, maxResults: 100 }) }).then(r => r.json()),
    ])
      .then(([crData, childData]) => {
        setBugCrIssue((crData.issues ?? [])[0] ?? null);
        setBugChildren(childData.issues ?? []);
      })
      .catch(() => { setBugCrIssue(null); setBugChildren([]); })
      .finally(() => setBugLoading(false));
  }, [creds, bugCrKey]);

  // ── Bug CR selector search ─────────────────────────────────
  useEffect(() => {
    if (!creds || !showSelectBugCr) return;
    const pk = creds.defaultProjectKey;
    const q = selectBugCrQuery.trim();
    let jql: string;
    if (!q) {
      jql = pk
        ? `project = "${pk}" AND issuetype = Task AND resolution = Unresolved ORDER BY updated DESC`
        : `issuetype = Task AND resolution = Unresolved AND (assignee = currentUser() OR reporter = currentUser()) ORDER BY updated DESC`;
    } else {
      const isKey = /^[A-Za-z]+-\d+$/.test(q);
      const isNum = /^\d+$/.test(q);
      const resolved = isNum && pk ? `${pk}-${q}` : null;
      jql = resolved ? `key = "${resolved}" ORDER BY updated DESC`
          : isKey    ? `key = "${q}" ORDER BY updated DESC`
          : pk       ? `project = "${pk}" AND issuetype = Task AND text ~ "${q}" ORDER BY updated DESC`
          : `issuetype = Task AND text ~ "${q}" ORDER BY updated DESC`;
    }
    const t = setTimeout(() => {
      setSelectBugCrSearching(true);
      fetch("/api/jira/search", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...creds, jql, maxResults: 20 }) })
        .then(r => r.json()).then(d => setSelectBugCrResults(d.issues ?? []))
        .catch(() => setSelectBugCrResults([]))
        .finally(() => setSelectBugCrSearching(false));
    }, q ? 400 : 0);
    return () => clearTimeout(t);
  }, [selectBugCrQuery, showSelectBugCr, creds]); // eslint-disable-line react-hooks/exhaustive-deps

  function selectBugCr(issue: JiraIssue) {
    setBugCrKey(issue.key);
    saveBugCrKey(issue.key);
    setShowSelectBugCr(false);
    setSelectBugCrQuery("");
    setSelectBugCrResults([]);
  }

  // ── All Issues section ─────────────────────────────────────
  useEffect(() => {
    if (!search.trim() || search.trim().length < 3 || !creds) {
      setJiraSearchResults([]);
      return;
    }
    setJiraSearchLoading(true);
    const escaped = search.trim().replace(/"/g, '\\"');
    const isId  = /^\d+$/.test(escaped);
    const isKey = /^[A-Za-z]+-\d+$/.test(escaped);
    const resolvedKey = isId && creds?.defaultProjectKey ? `${creds.defaultProjectKey}-${escaped}` : null;
    const jql = resolvedKey ? `key = "${resolvedKey}" ORDER BY updated DESC`
              : isId        ? `id = ${escaped} ORDER BY updated DESC`
              : isKey       ? `key = "${escaped}" ORDER BY updated DESC`
              : `text ~ "${escaped}" ORDER BY updated DESC`;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/jira/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...creds, jql, maxResults: 50 }),
        });
        const data: JiraSearchResult = await res.json();
        setJiraSearchResults(data.issues ?? []);
      } catch {
        setJiraSearchResults([]);
      } finally { setJiraSearchLoading(false); }
    }, 600);
    return () => clearTimeout(timer);
  }, [search, creds]);

  const activeIssues = activeTab === "assigned" ? assigned : reported;
  const allStatuses  = Array.from(new Set(activeIssues.map(i => i.fields.status.name))).sort();
  const filtered = activeIssues
    .filter(i => statusFilter === "all" || i.fields.status.name === statusFilter)
    .sort((a, b) => {
      if (sort === "priority") {
        return (PRIORITY_ORDER[a.fields.priority?.name ?? ""] ?? 99) - (PRIORITY_ORDER[b.fields.priority?.name ?? ""] ?? 99);
      }
      const dA = sort === "updated" ? a.fields.updated : a.fields.created;
      const dB = sort === "updated" ? b.fields.updated : b.fields.created;
      return new Date(dB).getTime() - new Date(dA).getTime();
    });

  const isSearching = search.trim().length > 0;

  // ── Inline search panel (reused for both Add CR and Select Bug CR) ─
  function SearchPanel({
    query, setQuery, results, searching, onPick, inputRef, placeholder,
  }: {
    query: string;
    setQuery: (v: string) => void;
    results: JiraIssue[];
    searching: boolean;
    onPick: (issue: JiraIssue) => void;
    inputRef: React.RefObject<HTMLInputElement | null>;
    placeholder: string;
  }) {
    return (
      <div className="mt-2 border border-slate-700 rounded-xl overflow-hidden bg-slate-950/60">
        <div className="relative">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-8 pr-3 py-2 bg-transparent text-xs text-slate-200 placeholder-slate-600 focus:outline-none border-b border-slate-700"
          />
          {searching && <Loader2 size={11} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-blue-400" />}
        </div>
        <div className="max-h-48 overflow-y-auto">
          {!searching && results.length === 0 && (
            <p className="text-xs text-slate-600 text-center py-4">{query ? "No results" : "Loading…"}</p>
          )}
          {results.map(issue => (
            <button key={issue.id} onClick={() => onPick(issue)}
              className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-slate-800 transition-colors border-b border-slate-800/50 last:border-0">
              <span className="text-xs font-mono text-purple-400 font-bold shrink-0">{issue.key}</span>
              <span className="text-xs text-slate-300 flex-1 line-clamp-1">{issue.fields.summary}</span>
              <span className={clsx("text-xs shrink-0 px-1.5 py-0.5 rounded font-medium", statusChipCls(issue.fields.status.statusCategory.colorName))}>
                {issue.fields.status.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Ticket size={15} className="text-slate-500" />
          <h1 className="text-sm font-semibold text-slate-200">Jira</h1>
        </div>
        {creds && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 hidden sm:block">{creds.email}</span>
            <button onClick={fetchIssues} disabled={loading} aria-label="Refresh" className="p-2 text-slate-500 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors" title="Refresh">
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        )}
      </header>

      <div className="flex-1 px-4 py-4 sm:px-6 sm:py-5 space-y-4 sm:space-y-5">

        {creds?.tokenExpiry && <TokenExpiryBanner expiry={creds.tokenExpiry} onSettingsClick={openSettings} />}

        {!creds && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mb-4 border border-blue-600/30">
              <span className="text-blue-400 text-2xl font-bold">J</span>
            </div>
            <h2 className="text-xl font-semibold text-slate-100 mb-2">Connect to Jira</h2>
            <p className="text-slate-500 text-sm mb-6 max-w-sm">Enter your Jira URL, email, and API token to start tracking your work.</p>
            <button onClick={openSettings} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">Connect Jira</button>
          </div>
        )}

        {creds && loading && assigned.length === 0 && reported.length === 0 && (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={28} className="animate-spin text-blue-500" />
          </div>
        )}

        {error && (
          <div className="bg-red-950/50 border border-red-800 rounded-xl p-4 text-red-400 text-sm">{error}</div>
        )}

        {/* Stats */}
        {creds && (assigned.length > 0 || reported.length > 0) && (
          <StatsBar assigned={assigned} reported={reported} />
        )}

        {/* ── Assigned to Me widget ── */}
        {creds && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Ticket size={14} className="text-blue-400" />
              <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Assigned to Me</p>
              {!loading && assigned.length > 0 && (
                <span className="text-xs bg-blue-900/40 text-blue-300 border border-blue-800/50 px-1.5 py-0.5 rounded-full font-semibold">{assigned.length}</span>
              )}
            </div>
            {loading && assigned.length === 0 ? (
              <div className="flex items-center justify-center py-6 text-slate-600 text-sm"><Loader2 size={16} className="animate-spin mr-2" />Loading…</div>
            ) : assigned.length === 0 ? (
              <p className="text-sm text-slate-600 py-4 text-center">No open tickets assigned</p>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-0.5">
                {assigned.map(issue => (
                  <div key={issue.id}
                    onClick={() => setSelectedKey(issue.key)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/40 hover:bg-slate-800 transition-colors cursor-pointer">
                    <span className="text-xs font-mono text-blue-400 font-bold shrink-0">{issue.key}</span>
                    <span className="text-xs text-slate-200 flex-1 truncate">{issue.fields.summary}</span>
                    <span className={clsx("text-xs px-1.5 py-0.5 rounded border font-medium shrink-0", statusChipCls(issue.fields.status.statusCategory?.colorName ?? ""))}>
                      {issue.fields.status.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Insights grid ── */}
        {creds && (
          <div className="space-y-4">

            {/* Row 1: Bug Tickets + Waiting on Me */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              {/* ── Bug Tickets ── */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Bug size={14} className="text-red-400" />
                    <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Bug Tickets</p>
                    {!bugLoading && bugCrIssue && bugChildren.length > 0 && (
                      <span className="text-xs bg-red-900/40 text-red-300 border border-red-800/50 px-1.5 py-0.5 rounded-full font-semibold">{bugChildren.length}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {bugLoading && <Loader2 size={13} className="animate-spin text-red-400" />}
                    <button
                      onClick={() => setShowSelectBugCr(v => !v)}
                      className={clsx("text-xs px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1",
                        showSelectBugCr ? "bg-slate-700 border-slate-600 text-slate-200" : "border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600"
                      )}
                    >
                      <Search size={11} />{bugCrKey ? "Change CR" : "Select CR"}
                    </button>
                    {bugCrKey && (
                      <button onClick={() => { setBugCrKey(null); saveBugCrKey(null); setBugCrIssue(null); setBugChildren([]); }}
                        className="text-slate-600 hover:text-slate-400 p-0.5" title="Clear selection">
                        <X size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* CR selector panel */}
                {showSelectBugCr && SearchPanel({
                  query: selectBugCrQuery, setQuery: setSelectBugCrQuery,
                  results: selectBugCrResults, searching: selectBugCrSearching,
                  onPick: selectBugCr, inputRef: selectBugInputRef,
                  placeholder: "Search CR by key or text…",
                })}

                {!showSelectBugCr && !bugCrKey && (
                  <div className="flex flex-col items-center py-8 text-slate-600 text-sm">
                    <BookOpen size={20} className="mb-2 opacity-40" />
                    <p>No CR selected</p>
                    <p className="text-xs mt-1 text-slate-700">Click "Select CR" above to view its bug tickets</p>
                  </div>
                )}

                {!showSelectBugCr && bugCrKey && (
                  <>
                    {/* Selected CR chip */}
                    {bugCrIssue && (
                      <div className="flex items-center gap-2 mb-2 px-2 py-1.5 bg-slate-800/60 rounded-lg">
                        <span className="text-xs font-mono text-purple-400 font-bold shrink-0">{bugCrIssue.key}</span>
                        <span className="text-xs text-slate-300 flex-1 line-clamp-1">{bugCrIssue.fields.summary}</span>
                        <span className={clsx("text-xs shrink-0 px-1.5 py-0.5 rounded font-medium", statusChipCls(bugCrIssue.fields.status.statusCategory.colorName))}>
                          {bugCrIssue.fields.status.name}
                        </span>
                      </div>
                    )}
                    {bugLoading ? (
                      <div className="flex items-center justify-center py-6 text-slate-600 text-sm"><Loader2 size={16} className="animate-spin mr-2" />Loading…</div>
                    ) : bugChildren.length === 0 ? (
                      <div className="flex flex-col items-center py-6 text-slate-600 text-sm"><Bug size={18} className="mb-2 opacity-40" />No child tickets found</div>
                    ) : (
                      <div className="space-y-1 max-h-64 overflow-y-auto pr-0.5 mt-1">
                        {bugChildren.map(child => {
                          const pName = child.fields.priority?.name ?? "";
                          const pColor = pName === "Highest" || pName === "Critical" ? "text-red-400" :
                                         pName === "High" ? "text-orange-400" :
                                         pName === "Medium" ? "text-yellow-400" : "text-slate-500";
                          const typeName = child.fields.issuetype?.name ?? "";
                          return (
                            <button key={child.id} onClick={() => setSelectedKey(child.key)}
                              className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-800 transition-colors group">
                              <span className={clsx("text-[9px] shrink-0 font-bold", pColor)}>●</span>
                              <span className="text-xs font-mono text-slate-400 shrink-0 group-hover:text-slate-300">{child.key}</span>
                              {typeName && typeName !== "Bug" && (
                                <span className="text-[9px] text-slate-600 shrink-0 bg-slate-800 px-1 rounded">{typeName}</span>
                              )}
                              <span className="text-xs text-slate-400 flex-1 line-clamp-1 group-hover:text-slate-200">{child.fields.summary}</span>
                              <span className={clsx("text-xs shrink-0 px-1.5 py-0.5 rounded font-medium", statusChipCls(child.fields.status.statusCategory.colorName))}>
                                {child.fields.status.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* ── Pending From Others ── */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <UserCheck size={14} className="text-sky-400" />
                    <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Pending From Others</p>
                    {!waitingOnMeLoading && waitingOnMe.length > 0 && (
                      <span className="text-xs bg-sky-900/40 text-sky-300 border border-sky-700/50 px-1.5 py-0.5 rounded-full font-semibold">{waitingOnMe.length}</span>
                    )}
                  </div>
                  {waitingOnMeLoading && <Loader2 size={13} className="animate-spin text-sky-400" />}
                </div>
                {waitingOnMeLoading && waitingOnMe.length === 0 ? (
                  <div className="flex items-center justify-center py-8 text-slate-600 text-sm"><Loader2 size={16} className="animate-spin mr-2" />Loading…</div>
                ) : waitingOnMe.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-slate-600 text-sm"><UserCheck size={20} className="mb-2 opacity-40" />No pending tickets</div>
                ) : (
                  <div className="space-y-1.5 max-h-64 overflow-y-auto pr-0.5">
                    {waitingOnMe.map(issue => (
                      <button key={issue.id} onClick={() => setSelectedKey(issue.key)}
                        className="w-full text-left flex items-start gap-2.5 px-2.5 py-2 rounded-lg hover:bg-slate-800 transition-colors group">
                        <span className="text-xs font-mono text-sky-400 font-bold shrink-0 mt-0.5">{issue.key}</span>
                        <span className="text-xs text-slate-300 flex-1 line-clamp-1 group-hover:text-slate-100">{issue.fields.summary}</span>
                        <div className="flex items-center gap-1.5 shrink-0 ml-1">
                          {issue.fields.assignee && (
                            <span className="text-xs text-slate-500 max-w-[80px] truncate" title={issue.fields.assignee.displayName}>
                              {issue.fields.assignee.displayName.split(" ")[0]}
                            </span>
                          )}
                          <span className="text-xs px-1.5 py-0.5 rounded bg-blue-950/50 text-blue-300 font-medium">{issue.fields.status.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Bugs Raised This Week (full width) ── */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Bug size={14} className="text-orange-400" />
                  <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Bugs Raised This Week</p>
                  {!bugsThisWeekLoading && bugsThisWeek.length > 0 && (
                    <span className="text-xs bg-orange-900/40 text-orange-300 border border-orange-800/50 px-1.5 py-0.5 rounded-full font-semibold">{bugsThisWeek.length}</span>
                  )}
                </div>
                {bugsThisWeekLoading && <Loader2 size={13} className="animate-spin text-orange-400" />}
              </div>
              {bugsThisWeekLoading && bugsThisWeek.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-slate-600 text-sm"><Loader2 size={16} className="animate-spin mr-2" />Loading…</div>
              ) : bugsThisWeekError ? (
                <div className="flex flex-col items-center py-6 text-center px-3">
                  <p className="text-xs text-red-400 font-medium mb-1">Jira query failed</p>
                  <p className="text-xs text-slate-600 break-all">{bugsThisWeekError}</p>
                </div>
              ) : bugsThisWeek.length === 0 ? (
                <div className="flex flex-col items-center py-6 text-slate-600 text-sm"><Bug size={20} className="mb-2 opacity-40" />No bugs raised this week</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-0.5">
                  {bugsThisWeek.map(issue => {
                    const pName = issue.fields.priority?.name ?? "";
                    const pColor = pName === "Highest" || pName === "Critical" ? "text-red-400" :
                                   pName === "High" ? "text-orange-400" :
                                   pName === "Medium" ? "text-yellow-400" : "text-slate-400";
                    return (
                      <button key={issue.id} onClick={() => setSelectedKey(issue.key)}
                        className="w-full text-left flex items-start gap-2.5 px-2.5 py-2 rounded-lg hover:bg-slate-800 transition-colors group">
                        <span className={clsx("text-xs shrink-0 mt-0.5 font-bold", pColor)}>●</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-mono text-red-400 mr-1.5">{issue.key}</span>
                          <span className="text-xs text-slate-300 group-hover:text-slate-100 line-clamp-1">{issue.fields.summary}</span>
                        </div>
                        <span className={clsx("text-xs shrink-0 px-1.5 py-0.5 rounded font-medium",
                          issue.fields.status.statusCategory.colorName === "green" ? "bg-green-950/50 text-green-300" :
                          issue.fields.status.statusCategory.colorName === "yellow" ? "bg-amber-950/60 text-amber-300" :
                          "bg-slate-800 text-slate-400"
                        )}>{issue.fields.status.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Assigned CR (full width) ── */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Layers size={14} className="text-indigo-400" />
                  <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Assigned CR</p>
                  {assignedCrKeys.length > 0 && (
                    <span className="text-xs bg-indigo-900/40 text-indigo-300 border border-indigo-800/50 px-1.5 py-0.5 rounded-full font-semibold">{assignedCrKeys.length}</span>
                  )}
                  {assignedCrLoading && <Loader2 size={13} className="animate-spin text-indigo-400" />}
                </div>
                <button
                  onClick={() => setShowAddCr(v => !v)}
                  className={clsx("flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border transition-colors",
                    showAddCr ? "bg-slate-700 border-slate-600 text-slate-200" : "border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600"
                  )}
                  title="Add a CR ticket to track"
                >
                  <Plus size={12} />Add CR
                </button>
              </div>

              {/* Add CR search panel */}
              {showAddCr && SearchPanel({
                query: addCrQuery, setQuery: setAddCrQuery,
                results: addCrResults.filter(r => !assignedCrKeys.includes(r.key)),
                searching: addCrSearching,
                onPick: addCr, inputRef: addCrInputRef,
                placeholder: "Search CR by key or text…",
              })}

              {/* Empty state */}
              {!showAddCr && assignedCrKeys.length === 0 && (
                <div className="flex flex-col items-center py-8 text-slate-600 text-sm">
                  <Layers size={20} className="mb-2 opacity-40" />
                  <p>No CRs tracked yet</p>
                  <p className="text-xs mt-1 text-slate-700">Click "Add CR" to start tracking a change request</p>
                </div>
              )}

              {/* CR list */}
              {assignedCrKeys.length > 0 && (
                <div className={clsx("space-y-2 max-h-[480px] overflow-y-auto pr-0.5", showAddCr && "mt-2")}>
                  {assignedCrKeys.map(crKey => {
                    const cr = assignedCrData[crKey];
                    const isOpen = assignedCrExpanded[crKey] === true;
                    const children = assignedCrChildren[crKey];
                    const childLoading = assignedCrChildLoading[crKey];
                    const statusCounts = children?.reduce<Record<string, number>>((acc, c) => {
                      const s = c.fields.status.name; acc[s] = (acc[s] ?? 0) + 1; return acc;
                    }, {}) ?? {};

                    return (
                      <div key={crKey} className="border border-slate-800 rounded-lg overflow-hidden">
                        {/* Header row */}
                        <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-800/60 hover:bg-slate-800 transition-colors">
                          {/* Expand toggle */}
                          <button
                            onClick={() => toggleAssignedCrExpand(crKey)}
                            className="shrink-0 text-slate-500 hover:text-slate-300"
                            aria-label={isOpen ? "Collapse" : "Expand"}
                          >
                            {childLoading
                              ? <Loader2 size={13} className="animate-spin text-indigo-400" />
                              : isOpen
                                ? <ChevronDown size={13} />
                                : <ChevronRight size={13} />
                            }
                          </button>

                          {/* Key + summary */}
                          <span className="text-xs font-mono text-indigo-400 font-bold shrink-0">{crKey}</span>
                          {cr ? (
                            <>
                              <span className="text-xs text-slate-200 font-medium flex-1 line-clamp-1">{cr.fields.summary}</span>
                              {/* Status chips */}
                              {Object.keys(statusCounts).length > 0 && (
                                <div className="flex items-center gap-1 shrink-0 flex-wrap">
                                  {Object.entries(statusCounts).map(([s, n]) => (
                                    <span key={s} className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-400 font-medium">{n} {s}</span>
                                  ))}
                                </div>
                              )}
                              <span className={clsx("text-xs shrink-0 px-1.5 py-0.5 rounded font-medium", statusChipCls(cr.fields.status.statusCategory.colorName))}>
                                {cr.fields.status.name}
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-slate-600 flex-1 italic">Loading…</span>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-1 shrink-0 ml-1">
                            <button
                              onClick={e => { e.stopPropagation(); setSelectedKey(crKey); }}
                              className="text-xs text-indigo-400 hover:text-indigo-200 px-1.5 py-0.5 rounded hover:bg-indigo-950/40 transition-colors"
                            >
                              View
                            </button>
                            <button
                              onClick={() => completeCr(crKey)}
                              title="Mark as complete and remove from list"
                              className="flex items-center gap-0.5 text-xs text-green-500 hover:text-green-300 px-1.5 py-0.5 rounded hover:bg-green-950/40 transition-colors"
                            >
                              <CheckCheck size={11} />Done
                            </button>
                          </div>
                        </div>

                        {/* Children */}
                        {isOpen && (
                          <div className="divide-y divide-slate-800/60">
                            {childLoading && !children && (
                              <div className="flex items-center justify-center py-4 text-slate-600 text-xs">
                                <Loader2 size={13} className="animate-spin mr-1.5" />Loading tickets…
                              </div>
                            )}
                            {children?.length === 0 && !childLoading && (
                              <p className="text-xs text-slate-700 text-center py-3">No child tickets</p>
                            )}
                            {children?.map(child => {
                              const pName = child.fields.priority?.name ?? "";
                              const pColor = pName === "Highest" || pName === "Critical" ? "text-red-400" :
                                             pName === "High" ? "text-orange-400" :
                                             pName === "Medium" ? "text-yellow-400" : "text-slate-500";
                              return (
                                <button key={child.id} onClick={() => setSelectedKey(child.key)}
                                  className="w-full text-left flex items-center gap-2.5 px-3 py-2 hover:bg-slate-800/50 transition-colors group">
                                  <span className={clsx("text-[9px] shrink-0 font-bold", pColor)}>●</span>
                                  <span className="text-xs font-mono text-slate-400 shrink-0 group-hover:text-slate-300">{child.key}</span>
                                  <span className="text-xs text-slate-400 flex-1 line-clamp-1 group-hover:text-slate-200">{child.fields.summary}</span>
                                  <span className={clsx("text-xs shrink-0 px-1.5 py-0.5 rounded font-medium",
                                    statusChipCls(child.fields.status.statusCategory.colorName)
                                  )}>{child.fields.status.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ── All Jira Issues ── */}
        {creds && (assigned.length > 0 || reported.length > 0) && (
          <>
            <div className="border-t border-slate-800 pt-5">
              <p className="text-xs text-slate-600 uppercase tracking-wider font-semibold mb-3">All Issues</p>
            </div>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search all Jira tickets…"
                className="w-full px-3 py-2 pr-8 border border-slate-700 rounded-lg text-sm bg-slate-900 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              {search && (
                <button onClick={() => setSearch("")} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  <X size={14} />
                </button>
              )}
            </div>

            {isSearching ? (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                    Search Results{!jiraSearchLoading && <span className="ml-1.5 text-slate-600">({jiraSearchResults.length})</span>}
                  </p>
                  {jiraSearchLoading && <Loader2 size={12} className="animate-spin text-blue-400" />}
                </div>
                {jiraSearchLoading && jiraSearchResults.length === 0 ? (
                  <div className="flex items-center justify-center py-10 text-slate-600">
                    <Loader2 size={20} className="animate-spin mr-2" /> Searching…
                  </div>
                ) : jiraSearchResults.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-slate-600">
                    <SearchX size={28} className="mb-2" />
                    <p className="text-sm">No tickets found</p>
                  </div>
                ) : (
                  <div className="grid gap-2 pb-6">
                    {jiraSearchResults.map(issue => (
                      <IssueCard key={issue.id} issue={issue} baseUrl={creds.baseUrl} onClick={() => setSelectedKey(issue.key)} onParentClick={key => setSelectedKey(key)} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 bg-slate-900 rounded-xl p-1 border border-slate-800">
                    {(["assigned", "reported"] as Tab[]).map(tab => (
                      <button key={tab} onClick={() => { setActiveTab(tab); setStatusFilter("all"); }}
                        className={clsx("px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                          activeTab === tab ? "bg-slate-700 text-slate-100 shadow-sm" : "text-slate-500 hover:text-slate-300")}>
                        {tab === "assigned" ? "Assigned" : "Reported"}
                        <span className="ml-2 text-xs opacity-50">{tab === "assigned" ? assigned.length : reported.length}</span>
                      </button>
                    ))}
                  </div>
                  <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-900 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600">
                    <option value="all">All statuses</option>
                    {allStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select value={sort} onChange={e => setSort(e.target.value as SortKey)}
                    className="px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-900 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600">
                    <option value="updated">Sort: Last updated</option>
                    <option value="created">Sort: Created</option>
                    <option value="priority">Sort: Priority</option>
                  </select>
                </div>

                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center py-16 text-slate-600">
                    <SearchX size={32} className="mb-2" />
                    <p className="text-sm">No issues match your filters</p>
                  </div>
                ) : (
                  <div className="grid gap-2 pb-6">
                    {filtered.map(issue => (
                      <IssueCard key={issue.id} issue={issue} baseUrl={creds.baseUrl} onClick={() => setSelectedKey(issue.key)} onParentClick={key => setSelectedKey(key)} />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

      </div>

      {selectedKey && creds && (
        <IssueDrawer issueKey={selectedKey} creds={creds} onClose={() => setSelectedKey(null)} />
      )}
    </div>
  );
}
