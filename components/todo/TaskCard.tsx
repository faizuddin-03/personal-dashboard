"use client";
import { useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Check, ChevronDown, ChevronRight, CalendarDays, Flag, Pencil, Trash2, RefreshCw,
  SkipForward, Timer, MoreHorizontal, Clock, AlertTriangle, StickyNote, ListChecks, MoonStar,
} from "lucide-react";
import clsx from "clsx";
import {
  TodoItem, TodoPriority, TODO_PRIORITY_META, daysUntil, formatDue, formatDuration, stripHtml,
  addDaysISO,
} from "@/lib/todo";
import type { TodoApi } from "./useTodos";
import { FOCUS_PRESETS } from "./useFocusTimer";
import Popover, { MenuItem } from "./Popover";

export function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/\bon\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\bon\w+\s*=\s*'[^']*'/gi, "")
    .replace(/javascript\s*:/gi, "");
}

export const PRIORITY_STRIP: Record<TodoPriority, string> = {
  high: "bg-orange-500", medium: "bg-yellow-500", low: "bg-slate-600",
};

const CHIP_TONES = [
  "text-sky-400 bg-sky-500/10 border-sky-500/25",
  "text-violet-400 bg-violet-500/10 border-violet-500/25",
  "text-pink-400 bg-pink-500/10 border-pink-500/25",
  "text-teal-400 bg-teal-500/10 border-teal-500/25",
  "text-amber-400 bg-amber-500/10 border-amber-500/25",
  "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
  "text-indigo-400 bg-indigo-500/10 border-indigo-500/25",
  "text-rose-400 bg-rose-500/10 border-rose-500/25",
];

/** Same label, same colour, everywhere. */
export function labelTone(label: string): string {
  let h = 0;
  for (let i = 0; i < label.length; i++) h = (h * 31 + label.charCodeAt(i)) >>> 0;
  return CHIP_TONES[h % CHIP_TONES.length];
}

export function DueChip({ item }: { item: TodoItem }) {
  if (!item.dueDate) return null;
  const n = daysUntil(item.dueDate);
  const tone = item.done ? "text-slate-500 border-slate-700 bg-transparent"
    : n < 0 ? "text-red-400 border-red-500/30 bg-red-500/10"
    : n <= 1 ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
    : "text-slate-400 border-slate-700 bg-slate-800/60";
  return (
    <span className={clsx("inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-md border", tone)}>
      {n < 0 && !item.done ? <AlertTriangle size={10} /> : <CalendarDays size={10} />}
      {formatDue(item.dueDate)}
    </span>
  );
}

export function JiraChip({ jiraKey }: { jiraKey: string }) {
  return (
    <Link
      href={`/jira/${jiraKey}`}
      onClick={e => e.stopPropagation()}
      title={`Open ${jiraKey}`}
      className="shrink-0 inline-flex items-center text-[11px] font-mono px-1.5 py-0.5 rounded-md border border-sky-500/30 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
    >
      {jiraKey}
    </Link>
  );
}

