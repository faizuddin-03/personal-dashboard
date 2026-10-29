// GET  /api/pipeline/findings/<id>?key=<KEY> — one finding.
// POST /api/pipeline/findings/<id> {key?, state?, priority?, developerAccountId?,
//      developerName?, environment?, module?, issueDraft?, redraft?, reason?}
//      → saves Faizuddin's answers; "confirmed" asks Scout to draft the QA-Issue.
// QA pipeline (Faizuddin, 2026-10-27), README §3 item 8. Nothing here writes to Jira.
import * as fs from "node:fs";
import * as path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import {
  PIPE_DIR, KEY_RE, readFinding, writeFinding, updateTicket, listJobs, queueJob, nowIso, noteForSage,
} from "@/scripts/pipeline/store.mjs";
import type { Finding, QaIssueDraft } from "@/lib/pipeline/types";

export const dynamic = "force-dynamic";

const ID_RE = /^[A-Za-z0-9_.-]{1,120}$/;
const PRIORITIES = ["Highest", "High", "Medium", "Low", "Lowest"] as const;
const STATES = ["open", "confirmed", "dismissed"] as const;

/** The finding's ticket key: the one given, else the findings folder that holds this id. */
function keyFor(id: string, given: unknown): string | null {
  if (typeof given === "string" && KEY_RE.test(given)) return given;
  const root = path.join(/*turbopackIgnore: true*/ PIPE_DIR, "findings");
  let keys: string[] = [];
  try { keys = fs.readdirSync(root).filter(k => KEY_RE.test(k)); } catch { return null; }
  return keys.find(k => fs.existsSync(path.join(root, k, id, "finding.json"))) ?? null;
}

const str = (v: unknown, max = 400) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : undefined);
const strList = (v: unknown, max: number) =>
  Array.isArray(v) ? v.map(x => str(x, 300)).filter((x): x is string => !!x).slice(0, max) : undefined;

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!ID_RE.test(id)) return NextResponse.json({ error: "Not a finding id" }, { status: 400 });
  const key = keyFor(id, req.nextUrl.searchParams.get("key"));
  const finding = key ? readFinding(key, id) : null;
  if (!finding) return NextResponse.json({ error: `Finding ${id} not found` }, { status: 404 });
  return NextResponse.json({ finding });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!ID_RE.test(id)) return NextResponse.json({ error: "Not a finding id" }, { status: 400 });
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Body must be JSON" }, { status: 400 }); }

  const key = keyFor(id, body.key);
  const cur = key ? readFinding(key, id) : null;
  if (!key || !cur) return NextResponse.json({ error: `Finding ${id} not found` }, { status: 404 });

  const state = body.state;
  if (state !== undefined && !STATES.includes(state as (typeof STATES)[number])) {
    return NextResponse.json({ error: `State must be one of: ${STATES.join(", ")}` }, { status: 400 });
  }
  const priority = body.priority;
  if (priority !== undefined && priority !== null && !PRIORITIES.includes(priority as (typeof PRIORITIES)[number])) {
    return NextResponse.json({ error: `Priority must be one of: ${PRIORITIES.join(", ")}` }, { status: 400 });
  }
  if (cur.state === "raised" && state !== undefined) {
    return NextResponse.json({ error: `Already raised as ${cur.issueKey}; its state cannot change here` }, { status: 409 });
  }

  const next: Finding = { ...cur, raiseForm: { ...(cur.raiseForm ?? {}) } };
  const form = next.raiseForm!;
  if (priority) form.priority = priority as QaIssueDraft["priority"];
  if (body.developerAccountId !== undefined) form.developerAccountId = str(body.developerAccountId, 128) || undefined;
  if (body.developerName !== undefined) form.developerName = str(body.developerName, 120) || undefined;
  if (body.environment !== undefined) form.environment = str(body.environment, 80) || undefined;
  if (body.module !== undefined) form.module = str(body.module, 200) || undefined;

  // Faizuddin's edits to Scout's draft, plus the form answers kept in step.
  if (next.issueDraft) {
    const d: QaIssueDraft = { ...next.issueDraft };
    const edit = (body.issueDraft && typeof body.issueDraft === "object" ? body.issueDraft : {}) as Record<string, unknown>;
    d.title = str(edit.title, 250) ?? d.title;
    d.environment = str(edit.environment, 80) ?? form.environment ?? d.environment;
    d.module = str(edit.module, 200) ?? form.module ?? d.module;
    d.stagingIds = strList(edit.stagingIds, 10) ?? d.stagingIds;
    d.steps = strList(edit.steps, 8) ?? d.steps;
    d.actual = str(edit.actual, 500) ?? d.actual;
    d.expected = str(edit.expected, 500) ?? d.expected;
    d.attachments = strList(edit.attachments, 20) ?? d.attachments;
    if (form.priority) d.priority = form.priority;
    if (form.developerAccountId) d.developerAccountId = form.developerAccountId;
    next.issueDraft = d;
  }

  const becameConfirmed = state === "confirmed" && cur.state !== "confirmed";
  if (state) next.state = state as Finding["state"];
  writeFinding(next);

  let job: unknown = null;
  const wantDraft = next.state === "confirmed" && (becameConfirmed || body.redraft === true);
  if (wantDraft) {
    const busy = listJobs({ key, active: true }).some(j =>
      j.action === "scout:issue" && (j.input as { findingId?: string } | undefined)?.findingId === id);
    if (!busy) job = queueJob({ key, action: "scout:issue", input: { findingId: id } });
  }

  if (state && state !== cur.state) {
    const words = { open: "reopened", confirmed: "confirmed as an issue", dismissed: "marked not an issue" }[state as (typeof STATES)[number]];
    updateTicket(key, t => {
      t.events = [{ at: nowIso(), text: `Finding ${cur.ts} ${words}` }, ...(t.events ?? [])].slice(0, 100);
      if (wantDraft) t.characters.scout = { ...(t.characters.scout ?? { state: "idle" }), state: "working", note: `Drafting the QA-Issue for ${cur.ts}` };
    });
    // Sage (2026-10-27): his confirm / dismiss (and reason) teaches what is and is not an issue.
    if (state === "confirmed" || state === "dismissed") {
      const reason = str(body.reason, 1000);
      noteForSage(key, {
        type: "finding", by: "faizuddin", findingId: id, ts: cur.ts, state,
        // Night round 14: Elf's triage travels with it, so the Sage can write the lesson (KNOWLEDGE_RULES 10).
        text: `Finding ${cur.ts} ${words}: ${cur.summary}${reason ? `\nHis reason: ${reason}` : ""}${cur.triage ? `\nElf's triage: ${cur.triage.verdict} — ${cur.triage.cause}${cur.triage.ruledOut?.length ? ` (ruled out: ${cur.triage.ruledOut.join("; ")})` : ""}` : ""}${cur.failure?.error ? `\nError: ${String(cur.failure.friendlyError ?? cur.failure.error).slice(0, 300)}` : ""}`,
      });
    }
  }

  return NextResponse.json({ finding: next, job });
}
