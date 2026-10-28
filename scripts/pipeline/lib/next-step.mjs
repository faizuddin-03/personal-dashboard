// "What next?" per ticket (2026-10-27, night enhancement round 7).
//
// Charmain's workflow: "What should I do next on EAINT-X? Do not answer that
// by eye. ... It derives the stage from the same files the boards read and
// names ONE next action, plus what is waiting on a person versus what is
// waiting on work." [charmain-repo: docs/workflow.md:6-17]. Same idea here:
// one deterministic next action from the ticket's own files, jobs, findings
// and runs — no model call, no guessing.
//
// CLI: node scripts/pipeline/lib/next-step.mjs [KEY]   (no key = one line per ticket)

import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { readTicket, listTickets, listJobs, listFindings, listRuns, repoPath } from "../store.mjs";
import { readBrief } from "./brief.mjs";
import { openQuestions } from "./open-questions.mjs";
import { isRunVoided, voidedFor } from "./voided-runs.mjs";
import { deferredQuestions } from "./deferred-questions.mjs";

const NAME = { scout: "Scout", scribe: "Scribe", elf: "Elf", dwarf: "Dwarf", sage: "Sage" };
const ORDER = ["scout", "scribe", "elf", "dwarf", "sage"];
const readJson = rel => { try { return JSON.parse(fs.readFileSync(repoPath(rel), "utf8")); } catch { return null; } };
const exists = rel => { try { return fs.existsSync(repoPath(rel)); } catch { return false; } };
const short = (s, n = 160) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, n);
const plain = s => String(s ?? "").replace(/\*\*/g, "");

/**
 * { who: "faizuddin" | <character> | "none", waitingOn: "faizuddin" | "work" | "none",
 *   action: one plain line, also: [other things waiting], stage }
 * `parts` lets a caller pass what it already loaded (jobs, findings, runs, brief).
 */
