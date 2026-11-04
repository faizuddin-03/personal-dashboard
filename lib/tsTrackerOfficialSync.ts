// ── Official TS sheet → TS Tracker (live) ─────────────────
// Faizuddin, 2026-11-03: "the TS Tracker dashboard should also automatically
// update itself with the latest TS and its progress".
//
// Source: GET /api/ts-tracker/official (the OneDrive-synced official
// workbooks of pipeline tickets). Rules:
//   1. A pipeline ticket with an official TS becomes a tracker CR (created if
//      missing). Each section banner is a suite (the sheet tab when
//      a tab has no banner), as in the Excel import; each TS row is a case.
//   2. New TS rows are added. Objectives follow the sheet.
//   3. Status follows the sheet only when the SHEET changed since the last
//      read (sheetStatus). A status set by hand in the tracker stays until the
//      sheet itself changes for that TS. On the first read, a TS with no
//      result on the sheet keeps its tracker status.
//   4. Overall status of a TS with several device columns: any Fail → fail;
//      every open column Pass → pass; any Pass / In Progress → in progress;
//      otherwise not started.
//   5. Nothing is deleted. A TS removed from the sheet stays in the tracker.
import type { OfficialCase } from "@/lib/officialTsResults";
import {
  type CREntry, type TestCase, type TsStatus,
  TRACKER_KEY, TS_TRACKER_UPDATED_EVENT, loadTracker, uid, newCase, logEntry, sameTs, statusLabel,
} from "@/lib/tsTrackerModel";
import { todayLocal } from "@/lib/date";

export interface OfficialTicket { key: string; title: string; mtimeMs: number; modifiedAt: string; cases: OfficialCase[] }

export function overallStatus(cells: { status: string }[]): TsStatus {
  const s = cells.map(c => c.status).filter(x => x !== "N/A");
  if (!s.length) return null;
  if (s.includes("Fail")) return "fail";
  if (s.every(x => x === "Pass")) return "pass";
  if (s.some(x => x === "Pass" || x === "In Progress")) return "in-progress";
  return null;
}
const statusKey = (s: TsStatus) => s ?? "none";
const cellsNote = (cells: { column: string; status: string }[]) => cells.map(c => `${c.column}: ${c.status}`).join(" · ");

/** Mutates `data`. Returns how many cases were added or changed. */
export function applyOfficial(data: CREntry[], tickets: OfficialTicket[], now = new Date()): number {
  const at = now.toISOString();
  let changed = 0;
  for (const t of tickets) {
    let cr = data.find(c => c.crKey.toUpperCase() === t.key.toUpperCase());
    if (!cr) {
      cr = { id: uid(), crKey: t.key, crSummary: t.title, suites: [], logSince: at };
      data.push(cr);
      changed++;
    }
    const target = cr;
    for (const oc of t.cases) {
      const overall = overallStatus(oc.cells);
      const key = statusKey(overall);
      let found: TestCase | undefined;
      for (const s of target.suites) {
        found = s.cases.find(c => sameTs(c.tsNumber, oc.ts, target.crKey));
        if (found) break;
      }
      if (!found) {
        const title = oc.section || oc.sheet; // same grouping as the Excel import (section banners)
        let suite = target.suites.find(s => s.title.trim().toLowerCase() === title.trim().toLowerCase());
        if (!suite) { suite = { id: uid(), title, cases: [] }; target.suites.push(suite); }
        const tc = newCase(oc.ts, "import", { objective: oc.objective || undefined }, `Added from the official TS (${oc.sheet})`);
        tc.status = overall;
        if (overall) tc.log!.push(logEntry("status", "import", { from: statusLabel(null), to: statusLabel(overall), text: "Status from the official TS" }));
        tc.sheetStatus = key;
        tc.sheetCells = oc.cells;
        tc.sheetSyncedAt = at;
        tc.autoNote = cellsNote(oc.cells);
        suite.cases.push(tc);
        changed++;
        continue;
      }
      let touched = false;
      if (oc.objective && found.objective !== oc.objective) {
        found.log = [...(found.log ?? []), logEntry("imported", "import", { text: "Objective updated from the official TS" })];
        found.objective = oc.objective;
        touched = true;
      }
      if (found.sheetStatus !== key) {
        // The sheet changed for this TS (or it is the first live read). On the
        // first read a blank sheet result never wipes a status already tracked.
        const firstBlank = found.sheetStatus === undefined && overall === null;
        if (!firstBlank && statusKey(found.status) !== key && !found.disabled) {
          found.log = [...(found.log ?? []), logEntry("status", "import", {
            from: statusLabel(found.status), to: statusLabel(overall), text: "Status from the official TS",
          })];
          found.status = overall;
          // Date the change was seen on the sheet; the sheet itself has no test date.
          if (overall === "pass" || overall === "fail") found.dateTested = todayLocal();
        }
        found.sheetStatus = key;
        touched = true;
      }
      if (JSON.stringify(found.sheetCells ?? []) !== JSON.stringify(oc.cells)) {
        found.sheetCells = oc.cells;
        found.autoNote = cellsNote(oc.cells);
        touched = true;
      }
      if (touched) { found.sheetSyncedAt = at; changed++; }
    }
  }
  return changed;
}

/** Reads, applies and saves. Fires TS_TRACKER_UPDATED_EVENT when anything changed. */
export function syncOfficialIntoTracker(tickets: OfficialTicket[]): number {
  if (typeof window === "undefined" || !tickets.length) return 0;
  const data = loadTracker();
  const n = applyOfficial(data, tickets);
  if (!n) return 0;
  try {
    localStorage.setItem(TRACKER_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event(TS_TRACKER_UPDATED_EVENT));
  } catch { return 0; }
  return n;
}
