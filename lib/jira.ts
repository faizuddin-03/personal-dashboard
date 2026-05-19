export interface JiraCredentials {
  baseUrl: string;
  email: string;
  apiToken: string;
  tokenExpiry?: string; // ISO date string e.g. "2026-10-01"
}

export interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    status: {
      name: string;
      statusCategory: { colorName: string; key: string };
    };
    priority: { name: string; iconUrl: string } | null;
    issuetype: { name: string; iconUrl: string };
    assignee: { displayName: string; avatarUrls: { "48x48": string } } | null;
    reporter: { displayName: string; avatarUrls: { "48x48": string } } | null;
    created: string;
    updated: string;
    description: Record<string, unknown> | null;
    comment?: {
      comments: JiraComment[];
      total: number;
    };
    labels: string[];
    fixVersions: { name: string }[];
    project: { name: string; key: string };
    duedate: string | null;
    parent?: { key: string; fields: { summary: string; issuetype: { name: string } } } | null;
  };
}

export interface JiraComment {
  id: string;
  author: { displayName: string; avatarUrls: { "48x48": string } };
  body: Record<string, unknown> | null;
  created: string;
  updated: string;
}

export interface JiraTransition {
  id: string;
  name: string;
  to: { name: string; statusCategory: { colorName: string } };
}

export interface JiraSearchResult {
  issues: JiraIssue[];
  total: number;
  maxResults: number;
  startAt: number;
}

export function getStoredCredentials(): JiraCredentials | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("jira_credentials");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as JiraCredentials;
  } catch {
    return null;
  }
}

export function storeCredentials(creds: JiraCredentials) {
  localStorage.setItem("jira_credentials", JSON.stringify(creds));
}

export function clearCredentials() {
  localStorage.removeItem("jira_credentials");
}

export function tokenExpiryStatus(expiry?: string): {
  daysLeft: number;
  level: "ok" | "warn" | "critical" | "expired";
} | null {
  if (!expiry) return null;
  const now = new Date();
  const exp = new Date(expiry);
  const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft <= 0) return { daysLeft, level: "expired" };
  if (daysLeft <= 7) return { daysLeft, level: "critical" };
  if (daysLeft <= 30) return { daysLeft, level: "warn" };
  return { daysLeft, level: "ok" };
}

export function statusColor(statusKey: string): string {
  switch (statusKey) {
    case "done":
      return "bg-green-900/60 text-green-300";
    case "indeterminate":
      return "bg-blue-900/60 text-blue-300";
    case "new":
      return "bg-slate-700 text-slate-300";
    default:
      return "bg-yellow-900/60 text-yellow-300";
  }
}

export function priorityColor(priority: string | undefined): string {
  switch (priority?.toLowerCase()) {
    case "highest":
    case "critical":
      return "text-red-400";
    case "high":
      return "text-orange-400";
    case "medium":
      return "text-yellow-400";
    case "low":
      return "text-blue-400";
    case "lowest":
      return "text-slate-500";
    default:
      return "text-slate-500";
  }
}

export function exportLocalStorage(): void {
  const data: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) data[key] = localStorage.getItem(key) ?? "";
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `qa-dashboard-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importLocalStorage(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as Record<string, string>;
        Object.entries(data).forEach(([k, v]) => localStorage.setItem(k, v));
        resolve();
      } catch {
        reject(new Error("Invalid backup file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}
