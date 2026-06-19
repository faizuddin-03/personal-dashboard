import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { baseUrl, email, apiToken, jql, fields, maxResults = 50 } = await req.json();

  if (!baseUrl || !email || !apiToken || !jql) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const token = Buffer.from(`${email}:${apiToken}`).toString("base64");
  const url = `${baseUrl.replace(/\/$/, "")}/rest/api/3/search/jql`;

  const body = {
    jql,
    maxResults,
    fields: fields ?? [
      "summary", "status", "priority", "issuetype", "assignee",
      "reporter", "created", "updated", "labels", "fixVersions",
      "project", "duedate", "parent",
    ],
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json({ error: data.errorMessages?.[0] ?? "Jira API error", detail: data }, { status: res.status });
  }
  return NextResponse.json(data);
}
