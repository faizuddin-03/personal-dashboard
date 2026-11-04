import { NextResponse } from "next/server";

// Read-only view of the QA Portal for the /qa-portal page (Faizuddin, 2026-10-29).
// Token lives in .env.local (QA_PORTAL_TOKEN), never in the browser. GET calls only.
const BASE = (process.env.QA_PORTAL_URL || "http://10.30.10.214").replace(/\/+$/, "");
const TOKEN = (process.env.QA_PORTAL_TOKEN || "").trim();

// The portal's wrapped-up statuses, as in its Claude connector.
const DONE_STATUSES = new Set(["qa_done", "no_testing"]);

async function portalGet<T>(path: string): Promise<T> {
  const res = await fetch(BASE + path, {
    headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/json" },
    cache: "no-store",
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error((data && data.error) || `QA Portal said HTTP ${res.status} for ${path}`);
  return data as T;
}

const asList = (v: unknown): string[] =>
  Array.isArray(v) ? v.map(String) : String(v || "").split(",").map(s => s.trim()).filter(Boolean);

type Row = Record<string, unknown>;

export async function GET() {
  if (!TOKEN) {
    return NextResponse.json({ error: "QA_PORTAL_TOKEN is not set in .env.local" }, { status: 500 });
  }
  try {
    const [me, tasks, reminders, windows] = await Promise.all([
      portalGet<{ user: Row }>("/api/auth/me"),
      portalGet<Row[]>("/api/tasks"),
      portalGet<Row>("/api/my-reminders"),
      portalGet<Row[] | { windows: Row[] }>("/api/jira/windows?status=active"),
    ]);
    const name = String(me.user.trackerName ?? "");
    const myTasks = tasks
      .filter(t => asList(t.qaPic).includes(name))
      .map(t => ({
        id: t.id,
        key: t.jiraTicketKey ?? null,
        title: t.shortName || t.title,
        status: t.status,
        priority: t.priority ?? null,
        qaPic: asList(t.qaPic),
        devPic: t.devPic ?? null,
        etaTestingDate: t.etaTestingDate ?? null,
        dueDate: t.dueDate ?? null,
        deploymentDate: t.deploymentDate ?? null,
        codeMergeEnv: t.codeMergeEnv ?? null,
        done: DONE_STATUSES.has(String(t.status)),
      }));
    const windowRows = Array.isArray(windows) ? windows : windows.windows ?? [];
    return NextResponse.json({
      portal: BASE,
      me: { name, fullName: me.user.fullName ?? name },
      tasks: myTasks,
      reminders,
      windows: windowRows.map(w => ({
        id: w.id,
        name: w.name,
        description: w.description ?? null,
        scheduledDate: w.scheduledDate ?? null,
        fixVersion: w.jiraFixVersionName ?? null,
        goAheadStatus: w.goAheadStatus ?? null,
        qaPics: asList(w.qaPics),
        mine: asList(w.qaPics).includes(name),
      })),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `Cannot read the QA Portal at ${BASE}. In the office or on VPN? (${msg})` }, { status: 502 });
  }
}
