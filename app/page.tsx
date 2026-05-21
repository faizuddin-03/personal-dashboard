"use client";
import { useEffect, useState, useRef } from "react";
import {
  Loader2, ArrowRight, CheckSquare, LayoutDashboard, Bell, AlertTriangle,
  Clock, Rocket, CalendarDays, FileText, Ticket, Settings2, GripVertical,
  Eye, EyeOff, Kanban, ListTodo, AlertCircle, CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { JiraIssue } from "@/lib/jira";
import { useApp } from "@/components/AppShell";
import { reporterIs } from "@/lib/jira";
import IssueCard from "@/components/IssueCard";
import IssueDrawer from "@/components/IssueDrawer";
import TokenExpiryBanner from "@/components/TokenExpiryBanner";
import {
  getKanbanState, KanbanCard, PRIORITY_META, COLUMN_IDS, COLUMN_META, ColumnId,
  isOverdue as isKanbanOverdue, isDueToday, accentBorderClass,
} from "@/lib/kanban";
import { getTodos, isTodoOverdue, isDueToday as isTodoDueToday, TodoItem, TODO_PRIORITY_META } from "@/lib/todo";
import { getDeployments, Deployment, DEPLOYMENT_TYPE_META, DEPLOYMENT_STATUS_META } from "@/lib/deployments";
import { getCalendarEvents, CalendarEvent, EVENT_COLOR_META } from "@/lib/calendar-events";
import { todayLocal, daysFromToday, jqlCreatedRange } from "@/lib/date";
import { getWidgetConfig, saveWidgetConfig, WidgetConfig } from "@/lib/dashboard-widgets";
import clsx from "clsx";

// ── Mini kanban card ─────────────────────────────────────────
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
      </div>
    </Link>
  );
}

