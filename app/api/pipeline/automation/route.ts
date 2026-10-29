// GET /api/pipeline/automation?key= — tracking data for the ticket page's
// "Automation" panel (ticket-automation-panel, 2026-10-28). Faizuddin,
// 2026-10-27: "once the automation is created, the dwarf should also build a
// page for it in the ticket page, for me to track the automation, and to run it".
// Per TS: the latest status from the saved pipeline runs (voided runs and
// voided TS are ignored) and the official-sheet sync log (test writes and dry
// runs left out), whichever is newer; plus the scenario list (priority,
// manual) and Dwarf's assertion plan. Read only. Design: scripts/pipeline/README.md §10.
import fs from "node:fs";
import { KEY_RE, readTicket, listRuns, repoPath } from "@/scripts/pipeline/store.mjs";
import { canonTs, checkTsIds } from "@/scripts/pipeline/lib/latest-run.mjs";
import { voidedFor } from "@/scripts/pipeline/lib/voided-runs.mjs";
import { readSyncLog } from "@/scripts/pipeline/lib/official-ts.mjs";

type TrackStatus = "Pass" | "Fail" | "In Progress" | "Skipped";
interface TsTrack {
  status: TrackStatus;
  at?: string;
  source: "run" | "sheet";
  runId?: string;
  runLabel?: string;
  error?: string;
}
interface Scenario { id: string; title: string; priority?: string; manual?: boolean; section?: string }

function readJson(rel: string | undefined): unknown {
  if (!rel) return null;
  try { return JSON.parse(fs.readFileSync(repoPath(rel), "utf8").replace(/^﻿/, "")); } catch { return null; }
}

const runTime = (r: { finishedAt?: string; savedAt?: string; startedAt?: string }) => r.finishedAt ?? r.savedAt ?? r.startedAt ?? "";

export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get("key")?.trim().toUpperCase() ?? "";
  if (!KEY_RE.test(key)) return Response.json({ error: "Give a ticket key, e.g. ?key=EAINT-12153." }, { status: 400 });
  const ticket = readTicket(key);
  if (!ticket) return Response.json({ error: `${key} is not in the pipeline.` }, { status: 404 });

  const rawList = readJson(ticket.files?.scenariosJson ?? `data/pipeline/work/${key}/scenarios.json`);
  const scenarios: Scenario[] = Array.isArray(rawList)
    ? rawList.filter(s => s && typeof s === "object" && typeof (s as Scenario).id === "string").map(s => {
        const o = s as Scenario;
        return { id: o.id, title: String(o.title ?? ""), priority: typeof o.priority === "string" ? o.priority : undefined, manual: !!o.manual, section: typeof o.section === "string" ? o.section : undefined };
      })
    : [];
  // canonical "TS3" → scenario id "12345_TS03"
  const byCanon = new Map(scenarios.map(s => [canonTs(s.id), s.id]));
  const idOf = (raw: string) => byCanon.get(canonTs(raw)) ?? raw;

  const track: Record<string, TsTrack> = {};
  const put = (id: string, t: TsTrack) => {
    const cur = track[id];
    if (!cur || (t.at ?? "") > (cur.at ?? "")) track[id] = t;
  };

  // Saved runs, newest first. A TS's latest non-voided result in a run wins over older runs.
  const runs = listRuns(key);
  let lastRunAt: string | undefined;
  let voidedRuns = 0;
  for (const run of runs) {
    const at = runTime(run);
    if (voidedFor(key, run.runId)) { voidedRuns++; continue; }
    if (!lastRunAt) lastRunAt = at;
    const per: Record<string, { status: TrackStatus; error?: string }> = {};
    for (const c of run.checks ?? []) {
      for (const tsId of checkTsIds(c)) {
        const id = idOf(tsId);
        if (voidedFor(key, run.runId, id)) continue;
        const s: TrackStatus = c.status === "passed" ? "Pass" : c.status === "skipped" ? "Skipped" : "Fail";
        const prev = per[id];
        // A TS with any failed check is Fail; skipped only counts when nothing else ran.
        if (!prev || s === "Fail" || (prev.status === "Skipped" && s === "Pass")) per[id] = { status: s, error: s === "Fail" ? (c.friendlyError ?? c.error)?.slice(0, 300) : undefined };
      }
    }
    for (const [id, v] of Object.entries(per)) {
      if (track[id]?.source === "run") continue; // newer run already counted
      put(id, { status: v.status, at, source: "run", runId: run.runId, runLabel: run.runLabel, ...(v.error ? { error: v.error } : {}) });
    }
  }

  // Official-sheet sync log (newest first). Only real writes; "In Progress" shows a run in flight.
  let lastSyncAt: string | undefined;
  for (const e of readSyncLog(key, 500) as unknown as Array<Record<string, unknown>>) {
    if (e.test || e.dryRun) continue;
    const at = typeof e.at === "string" ? e.at : undefined;
    if (at && !lastSyncAt) lastSyncAt = at;
    const status = e.status;
    if (status !== "Pass" && status !== "Fail" && status !== "In Progress") continue;
    const runId = typeof e.runId === "string" ? e.runId : undefined;
    for (const raw of (Array.isArray(e.ts) ? e.ts : [e.ts]).filter((x): x is string => typeof x === "string")) {
      const id = idOf(raw);
      if (runId && voidedFor(key, runId, id)) continue;
      put(id, { status, at, source: "sheet", ...(runId ? { runId } : {}) });
    }
  }

  const plan = readJson(ticket.files?.assertionPlan ?? `data/pipeline/work/${key}/assertion-plan.json`);
  return Response.json({
    key,
    scenarios,
    track,
    lastRunAt,
    lastSyncAt,
    runs: runs.length,
    voidedRuns,
    assertionPlan: Array.isArray(plan) ? plan : null,
  });
}
