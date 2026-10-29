// POST /api/pipeline/approve { key, dryRun? } — Faizuddin's green light on
// Elf's scenarios: records the approval and the scenarios.json hash, then
// queues Elf's workbook build and Dwarf's automation build.
// Refuses (409) while the ticket brief (data/pipeline/work/<KEY>/brief.json:
// scope, man-days, modules/pages) is missing or incomplete (2026-10-27).
// dryRun (tests only, 2026-10-27): records the approval the same way, but both
// jobs run with --dry, so no Claude session starts and no suite is created;
// the response carries the claude command and prompt each job would use.
// Design: scripts/pipeline/README.md §1.4, §3.5.
import * as fs from "node:fs";
import * as path from "node:path";
import { execFile } from "node:child_process";
import { ROOT, KEY_RE, readTicket, updateTicket, queueJob, createJob, listJobs, hashFile, repoPath, raiseStage, nowIso, noteForSage } from "@/scripts/pipeline/store.mjs";
import { readBrief } from "@/scripts/pipeline/lib/brief.mjs";

const TS_ID = /^\d+_TS\d{2,}$/;

/** Runs one job with --dry and returns what the runner printed (command + prompt, or SKIP). */
function dryRunJob(id: string): Promise<string> {
  const runner = path.join(/*turbopackIgnore: true*/ ROOT, "scripts", "pipeline", "run-character.mjs");
  return new Promise(resolve => {
    execFile(process.execPath, [runner, id, "--dry"], { cwd: ROOT, windowsHide: true, timeout: 60_000, maxBuffer: 4 * 1024 * 1024 },
      (err, stdout, stderr) => resolve(err ? `${stdout}\n${stderr || err.message}` : stdout));
  });
}

export async function POST(request: Request) {
  let body: { key?: unknown; dryRun?: unknown };
  try { body = await request.json(); }
  catch { return Response.json({ error: "Body must be JSON: { key }" }, { status: 400 }); }
  const key = String(body?.key ?? "").trim().toUpperCase();
  if (!KEY_RE.test(key)) return Response.json({ error: "Not a ticket key" }, { status: 400 });
  const ticket = readTicket(key);
  if (!ticket) return Response.json({ error: `${key} is not in the pipeline` }, { status: 404 });
  const dryRun = body.dryRun === true;

  const jsonRel = ticket.files?.scenariosJson ?? `data/pipeline/work/${key}/scenarios.json`;
  let list: unknown;
  try { list = JSON.parse(fs.readFileSync(repoPath(jsonRel), "utf8")); }
  catch { return Response.json({ error: "There are no scenarios to approve yet: ask Elf for scenarios first" }, { status: 409 }); }
  if (!Array.isArray(list) || !list.length || !list.every(s => s && typeof s === "object" && TS_ID.test(String((s as { id?: unknown }).id)))) {
    return Response.json({ error: "The scenario list has problems: ask Elf to fix it before approving" }, { status: 409 });
  }
  // Ticket brief (2026-10-27): no green light without scope, man-days and modules/pages.
  const brief = readBrief(key);
  if (!brief.ok) {
    return Response.json({
      error: brief.exists
        ? `The ticket brief is incomplete (${brief.missing.join("; ")}): ask Scribe to finish ${brief.rel} before approving`
        : `There is no ticket brief yet (${brief.rel}): Scribe writes it with the related history; ask Scribe for it before approving`,
      briefMissing: brief.missing,
    }, { status: 409 });
  }
  const busy = listJobs({ key, active: true }).find(j => j.character === "elf" && j.action !== "elf:findings");
  if (busy) return Response.json({ error: "Elf is still working on the scenarios: wait for Elf to finish" }, { status: 409 });

  const hash = hashFile(repoPath(jsonRel));
  const again = !!ticket.approvedAt;
  const updated = updateTicket(key, t => {
    t.approvedAt = nowIso();
    t.approvedScenarioHash = hash ?? undefined;
    t.files = { ...t.files, scenariosJson: jsonRel };
    raiseStage(t, "approved");
    t.characters.elf = { ...t.characters.elf, state: "idle", note: undefined };
    t.events = [{ at: nowIso(), text: `Faizuddin ${again ? "approved the scenarios again" : "gave the green light"} (${list.length} TS)${dryRun ? " [dry run]" : ""}` }, ...(t.events ?? [])].slice(0, 100);
  });
  if (dryRun) {
    const planned = [createJob({ key, action: "elf:build" }), createJob({ key, action: "dwarf:build" })];
    const jobs = await Promise.all(planned.map(async j => ({ id: j.id, action: j.action, output: await dryRunJob(j.id) })));
    return Response.json({ ticket: readTicket(key) ?? updated, dryRun: true, jobs });
  }
  // Sage (2026-10-27): the approved scenario list is something to learn from.
  noteForSage(key, { type: "approve", by: "faizuddin", text: `Faizuddin ${again ? "approved the scenarios again" : "gave the green light"} (${list.length} TS)`, file: jsonRel });
  const jobs = [queueJob({ key, action: "elf:build" }), queueJob({ key, action: "dwarf:build" })]
    .map(j => { const { input, ...rest } = j; void input; return rest; });
  return Response.json({ ticket: updated, jobs });
}
