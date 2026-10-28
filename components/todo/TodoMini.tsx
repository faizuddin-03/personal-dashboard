"use client";
import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { Flame, ExternalLink, Sun, CalendarClock } from "lucide-react";
import clsx from "clsx";
import { TodoItem, daysUntil, addDaysISO, formatDuration, type ParsedQuickAdd } from "@/lib/todo";
import { usePathname, useRouter } from "next/navigation";
import { useTodos } from "./useTodos";
import { useFocusTimer } from "./useFocusTimer";
import QuickAdd from "./QuickAdd";
import TaskCard from "./TaskCard";
import FocusTimerBar from "./FocusTimerBar";
import Toast from "./Toast";
import { ProgressRing, XpBar } from "./SummaryHeader";

/**
 * Self-contained to-do panel for the floating window (~360x480).
 * Shows overdue + today, quick add, tick to complete (XP + confetti) and the
 * shared focus timer. Syncs with /todo through the `todos-updated` event.
 */
export default function TodoMini() {
  const api = useTodos();
  const { todos, stats, showToast } = api;
  const onTimerDone = useCallback((title: string, sec: number) => {
    showToast(`Focus done: ${formatDuration(sec)} on "${title}"`, "party");
  }, [showToast]);
  const timer = useFocusTimer(onTimerDone);
  const [tab, setTab] = useState<"today" | "next">("today");
  const router = useRouter();
  const pathname = usePathname();

  const { dueNow, upNext } = useMemo(() => {
    const dueNow: TodoItem[] = [];
    const upNext: TodoItem[] = [];
    for (const t of todos) {
      if (t.done) continue;
      if (t.dueDate && daysUntil(t.dueDate) <= 0) dueNow.push(t);
      else if (t.dueDate && daysUntil(t.dueDate) <= 7) upNext.push(t);
    }
    const byDue = (a: TodoItem, b: TodoItem) => (a.dueDate ?? "").localeCompare(b.dueDate ?? "");
    return { dueNow: dueNow.sort(byDue), upNext: upNext.sort(byDue) };
  }, [todos]);

  const shown = (tab === "today" ? dueNow : upNext);

  function handleAdd(p: ParsedQuickAdd) {
    api.add({
      title: p.title,
      priority: p.priority ?? "medium",
      labels: p.labels,
      // Added from the mini with no date: due today, so it shows up here.
      dueDate: p.dueDate ?? (tab === "today" ? addDaysISO(0) : undefined),
      recurring: p.recurring,
      jiraKey: p.jiraKey,
    });
  }

  function goEdit(item: TodoItem) {
    if (pathname === "/todo") window.dispatchEvent(new CustomEvent("todo-open-edit", { detail: item.id }));
    else router.push(`/todo?edit=${encodeURIComponent(item.id)}`);
  }

  return (
    <div className="relative h-full min-h-0 flex flex-col gap-3 p-3 bg-slate-950 text-slate-200">
      {/* Summary */}
      <div className="flex items-center gap-3 shrink-0">
        <ProgressRing value={stats.doneToday} total={stats.todayTotal} size={48} />
        <div className="flex-1 min-w-0">
          <XpBar xp={stats.xp} compact />
          <div className="flex items-center gap-3 mt-1.5 text-[11px]">
            <span className={clsx("flex items-center gap-1", stats.streak > 0 ? "text-orange-400" : "text-slate-500")}>
              <Flame size={11} /> {stats.streak}d streak
            </span>
            {stats.overdue > 0 && <span className="text-red-400">{stats.overdue} overdue</span>}
            <Link href="/todo" className="ml-auto flex items-center gap-1 text-slate-500 hover:text-slate-300 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
              Full list <ExternalLink size={10} />
            </Link>
          </div>
        </div>
      </div>

      <div className="shrink-0"><FocusTimerBar timer={timer} compact /></div>
      <div className="shrink-0"><QuickAdd onAdd={handleAdd} compact /></div>

      <div className="flex gap-0.5 bg-slate-900 border border-slate-800 rounded-xl p-0.5 shrink-0" role="tablist">
        {([
          { id: "today", label: "Today", count: dueNow.length, icon: Sun },
          { id: "next", label: "Next 7 days", count: upNext.length, icon: CalendarClock },
        ] as const).map(t => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={clsx("flex-1 flex items-center justify-center gap-1.5 py-1 text-xs rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
              tab === t.id ? "bg-slate-700 text-slate-100" : "text-slate-500 hover:text-slate-300")}
          >
            <t.icon size={12} /> {t.label}
            <span className="text-[10px] tabular-nums text-slate-400">{t.count}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-0.5 -mr-0.5">
        {shown.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-slate-300">{tab === "today" ? "All clear for today" : "Nothing in the next 7 days"}</p>
            <p className="text-xs text-slate-500 mt-1">{tab === "today" ? "Add a task above, or enjoy the calm." : "Type \"tomorrow\" or \"fri\" in the box to plan ahead."}</p>
          </div>
        ) : shown.map(item => (
          <TaskCard
            key={item.id}
            item={item}
            api={api}
            dense
            menuOnly
            focusing={timer.state?.taskId === item.id}
            onEdit={() => goEdit(item)}
            onStartFocus={m => timer.start(item.id, item.title, m)}
          />
        ))}
      </div>

      <Toast toast={api.toast} inline />
    </div>
  );
}
