import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { baseUrl, email, apiToken } = await req.json();

  if (!baseUrl || !email || !apiToken) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
  }

  const token = Buffer.from(`${email}:${apiToken}`).toString("base64");
  const url = `${baseUrl.replace(/\/$/, "")}/rest/api/3/myself`;

  const res = await fetch(url, {
    headers: { Authorization: `Basic ${token}`, Accept: "application/json" },
  });

  const data = await res.json().catch(() => ({})) as Record<string, unknown>;
  if (!res.ok) {
    return NextResponse.json({ error: (data.message as string) ?? "Auth failed — check your base URL and API token" }, { status: res.status });
  }
  return NextResponse.json(data);
}
