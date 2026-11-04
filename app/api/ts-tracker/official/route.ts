// GET /api/ts-tracker/official — every pipeline ticket that has an official
// TS file (files.officialTs), with each TS row and its result per device
// column. The TS Tracker polls this and keeps its CRs in step with the
// official sheets (Faizuddin, 2026-11-03: "the TS Tracker dashboard should
// also automatically update itself with the latest TS and its progress").
// Read only; the workbook is re-read only when the synced file changes.
import { listTickets } from "@/scripts/pipeline/store.mjs";
import { readOfficialTsResults, type OfficialCase } from "@/lib/officialTsResults";

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
  return Response.json({ tickets, errors });
}
