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
  const url = `${baseUrl.replace(/\/$/, "")}/rest/api/3/issue/${key}/transitions`;

  const res = await fetch(url, {
    headers: { Authorization: `Basic ${token}`, Accept: "application/json" },
  });

  const data = await res.json().catch(() => ({})) as Record<string, unknown>;
  if (!res.ok) {
    const msgs = data.errorMessages as string[] | undefined;
    return NextResponse.json({ error: msgs?.[0] ?? "Jira API error" }, { status: res.status });
  }
  return NextResponse.json(data);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const { baseUrl, email, apiToken, transitionId } = await req.json();

  if (!baseUrl || !email || !apiToken || !transitionId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const token = Buffer.from(`${email}:${apiToken}`).toString("base64");
  const url = `${baseUrl.replace(/\/$/, "")}/rest/api/3/issue/${key}/transitions`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ transition: { id: transitionId } }),
  });

  if (res.status === 204) return NextResponse.json({ ok: true });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json({ error: data.errorMessages?.[0] ?? "Transition failed" }, { status: res.status });
  }
  return NextResponse.json(data);
}
