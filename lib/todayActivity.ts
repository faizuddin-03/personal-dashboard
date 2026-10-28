// Shared Jira queries for "what did I do today": tickets I completed today and
// tickets I raised on a given day. Used by the home dashboard and Daily Update.
//
// Each call throws on failure (HTTP error, Jira errorMessages, network), so the
// caller can show an error line instead of an empty list.

import { JiraCredentials, JiraIssue, reporterIs } from "@/lib/jira";
import { jqlCreatedRange, todayLocal } from "@/lib/date";

async function searchJira(creds: JiraCredentials, jql: string, maxResults: number, fields: string[]): Promise<JiraIssue[]> {
  let res: Response;
  try {
    res = await fetch("/api/jira/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...creds, jql, maxResults, fields }),
    });
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : "Network error");
  }
  let data: { issues?: JiraIssue[]; error?: string; errorMessages?: string[] };
  try { data = await res.json(); } catch { throw new Error(`Jira error (HTTP ${res.status})`); }
  if (data.errorMessages?.length) throw new Error(data.errorMessages[0]);
  if (data.error) throw new Error(data.error);
  if (!res.ok) throw new Error(`Jira error (HTTP ${res.status})`);
  return data.issues ?? [];
}

/** Tickets moved to a Done-category status by me since the start of today. */
export function fetchCompletedToday(creds: JiraCredentials): Promise<JiraIssue[]> {
  return searchJira(
    creds,
    "statusCategory = Done AND status changed by currentUser() after startOfDay() ORDER BY updated DESC",
    50,
    ["summary", "status", "priority", "issuetype", "project", "labels", "duedate", "assignee", "parent"],
  );
}

/** Tickets I reported on `isoDate` (YYYY-MM-DD, app timezone). Defaults to today. */
export function fetchRaisedOn(creds: JiraCredentials, isoDate: string = todayLocal()): Promise<JiraIssue[]> {
  return searchJira(
    creds,
    `${reporterIs(creds)} AND ${jqlCreatedRange(isoDate)} ORDER BY created ASC`,
    50,
    ["summary", "status", "priority", "issuetype", "assignee", "reporter", "created", "updated", "labels", "fixVersions", "project", "duedate", "parent"],
  );
}

/** Open tickets assigned to me, newest update first. */
export function fetchAssignedOpen(creds: JiraCredentials): Promise<JiraIssue[]> {
  return searchJira(
    creds,
    "assignee = currentUser() AND statusCategory != Done ORDER BY updated DESC",
    10,
    ["summary", "status", "priority", "issuetype"],
  );
}
