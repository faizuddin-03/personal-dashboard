// POST   /api/pipeline/jobs { key, action, input? } — queue a character job
//        (spawned detached; see scripts/pipeline/run-character.mjs).
// GET    ?key=[&active=1] — jobs, newest first (all tickets when no key).
// DELETE ?id= — stop a queued or running job.
// Design: scripts/pipeline/README.md §3.3.
import { ACTIONS, KEY_RE, SYSTEM_KEY, readTicket, queueJob, listJobs, readJob, stopJob } from "@/scripts/pipeline/store.mjs";
import type { JobAction } from "@/lib/pipeline/types";

/** runId of a findings job input: { runId } or { result: { runId } }. */
function runIdOf(input: unknown): string {
  const i = (input ?? {}) as { runId?: unknown; result?: { runId?: unknown } };
  const v = i.runId ?? i.result?.runId;
  return v == null ? "" : String(v);
}

const strip =<T extends { input?: unknown }>(j: T) => { const { input, ...rest } = j; void input; return rest; };

export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const key = sp.get("key")?.trim().toUpperCase() || undefined;
  if (key && !KEY_RE.test(key)) return Response.json({ error: "Not a ticket key" }, { status: 400 });
  // System jobs (no pipeline ticket, e.g. sage:apply for a studying-only key)
  // stay off the board and the "working now" list; ?key=KNOWLEDGE-0 shows them.
  const jobs = listJobs({ key, active: sp.get("active") === "1", limit: 100 })
    .filter(j => key === SYSTEM_KEY || !j.system);
  return Response.json({ jobs: jobs.map(strip) });
}

export async function POST(request: Request) {
  let body: { key?: unknown; action?: unknown; input?: unknown };
  try { body = await request.json(); }
  catch { return Response.json({ error: "Body must be JSON: { key, action, input? }" }, { status: 400 }); }
  const key = String(body?.key ?? "").trim().toUpperCase();
  const action = String(body?.action ?? "") as JobAction;
  if (!KEY_RE.test(key)) return Response.json({ error: "Not a ticket key" }, { status: 400 });
  if (!ACTIONS.includes(action)) return Response.json({ error: `Unknown action. Use one of: ${ACTIONS.join(", ")}` }, { status: 400 });
  if (!readTicket(key)) return Response.json({ error: `${key} is not in the pipeline` }, { status: 404 });
  // One findings job per run: a second tab (or a repeat post) gets the first job
  // back. A job that errored or was stopped may be asked again.
  if (action === "elf:findings") {
    const runId = runIdOf(body.input);
    const same = runId && listJobs({ key }).find(j =>
      j.action === "elf:findings" && runIdOf(j.input) === runId && j.state !== "error" && j.state !== "stopped");
    if (same) return Response.json({ job: strip(same), skipped: "duplicate" });
  }
  try {
    const job = queueJob({ key, action, input: body.input });
    return Response.json({ job: strip(job) });
  } catch (e) {
    return Response.json({ error: `Could not start the job: ${(e as Error).message}` }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get("id") ?? "";
  let job;
  try { job = readJob(id); } catch { return Response.json({ error: "Not a job id" }, { status: 400 }); }
  if (!job) return Response.json({ error: "No such job" }, { status: 404 });
  const stopped = stopJob(id);
  return Response.json({ job: stopped ? strip(stopped) : null });
}
