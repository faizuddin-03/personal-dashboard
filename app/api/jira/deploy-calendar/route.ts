// Jira deployment calendar: the project's releases (fix versions) from
// fromDate onward, and every ticket in them — one row per ticket per release.
// See lib/jiraDeployCalendar.ts.
import { NextRequest, NextResponse } from "next/server";
import { dateFromName } from "@/lib/tsTrackerDeploy";
import { deploySessionOf, type JiraDeployTicket } from "@/lib/jiraDeployCalendar";

export const maxDuration = 60;

interface JiraVersion { id: string; name: string; releaseDate?: string; released?: boolean; archived?: boolean }

export async function POST(req: NextRequest) {
  const { baseUrl, email, apiToken, project, fromDate, qaFieldId } = await req.json();
  // "QA" user-picker field (QA PIC), single or multi user. Falls back to the known mfservices id.
  const qaField = `customfield_${/^\d+$/.test(String(qaFieldId ?? "")) ? qaFieldId : "10041"}`;
  if (!baseUrl || !email || !apiToken || !project) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const root = String(baseUrl).replace(/\/$/, "");
  const headers = {
    Authorization: `Basic ${Buffer.from(`${email}:${apiToken}`).toString("base64")}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  async function jira(path: string, init?: RequestInit) {
    const res = await fetch(`${root}${path}`, { ...init, headers });
    const type = res.headers.get("content-type") ?? "";
    if (!type.includes("application/json")) {
      throw new Error(`Jira returned non-JSON response (${res.status}). Check your base URL and credentials.`);
    }
    const data = await res.json();
    if (!res.ok) {
      const msg = Array.isArray(data?.errorMessages) && data.errorMessages[0] ? String(data.errorMessages[0]) : `Jira API error (${res.status})`;
      throw new Error(msg);
    }
    return data;
  }

  try {
    // 1. Releases with a date on or after fromDate. Holding versions ("Old Pending
    // Listing", "[QA]Ready for Testing Tickets", "To Pick Up"…) can carry a date
    // too but are not deployments — keep only "S<sprint>…" names or a session marker.
    const all: JiraVersion[] = await jira(`/rest/api/3/project/${encodeURIComponent(project)}/versions`);
    const versions = new Map<string, { name: string; date: string; released: boolean }>();
    for (const v of all) {
      if (v.archived) continue;
      if (!/^S\d+/i.test(v.name.trim()) && !deploySessionOf(v.name)) continue;
      const date = v.releaseDate ?? dateFromName(v.name);
      if (!date || (fromDate && date < fromDate)) continue;
      versions.set(String(v.id), { name: v.name, date, released: !!v.released });
    }
    if (!versions.size) return NextResponse.json({ tickets: [] });

    // 2. Every ticket in those releases (sub-tasks left out).
    const jql = `project = "${project}" AND fixVersion in (${[...versions.keys()].join(",")}) AND issuetype not in subTaskIssueTypes() ORDER BY key ASC`;
    const tickets: JiraDeployTicket[] = [];
    let nextPageToken: string | undefined;
    for (let page = 0; page < 20; page++) {
      const d = await jira("/rest/api/3/search/jql", {
        method: "POST",
        body: JSON.stringify({
          jql, maxResults: 100, ...(nextPageToken ? { nextPageToken } : {}),
          fields: ["summary", "status", "issuetype", "assignee", "fixVersions", qaField],
        }),
      });
      for (const issue of d.issues ?? []) {
        const f = issue.fields ?? {};
        const qaRaw = f[qaField];
        const qa = (Array.isArray(qaRaw) ? qaRaw : qaRaw ? [qaRaw] : [])
          .filter((u: { accountId?: string }) => u?.accountId)
          .map((u: { accountId: string; displayName?: string }) => ({ accountId: u.accountId, name: u.displayName ?? "" }));
        for (const fv of f.fixVersions ?? []) {
          const v = versions.get(String(fv.id));
          if (!v) continue;
          tickets.push({
            key: String(issue.key),
            summary: f.summary ?? "",
            status: f.status?.name ?? "",
            statusCategory: f.status?.statusCategory?.key ?? "",
            issueType: f.issuetype?.name ?? "",
            assignee: f.assignee?.displayName ?? "",
            version: v.name,
            versionId: String(fv.id),
            date: v.date,
            session: deploySessionOf(v.name),
            released: v.released,
            qa,
          });
        }
      }
      if (d.isLast || !d.nextPageToken) break;
      nextPageToken = d.nextPageToken;
    }
    return NextResponse.json({ tickets });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Jira request failed" }, { status: 502 });
  }
}
