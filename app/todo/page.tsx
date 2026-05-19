"use client";
import { useState, useEffect } from "react";
import {
  Plus, X, ChevronDown, ChevronRight, Clock, AlertTriangle, CheckCircle2,
} from "lucide-react";
import clsx from "clsx";
import RichTextEditor from "@/components/RichTextEditor";
import {
  TodoItem, TodoPriority, TODO_PRIORITY_META,
  getTodos, saveTodos, isTodoOverdue, isDueToday,
} from "@/lib/todo";

function newId() { return crypto.randomUUID(); }

type FilterTab = "all" | "active" | "done";

function groupTodos(items: TodoItem[]) {
  const active = items.filter(i => !i.done);
  const done   = items.filter(i => i.done);
  return {
    overdue:  active.filter(isTodoOverdue),
    today:    active.filter(i => isDueToday(i) && !isTodoOverdue(i)),
    upcoming: active.filter(i => i.dueDate && !isDueToday(i) && !isTodoOverdue(i)),
    noDate:   active.filter(i => !i.dueDate),
    done,
  };
}

// ── Add / Edit modal ────────────────────────────────────────
function TodoModal({ item, onClose, onSave }: {
  item?: TodoItem;
  onClose: () => void;
  onSave: (item: TodoItem) => void;
}) {
  const [title, setTitle]       = useState(item?.title ?? "");
  const [note, setNote]         = useState(item?.note ?? "");
  const [priority, setPriority] = useState<TodoPriority>(item?.priority ?? "medium");
  const [dueDate, setDueDate]   = useState(item?.dueDate ?? "");
  const [labelInput, setLabelInput] = useState("");
  const [labels, setLabels]     = useState<string[]>(item?.labels ?? []);

  function addLabel(e: React.KeyboardEvent) {
    if (e.key === "Enter" && labelInput.trim()) {
      setLabels(p => [...p, labelInput.trim()]);
      setLabelInput("");
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
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-800 shrink-0">
          <h2 className="text-sm font-semibold text-slate-100">{item ? "Edit Task" : "New Task"}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className={lbl}>Title *</label>
            <input
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSave()}
              placeholder="What needs to be done?"
              className={inp}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value as TodoPriority)} className={sel}>
                {Object.entries(TODO_PRIORITY_META).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={lbl}>Due Date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={inp + " [color-scheme:dark]"} />
            </div>
          </div>
          <div>
            <label className={lbl}>Labels <span className="text-slate-600">(Enter to add)</span></label>
            <input value={labelInput} onChange={e => setLabelInput(e.target.value)} onKeyDown={addLabel} placeholder="Add label…" className={inp} />
            {labels.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {labels.map(l => (
                  <span key={l} className="flex items-center gap-1 bg-slate-800 border border-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded-full">
                    {l}<button onClick={() => setLabels(p => p.filter(x => x !== l))}><X size={10} /></button>
                  </span>
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
            {item ? "Save Changes" : "Add Task"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Task row ────────────────────────────────────────────────
function TaskRow({ item, onToggle, onEdit, onDelete }: {
  item: TodoItem;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const pm = TODO_PRIORITY_META[item.priority];
  const overdue = isTodoOverdue(item);
  const today   = isDueToday(item);
  const hasNote = item.note && item.note !== "<p></p>";

  return (
    <div className={clsx(
      "bg-slate-900 border rounded-xl transition-all",
      item.done ? "border-slate-800 opacity-60" : overdue ? "border-red-800/60" : "border-slate-800 hover:border-slate-700"
    )}>
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Checkbox */}
        <button
          onClick={onToggle}
          className={clsx(
            "w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition-colors",
            item.done ? "bg-blue-600 border-blue-600" : "border-slate-600 hover:border-slate-400"
          )}
        >
          {item.done && <CheckCircle2 size={12} className="text-white" />}
        </button>

        {/* Title */}
        <span
          onClick={onEdit}
          className={clsx(
            "flex-1 text-sm cursor-pointer",
            item.done ? "text-slate-500 line-through" : "text-slate-200 hover:text-slate-100"
          )}
        >
          {item.title}
        </span>

        {/* Meta */}
        <div className="flex items-center gap-2 shrink-0">
          <span className={clsx("flex items-center gap-1 text-xs", pm.color)}>
            <span className={clsx("w-1.5 h-1.5 rounded-full", pm.dot)} />
            {pm.label}
          </span>
          {item.dueDate && (
            <span className={clsx(
              "flex items-center gap-1 text-xs",
              overdue ? "text-red-400" : today ? "text-yellow-400" : "text-slate-500"
            )}>
              {overdue ? <AlertTriangle size={11} /> : <Clock size={11} />}
              {overdue ? "Overdue" : today ? "Today" : new Date(item.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          )}
          {item.labels.map(l => (
            <span key={l} className="text-[10px] bg-slate-800 border border-slate-700 text-slate-400 px-1.5 py-0.5 rounded-full hidden sm:inline">{l}</span>
          ))}
          {hasNote && (
            <button onClick={() => setExpanded(v => !v)} className="text-slate-600 hover:text-slate-400 p-0.5">
              {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          )}
          <button onClick={onDelete} className="text-slate-700 hover:text-red-400 p-0.5"><X size={13} /></button>
        </div>
      </div>

      {/* Note expansion */}
      {expanded && hasNote && (
        <div
          className="px-12 pb-3 text-sm text-slate-400 border-t border-slate-800 pt-3"
          dangerouslySetInnerHTML={{ __html: item.note }}
        />
      )}
    </div>
  );
}

// ── Section ─────────────────────────────────────────────────
function Section({ title, accent, items, onToggle, onEdit, onDelete, defaultCollapsed }: {
  title: string;
  accent?: string;
  items: TodoItem[];
  onToggle: (id: string) => void;
  onEdit: (item: TodoItem) => void;
  onDelete: (id: string) => void;
  defaultCollapsed?: boolean;
}) {
  const [open, setOpen] = useState(!defaultCollapsed);
  if (items.length === 0) return null;

  return (
    <div>
      <button
        onClick={() => setOpen(v => !v)}
        className={clsx("flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-2 hover:opacity-80", accent ?? "text-slate-500")}
      >
        {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        {title} <span className="opacity-60">({items.length})</span>
      </button>
      {open && (
        <div className="space-y-2 mb-5">
          {items.map(item => (
            <TaskRow key={item.id} item={item} onToggle={() => onToggle(item.id)} onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────
export default function TodoPage() {
  const [todos, setTodos]         = useState<TodoItem[]>([]);
  const [filter, setFilter]       = useState<FilterTab>("active");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState<TodoItem | undefined>(undefined);

  useEffect(() => { setTodos(getTodos()); }, []);

  function persist(items: TodoItem[]) { setTodos(items); saveTodos(items); }

  function handleSave(item: TodoItem) {
    persist(todos.some(t => t.id === item.id)
      ? todos.map(t => t.id === item.id ? item : t)
      : [item, ...todos]);
  }

  function handleToggle(id: string) {
    persist(todos.map(t => t.id === id
      ? { ...t, done: !t.done, doneAt: !t.done ? new Date().toISOString() : undefined }
      : t));
  }

  function handleDelete(id: string) { persist(todos.filter(t => t.id !== id)); }

  const filtered = filter === "active" ? todos.filter(t => !t.done)
    : filter === "done" ? todos.filter(t => t.done)
    : todos;

  const groups = groupTodos(filtered);

  const activeCount = todos.filter(t => !t.done).length;

  return (
    <div className="flex flex-col min-h-full">
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold text-slate-200">To-Do List</h1>
          {activeCount > 0 && (
            <span className="text-xs bg-blue-600/20 text-blue-400 border border-blue-600/30 px-2 py-0.5 rounded-full">{activeCount} active</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Filter tabs */}
          <div className="flex gap-0.5 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            {(["all", "active", "done"] as FilterTab[]).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={clsx("px-3 py-1 text-xs rounded-md capitalize transition-colors", filter === f ? "bg-slate-700 text-slate-100" : "text-slate-500 hover:text-slate-300")}>
                {f}
              </button>
            ))}
          </div>
          <button
            onClick={() => { setEditing(undefined); setShowModal(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={13} />Add Task
          </button>
        </div>
      </header>

      <div className="flex-1 px-6 py-5 max-w-3xl">
        {todos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4">
              <CheckCircle2 size={24} className="text-slate-600" />
            </div>
            <p className="text-slate-400 text-sm font-medium mb-1">Nothing to do</p>
            <p className="text-slate-600 text-xs mb-5">Add your first task to get started</p>
            <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Add Task</button>
          </div>
        ) : (
          <>
            <Section title="Overdue"  accent="text-red-400"    items={groups.overdue}  onToggle={handleToggle} onEdit={i => { setEditing(i); setShowModal(true); }} onDelete={handleDelete} />
            <Section title="Today"    accent="text-yellow-400" items={groups.today}    onToggle={handleToggle} onEdit={i => { setEditing(i); setShowModal(true); }} onDelete={handleDelete} />
            <Section title="Upcoming" accent="text-blue-400"   items={groups.upcoming} onToggle={handleToggle} onEdit={i => { setEditing(i); setShowModal(true); }} onDelete={handleDelete} />
            <Section title="No Date"  accent="text-slate-500"  items={groups.noDate}   onToggle={handleToggle} onEdit={i => { setEditing(i); setShowModal(true); }} onDelete={handleDelete} />
            {filter !== "active" && (
              <Section title="Completed" accent="text-green-600" items={groups.done} onToggle={handleToggle} onEdit={i => { setEditing(i); setShowModal(true); }} onDelete={handleDelete} defaultCollapsed />
            )}
          </>
        )}
      </div>

      {showModal && (
        <TodoModal item={editing} onClose={() => setShowModal(false)} onSave={handleSave} />
      )}
    </div>
  );
}

const lbl = "block text-xs font-medium text-slate-400 mb-1.5";
const inp = "w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600";
const sel = "w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-800 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600";
