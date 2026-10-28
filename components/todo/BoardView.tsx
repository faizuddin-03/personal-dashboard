"use client";
import { useState } from "react";
import {
  DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors, useDraggable, useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import { GripVertical } from "lucide-react";
import clsx from "clsx";
import {
  TodoItem, TodoBucket, TodoPriority, TODO_BUCKET_META, TODO_PRIORITY_META, addDaysISO,
} from "@/lib/todo";
import type { TodoApi } from "./useTodos";
import TaskCard, { PRIORITY_STRIP } from "./TaskCard";

export type BoardBy = "group" | "priority";

interface Column { id: string; title: string; accent: string; dot: string; items: TodoItem[]; empty: string; droppable: boolean }

/** What dropping a card on a column does. Overdue and Done are not drop targets. */
const DROP_DATE: Partial<Record<TodoBucket, number | null>> = {
  today: 0, tomorrow: 1, week: 7, later: 14, nodate: null,
};

function DraggableCard({ item, children, enabled }: { item: TodoItem; children: (handle: React.ReactNode) => React.ReactNode; enabled: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: item.id, disabled: !enabled });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  const handle = enabled ? (
    <button
      type="button"
      {...listeners}
      {...attributes}
      aria-label="Drag to another column"
      className="cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-300 p-0.5 touch-none rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      <GripVertical size={14} />
    </button>
  ) : undefined;
  return (
    <div ref={setNodeRef} style={style} className={clsx(isDragging && "relative z-50 opacity-80 rotate-1")}>
      {children(handle)}
    </div>
  );
}

function BoardColumn({ col, children }: { col: Column; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id, disabled: !col.droppable });
  return (
    <div
      ref={setNodeRef}
      className={clsx(
        "snap-start shrink-0 w-[min(84vw,300px)] flex flex-col rounded-3xl border p-3 transition-colors",
        isOver ? "border-blue-500/60 bg-blue-500/5" : "border-slate-800 bg-slate-900/40",
      )}
    >
      <div className="flex items-center gap-2 px-1 pb-3">
        <span className={clsx("w-2 h-2 rounded-full", col.dot)} />
        <h3 className={clsx("text-xs font-semibold uppercase tracking-wider", col.accent)}>{col.title}</h3>
        <span className="ml-auto text-[11px] text-slate-500 tabular-nums bg-slate-800 rounded-full px-2 py-0.5">{col.items.length}</span>
      </div>
      <div className="space-y-2.5 min-h-16">
        {children}
        {col.items.length === 0 && (
          <p className="text-xs text-slate-500 italic text-center py-6 border border-dashed border-slate-800 rounded-2xl">{col.empty}</p>
        )}
      </div>
    </div>
  );
}

export default function BoardView({ groups, by, api, onEdit, onStartFocus, focusTaskId, showDone }: {
  groups: Record<TodoBucket, TodoItem[]>;
  by: BoardBy;
  api: TodoApi;
  onEdit: (item: TodoItem) => void;
  onStartFocus: (item: TodoItem, minutes: number) => void;
  focusTaskId?: string;
  showDone: boolean;
}) {
  const [hint, setHint] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const active = (Object.keys(groups) as TodoBucket[]).filter(b => b !== "done").flatMap(b => groups[b]);

  const columns: Column[] = by === "group"
    ? (Object.keys(TODO_BUCKET_META) as TodoBucket[])
        .filter(b => b !== "done" || showDone)
        .map(b => ({
          id: b, title: TODO_BUCKET_META[b].label, accent: TODO_BUCKET_META[b].accent, dot: TODO_BUCKET_META[b].dot,
          items: groups[b], empty: TODO_BUCKET_META[b].empty, droppable: b in DROP_DATE,
        }))
    : (["high", "medium", "low"] as TodoPriority[]).map(p => ({
        id: p, title: TODO_PRIORITY_META[p].label, accent: TODO_PRIORITY_META[p].color, dot: PRIORITY_STRIP[p],
        items: active.filter(t => t.priority === p), empty: "Drop a task here", droppable: true,
      }));

  function onDragEnd(e: DragEndEvent) {
    if (!e.over) return;
    const id = String(e.active.id);
    const target = String(e.over.id);
    if (by === "priority") {
      api.update(id, { priority: target as TodoPriority });
    } else if (target in DROP_DATE) {
      const days = DROP_DATE[target as TodoBucket];
      api.update(id, { dueDate: days === null || days === undefined ? undefined : addDaysISO(days) });
    }
  }

  return (
    <div>
      <p className="text-[11px] text-slate-500 mb-2">
        Drag a card by its handle to {by === "priority" ? "change its priority" : "reschedule it"}.
        {by === "group" && (
          <button type="button" onClick={() => setHint(v => !v)} className="ml-1 underline decoration-dotted hover:text-slate-300">How?</button>
        )}
      </p>
      {hint && by === "group" && (
        <p className="text-[11px] text-slate-500 mb-3">Today = today, Tomorrow = +1 day, This week = +7 days, Later = +14 days, No date clears the date.</p>
      )}
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto snap-x pb-4 -mx-1 px-1">
          {columns.map(col => (
            <BoardColumn key={col.id} col={col}>
              {col.items.map(item => (
                <DraggableCard key={item.id} item={item} enabled={!item.done}>
                  {handle => (
                    <TaskCard
                      item={item}
                      api={api}
                      dense
                      menuOnly
                      dragHandle={handle}
                      focusing={focusTaskId === item.id}
                      onEdit={() => onEdit(item)}
                      onStartFocus={m => onStartFocus(item, m)}
                    />
                  )}
                </DraggableCard>
              ))}
            </BoardColumn>
          ))}
        </div>
      </DndContext>
    </div>
  );
}
