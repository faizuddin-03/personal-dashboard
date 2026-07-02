import { Deployment, DeploymentType, DeploymentStatus } from "./deployments";

export interface ParsedDeploymentItem {
  action: "add" | "update";
  matchId?: string;       // existing deployment ID if updating
  date: string;           // YYYY-MM-DD
  summary: string;
  time: string;           // HH:MM
  type: DeploymentType;
  status: DeploymentStatus;
  environment: string;
  notes: string;
}

// ── Date helpers ──────────────────────────────────────────────

const MONTH_NAMES: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

function pad2(n: number) { return String(n).padStart(2, "0"); }

/** "18", "May", 2026 → "2026-05-18" */
function ordinalToISO(day: string, month: string, year: number): string | null {
  const m = MONTH_NAMES[month.toLowerCase()];
  const d = parseInt(day);
  if (!m || isNaN(d) || d < 1 || d > 31) return null;
  return `${year}-${pad2(m)}-${pad2(d)}`;
}

/** "06", "05", "2026" → "2026-05-06" */
function dotToISO(dd: string, mm: string, yyyy: string): string | null {
  const d = parseInt(dd), m = parseInt(mm);
  if (isNaN(d) || isNaN(m) || d < 1 || d > 31 || m < 1 || m > 12) return null;
  return `${yyyy}-${mm}-${dd}`;
}

// ── Classification helpers ────────────────────────────────────

function sessionType(session: string): DeploymentType {
  // "Morning" = day, "Night" = night, "Morning / Night" split later
  const s = session.toLowerCase();
  return s.includes("night") && !s.includes("morning") ? "night" : "day";
}

function sessionTime(type: DeploymentType): string {
  return type === "night" ? "21:00" : "09:00";
}

function parsedStatus(prefix: string): DeploymentStatus {
  const p = prefix.toLowerCase().replace(/[^a-z]/g, "");
  if (p.startsWith("completed") || p === "done") return "completed";
  if (p.startsWith("postponed") || p.startsWith("cancel")) return "cancelled";
  return "planned";
}

function parseEnv(envLine: string): string {
  const l = envLine.toLowerCase();
  if (l.includes("uat")) return "UAT";
  if (l.includes("staging")) return "Staging";
  if (l.includes("prod")) return "Production";
  if (l.includes("dev")) return "Development";
  return envLine.trim() || "Staging";
}

function findExisting(existing: Deployment[], date: string, type: DeploymentType) {
  return existing.find(e => e.date === date && e.type === type);
}

function makeItem(
  existing: Deployment[],
  date: string, summary: string, type: DeploymentType,
  status: DeploymentStatus, environment: string, notes: string
): ParsedDeploymentItem {
  const match = findExisting(existing, date, type);
  return {
    action: match ? "update" : "add",
    matchId: match?.id,
    date, summary, time: sessionTime(type), type, status, environment, notes,
  };
}

// ── Main parser ───────────────────────────────────────────────

/**
 * Supports two message formats:
 *
 * Format 1 — named deployments:
 *   18th May Deployment
 *   XStar Chubb Fix
 *   staging/uat1
 *   https://...
 *
 * Format 2 — scheduled sessions (with optional status prefix):
 *   Completed  06.05.2026 (Wed) - Night Session
 *   https://...
 *   Postponed!!! 11.05.2026 (Mon) - Night Session
 *   https://...
 *   18.05.2026 (Mon) - Morning Session
 *   https://...
 *   20.05.2026 (Wed) - Morning / Night Session   ← creates two items
 *   https://...
 */
