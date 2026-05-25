import { kv } from "@vercel/kv";
import type { NextRequest } from "next/server";

const SYNC_KEYS = [
  "kanban_state", "kanban_archive", "test_tracker_crs", "notes",
  "todo_items", "deployments", "calendar_events", "dashboard_widgets",
  "jira_assigned_cr_keys", "jira_bug_cr_key", "backup_settings",
  "qa-theme", "calendar_24h",
] as const;

function authenticated(req: NextRequest): boolean {
  const secret = process.env.DASHBOARD_SECRET;
  if (!secret) return true;
  return req.headers.get("x-secret") === secret;
}

// Fetches all sync keys in one round-trip for fast app hydration.
export async function GET(req: NextRequest) {
  if (!authenticated(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const values = await kv.mget<string[]>(...SYNC_KEYS);
  const result: Record<string, string | null> = {};
  SYNC_KEYS.forEach((k, i) => { result[k] = values[i] ?? null; });
  return Response.json(result);
}
