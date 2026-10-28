// GET    /api/pipeline/tickets/[key] — the ticket workspace: ticket, chats,
//        jobs (active + recent), findings, and the study / related history /
//        scenario list as markdown text, and the ticket brief (parsed
//        brief.json: scope, man-days, modules/pages; null when not written)
//        with briefProblems (what is missing, [] when complete), and next:
//        the one next action (scripts/pipeline/lib/next-step.mjs, night round 7),
//        openQuestions: questions asked in the chats and never answered (round 9),
//        and parkedQuestions: questions he deferred to a later step (round 17).
// PATCH  { statusSync?, stage? } — toggles official-sheet sync or sets the stage.
// DELETE — removes the ticket from the pipeline; its files are kept.
// Design: scripts/pipeline/README.md §3.2.
import * as fs from "node:fs";
import {
  KEY_RE, STAGE_ORDER, readTicket, updateTicket, removeTicket, readChat, listJobs, listFindings, repoPath, stopJob, nowIso,
} from "@/scripts/pipeline/store.mjs";
import { readBrief } from "@/scripts/pipeline/lib/brief.mjs";
import { nextStep } from "@/scripts/pipeline/lib/next-step.mjs";
import { openQuestions } from "@/scripts/pipeline/lib/open-questions.mjs";
import { deferredQuestions } from "@/scripts/pipeline/lib/deferred-questions.mjs";
import type { PipelineStage } from "@/lib/pipeline/types";

const RECENT_JOBS = 20;
const MAX_MD = 400_000;

function readMd(rel: string | undefined): string | null {
  if (!rel) return null;
  try { return fs.readFileSync(repoPath(rel), "utf8").slice(0, MAX_MD); } catch { return null; }
}

async function keyFrom(ctx: RouteContext<"/api/pipeline/tickets/[key]">) {
  const { key } = await ctx.params;
  const k = decodeURIComponent(key).toUpperCase();
  return KEY_RE.test(k) ? k : null;
}

export async function GET(_req: Request, ctx: RouteContext<"/api/pipeline/tickets/[key]">) {
  const key = await keyFrom(ctx);
  if (!key) return Response.json({ error: "Not a ticket key" }, { status: 400 });
  const ticket = readTicket(key);
  if (!ticket) return Response.json({ error: `${key} is not in the pipeline` }, { status: 404 });

  const all = listJobs({ key });
  const active = all.filter(j => j.state === "queued" || j.state === "running");
  const recent = all.filter(j => j.state !== "queued" && j.state !== "running").slice(0, RECENT_JOBS);
  const brief = readBrief(key);
  const findings = listFindings(key);
  const questions = openQuestions(key, { ticket });
  const strip = <T extends { input?: unknown }>(j: T) => { const { input, ...rest } = j; void input; return rest; };

  return Response.json({
    ticket,
    chats: {
      elf: readChat(key, "elf"),
      dwarf: readChat(key, "dwarf"),
      scribe: readChat(key, "scribe"),
      scout: readChat(key, "scout"),
      sage: readChat(key, "sage"),
    },
    jobs: [...active, ...recent].map(strip),
    findings,
    brief: brief.brief,
    next: nextStep(ticket, { jobs: all, findings, brief, questions }),
    openQuestions: questions,
    parkedQuestions: deferredQuestions(key),
    briefProblems: brief.ok ? [] : brief.missing,
    files: {
      studyMd: readMd(ticket.files?.study ?? `_reference/tickets/Studying/${key}/${key}-study.md`),
      relatedMd: readMd(ticket.files?.related),
      scenariosMd: readMd(ticket.files?.scenariosMd),
    },
  });
}

export async function PATCH(request: Request, ctx: RouteContext<"/api/pipeline/tickets/[key]">) {
  const key = await keyFrom(ctx);
  if (!key) return Response.json({ error: "Not a ticket key" }, { status: 400 });
  let body: { statusSync?: unknown; stage?: unknown };
  try { body = await request.json(); }
  catch { return Response.json({ error: "Body must be JSON: { statusSync?, stage? }" }, { status: 400 }); }
  if (body.statusSync !== undefined && typeof body.statusSync !== "boolean") {
    return Response.json({ error: "statusSync must be true or false" }, { status: 400 });
  }
  if (body.stage !== undefined && !STAGE_ORDER.includes(body.stage as PipelineStage)) {
    return Response.json({ error: `stage must be one of: ${STAGE_ORDER.join(", ")}` }, { status: 400 });
  }
  const ticket = updateTicket(key, t => {
    const notes: string[] = [];
    if (typeof body.statusSync === "boolean" && body.statusSync !== t.statusSync) {
      t.statusSync = body.statusSync;
      notes.push(`Official sheet sync turned ${body.statusSync ? "on" : "off"}`);
    }
    if (body.stage && body.stage !== t.stage) {
      t.stage = body.stage as PipelineStage;
      notes.push(`Stage set to ${t.stage} by Faizuddin`);
    }
    t.events = [...notes.map(text => ({ at: nowIso(), text })), ...(t.events ?? [])].slice(0, 100);
  });
  if (!ticket) return Response.json({ error: `${key} is not in the pipeline` }, { status: 404 });
  return Response.json({ ticket });
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/pipeline/tickets/[key]">) {
  const key = await keyFrom(ctx);
  if (!key) return Response.json({ error: "Not a ticket key" }, { status: 400 });
  if (!readTicket(key)) return Response.json({ error: `${key} is not in the pipeline` }, { status: 404 });
  // Stop its running jobs first so nothing writes the ticket back.
  for (const j of listJobs({ key, active: true })) stopJob(j.id, "Faizuddin (ticket removed)");
  removeTicket(key);
  return Response.json({ removed: true });
}
