// Jira deployment calendar → one calendar entry per ticket.
// (Faizuddin, 2026-10-26: "instead of using the sessions, i want my calendar
// to show the individual tickets that will be deployed, complete with the
// morning/night deployment types".)
//
// The EAINT board calendar shows releases (fix versions); each release is one
// deployment session, e.g. "S34.1X-20261029🌞" (morning) or "S34.4-20261005🌚"
// (night). /api/jira/deploy-calendar reads the project's versions, then every
// ticket in them, and returns one row per ticket per release. See
// lib/tsTrackerDeploy.ts for the session/date rules.
import type { JiraCredentials } from "@/lib/jira";
import { discoverQaFieldId } from "@/lib/crSync";

/** "Both" = a release named with both markers, e.g. "S35.X-20261102 🌞/🌚" (seen 2026-10-26). */
export type DeploySessionType = "Morning" | "Night" | "Both" | null;

/** Session from a release name. Same markers as lib/tsTrackerDeploy.ts sessionOf, plus "Both". */
export function deploySessionOf(name: string): DeploySessionType {
  const night = /🌙|🌛|🌜|🌚|night/iu.test(name);
  const morning = /🌞|☀|🌅|🌤|morning|\bday\b/iu.test(name);
  return night && morning ? "Both" : night ? "Night" : morning ? "Morning" : null;
}

export const SESSION_LABEL: Record<"Morning" | "Night" | "Both", string> = {
  Morning: "🌞 Morning", Night: "🌙 Night", Both: "🌞🌙 Morning + Night",
};

export interface JiraDeployTicket {
  key: string;
  summary: string;
  status: string;
  /** Jira status category key: "new" | "indeterminate" | "done". */
  statusCategory: string;
  issueType: string;
  assignee: string;
  /** Fix version name as Jira shows it, e.g. "S34.1X-20261029🌞". */
  version: string;
  versionId: string;
  /** YYYY-MM-DD — the version's release date, or the date in its name. */
  date: string;
  session: DeploySessionType;
  released: boolean;
  /** People in the Jira "QA" field (QA PIC) — drives the global My tickets filter (lib/ticketScope.ts). */
  qa: { accountId: string; name: string }[];
}

export interface JiraDeployCache {
  /** Cache shape version; a cache older than JIRA_DEPLOY_CACHE_VERSION is re-synced on open. */
  v?: number;
  syncedAt: string;
  project: string;
  baseUrl: string;
  tickets: JiraDeployTicket[];
  error?: string;
}

export const JIRA_DEPLOY_CACHE_KEY = "jira_deploy_calendar";
/** 2 = tickets carry the QA field (2026-10-26). */
export const JIRA_DEPLOY_CACHE_VERSION = 2;
/** Re-sync when the cache is older than this. */
export const JIRA_DEPLOY_STALE_MS = 30 * 60 * 1000;
/** How far back releases are read. */
const LOOKBACK_DAYS = 120;

export function readJiraDeployCache(): JiraDeployCache | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(localStorage.getItem(JIRA_DEPLOY_CACHE_KEY) ?? "null");
    return parsed && Array.isArray(parsed.tickets) ? parsed : null;
  } catch { return null; }
}

export function saveJiraDeployCache(c: JiraDeployCache) {
  try { localStorage.setItem(JIRA_DEPLOY_CACHE_KEY, JSON.stringify(c)); } catch { /* storage full */ }
}

/** Fetch releases + their tickets from Jira. Keeps the old tickets when the call fails. */
export async function syncJiraDeploys(creds: JiraCredentials | null, todayStr: string): Promise<JiraDeployCache> {
  const prev = readJiraDeployCache();
  const project = (creds?.defaultProjectKey || "EAINT").toUpperCase();
  const fail = (error: string): JiraDeployCache => ({
    syncedAt: prev?.syncedAt ?? "", project, baseUrl: prev?.baseUrl ?? creds?.baseUrl ?? "",
    v: prev?.v, tickets: prev?.tickets ?? [], error,
  });
  if (!creds?.baseUrl || !creds.email || !creds.apiToken) return fail("Jira is not connected (Settings).");
  const from = new Date(`${todayStr}T00:00:00Z`);
  from.setUTCDate(from.getUTCDate() - LOOKBACK_DAYS);
  try {
    const qaFieldId = await discoverQaFieldId(creds).catch(() => null);
    const res = await fetch("/api/jira/deploy-calendar", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ baseUrl: creds.baseUrl, email: creds.email, apiToken: creds.apiToken, project, fromDate: from.toISOString().slice(0, 10), qaFieldId }),
    });
    const d = await res.json();
    if (!res.ok) return fail(d.error ?? `Jira returned ${res.status}.`);
    return { v: JIRA_DEPLOY_CACHE_VERSION, syncedAt: new Date().toISOString(), project, baseUrl: creds.baseUrl.replace(/\/$/, ""), tickets: d.tickets ?? [] };
  } catch {
    return fail("Could not reach Jira.");
  }
}
