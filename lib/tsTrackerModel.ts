// ── TS Tracker data model ─────────────────────────────────
// Shared by app/tests (the page), lib/tsTrackerSync.ts (automation runs) and
// lib/tsTrackerImport.ts (Excel import). Stored in localStorage
// "test_tracker_crs". Other readers (app/page.tsx, app/kanban, daily-update,
// GlobalSearch, lib/ticketHub.ts) only use crKey / crSummary / suites / cases
// with status, dateTested, disabled and tsNumber — so every field added here
// is OPTIONAL and the old shape still loads unchanged.

export type TsStatus = "pass" | "fail" | "in-progress" | null;

export type TsLogKind = "created" | "status" | "date" | "deprioritized" | "restored" | "imported" | "automation" | "note";
export type TsLogSource = "manual" | "automation" | "import";

/** One line in a TS's history (Faizuddin, 2026-10-21: "every TS should have a log"). */
export interface TsLogEntry {
  at: string; // ISO time
  kind: TsLogKind;
  from?: string;
  to?: string;
  source: TsLogSource;
  text?: string;
}

export interface TsEvidence {
  label: string;
  url: string;
  kind: "video" | "image" | "file" | "trace";
}

/** One automation run that covered this TS. Never replaced — appended (requirement C). */
export interface TsRun {
  at: string; // ISO time
  status: string; // "passed" | "failed" | "timedOut" | ...
  label: string; // the run's TS label, e.g. "12412_TS04"
  page: string; // run key, e.g. "eauto/12412"
  runId?: string;
  evidence: TsEvidence[];
  /** How to zip this run's evidence for this TS. Absent = per-file links only. */
  download?: { url: string; body: Record<string, unknown>; zipName: string };
}

export interface TestCase {
  id: string;
  tsNumber: string;
  status: TsStatus;
  dateTested: string | null; // YYYY-MM-DD
  disabled?: boolean;
  /** ISO time the status was last set by an automation run. Cleared on a manual change. */
  autoUpdatedAt?: string;
  /** Short note from that automation run. */
  autoNote?: string;
  /** Test objective / scenario name, from the TS workbook. */
  objective?: string;
  log?: TsLogEntry[];
  runs?: TsRun[];
}

export interface TestSuite {
  id: string;
  title: string;
  cases: TestCase[];
}

export interface CREntry {
  id: string;
  crKey: string;
  crSummary: string;
  suites: TestSuite[];
  /** Let automation runs update this CR's cases. Missing = on. */
  autoSync?: boolean;
  /** ISO time this CR's log-keeping started (for cases created before logs existed). */
  logSince?: string;
}

export const TRACKER_KEY = "test_tracker_crs";
/** Fired on window after the tracker is written, so an open /tests page reloads. */
export const TS_TRACKER_UPDATED_EVENT = "ts-tracker-updated";

