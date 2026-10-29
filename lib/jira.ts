export interface JiraCredentials {
  baseUrl: string;
  email: string;
  apiToken: string;
  tokenExpiry?: string; // ISO date string e.g. "2026-10-01"
  defaultProjectKey?: string; // e.g. "EAINT" — prepended when searching by number only
  accountId?: string; // Jira Cloud accountId — more reliable than currentUser() for reporter queries
}

/** Returns the JQL reporter clause using accountId when available, currentUser() as fallback. */
export function reporterIs(creds: JiraCredentials): string {
  return creds.accountId ? `reporter = "${creds.accountId}"` : `reporter = currentUser()`;
}

// ── Ticket search ───────────────────────────────────────────
// JQL has no substring operator for issue keys: `key = "EAINT-1197"` is exact and
// `text ~` only searches summary/description/comments, never the key. So a "contains"
// search on a number is built by expanding it into key ranges — typing 1197 asks for
// 1197 itself plus 11970-11979, 119700-119799, 1197000-1197999.

/** How many digits may follow the typed number. 3 → 1197 still finds 1197999. */
const KEY_PREFIX_DIGITS = 3;

const JIRA_SEARCH_FIELDS = ["summary", "status", "issuetype", "project", "updated"];

/** Strips characters that would break out of a quoted JQL string literal. */
function jqlSafe(s: string): string {
  return s.trim().replace(/["\\]/g, "");
}

/**
 * `(key >= P-1197 AND key <= P-1197) OR (key >= P-11970 AND key <= P-11979) OR ...`
 * — one clause per extra digit. The typed number itself uses a degenerate range rather
 * than `key =` on purpose: equality against a key that doesn't exist makes Jira reject
 * the entire query, which would sink the search even when the wider matches do exist.
 */
function keyPrefixClauses(project: string, num: string): string {
  const clauses = [`(key >= "${project}-${num}" AND key <= "${project}-${num}")`];
  for (let d = 1; d <= KEY_PREFIX_DIGITS; d++) {
    const lo = num + "0".repeat(d);
    const hi = num + "9".repeat(d);
    clauses.push(`(key >= "${project}-${lo}" AND key <= "${project}-${hi}")`);
  }
  return clauses.join(" OR ");
}

/**
 * JQL for a user-typed ticket search — matches anything *containing* what was typed.
 *
 * "1197"        → that key plus every key whose number starts with 1197 (needs defaultProjectKey)
 * "EAINT-1197"  → same, against the project named in the query
 * "payment"     → summary prefix match plus a full-text match
 *
 * Returns "" for an empty query.
 */
export function buildIssueSearchJql(query: string, projectKey?: string): string {
  const q = jqlSafe(query);
  if (!q) return "";

  const asKey = /^([A-Za-z][A-Za-z0-9_]*)-(\d+)$/.exec(q);
  if (asKey) {
    const [, project, num] = asKey;
    return `(${keyPrefixClauses(project.toUpperCase(), num)}) ORDER BY key DESC`;
  }

  if (/^\d+$/.test(q)) {
    // Without a default project there is no key to build, so text is all that's left.
    if (!projectKey) return `text ~ "${q}*" ORDER BY updated DESC`;
    return `((${keyPrefixClauses(projectKey.toUpperCase(), q)}) OR text ~ "${q}*") ORDER BY key DESC`;
  }

  return `(summary ~ "${q}*" OR text ~ "${q}") ORDER BY updated DESC`;
}

/** The old exact-match JQL, kept as a fallback for Jira instances that reject key ranges. */
export function buildExactIssueSearchJql(query: string, projectKey?: string): string {
  const q = jqlSafe(query);
  if (!q) return "";
  if (/^\d+$/.test(q) && projectKey) return `key = "${projectKey}-${q}" ORDER BY updated DESC`;
  if (/^[A-Za-z][A-Za-z0-9_]*-\d+$/.test(q)) return `key = "${q}" ORDER BY updated DESC`;
  return `text ~ "${q}" ORDER BY updated DESC`;
}

/**
 * Runs a ticket search through /api/jira/search. Falls back to exact matching if the
 * broadened JQL is rejected, so a picky Jira instance degrades to the old behaviour
 * instead of showing nothing.
 */
export async function searchJiraIssues(
  creds: JiraCredentials,
  query: string,
  maxResults = 50,
): Promise<{ issues?: unknown[]; error?: string }> {
  const jql = buildIssueSearchJql(query, creds.defaultProjectKey);
  if (!jql) return { issues: [] };

  const run = (j: string) =>
    fetch("/api/jira/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...creds, jql: j, maxResults, fields: JIRA_SEARCH_FIELDS }),
    }).then(r => r.json());

  const data = await run(jql);
  if (!data?.error) return data;

  const exact = buildExactIssueSearchJql(query, creds.defaultProjectKey);
  return exact && exact !== jql ? run(exact) : data;
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
  setTimeout(() => URL.revokeObjectURL(url), 1000);
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
