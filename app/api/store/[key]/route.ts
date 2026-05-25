import { kv } from "@vercel/kv";
import type { NextRequest } from "next/server";

const SYNC_KEYS = new Set([
  "kanban_state", "kanban_archive", "test_tracker_crs", "notes",
  "todo_items", "deployments", "calendar_events", "dashboard_widgets",
  "jira_assigned_cr_keys", "jira_bug_cr_key", "backup_settings",
  "qa-theme", "calendar_24h",
]);

function authenticated(req: NextRequest): boolean {
  const secret = process.env.DASHBOARD_SECRET;
  if (!secret) return true; // no secret set → open (dev convenience)
  return req.headers.get("x-secret") === secret;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  if (!authenticated(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { key } = await params;
  if (!SYNC_KEYS.has(key)) return Response.json({ error: "Invalid key" }, { status: 400 });
  const value = await kv.get<string>(key);
  return Response.json({ value: value ?? null });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  if (!authenticated(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { key } = await params;
  if (!SYNC_KEYS.has(key)) return Response.json({ error: "Invalid key" }, { status: 400 });
  const { value } = await req.json() as { value: string };
  await kv.set(key, value);
  return Response.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  if (!authenticated(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { key } = await params;
  if (!SYNC_KEYS.has(key)) return Response.json({ error: "Invalid key" }, { status: 400 });
  await kv.del(key);
  return Response.json({ ok: true });
}
