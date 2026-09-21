export type Priority = "urgent" | "high" | "medium" | "low";
export type ColumnId = "urgent" | "todo" | "ongoing" | "on-hold" | "finished";

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface KanbanCard {
  id: string;
  columnId: ColumnId;
  type: "custom" | "jira";
  boardType: "task" | "cr";
  title: string;
  description?: string;
  priority: Priority;
  labels: string[];
  dueDate?: string;
  dueTime?: string;
  checklist: ChecklistItem[];
  estimatedHours?: number;
  assignee?: string;
  accentColor?: string;
  // Jira-specific
  jiraKey?: string;
  jiraStatus?: string;
  jiraType?: string;
  jiraProject?: string;
  /** Card was created by the CR auto-sync (QA field / assignee match) and is moved/removed by it. Manual cards are never touched. */
  autoSynced?: boolean;
  // TS Tracker link
  linkedTSSuiteId?: string;
  createdAt: string;
  columnEnteredAt?: string;
  archived?: boolean;
  archivedAt?: string;
}

export interface KanbanState {
  urgent: KanbanCard[];
  todo: KanbanCard[];
  ongoing: KanbanCard[];
  "on-hold": KanbanCard[];
  finished: KanbanCard[];
}

export const COLUMN_IDS: ColumnId[] = ["urgent", "todo", "ongoing", "on-hold", "finished"];

export const COLUMN_META: Record<ColumnId, { label: string; color: string; headerBg: string }> = {
  urgent:   { label: "Urgent",   color: "red",    headerBg: "bg-red-950/60 border-red-800" },
  todo:     { label: "To-Do",    color: "slate",  headerBg: "bg-slate-800 border-slate-700" },
  ongoing:  { label: "On-Going", color: "blue",   headerBg: "bg-blue-950/60 border-blue-800" },
  "on-hold":{ label: "On-Hold",  color: "amber",  headerBg: "bg-amber-950/60 border-amber-800" },
  finished: { label: "Finished", color: "green",  headerBg: "bg-green-950/60 border-green-800" },
};

export const PRIORITY_META: Record<Priority, { label: string; color: string; dot: string }> = {
  urgent: { label: "Urgent", color: "text-red-400",    dot: "bg-red-500" },
  high:   { label: "High",   color: "text-orange-400", dot: "bg-orange-500" },
  medium: { label: "Medium", color: "text-yellow-400", dot: "bg-yellow-500" },
  low:    { label: "Low",    color: "text-slate-400",  dot: "bg-slate-500" },
};

export const ACCENT_COLORS: { label: string; value: string; cls: string; swatch: string }[] = [
  { label: "None",      value: "",          cls: "border-l-slate-700",   swatch: "#334155" },
  { label: "Red",       value: "red",       cls: "border-l-red-500",     swatch: "#a05252" },
  { label: "Sky Blue",  value: "sky",       cls: "border-l-sky-400",     swatch: "#4a8aaa" },
  { label: "Blue",      value: "blue",      cls: "border-l-blue-500",    swatch: "#3a6490" },
  { label: "Purple",    value: "purple",    cls: "border-l-purple-500",  swatch: "#7a5aa0" },
  { label: "Green",     value: "green",     cls: "border-l-green-500",   swatch: "#4a8860" },
  { label: "Yellow",    value: "yellow",    cls: "border-l-yellow-500",  swatch: "#9a8830" },
  { label: "Orange",    value: "orange",    cls: "border-l-orange-500",  swatch: "#9a5e30" },
  { label: "Pink",      value: "pink",      cls: "border-l-pink-500",    swatch: "#a04878" },
];

export function accentBorderClass(color?: string): string {
  return ACCENT_COLORS.find(c => c.value === color)?.cls ?? "border-l-slate-700";
}

export function getKanbanState(): KanbanState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = localStorage.getItem("kanban_state");
    const parsed = raw ? JSON.parse(raw) : emptyState();
    const state: KanbanState = { ...emptyState(), ...parsed };
    // Backfill boardType for cards created before this field existed
    for (const col of ["urgent", "todo", "ongoing", "on-hold", "finished"] as ColumnId[]) {
      state[col] = state[col].map((c: KanbanCard) => ({ ...c, boardType: c.boardType ?? "task" }));
    }
    return state;
  } catch { return emptyState(); }
}

export function saveKanbanState(state: KanbanState) {
  localStorage.setItem("kanban_state", JSON.stringify(state));
}

function emptyState(): KanbanState {
  return { urgent: [], todo: [], ongoing: [], "on-hold": [], finished: [] };
}

// ── Per-column sort by date moved ───────────────────────────
// "manual" keeps the hand-arranged order stored in KanbanState. The two date modes
// are display-only — they never rewrite the stored array, so switching back to
// "manual" restores the arrangement exactly as it was left.

export type ColumnSort = "manual" | "asc" | "desc";
export type ColumnSortState = Record<ColumnId, ColumnSort>;

