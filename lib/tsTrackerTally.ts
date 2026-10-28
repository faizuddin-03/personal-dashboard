// ── TS Tracker ↔ /tickets tally ───────────────────────────
// Faizuddin, 2026-10-22: "make the TS tracker automatically tally with the
// tickets page" — chosen: same CR list, same TS list per CR, progress on the
// /tickets cards, and status filled from each page's last saved run.
//
// 1. Every Jira key on /tickets has a CR here (created if missing).
// 2. Every TS on a ticket page has a case in that CR, under the page's section
//    title. Missing ones are added; cases you added stay; an objective is only
//    filled in when the case has none (an imported workbook's wording wins).
// 3. A case still "Not started" with no runs takes its status (and evidence)
//    from the page's last saved run: the queue state each runner page keeps in
//    localStorage, and the background-run store.
// 4. A CR or TS you delete is remembered and never re-added.
// The TS lists come from /api/ts-tracker/catalog (lib/server/ticketTsCatalog.ts).

import { TICKET_AUTOMATIONS } from "@/lib/ticketAutomations";
import {
  type CREntry, type ImportPreview,
  TRACKER_KEY, TS_TRACKER_UPDATED_EVENT, loadTracker, mergeImport, normTs, sameTs,
} from "@/lib/tsTrackerModel";
import { applyOutcomes, extractOutcomes } from "@/lib/tsTrackerSync";

export interface CatalogTs { tsNumber: string; tsId: string; objective: string; manualOnly: boolean; deprio: boolean }
export interface CatalogCR { crKey: string; pages: string[]; suites: { title: string; cases: CatalogTs[] }[] }
export interface TicketTsCatalog { builtAt: string; crs: CatalogCR[] }

const DISMISSED_KEY = "ts_tracker_dismissed";
interface Dismissed { crs: string[]; ts: Record<string, string[]> }

function loadDismissed(): Dismissed {
  try {
    const v = JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? "{}");
    return { crs: Array.isArray(v.crs) ? v.crs : [], ts: v.ts && typeof v.ts === "object" ? v.ts : {} };
  } catch { return { crs: [], ts: {} }; }
}
function saveDismissed(d: Dismissed) {
  try { localStorage.setItem(DISMISSED_KEY, JSON.stringify(d)); } catch { /* full */ }
}

/** Call when a CR is deleted on /tests, so the tally does not bring it back. */
export function dismissCR(crKey: string) {
  const d = loadDismissed();
  const k = crKey.toUpperCase();
  if (!d.crs.includes(k)) d.crs.push(k);
  saveDismissed(d);
}
/** Call when a TS is deleted on /tests. */
export function dismissTs(crKey: string, tsNumber: string) {
  const d = loadDismissed();
  const k = crKey.toUpperCase();
  d.ts[k] = [...new Set([...(d.ts[k] ?? []), normTs(tsNumber)])];
  saveDismissed(d);
}
/** Call when a CR is added again by hand: it is wanted after all. */
export function undismissCR(crKey: string) {
  const d = loadDismissed();
  d.crs = d.crs.filter(k => k !== crKey.toUpperCase());
  delete d.ts[crKey.toUpperCase()];
  saveDismissed(d);
}

/** Single-ticket pages carry the Jira summary as their title. */
function summaryFor(crKey: string): string {
  const pages = TICKET_AUTOMATIONS.filter(t => t.keys.includes(crKey));
  return pages.find(p => p.keys.length === 1)?.title ?? "";
}

const QUEUE_PAGES = ["12107", "12153", "12257", "12412", "jomcheck"];

/** Saved results the runner pages keep: [runKey, result][]. */
function savedResults(): [string, unknown][] {
  const out: [string, unknown][] = [];
  for (const p of QUEUE_PAGES) {
    try {
      const q = JSON.parse(localStorage.getItem(`eauto_${p}_queue_state`) ?? "null");
      for (const it of Array.isArray(q?.items) ? q.items : []) {
        if ((it?.status === "passed" || it?.status === "failed") && it.res) out.push([`eauto/${p}`, it.res]);
      }
    } catch { /* skip */ }
  }
  try {
    const runs = JSON.parse(localStorage.getItem("dashboard_background_runs") ?? "{}");
    for (const r of Object.values(runs ?? {}) as { key?: string; result?: unknown; running?: boolean }[]) {
      if (r?.key && r.result && !r.running) out.push([r.key, r.result]);
    }
  } catch { /* skip */ }
  return out;
}

