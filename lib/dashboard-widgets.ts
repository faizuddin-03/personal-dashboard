export type WidgetId =
  | "kanban-summary"
  | "todo-snapshot"
  | "deployments"
  | "jira-snapshot"
  | "ongoing"
  | "raised"
  | "jira-overview";

export interface WidgetConfig {
  id: WidgetId;
  label: string;
  visible: boolean;
}

const DEFAULTS: WidgetConfig[] = [
  { id: "kanban-summary",  label: "Kanban Summary",       visible: true },
  { id: "todo-snapshot",   label: "To-Do Snapshot",       visible: true },
  { id: "deployments",     label: "Upcoming Deployments", visible: true },
  { id: "jira-snapshot",   label: "Jira Snapshot",        visible: true },
  { id: "ongoing",         label: "On-Going Cards",       visible: true },
  { id: "raised",          label: "Raised Tickets",       visible: true },
  { id: "jira-overview",   label: "Jira Overview Link",   visible: false },
];

const KEY = "dashboard_widgets";

export function getWidgetConfig(): WidgetConfig[] {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const saved: WidgetConfig[] = JSON.parse(raw);
    const ids = new Set(saved.map(w => w.id));
    // append any new widgets not yet saved, preserving existing order
    const merged = [...saved, ...DEFAULTS.filter(d => !ids.has(d.id))];
    return merged;
  } catch { return DEFAULTS; }
}

export function saveWidgetConfig(config: WidgetConfig[]) {
  localStorage.setItem(KEY, JSON.stringify(config));
}
