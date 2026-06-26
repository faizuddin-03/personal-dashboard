import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { baseUrl, email, apiToken, jql, fields, maxResults = 50 } = await req.json();

  if (!baseUrl || !email || !apiToken || !jql) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const token = Buffer.from(`${email}:${apiToken}`).toString("base64");
  const url = `${baseUrl.replace(/\/$/, "")}/rest/api/3/search`;

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

  let data: unknown;
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    data = await res.json();
  } else {
    const text = await res.text();
    return NextResponse.json(
      { error: `Jira returned non-JSON response (${res.status}). Check your base URL and credentials.`, detail: text.slice(0, 500) },
      { status: res.status === 200 ? 502 : res.status }
    );
  }

  if (!res.ok) {
    const d = data as Record<string, unknown>;
    const msg = (Array.isArray(d?.errorMessages) && d.errorMessages[0]) ? String(d.errorMessages[0]) : "Jira API error";
    return NextResponse.json({ error: msg, detail: data }, { status: res.status });
  }
  return NextResponse.json(data);
}
