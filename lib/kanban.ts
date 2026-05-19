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
  title: string;
  description?: string;
  priority: Priority;
  labels: string[];
  dueDate?: string;
  checklist: ChecklistItem[];
  estimatedHours?: number;
  assignee?: string;
  accentColor?: string;
  // Jira-specific
  jiraKey?: string;
  jiraStatus?: string;
  jiraType?: string;
  jiraProject?: string;
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

export const ACCENT_COLORS = [
  { label: "None",   value: "",          cls: "border-l-slate-700" },
  { label: "Blue",   value: "blue",      cls: "border-l-blue-500" },
  { label: "Purple", value: "purple",    cls: "border-l-purple-500" },
  { label: "Green",  value: "green",     cls: "border-l-green-500" },
  { label: "Yellow", value: "yellow",    cls: "border-l-yellow-500" },
  { label: "Pink",   value: "pink",      cls: "border-l-pink-500" },
];

export function accentBorderClass(color?: string): string {
  return ACCENT_COLORS.find(c => c.value === color)?.cls ?? "border-l-slate-700";
}

export function getKanbanState(): KanbanState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = localStorage.getItem("kanban_state");
    const parsed = raw ? JSON.parse(raw) : emptyState();
    // Backfill new columns for existing saved data
    return { ...emptyState(), ...parsed };
  } catch { return emptyState(); }
}

export function saveKanbanState(state: KanbanState) {
  localStorage.setItem("kanban_state", JSON.stringify(state));
}

function emptyState(): KanbanState {
  return { urgent: [], todo: [], ongoing: [], "on-hold": [], finished: [] };
}

export function isOverdue(card: KanbanCard): boolean {
  return !!card.dueDate && new Date(card.dueDate) < new Date() && card.columnId !== "finished";
}

export function isDueToday(card: KanbanCard): boolean {
  if (!card.dueDate || card.columnId === "finished") return false;
  const d = new Date(card.dueDate);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
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
export interface BackupSettings {
  enabled: boolean;
  intervalWeeks: 1 | 2;
  time: string;
  lastBackupDate: string | null;
}

export const DEFAULT_BACKUP_SETTINGS: BackupSettings = {
  enabled: true,
  intervalWeeks: 2,
  time: "17:00",
  lastBackupDate: null,
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

export function nextBackupDate(settings: BackupSettings): Date | null {
  if (!settings.enabled) return null;
  const base = settings.lastBackupDate ? new Date(settings.lastBackupDate) : new Date();
  const daysToAdd = settings.intervalWeeks * 7;
  const next = new Date(base);
  next.setDate(next.getDate() + daysToAdd);
  // Advance to next Friday
  while (next.getDay() !== 5) next.setDate(next.getDate() + 1);
  const [h, m] = settings.time.split(":").map(Number);
  next.setHours(h, m, 0, 0);
  return next;
}
