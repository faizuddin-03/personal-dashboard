// Claude-driven run results → TS Tracker (Faizuddin, 2026-11-04: "update this repo and the
// dashboard TS tracker with the progress, so i have a visual sign on whats happening").
//
// When Claude runs a ticket's TS itself in a browser (knowledge/claude-driven-testing.md), the
// outcome per TS is written to scripts/claude-run/results/<KEY>.json, which is tracked in git
// so every laptop's dashboard sees it. /api/ts-tracker/official serves these next to the
// official TS sheets: each file adds ONE result column (e.g. "Claude uat1 04-11") to the
// ticket's cases. The tracker then shows it like any device column of the official sheet
// (lib/tsTrackerOfficialSync.ts). READ ONLY.
import fs from "node:fs";
import path from "node:path";
import type { OfficialCase, ResultStatus } from "@/lib/officialTsResults";

export interface ClaudeRunFile {
  key: string;
  title: string;
  column: string;
  environment?: string;
  ranAt?: string;
  details?: string;
  cases: OfficialCase[];
}

export interface ClaudeRunResult extends ClaudeRunFile { mtimeMs: number; modifiedAt: string }

const DIR = path.join(process.cwd(), "scripts", "claude-run", "results");
const STATUSES: ResultStatus[] = ["Pass", "Fail", "In Progress", "Not Started", "Blocked", "N/A", "Other"];

/** Every scripts/claude-run/results/*.json. A file that cannot be read is skipped and named in `errors`. */
export function readClaudeRunResults(): { results: ClaudeRunResult[]; errors: { file: string; error: string }[] } {
  const results: ClaudeRunResult[] = [];
  const errors: { file: string; error: string }[] = [];
  let names: string[] = [];
  try { names = fs.readdirSync(DIR).filter(n => n.endsWith(".json")); } catch { return { results, errors }; }
  for (const name of names) {
    const file = path.join(DIR, name);
    try {
      const raw = JSON.parse(fs.readFileSync(file, "utf8")) as ClaudeRunFile;
      if (!raw.key || !Array.isArray(raw.cases)) throw new Error("needs \"key\" and \"cases\"");
      const cases: OfficialCase[] = raw.cases.map(c => ({
        sheet: c.sheet, section: c.section, ts: c.ts, objective: c.objective ?? "",
        cells: (c.cells ?? []).map(x => ({ column: x.column, status: STATUSES.includes(x.status) ? x.status : "Other" })),
      }));
      const mtimeMs = fs.statSync(file).mtimeMs;
      results.push({ ...raw, cases, mtimeMs, modifiedAt: new Date(mtimeMs).toISOString() });
    } catch (e) {
      errors.push({ file: name, error: e instanceof Error ? e.message : String(e) });
    }
  }
  return { results, errors };
}

/**
 * Adds a Claude run's column to an official ticket's cases (matched by TS id, case-insensitive);
 * TS only in the run file are appended. The official sheet's own cells come first.
 * When the run is newer than the sheet (`runIsNewer`), the run's result decides the TS's overall
 * status (`overall`), so an older sheet "Not Started" no longer turns a run Pass into In Progress
 * (Faizuddin, 2026-11-05: "the TS tracker here is not up to date with yesterday's progress").
 */
export function mergeRunIntoCases(official: OfficialCase[], run: ClaudeRunResult, runIsNewer = false): OfficialCase[] {
  // "12028_TS01" matches "TS01"; the ticket-number prefix is dropped, the rest must be equal
  // (a last-segment match would pair 12406_QT_TS10 with 12406_TS10 or RC_TS10).
  const norm = (ts: string) => ts.replace(/\s+/g, "").toUpperCase().replace(/^\d+_/, "");
  const out = official.map(c => ({ ...c, cells: [...c.cells] }));
  for (const rc of run.cases) {
    const hit = out.find(c => norm(c.ts) === norm(rc.ts));
    if (hit) {
      hit.cells.push(...rc.cells.filter(x => !hit.cells.some(y => y.column === x.column)));
      const decided = rc.cells.find(x => x.status !== "Not Started");
      if (runIsNewer && decided) hit.overall = decided.status;
    }
    else out.push({ ...rc, cells: [...rc.cells] });
  }
  return out;
}
