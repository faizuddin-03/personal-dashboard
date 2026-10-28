"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  TodoItem, getTodos, saveTodos, advanceRecurring, addDaysISO,
  getDoneLog, getFocusLog, logCompletion, unlogCompletion, xpForTask, computeTodoStats,
  daysUntil,
} from "@/lib/todo";
import { burstFrom } from "./confetti";
import { useStoredRaw } from "./store";

export function newTodoId() { return crypto.randomUUID(); }

/** Read-modify-write against storage, so two open views never clobber each other. */
export function mutateTodos(fn: (items: TodoItem[]) => TodoItem[]): TodoItem[] {
  const next = fn(getTodos());
  saveTodos(next);
  return next;
}

export function addTimeToTask(id: string, sec: number) {
  if (sec <= 0) return;
  mutateTodos(items => items.map(t => t.id === id ? { ...t, timeSpentSec: (t.timeSpentSec ?? 0) + Math.round(sec) } : t));
}

function activeDueNowCount(items: TodoItem[]): number {
  return items.filter(t => !t.done && t.dueDate && daysUntil(t.dueDate) <= 0).length;
}

export interface TodoToast { key: number; text: string; tone: "xp" | "info" | "party" }

const LEAVE_MS = 380;

export function useTodos() {
  // Stored strings are the source of truth; every save fires `todos-updated`.
  const rawTodos = useStoredRaw("todo_items");
  const rawLog   = useStoredRaw("todo_done_log");
  const rawFocus = useStoredRaw("todo_focus_log");
  const ready = rawTodos !== null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const todos = useMemo(() => (ready ? getTodos() : []), [rawTodos]);

  const [leavingIds, setLeaving]  = useState<Set<string>>(new Set());
  const [justDone, setJustDone]   = useState<Set<string>>(new Set());
  const [toast, setToast]         = useState<TodoToast | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const pending = useRef<Set<string>>(new Set());

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const showToast = useCallback((text: string, tone: TodoToast["tone"] = "info") => {
    window.clearTimeout(toastTimer.current);
    setToast({ key: Date.now(), text, tone });
    toastTimer.current = window.setTimeout(() => setToast(null), tone === "party" ? 3200 : 1800);
  }, []);

  const mutate = useCallback((fn: (items: TodoItem[]) => TodoItem[]) => {
    mutateTodos(fn);
  }, []);

  const replaceAll = useCallback((items: TodoItem[]) => { saveTodos(items); }, []);

  const upsert = useCallback((item: TodoItem) => {
    mutate(items => items.some(t => t.id === item.id) ? items.map(t => t.id === item.id ? item : t) : [item, ...items]);
  }, [mutate]);

  const add = useCallback((partial: Partial<TodoItem> & { title: string }) => {
    const item: TodoItem = {
      id: newTodoId(), note: "", done: false, priority: "medium", labels: [],
      createdAt: new Date().toISOString(), ...partial,
    };
    mutate(items => [item, ...items]);
    return item;
  }, [mutate]);

  const update = useCallback((id: string, patch: Partial<TodoItem>) => {
    mutate(items => items.map(t => t.id === id ? { ...t, ...patch } : t));
  }, [mutate]);

  const remove = useCallback((id: string) => mutate(items => items.filter(t => t.id !== id)), [mutate]);
  const removeMany = useCallback((ids: Set<string>) => mutate(items => items.filter(t => !ids.has(t.id))), [mutate]);

  const complete = useCallback((id: string, el?: Element | null) => {
    const target = getTodos().find(t => t.id === id);
    if (!target || target.done || pending.current.has(id)) return;
    pending.current.add(id);
    const beforeDue = activeDueNowCount(getTodos());
    const xp = xpForTask(target);
    const at = new Date().toISOString();
    logCompletion({ id, at, xp, title: target.title });
    burstFrom(el);
    setJustDone(prev => new Set(prev).add(id));
    showToast(`+${xp} XP`, "xp");
    window.setTimeout(() => setLeaving(prev => new Set(prev).add(id)), 160);
    window.setTimeout(() => {
      const next = mutateTodos(items => items.map(t => {
        if (t.id !== id) return t;
        const doneItem = { ...t, done: true, doneAt: at };
        return t.recurring ? advanceRecurring(doneItem) : doneItem;
      }));
      setLeaving(prev => { const s = new Set(prev); s.delete(id); return s; });
      setJustDone(prev => { const s = new Set(prev); s.delete(id); return s; });
      pending.current.delete(id);
      const wasDueNow = !!target.dueDate && daysUntil(target.dueDate) <= 0;
      if (wasDueNow && beforeDue > 0 && activeDueNowCount(next) === 0) {
        burstFrom(null, true);
        showToast("Day cleared! Everything due today is done.", "party");
      }
    }, LEAVE_MS);
  }, [showToast]);

  const uncomplete = useCallback((id: string) => {
    unlogCompletion(id);
    mutate(items => items.map(t => t.id === id ? { ...t, done: false, doneAt: undefined } : t));
  }, [mutate]);

  const toggle = useCallback((id: string, el?: Element | null) => {
    const t = getTodos().find(x => x.id === id);
    if (!t) return;
    if (t.done) uncomplete(id); else complete(id, el);
  }, [complete, uncomplete]);

  /** Recurring: jump to the next occurrence without counting a completion. */
  const skip = useCallback((id: string) => {
    mutate(items => items.map(t => t.id === id && t.recurring ? advanceRecurring(t) : t));
    showToast("Skipped to the next occurrence");
  }, [mutate, showToast]);

  const snooze = useCallback((id: string, days: number) => {
    mutate(items => items.map(t => t.id === id ? { ...t, dueDate: addDaysISO(days) } : t));
    showToast(days === 1 ? "Snoozed to tomorrow" : `Snoozed ${days} days`);
  }, [mutate, showToast]);

  const toggleSubtask = useCallback((id: string, stId: string) => {
    mutate(items => items.map(t => t.id !== id ? t : {
      ...t, subtasks: (t.subtasks ?? []).map(s => s.id === stId ? { ...s, done: !s.done } : s),
    }));
  }, [mutate]);

  const addSubtask = useCallback((id: string, title: string) => {
    mutate(items => items.map(t => t.id !== id ? t : {
      ...t, subtasks: [...(t.subtasks ?? []), { id: newTodoId(), title, done: false }],
    }));
  }, [mutate]);

  const bulkDone = useCallback((ids: Set<string>) => {
    const at = new Date().toISOString();
    const current = getTodos();
    let xp = 0;
    for (const t of current) {
      if (ids.has(t.id) && !t.done) { const x = xpForTask(t); xp += x; logCompletion({ id: t.id, at, xp: x, title: t.title }); }
    }
    mutate(items => items.map(t => {
      if (!ids.has(t.id) || t.done) return t;
      const doneItem = { ...t, done: true, doneAt: at };
      return t.recurring ? advanceRecurring(doneItem) : doneItem;
    }));
    if (xp > 0) { burstFrom(null, ids.size > 2); showToast(`+${xp} XP`, "xp"); }
  }, [mutate, showToast]);

  const stats = useMemo(
    () => (ready ? computeTodoStats(todos, getDoneLog(), getFocusLog()) : computeTodoStats([], [], [])),
    // the raw strings change whenever the logs change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [todos, rawLog, rawFocus, ready],
  );

  return {
    todos, ready, stats, leavingIds, justDone, toast,
    replaceAll, upsert, add, update, remove, removeMany, toggle, complete, uncomplete,
    skip, snooze, toggleSubtask, addSubtask, bulkDone, showToast,
  };
}

export type TodoApi = ReturnType<typeof useTodos>;