export function parseDeploymentText(rawText: string, existing: Deployment[]): ParsedDeploymentItem[] {
  const lines = rawText.split("\n").map(l => l.trim());
  const nLines = lines.filter(Boolean);

  // ── Format 2 ─────────────────────────────────────────────
  // Regex: optional status prefix + DD.MM.YYYY (Day) - Session
  const f2Re = /^((?:completed|postponed|new|rescheduled)[!?]*\s+)?(\d{2})\.(\d{2})\.(\d{4})\s*\([^)]+\)\s*-\s*(.+)/i;
  const hasF2 = nLines.some(l => f2Re.test(l));

  const results: ParsedDeploymentItem[] = [];

  if (hasF2) {
    for (let i = 0; i < nLines.length; i++) {
      const m = nLines[i].match(f2Re);
      if (!m) continue;
      const [, prefix, dd, mm, yyyy, session] = m;
      const date = dotToISO(dd, mm, yyyy);
      if (!date) continue;
      const status = prefix ? parsedStatus(prefix.trim()) : "planned";

      // Grab URL on next line if present
      let notes = "";
      if (i + 1 < nLines.length && nLines[i + 1].startsWith("http")) {
        notes = nLines[i + 1];
        i++;
      }

      const sessionLower = session.toLowerCase();
      if (sessionLower.includes("morning") && sessionLower.includes("night")) {
        // Split into two separate deployments
        results.push(makeItem(existing, date, "Morning Session", "day",  status, "Staging", notes));
        results.push(makeItem(existing, date, "Night Session",   "night", status, "Staging", notes));
      } else {
        const type = sessionType(session);
        results.push(makeItem(existing, date, session.trim(), type, status, "Staging", notes));
      }
    }
  }

  // ── Format 1 ─────────────────────────────────────────────
  // "18th May Deployment" / "18 May Deployment"
  const f1Re = /^(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+deployment$/i;
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  for (let i = 0; i < nLines.length; i++) {
    const m = nLines[i].match(f1Re);
    if (!m) continue;

    const MONTH_NAMES: Record<string, number> = { january: 0, february: 1, march: 2, april: 3, may: 4, june: 5, july: 6, august: 7, september: 8, october: 9, november: 10, december: 11 };
    const parsedMonth = MONTH_NAMES[m[2].toLowerCase()];
    const year = parsedMonth !== undefined && parsedMonth < currentMonth ? currentYear + 1 : currentYear;
    const date = ordinalToISO(m[1], m[2], year);
    if (!date) continue;

    const summary    = nLines[i + 1] ?? "";
    const envLine    = nLines[i + 2] ?? "";
    const hasUrl     = nLines[i + 3]?.startsWith("http") ?? false;
    const urlLine    = hasUrl ? nLines[i + 3] : "";
    const environment = parseEnv(envLine);
    const notes      = [envLine, urlLine].filter(Boolean).join("\n");

    // If we already have an item from format 2 for this date, enrich it with the summary
    const existing_parsed_day   = results.find(r => r.date === date && r.type === "day");
    const existing_parsed_night = results.find(r => r.date === date && r.type === "night");
    if (existing_parsed_day || existing_parsed_night) {
      for (const ep of [existing_parsed_day, existing_parsed_night]) {
        if (!ep) continue;
        if (!ep.summary || ep.summary.toLowerCase().includes("session")) ep.summary = summary;
        if (environment !== "Staging") ep.environment = environment;
        if (!ep.notes && notes) ep.notes = notes;
        else if (urlLine && !ep.notes.includes(urlLine)) ep.notes += "\n" + urlLine;
      }
    } else {
      results.push(makeItem(existing, date, summary, "day", "planned", environment, notes));
    }

    i += hasUrl ? 3 : 2;
  }

  // ── Deduplicate by (date + type), keep last ───────────────
  const seen = new Map<string, number>();
  const deduped: ParsedDeploymentItem[] = [];
  for (const item of results) {
    const key = `${item.date}|${item.type}`;
    if (seen.has(key)) {
      deduped[seen.get(key)!] = item;
    } else {
      seen.set(key, deduped.length);
      deduped.push(item);
    }
  }

  return deduped.sort((a, b) => a.date.localeCompare(b.date) || a.type.localeCompare(b.type));
}
