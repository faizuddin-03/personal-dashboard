// GET /api/pipeline/jira/users?q=<name> — assignable EAINT users for the
// Developer picker on a finding (QA pipeline, Faizuddin 2026-10-27). Read only.
// Returns [{ accountId, displayName }].
import { NextRequest, NextResponse } from "next/server";
import { jiraCreds, jiraFetch } from "@/scripts/pipeline/store.mjs";

export const dynamic = "force-dynamic";

interface JiraUser { accountId: string; displayName?: string; active?: boolean; accountType?: string }

export async function GET(req: NextRequest) {
  if (!jiraCreds()) return NextResponse.json({ error: "Jira login not connected (open the Agents page and connect)" }, { status: 503 });
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 80);
  try {
    const res = await jiraFetch(`/rest/api/3/user/assignable/search?project=EAINT&maxResults=20&query=${encodeURIComponent(q)}`);
    const users = (await res.json()) as JiraUser[];
    return NextResponse.json(
      users
        .filter(u => u.active !== false && (u.accountType ?? "atlassian") === "atlassian")
        .map(u => ({ accountId: u.accountId, displayName: u.displayName ?? u.accountId })),
    );
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
