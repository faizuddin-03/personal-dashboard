export interface JiraCredentials {
  baseUrl: string;
  email: string;
  apiToken: string;
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

export function statusColor(statusKey: string): string {
  switch (statusKey) {
    case "done":
      return "bg-green-100 text-green-800";
    case "indeterminate":
      return "bg-blue-100 text-blue-800";
    case "new":
      return "bg-gray-100 text-gray-700";
    default:
      return "bg-yellow-100 text-yellow-800";
  }
}

export function priorityColor(priority: string | undefined): string {
  switch (priority?.toLowerCase()) {
    case "highest":
    case "critical":
      return "text-red-600";
    case "high":
      return "text-orange-500";
    case "medium":
      return "text-yellow-500";
    case "low":
      return "text-blue-400";
    case "lowest":
      return "text-gray-400";
    default:
      return "text-gray-400";
  }
}
