"use client";
import { useEffect, useState, useCallback } from "react";
import { RefreshCw, Loader2, SearchX } from "lucide-react";
import {
  JiraIssue, JiraSearchResult,
} from "@/lib/jira";
import { useApp } from "@/components/AppShell";
import IssueCard from "@/components/IssueCard";
import IssueDrawer from "@/components/IssueDrawer";
import StatsBar from "@/components/StatsBar";
import TokenExpiryBanner from "@/components/TokenExpiryBanner";

type Tab = "assigned" | "reported";
type SortKey = "updated" | "created" | "priority";

const PRIORITY_ORDER: Record<string, number> = {
  Highest: 0, Critical: 0, High: 1, Medium: 2, Low: 3, Lowest: 4,
};

export default function Dashboard() {
  const { creds, openSettings } = useApp();
  const [assigned, setAssigned] = useState<JiraIssue[]>([]);
  const [reported, setReported] = useState<JiraIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("assigned");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("updated");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchIssues = useCallback(async () => {
    if (!creds) return;
    setLoading(true);
    setError("");
    try {
      const [assignedRes, reportedRes] = await Promise.all([
        fetch("/api/jira/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...creds,
            jql: "assignee = currentUser() ORDER BY updated DESC",
            maxResults: 100,
          }),
        }),
        fetch("/api/jira/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...creds,
            jql: "reporter = currentUser() AND assignee != currentUser() ORDER BY updated DESC",
            maxResults: 100,
          }),
        }),
      ]);

      const [aData, rData]: [JiraSearchResult, JiraSearchResult] = await Promise.all([
        assignedRes.json(),
        reportedRes.json(),
      ]);

      if (!assignedRes.ok) throw new Error((aData as unknown as { error: string }).error ?? "Failed to load assigned issues");
      if (!reportedRes.ok) throw new Error((rData as unknown as { error: string }).error ?? "Failed to load reported issues");

      setAssigned(aData.issues ?? []);
      setReported(rData.issues ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load issues");
    } finally {
      setLoading(false);
    }
  }, [creds]);

  useEffect(() => {
    if (creds) fetchIssues();
    else {
      setAssigned([]);
      setReported([]);
    }
  }, [creds, fetchIssues]);

  const activeIssues = activeTab === "assigned" ? assigned : reported;

  const allStatuses = Array.from(
    new Set(activeIssues.map((i) => i.fields.status.name))
  ).sort();

  const filtered = activeIssues
    .filter((i) => {
      const q = search.toLowerCase();
      return (
        (!q || i.fields.summary.toLowerCase().includes(q) || i.key.toLowerCase().includes(q)) &&
        (statusFilter === "all" || i.fields.status.name === statusFilter)
      );
    })
    .sort((a, b) => {
      if (sort === "priority") {
        const pa = PRIORITY_ORDER[a.fields.priority?.name ?? ""] ?? 99;
        const pb = PRIORITY_ORDER[b.fields.priority?.name ?? ""] ?? 99;
        return pa - pb;
      }
      const dateA = sort === "updated" ? a.fields.updated : a.fields.created;
      const dateB = sort === "updated" ? b.fields.updated : b.fields.created;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

  return (
    <div className="flex flex-col min-h-full">
      {/* Page header */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-6 h-14 flex items-center justify-between">
        <h1 className="text-sm font-semibold text-slate-200">Jira Dashboard</h1>
        <div className="flex items-center gap-2">
          {creds && (
            <span className="text-xs text-slate-500 hidden sm:block">{creds.email}</span>
          )}
          {creds && (
            <button
              onClick={fetchIssues}
              disabled={loading}
              className="p-2 text-slate-500 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 px-6 py-5 space-y-5">
        {/* Token expiry banner */}
        {creds?.tokenExpiry && (
          <TokenExpiryBanner expiry={creds.tokenExpiry} onSettingsClick={openSettings} />
        )}

        {/* Not connected */}
        {!creds && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mb-4 border border-blue-600/30">
              <span className="text-blue-400 text-2xl font-bold">J</span>
            </div>
            <h2 className="text-xl font-semibold text-slate-100 mb-2">Connect to Jira</h2>
            <p className="text-slate-500 text-sm mb-6 max-w-sm">
              Enter your Jira URL, email, and API token to start tracking your QA work.
            </p>
            <button
              onClick={openSettings}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              Connect Jira
            </button>
          </div>
        )}

        {/* Loading */}
        {creds && loading && assigned.length === 0 && reported.length === 0 && (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={28} className="animate-spin text-blue-500" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-950/50 border border-red-800 rounded-xl p-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Dashboard content */}
        {creds && (assigned.length > 0 || reported.length > 0) && (
          <>
            <StatsBar assigned={assigned} reported={reported} />

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-slate-900 rounded-xl p-1 w-fit border border-slate-800">
              {(["assigned", "reported"] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setStatusFilter("all"); }}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab
                      ? "bg-slate-700 text-slate-100 shadow-sm"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {tab === "assigned" ? "Assigned to me" : "Reported by me"}
                  <span className="ml-2 text-xs opacity-50">
                    {tab === "assigned" ? assigned.length : reported.length}
                  </span>
                </button>
              ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search issues…"
                className="flex-1 min-w-[200px] px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-900 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-900 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="all">All statuses</option>
                {allStatuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-900 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="updated">Sort: Last updated</option>
                <option value="created">Sort: Created</option>
                <option value="priority">Sort: Priority</option>
              </select>
            </div>

            {/* Issue list */}
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-slate-600">
                <SearchX size={32} className="mb-2" />
                <p className="text-sm">No issues match your filters</p>
              </div>
            ) : (
              <div className="grid gap-2 pb-6">
                {filtered.map((issue) => (
                  <IssueCard
                    key={issue.id}
                    issue={issue}
                    baseUrl={creds.baseUrl}
                    onClick={() => setSelectedKey(issue.key)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {selectedKey && creds && (
        <IssueDrawer
          issueKey={selectedKey}
          creds={creds}
          onClose={() => setSelectedKey(null)}
          onUpdated={fetchIssues}
        />
      )}
    </div>
  );
}
