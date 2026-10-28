// Deployment session of each TS Tracker CR, for "deployment date" ordering
// (Faizuddin, 2026-10-22: "based on JIRA calendar, the EAINT Board, where it
// shows the deployment sessions … complete with the session (morning/night)").
//
// The EAINT board calendar shows releases (fix versions); each release is one
// production deployment session and lists the tickets it ships. Seen 2026-10-22:
//   "S34.13-20261021 🌞"  releaseDate 2026-10-21  (12107, 12327, 12412)
//   "S34.1X-20261029🌞"   releaseDate 2026-10-29  (12153, 12257)
//   "S34.4-20261005🌚"    releaseDate 2026-10-05  (12339) — night
// 🌞 = morning session, 🌚 = night session (both seen in Jira, 2026-10-22).
import type { JiraCredentials } from "@/lib/jira";

export interface DeploySession {
  /** Fix version name as Jira shows it, e.g. "S34.1X-20261029🌞". */
  name: string;
  /** YYYY-MM-DD from the version's release date (or the date in its name). */
  date: string | null;
  session: "Morning" | "Night" | null;
  released: boolean;
}

const CACHE_KEY = "ts_tracker_deploy_cache";

export function sessionOf(name: string): DeploySession["session"] {
  if (/🌙|🌛|🌜|🌚|night/iu.test(name)) return "Night";
  if (/🌞|☀|🌅|🌤|morning|\bday\b/iu.test(name)) return "Morning";
  return null;
}

export function dateFromName(name: string): string | null {
  const m = name.match(/(20\d{2})(\d{2})(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

/** Earliest real deployment among a ticket's fix versions (ignores "[QA]…" holding versions without a date). */
function pick(versions: { name: string; releaseDate?: string; released?: boolean }[]): DeploySession | null {
  const all = versions.map(v => ({
    name: v.name,
    date: v.releaseDate ?? dateFromName(v.name),
    session: sessionOf(v.name),
    released: !!v.released,
  })).filter(v => v.date);
  all.sort((a, b) => (a.date! < b.date! ? -1 : a.date! > b.date! ? 1 : 0));
  return all[0] ?? null;
}

export function loadDeployCache(): Record<string, DeploySession | null> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) ?? "{}") ?? {}; } catch { return {}; }
}

/** Fetch fix versions for the CR keys from Jira and cache them. */
export async function fetchDeploySessions(keys: string[], creds: JiraCredentials | null): Promise<{ map: Record<string, DeploySession | null>; error?: string }> {
  const cache = loadDeployCache();
  const valid = [...new Set(keys.map(k => k.trim().toUpperCase()).filter(k => /^[A-Z][A-Z0-9]+-\d+$/.test(k)))];
  if (!valid.length) return { map: cache };
  if (!creds?.baseUrl || !creds.email || !creds.apiToken) return { map: cache, error: "Jira is not connected (Settings), so deployment sessions cannot be read." };
  try {
    const res = await fetch("/api/jira/search", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...creds, jql: `key in (${valid.join(",")})`, fields: ["fixVersions"], maxResults: 100 }),
    });
    const d = await res.json();
    if (!res.ok) return { map: cache, error: d.error ?? "Jira search failed." };
    const next = { ...cache };
    for (const k of valid) next[k] = null;
    for (const issue of d.issues ?? []) {
      next[String(issue.key).toUpperCase()] = pick(issue.fields?.fixVersions ?? []);
    }
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(next)); } catch { /* full */ }
    return { map: next };
  } catch {
    return { map: cache, error: "Could not reach Jira." };
  }
}

/** Sort key: date, then Morning before Night; no session → last. */
export function deployRank(s: DeploySession | null | undefined): string {
  if (!s?.date) return "9999-99-99~";
  return `${s.date}~${s.session === "Night" ? 2 : s.session === "Morning" ? 0 : 1}`;
}
