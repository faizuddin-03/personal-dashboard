// ── Automation results → TS Tracker ───────────────────────
// Called by hooks/useBackgroundRuns.ts when a run resolves. Pulls (TS id,
// status, evidence) out of whatever shape the runner returned and records them
// on MATCHING TS Tracker cases only. Never creates a CR, suite or case: if
// nothing matches, nothing changes.
//
// Result shapes seen across app/eauto/* (2026-10-21):
//   1. { result: { checks: [{ title, status, tsLabel?, evidence? }] }, runId, runLabel }
//      — 12107, 12153, 12257, 12412, jomcheck (queue pages)
//   2. { results: [{ title, status }], evidence: [{ label: "<test>/<file>", url, kind }], timestamp }
//      — 12166 E2E, quotation-reminder, shopping-cart
//   3. { passed: boolean, stopped }  with the TS in meta.label / meta.scenario
//      — duitnow-qr
//   Everything else (estm, esim, insurance, edereg, checkers, bdp-creator,
//   user-access regression) carries no TS id and is ignored.
//
// Every matched run is APPENDED to the case's `runs` with its own evidence —
// earlier runs are never replaced (Faizuddin, 2026-10-21: "lets say i run
// first and failed. the evidence will save. next, i run and pass. in the
// history, i can still access the failed evidence").

import { TICKET_AUTOMATIONS } from "@/lib/ticketAutomations";
import { todayLocal } from "@/lib/date";
import {
  type CREntry, type TestCase, type TsEvidence, type TsRun,
  TRACKER_KEY, TS_TRACKER_UPDATED_EVENT, normTs, ticketNoOf, crNoOf, logEntry, statusLabel,
} from "@/lib/tsTrackerModel";

export { TS_TRACKER_UPDATED_EVENT };

export type AutoStatus = "pass" | "fail";
export interface TsOutcome {
  tsId: string;
  status: AutoStatus;
  /** The runner's own status word ("passed", "failed", "timedOut"). */
  rawStatus: string;
  /** The TS label the run used, e.g. "12412_TS04". */
  label: string;
  evidence: TsEvidence[];
}

/** "12107_TS05", "12166_67_E2E_TS01", "SC_RH_TS02", "12153_TS1". */
const TS_ID_RE = /\b((?:\d+_)?(?:[A-Z0-9]+_)*TS\d+)\b/i;

export function extractTsId(text: unknown): string | null {
  if (typeof text !== "string") return null;
  const m = text.match(TS_ID_RE);
  return m ? m[1].toUpperCase() : null;
}

