"use client";
import { useMemo, useState, type RefObject } from "react";
import { Plus, Sparkles, CalendarDays, Flag, RefreshCw, Hash, LayoutTemplate, HelpCircle } from "lucide-react";
import clsx from "clsx";
import {
  parseQuickAdd, formatDue, TODO_PRIORITY_META, TODO_TEMPLATES, addDaysISO,
  type ParsedQuickAdd, type TodoTemplate,
} from "@/lib/todo";
import Popover, { MenuItem } from "./Popover";
import { labelTone } from "./TaskCard";

export const QUICK_ADD_HINT = "Add a task… try: Retest EAINT-12107 tomorrow !high #retest";

export function templateToTask(t: TodoTemplate) {
  return {
    title: t.title.trim(),
    priority: t.priority,
    labels: [...t.labels],
    dueDate: t.dueInDays !== undefined ? addDaysISO(t.dueInDays) : undefined,
    recurring: t.recurring,
    subtasks: t.subtasks.map(s => ({ id: crypto.randomUUID(), title: s, done: false })),
  };
}

export default function QuickAdd({ onAdd, onTemplate, inputRef, compact }: {
  onAdd: (p: ParsedQuickAdd) => void;
  /** Template chosen: the page opens it in the editor so the title can be finished. */
  onTemplate?: (t: TodoTemplate) => void;
  inputRef?: RefObject<HTMLInputElement | null>;
  compact?: boolean;
}) {
  const [text, setText] = useState("");
  const parsed = useMemo(() => parseQuickAdd(text), [text]);
  const hasTokens = !!(parsed.dueDate || parsed.priority || parsed.labels.length || parsed.recurring || parsed.jiraKey);

  function submit() {
    if (!parsed.title) return;
    onAdd(parsed);
    setText("");
  }

  return (
    <div className={clsx(
      "rounded-2xl border border-slate-700 bg-slate-900 transition-colors focus-within:border-blue-500/60 focus-within:shadow-lg focus-within:shadow-blue-500/5",
      compact ? "px-2.5 py-1.5" : "px-3.5 py-2.5",
    )}>
      <form onSubmit={e => { e.preventDefault(); submit(); }} className="flex items-center gap-2">
        <Plus size={16} className="text-slate-500 shrink-0" />
        <input
          ref={inputRef}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={compact ? "Add… (tomorrow !high #tag)" : QUICK_ADD_HINT}
          aria-label="Quick add task"
          className="flex-1 min-w-0 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none py-1"
        />
        {!compact && (
          <Popover title="Quick-add shortcuts" icon={<HelpCircle size={14} />}>
            {() => (
              <div className="w-64 p-2 text-xs text-slate-400 space-y-1.5">
                <p className="text-slate-200 font-medium">Shortcuts</p>
                <p><code className="text-sky-400">today</code> <code className="text-sky-400">tomorrow</code> <code className="text-sky-400">tmr</code> <code className="text-sky-400">fri</code> <code className="text-sky-400">next week</code> <code className="text-sky-400">2026-10-30</code>: due date</p>
                <p><code className="text-orange-400">!high</code> <code className="text-yellow-400">!med</code> <code className="text-slate-300">!low</code>: priority (or !1 !2 !3)</p>
                <p><code className="text-violet-400">#tag</code>: label, as many as you like</p>
                <p><code className="text-sky-400">every day</code> / <code className="text-sky-400">every week</code> / <code className="text-sky-400">every month</code>: repeat</p>
                <p>A Jira key such as <code className="text-sky-400">EAINT-12107</code> becomes a link chip.</p>
                <p className="text-slate-500">Press N anywhere on the page to jump here.</p>
              </div>
            )}
          </Popover>
        )}
        {onTemplate && (
          <Popover title="QA routine templates" icon={<LayoutTemplate size={14} />} label={compact ? undefined : <span className="hidden md:inline text-xs">Templates</span>}>
            {close => (
              <div className="w-60 space-y-0.5">
                <p className="px-2.5 pt-1 pb-1 text-[10px] uppercase tracking-wider text-slate-500">QA routines</p>
                {TODO_TEMPLATES.map(t => (
                  <MenuItem key={t.id} onClick={() => { onTemplate(t); close(); }}>
                    <Sparkles size={12} className="text-amber-400" />
                    <span className="flex-1">{t.name}</span>
                    <span className="text-[10px] text-slate-500">{t.subtasks.length} steps</span>
                  </MenuItem>
                ))}
              </div>
            )}
          </Popover>
        )}
        <button
          type="submit"
          disabled={!parsed.title}
          className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          Add
        </button>
      </form>

      {/* Live preview of what the shortcuts parsed */}
      {hasTokens && (
        <div className="flex flex-wrap items-center gap-1.5 mt-2 pl-6">
          <span className="text-[11px] text-slate-500 truncate max-w-full">&ldquo;{parsed.title || "…"}&rdquo;</span>
          {parsed.dueDate && <Token icon={<CalendarDays size={10} />} className="text-amber-400 border-amber-500/30 bg-amber-500/10">{formatDue(parsed.dueDate)}</Token>}
          {parsed.priority && <Token icon={<Flag size={10} />} className={clsx(TODO_PRIORITY_META[parsed.priority].color, "border-slate-700 bg-slate-800/60")}>{TODO_PRIORITY_META[parsed.priority].label}</Token>}
          {parsed.recurring && <Token icon={<RefreshCw size={10} />} className="text-sky-400 border-sky-500/30 bg-sky-500/10">{parsed.recurring}</Token>}
          {parsed.labels.map(l => <Token key={l} icon={<Hash size={10} />} className={labelTone(l)}>{l}</Token>)}
          {parsed.jiraKey && <Token className="font-mono text-sky-400 border-sky-500/30 bg-sky-500/10">{parsed.jiraKey}</Token>}
        </div>
      )}
    </div>
  );
}

function Token({ icon, children, className }: { icon?: React.ReactNode; children: React.ReactNode; className: string }) {
  return <span className={clsx("inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-md border", className)}>{icon}{children}</span>;
}
