export type WidgetId = "ongoing" | "upcoming" | "raised" | "jira-overview";

export interface WidgetConfig {
  id: WidgetId;
  label: string;
  visible: boolean;
}

const DEFAULTS: WidgetConfig[] = [
  { id: "ongoing",      label: "On-Going Tasks",    visible: true },
  { id: "upcoming",     label: "Next 7 Days",       visible: true },
  { id: "raised",       label: "Raised Tickets",    visible: true },
  { id: "jira-overview",label: "Jira Overview",     visible: true },
];

const KEY = "dashboard_widgets";

export function getWidgetConfig(): WidgetConfig[] {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const saved: WidgetConfig[] = JSON.parse(raw);
    // merge in any new widgets not yet in saved
    const ids = new Set(saved.map(w => w.id));
    const merged = [...saved, ...DEFAULTS.filter(d => !ids.has(d.id))];
    return merged;
  } catch { return DEFAULTS; }
}

export function saveWidgetConfig(config: WidgetConfig[]) {
  localStorage.setItem(KEY, JSON.stringify(config));
}
