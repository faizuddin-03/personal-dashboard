"use client";
import { useEffect, useState, useCallback } from "react";
import { RefreshCw, Loader2, SearchX, ArrowRight, CheckSquare, FileText, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import {
  JiraIssue, JiraSearchResult,
} from "@/lib/jira";
import { useApp } from "@/components/AppShell";
import IssueCard from "@/components/IssueCard";
import IssueDrawer from "@/components/IssueDrawer";
import StatsBar from "@/components/StatsBar";
import TokenExpiryBanner from "@/components/TokenExpiryBanner";
import { getKanbanState, KanbanCard, PRIORITY_META, isOverdue as isKanbanOverdue, accentBorderClass } from "@/lib/kanban";
import { getTodos, isTodoOverdue } from "@/lib/todo";
import { getNotes } from "@/lib/notes-store";
import clsx from "clsx";

type Tab = "assigned" | "reported";
type SortKey = "updated" | "created" | "priority";
const PRIORITY_ORDER: Record<string, number> = { Highest: 0, Critical: 0, High: 1, Medium: 2, Low: 3, Lowest: 4 };

// ── Mini kanban card for dashboard ──────────────────────────
function MiniKanbanCard({ card }: { card: KanbanCard }) {
  const pm = PRIORITY_META[card.priority];
  const over = isKanbanOverdue(card);
  return (
    <Link href="/kanban" className={clsx(
      "shrink-0 w-56 bg-slate-800 border border-l-4 rounded-xl p-3 hover:border-slate-500 transition-all",
      accentBorderClass(card.accentColor)
    )}>
      {card.jiraKey && <p className="text-[10px] font-mono text-blue-400 font-bold mb-1">{card.jiraKey}</p>}
      <p className="text-sm text-slate-200 font-medium line-clamp-2 leading-snug mb-2">{card.title}</p>
      <div className="flex items-center gap-2">
        <span className={clsx("flex items-center gap-1 text-[10px] font-medium", pm.color)}>
          <span className={clsx("w-1.5 h-1.5 rounded-full", pm.dot)} />{pm.label}
        </span>
        {card.dueDate && (
          <span className={clsx("text-[10px] ml-auto", over ? "text-red-400" : "text-slate-500")}>
            {over ? "Overdue" : new Date(card.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        )}
        {card.assignee && (
          <span className="w-4 h-4 rounded-full bg-slate-700 text-[8px] text-slate-300 flex items-center justify-center font-bold ml-auto">
            {card.assignee.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>
    </Link>
  );
}

// ── Cross-app mini stat widget ──────────────────────────────
function AppWidget({ label, value, sub, subAlert, href, icon: Icon, color }: {
  label: string; value: number; sub?: string; subAlert?: boolean;
  href: string; icon: React.ElementType;
  color: "green" | "blue" | "purple" | "red";
}) {
  const colors = {
    green:  "bg-green-950/40  border-green-800/50  text-green-400",
    blue:   "bg-blue-950/40   border-blue-800/50   text-blue-400",
    purple: "bg-purple-950/40 border-purple-800/50 text-purple-400",
    red:    "bg-red-950/40    border-red-800/50    text-red-400",
  };
  return (
    <Link href={href} className={clsx("rounded-xl border px-4 py-3 flex items-center gap-3 hover:opacity-80 transition-opacity", colors[color])}>
      <Icon size={18} className="shrink-0" />
      <div>
        <p className="text-xl font-bold">{value}</p>
        <p className="text-[11px] opacity-70 font-medium">{label}</p>
        {sub && <p className={clsx("text-[10px] mt-0.5", subAlert ? "text-red-400 font-semibold" : "opacity-50")}>{sub}</p>}
      </div>
    </Link>
  );
}

// ── Main dashboard page ─────────────────────────────────────
export default function Dashboard() {
  const { creds, openSettings } = useApp();

  // Jira
  const [assigned, setAssigned]   = useState<JiraIssue[]>([]);
  const [reported, setReported]   = useState<JiraIssue[]>([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("assigned");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [search, setSearch]       = useState("");
  const [sort, setSort]           = useState<SortKey>("updated");
  const [statusFilter, setStatusFilter] = useState("all");

  // Local app data
  const [ongoingCards, setOngoingCards] = useState<KanbanCard[]>([]);
  const [urgentCount, setUrgentCount]   = useState(0);
  const [todoStats, setTodoStats]       = useState({ active: 0, overdue: 0 });
  const [notesCount, setNotesCount]     = useState(0);

  // Load local data once on mount
  useEffect(() => {
    const kanban = getKanbanState();
    setOngoingCards(kanban.ongoing);
    setUrgentCount(kanban.urgent.length);
    const todos = getTodos();
    setTodoStats({ active: todos.filter(t => !t.done).length, overdue: todos.filter(isTodoOverdue).length });
    setNotesCount(getNotes().length);
  }, []);

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

  const activeIssues = activeTab === "assigned" ? assigned : reported;
  const allStatuses  = Array.from(new Set(activeIssues.map(i => i.fields.status.name))).sort();
  const filtered = activeIssues
    .filter(i => {
      const q = search.toLowerCase();
      return (!q || i.fields.summary.toLowerCase().includes(q) || i.key.toLowerCase().includes(q)) &&
        (statusFilter === "all" || i.fields.status.name === statusFilter);
    })
    .sort((a, b) => {
      if (sort === "priority") {
        return (PRIORITY_ORDER[a.fields.priority?.name ?? ""] ?? 99) - (PRIORITY_ORDER[b.fields.priority?.name ?? ""] ?? 99);
      }
      const dA = sort === "updated" ? a.fields.updated : a.fields.created;
      const dB = sort === "updated" ? b.fields.updated : b.fields.created;
      return new Date(dB).getTime() - new Date(dA).getTime();
    });

  const hasLocalData = ongoingCards.length > 0 || todoStats.active > 0 || notesCount > 0;

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutDashboard size={15} className="text-slate-500" />
          <h1 className="text-sm font-semibold text-slate-200">Dashboard</h1>
        </div>
        {creds && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 hidden sm:block">{creds.email}</span>
            <button onClick={fetchIssues} disabled={loading} className="p-2 text-slate-500 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors" title="Refresh">
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        )}
      </header>

      <div className="flex-1 px-6 py-5 space-y-6">

        {/* Token expiry */}
        {creds?.tokenExpiry && <TokenExpiryBanner expiry={creds.tokenExpiry} onSettingsClick={openSettings} />}

        {/* Not connected */}
        {!creds && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mb-4 border border-blue-600/30">
              <span className="text-blue-400 text-2xl font-bold">J</span>
            </div>
            <h2 className="text-xl font-semibold text-slate-100 mb-2">Connect to Jira</h2>
            <p className="text-slate-500 text-sm mb-6 max-w-sm">Enter your Jira URL, email, and API token to start tracking your QA work.</p>
            <button onClick={openSettings} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">Connect Jira</button>
          </div>
        )}

        {/* Loading initial */}
        {creds && loading && assigned.length === 0 && reported.length === 0 && (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={28} className="animate-spin text-blue-500" />
          </div>
        )}

        {error && (
          <div className="bg-red-950/50 border border-red-800 rounded-xl p-4 text-red-400 text-sm">{error}</div>
        )}

        {/* ── Cross-app overview ── */}
        {hasLocalData && (
          <div>
            <p className="text-xs text-slate-600 uppercase tracking-wider font-semibold mb-2">Your workspace</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {todoStats.active > 0 && (
                <AppWidget label="Active Tasks" value={todoStats.active}
                  sub={todoStats.overdue > 0 ? `${todoStats.overdue} overdue` : undefined}
                  subAlert={todoStats.overdue > 0}
                  href="/todo" icon={CheckSquare} color="green" />
              )}
              {urgentCount > 0 && (
                <AppWidget label="Urgent (Kanban)" value={urgentCount} href="/kanban" icon={CheckSquare} color="red" />
              )}
              {notesCount > 0 && (
                <AppWidget label="Notes" value={notesCount} href="/notes" icon={FileText} color="purple" />
              )}
            </div>
          </div>
        )}

        {/* ── Kanban: On-Going ── */}
        {ongoingCards.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Kanban — On-Going</p>
              <Link href="/kanban" className="flex items-center gap-1 text-xs text-blue-400 hover:underline">
                View board <ArrowRight size={11} />
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {ongoingCards.map(card => <MiniKanbanCard key={card.id} card={card} />)}
            </div>
          </div>
        )}

        {/* ── Jira issues ── */}
        {creds && (assigned.length > 0 || reported.length > 0) && (
          <>
            <div>
              <p className="text-xs text-slate-600 uppercase tracking-wider font-semibold mb-3">Jira Issues</p>
              <StatsBar assigned={assigned} reported={reported} />
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-slate-900 rounded-xl p-1 w-fit border border-slate-800">
              {(["assigned", "reported"] as Tab[]).map(tab => (
                <button key={tab} onClick={() => { setActiveTab(tab); setStatusFilter("all"); }}
                  className={clsx("px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                    activeTab === tab ? "bg-slate-700 text-slate-100 shadow-sm" : "text-slate-500 hover:text-slate-300")}>
                  {tab === "assigned" ? "Assigned to me" : "Reported by me"}
                  <span className="ml-2 text-xs opacity-50">{tab === "assigned" ? assigned.length : reported.length}</span>
                </button>
              ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search issues…"
                className="flex-1 min-w-[200px] px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-900 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600" />
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
                  <IssueCard key={issue.id} issue={issue} baseUrl={creds.baseUrl} onClick={() => setSelectedKey(issue.key)} />
                ))}
              </div>
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
