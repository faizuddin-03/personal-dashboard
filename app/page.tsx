"use client";
import { useEffect, useState, useCallback } from "react";
import { RefreshCw, Loader2, SearchX, ArrowRight, CheckSquare, LayoutDashboard, Bell, AlertTriangle, Clock, Rocket, CalendarDays, X } from "lucide-react";
import Link from "next/link";
import {
  JiraIssue, JiraSearchResult,
} from "@/lib/jira";
import { useApp } from "@/components/AppShell";
import IssueCard from "@/components/IssueCard";
import IssueDrawer from "@/components/IssueDrawer";
import StatsBar from "@/components/StatsBar";
import TokenExpiryBanner from "@/components/TokenExpiryBanner";
import { getKanbanState, KanbanCard, PRIORITY_META, isOverdue as isKanbanOverdue, isDueToday, accentBorderClass } from "@/lib/kanban";
import { getTodos } from "@/lib/todo";
import { getDeployments, Deployment, DEPLOYMENT_TYPE_META } from "@/lib/deployments";
import { getCalendarEvents, CalendarEvent, EVENT_COLOR_META } from "@/lib/calendar-events";
import { todayLocal, daysFromToday } from "@/lib/date";
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
      "shrink-0 w-52 bg-slate-800 border border-l-4 rounded-xl p-3 hover:border-slate-500 transition-all",
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

// ── Upcoming item row ────────────────────────────────────────
function UpcomingRow({ item, i }: { item: UpcomingItemType; i: number }) {
  const dateLabel = (() => {
    const todayStr = todayLocal();
    const tomorrowStr = daysFromToday(1);
    if (item.date === todayStr) return "Today";
    if (item.date === tomorrowStr) return "Tomorrow";
    return new Date(item.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  })();

  if (item.kind === "deployment") {
    const tm = DEPLOYMENT_TYPE_META[item.data.type];
    return (
      <Link key={i} href="/calendar" className={clsx("flex items-start gap-2 rounded-lg border px-2.5 py-2 hover:opacity-80 transition-opacity", tm.bg, tm.border)}>
        <Rocket size={12} className={clsx(tm.text, "shrink-0 mt-0.5")} />
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-mono font-bold text-blue-400 mr-1.5">{item.data.ticketKey}</span>
          <span className={clsx("text-xs font-medium break-words", tm.text)}>{item.data.ticketSummary || item.data.ticketKey}</span>
        </div>
        <div className="text-right shrink-0">
          <p className={clsx("text-[10px] font-medium", tm.text)}>{dateLabel}</p>
          <p className="text-[10px] text-slate-500">{item.data.time}</p>
        </div>
      </Link>
    );
  }

  if (item.kind === "event") {
    const cm = EVENT_COLOR_META[item.data.color];
    const isMultiDay = item.data.startDate !== item.data.endDate;
    return (
      <Link key={i} href="/calendar" className={clsx("flex items-start gap-2 rounded-lg border px-2.5 py-2 hover:opacity-80 transition-opacity", cm.chipBg)}>
        <CalendarDays size={12} className="shrink-0 opacity-70 mt-0.5" />
        <div className="flex-1 min-w-0">
          <span className="text-xs font-medium break-words">{item.data.title}</span>
          {isMultiDay && <span className="text-[10px] opacity-60 ml-1.5">multi-day</span>}
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] font-medium">{dateLabel}</p>
          {!item.data.allDay && item.data.startTime && <p className="text-[10px] opacity-60">{item.data.startTime}</p>}
        </div>
      </Link>
    );
  }

  if (item.kind === "kanban") {
    return (
      <Link key={i} href="/kanban" className="flex items-start gap-2 rounded-lg border border-blue-800/40 bg-blue-950/30 px-2.5 py-2 hover:opacity-80 transition-opacity">
        <CheckSquare size={12} className="text-blue-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          {item.data.jiraKey && <span className="text-[10px] font-mono text-blue-400 mr-1.5">{item.data.jiraKey}</span>}
          <span className="text-xs text-slate-200 break-words">{item.data.title}</span>
        </div>
        <p className="text-[10px] text-blue-300 shrink-0">{dateLabel}</p>
      </Link>
    );
  }

  return (
    <Link key={i} href="/todo" className="flex items-start gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-2.5 py-2 hover:opacity-80 transition-opacity">
      <CheckSquare size={12} className="text-slate-400 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        {item.data.jiraKey && <span className="text-[10px] font-mono text-blue-400 mr-1.5">{item.data.jiraKey}</span>}
        <span className="text-xs text-slate-300 break-words">{item.data.title}</span>
      </div>
      <p className="text-[10px] text-slate-500 shrink-0">{dateLabel}</p>
    </Link>
  );
}

