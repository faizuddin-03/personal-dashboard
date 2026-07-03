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
  warning?: string;
  syncedAt: string;
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

async function fetchAllIssues(creds: JiraCredentials, jql: string): Promise<SyncIssue[]> {
  const all: SyncIssue[] = [];
  let nextPageToken: string | undefined;
  let pages = 0;
  do {
    const res = await fetch("/api/jira/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        baseUrl: creds.baseUrl, email: creds.email, apiToken: creds.apiToken,
        jql, maxResults: 100, nextPageToken,
        fields: ["summary", "status", "priority", "issuetype", "project"],
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : "Jira search failed");
    all.push(...((data.issues ?? []) as SyncIssue[]));
    nextPageToken = data.nextPageToken;
    pages++;
  } while (nextPageToken && pages < 30);
  return all;
}

export async function syncCrTickets(creds: JiraCredentials): Promise<CrSyncResult> {
  const me = creds.accountId ? `"${creds.accountId}"` : "currentUser()";
  const qaFieldNum = await discoverQaFieldId(creds);
  const matchClause = qaFieldNum
    ? `(cf[${qaFieldNum}] = ${me} OR assignee = ${me})`
    : `assignee = ${me}`;
  const jql = `${matchClause} AND issuetype = Task ORDER BY updated DESC`;

  const issues = await fetchAllIssues(creds, jql);
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

  return {
    total: issues.length,
    added, moved, removed, updated,
    warning: qaFieldNum ? undefined : `"QA" field not found — matched by assignee only`,
    syncedAt: now,
  };
}
