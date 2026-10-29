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
  // ── Added 2026-10 (optional, older records load unchanged) ──
  /** Release / fix version, e.g. "S34.X". */
  fixVersion?: string;
  /** Extra ticket keys shipped in this deployment (besides ticketKey). */
  tickets?: string[];
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
  try {
    const parsed = JSON.parse(localStorage.getItem("deployments") ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  }
  catch { return []; }
}

export function saveDeployments(items: Deployment[]) {
  try { localStorage.setItem("deployments", JSON.stringify(items)); }
  catch { /* storage full or blocked — keep in-memory state */ }
}

/** Every ticket key tied to a deployment: ticketKey, tickets[], and keys found in summary/notes. */
export function deploymentTicketKeys(d: Deployment): string[] {
  const keys = new Set<string>();
  if (d.ticketKey?.trim()) keys.add(d.ticketKey.trim().toUpperCase());
  for (const k of d.tickets ?? []) if (k.trim()) keys.add(k.trim().toUpperCase());
  const text = `${d.ticketSummary ?? ""} ${d.notes ?? ""}`;
  for (const m of text.matchAll(/\b[A-Z][A-Z0-9]+-\d+\b/g)) keys.add(m[0]);
  return [...keys];
}
