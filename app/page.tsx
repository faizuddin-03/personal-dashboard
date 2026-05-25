"use client";
import { useEffect, useState, useRef } from "react";
import {
  Loader2, ArrowRight, CheckSquare, LayoutDashboard, Bell, AlertTriangle,
  Clock, Rocket, FileText, Ticket, Settings2, GripVertical,
  Eye, EyeOff, ClipboardList, CheckCheck,
} from "lucide-react";
import Link from "next/link";
import { JiraIssue } from "@/lib/jira";
import { useApp } from "@/components/AppShell";
import { reporterIs } from "@/lib/jira";
import IssueCard from "@/components/IssueCard";
import IssueDrawer from "@/components/IssueDrawer";
import TokenExpiryBanner from "@/components/TokenExpiryBanner";
import {
  getKanbanState, KanbanCard, PRIORITY_META,
  isOverdue as isKanbanOverdue, isDueToday, accentBorderClass,
} from "@/lib/kanban";
import { getDeployments, Deployment, DEPLOYMENT_TYPE_META, DEPLOYMENT_STATUS_META } from "@/lib/deployments";
import { todayLocal, daysFromToday, jqlCreatedRange } from "@/lib/date";
import { getWidgetConfig, saveWidgetConfig, WidgetConfig } from "@/lib/dashboard-widgets";
import clsx from "clsx";

