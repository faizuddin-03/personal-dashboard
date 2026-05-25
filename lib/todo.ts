import { remoteSync } from "./remote-sync";
export type TodoPriority = "high" | "medium" | "low";

export interface TodoItem {
  id: string;
  title: string;
  note: string; // rich-text HTML
  done: boolean;
  priority: TodoPriority;
  dueDate?: string;
  labels: string[];
  createdAt: string;
  doneAt?: string;
  recurring?: "daily" | "weekly" | "monthly";
  jiraKey?: string;
}

export function advanceRecurring(item: TodoItem): TodoItem {
  let nextDue: string | undefined;
  const base = item.dueDate ? new Date(item.dueDate) : new Date();
  const next = new Date(base);
  if (item.recurring === "daily") {
    next.setDate(next.getDate() + 1);
  } else if (item.recurring === "weekly") {
    next.setDate(next.getDate() + 7);
  } else if (item.recurring === "monthly") {
    next.setDate(next.getDate() + 30);
  }
  nextDue = next.toISOString().slice(0, 10);
  return {
    ...item,
    id: crypto.randomUUID(),
    done: false,
    doneAt: undefined,
    dueDate: nextDue,
    createdAt: new Date().toISOString(),
  };
}

export const TODO_PRIORITY_META: Record<TodoPriority, { label: string; color: string; dot: string }> = {
  high:   { label: "High",   color: "text-orange-400", dot: "bg-orange-500" },
  medium: { label: "Medium", color: "text-yellow-400", dot: "bg-yellow-500" },
  low:    { label: "Low",    color: "text-slate-500",  dot: "bg-slate-600" },
};

export function getTodos(): TodoItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("todo_items") ?? "[]");
  } catch { return []; }
}

export function saveTodos(items: TodoItem[]) {
  const json = JSON.stringify(items);
  localStorage.setItem("todo_items", json);
  remoteSync("todo_items", json);
}

export function isTodoOverdue(item: TodoItem): boolean {
  return !item.done && !!item.dueDate && new Date(item.dueDate) < new Date();
}

export function isDueToday(item: TodoItem): boolean {
  if (!item.dueDate || item.done) return false;
  const d = new Date(item.dueDate);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
}