export function nextStep(ticketOrKey, parts = {}) {
  const t = typeof ticketOrKey === "string" ? readTicket(ticketOrKey) : ticketOrKey;
  if (!t) return { who: "none", waitingOn: "none", action: "Not in the pipeline", also: [], stage: null };
  const key = t.key;
  const jobs = parts.jobs ?? listJobs({ key });
  const findings = parts.findings ?? listFindings(key);
  // Round 12: a voided run is evidence of nothing; it never counts as the latest run.
  const runs = (parts.runs ?? listRuns(key)).filter(r => !isRunVoided(key, r.runId));
  const allQuestions = parts.questions ?? openQuestions(key, { ticket: t });
  // Round 15: questions for the BA / developer are forwarded, not answered by him.
  const questions = allQuestions.filter(q => (q.for ?? "faizuddin") === "faizuddin");
  const teamQuestions = allQuestions.filter(q => (q.for ?? "faizuddin") !== "faizuddin");
  const brief = parts.brief ?? readBrief(key);
  const out = (who, waitingOn, action) => ({ who, waitingOn, action, also: [], stage: t.stage });
  // Past the "active jobs" check nothing is running, so a step that is normally
  // automatic has stalled: it waits on Faizuddin to restart it.
  const stalled = (character, action) => ({ ...out("faizuddin", "faizuddin", action), character });

  const chars = t.characters ?? {};
  const waiting = ORDER.filter(c => chars[c]?.state === "waiting");
  const errored = ORDER.filter(c => chars[c]?.state === "error");
  // The Sage learns in the background; it never blocks the next step.
  const running = jobs.filter(j => j.state === "queued" || j.state === "running");
  const active = running.filter(j => j.character !== "sage");
  const also = [];
  for (const c of waiting.slice(1)) also.push(`${NAME[c]} is waiting for you: ${short(chars[c].note, 120) || "see its chat"}`);
  for (const c of errored) also.push(`${NAME[c]} stopped with an error: ${short(chars[c].note, 120) || "see its chat"}`);

  if (running.length > active.length) also.push("Sage is learning from this ticket in the background");
  // Night round 9: questions asked earlier and never answered (a later job reset the character's state).
  // The waiting note is the first question with ** removed (prompts-common firstQuestion), so compare plain text.
  const shownNote = c => (chars[c]?.state === "waiting" ? short(plain(chars[c].note), 60) : "");
  const unseen = questions.filter(q => !(shownNote(q.character) && short(plain(q.question), 60) === shownNote(q.character)));
  if (unseen.length) also.push(`${unseen.length} unanswered question(s) in the chats (${[...new Set(unseen.map(q => NAME[q.character]))].join(", ")}); oldest: ${short(plain(unseen[0].question), 100)}`);
  // Round 17: questions he parked for a later step (shown to the named character's next job).
  const parked = parts.parked ?? deferredQuestions(key);
  if (parked.length) also.push(`${parked.length} parked question(s) waiting for ${[...new Set(parked.flatMap(d => (d.to.length ? d.to : ["elf", "dwarf"]).map(c => NAME[c])))].join(" / ")}'s next step`);
  if (teamQuestions.length) also.push(`${teamQuestions.length} question(s) to forward (${[...new Set(teamQuestions.map(q => q.for))].join(", ")}): ${short(plain(teamQuestions[0].question), 100)}`);
  const done = r => ({ ...r, also: [...also, ...r.also].slice(0, 6) });

  // 1. A question for Faizuddin blocks everything after it.
  if (waiting.length) {
    const c = waiting[0];
    return done(out("faizuddin", "faizuddin", `Answer ${NAME[c]} in its chat: ${short(chars[c].note) || "it asked you something"}`));
  }
  // Night round 9: nobody is waiting, but questions from earlier replies were never answered.
  if (questions.length && !jobs.some(j => (j.state === "queued" || j.state === "running") && j.character !== "sage")) {
    const q = questions[0];
    return done(out("faizuddin", "faizuddin", `Answer ${NAME[q.character]}'s earlier question in its chat: ${short(plain(q.question))}`));
  }
  // 2. Work in flight: wait for it.
  if (active.length) {
    const j = active[0];
    const r = out(j.character, "work", `Wait: ${NAME[j.character] ?? j.character} is on ${j.action}${j.activity ? ` (${short(j.activity, 80)})` : ""}`);
    if (active.length > 1) r.also.push(`${active.length - 1} more job(s) queued or running`);
    return done(r);
  }
  // 3. A stopped character needs a retry.
  if (errored.length) {
    const c = errored[0];
    return done(out("faizuddin", "faizuddin", `${NAME[c]} stopped with an error: ${short(chars[c].note, 120) || "see its chat"}. Retry from its chat`));
  }
  // 4. The spine: study → related history + brief → scenarios → green light → automation.
  const study = t.files?.study ?? `_reference/tickets/Studying/${key}/${key}-study.md`;
  if (!exists(study)) return done(stalled("scout", "Scout's study is missing and nothing is running: re-add the ticket or run the Scout study"));
  if (!t.files?.related || !exists(t.files.related)) return done(stalled("scribe", "Scribe's related history is missing and nothing is running: re-run Scribe's related history"));
  if (!brief?.ok) return done(stalled("scribe", `The ticket brief is incomplete (${short((brief?.missing ?? []).join("; "), 140)}): re-run Scribe's related history`));
  const scen = readJson(t.files?.scenariosJson ?? `data/pipeline/work/${key}/scenarios.json`);
  if (!Array.isArray(scen) || !scen.length) return done(out("faizuddin", "faizuddin", "Press \"Ask Elf for scenarios\" (Elf starts only when you ask)"));
  if (!t.approvedAt) {
    return done(out("faizuddin", "faizuddin", `Review Elf's ${scen.length} scenario(s) and give the green light (or tell Elf what to change)`));
  }
  const automated = scen.filter(s => !s.manual).length;
  if (!t.files?.suiteDir) {
    if (!automated) return done(out("faizuddin", "faizuddin", "All scenarios are manual: test them by hand and record the results in the official sheet"));
    return done(stalled("dwarf", `Approved, but Dwarf has not built the automation for ${automated} TS and nothing is running: approve again or ask Dwarf`));
  }
  if ((t.pendingDwarfChanges ?? []).length) return done(stalled("dwarf", `${t.pendingDwarfChanges.length} scenario change(s) wait for Dwarf's sync and nothing is running: ask Dwarf to apply them`));
  const check = t.files?.suiteCheck ? readJson(t.files.suiteCheck) : null;
  if (check && check.ok === false) {
    return done(out("faizuddin", "faizuddin", `Suite check has ${check.blocking?.length ?? "some"} problem(s): tell Dwarf what to do (see ${t.files.suiteCheck})`));
  }

  // 5. Findings: stale ones first, then decisions, then drafts, then raises.
  const allLive = findings.filter(f => f.state === "open" || f.state === "confirmed");
  const fromVoided = allLive.filter(f => voidedFor(key, f.runId, f.ts));
  const live = allLive.filter(f => !fromVoided.includes(f));
  if (fromVoided.length) also.push(`${fromVoided.length} open finding(s) come from a voided run (${fromVoided.map(f => f.ts).slice(0, 4).join(", ")}): dismiss them`);
  // Rounds 28-29: checks on what will go into a QA-Issue.
  const badQuote = live.filter(f => f.quoteCheck?.srd === false);
  if (badQuote.length) also.push(`${badQuote.length} finding(s) quote the SRD in words not found in its text copy (${badQuote.map(f => f.ts).slice(0, 4).join(", ")}): check the quote`);
  const draftNotes = live.filter(f => f.draftWarnings?.length);
  if (draftNotes.length) also.push(`${draftNotes.length} QA-Issue draft(s) have notes in Scout's chat (${draftNotes.map(f => f.ts).slice(0, 4).join(", ")})`);
  const stale = live.filter(f => f.passedSince);
  if (stale.length) also.push(`${stale.length} finding(s) passed in a newer run (${stale.map(f => f.ts).slice(0, 4).join(", ")}): re-check before raising`);
  const open = live.filter(f => f.state === "open" && !f.passedSince);
  if (open.length) return done(out("faizuddin", "faizuddin", `Review ${open.length} open finding(s) (${open.map(f => f.ts).slice(0, 4).join(", ")}): confirm or dismiss each`));
  const toDraft = live.filter(f => f.state === "confirmed" && !f.issueDraft);
  if (toDraft.length) return done(stalled("scout", `Confirmed finding(s) without Scout's QA-Issue draft (${toDraft.map(f => f.ts).slice(0, 4).join(", ")}): confirm again to redraft`));
  const toRaise = live.filter(f => f.state === "confirmed" && f.issueDraft && !f.passedSince);
  if (toRaise.length) return done(out("faizuddin", "faizuddin", `Check Scout's QA-Issue draft and press Raise for ${toRaise.map(f => f.ts).slice(0, 4).join(", ")}`));

  // 6. Runs.
  const page = t.files?.runnerPage ?? t.runKey ?? `/eauto/${key.replace(/^[A-Z][A-Z0-9]*-/, "")}`;
  if (!runs.length) return done(out("faizuddin", "faizuddin", `Run the automation from ${page} (only you start runs)`));
  const last = runs[0];
  const failed = (last.checks ?? []).filter(c => c.status && c.status !== "passed" && c.status !== "skipped");
  if (failed.length) {
    // elf:findings is queued by the run watcher when a run resolves; done = handled.
    const triaged = findings.some(f => f.runId === last.runId) || jobs.some(j => j.action === "elf:findings" && j.state === "done" && j.input?.runId === last.runId);
    if (!triaged) return done(out("faizuddin", "faizuddin", `Latest run has ${failed.length} failed check(s) and no finished findings job for it (${last.runLabel ?? last.runId}): check Elf's jobs for an error, then queue Elf's findings job for that run again (the run watcher asks only once)`));
    return done(out("faizuddin", "faizuddin", `Latest run has ${failed.length} failed check(s), all handled (findings dismissed or raised): re-run them from ${page} once fixed`));
  }
  const total = (last.checks ?? []).length;
  if (t.stage !== "done") return done(out("faizuddin", "faizuddin", `Latest run passed all ${total} check(s): update the official sheet and mark the ticket done`));
  return done(out("none", "none", "Done"));
}

/** One line: "EAINT-12345 · scenarios · YOU: Review Elf's 12 scenario(s)…" */
export function nextLine(t) {
  const n = nextStep(t);
  const who = n.waitingOn === "faizuddin" ? "YOU" : n.waitingOn === "work" ? (NAME[n.who] ?? n.who) : "-";
  return `${t.key} · ${t.stage} · ${who}: ${n.action}`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const key = process.argv[2]?.toUpperCase();
  if (key) {
    const n = nextStep(key);
    console.log(`${key} · ${n.stage ?? "-"}\nNext (${n.waitingOn === "faizuddin" ? "waiting on Faizuddin" : n.waitingOn === "work" ? `work: ${NAME[n.who] ?? n.who}` : "nothing"}): ${n.action}`);
    n.also.forEach((a, i) => console.log(`  ${i + 1}. ${a}`));
  } else {
    for (const t of listTickets()) if (!/^PIPETEST-/.test(t.key)) console.log(nextLine(t));
  }
}
