// Keys that sync to remote KV. Sensitive keys (jira_credentials, gemini_api_key)
// are intentionally excluded and always stay in localStorage only.
export const SYNC_KEYS = [
  "kanban_state",
  "kanban_archive",
  "test_tracker_crs",
  "notes",
  "todo_items",
  "deployments",
  "calendar_events",
  "dashboard_widgets",
  "jira_assigned_cr_keys",
  "jira_bug_cr_key",
  "backup_settings",
  "qa-theme",
  "calendar_24h",
] as const;

export type SyncKey = (typeof SYNC_KEYS)[number];

const REMOTE = process.env.NEXT_PUBLIC_STORAGE_MODE === "remote";
const SECRET = process.env.NEXT_PUBLIC_DASHBOARD_SECRET ?? "";

function headers() {
  return { "Content-Type": "application/json", "x-secret": SECRET };
}

// Called once on app load in remote mode — fetches all keys from KV and
// writes them into localStorage so all existing sync reads work unchanged.
export async function hydrateFromRemote(): Promise<void> {
  if (!REMOTE) return;
  try {
    const res = await fetch("/api/store/bulk", { headers: { "x-secret": SECRET } });
    if (!res.ok) return;
    const data: Record<string, string | null> = await res.json();
    for (const [key, value] of Object.entries(data)) {
      if (value !== null) {
        try { localStorage.setItem(key, value); } catch { /* storage full */ }
      }
    }
  } catch { /* offline — fall back to existing localStorage */ }
}

// Fire-and-forget write to KV after every localStorage save.
export function remoteSync(key: SyncKey, value: string): void {
  if (!REMOTE) return;
  fetch(`/api/store/${key}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ value }),
  }).catch(() => {});
}

// Fire-and-forget delete from KV.
export function remoteDelete(key: SyncKey): void {
  if (!REMOTE) return;
  fetch(`/api/store/${key}`, {
    method: "DELETE",
    headers: { "x-secret": SECRET },
  }).catch(() => {});
}
