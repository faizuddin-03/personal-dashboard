"use client";
import { useState } from "react";
import { X, CheckCheck, Clock } from "lucide-react";
import clsx from "clsx";
import RichTextEditor from "@/components/RichTextEditor";
import { TodoItem, SubTask, TodoPriority, TODO_PRIORITY_META, formatDuration } from "@/lib/todo";

function newId() { return crypto.randomUUID(); }

// Moved from app/todo/page.tsx (2026-10-21); behaviour unchanged apart from
// Escape-to-close, the isNew flag (templates) and the recorded focus time.
export default function TodoModal({ item, isNew, onClose, onSave }: {
  item?: TodoItem;
  isNew?: boolean;
  onClose: () => void;
  onSave: (item: TodoItem) => void;
}) {
  const [title, setTitle]       = useState(item?.title ?? "");
  const [note, setNote]         = useState(item?.note ?? "");
  const [priority, setPriority] = useState<TodoPriority>(item?.priority ?? "medium");
  const [dueDate, setDueDate]   = useState(item?.dueDate ?? "");
  const [labelInput, setLabelInput] = useState("");
  const [labels, setLabels]     = useState<string[]>(item?.labels ?? []);
  const [recurring, setRecurring] = useState<"" | "daily" | "weekly" | "monthly">(item?.recurring ?? "");
  const [jiraKey, setJiraKey]   = useState(item?.jiraKey ?? "");
  const [subtasks, setSubtasks] = useState<SubTask[]>(item?.subtasks ?? []);
  const [stInput, setStInput]   = useState("");

  function addLabel(e: React.KeyboardEvent) {
    if (e.key === "Enter" && labelInput.trim()) {
      e.preventDefault();
      setLabels(p => [...p, labelInput.trim()]);
      setLabelInput("");
    }
  }

  function addSubtask(e: React.KeyboardEvent) {
    if (e.key === "Enter" && stInput.trim()) {
      e.preventDefault();
      setSubtasks(p => [...p, { id: newId(), title: stInput.trim(), done: false }]);
      setStInput("");
    }
  }

  function handleSave() {
    if (!title.trim()) return;
    onSave({
      id: item?.id ?? newId(),
      title: title.trim(),
      note,
      done: item?.done ?? false,
      priority,
      dueDate: dueDate || undefined,
      labels,
      createdAt: item?.createdAt ?? new Date().toISOString(),
      doneAt: item?.doneAt,
      recurring: recurring || undefined,
      jiraKey: jiraKey.trim().toUpperCase() || undefined,
      subtasks: subtasks.length > 0 ? subtasks : undefined,
      timeSpentSec: item?.timeSpentSec,
    });
    onClose();
  }

  const editing = !!item && !isNew;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onKeyDown={e => { if (e.key === "Escape") onClose(); }}
    >
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-800 shrink-0">
          <h2 className="text-sm font-semibold text-slate-100">{editing ? "Edit Task" : "New Task"}</h2>
          <div className="flex items-center gap-3">
            {(item?.timeSpentSec ?? 0) > 0 && (
              <span className="flex items-center gap-1 text-xs text-rose-400" title="Time recorded by the focus timer"><Clock size={12} />{formatDuration(item?.timeSpentSec ?? 0)} focused</span>
            )}
            <button onClick={onClose} aria-label="Close" className="text-slate-500 hover:text-slate-300 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"><X size={18} /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className={lbl}>Title *</label>
            <input autoFocus value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSave()} placeholder="What needs to be done?" className={inp} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value as TodoPriority)} className={sel}>
                {Object.entries(TODO_PRIORITY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Due Date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={inp + " [color-scheme:dark]"} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Recurring</label>
              <select value={recurring} onChange={e => setRecurring(e.target.value as "" | "daily" | "weekly" | "monthly")} className={sel}>
                <option value="">None</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label className={lbl}>Jira Ticket</label>
              <input value={jiraKey} onChange={e => setJiraKey(e.target.value)} placeholder="e.g. QA-123" className={inp} />
            </div>
          </div>
          <div>
            <label className={lbl}>Labels <span className="text-slate-600">(Enter to add)</span></label>
            <input value={labelInput} onChange={e => setLabelInput(e.target.value)} onKeyDown={addLabel} placeholder="Add label…" className={inp} />
            {labels.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {labels.map(l => (
                  <span key={l} className="flex items-center gap-1 bg-slate-800 border border-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded-full">
                    {l}<button type="button" onClick={() => setLabels(p => p.filter(x => x !== l))}><X size={10} /></button>
                  </span>
                ))}
              </div>
            )}
          </div>
          {/* Subtasks */}
          <div>
            <label className={lbl}>Subtasks <span className="text-slate-600">(Enter to add)</span></label>
            <input value={stInput} onChange={e => setStInput(e.target.value)} onKeyDown={addSubtask} placeholder="Add subtask…" className={inp} />
            {subtasks.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {subtasks.map(st => (
                  <div key={st.id} className="flex items-center gap-2 py-1">
                    <button
                      type="button"
                      onClick={() => setSubtasks(p => p.map(s => s.id === st.id ? { ...s, done: !s.done } : s))}
                      className={clsx("w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors", st.done ? "bg-blue-600 border-blue-600" : "border-slate-600")}
                    >
                      {st.done && <CheckCheck size={9} className="text-white" />}
                    </button>
                    <span className={clsx("flex-1 text-xs", st.done ? "line-through text-slate-600" : "text-slate-300")}>{st.title}</span>
                    <button type="button" onClick={() => setSubtasks(p => p.filter(s => s.id !== st.id))} className="text-slate-700 hover:text-red-400"><X size={11} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className={lbl}>Notes <span className="text-slate-600">(rich text)</span></label>
            <RichTextEditor content={note} onChange={setNote} placeholder="Add notes, links, or details…" minHeight="140px" />
          </div>
        </div>
        <div className="p-5 border-t border-slate-800 shrink-0">
          <button onClick={handleSave} disabled={!title.trim()} className="w-full py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-40 font-medium">
            {editing ? "Save Changes" : "Add Task"}
          </button>
        </div>
      </div>
    </div>
  );
}

const lbl = "block text-xs font-medium text-slate-400 mb-1.5";
const inp = "w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600";
const sel = "w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-800 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600";