export function CheckButton({ done, celebrating, onClick, size = "md" }: {
  done: boolean; celebrating: boolean; onClick: (el: HTMLElement) => void; size?: "md" | "lg";
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const filled = done || celebrating;
  return (
    <button
      ref={ref}
      type="button"
      onClick={() => ref.current && onClick(ref.current)}
      aria-label={done ? "Mark as not done" : "Mark as done"}
      className={clsx(
        "relative shrink-0 rounded-full border-2 flex items-center justify-center transition-all duration-300",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:ring-green-500",
        size === "lg" ? "w-7 h-7" : "w-[22px] h-[22px]",
        filled ? "bg-green-500 border-green-500 scale-110" : "border-slate-600 hover:border-green-500 hover:bg-green-500/10",
      )}
    >
      {celebrating && <span className="absolute inset-0 rounded-full bg-green-500/60 motion-safe:animate-ping" />}
      <Check size={size === "lg" ? 15 : 12} strokeWidth={3} className={clsx("transition-all duration-300", filled ? "text-white scale-100" : "text-green-500 scale-0")} />
    </button>
  );
}

interface Props {
  item: TodoItem;
  api: TodoApi;
  onEdit: () => void;
  onStartFocus: (minutes: number) => void;
  focusing?: boolean;
  selectMode?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  dragHandle?: ReactNode;
  dense?: boolean;
  /** Always use the "more" menu (narrow containers such as the floating mini). */
  menuOnly?: boolean;
}

export default function TaskCard({
  item, api, onEdit, onStartFocus, focusing, selectMode, selected, onSelect, dragHandle, dense, menuOnly,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [stInput, setStInput] = useState("");
  const dateRef = useRef<HTMLInputElement>(null);

  const leaving = api.leavingIds.has(item.id);
  const celebrating = api.justDone.has(item.id);
  const subtasks = item.subtasks ?? [];
  const stDone = subtasks.filter(s => s.done).length;
  const notePreview = stripHtml(item.note);
  const canExpand = subtasks.length > 0 || notePreview.length > 0;
  const pm = TODO_PRIORITY_META[item.priority];

  const setPriority = (p: TodoPriority) => api.update(item.id, { priority: p });
  const setDate = (d: string | undefined) => api.update(item.id, { dueDate: d });

  const dateMenu = (close: () => void) => (
    <div className="space-y-0.5">
      <MenuItem onClick={() => { setDate(addDaysISO(0)); close(); }}>Today</MenuItem>
      <MenuItem onClick={() => { setDate(addDaysISO(1)); close(); }}>Tomorrow</MenuItem>
      <MenuItem onClick={() => { setDate(addDaysISO(7)); close(); }}>Next week</MenuItem>
      {item.dueDate && !item.done && (
        <>
          <div className="h-px bg-slate-800 my-1" />
          <p className="px-2.5 pt-1 text-[10px] uppercase tracking-wider text-slate-500">Snooze</p>
          <MenuItem onClick={() => { api.snooze(item.id, 1); close(); }}><MoonStar size={12} /> To tomorrow</MenuItem>
          <MenuItem onClick={() => { api.snooze(item.id, 7); close(); }}><MoonStar size={12} /> To next week</MenuItem>
        </>
      )}
      {item.recurring && !item.done && (
        <MenuItem onClick={() => { api.skip(item.id); close(); }}><SkipForward size={12} /> Skip this occurrence</MenuItem>
      )}
      <div className="h-px bg-slate-800 my-1" />
      <label className="flex items-center gap-2 px-2.5 py-1 text-xs text-slate-400">
        Pick
        <input
          ref={dateRef}
          type="date"
          defaultValue={item.dueDate ?? ""}
          onChange={e => { if (e.target.value) { setDate(e.target.value); close(); } }}
          className="flex-1 min-w-0 bg-slate-800 border border-slate-700 rounded-md px-1.5 py-0.5 text-xs text-slate-200 [color-scheme:dark] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        />
      </label>
      {item.dueDate && <MenuItem danger onClick={() => { setDate(undefined); close(); }}>Clear date</MenuItem>}
    </div>
  );

  const priorityMenu = (close: () => void) => (
    <div className="space-y-0.5">
      {(["high", "medium", "low"] as TodoPriority[]).map(p => (
        <MenuItem key={p} active={item.priority === p} onClick={() => { setPriority(p); close(); }}>
          <span className={clsx("w-2 h-2 rounded-full", PRIORITY_STRIP[p])} /> {TODO_PRIORITY_META[p].label}
        </MenuItem>
      ))}
    </div>
  );

  const focusMenu = (close: () => void) => (
    <div className="space-y-0.5">
      <p className="px-2.5 pt-1 pb-0.5 text-[10px] uppercase tracking-wider text-slate-500">Focus on this</p>
      {FOCUS_PRESETS.map(m => (
        <MenuItem key={m} onClick={() => { onStartFocus(m); close(); }}><Timer size={12} /> {m} minutes</MenuItem>
      ))}
    </div>
  );

  const deleteControl = confirmDelete ? (
    <div className="flex items-center gap-1">
      <span className="text-xs text-red-400">Delete?</span>
      <button type="button" onClick={() => { setConfirmDelete(false); api.remove(item.id); }} className="px-2 py-0.5 text-xs bg-red-700 text-white rounded hover:bg-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400">Yes</button>
      <button type="button" onClick={() => setConfirmDelete(false)} className="px-2 py-0.5 text-xs border border-slate-700 text-slate-400 rounded hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">No</button>
    </div>
  ) : null;

  return (
    <div
      className={clsx(
        "group relative rounded-2xl border transition-all duration-300 ease-out",
        leaving ? "opacity-0 translate-x-6 scale-[0.97]" : "opacity-100",
        selected ? "border-blue-500/60 bg-blue-500/5"
          : item.done ? "border-slate-800 bg-slate-900/50"
          : focusing ? "border-rose-500/40 bg-slate-900 shadow-lg shadow-rose-500/5"
          : "border-slate-800 bg-slate-900 hover:border-slate-700 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-px",
      )}
    >
      {/* Priority strip */}
      {!item.done && <span className={clsx("absolute left-0 top-3 bottom-3 w-1 rounded-r-full", PRIORITY_STRIP[item.priority])} aria-hidden="true" />}

      <div className={clsx("flex items-start gap-3", dense ? "pl-3.5 pr-2.5 py-2.5" : "pl-4 pr-3 py-3.5")}>
        {selectMode ? (
          <button
            type="button"
            onClick={onSelect}
            aria-label={selected ? "Deselect" : "Select"}
            className={clsx("mt-0.5 w-5 h-5 rounded-md border-2 shrink-0 flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
              selected ? "bg-blue-600 border-blue-600" : "border-slate-600 hover:border-slate-400")}
          >
            {selected && <Check size={11} strokeWidth={3} className="text-white" />}
          </button>
        ) : dragHandle ? <div className="mt-0.5 -ml-2 shrink-0">{dragHandle}</div> : null}

        <div className="mt-px">
          <CheckButton done={item.done} celebrating={celebrating} onClick={el => api.toggle(item.id, el)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <button
              type="button"
              onClick={onEdit}
              className={clsx(
                "text-left text-sm leading-snug min-w-0 break-words rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                item.done ? "text-slate-500 line-through" : "text-slate-100 hover:text-white",
                celebrating && "line-through text-slate-500",
              )}
            >
              {item.title}
            </button>
            {item.jiraKey && <JiraChip jiraKey={item.jiraKey} />}
          </div>

          {/* Meta line */}
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            {!item.done && item.priority !== "medium" && (
              <span className={clsx("inline-flex items-center gap-1 text-[11px]", pm.color)}>
                <Flag size={10} /> {pm.label}
              </span>
            )}
            <DueChip item={item} />
            {item.recurring && (
              <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-md border border-sky-500/25 bg-sky-500/10 text-sky-400" title={`Repeats ${item.recurring}`}>
                <RefreshCw size={10} /> {item.recurring}
              </span>
            )}
            {item.labels.map(l => (
              <span key={l} className={clsx("text-[11px] px-1.5 py-0.5 rounded-md border", item.done ? "text-slate-500 border-slate-700" : labelTone(l))}>#{l}</span>
            ))}
            {subtasks.length > 0 && (
              <button
                type="button"
                onClick={() => setExpanded(v => !v)}
                className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-200 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                title="Show subtasks"
              >
                <ListChecks size={11} />
                <span className="w-12 h-1 rounded-full bg-slate-700 overflow-hidden">
                  <span
                    className={clsx("block h-full rounded-full transition-all duration-500", stDone === subtasks.length ? "bg-green-500" : "bg-blue-500")}
                    style={{ width: `${(stDone / subtasks.length) * 100}%` }}
                  />
                </span>
                {stDone}/{subtasks.length}
              </button>
            )}
            {(item.timeSpentSec ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] text-rose-400" title="Time recorded by the focus timer">
                <Clock size={10} /> {formatDuration(item.timeSpentSec ?? 0)}
              </span>
            )}
          </div>

          {notePreview && !expanded && (
            <button type="button" onClick={() => setExpanded(true)} className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 text-left max-w-full rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
              <StickyNote size={11} className="shrink-0" />
              <span className="truncate">{notePreview}</span>
            </button>
          )}

          {/* Expanded body */}
          {expanded && (
            <div className="mt-3 space-y-2">
              {subtasks.map(st => (
                <label key={st.id} className="flex items-center gap-2 cursor-pointer group/st">
                  <input
                    type="checkbox"
                    checked={st.done}
                    onChange={() => api.toggleSubtask(item.id, st.id)}
                    className="w-3.5 h-3.5 rounded accent-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  />
                  <span className={clsx("text-xs flex-1", st.done ? "line-through text-slate-500" : "text-slate-300")}>{st.title}</span>
                </label>
              ))}
              <form
                onSubmit={e => {
                  e.preventDefault();
                  if (stInput.trim()) { api.addSubtask(item.id, stInput.trim()); setStInput(""); }
                }}
              >
                <input
                  value={stInput}
                  onChange={e => setStInput(e.target.value)}
                  placeholder="+ Add subtask, Enter to save"
                  className="w-full bg-transparent text-xs text-slate-300 placeholder-slate-600 border-b border-slate-800 pb-1 focus:outline-none focus:border-blue-500"
                />
              </form>
              {notePreview && (
                <div className="text-sm text-slate-400 bg-slate-950/40 border border-slate-800 rounded-xl px-3 py-2" dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.note) }} />
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 shrink-0">
          {deleteControl ?? (
            <>
              <div className={clsx(menuOnly ? "hidden" : "hidden sm:flex", "items-center gap-0.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity")}>
                {!item.done && <Popover title="Start focus timer" icon={<Timer size={14} />}>{focusMenu}</Popover>}
                <Popover title="Set date" icon={<CalendarDays size={14} />}>{dateMenu}</Popover>
                <Popover title="Set priority" icon={<Flag size={14} />}>{priorityMenu}</Popover>
                <IconBtn title="Edit" onClick={onEdit}><Pencil size={14} /></IconBtn>
                <IconBtn title="Delete" danger onClick={() => setConfirmDelete(true)}><Trash2 size={14} /></IconBtn>
              </div>
              <div className={menuOnly ? "" : "sm:hidden"}>
                <Popover title="Task actions" icon={<MoreHorizontal size={16} />}>
                  {close => (
                    <div className="space-y-0.5 w-52">
                      <MenuItem onClick={() => { onEdit(); close(); }}><Pencil size={12} /> Edit</MenuItem>
                      {!item.done && FOCUS_PRESETS.slice(1, 2).map(m => (
                        <MenuItem key={m} onClick={() => { onStartFocus(m); close(); }}><Timer size={12} /> Focus {m} min</MenuItem>
                      ))}
                      <div className="h-px bg-slate-800 my-1" />
                      {dateMenu(close)}
                      <div className="h-px bg-slate-800 my-1" />
                      {priorityMenu(close)}
                      <div className="h-px bg-slate-800 my-1" />
                      <MenuItem danger onClick={() => { setConfirmDelete(true); close(); }}><Trash2 size={12} /> Delete</MenuItem>
                    </div>
                  )}
                </Popover>
              </div>
              {canExpand && (
                <IconBtn title={expanded ? "Collapse" : "Expand"} onClick={() => setExpanded(v => !v)}>
                  {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </IconBtn>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function IconBtn({ title, onClick, children, danger }: { title: string; onClick: () => void; children: ReactNode; danger?: boolean }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={clsx(
        "p-1.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        danger ? "text-slate-500 hover:text-red-400 hover:bg-red-500/10" : "text-slate-500 hover:text-slate-200 hover:bg-slate-800",
      )}
    >
      {children}
    </button>
  );
}
