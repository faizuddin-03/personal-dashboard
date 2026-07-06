import { JiraCredentials } from "./jira";
import {
  KanbanCard, KanbanState, ColumnId, Priority, COLUMN_IDS,
  getKanbanState, saveKanbanState, getArchivedCards,
} from "./kanban";

// ── CR auto-sync ──────────────────────────────────────────
// Pulls every parent CR ticket (issuetype = Task) where the current user is
// in the "QA" custom field or is the assignee, and mirrors them onto the CR
// kanban board:
//   - new tickets are added to the column mapped from their Jira status
//   - auto-synced cards follow status changes (done/closed → Finished)
//   - auto-synced cards are removed when the user is untagged/unassigned
//   - manually added cards are never moved or removed (only their cached
//     jiraStatus text is refreshed)

interface SyncIssue {
  key: string;
  fields: {
    summary: string;
    status: { name: string; statusCategory: { key: string } };
    priority: { name: string } | null;
    issuetype: { name: string };
    project: { name: string; key: string };
  };
}

export interface CrSyncResult {
  total: number;
  added: number;
  moved: number;
  removed: number;
  updated: number;
  bugs: number;
  warning?: string;
  syncedAt: string;
}

// ── Child QA-Issue bugs ───────────────────────────────────
// For every CR card on the board, the sync also pulls its child QA-Issue
// subtasks (the bugs QA raised under the CR) so cards can show bug progress
// and flag recently fixed bugs that may need a retest.

export interface ChildBug {
  key: string;
  summary: string;
  status: string;
  statusCategory: string; // "new" | "indeterminate" | "done"
  updated: string;
}

/** Maps parent CR key → its child QA-Issue bugs. */
export type ChildBugMap = Record<string, ChildBug[]>;

const CHILD_BUGS_KEY = "cr_child_bugs";

export function getChildBugs(): ChildBugMap {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(CHILD_BUGS_KEY) ?? "{}"); } catch { return {}; }
}

/** A bug fixed (done) within the last 48h — likely waiting for the QA to retest/verify. */
export function isRecentlyFixed(bug: ChildBug): boolean {
  return bug.statusCategory === "done" && Date.now() - new Date(bug.updated).getTime() < 48 * 3600 * 1000;
}

export function bugStats(bugs: ChildBug[] | undefined): { total: number; open: number; fixed: number; recentlyFixed: number } {
  const list = bugs ?? [];
  const fixed = list.filter(b => b.statusCategory === "done").length;
  return {
    total: list.length,
    open: list.length - fixed,
    fixed,
    recentlyFixed: list.filter(isRecentlyFixed).length,
  };
}

const QA_FIELD_CACHE_KEY = "jira_qa_field_id";

/** Finds the numeric id of the "QA" custom user-picker field (e.g. "10041"), cached in localStorage. */
async function discoverQaFieldId(creds: JiraCredentials): Promise<string | null> {
  const cached = localStorage.getItem(QA_FIELD_CACHE_KEY);
  if (cached) return cached;
  const res = await fetch("/api/jira/fields", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ baseUrl: creds.baseUrl, email: creds.email, apiToken: creds.apiToken }),
  });
  if (!res.ok) return null;
  const fields = (await res.json()) as { id?: string; name?: string }[];
  const qa = Array.isArray(fields)
    ? fields.find(f => f.name?.trim().toLowerCase() === "qa" && f.id?.startsWith("customfield_"))
    : null;
  if (!qa?.id) return null;
  const num = qa.id.replace("customfield_", "");
  localStorage.setItem(QA_FIELD_CACHE_KEY, num);
  return num;
}

function statusToColumn(statusName: string, categoryKey: string): ColumnId {
  if (categoryKey === "done") return "finished";
  if (/hold|block/i.test(statusName)) return "on-hold";
  if (categoryKey === "indeterminate") return "ongoing";
  return "todo";
}

function jiraPriorityToCardPriority(name?: string): Priority {
  switch (name?.toLowerCase()) {
    case "highest":
    case "critical":
      return "urgent";
    case "high":
      return "high";
    case "low":
    case "lowest":
      return "low";
    default:
      return "medium";
  }
}

async function fetchAllIssues<T>(creds: JiraCredentials, jql: string, fields: string[]): Promise<T[]> {
  const all: T[] = [];
  let nextPageToken: string | undefined;
  let pages = 0;
  do {
    const res = await fetch("/api/jira/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        baseUrl: creds.baseUrl, email: creds.email, apiToken: creds.apiToken,
        jql, maxResults: 100, nextPageToken, fields,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : "Jira search failed");
    all.push(...((data.issues ?? []) as T[]));
    nextPageToken = data.nextPageToken;
    pages++;
  } while (nextPageToken && pages < 30);
  return all;
}

interface ChildIssue {
  key: string;
  fields: {
    summary: string;
    status: { name: string; statusCategory: { key: string } };
    updated: string;
    parent?: { key: string } | null;
  };
}

