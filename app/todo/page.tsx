"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Plus, Search, X, List, Columns3, Target, ArrowUpDown, Tag, Flag, Sparkles, CheckCircle2, Keyboard,
} from "lucide-react";
import clsx from "clsx";
import {
  TodoItem, TodoBucket, TodoPriority, TodoTemplate, TODO_BUCKETS, TODO_PRIORITY_META, TODO_TEMPLATES,
  todoBucket, stripHtml, formatDuration, getTodos, type ParsedQuickAdd,
} from "@/lib/todo";
import { useTodos } from "@/components/todo/useTodos";
import { useFocusTimer } from "@/components/todo/useFocusTimer";
import SummaryHeader, { WeeklyReview } from "@/components/todo/SummaryHeader";
import QuickAdd, { templateToTask } from "@/components/todo/QuickAdd";
import ListView, { BulkBar } from "@/components/todo/ListView";
import BoardView, { type BoardBy } from "@/components/todo/BoardView";
import FocusView from "@/components/todo/FocusView";
import FocusTimerBar from "@/components/todo/FocusTimerBar";
import TodoModal from "@/components/todo/TodoModal";
import Toast from "@/components/todo/Toast";
import { useStoredJson } from "@/components/todo/store";
import Popover, { MenuItem } from "@/components/todo/Popover";
import { PRIORITY_STRIP, labelTone } from "@/components/todo/TaskCard";

type ViewMode = "list" | "board" | "focus";
type StatusTab = "all" | "active" | "done";
type SortBy = "manual" | "priority" | "due" | "created";

interface Prefs { view: ViewMode; boardBy: BoardBy; sortBy: SortBy; status: StatusTab }
const PREFS_KEY = "todo_view_prefs";
const COLLAPSE_KEY = "todo_section_collapse";
const DEFAULT_PREFS: Prefs = { view: "list", boardBy: "group", sortBy: "manual", status: "all" };
const DEFAULT_COLLAPSE: Record<string, boolean> = { done: true };


const PRIORITY_ORDER: Record<TodoPriority, number> = { high: 0, medium: 1, low: 2 };

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

