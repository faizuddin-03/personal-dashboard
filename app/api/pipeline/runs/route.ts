// POST /api/pipeline/runs — saves the full result of one runner-page run of a
// pipeline ticket to data/pipeline/runs/<KEY>/<runId>.json (2026-10-27). The
// runner pages' meta.json keeps only title/status, so PipelineRunWatcher posts
// the live result here when a run resolves; elf:findings reads it for the
// error text, failed step and evidence. Posting the same runId again
// overwrites the same file.
// GET ?key=[&runId=] — saved runs of a ticket (summaries), or one full run.
// Design: scripts/pipeline/README.md §1.6, §3.11.
import {
  KEY_RE, readTicket, writeRun, listRuns, findRun, isRunId, addEvent, type SavedRun, type SavedRunCheck,
} from "@/scripts/pipeline/store.mjs";
import { markFindingsAfterRun } from "@/scripts/pipeline/lib/latest-run.mjs";
import { voidRun, unvoidRun, voidedFor } from "@/scripts/pipeline/lib/voided-runs.mjs";

const MAX_CHECKS = 500;
const MAX_LOG = 200_000;

const str = (v: unknown, n = 20_000) => (typeof v === "string" && v ? v.slice(0, n) : undefined);
const arr = <T = unknown>(v: unknown, n = 200): T[] | undefined => (Array.isArray(v) ? (v.slice(0, n) as T[]) : undefined);

function pickCheck(c: unknown): SavedRunCheck | null {
  if (!c || typeof c !== "object") return null;
  const o = c as Record<string, unknown>;
  const title = str(o.title, 1000);
  if (!title) return null;
  return {
    title,
    status: str(o.status, 40),
    tsLabel: str(o.tsLabel, 120),
    error: str(o.error),
    friendlyError: str(o.friendlyError),
    steps: arr(o.steps, 500),
    evidence: arr(o.evidence),
    video: str(o.video, 1000),
    details: arr(o.details),
    durationMs: typeof o.durationMs === "number" ? o.durationMs : undefined,
  };
}

const summary = (r: SavedRun) => ({
  runId: r.runId, serverRunId: r.serverRunId, runLabel: r.runLabel, runKey: r.runKey,
  startedAt: r.startedAt, finishedAt: r.finishedAt, savedAt: r.savedAt,
  total: r.checks?.length ?? 0,
  failed: (r.checks ?? []).filter(c => c.status && c.status !== "passed" && c.status !== "skipped").length,
  error: r.error,
});

export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const key = sp.get("key")?.trim().toUpperCase() ?? "";
  if (!KEY_RE.test(key)) return Response.json({ error: "Give a ticket key, e.g. ?key=EAINT-12153." }, { status: 400 });
  const runId = sp.get("runId")?.trim();
  if (runId) {
    const run = findRun(key, runId);
    return run ? Response.json({ run }) : Response.json({ error: `No saved run ${runId} for ${key}.` }, { status: 404 });
  }
  // `voided`: the whole-run void row or null (sectioned-details, 2026-10-28: the ticket page's Void button needs it).
  return Response.json({ runs: listRuns(key).map(r => ({ ...summary(r), voided: voidedFor(key, r.runId) })) });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try { body = (await request.json()) as Record<string, unknown>; }
  catch { return Response.json({ error: "Body must be JSON: { key, runId, checks, ... }" }, { status: 400 }); }

  const key = typeof body.key === "string" ? body.key.trim().toUpperCase() : "";
  if (!KEY_RE.test(key)) return Response.json({ error: "Give a ticket key, e.g. EAINT-12153." }, { status: 400 });
  const runId = typeof body.runId === "string" ? body.runId.trim() : "";
  if (!isRunId(runId)) return Response.json({ error: "Give the runId (letters, digits, _ . - only)." }, { status: 400 });
  if (!readTicket(key)) return Response.json({ error: `${key} is not in the pipeline.` }, { status: 404 });

  const checks = (arr(body.checks, MAX_CHECKS) ?? []).map(pickCheck).filter((c): c is SavedRunCheck => !!c);
  const serverRunId = body.serverRunId == null ? undefined : String(body.serverRunId).slice(0, 120);
  const log = str(body.log, Number.MAX_SAFE_INTEGER);
  const rec: SavedRun = {
    key,
    runId,
    runKey: str(body.runKey, 200),
    serverRunId: serverRunId && isRunId(serverRunId) ? serverRunId : undefined,
    runLabel: str(body.runLabel, 200),
    startedAt: str(body.startedAt, 40),
    finishedAt: str(body.finishedAt, 40),
    error: str(body.error),
    meta: body.meta && typeof body.meta === "object" && !Array.isArray(body.meta) ? (body.meta as Record<string, unknown>) : undefined,
    checks,
    passed: typeof body.passed === "number" ? body.passed : undefined,
    failed: typeof body.failed === "number" ? body.failed : undefined,
    total: typeof body.total === "number" ? body.total : undefined,
    video: str(body.video, 1000),
    evidence: arr(body.evidence),
    details: arr(body.details),
    // The tail holds the failure; the start is setup noise.
    log: log ? log.slice(-MAX_LOG) : undefined,
  };
  try {
    const saved = writeRun(rec);
    // Night round 5: open findings whose TS this run passed are marked (and
    // unmarked when it fails again), so a Raise is checked against the latest
    // run [charmain-repo: test-scenarios/defects.yaml:14-26]. Never fails the save.
    let findings: { marked: string[]; cleared: string[] } | undefined;
    try {
      findings = markFindingsAfterRun(key, saved);
      if (findings.marked.length) addEvent(key, `Run ${saved.runLabel ?? runId} passed the TS of ${findings.marked.length} open finding(s) (${findings.marked.join(", ")}): re-check before raising`);
    } catch { /* marking is advisory */ }
    return Response.json({ ok: true, run: summary(saved), ...(findings && (findings.marked.length || findings.cleared.length) ? { findings } : {}) });
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : "The run could not be saved." }, { status: 500 });
  }
}

// PATCH { key, runId, ts?, void: true, reason, by } | { key, runId, ts?, void: false, by }
// Night round 12: voids (or restores) a saved run or one TS of it. A voided run
// is evidence of nothing (wrong build / environment / account); the run file is
// kept. Voiding is a person's decision: `by` names who, `reason` says why
// [charmain-repo: test-scenarios/voided-runs.yaml:1-24]. scripts/pipeline/lib/voided-runs.mjs.
export async function PATCH(request: Request) {
  let body: Record<string, unknown>;
  try { body = (await request.json()) as Record<string, unknown>; }
  catch { return Response.json({ error: "Body must be JSON: { key, runId, void, reason, by }" }, { status: 400 }); }
  const key = typeof body.key === "string" ? body.key.trim().toUpperCase() : "";
  const runId = typeof body.runId === "string" ? body.runId.trim() : "";
  const ts = typeof body.ts === "string" && body.ts.trim() ? body.ts.trim() : undefined;
  const by = typeof body.by === "string" ? body.by.trim() : "";
  if (typeof body.void !== "boolean") return Response.json({ error: "void must be true or false" }, { status: 400 });
  try {
    if (body.void) {
      const row = voidRun({ key, runId, ts, reason: typeof body.reason === "string" ? body.reason : "", by });
      return Response.json({ ok: true, voided: row });
    }
    return Response.json({ ok: true, restored: unvoidRun({ key, runId, ts, by }) });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Could not change the run" }, { status: 400 });
  }
}
