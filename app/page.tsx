"use client";
import { useEffect, useState } from "react";
import { Loader2, ArrowRight, CheckSquare, LayoutDashboard, Bell, AlertTriangle, Clock, Rocket, CalendarDays, FileText, Ticket } from "lucide-react";
import Link from "next/link";
import { JiraIssue } from "@/lib/jira";
import { useApp } from "@/components/AppShell";
import IssueCard from "@/components/IssueCard";
import IssueDrawer from "@/components/IssueDrawer";
import TokenExpiryBanner from "@/components/TokenExpiryBanner";
import { getKanbanState, KanbanCard, PRIORITY_META, isOverdue as isKanbanOverdue, isDueToday, accentBorderClass } from "@/lib/kanban";
import { getTodos } from "@/lib/todo";
import { getDeployments, Deployment, DEPLOYMENT_TYPE_META } from "@/lib/deployments";
import { getCalendarEvents, CalendarEvent, EVENT_COLOR_META } from "@/lib/calendar-events";
import { todayLocal, daysFromToday, jqlCreatedRange } from "@/lib/date";
import clsx from "clsx";

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

  // Today's raised tickets
  const [raisedDate, setRaisedDate]                 = useState(() => todayLocal());
  const [todayRaised, setTodayRaised]               = useState<JiraIssue[]>([]);
  const [todayRaisedLoading, setTodayRaisedLoading] = useState(false);
  const [selectedKey, setSelectedKey]               = useState<string | null>(null);

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

  useEffect(() => {
    if (!creds) { setTodayRaised([]); return; }
    const jql = `reporter = "${creds.email}" AND ${jqlCreatedRange(raisedDate)} ORDER BY created ASC`;
    setTodayRaisedLoading(true);
    fetch("/api/jira/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...creds,
        jql,
        maxResults: 50,
        fields: ["summary", "status", "priority", "issuetype", "assignee", "reporter", "created", "updated", "labels", "fixVersions", "project", "duedate", "parent"],
      }),
    })
      .then(res => res.json())
      .then(data => setTodayRaised(data.issues ?? []))
      .catch(() => setTodayRaised([]))
      .finally(() => setTodayRaisedLoading(false));
  }, [creds, raisedDate]);

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
          <span className="text-xs text-slate-500 hidden sm:block">{creds.email}</span>
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

        {/* ── Two-column overview: kanban on-going + upcoming ── */}
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

        {/* ── Raised Tickets ── */}
        {creds && (
          <div className="border-b border-slate-800 pb-5">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <p className="text-xs text-slate-600 uppercase tracking-wider font-semibold">Raised Tickets</p>
                {todayRaised.length > 0 && (
                  <span className="text-xs bg-blue-900/40 text-blue-300 border border-blue-800/50 px-1.5 py-0.5 rounded-full font-semibold">{todayRaised.length}</span>
                )}
                {todayRaisedLoading && <Loader2 size={13} className="animate-spin text-blue-400" />}
              </div>
              {/* Date picker */}
              <div className="flex items-center gap-1.5">
                {raisedDate !== todayLocal() && (
                  <button
                    onClick={() => setRaisedDate(todayLocal())}
                    className="px-2 py-1 text-[11px] font-medium bg-blue-600/20 border border-blue-500/50 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors"
                  >
                    Today
                  </button>
                )}
                <input
                  type="date"
                  value={raisedDate}
                  max={todayLocal()}
                  onChange={e => e.target.value && setRaisedDate(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300 [color-scheme:dark] focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer"
                />
              </div>
            </div>
            {todayRaisedLoading && todayRaised.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-slate-600">
                <Loader2 size={18} className="animate-spin mr-2" /> Loading…
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
        )}

        {/* ── Link to Jira page ── */}
        {creds && (
          <Link href="/jira" className="flex items-center justify-between px-4 py-3 rounded-xl border border-slate-800 bg-slate-900 hover:border-slate-700 hover:bg-slate-800/60 transition-colors group">
            <div className="flex items-center gap-2.5">
              <Ticket size={15} className="text-blue-400" />
              <div>
                <p className="text-sm font-medium text-slate-200">Jira Overview</p>
                <p className="text-xs text-slate-500">CR tickets, insights, all assigned &amp; reported issues</p>
              </div>
            </div>
            <ArrowRight size={15} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
          </Link>
        )}

      </div>

      {selectedKey && creds && (
        <IssueDrawer issueKey={selectedKey} creds={creds} onClose={() => setSelectedKey(null)} />
      )}
    </div>
  );
}