function mapStatus(s: unknown): AutoStatus | null {
  if (typeof s === "boolean") return s ? "pass" : "fail";
  if (typeof s !== "string") return null;
  const v = s.toLowerCase();
  if (v === "passed" || v === "pass") return "pass";
  if (v === "failed" || v === "fail" || v === "timedout" || v === "interrupted") return "fail";
  return null; // skipped, running, unknown → leave unchanged
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function toEvidence(v: unknown): TsEvidence[] {
  if (!Array.isArray(v)) return [];
  const out: TsEvidence[] = [];
  for (const e of v) {
    if (!isObj(e) || typeof e.url !== "string" || !e.url) continue;
    const kind = e.kind === "video" || e.kind === "image" || e.kind === "trace" ? e.kind : "file";
    out.push({ label: typeof e.label === "string" && e.label ? e.label : e.url.split("/").pop() ?? e.url, url: e.url, kind });
  }
  return out;
}

/** Collects outcomes from arrays of { title|tsLabel|name, status, evidence? } up to 3 levels deep. */
export function extractOutcomes(result: unknown, meta: Record<string, unknown> = {}): TsOutcome[] {
  const found = new Map<string, TsOutcome>();
  const add = (tsId: string | null, status: AutoStatus | null, rawStatus: string, label: string, evidence: TsEvidence[]) => {
    if (!tsId || !status) return;
    const prev = found.get(tsId);
    if (!prev) { found.set(tsId, { tsId, status, rawStatus, label, evidence }); return; }
    // Same TS reported twice in one run: a fail wins; evidence is pooled.
    for (const e of evidence) if (!prev.evidence.some(p => p.url === e.url)) prev.evidence.push(e);
    if (status === "fail" && prev.status !== "fail") { prev.status = "fail"; prev.rawStatus = rawStatus; }
  };

  const walk = (node: unknown, depth: number) => {
    if (depth > 3) return;
    if (Array.isArray(node)) {
      for (const item of node) {
        if (!isObj(item)) continue;
        const tsId = extractTsId(item.tsLabel) ?? extractTsId(item.title) ?? extractTsId(item.name);
        if (tsId && typeof item.status === "string") {
          const label = typeof item.tsLabel === "string" && item.tsLabel ? item.tsLabel : tsId;
          add(tsId, mapStatus(item.status), item.status, label, toEvidence(item.evidence));
        }
      }
      return;
    }
    if (isObj(node)) for (const v of Object.values(node)) walk(v, depth + 1);
  };
  walk(result, 0);

  // Shape 3: single-scenario run with a boolean verdict; TS id in meta.
  if (found.size === 0 && isObj(result) && typeof result.passed === "boolean" && result.stopped !== true) {
    const tsId = extractTsId(meta.label) ?? extractTsId(meta.scenario) ?? extractTsId(meta.title);
    add(tsId, mapStatus(result.passed), result.passed ? "passed" : "failed", tsId ?? "", toEvidence(result.evidence));
  }

  // Shape 2: evidence listed once for the whole run — hand each file to the TS
  // its label names; with a single TS in the run, it gets everything.
  const outs = [...found.values()];
  if (isObj(result)) {
    const runEvidence = toEvidence(result.evidence);
    if (runEvidence.length) {
      for (const o of outs) {
        if (o.evidence.length) continue;
        const mine = outs.length === 1 ? runEvidence : runEvidence.filter(e => {
          const id = extractTsId(e.label);
          return !!id && normTs(id) === normTs(o.tsId);
        });
        o.evidence = [...mine];
      }
    }
  }
  return outs;
}

// ── Download-all mapping ──────────────────────────────────

const QUEUE_PAGES = new Set(["12107", "12153", "12257", "12412", "jomcheck"]);
const FOLDER_PAGES: Record<string, { api: string; art: string }> = {
  "eauto/12166": { api: "/api/eauto/12166/download-all", art: "eauto-12166" },
  "eauto/user-access-regression": { api: "/api/eauto/user-access-regression/download-all", art: "eauto-uar" },
};

/** Run folder id from an evidence URL: /qa-artifacts/<art>/<runId>/... */
function runIdFromUrl(url: string): string | undefined {
  return url.match(/\/qa-artifacts\/[^/]+\/([^/]+)\//)?.[1];
}

function downloadFor(runKey: string, runId: string | undefined, o: TsOutcome): TsRun["download"] {
  if (!runId || !o.evidence.length) return undefined;
  const q = runKey.match(/^eauto\/(.+)$/)?.[1];
  if (q && QUEUE_PAGES.has(q)) {
    const files = o.evidence.map(e => decodeURIComponent(e.url.split("/").pop() ?? ""));
    if (!files.every(f => /^[\w.-]+$/.test(f))) return undefined;
    const runLabel = /^[\w-]+$/.test(o.label) ? o.label : runId;
    return { url: `/api/eauto-${q}/download-all`, body: { runId, runLabel, files }, zipName: `${runLabel}.zip` };
  }
  const fp = FOLDER_PAGES[runKey];
  if (fp) {
    const folders = [...new Set(o.evidence.map(e => e.label.split("/")[0]).filter(f => f && isSafeFolder(f)))];
    return { url: fp.api, body: folders.length ? { runId, folders } : { runId }, zipName: `${o.label || runId}.zip` };
  }
  return undefined;
}
function isSafeFolder(folder: string): boolean { return /^[\w .()-]+$/.test(folder) && !folder.includes(".."); }

// ── Matching ──────────────────────────────────────────────

/** Jira keys of the automation page a run key belongs to ("eauto/12107" → /eauto/12107). */
function keysForRun(runKey: string): string[] {
  const href = "/" + runKey.replace(/^\/+/, "");
  const hit = TICKET_AUTOMATIONS.find(a => a.href === href || href.startsWith(a.href + "-") || href.startsWith(a.href + "/"));
  return hit?.keys ?? [];
}

/**
 * A case matches when its TS number equals the TS id (e.g. "12107_TS05"), or —
 * only in the CR whose number is the TS id's ticket prefix — equals the id with
 * that prefix stripped (e.g. "TS05" in EAINT-12107).
 */
function caseMatches(tc: TestCase, cr: CREntry, tsId: string): boolean {
  const c = normTs(tc.tsNumber);
  const full = normTs(tsId);
  if (c === full) return true;
  const t = ticketNoOf(tsId);
  return !!t && crNoOf(cr.crKey) === t && c === normTs(tsId.slice(t.length + 1));
}

function crInScope(cr: CREntry, tsId: string, runKeys: string[]): boolean {
  if (cr.autoSync === false) return false;
  const t = ticketNoOf(tsId);
  if (t && crNoOf(cr.crKey) === t) return true;
  return runKeys.includes(cr.crKey);
}

export interface SyncSummary { updated: number }

/** Records the run's outcomes on matching TS Tracker cases. Safe to call with any result. */
export function syncRunToTracker(runKey: string, result: unknown, meta: Record<string, unknown> = {}): SyncSummary {
  if (typeof window === "undefined") return { updated: 0 };
  let outcomes: TsOutcome[];
  try { outcomes = extractOutcomes(result, meta); } catch { return { updated: 0 }; }
  if (outcomes.length === 0) return { updated: 0 };

  let data: CREntry[];
  try { data = JSON.parse(localStorage.getItem(TRACKER_KEY) ?? "[]"); } catch { return { updated: 0 }; }
  if (!Array.isArray(data) || data.length === 0) return { updated: 0 };

  const updated = applyOutcomes(data, runKey, result, outcomes);
  if (updated === 0) return { updated: 0 };

  try {
    localStorage.setItem(TRACKER_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event(TS_TRACKER_UPDATED_EVENT));
  } catch { return { updated: 0 }; }
  return { updated };
}

/** Mutates `data`: appends a run (with evidence) + log line to every matching case. Exported for tests. */
export function applyOutcomes(data: CREntry[], runKey: string, result: unknown, outcomes: TsOutcome[], now = new Date()): number {
  const runKeys = keysForRun(runKey);
  const at = now.toISOString();
  const today = todayLocal();
  const topRunId = isObj(result) && (typeof result.runId === "string" || typeof result.runId === "number") ? String(result.runId) : undefined;
  const topTs = isObj(result) && typeof result.timestamp === "string" ? result.timestamp : undefined;
  let updated = 0;

  for (const cr of data) {
    for (const suite of cr.suites ?? []) {
      for (const tc of suite.cases ?? []) {
        const o = outcomes.find(x => crInScope(cr, x.tsId, runKeys) && caseMatches(tc, cr, x.tsId));
        if (!o) continue;
        const runId = topRunId ?? o.evidence.map(e => runIdFromUrl(e.url)).find(Boolean) ?? topTs;
        const runs = Array.isArray(tc.runs) ? tc.runs : [];
        // The same run delivered twice (restore, retry) must not double up.
        if (runId && runs.some(r => r.runId === runId && r.page === runKey && normTs(r.label || "") === normTs(o.label || ""))) continue;

        const run: TsRun = {
          at, status: o.rawStatus, label: o.label || o.tsId, page: runKey,
          ...(runId ? { runId } : {}),
          evidence: o.evidence,
        };
        const dl = downloadFor(runKey, runId, o);
        if (dl) run.download = dl;
        tc.runs = [...runs, run];

        const log = Array.isArray(tc.log) ? tc.log : [];
        const fromLabel = statusLabel(tc.status);
        if (tc.disabled) {
          tc.log = [...log, logEntry("automation", "automation", {
            text: `automation run ${run.label} ${o.status === "pass" ? "passed" : "failed"} · status kept (deprioritized)`,
          })];
        } else {
          tc.log = [...log, logEntry("automation", "automation", {
            from: fromLabel, to: statusLabel(o.status),
            text: `automation run ${run.label}`,
          })];
          tc.status = o.status;
          tc.dateTested = today;
          tc.autoUpdatedAt = at;
          tc.autoNote = `${o.status === "pass" ? "Passed" : "Failed"} in automation run (${runKey})`;
        }
        updated++;
      }
    }
  }
  return updated;
}