export function loadTracker(): CREntry[] {
  if (typeof window === "undefined") return [];
  try {
    const v = JSON.parse(localStorage.getItem(TRACKER_KEY) ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch { return []; }
}

export function saveTracker(data: CREntry[]): boolean {
  try { localStorage.setItem(TRACKER_KEY, JSON.stringify(data)); return true; } catch { return false; }
}

export function uid(): string {
  try { return crypto.randomUUID(); } catch { return `${Date.now()}-${Math.random().toString(36).slice(2)}`; }
}

export const STATUS_LABEL: Record<"pass" | "fail" | "in-progress" | "none", string> = {
  pass: "Pass", fail: "Fail", "in-progress": "WIP", none: "Not started",
};
export function statusLabel(s: TsStatus | undefined): string {
  return STATUS_LABEL[s ?? "none"];
}

export function logEntry(kind: TsLogKind, source: TsLogSource, extra: Partial<TsLogEntry> = {}): TsLogEntry {
  return { at: new Date().toISOString(), kind, source, ...extra };
}

export function withLog(tc: TestCase, ...entries: TsLogEntry[]): TestCase {
  return { ...tc, log: [...(tc.log ?? []), ...entries] };
}

export function newCase(tsNumber: string, source: TsLogSource, extra: Partial<TestCase> = {}, text?: string): TestCase {
  return {
    id: uid(), tsNumber, status: null, dateTested: null, ...extra,
    log: [logEntry("created", source, text ? { text } : {})],
  };
}

// ── TS number matching ────────────────────────────────────

/** Upper-case, no spaces, TS number unpadded: "12153_ts01" → "12153_TS1". */
export function normTs(id: string): string {
  return id.toUpperCase().replace(/\s+/g, "").replace(/TS0*(\d+)$/, "TS$1");
}
export function ticketNoOf(id: string): string | null {
  return id.match(/^(\d{4,})_/)?.[1] ?? null;
}
export function crNoOf(crKey: string): string | null {
  return crKey.match(/-(\d+)$/)?.[1] ?? null;
}

/** "12107_TS05" equals "12107_TS5", and equals "TS05" inside EAINT-12107. */
export function sameTs(a: string, b: string, crKey: string): boolean {
  const na = normTs(a), nb = normTs(b);
  if (na === nb) return true;
  const crNo = crNoOf(crKey);
  if (!crNo) return false;
  const strip = (s: string) => (ticketNoOf(s) === crNo ? s.slice(crNo.length + 1) : s);
  return strip(na) === strip(nb);
}

// ── Excel import merge ────────────────────────────────────

export interface ImportCase { tsNumber: string; objective: string; status: TsStatus; disabled?: boolean }
export interface ImportSuite { title: string; cases: ImportCase[] }
export interface ImportCR { crKey: string; crSummary: string; suites: ImportSuite[] }
export interface ImportPreview {
  filename: string;
  sheets: string[];
  crs: ImportCR[];
  warnings: string[];
}

export interface MergeSummary { crsCreated: number; crsUpdated: number; casesAdded: number; objectivesUpdated: number }

/**
 * Applies an import. New CR → created whole. Existing CR → missing TS added
 * (into the suite of the same title, created if needed), objectives updated;
 * existing status / date / log are never overwritten.
 */
export function mergeImport(
  data: CREntry[], preview: ImportPreview,
  /** "fill" = only add an objective where the case has none (the /tickets tally, lib/tsTrackerTally.ts). */
  opts: { objectives?: "replace" | "fill"; text?: string } = {},
): { data: CREntry[]; summary: MergeSummary } {
  const summary: MergeSummary = { crsCreated: 0, crsUpdated: 0, casesAdded: 0, objectivesUpdated: 0 };
  const text = opts.text ?? `Imported from ${preview.filename}`;
  const next = data.map(cr => ({ ...cr, suites: cr.suites.map(s => ({ ...s, cases: [...s.cases] })) }));

  for (const icr of preview.crs) {
    let cr = next.find(c => c.crKey.toUpperCase() === icr.crKey.toUpperCase());
    if (!cr) {
      cr = { id: uid(), crKey: icr.crKey, crSummary: icr.crSummary, suites: [] };
      next.push(cr);
      summary.crsCreated++;
    } else {
      summary.crsUpdated++;
      if (!cr.crSummary && icr.crSummary) cr.crSummary = icr.crSummary;
    }
    const target = cr;
    for (const isuite of icr.suites) {
      for (const ic of isuite.cases) {
        let found: { suite: TestSuite; idx: number } | null = null;
        for (const s of target.suites) {
          const idx = s.cases.findIndex(c => sameTs(c.tsNumber, ic.tsNumber, target.crKey));
          if (idx >= 0) { found = { suite: s, idx }; break; }
        }
        if (found) {
          const tc = found.suite.cases[found.idx];
          if (ic.objective && tc.objective !== ic.objective && (opts.objectives !== "fill" || !tc.objective)) {
            found.suite.cases[found.idx] = withLog(
              { ...tc, objective: ic.objective },
              logEntry("imported", "import", { text: tc.objective ? `${text} · objective updated` : `${text} · objective added` }),
            );
            summary.objectivesUpdated++;
          }
          continue;
        }
        let suite = target.suites.find(s => s.title.trim().toLowerCase() === isuite.title.trim().toLowerCase());
        if (!suite) { suite = { id: uid(), title: isuite.title, cases: [] }; target.suites.push(suite); }
        const tc = newCase(ic.tsNumber, "import", { objective: ic.objective || undefined, ...(ic.disabled ? { disabled: true } : {}) }, text);
        if (ic.status) {
          // The workbook carries no test date — leave dateTested empty rather than invent one.
          tc.status = ic.status;
          tc.log!.push(logEntry("status", "import", { from: statusLabel(null), to: statusLabel(ic.status), text: "Status from the workbook" }));
        }
        suite.cases.push(tc);
        summary.casesAdded++;
      }
    }
  }
  return { data: next, summary };
}
