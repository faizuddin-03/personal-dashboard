"use client";
import { useState } from "react";
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove, sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronRight, GripVertical, CheckCheck, Trash2 } from "lucide-react";
import clsx from "clsx";
import { TodoItem, TodoBucket, TODO_BUCKET_META, TODO_BUCKETS } from "@/lib/todo";
import type { TodoApi } from "./useTodos";
import TaskCard from "./TaskCard";

interface Shared {
  api: TodoApi;
  allTodos: TodoItem[];
  sortable: boolean;
  selectMode: boolean;
  selected: Set<string>;
  onSelect: (id: string) => void;
  onEdit: (item: TodoItem) => void;
  onStartFocus: (item: TodoItem, minutes: number) => void;
  focusTaskId?: string;
}

function SortableCard({ item, shared }: { item: TodoItem; shared: Shared }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id, disabled: !shared.sortable });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : undefined };
  const handle = shared.sortable ? (
    <button
      type="button"
      {...listeners}
      {...attributes}
      aria-label="Drag to reorder"
      className="cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-300 p-0.5 touch-none rounded opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      <GripVertical size={14} />
    </button>
  ) : undefined;
  return (
    <div ref={setNodeRef} style={style} className={clsx("relative", isDragging && "opacity-70")}>
      <TaskCard
        item={item}
        api={shared.api}
        dragHandle={handle}
        selectMode={shared.selectMode}
        selected={shared.selected.has(item.id)}
        onSelect={() => shared.onSelect(item.id)}
        focusing={shared.focusTaskId === item.id}
        onEdit={() => shared.onEdit(item)}
        onStartFocus={m => shared.onStartFocus(item, m)}
      />
    </div>
  );
}

function Section({ bucket, items, collapsed, onCollapse, shared }: {
  bucket: TodoBucket; items: TodoItem[]; collapsed: boolean; onCollapse: () => void; shared: Shared;
}) {
  const meta = TODO_BUCKET_META[bucket];
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = items.findIndex(i => i.id === active.id);
    const newIdx = items.findIndex(i => i.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    // Write the new in-group order back into the global order, keeping every
    // other item where it was (same approach as the original page).
    const reorderedIds = arrayMove(items, oldIdx, newIdx).map(i => i.id);
    const ids = new Set(reorderedIds);
    const byId = new Map(shared.allTodos.map(t => [t.id, t]));
    let cursor = 0;
    const result = shared.allTodos.map(t => ids.has(t.id) ? byId.get(reorderedIds[cursor++])! : t);
    shared.api.replaceAll(result);
  }

  const count = items.filter(i => !shared.api.leavingIds.has(i.id)).length;

  return (
    items.length === 0 ? (
      // Empty group: one quiet line, so a light day does not look like a wall of boxes.
      <section className="mb-4 flex items-center gap-2.5 px-0.5 py-1">
        <span className={clsx("w-2 h-2 rounded-full opacity-60", meta.dot)} />
        <span className={clsx("text-xs font-semibold uppercase tracking-wider opacity-70", meta.accent)}>{meta.label}</span>
        <span className="text-[11px] tabular-nums text-slate-500 bg-slate-800/60 rounded-full px-2 py-0.5">0</span>
        <span className="text-xs text-slate-500 italic truncate">{meta.empty}</span>
      </section>
    ) :
    <section className="mb-7">
      <button
        type="button"
        onClick={onCollapse}
        aria-expanded={!collapsed}
        className="w-full flex items-center gap-2.5 mb-3 group/h rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <span className={clsx("w-2 h-2 rounded-full", meta.dot)} />
        <span className={clsx("text-xs font-semibold uppercase tracking-wider", meta.accent)}>{meta.label}</span>
        <span className="text-[11px] tabular-nums text-slate-400 bg-slate-800 rounded-full px-2 py-0.5">{count}</span>
        <span className="flex-1 h-px bg-slate-800 ml-1" />
        <span className="text-slate-500 group-hover/h:text-slate-300">{collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}</span>
      </button>
      <div style={{ gridTemplateRows: collapsed ? "0fr" : "1fr" }} className="grid transition-[grid-template-rows] duration-300 ease-in-out">
        <div className={clsx(collapsed ? "overflow-hidden" : "overflow-visible")}>
          {items.length === 0 ? (
            <p className="text-xs text-slate-500 italic px-4 py-3 rounded-2xl border border-dashed border-slate-800">{meta.empty}</p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2.5">
                  {items.map(item => <SortableCard key={item.id} item={item} shared={shared} />)}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>
    </section>
  );
}

export default function ListView({ groups, collapsed, onCollapse, showDone, hideEmpty, ...shared }: Shared & {
  groups: Record<TodoBucket, TodoItem[]>;
  collapsed: Record<string, boolean>;
  onCollapse: (b: TodoBucket) => void;
  showDone: boolean;
  /** When filtering, hide groups with nothing in them. */
  hideEmpty: boolean;
}) {
  return (
    <div>
      {TODO_BUCKETS.filter(b => b !== "done" || showDone).map(b => {
        if (hideEmpty && groups[b].length === 0) return null;
        return (
          <Section
            key={b}
            bucket={b}
            items={groups[b]}
            collapsed={collapsed[b] ?? b === "done"}
            onCollapse={() => onCollapse(b)}
            shared={shared}
          />
        );
      })}
    </div>
  );
}

export function BulkBar({ count, onMarkDone, onDelete, onCancel }: {
  count: number; onMarkDone: () => void; onDelete: () => void; onCancel: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  return (
    <div className="fixed bottom-6 inset-x-0 mx-auto w-fit max-w-[calc(100vw-2rem)] flex flex-wrap items-center justify-center gap-3 bg-slate-800 border border-slate-700 rounded-2xl px-4 py-2.5 shadow-2xl shadow-black/60 z-40">
      <span className="text-xs text-slate-400 font-medium">{count} selected</span>
      <div className="w-px h-4 bg-slate-700" />
      <button type="button" onClick={onMarkDone} className="flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500">
        <CheckCheck size={13} /> Mark done
      </button>
      {!confirmDelete ? (
        <button type="button" onClick={() => setConfirmDelete(true)} disabled={count === 0} className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-40 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500">
          <Trash2 size={13} /> Delete
        </button>
      ) : (
        <div className="flex items-center gap-1">
          <span className="text-xs text-red-400">Delete {count} task{count === 1 ? "" : "s"}?</span>
          <button type="button" onClick={() => { setConfirmDelete(false); onDelete(); }} className="px-2 py-0.5 text-xs bg-red-700 text-white rounded hover:bg-red-600">Yes</button>
          <button type="button" onClick={() => setConfirmDelete(false)} className="px-2 py-0.5 text-xs border border-slate-700 text-slate-400 rounded hover:bg-slate-700">No</button>
        </div>
      )}
      <div className="w-px h-4 bg-slate-700" />
      <button type="button" onClick={onCancel} className="text-xs text-slate-500 hover:text-slate-300 transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">Cancel</button>
    </div>
  );
}