async function fetchChildBugs(creds: JiraCredentials, crKeys: string[]): Promise<ChildBugMap> {
  const map: ChildBugMap = {};
  for (let i = 0; i < crKeys.length; i += 50) {
    const chunk = crKeys.slice(i, i + 50);
    const jql = `issuetype = "QA-Issue" AND parent in (${chunk.join(", ")}) ORDER BY updated DESC`;
    const issues = await fetchAllIssues<ChildIssue>(creds, jql, ["summary", "status", "updated", "parent"]);
    for (const b of issues) {
      const parentKey = b.fields.parent?.key;
      if (!parentKey) continue;
      (map[parentKey] ??= []).push({
        key: b.key,
        summary: b.fields.summary,
        status: b.fields.status.name,
        statusCategory: b.fields.status.statusCategory.key,
        updated: b.fields.updated,
      });
    }
  }
  return map;
}

export async function syncCrTickets(creds: JiraCredentials): Promise<CrSyncResult> {
  const me = creds.accountId ? `"${creds.accountId}"` : "currentUser()";
  const qaFieldNum = await discoverQaFieldId(creds);
  const matchClause = qaFieldNum
    ? `(cf[${qaFieldNum}] = ${me} OR assignee = ${me})`
    : `assignee = ${me}`;
  const jql = `${matchClause} AND issuetype = Task ORDER BY updated DESC`;

  const issues = await fetchAllIssues<SyncIssue>(creds, jql, ["summary", "status", "priority", "issuetype", "project"]);
  const byKey = new Map(issues.map(i => [i.key, i]));

  // Cards the user archived stay archived — don't resurrect them on the board.
  const archivedKeys = new Set(
    getArchivedCards().filter(c => c.boardType === "cr" && c.jiraKey).map(c => c.jiraKey!)
  );

  const state = getKanbanState();
  const next: KanbanState = { urgent: [], todo: [], ongoing: [], "on-hold": [], finished: [] };
  const seen = new Set<string>();
  let added = 0, moved = 0, removed = 0, updated = 0;

  for (const col of COLUMN_IDS) {
    for (const card of state[col]) {
      if (card.boardType !== "cr" || !card.jiraKey) {
        next[col].push(card);
        continue;
      }
      const issue = byKey.get(card.jiraKey);
      if (!issue) {
        // No longer QA/assignee on this ticket — auto cards go away, manual cards stay.
        if (card.autoSynced) { removed++; continue; }
        next[col].push(card);
        continue;
      }
      seen.add(card.jiraKey);
      const statusName = issue.fields.status.name;
      if (!card.autoSynced) {
        if (card.jiraStatus !== statusName) {
          updated++;
          next[col].push({ ...card, jiraStatus: statusName });
        } else {
          next[col].push(card);
        }
        continue;
      }
      const target = statusToColumn(statusName, issue.fields.status.statusCategory.key);
      const refreshed: KanbanCard = {
        ...card,
        columnId: target,
        title: issue.fields.summary,
        jiraStatus: statusName,
        jiraType: issue.fields.issuetype.name,
        jiraProject: issue.fields.project.name,
        priority: jiraPriorityToCardPriority(issue.fields.priority?.name),
      };
      if (target !== col) {
        moved++;
        refreshed.columnEnteredAt = new Date().toISOString();
      } else if (card.jiraStatus !== statusName || card.title !== issue.fields.summary) {
        updated++;
      }
      next[target].push(refreshed);
    }
  }

  const now = new Date().toISOString();
  for (const issue of issues) {
    if (seen.has(issue.key) || archivedKeys.has(issue.key)) continue;
    const target = statusToColumn(issue.fields.status.name, issue.fields.status.statusCategory.key);
    next[target].push({
      id: `cr-auto-${issue.key}`,
      columnId: target,
      type: "jira",
      boardType: "cr",
      autoSynced: true,
      title: issue.fields.summary,
      priority: jiraPriorityToCardPriority(issue.fields.priority?.name),
      labels: [],
      checklist: [],
      jiraKey: issue.key,
      jiraStatus: issue.fields.status.name,
      jiraType: issue.fields.issuetype.name,
      jiraProject: issue.fields.project.name,
      createdAt: now,
      columnEnteredAt: now,
    });
    added++;
  }

  saveKanbanState(next);

  // Pull child QA-Issue bugs for every CR card on the board (auto + manual).
  let bugCount = 0;
  let bugWarning: string | undefined;
  try {
    const crKeys = [...new Set(
      COLUMN_IDS.flatMap(col => next[col])
        .filter(c => c.boardType === "cr" && c.jiraKey)
        .map(c => c.jiraKey!)
    )];
    const bugMap = crKeys.length ? await fetchChildBugs(creds, crKeys) : {};
    localStorage.setItem(CHILD_BUGS_KEY, JSON.stringify(bugMap));
    bugCount = Object.values(bugMap).reduce((s, b) => s + b.length, 0);
  } catch {
    bugWarning = "bug fetch failed — counts may be stale";
  }

  const warning = [
    qaFieldNum ? undefined : `"QA" field not found — matched by assignee only`,
    bugWarning,
  ].filter(Boolean).join("; ") || undefined;

  return {
    total: issues.length,
    added, moved, removed, updated,
    bugs: bugCount,
    warning,
    syncedAt: now,
  };
}