// ── Mini kanban card ─────────────────────────────────────────
function MiniKanbanCard({ card }: { card: KanbanCard }) {
  const pm = PRIORITY_META[card.priority];
  const over = isKanbanOverdue(card);
  const isCR = card.boardType === "cr";
  return (
    <Link href="/kanban" className={clsx(
      "shrink-0 w-52 border border-l-4 rounded-xl p-3 hover:border-slate-500 transition-all",
      isCR ? "bg-indigo-950/50 border-slate-700" : "bg-slate-800 border-slate-700",
      accentBorderClass(card.accentColor)
    )}>
      <div className="flex items-center gap-1.5 mb-1">
        {isCR
          ? <span className="text-[10px] bg-indigo-900/60 text-indigo-300 border border-indigo-700/50 px-1.5 py-0.5 rounded-full font-medium">CR</span>
          : <span className="text-[10px] bg-slate-700/80 text-slate-400 border border-slate-600/50 px-1.5 py-0.5 rounded-full font-medium">Task</span>
        }
        {card.jiraKey && <span className="text-[10px] font-mono text-blue-400 font-bold">{card.jiraKey}</span>}
      </div>
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


// ── TS Tracker types (minimal, for stats only) ───────────────
interface TSCase  { status: "pass" | "fail" | "in-progress" | null; disabled?: boolean; }
interface TSSuite { cases: TSCase[]; }
interface TSCR    { id: string; crKey: string; crSummary: string; suites: TSSuite[]; }

// ── Jira status chip colour ───────────────────────────────────
function statusColor(colorName: string) {
  if (colorName === "green")  return "bg-green-900/50 text-green-300 border-green-800/50";
  if (colorName === "yellow") return "bg-amber-900/50 text-amber-300 border-amber-800/50";
  if (colorName === "blue-gray") return "bg-blue-900/40 text-blue-300 border-blue-800/50";
  return "bg-slate-800 text-slate-400 border-slate-700";
}

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

export default function Dashboard() {
  const { creds, openSettings } = useApp();

  // Raised tickets widget
  const [raisedDate, setRaisedDate]                 = useState(() => todayLocal());
  const [todayRaised, setTodayRaised]               = useState<JiraIssue[]>([]);
  const [todayRaisedLoading, setTodayRaisedLoading] = useState(false);
  const [todayRaisedError, setTodayRaisedError]     = useState("");
  const [selectedKey, setSelectedKey]               = useState<string | null>(null);

  // Completed today widget
  const [completedToday, setCompletedToday]               = useState<JiraIssue[]>([]);
  const [completedTodayLoading, setCompletedTodayLoading] = useState(false);

  // Local data
  const [ongoingCards, setOngoingCards]   = useState<KanbanCard[]>([]);
  const [dueSoonCards, setDueSoonCards]   = useState<KanbanCard[]>([]);
  const [upcomingDeps, setUpcomingDeps]   = useState<Deployment[]>([]);
  const [tsCRs, setTsCRs]                 = useState<TSCR[]>([]);

  // Assigned tickets (API)
  const [assignedTickets, setAssignedTickets]           = useState<JiraIssue[]>([]);
  const [assignedTicketsLoading, setAssignedTicketsLoading] = useState(false);

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

  // Load local data once on mount
  useEffect(() => {
    const todayStr = todayLocal();
    const kanban   = getKanbanState();

    const allCards = ["urgent","todo","ongoing","on-hold","finished"].flatMap(col => kanban[col as keyof typeof kanban] as KanbanCard[]);
    setOngoingCards(kanban.ongoing);
    setDueSoonCards(allCards.filter(c => isKanbanOverdue(c) || isDueToday(c)));

    const in30Str = daysFromToday(30);
    setUpcomingDeps(
      getDeployments()
        .filter(d => d.date >= todayStr && d.date <= in30Str && d.status !== "cancelled")
        .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
        .slice(0, 6)
    );

    try {
      const raw = localStorage.getItem("test_tracker_crs");
      setTsCRs(raw ? (JSON.parse(raw) as TSCR[]) : []);
    } catch { setTsCRs([]); }
  }, []);

  // Assigned tickets widget
  useEffect(() => {
    if (!creds) { setAssignedTickets([]); return; }
    setAssignedTicketsLoading(true);
    fetch("/api/jira/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...creds, jql: "assignee = currentUser() AND statusCategory != Done ORDER BY updated DESC", maxResults: 10, fields: ["summary", "status", "priority", "issuetype"] }),
    })
      .then(r => r.json())
      .then(d => setAssignedTickets(d.issues ?? []))
      .catch(() => setAssignedTickets([]))
      .finally(() => setAssignedTicketsLoading(false));
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

  // Completed today
  useEffect(() => {
    if (!creds) { setCompletedToday([]); return; }
    setCompletedTodayLoading(true);
    fetch("/api/jira/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...creds,
        jql: "assignee = currentUser() AND status changed to (Done, Closed, Resolved) after startOfDay() ORDER BY updated DESC",
        maxResults: 50,
        fields: ["summary", "status", "priority", "issuetype"],
      }),
    })
      .then(r => r.json())
      .then(d => setCompletedToday(d.issues ?? []))
      .catch(() => setCompletedToday([]))
      .finally(() => setCompletedTodayLoading(false));
  }, [creds]); // eslint-disable-line react-hooks/exhaustive-deps

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

          // ── Deployments (50%) + Assigned Tickets (50%) ────
          if (w.id === "deployments") {
            const assignedVisible = widgets.find(x => x.id === "assigned-tickets")?.visible && !!creds;

            const deploymentsEl = (
              <WidgetCard key="dep" icon={<Rocket size={15} className="text-sky-400" />} title="Upcoming Deployments" href="/calendar">
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
                              <span className={clsx("text-[10px] opacity-60", tm.text)}>{tm.label}</span>
                            </div>
                            <span className={clsx("text-xs font-medium line-clamp-1", tm.text)}>{d.ticketSummary || d.ticketKey}</span>
                          </div>
                          <div className="text-right shrink-0 space-y-0.5">
                            <p className={clsx("text-[11px] font-semibold", tm.text)}>{fmtDepDate(d.date)}</p>
                            <p className={clsx("text-[10px] opacity-70", tm.text)}>{d.time}</p>
                            <p className={clsx("text-[10px] font-medium", sm.color)}>{sm.label}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </WidgetCard>
            );

            const assignedEl = assignedVisible ? (
              <WidgetCard key="at" icon={<Ticket size={15} className="text-blue-400" />} title="Assigned to Me" href="/jira">
                {assignedTicketsLoading && assignedTickets.length === 0 ? (
                  <div className="flex items-center justify-center py-6 text-slate-600"><Loader2 size={16} className="animate-spin" /></div>
                ) : assignedTickets.length === 0 ? (
                  <p className="text-sm text-slate-600 py-4 text-center">No open tickets assigned</p>
                ) : (
                  <div className="space-y-1.5">
                    {assignedTickets.map(issue => (
                      <div key={issue.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/40 hover:bg-slate-800 transition-colors">
                        <span className="text-[10px] font-mono text-blue-400 font-bold shrink-0">{issue.key}</span>
                        <span className="text-xs text-slate-200 flex-1 truncate">{issue.fields.summary}</span>
                        <span className={clsx("text-[10px] px-1.5 py-0.5 rounded border font-medium shrink-0", statusColor(issue.fields.status.statusCategory?.colorName ?? ""))}>
                          {issue.fields.status.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </WidgetCard>
            ) : null;

            if (assignedVisible) {
              return (
                <div key="dep-assigned-pair" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {deploymentsEl}
                  {assignedEl}
                </div>
              );
            }
            return <div key="deployments">{deploymentsEl}</div>;
          }

          // skip assigned-tickets when already paired with deployments
          if (w.id === "assigned-tickets") {
            if (widgets.find(x => x.id === "deployments")?.visible) return null;
            if (!creds) return null;
            return (
              <WidgetCard key="assigned-tickets" icon={<Ticket size={15} className="text-blue-400" />} title="Assigned to Me" href="/jira">
                {assignedTicketsLoading && assignedTickets.length === 0 ? (
                  <div className="flex items-center justify-center py-6 text-slate-600"><Loader2 size={16} className="animate-spin" /><span className="text-sm ml-2">Loading…</span></div>
                ) : assignedTickets.length === 0 ? (
                  <p className="text-sm text-slate-600 py-4 text-center">No open tickets assigned</p>
                ) : (
                  <div className="space-y-1.5">
                    {assignedTickets.map(issue => (
                      <div key={issue.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/40 hover:bg-slate-800 transition-colors">
                        <span className="text-[10px] font-mono text-blue-400 font-bold shrink-0">{issue.key}</span>
                        <span className="text-xs text-slate-200 flex-1 truncate">{issue.fields.summary}</span>
                        <span className={clsx("text-[10px] px-1.5 py-0.5 rounded border font-medium shrink-0", statusColor(issue.fields.status.statusCategory?.colorName ?? ""))}>
                          {issue.fields.status.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </WidgetCard>
            );
          }

          // ── On-Going ──────────────────────────────────────
          if (w.id === "ongoing") {
            const taskCards = ongoingCards.filter(c => c.boardType !== "cr");
            if (taskCards.length === 0) return null;
            return (
              <div key="ongoing">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">On-Going</p>
                  <Link href="/kanban" className="flex items-center gap-1 text-xs text-blue-400 hover:underline">View board <ArrowRight size={11} /></Link>
                </div>
                <div className="flex gap-2.5 overflow-x-auto pb-1">
                  {taskCards.map(card => <MiniKanbanCard key={card.id} card={card} />)}
                </div>
              </div>
            );
          }

          // ── TS Tracker ────────────────────────────────────
          if (w.id === "ts-tracker") {
            const ongoingKeys = [...new Set(ongoingCards.map(c => c.jiraKey).filter(Boolean) as string[])];
            const matchedCRs = ongoingKeys
              .map(key => tsCRs.find(cr => cr.crKey === key))
              .filter((cr): cr is TSCR => !!cr)
              .slice(0, 3);
            if (matchedCRs.length === 0) return null;
            return (
              <WidgetCard key="ts-tracker" icon={<ClipboardList size={15} className="text-amber-400" />} title="TS Tracker" href="/tests">
                <div className="space-y-3">
                  {matchedCRs.map(cr => {
                    const all = cr.suites.flatMap(s => s.cases).filter(c => !c.disabled);
                    const pass = all.filter(c => c.status === "pass").length;
                    const fail = all.filter(c => c.status === "fail").length;
                    const wip  = all.filter(c => c.status === "in-progress").length;
                    const done = pass + fail + wip;
                    const passPct = all.length ? Math.round((pass / all.length) * 100) : 0;
                    const failPct = all.length ? Math.round((fail / all.length) * 100) : 0;
                    const wipPct  = all.length ? Math.round((wip  / all.length) * 100) : 0;
                    return (
                      <Link key={cr.id} href="/tests" className="block px-3 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/60 hover:bg-slate-800 transition-colors">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] font-mono text-blue-400 font-bold shrink-0">{cr.crKey}</span>
                          <span className="text-xs text-slate-300 flex-1 truncate">{cr.crSummary}</span>
                        </div>
                        <div className="flex items-center gap-3 mb-2 text-[11px]">
                          <span className="text-slate-400">{done}/{all.length} done</span>
                          <span className="font-semibold text-green-400">{passPct}%</span>
                          {wip > 0  && <span className="text-amber-400">{wip} wip</span>}
                          {fail > 0 && <span className="text-red-400">{fail} fail</span>}
                          {pass > 0 && <span className="text-green-400 ml-auto">{pass} pass</span>}
                        </div>
                        {all.length > 0 && (
                          <div className="flex h-1.5 rounded-full overflow-hidden bg-slate-700">
                            <div className="h-full bg-green-500 transition-all" style={{ width: `${passPct}%` }} />
                            <div className="h-full bg-amber-500 transition-all" style={{ width: `${wipPct}%` }} />
                            <div className="h-full bg-red-500 transition-all"   style={{ width: `${failPct}%` }} />
                          </div>
                        )}
                        {all.length === 0 && <p className="text-[11px] text-slate-600">No test cases yet</p>}
                      </Link>
                    );
                  })}
                </div>
              </WidgetCard>
            );
          }

          // ── Raised Tickets + Completed Today ───────────────
          if (w.id === "raised" && creds) {
            return (
              <div key="raised" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Raised Tickets */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
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

                {/* Completed Today */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCheck size={15} className="text-green-400" />
                    <h2 className="text-sm font-semibold text-slate-200">Completed Today</h2>
                    {completedToday.length > 0 && <span className="text-xs bg-green-900/40 text-green-300 border border-green-800/50 px-1.5 py-0.5 rounded-full font-semibold">{completedToday.length}</span>}
                    {completedTodayLoading && <Loader2 size={13} className="animate-spin text-green-400" />}
                  </div>
                  {completedTodayLoading && completedToday.length === 0 ? (
                    <div className="flex items-center justify-center py-8 text-slate-600"><Loader2 size={18} className="animate-spin mr-2" /> Loading…</div>
                  ) : completedToday.length === 0 ? (
                    <div className="flex flex-col items-center py-8 text-slate-600">
                      <CheckCheck size={24} className="mb-2 opacity-40" />
                      <p className="text-sm">No tickets completed today</p>
                      <p className="text-xs mt-1 text-slate-700">Tickets you move to Done/Closed today will appear here</p>
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      {completedToday.map(issue => (
                        <IssueCard key={issue.id} issue={issue} baseUrl={creds.baseUrl} onClick={() => setSelectedKey(issue.key)} onParentClick={key => setSelectedKey(key)} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          }

          // ── Jira Overview link ─────────────────────────────
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
