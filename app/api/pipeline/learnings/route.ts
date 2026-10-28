// GET  /api/pipeline/learnings — the Sage's lists for the Learnings page:
//      { review: KnowledgeReview[], improvements: PipelineImprovement[],
//        learnings: LearningRecord[] (last 50, newest first), answers: SavedAnswer[] }
// POST { type: "review", id, decision: "approve" | "reject", note? }
//        approve → state "approved" + hands it to sage:apply: joins a sage:apply
//        job still queued for the same holder key (a batch, store.queueApply) or
//        queues one; for a key not on the pipeline board it runs as a system job
//        (SYSTEM_KEY). A change left "approved" with no live job (timed out,
//        stopped, crashed) is put back to "error" (GET) and can be approved again.
//      { type: "improvement", id, state: "done" | "dismissed" | "open" }
//      { type: "answer", id, decision: "wrong" | "active" } — "wrong" stops the
//        registry using that answer, so the question is asked again next time.
// Sage, the knowledge keeper (Faizuddin, 2026-10-27). README §8.
import {
  readSageList, updateSageList, readLearnings, readTicket, nowIso, KEY_RE,
  queueApply, applyJobFor, releaseStuckApprovals,
} from "@/scripts/pipeline/store.mjs";

export const dynamic = "force-dynamic";

const newestFirst = <T extends { at?: string; addedAt?: string }>(a: T, b: T) =>
  String(b.at ?? b.addedAt ?? "").localeCompare(String(a.at ?? a.addedAt ?? ""));

export async function GET() {
  // sage-batch-apply: never leave a change stuck at "approved" with no job.
  releaseStuckApprovals();
  return Response.json({
    review: [...readSageList("review")].sort(newestFirst),
    improvements: [...readSageList("improvements")].sort(newestFirst),
    learnings: readLearnings(50),
    answers: [...readSageList("answers")].sort(newestFirst),
  });
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return Response.json({ error: "Body must be JSON" }, { status: 400 }); }
  const id = str(body.id, 120);
  if (!id) return Response.json({ error: "Give the id" }, { status: 400 });

  if (body.type === "review") {
    const decision = body.decision;
    if (decision !== "approve" && decision !== "reject") return Response.json({ error: "decision must be approve or reject" }, { status: 400 });
    const item = readSageList("review").find(r => r.id === id);
    if (!item) return Response.json({ error: "No such change" }, { status: 404 });
    // "approved" with no live sage:apply job holding it (timed out / stopped /
    // crashed, sage-batch-apply) may be decided again, like "error".
    const stuck = item.state === "approved" && !applyJobFor(id);
    if (item.state !== "pending" && item.state !== "error" && !stuck) return Response.json({ error: `This change is already ${item.state}` }, { status: 409 });
    // A change keyed to a ticket that is not on the board (studying-only, or
    // "KNOWLEDGE-AUDIT") is applied by a system job under SYSTEM_KEY: no ticket
    // is added to the pipeline for it (README §8.3).
    const system = decision === "approve" && !(KEY_RE.test(item.key) && readTicket(item.key));
    if (system && !/^knowledge\/[^/]+\.md$/.test(String(item.file ?? ""))) {
      return Response.json({ error: `This change points at ${item.file || "no file"}, not a knowledge/ file, so the Sage cannot apply it` }, { status: 409 });
    }
    const note = str(body.note, 1000) || undefined;
    const list = updateSageList("review", l => l.map(r => (r.id === id
      // jobId cleared: the job it is handed to below sets it (an old failed job's id must not stay).
      ? { ...r, state: decision === "approve" ? "approved" as const : "rejected" as const, decidedAt: nowIso(), jobId: undefined, ...(note ? { note } : { note: undefined }) }
      : r)));
    const saved = list.find(r => r.id === id);
    if (decision === "reject") return Response.json({ item: saved });
    try {
      const { job, joined } = queueApply({ reviewId: id, reviewKey: item.key, system });
      const held = updateSageList("review", l => l.map(r => (r.id === id && r.state === "approved" && !r.jobId ? { ...r, jobId: job.id } : r)))
        .find(r => r.id === id) ?? saved;
      const { input, ...rest } = job; void input;
      return Response.json({ item: held, job: rest, joined });
    } catch (e) {
      updateSageList("review", l => l.map(r => (r.id === id ? { ...r, state: "error" as const, note: `Could not start the Sage: ${(e as Error).message}` } : r)));
      return Response.json({ error: `Approved, but the Sage did not start: ${(e as Error).message}` }, { status: 500 });
    }
  }

  if (body.type === "improvement") {
    const state = body.state;
    if (state !== "done" && state !== "dismissed" && state !== "open") return Response.json({ error: "state must be done, dismissed or open" }, { status: 400 });
    let found = false;
    const list = updateSageList("improvements", l => l.map(i => (i.id === id ? (found = true, { ...i, state, updatedAt: nowIso() }) : i)));
    if (!found) return Response.json({ error: "No such idea" }, { status: 404 });
    return Response.json({ item: list.find(i => i.id === id) });
  }

  if (body.type === "answer") {
    const decision = body.decision;
    if (decision !== "wrong" && decision !== "active") return Response.json({ error: "decision must be wrong or active" }, { status: 400 });
    let found = false;
    const list = updateSageList("answers", l => l.map(a => (a.id === id
      ? (found = true, { ...a, state: decision, ...(decision === "wrong" ? { flaggedAt: nowIso() } : { flaggedAt: undefined }) })
      : a)));
    if (!found) return Response.json({ error: "No such answer" }, { status: 404 });
    return Response.json({ item: list.find(a => a.id === id) });
  }

  return Response.json({ error: "type must be review, improvement or answer" }, { status: 400 });
}
