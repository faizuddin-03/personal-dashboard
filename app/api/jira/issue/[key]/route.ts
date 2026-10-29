import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const { searchParams } = new URL(req.url);
  const baseUrl = searchParams.get("baseUrl");
  const email = searchParams.get("email");
  const apiToken = searchParams.get("apiToken");

  if (!baseUrl || !email || !apiToken) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
  }

  const token = Buffer.from(`${email}:${apiToken}`).toString("base64");
  const url = `${baseUrl.replace(/\/$/, "")}/rest/api/3/issue/${key}?fields=summary,status,priority,issuetype,assignee,reporter,created,updated,description,comment,labels,fixVersions,project,duedate,parent`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Basic ${token}`,
      Accept: "application/json",
    },
  });

  const data = await res.json().catch(() => ({})) as Record<string, unknown>;
  if (!res.ok) {
    const msgs = data.errorMessages as string[] | undefined;
    return NextResponse.json({ error: msgs?.[0] ?? "Jira API error" }, { status: res.status });
  }
  return NextResponse.json(data);
}
