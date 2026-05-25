import { remoteSync } from "./remote-sync";
export type DeploymentType   = "day" | "night";
export type DeploymentStatus = "planned" | "in-progress" | "completed" | "cancelled" | "failed";

export interface Deployment {
  id: string;
  ticketKey: string;
  ticketSummary: string;
  date: string;          // YYYY-MM-DD
  time: string;          // HH:MM
  type: DeploymentType;
  environment: string;   // "Production" | "Staging" | "UAT" | "Development" | custom
  deployedBy: string;
  rollbackPlan: string;
  notes: string;
  status: DeploymentStatus;
  createdAt: string;
}

export const DEPLOYMENT_TYPE_META: Record<DeploymentType, {
  label: string; bg: string; text: string; border: string; dot: string; chipBg: string;
}> = {
  day: {
    label: "Day Deployment",
    bg:      "bg-sky-950/50",
    text:    "text-sky-300",
    border:  "border-sky-700/60",
    dot:     "bg-sky-400",
    chipBg:  "bg-sky-900/60 border-sky-700/50 text-sky-200",
  },
  night: {
    label: "Night Deployment",
    bg:      "bg-purple-950/60",
    text:    "text-purple-300",
    border:  "border-purple-800/60",
    dot:     "bg-purple-500",
    chipBg:  "bg-purple-950/70 border-purple-800/60 text-purple-200",
  },
};

export const DEPLOYMENT_STATUS_META: Record<DeploymentStatus, { label: string; color: string }> = {
  planned:      { label: "Planned",     color: "text-blue-400"   },
  "in-progress":{ label: "In Progress", color: "text-yellow-400" },
  completed:    { label: "Completed",   color: "text-green-400"  },
  cancelled:    { label: "Cancelled",   color: "text-slate-500"  },
  failed:       { label: "Failed",      color: "text-red-400"    },
};

export const DEPLOYMENT_ENVIRONMENTS = ["Production", "Staging", "UAT", "Development"];

export function getDeployments(): Deployment[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem("deployments") ?? "[]"); }
  catch { return []; }
}

export function saveDeployments(items: Deployment[]) {
  const json = JSON.stringify(items);
  localStorage.setItem("deployments", json);
  remoteSync("deployments", json);
}
