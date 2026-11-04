// GET /api/ts-tracker/official — every pipeline ticket that has an official
// TS file (files.officialTs), with each TS row and its result per device
// column. The TS Tracker polls this and keeps its CRs in step with the
// official sheets (Faizuddin, 2026-11-03: "the TS Tracker dashboard should
// also automatically update itself with the latest TS and its progress").
// Read only; the workbook is re-read only when the synced file changes.
//
// Also merges Claude-driven run results from scripts/claude-run/results/*.json
// (lib/claudeRunResults.ts, 2026-11-04): each run adds one result column to its
// ticket, and creates the ticket here when no official sheet is on this laptop.
import { listTickets } from "@/scripts/pipeline/store.mjs";
import { readOfficialTsResults, type OfficialCase } from "@/lib/officialTsResults";
import { mergeRunIntoCases, readClaudeRunResults } from "@/lib/claudeRunResults";

export const dynamic = "force-dynamic";

export interface OfficialTicket { key: string; title: string; mtimeMs: number; modifiedAt: string; cases: OfficialCase[] }

export async function GET() {
  const tickets: OfficialTicket[] = [];
  const errors: { key: string; error: string }[] = [];
  for (const t of listTickets()) {
    const file = t.files?.officialTs;
    if (!file) continue;
    try {
      const r = await readOfficialTsResults(file);
      tickets.push({ key: t.key, title: t.title ?? "", mtimeMs: r.mtimeMs, modifiedAt: r.modifiedAt, cases: r.cases });
    } catch (e) {
      errors.push({ key: t.key, error: e instanceof Error ? e.message : String(e) });
    }
  }
  const runs = readClaudeRunResults();
  for (const e of runs.errors) errors.push({ key: `claude-run/${e.file}`, error: e.error });
  for (const run of runs.results) {
    const t = tickets.find(x => x.key.toUpperCase() === run.key.toUpperCase());
    if (t) {
      // The tracker re-applies a ticket only when mtimeMs changes, so a newer run file must move it.
      t.cases = mergeRunIntoCases(t.cases, run);
      if (run.mtimeMs > t.mtimeMs) { t.mtimeMs = run.mtimeMs; t.modifiedAt = run.modifiedAt; }
    } else {
      tickets.push({ key: run.key, title: run.title, mtimeMs: run.mtimeMs, modifiedAt: run.modifiedAt, cases: run.cases });
    }
  }
  return Response.json({ tickets, errors });
}