// ── Upcoming item row ────────────────────────────────────────
function UpcomingRow({ item, i }: { item: UpcomingItemType; i: number }) {
  const todayStr = todayLocal();
  const tomorrowStr = daysFromToday(1);
  const dateLabel = item.date === todayStr ? "Today"
    : item.date === tomorrowStr ? "Tomorrow"
    : new Date(item.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

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
  | { kind: "todo";       data: TodoItem; date: string };

// ── Stat box ─────────────────────────────────────────────────
function StatBox({ value, label, color = "text-slate-200", alert }: { value: number | string; label: string; color?: string; alert?: boolean }) {
  return (
    <div className={clsx("flex flex-col items-center justify-center px-4 py-3 rounded-xl border", alert && value ? "bg-red-950/30 border-red-800/50" : "bg-slate-800/60 border-slate-700/60")}>
      <span className={clsx("text-2xl font-bold tabular-nums", alert && value ? "text-red-400" : color)}>{value}</span>
      <span className="text-[11px] text-slate-500 mt-0.5 text-center leading-tight">{label}</span>
    </div>
  );
}

// ── Widget card shell ─────────────────────────────────────────
function WidgetCard({ icon, title, href, children }: { icon: React.ReactNode; title: string; href: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-sm font-semibold text-slate-200">{title}</h2>
        </div>
        <Link href={href} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
          View all <ArrowRight size={12} />
        </Link>
      </div>
      {children}
    </div>
  );
}

// ── Main dashboard page ──────────────────────────────────────
interface KanbanSummaryData {
  colCounts: Record<ColumnId, number>;
  activeCount: number;
  totalCount: number;
  overdueCount: number;
  estimatedHours: number;
}

interface TodoSnapshotData {
  total: number;
  overdue: number;
  dueToday: number;
  highPriority: number;
  urgentItems: TodoItem[];
}

interface JiraSnapshotData {
  assignedTotal: number;
  assignedInProgress: number;
  assignedToDo: number;
  pendingFromOthers: number;
}

export default function Dashboard() {
  const { creds, openSettings } = useApp();

  // Raised tickets widget
  const [raisedDate, setRaisedDate]                 = useState(() => todayLocal());
  const [todayRaised, setTodayRaised]               = useState<JiraIssue[]>([]);
  const [todayRaisedLoading, setTodayRaisedLoading] = useState(false);
  const [todayRaisedError, setTodayRaisedError]     = useState("");
  const [selectedKey, setSelectedKey]               = useState<string | null>(null);

  // Local data — shared across widgets
  const [ongoingCards, setOngoingCards]       = useState<KanbanCard[]>([]);
  const [dueSoonCards, setDueSoonCards]       = useState<KanbanCard[]>([]);
  const [upcomingItems, setUpcomingItems]     = useState<UpcomingItemType[]>([]);
  const [kanbanSummary, setKanbanSummary]     = useState<KanbanSummaryData | null>(null);
  const [todoSnapshot, setTodoSnapshot]       = useState<TodoSnapshotData | null>(null);
  const [upcomingDeps, setUpcomingDeps]       = useState<Deployment[]>([]);

  // Jira snapshot (API)
  const [jiraSnapshot, setJiraSnapshot]       = useState<JiraSnapshotData | null>(null);
  const [jiraSnapshotLoading, setJiraSnapshotLoading] = useState(false);

  // Widget config
  const [widgets, setWidgets]       = useState<WidgetConfig[]>([]);
  const [showCustomize, setShowCustomize] = useState(false);
  const customizeRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setWidgets(getWidgetConfig()); }, []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (customizeRef.current && !customizeRef.current.contains(e.target as Node)) setShowCustomize(false);
    }
    if (showCustomize) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showCustomize]);

  function persistWidgets(next: WidgetConfig[]) { setWidgets(next); saveWidgetConfig(next); }
  function toggleWidget(id: string) { persistWidgets(widgets.map(w => w.id === id ? { ...w, visible: !w.visible } : w)); }
  function moveWidget(id: string, dir: -1 | 1) {
    const idx = widgets.findIndex(w => w.id === id);
    if (idx < 0) return;
    const next = [...widgets];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    persistWidgets(next);
  }

  // Load all local data once on mount
  useEffect(() => {
    const todayStr = todayLocal();
    const in7Str   = daysFromToday(7);

    const kanban  = getKanbanState();
    const todos   = getTodos();

    // Ongoing cards for the existing "ongoing" widget
    setOngoingCards(kanban.ongoing);

    // Kanban summary
    const allCards = COLUMN_IDS.flatMap(col => kanban[col] as KanbanCard[]);
    const activeCards = allCards.filter(c => c.columnId !== "finished");
    const colCounts = {} as Record<ColumnId, number>;
    for (const col of COLUMN_IDS) colCounts[col] = kanban[col].length;
    setDueSoonCards(allCards.filter(c => isKanbanOverdue(c) || isDueToday(c)));
    setKanbanSummary({
      colCounts,
      activeCount: activeCards.length,
      totalCount: allCards.length,
      overdueCount: activeCards.filter(isKanbanOverdue).length,
      estimatedHours: activeCards.reduce((s, c) => s + (c.estimatedHours ?? 0), 0),
    });

    // To-Do snapshot
    const active = todos.filter(t => !t.done);
    const overdue = active.filter(isTodoOverdue);
    const today  = active.filter(isTodoDueToday);
    const highPri = active.filter(t => t.priority === "high" && !isTodoOverdue(t) && !isTodoDueToday(t));
    setTodoSnapshot({
      total: active.length,
      overdue: overdue.length,
      dueToday: today.length,
      highPriority: active.filter(t => t.priority === "high").length,
      urgentItems: [...overdue, ...today, ...highPri].slice(0, 5),
    });

    // Upcoming deployments (non-cancelled, next 30 days)
    const in30Str = daysFromToday(30);
    setUpcomingDeps(
      getDeployments()
        .filter(d => d.date >= todayStr && d.date <= in30Str && d.status !== "cancelled")
        .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
        .slice(0, 6)
    );

    // Upcoming 7-day mix (for existing "upcoming" widget)
    const upcoming: UpcomingItemType[] = [];
    for (const d of getDeployments()) {
      if (d.date >= todayStr && d.date <= in7Str && d.status !== "cancelled")
        upcoming.push({ kind: "deployment", data: d, date: d.date });
    }
    for (const e of getCalendarEvents()) {
      if (e.startDate <= in7Str && e.endDate >= todayStr)
        upcoming.push({ kind: "event", data: e, date: e.startDate < todayStr ? todayStr : e.startDate });
    }
    for (const c of allCards.filter(c => c.columnId !== "finished" && c.dueDate && c.dueDate >= todayStr && c.dueDate <= in7Str))
      upcoming.push({ kind: "kanban", data: c, date: c.dueDate! });
    for (const t of todos.filter(t => !t.done && t.dueDate && t.dueDate >= todayStr && t.dueDate <= in7Str))
      upcoming.push({ kind: "todo", data: t, date: t.dueDate! });
    upcoming.sort((a, b) => a.date.localeCompare(b.date));
    setUpcomingItems(upcoming);
  }, []);

  // Jira snapshot — two parallel fetches
  useEffect(() => {
    if (!creds) return;
    setJiraSnapshotLoading(true);
    const assignedJql = `assignee = currentUser() AND statusCategory != Done ORDER BY updated DESC`;
    const pendingJql  = `${reporterIs(creds)} AND assignee != currentUser() AND status not in (Closed, Done, Resolved)`;
    const body = (jql: string, max: number) => JSON.stringify({ ...creds, jql, maxResults: max, fields: ["status"] });
    Promise.all([
      fetch("/api/jira/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: body(assignedJql, 100) }).then(r => r.json()),
      fetch("/api/jira/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: body(pendingJql, 50) }).then(r => r.json()),
    ])
      .then(([assigned, pending]) => {
        const issues: JiraIssue[] = assigned.issues ?? [];
        setJiraSnapshot({
          assignedTotal:      issues.length,
          assignedInProgress: issues.filter(i => i.fields.status.statusCategory?.key === "indeterminate").length,
          assignedToDo:       issues.filter(i => i.fields.status.statusCategory?.key === "new").length,
          pendingFromOthers:  (pending.issues ?? []).length,
        });
      })
      .catch(() => {})
      .finally(() => setJiraSnapshotLoading(false));
  }, [creds]); // eslint-disable-line react-hooks/exhaustive-deps

  // Raised tickets
  useEffect(() => {
    if (!creds) { setTodayRaised([]); setTodayRaisedError(""); return; }
    const jql = `${reporterIs(creds)} AND ${jqlCreatedRange(raisedDate)} ORDER BY created ASC`;
    setTodayRaisedLoading(true);
    setTodayRaisedError("");
    fetch("/api/jira/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...creds, jql, maxResults: 50, fields: ["summary", "status", "priority", "issuetype", "assignee", "reporter", "created", "updated", "labels", "fixVersions", "project", "duedate", "parent"] }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.errorMessages?.length || data.error) {
          setTodayRaisedError(data.errorMessages?.[0] ?? data.error ?? "Jira error");
          setTodayRaised([]);
        } else {
          setTodayRaised(data.issues ?? []);
        }
      })
      .catch(e => setTodayRaisedError(e?.message ?? "Network error"))
      .finally(() => setTodayRaisedLoading(false));
  }, [creds, raisedDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasLocalData = ongoingCards.length > 0 || upcomingItems.length > 0;

  // ── Column bar colours ────────────────────────────────────
  const COL_BAR: Record<ColumnId, string> = {
    urgent:   "bg-red-500",
    todo:     "bg-slate-500",
    ongoing:  "bg-blue-500",
    "on-hold":"bg-amber-500",
    finished: "bg-green-500",
  };
  const COL_TEXT: Record<ColumnId, string> = {
    urgent:   "text-red-400",
    todo:     "text-slate-400",
    ongoing:  "text-blue-400",
    "on-hold":"text-amber-400",
    finished: "text-green-400",
  };

  // ── Date helpers ──────────────────────────────────────────
  function fmtDepDate(d: string) {
    const dt = new Date(d + "T12:00:00");
    const today = todayLocal();
    const tomorrow = daysFromToday(1);
    if (d === today) return "Today";
    if (d === tomorrow) return "Tomorrow";
    return dt.toLocaleDateString("en-MY", { weekday: "short", day: "numeric", month: "short" });
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutDashboard size={15} className="text-slate-500" />
          <h1 className="text-sm font-semibold text-slate-200">Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          {creds && <span className="text-xs text-slate-500 hidden sm:block">{creds.email}</span>}
          {widgets.length > 0 && (
            <div className="relative" ref={customizeRef}>
              <button onClick={() => setShowCustomize(v => !v)} title="Customize widgets"
                className={clsx("p-1.5 rounded-lg transition-colors", showCustomize ? "bg-slate-700 text-slate-200" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800")}>
                <Settings2 size={15} />
              </button>
              {showCustomize && (
                <div className="absolute right-0 top-9 w-60 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-3">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-2">Widgets</p>
                  <div className="space-y-0.5">
                    {widgets.map((w, i) => (
                      <div key={w.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-800 group">
                        <GripVertical size={13} className="text-slate-700 shrink-0" />
                        <span className={clsx("text-xs flex-1", w.visible ? "text-slate-300" : "text-slate-600")}>{w.label}</span>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => moveWidget(w.id, -1)} disabled={i === 0} className="text-slate-600 hover:text-slate-300 disabled:opacity-20 px-0.5">↑</button>
                          <button onClick={() => moveWidget(w.id, 1)} disabled={i === widgets.length - 1} className="text-slate-600 hover:text-slate-300 disabled:opacity-20 px-0.5">↓</button>
                        </div>
                        <button onClick={() => toggleWidget(w.id)} className={clsx("shrink-0", w.visible ? "text-blue-400 hover:text-slate-500" : "text-slate-700 hover:text-blue-400")}>
                          {w.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 px-6 py-5 space-y-5">

        {creds?.tokenExpiry && <TokenExpiryBanner expiry={creds.tokenExpiry} onSettingsClick={openSettings} />}

        {/* Overdue / due-today banner */}
        {dueSoonCards.length > 0 && (
          <div className="bg-amber-950/40 border border-amber-800/50 rounded-xl p-3 flex items-start gap-3">
            <Bell size={15} className="text-amber-400 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-amber-300 mb-1.5">
                {[dueSoonCards.filter(isKanbanOverdue).length > 0 ? `${dueSoonCards.filter(isKanbanOverdue).length} overdue` : "",
                  dueSoonCards.filter(isDueToday).length > 0 ? `${dueSoonCards.filter(isDueToday).length} due today` : ""]
                  .filter(Boolean).join(" · ")} on Kanban
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

        {/* ── Ordered widgets ── */}
        {widgets.map(w => {
          if (!w.visible) return null;

          // ── 1. Kanban Summary ──────────────────────────────
          if (w.id === "kanban-summary" && kanbanSummary) {
            const total = kanbanSummary.totalCount;
            return (
              <WidgetCard key="kanban-summary" icon={<Kanban size={15} className="text-blue-400" />} title="Kanban Board" href="/kanban">
                {/* Column counts */}
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {COLUMN_IDS.map(col => (
                    <div key={col} className="flex flex-col items-center py-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                      <span className={clsx("text-xl font-bold tabular-nums", COL_TEXT[col])}>{kanbanSummary.colCounts[col]}</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">{COLUMN_META[col].label}</span>
                    </div>
                  ))}
                </div>
                {/* Distribution bar */}
                {total > 0 && (
                  <div className="flex h-2 rounded-full overflow-hidden mb-3 gap-px">
                    {COLUMN_IDS.map(col => {
                      const pct = (kanbanSummary.colCounts[col] / total) * 100;
                      return pct > 0 ? <div key={col} className={clsx("h-full", COL_BAR[col])} style={{ width: `${pct}%` }} /> : null;
                    })}
                  </div>
                )}
                {/* Footer stats */}
                <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                  <span>{kanbanSummary.activeCount} active</span>
                  {kanbanSummary.overdueCount > 0 && <span className="text-red-400 font-medium">{kanbanSummary.overdueCount} overdue</span>}
                  {kanbanSummary.estimatedHours > 0 && <span>{kanbanSummary.estimatedHours}h estimated</span>}
                  <span className="ml-auto">{total} total cards</span>
                </div>
              </WidgetCard>
            );
          }

          // ── 2. To-Do Snapshot ──────────────────────────────
          if (w.id === "todo-snapshot" && todoSnapshot) {
            return (
              <WidgetCard key="todo-snapshot" icon={<ListTodo size={15} className="text-green-400" />} title="To-Do" href="/todo">
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <StatBox value={todoSnapshot.overdue}      label="Overdue"      color="text-red-400"    alert />
                  <StatBox value={todoSnapshot.dueToday}     label="Due Today"    color="text-amber-400" />
                  <StatBox value={todoSnapshot.highPriority} label="High Priority" color="text-orange-400" />
                </div>
                {todoSnapshot.urgentItems.length > 0 ? (
                  <div className="space-y-1.5 border-t border-slate-800 pt-3">
                    {todoSnapshot.urgentItems.map(t => {
                      const isOver = isTodoOverdue(t);
                      const isToday = isTodoDueToday(t);
                      const pm = TODO_PRIORITY_META[t.priority];
                      return (
                        <Link key={t.id} href="/todo" className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors group">
                          <span className={clsx("w-1.5 h-1.5 rounded-full shrink-0", pm.dot)} />
                          <span className="text-xs text-slate-200 flex-1 truncate">{t.title}</span>
                          <span className={clsx("text-[10px] font-medium shrink-0", isOver ? "text-red-400" : isToday ? "text-amber-400" : "text-slate-500")}>
                            {isOver ? "Overdue" : isToday ? "Today" : t.priority === "high" ? "High" : ""}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-green-400 border-t border-slate-800 pt-3">
                    <CheckCircle2 size={13} /><span>All caught up — nothing overdue or due today</span>
                  </div>
                )}
                <p className="text-[11px] text-slate-600 mt-3">{todoSnapshot.total} active item{todoSnapshot.total !== 1 ? "s" : ""} total</p>
              </WidgetCard>
            );
          }

          // ── 4. Upcoming Deployments ────────────────────────
          if (w.id === "deployments") {
            return (
              <WidgetCard key="deployments" icon={<Rocket size={15} className="text-sky-400" />} title="Upcoming Deployments" href="/calendar">
                {upcomingDeps.length === 0 ? (
                  <p className="text-sm text-slate-600 py-4 text-center">No upcoming deployments scheduled</p>
                ) : (
                  <div className="space-y-2">
                    {upcomingDeps.map(d => {
                      const tm = DEPLOYMENT_TYPE_META[d.type];
                      const sm = DEPLOYMENT_STATUS_META[d.status];
                      return (
                        <Link key={d.id} href="/calendar" className={clsx("flex items-center gap-3 px-3 py-2.5 rounded-xl border hover:opacity-90 transition-opacity", tm.bg, tm.border)}>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[10px] font-mono font-bold text-blue-400">{d.ticketKey}</span>
                              <span className={clsx("text-[10px] font-medium", tm.text)}>{d.environment}</span>
                              <span className={clsx("text-[10px]", tm.text, "opacity-60")}>{tm.label}</span>
                            </div>
                            <span className={clsx("text-xs font-medium line-clamp-1", tm.text)}>{d.ticketSummary || d.ticketKey}</span>
                          </div>
                          <div className="text-right shrink-0 space-y-0.5">
                            <p className={clsx("text-[11px] font-semibold", tm.text)}>{fmtDepDate(d.date)}</p>
                            <p className={clsx("text-[10px]", tm.text, "opacity-70")}>{d.time}</p>
                            <p className={clsx("text-[10px] font-medium", sm.color)}>{sm.label}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </WidgetCard>
            );
          }

          // ── 5. Jira Snapshot ───────────────────────────────
          if (w.id === "jira-snapshot" && creds) {
            return (
              <WidgetCard key="jira-snapshot" icon={<Ticket size={15} className="text-blue-400" />} title="Jira Snapshot" href="/jira">
                {jiraSnapshotLoading && !jiraSnapshot ? (
                  <div className="flex items-center gap-2 py-6 justify-center text-slate-600">
                    <Loader2 size={16} className="animate-spin" /><span className="text-sm">Loading…</span>
                  </div>
                ) : jiraSnapshot ? (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                      <StatBox value={jiraSnapshot.assignedTotal}      label="Assigned Open"     color="text-blue-300" />
                      <StatBox value={jiraSnapshot.assignedInProgress}  label="In Progress"       color="text-yellow-400" />
                      <StatBox value={jiraSnapshot.assignedToDo}        label="To Do"             color="text-slate-300" />
                      <StatBox value={jiraSnapshot.pendingFromOthers}   label="Pending From Others" color="text-purple-400" alert />
                    </div>
                    {/* Progress bar: In Progress vs To Do vs other */}
                    {jiraSnapshot.assignedTotal > 0 && (
                      <div className="flex h-1.5 rounded-full overflow-hidden gap-px mb-3">
                        <div className="h-full bg-yellow-500 transition-all" style={{ width: `${(jiraSnapshot.assignedInProgress / jiraSnapshot.assignedTotal) * 100}%` }} />
                        <div className="h-full bg-slate-500 transition-all" style={{ width: `${(jiraSnapshot.assignedToDo / jiraSnapshot.assignedTotal) * 100}%` }} />
                        <div className="h-full bg-slate-700 flex-1" />
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-[11px] text-slate-600 flex-wrap">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-yellow-500 inline-block" />In Progress</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-slate-500 inline-block" />To Do</span>
                      {jiraSnapshot.pendingFromOthers > 0 && (
                        <span className="ml-auto flex items-center gap-1 text-purple-400">
                          <AlertCircle size={11} />{jiraSnapshot.pendingFromOthers} ticket{jiraSnapshot.pendingFromOthers !== 1 ? "s" : ""} waiting on others
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-slate-600 py-4 text-center">Could not load Jira data</p>
                )}
              </WidgetCard>
            );
          }

          // ── Existing: On-Going + Next 7 Days ──────────────
          if (w.id === "ongoing" || w.id === "upcoming") {
            if (!hasLocalData) return null;
            const ongoingCfg  = widgets.find(x => x.id === "ongoing");
            const upcomingCfg = widgets.find(x => x.id === "upcoming");
            if (w.id === "upcoming" && ongoingCfg?.visible) return null;
            const showOngoing  = ongoingCfg?.visible  ?? true;
            const showUpcoming = upcomingCfg?.visible ?? true;
            return (
              <div key="local-overview" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {showOngoing && ongoingCards.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">On-Going</p>
                      <Link href="/kanban" className="flex items-center gap-1 text-xs text-blue-400 hover:underline">View board <ArrowRight size={11} /></Link>
                    </div>
                    <div className="flex gap-2.5 overflow-x-auto pb-1">
                      {ongoingCards.map(card => <MiniKanbanCard key={card.id} card={card} />)}
                    </div>
                  </div>
                )}
                {showUpcoming && upcomingItems.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Next 7 Days</p>
                      <Link href="/calendar" className="flex items-center gap-1 text-xs text-blue-400 hover:underline">Calendar <ArrowRight size={11} /></Link>
                    </div>
                    <div className="space-y-1.5 max-h-72 overflow-y-auto pr-0.5">
                      {upcomingItems.map((item, i) => <UpcomingRow key={i} item={item} i={i} />)}
                    </div>
                  </div>
                )}
              </div>
            );
          }

          // ── Existing: Raised Tickets ───────────────────────
          if (w.id === "raised" && creds) {
            return (
              <div key="raised" className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <FileText size={15} className="text-slate-400" />
                    <h2 className="text-sm font-semibold text-slate-200">Raised Tickets</h2>
                    {todayRaised.length > 0 && <span className="text-xs bg-blue-900/40 text-blue-300 border border-blue-800/50 px-1.5 py-0.5 rounded-full font-semibold">{todayRaised.length}</span>}
                    {todayRaisedLoading && <Loader2 size={13} className="animate-spin text-blue-400" />}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {raisedDate !== todayLocal() && (
                      <button onClick={() => setRaisedDate(todayLocal())} className="px-2 py-1 text-[11px] font-medium bg-blue-600/20 border border-blue-500/50 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors">Today</button>
                    )}
                    <input type="date" value={raisedDate} max={todayLocal()} onChange={e => e.target.value && setRaisedDate(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300 [color-scheme:dark] focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer" />
                  </div>
                </div>
                {todayRaisedLoading && todayRaised.length === 0 ? (
                  <div className="flex items-center justify-center py-8 text-slate-600"><Loader2 size={18} className="animate-spin mr-2" /> Loading…</div>
                ) : todayRaisedError ? (
                  <div className="flex flex-col items-center py-6 text-center px-3">
                    <p className="text-xs text-red-400 font-medium mb-1">Jira query failed</p>
                    <p className="text-xs text-slate-600 break-all">{todayRaisedError}</p>
                  </div>
                ) : todayRaised.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-slate-600">
                    <FileText size={24} className="mb-2" />
                    <p className="text-sm">No tickets raised on {raisedDate === todayLocal() ? "today" : new Date(raisedDate + "T12:00:00").toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })}</p>
                    {raisedDate === todayLocal() && <p className="text-xs mt-1 text-slate-700">Tickets you create in Jira today will appear here</p>}
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {todayRaised.map(issue => (
                      <IssueCard key={issue.id} issue={issue} baseUrl={creds.baseUrl} onClick={() => setSelectedKey(issue.key)} onParentClick={key => setSelectedKey(key)} />
                    ))}
                  </div>
                )}
              </div>
            );
          }

          // ── Existing: Jira Overview link ───────────────────
          if (w.id === "jira-overview" && creds) {
            return (
              <Link key="jira-overview" href="/jira" className="flex items-center justify-between px-4 py-3 rounded-xl border border-slate-800 bg-slate-900 hover:border-slate-700 hover:bg-slate-800/60 transition-colors group">
                <div className="flex items-center gap-2.5">
                  <Ticket size={15} className="text-blue-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-200">Jira Overview</p>
                    <p className="text-xs text-slate-500">CR tickets, insights, all assigned &amp; reported issues</p>
                  </div>
                </div>
                <ArrowRight size={15} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
              </Link>
            );
          }

          return null;
        })}
      </div>

      {selectedKey && creds && (
        <IssueDrawer issueKey={selectedKey} creds={creds} onClose={() => setSelectedKey(null)} />
      )}
    </div>
  );
}
