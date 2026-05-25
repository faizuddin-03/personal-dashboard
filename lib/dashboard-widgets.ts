import { remoteSync } from "./remote-sync";
export type WidgetId =
  | "deployments"
  | "assigned-tickets"
  | "ongoing"
  | "ts-tracker"
  | "raised"
  | "jira-overview";

export interface WidgetConfig {
  id: WidgetId;
  label: string;
  visible: boolean;
}

const DEFAULTS: WidgetConfig[] = [
  { id: "deployments",      label: "Upcoming Deployments", visible: true  },
  { id: "assigned-tickets", label: "Assigned to Me",       visible: true  },
  { id: "ongoing",          label: "On-Going Cards",       visible: true  },
  { id: "ts-tracker",       label: "TS Tracker",           visible: true  },
  { id: "raised",           label: "Raised Tickets",       visible: true  },
  { id: "jira-overview",    label: "Jira Overview Link",   visible: false },
];

const KEY = "dashboard_widgets";
const VALID_IDS = new Set(DEFAULTS.map(d => d.id));

export function getWidgetConfig(): WidgetConfig[] {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const saved: WidgetConfig[] = JSON.parse(raw);
    // filter out widget IDs that no longer exist, then append any new defaults
    const valid = saved.filter(w => VALID_IDS.has(w.id));
    const ids = new Set(valid.map(w => w.id));
    return [...valid, ...DEFAULTS.filter(d => !ids.has(d.id))];
  } catch { return DEFAULTS; }
}

export function saveWidgetConfig(config: WidgetConfig[]) {
  const json = JSON.stringify(config);
  localStorage.setItem(KEY, json);
  remoteSync("dashboard_widgets", json);
}
