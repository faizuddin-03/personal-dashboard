export type TodoPriority = "high" | "medium" | "low";

export interface SubTask {
  id: string;
  title: string;
  done: boolean;
}

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
  subtasks?: SubTask[];
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
    next.setMonth(next.getMonth() + 1);
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
  localStorage.setItem("todo_items", JSON.stringify(items));
}

export function isTodoOverdue(item: TodoItem): boolean {
  if (!item.done && !!item.dueDate) {
    const due = new Date(item.dueDate + "T23:59:59");
    return due < new Date();
  }
  return false;
}

export function isDueToday(item: TodoItem): boolean {
  if (!item.dueDate || item.done) return false;
  const [y, m, d] = item.dueDate.split("-").map(Number);
  const now = new Date();
  return y === now.getFullYear() && m - 1 === now.getMonth() && d === now.getDate();
}
