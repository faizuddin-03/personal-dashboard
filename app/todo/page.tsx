"use client";
import { useState, useEffect, useRef } from "react";
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus, X, ChevronDown, ChevronRight, Clock, AlertTriangle, CheckCircle2,
  RefreshCw, SkipForward, GripVertical, ArrowUpDown, Trash2, CheckCheck,
  ListTodo,
} from "lucide-react";
import clsx from "clsx";
import RichTextEditor from "@/components/RichTextEditor";
import {
  TodoItem, SubTask, TodoPriority, TODO_PRIORITY_META,
  getTodos, saveTodos, isTodoOverdue, isDueToday, advanceRecurring,
} from "@/lib/todo";

function newId() { return crypto.randomUUID(); }

type FilterTab = "all" | "active" | "done";
type SortBy    = "manual" | "priority" | "due" | "created";

const PRIORITY_ORDER: Record<TodoPriority, number> = { high: 0, medium: 1, low: 2 };

const PRIORITY_BORDER: Record<TodoPriority, string> = {
  high:   "border-l-orange-500/70",
  medium: "border-l-yellow-500/50",
  low:    "border-l-slate-600/50",
};

function sortItems(items: TodoItem[], by: SortBy): TodoItem[] {
  if (by === "manual") return items;
  return [...items].sort((a, b) => {
    if (by === "priority") return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (by === "due") {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    }
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

function groupTodos(items: TodoItem[], by: SortBy) {
  const active = items.filter(i => !i.done);
  const done   = items.filter(i => i.done);
  return {
    overdue:  sortItems(active.filter(isTodoOverdue), by),
    today:    sortItems(active.filter(i => isDueToday(i) && !isTodoOverdue(i)), by),
    upcoming: sortItems(active.filter(i => i.dueDate && !isDueToday(i) && !isTodoOverdue(i)), by),
    noDate:   sortItems(active.filter(i => !i.dueDate), by),
    done:     sortItems(done, by),
  };
}

// ── Quick-add row ────────────────────────────────────────────
function QuickAdd({ onAdd, inputRef }: {
  onAdd: (title: string, priority: TodoPriority) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  const [title, setTitle]       = useState("");
  const [priority, setPriority] = useState<TodoPriority>("medium");

  function submit() {
    if (!title.trim()) return;
    onAdd(title.trim(), priority);
    setTitle("");
  }

  return (
    <form
      onSubmit={e => { e.preventDefault(); submit(); }}
      className="flex items-center gap-2 mb-5 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 focus-within:border-blue-600/60 transition-colors"
    >
      <Plus size={14} className="text-slate-600 shrink-0" />
      <input
        ref={inputRef}
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Quick-add a task… (N to focus, Enter to save)"
        className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-600 focus:outline-none"
      />
      <select
        value={priority}
        onChange={e => setPriority(e.target.value as TodoPriority)}
        className="bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-400 px-2 py-1 focus:outline-none cursor-pointer"
      >
        {Object.entries(TODO_PRIORITY_META).map(([k, v]) => (
          <option key={k} value={k}>{v.label}</option>
        ))}
      </select>
      <button
        type="submit"
        disabled={!title.trim()}
        className="px-2.5 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-30 transition-colors"
      >
        Add
      </button>
    </form>
  );
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
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-800 shrink-0">
          <h2 className="text-sm font-semibold text-slate-100">{item ? "Edit Task" : "New Task"}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X size={18} /></button>
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
            {item ? "Save Changes" : "Add Task"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Task row ────────────────────────────────────────────────
function TaskRow({ item, onToggle, onEdit, onDelete, onSkip, onSubtaskToggle,
  selectMode, selected, onSelect, dragHandle }: {
  item: TodoItem;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSkip?: () => void;
  onSubtaskToggle: (stId: string) => void;
  selectMode: boolean;
  selected: boolean;
  onSelect: () => void;
  dragHandle?: React.ReactNode;
}) {
  const [expanded, setExpanded]   = useState(false);
  const [stInput, setStInput]     = useState("");
  const pm = TODO_PRIORITY_META[item.priority];
  const overdue = isTodoOverdue(item);
  const today   = isDueToday(item);
  const hasNote = item.note && item.note !== "<p></p>";
  const subtasks = item.subtasks ?? [];
  const stDone   = subtasks.filter(s => s.done).length;
  const stPct    = subtasks.length > 0 ? (stDone / subtasks.length) * 100 : 0;

  return (
    <div className={clsx(
      "border rounded-xl transition-all group border-l-2",
      // Priority-coloured left border for active items only
      !item.done && !selected && PRIORITY_BORDER[item.priority],
      // Base style varies by state
      selected ? "border-blue-600/60 bg-blue-600/5" :
      item.done ? "border-slate-700/40 bg-slate-800/30" :
      overdue   ? "border-red-800/60 bg-slate-900" :
                  "border-slate-800 bg-slate-900 hover:border-slate-700"
    )}>
      <div className="flex items-center gap-2 px-3 py-3">
        {/* Drag handle or select checkbox */}
        {selectMode ? (
          <button
            onClick={onSelect}
            className={clsx("w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition-colors",
              selected ? "bg-blue-600 border-blue-600" : "border-slate-600 hover:border-slate-400")}
          >
            {selected && <CheckCheck size={10} className="text-white" />}
          </button>
        ) : dragHandle ? (
          <div className="shrink-0">{dragHandle}</div>
        ) : null}

        {/* Checkbox */}
        <button
          onClick={onToggle}
          aria-label={item.done ? "Mark as active" : "Mark as done"}
          className={clsx(
            "w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition-colors",
            item.done ? "bg-blue-600 border-blue-600" : "border-slate-600 hover:border-slate-400"
          )}
        >
          {item.done && <CheckCheck size={10} className="text-white" />}
        </button>

        {/* Title */}
        <span
          onClick={onEdit}
          className={clsx(
            "flex-1 flex items-center gap-1.5 text-sm cursor-pointer min-w-0",
            item.done ? "text-slate-600 line-through" : "text-slate-200 hover:text-slate-100"
          )}
        >
          <span className="truncate">{item.title}</span>
          {item.jiraKey && (
            <span className="shrink-0 bg-slate-800 border border-slate-700 text-blue-400 text-xs font-mono px-1.5 rounded">{item.jiraKey}</span>
          )}
        </span>

        {/* Meta */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Priority dot + label */}
          <span className={clsx("flex items-center gap-1 text-xs", item.done ? "text-slate-600" : pm.color)}>
            <span className={clsx("w-1.5 h-1.5 rounded-full shrink-0", item.done ? "bg-slate-600" : pm.dot)} />
            <span className="hidden sm:inline">{pm.label}</span>
          </span>

          {/* Due date */}
          {item.dueDate && (
            <span className={clsx("flex items-center gap-1 text-xs",
              item.done ? "text-slate-600" :
              overdue ? "text-red-400" : today ? "text-yellow-400" : "text-slate-500")}>
              {overdue && !item.done ? <AlertTriangle size={11} /> : <Clock size={11} />}
              {overdue && !item.done ? "Overdue" : today && !item.done ? "Today" : new Date(item.dueDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          )}

          {/* Recurring badge */}
          {item.recurring && (
            <span className={clsx(
              "flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full border shrink-0",
              item.done
                ? "bg-slate-800/50 border-slate-700/40 text-slate-600"
                : "bg-blue-600/10 border-blue-600/25 text-blue-400/80"
            )}>
              <RefreshCw size={8} />
              {item.recurring}
            </span>
          )}

          {/* Labels */}
          {item.labels.map(l => (
            <span key={l} className={clsx("text-xs bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded-full hidden sm:inline", item.done ? "text-slate-600" : "text-slate-400")}>{l}</span>
          ))}

          {/* Subtask progress bar */}
          {subtasks.length > 0 && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-1.5 shrink-0 group/st"
            >
              <div className="w-14 h-1 rounded-full bg-slate-700 overflow-hidden">
                <div
                  className={clsx("h-full rounded-full transition-all duration-300", stDone === subtasks.length ? "bg-green-500" : "bg-blue-500")}
                  style={{ width: `${stPct}%` }}
                />
              </div>
              <span className={clsx("text-xs", stDone === subtasks.length ? "text-green-400/80" : "text-slate-500 group-hover/st:text-slate-300")}>
                {stDone}/{subtasks.length}
              </span>
            </button>
          )}

          {/* Note expand toggle (when no subtasks) */}
          {subtasks.length === 0 && hasNote && (
            <button onClick={() => setExpanded(v => !v)} className="text-slate-600 hover:text-slate-400 p-1">
              {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </button>
          )}

          {/* Skip recurring occurrence */}
          {onSkip && item.recurring && !item.done && (
            <button onClick={onSkip} title="Skip this occurrence" className="text-slate-700 hover:text-amber-400 p-1"><SkipForward size={12} /></button>
          )}

          <button onClick={onDelete} className="text-slate-700 hover:text-red-400 p-1"><X size={12} /></button>
        </div>
      </div>

      {/* Subtasks expanded */}
      {expanded && subtasks.length > 0 && (
        <div className="px-10 pb-3 pt-1 border-t border-slate-800 space-y-1.5">
          {subtasks.map(st => (
            <div key={st.id} className="flex items-center gap-2">
              <button
                onClick={() => onSubtaskToggle(st.id)}
                className={clsx("w-3.5 h-3.5 rounded border shrink-0 flex items-center justify-center transition-colors",
                  st.done ? "bg-blue-600 border-blue-600" : "border-slate-600 hover:border-slate-400")}
              >
                {st.done && <CheckCheck size={8} className="text-white" />}
              </button>
              <span className={clsx("text-xs flex-1", st.done ? "line-through text-slate-600" : "text-slate-400")}>{st.title}</span>
            </div>
          ))}
          <form className="flex items-center gap-2 mt-1" onSubmit={e => e.preventDefault()}>
            <input
              value={stInput}
              onChange={e => setStInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && stInput.trim()) {
                  e.preventDefault();
                  onSubtaskToggle("__add__" + stInput.trim());
                  setStInput("");
                }
              }}
              placeholder="Add subtask…"
              className="flex-1 bg-transparent text-xs text-slate-400 placeholder-slate-700 focus:outline-none border-b border-slate-800 pb-0.5 focus:border-slate-600"
            />
          </form>
        </div>
      )}

      {/* Note expansion (when no subtasks) */}
      {expanded && subtasks.length === 0 && hasNote && (
        <div className="px-10 pb-3 text-sm text-slate-400 border-t border-slate-800 pt-3" dangerouslySetInnerHTML={{ __html: item.note }} />
      )}
    </div>
  );
}

// ── Sortable task row ────────────────────────────────────────
function SortableTaskRow(props: React.ComponentProps<typeof TaskRow> & { sortable: boolean; isLeaving?: boolean }) {
  const { sortable, isLeaving, ...rest } = props;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: rest.item.id, disabled: !sortable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  // Drag handle: invisible until row is hovered (via `group` on TaskRow)
  const handle = sortable ? (
    <button
      {...listeners}
      {...attributes}
      className="cursor-grab active:cursor-grabbing text-slate-700 hover:text-slate-400 p-0.5 touch-none opacity-0 group-hover:opacity-100 transition-opacity duration-150"
      tabIndex={-1}
    >
      <GripVertical size={14} />
    </button>
  ) : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        "transition-all duration-200",
        isLeaving && "opacity-0 scale-y-95 -translate-y-1 pointer-events-none"
      )}
    >
      <TaskRow {...rest} dragHandle={handle} />
    </div>
  );
}

// ── Section ─────────────────────────────────────────────────
function Section({ title, accent, emptyMsg, items, allTodos, onReorder, onToggle, onEdit,
  onDelete, onSkip, onSubtaskToggle, collapsed, onCollapseToggle, sortBy, selectMode, selected, onSelect,
  leavingIds }: {
  title: string;
  accent?: string;
  emptyMsg?: string;
  items: TodoItem[];
  allTodos: TodoItem[];
  onReorder: (updated: TodoItem[]) => void;
  onToggle: (id: string) => void;
  onEdit: (item: TodoItem) => void;
  onDelete: (id: string) => void;
  onSkip: (id: string) => void;
  onSubtaskToggle: (itemId: string, stId: string) => void;
  collapsed: boolean;
  onCollapseToggle: () => void;
  sortBy: SortBy;
  selectMode: boolean;
  selected: Set<string>;
  onSelect: (id: string) => void;
  leavingIds: Set<string>;
}) {
  const sortable = sortBy === "manual" && !selectMode;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = items.findIndex(i => i.id === active.id);
    const newIdx = items.findIndex(i => i.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    const reordered = arrayMove(items, oldIdx, newIdx);
    const reorderedIds = reordered.map(i => i.id);
    const sectionIds = new Set(items.map(i => i.id));
    const result = [...allTodos];
    let sectionCursor = 0;
    for (let i = 0; i < result.length; i++) {
      if (sectionIds.has(result[i].id)) {
        result[i] = allTodos.find(t => t.id === reorderedIds[sectionCursor])!;
        sectionCursor++;
      }
    }
    onReorder(result);
  }

  // Count excludes leaving items (animating out)
  const visibleCount = items.filter(i => !leavingIds.has(i.id)).length;

  const header = (
    <button
      onClick={onCollapseToggle}
      className={clsx("flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-2 hover:opacity-80", accent ?? "text-slate-500")}
    >
      {collapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
      {title}
      <span className="opacity-60 font-normal normal-case tracking-normal">({visibleCount})</span>
    </button>
  );

  if (items.length === 0) {
    if (!emptyMsg) return null;
    return (
      <div className="mb-5">
        {header}
        <div
          style={{ gridTemplateRows: !collapsed ? "1fr" : "0fr" }}
          className="grid transition-[grid-template-rows] duration-200 ease-in-out"
        >
          <div className="overflow-hidden">
            <p className="text-xs text-slate-700 italic pl-5 pb-1">{emptyMsg}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-5">
      {header}
      {/* Smooth collapse via CSS grid-template-rows trick */}
      <div
        style={{ gridTemplateRows: !collapsed ? "1fr" : "0fr" }}
        className="grid transition-[grid-template-rows] duration-200 ease-in-out"
      >
        <div className="overflow-hidden">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2 pt-0.5">
                {items.map(item => (
                  <SortableTaskRow
                    key={item.id}
                    item={item}
                    sortable={sortable}
                    isLeaving={leavingIds.has(item.id)}
                    onToggle={() => onToggle(item.id)}
                    onEdit={() => onEdit(item)}
                    onDelete={() => onDelete(item.id)}
                    onSkip={item.recurring && !item.done ? () => onSkip(item.id) : undefined}
                    onSubtaskToggle={(stId) => onSubtaskToggle(item.id, stId)}
                    selectMode={selectMode}
                    selected={selected.has(item.id)}
                    onSelect={() => onSelect(item.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </div>
  );
}

// ── Bulk action bar ──────────────────────────────────────────
function BulkBar({ count, onMarkDone, onDelete, onCancel }: {
  count: number;
  onMarkDone: () => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-2xl px-4 py-2.5 shadow-2xl shadow-black/60 z-40">
      <span className="text-xs text-slate-400 font-medium">{count} selected</span>
      <div className="w-px h-4 bg-slate-700" />
      <button onClick={onMarkDone} className="flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 transition-colors">
        <CheckCheck size={13} /> Mark done
      </button>
      <button onClick={onDelete} className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors">
        <Trash2 size={13} /> Delete
      </button>
      <div className="w-px h-4 bg-slate-700" />
      <button onClick={onCancel} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
        Cancel
      </button>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────
export default function TodoPage() {
  const [todos, setTodos]         = useState<TodoItem[]>([]);
  const [filter, setFilter]       = useState<FilterTab>("all");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState<TodoItem | undefined>(undefined);
  const [sortBy, setSortBy]       = useState<SortBy>("manual");
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected]   = useState<Set<string>>(new Set());
  const [leavingIds, setLeavingIds] = useState<Set<string>>(new Set());
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return { Completed: true };
    try { return JSON.parse(localStorage.getItem("todo_section_collapse") ?? JSON.stringify({ Completed: true })); }
    catch { return { Completed: true }; }
  });

  const todosRef  = useRef<TodoItem[]>([]);
  const quickAddRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setTodos(getTodos()); }, []);
  useEffect(() => { todosRef.current = todos; }, [todos]);

  // Keyboard shortcut: N focuses the quick-add input
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (showModal) return;
      if (e.key !== "n" && e.key !== "N") return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement).isContentEditable) return;
      e.preventDefault();
      quickAddRef.current?.focus();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [showModal]);

  function persist(items: TodoItem[]) { setTodos(items); saveTodos(items); }

  function toggleSection(name: string) {
    setCollapsedSections(prev => {
      const next = { ...prev, [name]: !prev[name] };
      localStorage.setItem("todo_section_collapse", JSON.stringify(next));
      return next;
    });
  }

  function handleSave(item: TodoItem) {
    persist(todos.some(t => t.id === item.id)
      ? todos.map(t => t.id === item.id ? item : t)
      : [item, ...todos]);
  }

  function handleQuickAdd(title: string, priority: TodoPriority) {
    persist([{
      id: newId(), title, note: "", done: false, priority,
      labels: [], createdAt: new Date().toISOString(),
    }, ...todos]);
  }

  function handleToggle(id: string) {
    const target = todos.find(t => t.id === id);
    if (!target) return;
    const nowDone = !target.done;

    if (nowDone) {
      // Animate out, then persist after animation completes
      setLeavingIds(prev => new Set([...prev, id]));
      setTimeout(() => {
        const current = todosRef.current;
        const t = current.find(x => x.id === id);
        if (!t) return;
        const updated = current.map(x => x.id === id
          ? { ...x, done: true, doneAt: new Date().toISOString() }
          : x);
        if (t.recurring) {
          const next = advanceRecurring({ ...t, done: true, doneAt: new Date().toISOString() });
          persist(updated.map(x => x.id === id ? next : x));
        } else {
          persist(updated);
        }
        setLeavingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
      }, 220);
    } else {
      persist(todos.map(t => t.id === id
        ? { ...t, done: false, doneAt: undefined }
        : t));
    }
  }

  function handleDelete(id: string) { persist(todos.filter(t => t.id !== id)); }

  function handleSkip(id: string) {
    persist(todos.map(t => t.id === id
      ? { ...t, done: true, doneAt: new Date().toISOString() }
      : t));
  }

  function handleSubtaskToggle(itemId: string, stId: string) {
    persist(todos.map(t => {
      if (t.id !== itemId) return t;
      if (stId.startsWith("__add__")) {
        const newTitle = stId.slice(7);
        return { ...t, subtasks: [...(t.subtasks ?? []), { id: newId(), title: newTitle, done: false }] };
      }
      return { ...t, subtasks: (t.subtasks ?? []).map(s => s.id === stId ? { ...s, done: !s.done } : s) };
    }));
  }

  function handleBulkDone() {
    persist(todos.map(t => selected.has(t.id) ? { ...t, done: true, doneAt: new Date().toISOString() } : t));
    setSelected(new Set()); setSelectMode(false);
  }

  function handleBulkDelete() {
    persist(todos.filter(t => !selected.has(t.id)));
    setSelected(new Set()); setSelectMode(false);
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const filtered = filter === "active" ? todos.filter(t => !t.done)
    : filter === "done" ? todos.filter(t => t.done)
    : todos;

  const groups = groupTodos(filtered, sortBy);
  const activeCount = todos.filter(t => !t.done).length;
  const allActiveEmpty = groups.overdue.length === 0 && groups.today.length === 0 && groups.upcoming.length === 0 && groups.noDate.length === 0;

  const sectionProps = {
    allTodos: todos, onReorder: persist, onToggle: handleToggle,
    onEdit: (i: TodoItem) => { setEditing(i); setShowModal(true); },
    onDelete: handleDelete, onSkip: handleSkip,
    onSubtaskToggle: handleSubtaskToggle,
    sortBy, selectMode, selected, onSelect: toggleSelect,
    leavingIds,
  };

  return (
    <div className="flex flex-col min-h-full">
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-4 sm:px-6 h-14 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 shrink-0">
          <h1 className="text-sm font-semibold text-slate-200">To-Do List</h1>
          {activeCount > 0 && (
            <span className="text-xs bg-blue-600/20 text-blue-400 border border-blue-600/30 px-2 py-0.5 rounded-full">{activeCount} active</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Sort */}
          <div className="flex items-center gap-1 text-slate-500">
            <ArrowUpDown size={12} />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortBy)}
              className="bg-transparent text-xs text-slate-400 focus:outline-none cursor-pointer"
            >
              <option value="manual">Manual</option>
              <option value="priority">Priority</option>
              <option value="due">Due Date</option>
              <option value="created">Created</option>
            </select>
          </div>
          {/* Filter tabs */}
          <div className="flex gap-0.5 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            {(["all", "active", "done"] as FilterTab[]).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={clsx("px-3 py-1 text-xs rounded-md capitalize transition-colors", filter === f ? "bg-slate-700 text-slate-100" : "text-slate-500 hover:text-slate-300")}>
                {f}
              </button>
            ))}
          </div>
          {/* Select */}
          <button
            onClick={() => { setSelectMode(v => !v); setSelected(new Set()); }}
            className={clsx("px-3 py-1.5 text-xs rounded-lg border transition-colors", selectMode ? "bg-blue-600/20 border-blue-600/50 text-blue-300" : "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300")}
          >
            Select
          </button>
          <button
            onClick={() => { setEditing(undefined); setShowModal(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={13} />Add
          </button>
        </div>
      </header>

      <div className="flex-1 px-4 py-4 sm:px-6 sm:py-5 max-w-3xl">
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
            {filter !== "done" && <QuickAdd onAdd={handleQuickAdd} inputRef={quickAddRef} />}

            {/* All-clear state */}
            {filter !== "done" && allActiveEmpty && todos.some(t => !t.done) === false && (
              <div className="flex flex-col items-center py-10 text-center">
                <CheckCircle2 size={32} className="text-green-500/60 mb-3" />
                <p className="text-slate-400 text-sm font-medium">You're all caught up!</p>
                <p className="text-slate-600 text-xs mt-1">No active tasks — enjoy the clear list.</p>
              </div>
            )}

            <Section title="Overdue"   accent="text-red-400"    emptyMsg="No overdue tasks"  items={groups.overdue}  collapsed={collapsedSections["Overdue"]  ?? false} onCollapseToggle={() => toggleSection("Overdue")}   {...sectionProps} />
            <Section title="Today"     accent="text-yellow-400" emptyMsg="Nothing due today" items={groups.today}    collapsed={collapsedSections["Today"]    ?? false} onCollapseToggle={() => toggleSection("Today")}     {...sectionProps} />
            <Section title="Upcoming"  accent="text-blue-400"                                items={groups.upcoming} collapsed={collapsedSections["Upcoming"]  ?? false} onCollapseToggle={() => toggleSection("Upcoming")}  {...sectionProps} />
            <Section title="No Date"   accent="text-slate-500"                               items={groups.noDate}   collapsed={collapsedSections["No Date"]   ?? false} onCollapseToggle={() => toggleSection("No Date")}   {...sectionProps} />
            {filter !== "active" && (
              <Section title="Completed" accent="text-green-600" items={groups.done} collapsed={collapsedSections["Completed"] ?? true} onCollapseToggle={() => toggleSection("Completed")} {...sectionProps} />
            )}
          </>
        )}
      </div>

      {showModal && (
        <TodoModal item={editing} onClose={() => setShowModal(false)} onSave={handleSave} />
      )}

      {selectMode && selected.size > 0 && (
        <BulkBar count={selected.size} onMarkDone={handleBulkDone} onDelete={handleBulkDelete} onCancel={() => { setSelectMode(false); setSelected(new Set()); }} />
      )}
    </div>
  );
}

const lbl = "block text-xs font-medium text-slate-400 mb-1.5";
const inp = "w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600";
const sel = "w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-800 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600";
