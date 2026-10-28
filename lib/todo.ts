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
  /** Seconds recorded by the focus timer (optional, added 2026-10-21). */
  timeSpentSec?: number;
}

export function advanceRecurring(item: TodoItem): TodoItem {
  const base = item.dueDate ? new Date(item.dueDate) : new Date();
  const next = new Date(base);
  if (item.recurring === "daily") {
    next.setDate(next.getDate() + 1);
  } else if (item.recurring === "weekly") {
    next.setDate(next.getDate() + 7);
  } else if (item.recurring === "monthly") {
    next.setMonth(next.getMonth() + 1);
  }
  const nextDue = next.toISOString().slice(0, 10);
  return {
    ...item,
    id: crypto.randomUUID(),
    done: false,
    doneAt: undefined,
    dueDate: nextDue,
    createdAt: new Date().toISOString(),
    subtasks: item.subtasks?.map(s => ({ ...s, done: false })),
  };
}

export const TODO_PRIORITY_META: Record<TodoPriority, { label: string; color: string; dot: string }> = {
  high:   { label: "High",   color: "text-orange-400", dot: "bg-orange-500" },
  medium: { label: "Medium", color: "text-yellow-400", dot: "bg-yellow-500" },
  low:    { label: "Low",    color: "text-slate-500",  dot: "bg-slate-600" },
};

/** Fired on window after every saveTodos(), so open views stay in sync. */
export const TODOS_UPDATED_EVENT = "todos-updated";

export function getTodos(): TodoItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem("todo_items") ?? "[]");
    if (!Array.isArray(raw)) return [];
    // Defensive defaults for old or hand-edited rows; shape is unchanged.
    return raw.map((t: TodoItem) => ({
      ...t,
      note: t.note ?? "",
      labels: Array.isArray(t.labels) ? t.labels : [],
      priority: t.priority ?? "medium",
    }));
  } catch { return []; }
}

