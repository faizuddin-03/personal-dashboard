import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { baseUrl, adminEmail, adminPassword } = await req.json() as {
      baseUrl: string;
      adminEmail: string;
      adminPassword: string;
    };

    if (!baseUrl || !adminEmail || !adminPassword) {
      return NextResponse.json({ error: 'baseUrl, adminEmail, and adminPassword are required.' }, { status: 400 });
    }

    // Strip trailing slash
    const base = baseUrl.replace(/\/$/, '');

    // 1. Authenticate
    const loginRes = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      signal: AbortSignal.timeout(8000),
    });

    if (!loginRes.ok) {
      const text = await loginRes.text().catch(() => '');
      return NextResponse.json(
        { error: `Login failed (${loginRes.status}): ${text.slice(0, 200)}` },
        { status: 502 }
      );
    }

    const { accessToken } = await loginRes.json() as { accessToken: string };

    // 2. Fetch templates (no status filter — return all so user can see what exists)
    const tmplRes = await fetch(`${base}/api/templates`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(10000),
    });

    if (!tmplRes.ok) {
      const text = await tmplRes.text().catch(() => '');
      return NextResponse.json(
        { error: `Templates fetch failed (${tmplRes.status}): ${text.slice(0, 200)}` },
        { status: 502 }
      );
    }

    const raw = await tmplRes.json() as Array<{
      name: string;
      category: string;
      status: string;
      language: string;
    }>;

    // Deduplicate by name (multiple language variants share the same name)
    const seen = new Set<string>();
    const templates = raw
      .filter(t => { if (seen.has(t.name)) return false; seen.add(t.name); return true; })
      .map(t => ({ name: t.name, category: t.category, status: t.status }));

    return NextResponse.json({ templates });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('timed out') || msg.includes('ECONNREFUSED') || msg.includes('fetch failed')) {
      return NextResponse.json({ error: 'Could not reach the app. Is it running at the configured URL?' }, { status: 503 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
