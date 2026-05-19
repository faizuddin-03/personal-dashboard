"use client";
import { useEffect, useState, useCallback } from "react";
import {
  Settings, RefreshCw, Loader2, SearchX, LogOut,
} from "lucide-react";
import {
  JiraCredentials, JiraIssue, JiraSearchResult,
  getStoredCredentials, clearCredentials,
} from "@/lib/jira";
import SettingsModal from "@/components/SettingsModal";
import IssueCard from "@/components/IssueCard";
import IssueDrawer from "@/components/IssueDrawer";
import StatsBar from "@/components/StatsBar";

type Tab = "assigned" | "reported";
type SortKey = "updated" | "created" | "priority";

const PRIORITY_ORDER: Record<string, number> = {
  Highest: 0, Critical: 0, High: 1, Medium: 2, Low: 3, Lowest: 4,
};

export default function Dashboard() {
  const [creds, setCreds] = useState<JiraCredentials | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [assigned, setAssigned] = useState<JiraIssue[]>([]);
  const [reported, setReported] = useState<JiraIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("assigned");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("updated");
  const [statusFilter, setStatusFilter] = useState("all");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = getStoredCredentials();
    setCreds(stored);
    setHydrated(true);
  }, []);

  const fetchIssues = useCallback(async (c: JiraCredentials) => {
    setLoading(true);
    setError("");
    try {
      const [assignedRes, reportedRes] = await Promise.all([
        fetch("/api/jira/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...c,
            jql: "assignee = currentUser() ORDER BY updated DESC",
            maxResults: 100,
          }),
        }),
        fetch("/api/jira/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...c,
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
  }, []);

  useEffect(() => {
    if (creds) fetchIssues(creds);
  }, [creds, fetchIssues]);

  function handleLogout() {
    clearCredentials();
    setCreds(null);
    setAssigned([]);
    setReported([]);
  }

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

  if (!hydrated) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">QA</span>
            </div>
            <h1 className="text-base font-semibold text-gray-900">QA Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            {creds && (
              <>
                <span className="text-xs text-gray-500 hidden sm:block">{creds.email}</span>
                <button
                  onClick={() => creds && fetchIssues(creds)}
                  disabled={loading}
                  className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Refresh"
                >
                  <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                </button>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Disconnect"
                >
                  <LogOut size={16} />
                </button>
              </>
            )}
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              title="Settings"
            >
              <Settings size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Not connected */}
        {!creds && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
              <span className="text-blue-600 text-2xl font-bold">J</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Connect to Jira</h2>
            <p className="text-gray-500 text-sm mb-6 max-w-sm">
              Enter your Jira URL, email, and API token to start tracking your QA work.
            </p>
            <button
              onClick={() => setShowSettings(true)}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Connect Jira
            </button>
          </div>
        )}

        {/* Loading */}
        {creds && loading && (assigned.length === 0 && reported.length === 0) && (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={28} className="animate-spin text-blue-500" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Dashboard */}
        {creds && (assigned.length > 0 || reported.length > 0) && (
          <>
            <StatsBar assigned={assigned} reported={reported} />

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
              {(["assigned", "reported"] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setStatusFilter("all"); }}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab === "assigned" ? "Assigned to me" : "Reported by me"}
                  <span className="ml-2 text-xs opacity-60">
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
                className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="all">All statuses</option>
                {allStatuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="updated">Sort: Last updated</option>
                <option value="created">Sort: Created</option>
                <option value="priority">Sort: Priority</option>
              </select>
            </div>

            {/* Issue list */}
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-gray-400">
                <SearchX size={32} className="mb-2" />
                <p className="text-sm">No issues match your filters</p>
              </div>
            ) : (
              <div className="grid gap-2">
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
      </main>

      {/* Modals */}
      {showSettings && (
        <SettingsModal
          initial={creds}
          onClose={() => setShowSettings(false)}
          onSaved={(c) => {
            setCreds(c);
            setShowSettings(false);
          }}
        />
      )}

      {selectedKey && creds && (
        <IssueDrawer
          issueKey={selectedKey}
          creds={creds}
          onClose={() => setSelectedKey(null)}
          onUpdated={() => fetchIssues(creds)}
        />
      )}
    </div>
  );
}