export interface TallySummary { crsAdded: number; casesAdded: number; statusesFilled: number }

/** Pure: returns the tallied copy of `data`. */
export function tally(data: CREntry[], catalog: TicketTsCatalog, dismissed: Dismissed, results: [string, unknown][]): { data: CREntry[]; summary: TallySummary } {
  const preview: ImportPreview = { filename: "the ticket page", sheets: [], warnings: [], crs: [] };
  for (const c of catalog.crs) {
    const key = c.crKey.toUpperCase();
    if (dismissed.crs.includes(key)) continue;
    const gone = dismissed.ts[key] ?? [];
    preview.crs.push({
      crKey: c.crKey,
      crSummary: summaryFor(c.crKey),
      suites: c.suites.map(s => ({
        title: s.title,
        cases: s.cases
          .filter(tc => !gone.some(g => sameTs(g, tc.tsNumber, c.crKey)))
          .map(tc => ({ tsNumber: tc.tsNumber, objective: tc.objective, status: null, disabled: tc.deprio || undefined })),
      })),
    });
  }
  const before = new Set(data.map(c => c.crKey.toUpperCase()));
  const { data: merged, summary: ms } = mergeImport(data, preview, { objectives: "fill", text: "Added from the ticket page" });
  const now = new Date().toISOString();
  for (const c of merged) if (!c.logSince) c.logSince = now;

  // Status from the last saved run, for cases nobody has touched yet.
  const fresh = new Set<string>();
  for (const c of merged) for (const s of c.suites) for (const tc of s.cases) {
    if (!tc.status && !tc.disabled && !(tc.runs?.length)) fresh.add(tc.id);
  }
  let statusesFilled = 0;
  if (fresh.size && results.length) {
    const scratch: CREntry[] = JSON.parse(JSON.stringify(merged));
    for (const [runKey, result] of results) {
      try { applyOutcomes(scratch, runKey, result, extractOutcomes(result)); } catch { /* skip */ }
    }
    for (let i = 0; i < merged.length; i++) for (let j = 0; j < merged[i].suites.length; j++) {
      const cases = merged[i].suites[j].cases;
      for (let k = 0; k < cases.length; k++) {
        const done = scratch[i].suites[j].cases[k];
        if (fresh.has(cases[k].id) && done.status) {
          cases[k] = { ...done, autoNote: `${done.autoNote ?? "Automation run"} · filled from the last saved run` };
          statusesFilled++;
        }
      }
    }
  }
  const crsAdded = merged.filter(c => !before.has(c.crKey.toUpperCase())).length;
  return { data: merged, summary: { crsAdded, casesAdded: ms.casesAdded, statusesFilled } };
}

let inflight: Promise<TallySummary | null> | null = null;

/** Fetches the catalogue, tallies the stored tracker, saves if anything changed. */
export function runTally(): Promise<TallySummary | null> {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const r = await fetch("/api/ts-tracker/catalog", { cache: "no-store" });
      if (!r.ok) return null;
      const catalog = (await r.json()) as TicketTsCatalog;
      if (!Array.isArray(catalog?.crs)) return null;
      const current = loadTracker();
      const { data, summary } = tally(current, catalog, loadDismissed(), savedResults());
      if (JSON.stringify(data) !== JSON.stringify(current)) {
        localStorage.setItem(TRACKER_KEY, JSON.stringify(data));
        window.dispatchEvent(new Event(TS_TRACKER_UPDATED_EVENT));
      }
      return summary;
    } catch { return null; } finally { setTimeout(() => { inflight = null; }, 0); }
  })();
  return inflight;
}
