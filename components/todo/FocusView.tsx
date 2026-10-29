"use client";
import { Target, Timer, PartyPopper } from "lucide-react";
import clsx from "clsx";
import { TodoItem, TodoPriority, daysUntil } from "@/lib/todo";
import type { TodoApi } from "./useTodos";
import { CheckButton, DueChip, JiraChip, PRIORITY_STRIP } from "./TaskCard";

const PRI: Record<TodoPriority, number> = { high: 0, medium: 1, low: 2 };

/** Today's top 3: overdue + due today, by priority then due date then list order. */
export function pickFocus(todos: TodoItem[]): { picks: TodoItem[]; suggested: boolean; more: number } {
  const order = new Map(todos.map((t, i) => [t.id, i]));
  const sort = (a: TodoItem, b: TodoItem) =>
    PRI[a.priority] - PRI[b.priority]
    || (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999")
    || (order.get(a.id)! - order.get(b.id)!);
  const due = todos.filter(t => !t.done && t.dueDate && daysUntil(t.dueDate) <= 0).sort(sort);
  if (due.length > 0) return { picks: due.slice(0, 3), suggested: false, more: Math.max(0, due.length - 3) };
  const rest = todos.filter(t => !t.done).sort(sort);
  return { picks: rest.slice(0, 3), suggested: true, more: 0 };
}

export default function FocusView({ todos, api, onStartFocus, focusTaskId, onEdit }: {
  todos: TodoItem[];
  api: TodoApi;
  onStartFocus: (item: TodoItem, minutes: number) => void;
  focusTaskId?: string;
  onEdit: (item: TodoItem) => void;
}) {
  const { picks, suggested, more } = pickFocus(todos);

  if (picks.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900 py-16 text-center">
        <PartyPopper size={36} className="mx-auto text-amber-400 mb-3" />
        <p className="text-slate-200 font-medium">Nothing left to focus on</p>
        <p className="text-slate-500 text-sm mt-1">Every task is done. Enjoy it.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Target size={16} className="text-rose-400" />
        {suggested ? "Nothing is due. Here are three good next picks." : "Just these. Everything else can wait."}
      </div>
      <div className="grid gap-4">
        {picks.map((t, i) => {
          const st = t.subtasks ?? [];
          return (
            <div
              key={t.id}
              className={clsx(
                "relative rounded-3xl border bg-slate-900 p-5 sm:p-6 transition-all duration-300",
                api.leavingIds.has(t.id) && "opacity-0 scale-[0.98]",
                focusTaskId === t.id ? "border-rose-500/40" : "border-slate-800",
              )}
            >
              <span className={clsx("absolute left-0 top-5 bottom-5 w-1.5 rounded-r-full", PRIORITY_STRIP[t.priority])} aria-hidden="true" />
              <div className="flex items-start gap-4">
                <span className="text-3xl font-bold text-slate-700 tabular-nums leading-none w-6 shrink-0">{i + 1}</span>
                <CheckButton size="lg" done={t.done} celebrating={api.justDone.has(t.id)} onClick={el => api.toggle(t.id, el)} />
                <div className="flex-1 min-w-0">
                  <button type="button" onClick={() => onEdit(t)} className="text-left text-base sm:text-lg text-slate-100 leading-snug break-words rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                    {t.title}
                  </button>
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <DueChip item={t} />
                    {t.jiraKey && <JiraChip jiraKey={t.jiraKey} />}
                  </div>
                  {st.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {st.map(s => (
                        <label key={s.id} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={s.done} onChange={() => api.toggleSubtask(t.id, s.id)} className="w-3.5 h-3.5 accent-blue-600" />
                          <span className={clsx("text-sm", s.done ? "line-through text-slate-500" : "text-slate-300")}>{s.title}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                {focusTaskId !== t.id && !t.done && (
                  <button
                    type="button"
                    onClick={() => onStartFocus(t, 25)}
                    className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                  >
                    <Timer size={13} /> Focus 25m
                  </button>
                )}
              </div>
              {focusTaskId !== t.id && !t.done && (
                <button
                  type="button"
                  onClick={() => onStartFocus(t, 25)}
                  className="sm:hidden mt-4 w-full flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-xl border border-rose-500/30 text-rose-400"
                >
                  <Timer size={13} /> Focus 25 min
                </button>
              )}
            </div>
          );
        })}
      </div>
      {more > 0 && <p className="text-xs text-slate-500 text-center">{more} more due today are hidden in Focus mode.</p>}
    </div>
  );
}