export const SORT_META: Record<ColumnSort, { label: string; hint: string }> = {
  manual: { label: "Manual",      hint: "Default order — drag to arrange" },
  asc:    { label: "Oldest move", hint: "Sorted by date moved, oldest first — drag to reorder is off" },
  desc:   { label: "Newest move", hint: "Sorted by date moved, newest first — drag to reorder is off" },
};

/** Cycles Manual → Oldest → Newest → Manual. */
export function nextColumnSort(sort: ColumnSort): ColumnSort {
  return sort === "manual" ? "asc" : sort === "asc" ? "desc" : "manual";
}

/**
 * When the card last entered its column. Cards created before `columnEnteredAt`
 * existed, and cards that have never moved, fall back to their creation date —
 * the same rule `timeInColumn` uses.
 */
export function movedAt(card: KanbanCard): number {
  const raw = card.columnEnteredAt ?? card.createdAt;
  const t = new Date(raw).getTime();
  return Number.isNaN(t) ? 0 : t;
}

/** Display-only ordering. Equal timestamps keep their relative manual order (stable sort). */
export function sortCardsByMove(cards: KanbanCard[], sort: ColumnSort): KanbanCard[] {
  if (sort === "manual") return cards;
  const dir = sort === "asc" ? 1 : -1;
  return [...cards].sort((a, b) => (movedAt(a) - movedAt(b)) * dir);
}

function emptySortState(): ColumnSortState {
  return { urgent: "manual", todo: "manual", ongoing: "manual", "on-hold": "manual", finished: "manual" };
}

export function getColumnSort(): ColumnSortState {
  if (typeof window === "undefined") return emptySortState();
  try {
    const raw = localStorage.getItem("kanban_column_sort");
    return raw ? { ...emptySortState(), ...JSON.parse(raw) } : emptySortState();
  } catch { return emptySortState(); }
}

export function saveColumnSort(state: ColumnSortState) {
  localStorage.setItem("kanban_column_sort", JSON.stringify(state));
}

export function isOverdue(card: KanbanCard): boolean {
  if (!card.dueDate || card.columnId === "finished") return false;
  const dateStr = card.dueTime ? `${card.dueDate}T${card.dueTime}` : `${card.dueDate}T23:59:59`;
  return new Date(dateStr) < new Date();
}

export function isDueToday(card: KanbanCard): boolean {
  if (!card.dueDate || card.columnId === "finished") return false;
  const [y, m, d] = card.dueDate.split("-").map(Number);
  const now = new Date();
  return y === now.getFullYear() && m - 1 === now.getMonth() && d === now.getDate();
}

export function timeInColumn(card: KanbanCard): string {
  const since = card.columnEnteredAt ? new Date(card.columnEnteredAt) : new Date(card.createdAt);
  const ms = Date.now() - since.getTime();
  const hours = Math.floor(ms / 3600000);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  if (weeks > 0) return `${weeks}w`;
  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  return "< 1h";
}

export function getArchivedCards(): KanbanCard[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem("kanban_archive") ?? "[]"); }
  catch { return []; }
}

export function saveArchivedCards(cards: KanbanCard[]) {
  localStorage.setItem("kanban_archive", JSON.stringify(cards));
}

export function checklistProgress(card: KanbanCard): { done: number; total: number } {
  const total = card.checklist.length;
  const done = card.checklist.filter(c => c.done).length;
  return { done, total };
}

// ---- Backup settings ----
export type BackupSchedule = "daily-5pm" | "hourly" | "weekly" | "biweekly";

export interface BackupSettings {
  enabled: boolean;
  schedule: BackupSchedule;
  lastBackupDate: string | null; // YYYY-MM-DD
  lastBackupHour: number | null; // for hourly — last hour that triggered
}

export const DEFAULT_BACKUP_SETTINGS: BackupSettings = {
  enabled: true,
  schedule: "daily-5pm",
  lastBackupDate: null,
  lastBackupHour: null,
};

export function getBackupSettings(): BackupSettings {
  if (typeof window === "undefined") return DEFAULT_BACKUP_SETTINGS;
  try {
    const raw = localStorage.getItem("backup_settings");
    return raw ? { ...DEFAULT_BACKUP_SETTINGS, ...JSON.parse(raw) } : DEFAULT_BACKUP_SETTINGS;
  } catch { return DEFAULT_BACKUP_SETTINGS; }
}

export function saveBackupSettings(s: BackupSettings) {
  localStorage.setItem("backup_settings", JSON.stringify(s));
}

export const BACKUP_SCHEDULE_LABELS: Record<BackupSchedule, string> = {
  "daily-5pm": "Every weekday at 5:00 PM",
  "hourly":    "Every hour (weekdays, 8 AM – 6 PM)",
  "weekly":    "Every Friday at 5:00 PM",
  "biweekly":  "Every other Friday at 5:00 PM",
};