export default function TodoPage() {
  const api = useTodos();
  const { todos, stats, showToast } = api;
  const onTimerDone = useCallback((title: string, sec: number) => {
    showToast(`Focus done: ${formatDuration(sec)} on "${title}"`, "party");
  }, [showToast]);
  const timer = useFocusTimer(onTimerDone);

  const [prefs, updatePrefs]        = useStoredJson<Prefs>(PREFS_KEY, DEFAULT_PREFS);
  const [collapsed, setCollapsed]   = useStoredJson<Record<string, boolean>>(COLLAPSE_KEY, DEFAULT_COLLAPSE);
  const [search, setSearch]         = useState("");
  const [tagFilter, setTagFilter]   = useState<string | null>(null);
  const [prioFilter, setPrioFilter] = useState<TodoPriority | "all">("all");
  const [modal, setModal]           = useState<{ item?: TodoItem; isNew?: boolean } | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected]     = useState<Set<string>>(new Set());
  const quickAddRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Open ?edit=<id> (sent by the floating mini from another page).
  useEffect(() => {
    if (!api.ready) return;
    let editId: string | null = null;
    try { editId = new URLSearchParams(window.location.search).get("edit"); } catch { /* ignore */ }
    if (!editId) return;
    const found = getTodos().find(t => t.id === editId);
    try { window.history.replaceState(null, "", "/todo"); } catch { /* ignore */ }
    if (!found) return;
    const h = window.setTimeout(() => setModal({ item: found }), 0);
    return () => window.clearTimeout(h);
  }, [api.ready]);
  // The floating mini asks this page to open its editor when already on /todo.
  useEffect(() => {
    const onOpen = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      const found = getTodos().find(t => t.id === id);
      if (found) setModal({ item: found });
    };
    window.addEventListener("todo-open-edit", onOpen);
    return () => window.removeEventListener("todo-open-edit", onOpen);
  }, []);

  function toggleCollapse(b: TodoBucket) {
    setCollapsed({ [b]: !(collapsed[b] ?? b === "done") });
  }

  // Keyboard: N = quick add, / = search, F = focus mode toggle.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (modal || e.ctrlKey || e.metaKey || e.altKey) return;
      const el = e.target as HTMLElement;
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable) return;
      if (e.key === "n" || e.key === "N") { e.preventDefault(); quickAddRef.current?.focus(); }
      else if (e.key === "/") { e.preventDefault(); searchRef.current?.focus(); }
      else if (e.key === "f" || e.key === "F") { e.preventDefault(); updatePrefs({ view: prefs.view === "focus" ? "list" : "focus" }); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const allLabels = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of todos) for (const l of t.labels) m.set(l, (m.get(l) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([l]) => l);
  }, [todos]);

  const filtering = !!search.trim() || !!tagFilter || prioFilter !== "all";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return todos.filter(t => {
      if (prefs.status === "active" && t.done) return false;
      if (prefs.status === "done" && !t.done) return false;
      if (tagFilter && !t.labels.includes(tagFilter)) return false;
      if (prioFilter !== "all" && t.priority !== prioFilter) return false;
      if (q) {
        const hay = `${t.title} ${t.labels.join(" ")} ${t.jiraKey ?? ""} ${stripHtml(t.note)} ${(t.subtasks ?? []).map(s => s.title).join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [todos, search, tagFilter, prioFilter, prefs.status]);

  const groups = useMemo(() => {
    const g = Object.fromEntries(TODO_BUCKETS.map(b => [b, [] as TodoItem[]])) as Record<TodoBucket, TodoItem[]>;
    const now = new Date();
    for (const t of filtered) g[todoBucket(t, now)].push(t);
    for (const b of TODO_BUCKETS) g[b] = sortItems(g[b], prefs.sortBy);
    // Done: newest first
    g.done = [...g.done].sort((a, b) => (b.doneAt ?? "").localeCompare(a.doneAt ?? ""));
    return g;
  }, [filtered, prefs.sortBy]);

  function handleQuickAdd(p: ParsedQuickAdd) {
    api.add({
      title: p.title,
      priority: p.priority ?? "medium",
      labels: p.labels,
      dueDate: p.dueDate,
      recurring: p.recurring,
      jiraKey: p.jiraKey,
    });
  }

  function openTemplate(t: TodoTemplate) {
    const base = templateToTask(t);
    setModal({
      isNew: true,
      item: {
        id: crypto.randomUUID(), note: "", done: false, createdAt: new Date().toISOString(), ...base,
      },
    });
  }

  function startFocus(item: TodoItem, minutes: number) {
    timer.start(item.id, item.title, minutes);
    showToast(`Focus started: ${minutes} min`);
  }

  function toggleSelect(id: string) {
    setSelected(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }

  const activeCount = todos.filter(t => !t.done).length;
  const focusTaskId = timer.state?.taskId;
  const isBoard = prefs.view === "board";

  const viewButtons: { id: ViewMode; label: string; icon: typeof List }[] = [
    { id: "list", label: "List", icon: List },
    { id: "board", label: "Board", icon: Columns3 },
    { id: "focus", label: "Focus", icon: Target },
  ];

  const sidebar = (
    <aside className={clsx("space-y-6", isBoard ? "grid md:grid-cols-2 gap-6 space-y-0" : "")}>
      <WeeklyReview stats={stats} />
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2"><Sparkles size={14} className="text-amber-400" /> QA routines</h2>
        <p className="text-[11px] text-slate-500 mt-1">One click adds a task with its checklist.</p>
        <div className="mt-3 grid gap-2">
          {TODO_TEMPLATES.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => openTemplate(t)}
              className="flex items-center gap-2.5 text-left rounded-2xl border border-slate-800 bg-slate-950/40 px-3 py-2.5 hover:border-slate-700 hover:bg-slate-800/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <span className={clsx("w-1.5 h-7 rounded-full shrink-0", PRIORITY_STRIP[t.priority])} />
              <span className="flex-1 min-w-0">
                <span className="block text-sm text-slate-200">{t.name}</span>
                <span className="block text-[11px] text-slate-500 truncate">{t.subtasks.length} steps{t.recurring ? ` · repeats ${t.recurring}` : ""}</span>
              </span>
              <Plus size={14} className="text-slate-500" />
            </button>
          ))}
        </div>
        <p className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-500"><Keyboard size={12} /> N add · / search · F focus mode</p>
      </section>
    </aside>
  );

  return (
    <div className="flex flex-col min-h-full">
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-4 sm:px-6 h-14 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-sm font-semibold text-slate-200 truncate">To-Do List</h1>
          {activeCount > 0 && (
            <span className="hidden sm:inline text-xs bg-blue-600/20 text-sky-400 border border-blue-600/30 px-2 py-0.5 rounded-full">{activeCount} active</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="flex gap-0.5 bg-slate-900 border border-slate-800 rounded-xl p-0.5" role="tablist" aria-label="View">
            {viewButtons.map(v => (
              <button
                key={v.id}
                type="button"
                role="tab"
                aria-selected={prefs.view === v.id}
                onClick={() => updatePrefs({ view: v.id })}
                title={v.label}
                className={clsx(
                  "flex items-center gap-1.5 px-2 sm:px-2.5 py-1 text-xs rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                  prefs.view === v.id ? "bg-slate-700 text-slate-100" : "text-slate-500 hover:text-slate-300",
                )}
              >
                <v.icon size={13} /><span className="hidden sm:inline">{v.label}</span>
              </button>
            ))}
          </div>
          {prefs.view !== "focus" && (
            <button
              type="button"
              onClick={() => { setSelectMode(v => !v); setSelected(new Set()); }}
              className={clsx("px-2.5 sm:px-3 py-1.5 text-xs rounded-lg border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                selectMode ? "bg-blue-600/20 border-blue-600/50 text-sky-300" : "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300")}
            >
              Select
            </button>
          )}
          <button
            type="button"
            onClick={() => setModal({})}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            <Plus size={13} /><span className="hidden sm:inline">Add</span>
          </button>
        </div>
      </header>

      <div className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-7 space-y-6 min-w-0">
        <SummaryHeader stats={stats} />
        <FocusTimerBar timer={timer} />

        {api.ready && todos.length === 0 ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900 px-6 py-16 text-center">
            <div className="w-16 h-16 rounded-3xl bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={28} className="text-green-400" />
            </div>
            <p className="text-slate-200 font-medium">Nothing to do yet</p>
            <p className="text-slate-500 text-sm mt-1 mb-6">Type a task below, or start from a QA routine.</p>
            <div className="max-w-xl mx-auto text-left">
              <QuickAdd onAdd={handleQuickAdd} onTemplate={openTemplate} inputRef={quickAddRef} />
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-5">
              {TODO_TEMPLATES.map(t => (
                <button key={t.id} type="button" onClick={() => openTemplate(t)} className="text-xs px-3 py-1.5 rounded-full border border-slate-700 text-slate-300 hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className={clsx("grid gap-6", !isBoard && "lg:grid-cols-[minmax(0,1fr)_300px]")}>
            <div className="min-w-0 space-y-4">
              {prefs.view !== "focus" && prefs.status !== "done" && (
                <QuickAdd onAdd={handleQuickAdd} onTemplate={openTemplate} inputRef={quickAddRef} />
              )}

              {prefs.view !== "focus" && (
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 min-w-[10rem]">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      ref={searchRef}
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search tasks, tags, Jira keys…"
                      aria-label="Search tasks"
                      className="w-full pl-8 pr-8 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/60 focus-visible:ring-2 focus-visible:ring-blue-500/40"
                    />
                    {search && (
                      <button type="button" onClick={() => setSearch("")} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"><X size={13} /></button>
                    )}
                  </div>

                  <Popover
                    title="Filter by tag"
                    icon={<Tag size={13} />}
                    label={<span className="text-xs">{tagFilter ? `#${tagFilter}` : "Tag"}</span>}
                    buttonClassName={clsx("px-2.5 py-1.5 border", tagFilter ? "border-violet-500/40 text-violet-400 bg-violet-500/10" : "border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200")}
                  >
                    {close => (
                      <div className="w-52 max-h-64 overflow-y-auto space-y-0.5">
                        <MenuItem active={!tagFilter} onClick={() => { setTagFilter(null); close(); }}>All tags</MenuItem>
                        {allLabels.length === 0 && <p className="px-2.5 py-1.5 text-xs text-slate-500">No tags yet. Add #tag when typing a task.</p>}
                        {allLabels.map(l => (
                          <MenuItem key={l} active={tagFilter === l} onClick={() => { setTagFilter(l); close(); }}>
                            <span className={clsx("text-[11px] px-1.5 rounded border", labelTone(l))}>#{l}</span>
                          </MenuItem>
                        ))}
                      </div>
                    )}
                  </Popover>

                  <Popover
                    title="Filter by priority"
                    icon={<Flag size={13} />}
                    label={<span className="text-xs">{prioFilter === "all" ? "Priority" : TODO_PRIORITY_META[prioFilter].label}</span>}
                    buttonClassName={clsx("px-2.5 py-1.5 border", prioFilter !== "all" ? "border-orange-500/40 text-orange-400 bg-orange-500/10" : "border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200")}
                  >
                    {close => (
                      <div className="w-40 space-y-0.5">
                        <MenuItem active={prioFilter === "all"} onClick={() => { setPrioFilter("all"); close(); }}>All priorities</MenuItem>
                        {(["high", "medium", "low"] as TodoPriority[]).map(p => (
                          <MenuItem key={p} active={prioFilter === p} onClick={() => { setPrioFilter(p); close(); }}>
                            <span className={clsx("w-2 h-2 rounded-full", PRIORITY_STRIP[p])} /> {TODO_PRIORITY_META[p].label}
                          </MenuItem>
                        ))}
                      </div>
                    )}
                  </Popover>

                  <div className="flex gap-0.5 bg-slate-900 border border-slate-800 rounded-xl p-0.5">
                    {(["all", "active", "done"] as StatusTab[]).map(s => (
                      <button key={s} type="button" onClick={() => updatePrefs({ status: s })}
                        className={clsx("px-2.5 py-1 text-xs rounded-lg capitalize transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                          prefs.status === s ? "bg-slate-700 text-slate-100" : "text-slate-500 hover:text-slate-300")}>
                        {s}
                      </button>
                    ))}
                  </div>

                  {isBoard ? (
                    <div className="flex gap-0.5 bg-slate-900 border border-slate-800 rounded-xl p-0.5">
                      {(["group", "priority"] as BoardBy[]).map(b => (
                        <button key={b} type="button" onClick={() => updatePrefs({ boardBy: b })}
                          className={clsx("px-2.5 py-1 text-xs rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                            prefs.boardBy === b ? "bg-slate-700 text-slate-100" : "text-slate-500 hover:text-slate-300")}>
                          By {b === "group" ? "date" : "priority"}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <label className="flex items-center gap-1 text-slate-500 px-1">
                      <ArrowUpDown size={12} />
                      <select
                        value={prefs.sortBy}
                        onChange={e => updatePrefs({ sortBy: e.target.value as SortBy })}
                        aria-label="Sort"
                        className="bg-transparent text-xs text-slate-400 focus:outline-none cursor-pointer rounded focus-visible:ring-2 focus-visible:ring-blue-500"
                      >
                        <option value="manual">Manual (drag)</option>
                        <option value="priority">Priority</option>
                        <option value="due">Due date</option>
                        <option value="created">Created</option>
                      </select>
                    </label>
                  )}

                  {filtering && (
                    <button type="button" onClick={() => { setSearch(""); setTagFilter(null); setPrioFilter("all"); }} className="text-xs text-slate-500 hover:text-slate-300 underline decoration-dotted">
                      Clear filters
                    </button>
                  )}
                </div>
              )}

              {prefs.view === "focus" ? (
                <FocusView todos={todos} api={api} onStartFocus={startFocus} focusTaskId={focusTaskId} onEdit={item => setModal({ item })} />
              ) : isBoard ? (
                <BoardView
                  groups={groups}
                  by={prefs.boardBy}
                  api={api}
                  onEdit={item => setModal({ item })}
                  onStartFocus={startFocus}
                  focusTaskId={focusTaskId}
                  showDone={prefs.status !== "active"}
                />
              ) : filtering && filtered.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-800 py-12 text-center">
                  <Search size={24} className="mx-auto text-slate-600 mb-2" />
                  <p className="text-sm text-slate-400">No tasks match these filters.</p>
                </div>
              ) : (
                <ListView
                  groups={groups}
                  collapsed={collapsed}
                  onCollapse={toggleCollapse}
                  showDone={prefs.status !== "active"}
                  hideEmpty={filtering || prefs.status === "done"}
                  api={api}
                  allTodos={todos}
                  sortable={prefs.sortBy === "manual" && !selectMode && !filtering}
                  selectMode={selectMode}
                  selected={selected}
                  onSelect={toggleSelect}
                  onEdit={item => setModal({ item })}
                  onStartFocus={startFocus}
                  focusTaskId={focusTaskId}
                />
              )}
            </div>
            {sidebar}
          </div>
        )}
      </div>

      {modal && (
        <TodoModal item={modal.item} isNew={modal.isNew} onClose={() => setModal(null)} onSave={api.upsert} />
      )}

      {selectMode && selected.size > 0 && (
        <BulkBar
          count={selected.size}
          onMarkDone={() => { api.bulkDone(selected); setSelected(new Set()); setSelectMode(false); }}
          onDelete={() => { api.removeMany(selected); setSelected(new Set()); setSelectMode(false); }}
          onCancel={() => { setSelectMode(false); setSelected(new Set()); }}
        />
      )}

      <Toast toast={api.toast} />
    </div>
  );
}
