import { NextRequest, NextResponse } from "next/server";

/** Proxies Jira's field list so the client can discover custom field ids (e.g. the "QA" user picker) by name. */
export async function POST(req: NextRequest) {
  const { baseUrl, email, apiToken } = await req.json();

  if (!baseUrl || !email || !apiToken) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const token = Buffer.from(`${email}:${apiToken}`).toString("base64");
  const url = `${baseUrl.replace(/\/$/, "")}/rest/api/3/field`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Basic ${token}`,
      Accept: "application/json",
    },
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
