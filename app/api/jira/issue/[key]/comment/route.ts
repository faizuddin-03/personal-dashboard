import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const { baseUrl, email, apiToken, body } = await req.json();

  if (!baseUrl || !email || !apiToken || !body) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const token = Buffer.from(`${email}:${apiToken}`).toString("base64");
  const url = `${baseUrl.replace(/\/$/, "")}/rest/api/3/issue/${key}/comment`;

  const adfBody = {
    version: 1,
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text: body }] }],
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ body: adfBody }),
  });

  const data = await res.json().catch(() => ({})) as Record<string, unknown>;
  if (!res.ok) {
    const msgs = data.errorMessages as string[] | undefined;
    return NextResponse.json({ error: msgs?.[0] ?? "Comment failed" }, { status: res.status });
  }
  return NextResponse.json(data);
}
