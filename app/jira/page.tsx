"use client";
import { useEffect, useState, useCallback } from "react";
import {
  RefreshCw, Loader2, SearchX, Layers, UserCheck, Bug,
  ChevronDown, ChevronRight, X, Ticket,
} from "lucide-react";
import {
  JiraIssue, JiraSearchResult,
} from "@/lib/jira";
import { useApp } from "@/components/AppShell";
import IssueCard from "@/components/IssueCard";
import IssueDrawer from "@/components/IssueDrawer";
import StatsBar from "@/components/StatsBar";
import TokenExpiryBanner from "@/components/TokenExpiryBanner";
import clsx from "clsx";

type Tab = "assigned" | "reported";
type SortKey = "updated" | "created" | "priority";
const PRIORITY_ORDER: Record<string, number> = { Highest: 0, Critical: 0, High: 1, Medium: 2, Low: 3, Lowest: 4 };

function statusChipCls(colorName: string) {
  if (colorName === "green")     return "bg-green-950/50 text-green-300";
  if (colorName === "yellow")    return "bg-amber-950/60 text-amber-300";
  if (colorName === "blue-grey") return "bg-slate-700 text-slate-300";
  return "bg-blue-950/50 text-blue-300";
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

  // ── Insights ───────────────────────────────────────────────
  const [crTickets, setCrTickets]               = useState<JiraIssue[]>([]);
  const [crTicketsLoading, setCrTicketsLoading] = useState(false);
  const [waitingOnMe, setWaitingOnMe]               = useState<JiraIssue[]>([]);
  const [waitingOnMeLoading, setWaitingOnMeLoading] = useState(false);
  const [bugsThisWeek, setBugsThisWeek]               = useState<JiraIssue[]>([]);
  const [bugsThisWeekLoading, setBugsThisWeekLoading] = useState(false);
  const [crChildren, setCrChildren]               = useState<JiraIssue[]>([]);
  const [crChildrenLoading, setCrChildrenLoading] = useState(false);
  const [crExpanded, setCrExpanded]               = useState<Record<string, boolean>>({});

  // ── Search ─────────────────────────────────────────────────
  const [jiraSearchResults, setJiraSearchResults] = useState<JiraIssue[]>([]);
  const [jiraSearchLoading, setJiraSearchLoading] = useState(false);

  // ── Fetches ────────────────────────────────────────────────
  const fetchIssues = useCallback(async () => {
    if (!creds) return;
    setLoading(true); setError("");
    try {
      const [ar, rr] = await Promise.all([
        fetch("/api/jira/search", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...creds, jql: "assignee = currentUser() ORDER BY updated DESC", maxResults: 100 }) }),
        fetch("/api/jira/search", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...creds, jql: "reporter = currentUser() AND assignee != currentUser() ORDER BY updated DESC", maxResults: 100 }) }),
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

  useEffect(() => {
    if (!creds) {
      setCrTickets([]); setWaitingOnMe([]); setBugsThisWeek([]);
      return;
    }
    const pk = creds.defaultProjectKey;

    const crJql = pk
      ? `project = "${pk}" AND issuetype = Task AND resolution = Unresolved ORDER BY updated DESC`
      : `issuetype = Task AND resolution = Unresolved AND (assignee = currentUser() OR reporter = currentUser()) ORDER BY updated DESC`;
    setCrTicketsLoading(true);
    fetch("/api/jira/search", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...creds, jql: crJql, maxResults: 50 }) })
      .then(r => r.json()).then(d => setCrTickets(d.issues ?? []))
      .catch(() => setCrTickets([]))
      .finally(() => setCrTicketsLoading(false));

    setWaitingOnMeLoading(true);
    fetch("/api/jira/search", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...creds, jql: `assignee = currentUser() AND statusCategory = "In Progress" ORDER BY updated ASC`, maxResults: 50 }) })
      .then(r => r.json()).then(d => setWaitingOnMe(d.issues ?? []))
      .catch(() => setWaitingOnMe([]))
      .finally(() => setWaitingOnMeLoading(false));

    const bugsJql = pk
      ? `project = "${pk}" AND issuetype = Bug AND created >= startOfWeek() ORDER BY priority DESC`
      : `issuetype = Bug AND created >= startOfWeek() AND (assignee = currentUser() OR reporter = currentUser()) ORDER BY priority DESC`;
    setBugsThisWeekLoading(true);
    fetch("/api/jira/search", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...creds, jql: bugsJql, maxResults: 50 }) })
      .then(r => r.json()).then(d => setBugsThisWeek(d.issues ?? []))
      .catch(() => setBugsThisWeek([]))
      .finally(() => setBugsThisWeekLoading(false));
  }, [creds]);

  useEffect(() => {
    if (!creds || crTickets.length === 0) { setCrChildren([]); return; }
    const keys = crTickets.map(t => `"${t.key}"`).join(",");
    setCrChildrenLoading(true);
    fetch("/api/jira/search", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...creds, jql: `parent in (${keys}) ORDER BY status ASC`, maxResults: 200 }) })
      .then(r => r.json()).then(d => {
        const issues: JiraIssue[] = d.issues ?? [];
        setCrChildren(issues);
        const expanded: Record<string, boolean> = {};
        crTickets.forEach(cr => { expanded[cr.key] = false; }); // collapsed by default
        setCrExpanded(prev => ({ ...expanded, ...prev }));
      })
      .catch(() => setCrChildren([]))
      .finally(() => setCrChildrenLoading(false));
  }, [creds, crTickets]);

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

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-6 h-14 flex items-center justify-between">
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

      <div className="flex-1 px-6 py-5 space-y-5">

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

        {/* ── Insights grid ── */}
        {creds && (
          <div className="space-y-4">

            {/* Row: CR Tickets + Waiting on Me */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              {/* CR Tickets */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Layers size={14} className="text-purple-400" />
                    <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Open CR Tickets</p>
                    {!crTicketsLoading && crTickets.length > 0 && (
                      <span className="text-xs bg-purple-900/40 text-purple-300 border border-purple-800/50 px-1.5 py-0.5 rounded-full font-semibold">{crTickets.length}</span>
                    )}
                  </div>
                  {crTicketsLoading && <Loader2 size={13} className="animate-spin text-purple-400" />}
                </div>
                {crTicketsLoading && crTickets.length === 0 ? (
                  <div className="flex items-center justify-center py-8 text-slate-600 text-sm"><Loader2 size={16} className="animate-spin mr-2" />Loading…</div>
                ) : crTickets.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-slate-600 text-sm"><Layers size={20} className="mb-2 opacity-40" />No open CR tickets</div>
                ) : (
                  <div className="space-y-1.5 max-h-64 overflow-y-auto pr-0.5">
                    {crTickets.map(issue => (
                      <button key={issue.id} onClick={() => setSelectedKey(issue.key)}
                        className="w-full text-left flex items-start gap-2.5 px-2.5 py-2 rounded-lg hover:bg-slate-800 transition-colors group">
                        <span className="text-[10px] font-mono text-purple-400 font-bold shrink-0 mt-0.5">{issue.key}</span>
                        <span className="text-xs text-slate-300 flex-1 line-clamp-1 group-hover:text-slate-100">{issue.fields.summary}</span>
                        <span className={clsx("text-[10px] shrink-0 px-1.5 py-0.5 rounded font-medium", statusChipCls(issue.fields.status.statusCategory.colorName))}>{issue.fields.status.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Waiting on Me */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <UserCheck size={14} className="text-sky-400" />
                    <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Waiting on Me</p>
                    {!waitingOnMeLoading && waitingOnMe.length > 0 && (
                      <span className="text-xs bg-sky-900/40 text-sky-300 border border-sky-700/50 px-1.5 py-0.5 rounded-full font-semibold">{waitingOnMe.length}</span>
                    )}
                  </div>
                  {waitingOnMeLoading && <Loader2 size={13} className="animate-spin text-sky-400" />}
                </div>
                {waitingOnMeLoading && waitingOnMe.length === 0 ? (
                  <div className="flex items-center justify-center py-8 text-slate-600 text-sm"><Loader2 size={16} className="animate-spin mr-2" />Loading…</div>
                ) : waitingOnMe.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-slate-600 text-sm"><UserCheck size={20} className="mb-2 opacity-40" />Nothing in progress for you</div>
                ) : (
                  <div className="space-y-1.5 max-h-64 overflow-y-auto pr-0.5">
                    {waitingOnMe.map(issue => (
                      <button key={issue.id} onClick={() => setSelectedKey(issue.key)}
                        className="w-full text-left flex items-start gap-2.5 px-2.5 py-2 rounded-lg hover:bg-slate-800 transition-colors group">
                        <span className="text-[10px] font-mono text-sky-400 font-bold shrink-0 mt-0.5">{issue.key}</span>
                        <span className="text-xs text-slate-300 flex-1 line-clamp-1 group-hover:text-slate-100">{issue.fields.summary}</span>
                        <span className="text-[10px] shrink-0 px-1.5 py-0.5 rounded bg-blue-950/50 text-blue-300 font-medium">{issue.fields.status.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bugs This Week */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Bug size={14} className="text-red-400" />
                  <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Bugs Raised This Week</p>
                  {!bugsThisWeekLoading && bugsThisWeek.length > 0 && (
                    <span className="text-xs bg-red-900/40 text-red-300 border border-red-800/50 px-1.5 py-0.5 rounded-full font-semibold">{bugsThisWeek.length}</span>
                  )}
                </div>
                {bugsThisWeekLoading && <Loader2 size={13} className="animate-spin text-red-400" />}
              </div>
              {bugsThisWeekLoading && bugsThisWeek.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-slate-600 text-sm"><Loader2 size={16} className="animate-spin mr-2" />Loading…</div>
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
                        <span className={clsx("text-[10px] shrink-0 mt-0.5 font-bold", pColor)}>●</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-mono text-red-400 mr-1.5">{issue.key}</span>
                          <span className="text-xs text-slate-300 group-hover:text-slate-100 line-clamp-1">{issue.fields.summary}</span>
                        </div>
                        <span className={clsx("text-[10px] shrink-0 px-1.5 py-0.5 rounded font-medium",
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

            {/* CR Children */}
            {(crChildrenLoading || crChildren.length > 0) && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Layers size={14} className="text-indigo-400" />
                    <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">CR Children</p>
                    {!crChildrenLoading && crChildren.length > 0 && (
                      <span className="text-xs bg-indigo-900/40 text-indigo-300 border border-indigo-800/50 px-1.5 py-0.5 rounded-full font-semibold">{crChildren.length}</span>
                    )}
                  </div>
                  {crChildrenLoading && <Loader2 size={13} className="animate-spin text-indigo-400" />}
                </div>
                {crChildrenLoading && crChildren.length === 0 ? (
                  <div className="flex items-center justify-center py-8 text-slate-600 text-sm"><Loader2 size={16} className="animate-spin mr-2" />Loading…</div>
                ) : (
                  <div className="space-y-2 max-h-[480px] overflow-y-auto pr-0.5">
                    {crTickets.map(cr => {
                      const children = crChildren.filter(c => c.fields.parent?.key === cr.key);
                      if (children.length === 0) return null;
                      const isOpen = crExpanded[cr.key] === true;
                      const statusCounts = children.reduce<Record<string, number>>((acc, c) => {
                        const s = c.fields.status.name; acc[s] = (acc[s] ?? 0) + 1; return acc;
                      }, {});
                      return (
                        <div key={cr.key} className="border border-slate-800 rounded-lg overflow-hidden">
                          <div
                            className="w-full flex items-center gap-2 px-3 py-2.5 bg-slate-800/60 hover:bg-slate-800 transition-colors cursor-pointer select-none"
                            onClick={() => setCrExpanded(prev => ({ ...prev, [cr.key]: !isOpen }))}>
                            {isOpen
                              ? <ChevronDown size={13} className="text-slate-500 shrink-0" />
                              : <ChevronRight size={13} className="text-slate-500 shrink-0" />}
                            <span className="text-[10px] font-mono text-indigo-400 font-bold shrink-0">{cr.key}</span>
                            <span className="text-xs text-slate-200 font-medium flex-1 line-clamp-1">{cr.fields.summary}</span>
                            <div className="flex items-center gap-1 shrink-0 flex-wrap">
                              {Object.entries(statusCounts).map(([s, n]) => (
                                <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-400 font-medium">{n} {s}</span>
                              ))}
                            </div>
                            <button
                              onClick={e => { e.stopPropagation(); setSelectedKey(cr.key); }}
                              className="ml-1 text-[10px] text-indigo-400 hover:text-indigo-200 shrink-0 px-1.5 py-0.5 rounded hover:bg-indigo-950/40">
                              View CR
                            </button>
                          </div>
                          {isOpen && (
                            <div className="divide-y divide-slate-800/60">
                              {children.map(child => {
                                const pName = child.fields.priority?.name ?? "";
                                const pColor = pName === "Highest" || pName === "Critical" ? "text-red-400" :
                                               pName === "High" ? "text-orange-400" :
                                               pName === "Medium" ? "text-yellow-400" : "text-slate-500";
                                return (
                                  <button key={child.id} onClick={() => setSelectedKey(child.key)}
                                    className="w-full text-left flex items-center gap-2.5 px-3 py-2 hover:bg-slate-800/50 transition-colors group">
                                    <span className={clsx("text-[9px] shrink-0 font-bold", pColor)}>●</span>
                                    <span className="text-[10px] font-mono text-slate-400 shrink-0 group-hover:text-slate-300">{child.key}</span>
                                    <span className="text-xs text-slate-400 flex-1 line-clamp-1 group-hover:text-slate-200">{child.fields.summary}</span>
                                    <span className={clsx("text-[10px] shrink-0 px-1.5 py-0.5 rounded font-medium",
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
            )}

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
