// Requirement changes flow on (Faizuddin, 2026-10-28: "if i update a
// requirement during the process, the other agents will also get updated").
// Scout / Scribe chats snapshot the requirement files before the job and
// compare after it; when one changed and Elf already has scenarios, Elf gets
// an automatic elf:chat to re-check them. Elf's finish then carries any
// scenario change on to Dwarf (dwarf:sync) and the workbook (elf:build).

import fs from "node:fs";
import { briefRel } from "./brief.mjs";

const NAMES = { scout: "Scout", scribe: "Scribe" };

/** The files that hold the ticket's requirements, as repo-relative paths. */
export function requirementFiles(ticket) {
  const key = ticket.key;
  return {
    study: ticket.files?.study ?? `_reference/tickets/Studying/${key}/${key}-study.md`,
    related: ticket.files?.related ?? `_reference/tickets/Studying/${key}/${key}-related-history.md`,
    brief: briefRel(key),
  };
}

/** Call in prepare(): remembers each requirement file's hash. */
export function snapshotRequirements(ctx) {
  const files = requirementFiles(ctx.ticket);
  ctx.state.reqBefore = Object.fromEntries(Object.entries(files).map(([k, rel]) => [k, ctx.store.hashFile(rel)]));
  ctx.state.reqFiles = files;
}

/**
 * Call in finish(): queues Elf when a requirement file changed. Skipped when
 * Elf has no scenarios yet (her first draft reads the latest files anyway) or
 * a requirement re-check is already queued (it will read the latest files).
 */
export function passRequirementChange(ctx, by) {
  const { store, job } = ctx;
  const before = ctx.state.reqBefore, files = ctx.state.reqFiles;
  if (!before || !files) return false;
  const changed = Object.entries(files).filter(([k, rel]) => store.hashFile(rel) !== before[k]).map(([, rel]) => rel);
  if (!changed.length) return false;
  const key = job.key;
  const t = store.readTicket(key);
  if (!t?.files?.scenariosJson || !fs.existsSync(store.repoPath(t.files.scenariosJson))) return false;
  const queued = store.listJobs({ key, active: true })
    .some(j => j.action === "elf:chat" && j.state === "queued" && j.input?.requirementChange);
  if (queued) return false;
  const who = NAMES[by] ?? by;
  store.queueJob({
    key,
    action: "elf:chat",
    input: { requirementChange: true, by, changed, text: `${who} updated the requirements: ${changed.join(", ")}` },
  });
  store.appendChat(key, "elf", { from: "system", text: `1. ${who} updated the requirements (${changed.join(", ")}).\n2. Elf is re-checking the scenarios against them.`, jobId: job.id });
  store.addEvent(key, `Requirement change from ${who} sent to Elf`);
  return true;
}

/** Elf's task for an automatic requirement re-check. */
export function requirementChangeTask(input, approved) {
  const who = NAMES[input?.by] ?? "Another character";
  const changed = Array.isArray(input?.changed) ? input.changed : [];
  return `Pipeline check (not a message from Faizuddin): ${who} just changed this ticket's requirement files after a message from Faizuddin:
${changed.map((f, i) => `${i + 1}. ${f}`).join("\n")}

1. Read each changed file and find what changed in the requirements (scope, rules, pages, expected results).
2. Compare with your current scenarios. Update them ONLY where the requirement change makes a TS wrong, missing or no longer needed.
3. If nothing in the scenarios needs to change, leave both files untouched and say so.${approved ? "\n4. The scenarios are APPROVED: every change you make goes to Dwarf and to the TS workbook automatically, so change only what is needed." : ""}`;
}
