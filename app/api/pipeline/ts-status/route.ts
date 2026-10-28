// POST /api/pipeline/ts-status { key, ts, status, runId?, dryRun? } — writes
// "In Progress" / "Pass" / "Fail" into the official TS status column for a
// pipeline ticket (standing permission from Faizuddin 2026-10-27: status
// column only). GET ?key= — the sync log and anything still waiting.
// Every call first retries writes that were blocked by Excel holding the file.
// A repeat of a status already written for the same run (or, without runId,
// the same key+TS+status within 2 min) is skipped: { ok: true, skipped: "duplicate" }.
// Design: scripts/pipeline/README.md §1.7, §3.6.
import { readTicket, updateTicket, KEY_RE } from "@/scripts/pipeline/store.mjs";
import {
  syncStatus, retryPending, readSyncLog, readPending, isTestPath, TS_STATUSES, type TsStatus,
} from "@/scripts/pipeline/lib/official-ts.mjs";
import { PIPELINE_STAGES } from "@/lib/pipeline/types";

const stageIndex = (s: string) => PIPELINE_STAGES.findIndex(x => x.id === s);

async function retryQuietly() {
  try { return await retryPending(); } catch { return []; }
}

export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get("key")?.trim().toUpperCase() ?? "";
  if (key && !KEY_RE.test(key)) return Response.json({ error: "Not a ticket key." }, { status: 400 });
  const retried = await retryQuietly();
  return Response.json({
    log: readSyncLog(key || undefined),
    pending: readPending().filter(p => !key || p.key === key),
    retried,
  });
}

interface Body { key?: unknown; ts?: unknown; status?: unknown; runId?: unknown; dryRun?: unknown; targetPath?: unknown }

export async function POST(request: Request) {
  let body: Body;
  try { body = (await request.json()) as Body; }
  catch { return Response.json({ error: "Body must be JSON: { key, ts, status }" }, { status: 400 }); }

  const key = typeof body.key === "string" ? body.key.trim().toUpperCase() : "";
  if (!KEY_RE.test(key)) return Response.json({ error: "Give a ticket key, e.g. EAINT-12153." }, { status: 400 });
  const ts = (Array.isArray(body.ts) ? body.ts : [body.ts]).filter((t): t is string => typeof t === "string" && !!t.trim());
  if (!ts.length) return Response.json({ error: "Give the TS ids, e.g. [\"12153_TS01\"]." }, { status: 400 });
  const status = body.status as TsStatus;
  if (!TS_STATUSES.includes(status)) return Response.json({ error: `Status must be one of: ${TS_STATUSES.join(", ")}.` }, { status: 400 });
  const runId = typeof body.runId === "string" ? body.runId : undefined;
  const dryRun = body.dryRun === true;

  // Tests write to copies under data/pipeline/test/ only, never the real sheet.
  let targetPath: string | undefined;
  if (body.targetPath !== undefined) {
    if (typeof body.targetPath !== "string" || !isTestPath(body.targetPath)) {
      return Response.json({ error: "targetPath is only allowed under data/pipeline/test/." }, { status: 400 });
    }
    targetPath = body.targetPath;
  } else {
    const ticket = readTicket(key);
    if (!ticket) return Response.json({ error: `${key} is not in the pipeline, so its official TS is not updated.` }, { status: 409 });
    if (!ticket.statusSync) return Response.json({ error: `Official TS updates are turned off for ${key}. Turn them on in the pipeline page first.` }, { status: 409 });
  }

  const retried = await retryQuietly();
  let result;
  try {
    result = await syncStatus({ key, ts, status, runId, targetPath, dryRun });
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : "The status could not be written." }, { status: 500 });
  }

  // A run started on the runner page moves the ticket to Testing.
  if (!targetPath && !dryRun && status === "In Progress") {
    try {
      updateTicket(key, t => {
        if (stageIndex(t.stage) < stageIndex("testing")) t.stage = "testing";
      });
    } catch { /* the stage is a convenience */ }
  }

  // Locked (queued for later) is not a request error; the caller shows the message.
  const code = result.ok || result.queued ? 200 : result.error?.startsWith("No official TS") ? 404 : 422;
  return Response.json({ ...result, retried }, { status: code });
}
