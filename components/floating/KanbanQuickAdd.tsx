"use client";
// Quick-add for Kanban tasks in the bottom-right dock (Faizuddin, 2026-10-29:
// "add function to add Kanban Tasks (not CR. tasks only)"). Always a task
// card; CRs stay on the Kanban page and the CR auto-sync.
import { useState } from "react";
import Link from "next/link";
import { Check, Plus } from "lucide-react";
import clsx from "clsx";
import { addKanbanTask, COLUMN_META, PRIORITY_META, type ColumnId, type Priority } from "@/lib/kanban";

// Finished is left out: a new task is never already done.
const COLUMNS: ColumnId[] = ["todo", "urgent", "ongoing", "on-hold"];
const PRIORITIES: Priority[] = ["urgent", "high", "medium", "low"];

const field = "w-full rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-[13px] text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500";

export default function KanbanQuickAdd() {
  const [title, setTitle] = useState("");
  const [columnId, setColumnId] = useState<ColumnId>("todo");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [added, setAdded] = useState<string | null>(null);

  function add() {
    if (!title.trim()) return;
    const card = addKanbanTask({ title, columnId, priority, dueDate, description });
    setAdded(`"${card.title}" added to ${COLUMN_META[columnId].label}`);
    setTitle(""); setDueDate(""); setDescription("");
    setTimeout(() => setAdded(null), 3000);
  }

  return (
    <form
      className="h-full flex flex-col gap-2.5 p-3 overflow-y-auto"
      onSubmit={e => { e.preventDefault(); add(); }}
    >
      <label className="block">
        <span className="text-[11px] text-slate-400">Task</span>
        <input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="What needs doing?" className={field} />
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-[11px] text-slate-400">Column</span>
          <select value={columnId} onChange={e => setColumnId(e.target.value as ColumnId)} className={field}>
            {COLUMNS.map(c => <option key={c} value={c}>{COLUMN_META[c].label}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-[11px] text-slate-400">Due date (optional)</span>
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={clsx(field, "[color-scheme:dark]")} />
        </label>
      </div>

      <div>
        <span className="text-[11px] text-slate-400">Priority</span>
        <div className="mt-1 grid grid-cols-4 gap-1" role="radiogroup" aria-label="Priority">
          {PRIORITIES.map(p => (
            <button key={p} type="button" role="radio" aria-checked={priority === p} onClick={() => setPriority(p)}
              className={clsx("flex items-center justify-center gap-1 rounded-lg border px-1.5 py-1 text-xs",
                priority === p ? "border-blue-500 bg-slate-800 text-slate-100" : "border-slate-700 text-slate-400 hover:border-slate-600")}>
              <span className={clsx("w-1.5 h-1.5 rounded-full", PRIORITY_META[p].dot)} />{PRIORITY_META[p].label}
            </button>
          ))}
        </div>
      </div>

      <label className="block flex-1 min-h-[3.5rem]">
        <span className="text-[11px] text-slate-400">Notes (optional)</span>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
          className={clsx(field, "resize-none h-[calc(100%-1.25rem)] min-h-[3rem]")} />
      </label>

      <div className="flex items-center gap-2">
        <button type="submit" disabled={!title.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-500 disabled:opacity-40">
          <Plus size={14} /> Add task
        </button>
        <Link href="/kanban" className="text-xs text-blue-400 hover:underline">Open Kanban</Link>
      </div>
      {added && (
        <p role="status" className="flex items-center gap-1.5 text-xs text-emerald-400">
          <Check size={12} className="shrink-0" /> <span className="truncate">{added}</span>
        </p>
      )}
    </form>
  );
}