type UpcomingItemType =
  | { kind: "deployment"; data: Deployment; date: string }
  | { kind: "event";      data: CalendarEvent; date: string }
  | { kind: "kanban";     data: KanbanCard; date: string }
  | { kind: "todo";       data: import("@/lib/todo").TodoItem; date: string };

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

  // Global Jira search state
  const [jiraSearchResults, setJiraSearchResults] = useState<JiraIssue[]>([]);
  const [jiraSearchLoading, setJiraSearchLoading] = useState(false);

  // Local app data
  const [ongoingCards, setOngoingCards] = useState<KanbanCard[]>([]);
  const [dueSoonCards, setDueSoonCards] = useState<KanbanCard[]>([]);
  const [upcomingItems, setUpcomingItems] = useState<UpcomingItemType[]>([]);

  // Load local data once on mount
  useEffect(() => {
    const kanban = getKanbanState();
    setOngoingCards(kanban.ongoing);
    const allCards = (["urgent", "todo", "ongoing", "on-hold", "finished"] as const)
      .flatMap(col => kanban[col] as KanbanCard[]);
    setDueSoonCards(allCards.filter(c => isKanbanOverdue(c) || isDueToday(c)));
    const todos = getTodos();

    // Upcoming events within 7 days
    const todayStr = todayLocal();
    const in7Str = daysFromToday(7);

    const upcoming: UpcomingItemType[] = [];
    for (const d of getDeployments()) {
      if (d.date >= todayStr && d.date <= in7Str && d.status !== "cancelled")
        upcoming.push({ kind: "deployment", data: d, date: d.date });
    }
    for (const e of getCalendarEvents()) {
      if (e.startDate <= in7Str && e.endDate >= todayStr)
        upcoming.push({ kind: "event", data: e, date: e.startDate < todayStr ? todayStr : e.startDate });
    }
    for (const c of allCards.filter(c => c.columnId !== "finished" && c.dueDate && c.dueDate >= todayStr && c.dueDate <= in7Str)) {
      upcoming.push({ kind: "kanban", data: c, date: c.dueDate! });
    }
    for (const t of todos.filter(t => !t.done && t.dueDate && t.dueDate >= todayStr && t.dueDate <= in7Str)) {
      upcoming.push({ kind: "todo", data: t, date: t.dueDate! });
    }
    upcoming.sort((a, b) => a.date.localeCompare(b.date));
    setUpcomingItems(upcoming);
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

  // Debounced global Jira search — searches ALL tickets when query is present
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
          body: JSON.stringify({
            ...creds,
            jql,
            maxResults: 50,
          }),
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
  const hasLocalData = ongoingCards.length > 0 || upcomingItems.length > 0;

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
            <button onClick={fetchIssues} disabled={loading} aria-label="Refresh Jira issues" className="p-2 text-slate-500 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors" title="Refresh">
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        )}
      </header>

      <div className="flex-1 px-6 py-5 space-y-5">

        {/* Token expiry */}
        {creds?.tokenExpiry && <TokenExpiryBanner expiry={creds.tokenExpiry} onSettingsClick={openSettings} />}

        {/* Kanban due date reminders */}
        {dueSoonCards.length > 0 && (
          <div className="bg-amber-950/40 border border-amber-800/50 rounded-xl p-3 flex items-start gap-3">
            <Bell size={15} className="text-amber-400 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-amber-300 mb-1.5">
                {(() => {
                  const oc = dueSoonCards.filter(isKanbanOverdue).length;
                  const dc = dueSoonCards.filter(isDueToday).length;
                  return [oc > 0 ? `${oc} overdue` : "", oc > 0 && dc > 0 ? " · " : "", dc > 0 ? `${dc} due today` : ""].join("");
                })()}
                {" "}on Kanban
              </p>
              <div className="flex flex-wrap gap-2">
                {dueSoonCards.map(card => (
                  <Link key={card.id} href="/kanban" className={clsx(
                    "flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-lg border transition-colors",
                    isKanbanOverdue(card) ? "bg-red-950/40 border-red-800/40 text-red-300" : "bg-amber-950/30 border-amber-800/30 text-amber-300"
                  )}>
                    {isKanbanOverdue(card) ? <AlertTriangle size={10} /> : <Clock size={10} />}
                    <span className="max-w-[160px] truncate">{card.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

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

        {/* ── Two-column overview: workspace stats + upcoming ── */}
        {hasLocalData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Left: kanban on-going */}
            <div className="space-y-4">
              {ongoingCards.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">On-Going</p>
                    <Link href="/kanban" className="flex items-center gap-1 text-xs text-blue-400 hover:underline">
                      View board <ArrowRight size={11} />
                    </Link>
                  </div>
                  <div className="flex gap-2.5 overflow-x-auto pb-1">
                    {ongoingCards.map(card => <MiniKanbanCard key={card.id} card={card} />)}
                  </div>
                </div>
              )}
            </div>

            {/* Right: upcoming events */}
            {upcomingItems.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Next 7 Days</p>
                  <Link href="/calendar" className="flex items-center gap-1 text-xs text-blue-400 hover:underline">
                    Calendar <ArrowRight size={11} />
                  </Link>
                </div>
                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-0.5">
                  {upcomingItems.map((item, i) => <UpcomingRow key={i} item={item} i={i} />)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Jira issues ── */}
        {creds && (assigned.length > 0 || reported.length > 0) && (
          <>
            <div>
              <p className="text-xs text-slate-600 uppercase tracking-wider font-semibold mb-3">Jira Issues</p>
              <StatsBar assigned={assigned} reported={reported} />
            </div>

            {/* Search — global across all Jira tickets */}
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

            {/* Global search results */}
            {isSearching ? (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                    Search Results
                    {!jiraSearchLoading && <span className="ml-1.5 text-slate-600">({jiraSearchResults.length})</span>}
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
                {/* Tabs + filters */}
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