export function saveTodos(items: TodoItem[]) {
  try { localStorage.setItem("todo_items", JSON.stringify(items)); } catch { /* storage unavailable */ }
  try { window.dispatchEvent(new CustomEvent(TODOS_UPDATED_EVENT)); } catch { /* no window */ }
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

// ── Additions for the richer /todo page (2026-10-21) ─────────
// Everything below is additive. The stored shape of `todo_items` is unchanged
// apart from the optional `timeSpentSec` field.

/** Local-time YYYY-MM-DD (toISOString would give the UTC date). */
export function localISODate(d: Date = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function addDaysISO(days: number, from: Date = new Date()): string {
  return localISODate(new Date(from.getFullYear(), from.getMonth(), from.getDate() + days));
}

/** Whole days from today to the due date (negative = overdue). */
export function daysUntil(dueDate: string, now: Date = new Date()): number {
  const [y, m, d] = dueDate.split("-").map(Number);
  const due = new Date(y, m - 1, d).getTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((due - today) / 86_400_000);
}

export function formatDue(dueDate: string, now: Date = new Date()): string {
  const n = daysUntil(dueDate, now);
  if (n === 0) return "Today";
  if (n === 1) return "Tomorrow";
  if (n === -1) return "Yesterday";
  if (n < 0) return `${-n}d overdue`;
  if (n < 7) return new Date(dueDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" });
  return new Date(dueDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatDuration(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

export type TodoBucket = "overdue" | "today" | "tomorrow" | "week" | "later" | "nodate" | "done";

export const TODO_BUCKETS: TodoBucket[] = ["overdue", "today", "tomorrow", "week", "later", "nodate", "done"];

export const TODO_BUCKET_META: Record<TodoBucket, { label: string; accent: string; dot: string; empty: string }> = {
  overdue:  { label: "Overdue",   accent: "text-red-400",    dot: "bg-red-500",    empty: "Nothing overdue. Nice." },
  today:    { label: "Today",     accent: "text-amber-400",  dot: "bg-amber-500",  empty: "Nothing due today." },
  tomorrow: { label: "Tomorrow",  accent: "text-sky-400",    dot: "bg-sky-500",    empty: "Nothing lined up for tomorrow." },
  week:     { label: "This week", accent: "text-violet-400", dot: "bg-violet-500", empty: "The rest of the week is clear." },
  later:    { label: "Later",     accent: "text-teal-400",   dot: "bg-teal-500",   empty: "Nothing scheduled further out." },
  nodate:   { label: "No date",   accent: "text-slate-400",  dot: "bg-slate-500",  empty: "Every task has a date." },
  done:     { label: "Done",      accent: "text-green-400",  dot: "bg-green-500",  empty: "Nothing completed yet." },
};

/** "This week" = due in 2 to 7 days; "Later" = more than 7 days out. */
export function todoBucket(item: TodoItem, now: Date = new Date()): TodoBucket {
  if (item.done) return "done";
  if (!item.dueDate) return "nodate";
  const n = daysUntil(item.dueDate, now);
  if (n < 0) return "overdue";
  if (n === 0) return "today";
  if (n === 1) return "tomorrow";
  if (n <= 7) return "week";
  return "later";
}

export function stripHtml(html: string | undefined): string {
  if (!html) return "";
  return html
    .replace(/<(br|\/p|\/li|\/h\d)\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"").replace(/&#39;/g, "'").replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

// ── Quick-add parsing ────────────────────────────────────────
export interface ParsedQuickAdd {
  title: string;
  dueDate?: string;
  priority?: TodoPriority;
  labels: string[];
  recurring?: "daily" | "weekly" | "monthly";
  jiraKey?: string;
}

const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

/**
 * Shortcuts: today | tomorrow | tmr | mon..sun | next week | YYYY-MM-DD,
 * !high !med !low (or !1 !2 !3), #tag, every day|week|month.
 * A Jira key (e.g. EAINT-12107) is detected and kept in the title.
 */
export function parseQuickAdd(raw: string, now: Date = new Date()): ParsedQuickAdd {
  let text = ` ${raw} `;
  const out: ParsedQuickAdd = { title: "", labels: [] };

  text = text.replace(/\s!(high|hi|h|1|medium|med|m|2|low|lo|l|3)(?=\s)/gi, (_m, p: string) => {
    const k = p.toLowerCase();
    out.priority = ["high", "hi", "h", "1"].includes(k) ? "high" : ["low", "lo", "l", "3"].includes(k) ? "low" : "medium";
    return " ";
  });

  text = text.replace(/\s#([\w-]+)(?=\s)/g, (_m, t: string) => {
    if (!out.labels.includes(t)) out.labels.push(t);
    return " ";
  });

  text = text.replace(/\severy\s+(day|week|month)(?=\s)/gi, (_m, u: string) => {
    const k = u.toLowerCase();
    out.recurring = k === "day" ? "daily" : k === "week" ? "weekly" : "monthly";
    return " ";
  });

  text = text.replace(/\snext\s+week(?=\s)/gi, () => { out.dueDate = addDaysISO(7, now); return " "; });
  text = text.replace(/\s(\d{4}-\d{2}-\d{2})(?=\s)/g, (_m, d: string) => { out.dueDate = d; return " "; });
  text = text.replace(/\s(today|tod)(?=\s)/gi, () => { out.dueDate = addDaysISO(0, now); return " "; });
  text = text.replace(/\s(tomorrow|tmrw|tmr)(?=\s)/gi, () => { out.dueDate = addDaysISO(1, now); return " "; });
  text = text.replace(/\s(sun|mon|tue|tues|wed|thu|thur|thurs|fri|sat)(day|nesday|sday|urday)?(?=\s)/gi, (m, d: string) => {
    const idx = WEEKDAYS.indexOf(d.slice(0, 3).toLowerCase());
    if (idx < 0) return m;
    let diff = (idx - now.getDay() + 7) % 7;
    if (diff === 0) diff = 7; // "fri" on a Friday means next Friday
    out.dueDate = addDaysISO(diff, now);
    return " ";
  });

  const jira = text.match(/\b([A-Z][A-Z0-9]+-\d+)\b/);
  if (jira) out.jiraKey = jira[1];

  out.title = text.replace(/\s+/g, " ").trim();
  return out;
}

// ── Game layer: XP + completion log (separate key) ───────────
// Recurring tasks are replaced by their next occurrence on completion, so
// their doneAt is lost; this log keeps a record of every completion.
const DONE_LOG_KEY = "todo_done_log";

export const TODO_XP: Record<TodoPriority, number> = { high: 30, medium: 20, low: 10 };

export interface TodoCompletion { id: string; at: string; xp?: number; title?: string }

export function getDoneLog(): TodoCompletion[] {
  if (typeof window === "undefined") return [];
  try {
    const v = JSON.parse(localStorage.getItem(DONE_LOG_KEY) ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch { return []; }
}

function saveDoneLog(log: TodoCompletion[]) {
  try { localStorage.setItem(DONE_LOG_KEY, JSON.stringify(log)); } catch { /* storage unavailable */ }
  try { window.dispatchEvent(new CustomEvent(TODOS_UPDATED_EVENT)); } catch { /* no window */ }
}

export function logCompletion(entry: TodoCompletion) {
  const cutoff = Date.now() - 400 * 86_400_000;
  const log = getDoneLog().filter(e => new Date(e.at).getTime() > cutoff);
  log.push(entry);
  saveDoneLog(log);
}

export function unlogCompletion(id: string) {
  const log = getDoneLog();
  for (let i = log.length - 1; i >= 0; i--) {
    if (log[i].id === id) { log.splice(i, 1); break; }
  }
  saveDoneLog(log);
}

/** XP for one completion: priority base + 5 per finished subtask (max +25). */
export function xpForTask(item: TodoItem): number {
  const st = (item.subtasks ?? []).filter(s => s.done).length;
  return TODO_XP[item.priority ?? "medium"] + Math.min(25, st * 5);
}

/** Level n needs 50*n*(n-1) total XP: 0, 100, 300, 600, 1000 ... */
export function levelFromXp(xp: number): { level: number; into: number; span: number } {
  let level = 1;
  while (50 * (level + 1) * level <= xp) level++;
  const floor = 50 * level * (level - 1);
  const next = 50 * (level + 1) * level;
  return { level, into: xp - floor, span: next - floor };
}

// ── Focus sessions (separate key) ────────────────────────────
const FOCUS_LOG_KEY = "todo_focus_log";
export interface FocusSession { id: string; at: string; sec: number }

export function getFocusLog(): FocusSession[] {
  if (typeof window === "undefined") return [];
  try {
    const v = JSON.parse(localStorage.getItem(FOCUS_LOG_KEY) ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch { return []; }
}

export function logFocus(session: FocusSession) {
  try {
    const cutoff = Date.now() - 120 * 86_400_000;
    const log = getFocusLog().filter(e => new Date(e.at).getTime() > cutoff);
    log.push(session);
    localStorage.setItem(FOCUS_LOG_KEY, JSON.stringify(log));
    window.dispatchEvent(new CustomEvent(TODOS_UPDATED_EVENT));
  } catch { /* storage unavailable */ }
}

// ── Stats ────────────────────────────────────────────────────
export interface TodoStats {
  dueToday: number;      // active, due today
  overdue: number;
  upcoming: number;      // active, due after today
  doneToday: number;
  doneThisWeek: number;  // since Monday
  streak: number;        // consecutive days with at least one completion
  todayTotal: number;    // doneToday + active due today or overdue
  xp: number;
  xpThisWeek: number;
  perDayThisWeek: number[]; // Mon..Sun counts
  focusSecThisWeek: number;
}

export function computeTodoStats(
  items: TodoItem[], log: TodoCompletion[], focus: FocusSession[] = [], now: Date = new Date(),
): TodoStats {
  const entries: { day: string; xp: number }[] = [];
  const logged = new Set(log.map(e => e.id));
  for (const e of log) entries.push({ day: localISODate(new Date(e.at)), xp: e.xp ?? 0 });
  for (const t of items) {
    if (t.done && t.doneAt && !logged.has(t.id)) entries.push({ day: localISODate(new Date(t.doneAt)), xp: 0 });
  }
  const perDay = new Map<string, number>();
  for (const e of entries) perDay.set(e.day, (perDay.get(e.day) ?? 0) + 1);

  const today = localISODate(now);
  const doneToday = perDay.get(today) ?? 0;
  const dow = (now.getDay() + 6) % 7; // Monday = 0
  const weekDays = Array.from({ length: 7 }, (_, i) => addDaysISO(i - dow, now));
  const weekSet = new Set(weekDays.slice(0, dow + 1));
  const perDayThisWeek = weekDays.map(d => perDay.get(d) ?? 0);
  const doneThisWeek = perDayThisWeek.reduce((a, b) => a + b, 0);

  let xp = 0, xpThisWeek = 0;
  for (const e of entries) { xp += e.xp; if (weekSet.has(e.day)) xpThisWeek += e.xp; }

  let focusSecThisWeek = 0;
  for (const f of focus) if (weekSet.has(localISODate(new Date(f.at)))) focusSecThisWeek += f.sec;

  let streak = 0;
  let i = doneToday > 0 ? 0 : 1;
  while (perDay.get(addDaysISO(-i, now))) { streak++; i++; }

  let dueToday = 0, overdue = 0, upcoming = 0;
  for (const t of items) {
    if (t.done || !t.dueDate) continue;
    const n = daysUntil(t.dueDate, now);
    if (n < 0) overdue++; else if (n === 0) dueToday++; else upcoming++;
  }
  return {
    dueToday, overdue, upcoming, doneToday, doneThisWeek, streak,
    todayTotal: doneToday + dueToday + overdue, xp, xpThisWeek, perDayThisWeek, focusSecThisWeek,
  };
}

// ── QA routine templates ─────────────────────────────────────
export interface TodoTemplate {
  id: string;
  name: string;
  title: string;
  priority: TodoPriority;
  labels: string[];
  dueInDays?: number;
  recurring?: "daily" | "weekly" | "monthly";
  subtasks: string[];
}

export const TODO_TEMPLATES: TodoTemplate[] = [
  {
    id: "retest", name: "Retest after fix", title: "Retest fix for ", priority: "high",
    labels: ["retest"], dueInDays: 0,
    subtasks: ["Read the dev fix note", "Retest on staging", "Attach evidence screenshots", "Update the Jira status"],
  },
  {
    id: "prepare-ts", name: "Prepare TS", title: "Prepare TS for ", priority: "medium",
    labels: ["ts"], dueInDays: 1,
    subtasks: ["Study the ticket and latest SRD", "Draft the TS workbook", "Review scope and mandays", "Upload TS to SharePoint"],
  },
  {
    id: "daily-update", name: "Daily update", title: "Daily update", priority: "medium",
    labels: ["daily"], dueInDays: 0, recurring: "daily",
    subtasks: ["Post EOD update in Teams", "Log timesheet in CapacityTrack"],
  },
  {
    id: "regression", name: "Regression run", title: "Regression run for ", priority: "high",
    labels: ["regression"], dueInDays: 0,
    subtasks: ["Run the regression checklist", "Record pass / fail", "Raise QA issues for failures"],
  },
];
