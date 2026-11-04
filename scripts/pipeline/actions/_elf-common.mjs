// Shared parts of Elf's scenario jobs (elf:plan, elf:chat), 2026-10-27.

import fs from "node:fs";
import path from "node:path";
import { digitsOf, findOfficialTs, exists } from "../prompts-common.mjs";
import { xlsxToMarkdown, mirrorFresh } from "../lib/xlsx-text.mjs";
import { lintScenarios, lintSummary } from "../lib/scenario-review.mjs";

export const workDir = key => `data/pipeline/work/${key}`;
export const scenariosMdRel = key => `${workDir(key)}/scenarios.md`;
export const scenariosJsonRel = key => `${workDir(key)}/scenarios.json`;
export const officialTextRel = key => `${workDir(key)}/official-ts.md`;

/**
 * Finds this ticket's official TS in the synced QA Team folder and keeps a
 * text copy under data/pipeline/work/<KEY>/ for Elf. Read only: the official
 * workbook itself is never written here.
 */
export async function prepareOfficial(ctx) {
  const { ticket, store, dry } = ctx;
  const abs = ticket.files?.officialTs && fs.existsSync(ticket.files.officialTs)
    ? ticket.files.officialTs
    : findOfficialTs(store.setupInfo().sharepointDir, ticket.key);
  if (!abs) return null;
  const textRel = officialTextRel(ticket.key);
  if (!dry) {
    if (!mirrorFresh(abs, store.repoPath(textRel))) {
      try { await xlsxToMarkdown(abs, store.repoPath(textRel)); } catch (e) { return { abs, textRel: null, error: String(e.message ?? e) }; }
    }
    if (ticket.files?.officialTs !== abs) store.updateTicket(ticket.key, t => { t.files = { ...t.files, officialTs: abs }; });
  }
  return { abs, textRel };
}

export function officialBlock(official) {
  if (!official) return "Official TS: none exists yet in the QA Team folder, so write the scenarios in house style.";
  return `Official TS: it EXISTS in the QA Team folder — "${official.abs}"${official.textRel ? ` (text copy: ${official.textRel})` : ` (could not convert: ${official.error})`}.
Read it FIRST and work FROM it: the official TS wins. Keep its TS ids and titles. Put extra scenarios you suggest in the official sheet's own columns and layout (so rows copy-paste in), marked "Suggestion by Claude". Say at the top of scenarios.md that the list is based on the official TS.`;
}

export function scenarioFormat(key) {
  const d = digitsOf(key);
  return `Files you write (both, always in step):
1. ${scenariosMdRel(key)} — the reviewable list for Faizuddin. Layout:
   1. Title line "# ${key} — scenarios" then one short line on the basis (official TS / study / related history).
   2. One "## <letter>. <section>" heading per section (A., B., ...).
   3. Under it, one numbered line per TS: "**${d}_TS01** — <title>". Under each TS, short indented numbered sub-lists or lines: **Objective** (one "Verify ..." sentence), **Steps** (short verb-first lines), **Expected** ("<Screen> -> <What is seen>", only what the ticket changes), **Source** (one short line: where the expected results come from), **Priority** (P1 / P2 / P3; grade with the "How to grade P1 / P2 / P3" rule in .claude/skills/draft-TS-excel/SKILL.md: P1 = the change itself in one attempt, P2 = recovery / invalid input / cancel / secondary paths, P3 = stress and rare edges).
   4. Manual-only TS (e.g. Wholesale) say "(manual)" after the title.
   5. Then "## Coverage of the ticket brief": one numbered line per module/page of the ticket brief, "<module> / <page> -> <TS ids>" or "-> no TS: <why>".
   6. Then "## Self-review" (max 6 short numbered lines: coverage dimensions left out and why, see the self-review rules).
   7. "## Regression gaps" (R1, R2 …) only if unchanged behaviour could break because of this change (see the self-review rules).
   8. End with "## Open points" (numbered) only if something is not known.
2. ${scenariosJsonRel(key)} — a JSON array, one object per TS, same order:
   {"id":"${d}_TS01","section":"A. <section>","title":"<one line>","objective":"Verify ...","steps":["..."],"expected":["..."],"basis":"<source of the expected results: SRD v<n> §<section> / REQ id, Jira field or comment (author, date), official TS row, mock-up, or his answer (date)>","priority":"P1 | P2 | P3","manual":false,"notes":"optional"}
   Ids are "${d}_TS" + two digits, unique, sequential from 01 with no gaps. If Faizuddin asks for sub-section prefixes, ids are "${d}_<XX>_TS" + two digits (XX = 2-4 capital letters, one per section), numbered from 01 per prefix with no gaps. Titles are one line, plain characters only (letters, digits, spaces and _ - : / ( ) . , & ' + #) because Dwarf uses "<id>: <title>" as the Playwright test title. In-cell marks (**, ++, !!) are allowed in steps/expected only.`;
}

/** Validates scenarios.json. Returns { ok, errors, scenarios }. */
export function validateScenarios(abs, key) {
  const errors = [];
  let list;
  try { list = JSON.parse(fs.readFileSync(abs, "utf8")); } catch (e) { return { ok: false, errors: [`scenarios.json does not parse: ${e.message}`] }; }
  if (!Array.isArray(list) || !list.length) return { ok: false, errors: ["scenarios.json must be a non-empty array"] };
  const d = digitsOf(key);
  const seen = new Set();
  const SAFE_TITLE = /^[A-Za-z0-9 _\-:/().,&'+#]{1,200}$/;
  // Ids are <digits>_TS<NN> in one running sequence, or <digits>_<XX>_TS<NN> where XX is the
  // sub-section short form and the count restarts per prefix (Faizuddin, EAINT-9805, 2026-10-29:
  // "use 9805_XX_TS01 (the xx is short form of what part or sub-section it is)").
  const ID = /^(\d+)(?:_([A-Z]{2,4}))?_TS(\d{2,})$/;
  const count = {}, prefixOfSection = {};
  list.forEach((s, i) => {
    if (!s || typeof s !== "object") { errors.push(`Item ${i + 1} is not an object`); return; }
    const m = typeof s.id === "string" ? ID.exec(s.id) : null;
    const prefix = m?.[2] ?? "";
    const n = (count[prefix] = (count[prefix] ?? 0) + 1);
    const want = `${d}${prefix ? `_${prefix}` : ""}_TS${String(n).padStart(2, "0")}`;
    if (!m) errors.push(`Item ${i + 1}: id "${s.id}" must look like ${d}_TS01 or ${d}_XX_TS01`);
    else if (seen.has(s.id)) errors.push(`Duplicate id ${s.id}`);
    else if (s.id !== want) errors.push(`Item ${i + 1}: id ${s.id} is out of sequence (expected ${want})`);
    else if (typeof s.section === "string" && prefix) {
      if (prefixOfSection[s.section] && prefixOfSection[s.section] !== prefix) errors.push(`${s.id}: section "${s.section}" mixes prefixes ${prefixOfSection[s.section]} and ${prefix}`);
      prefixOfSection[s.section] ??= prefix;
    }
    seen.add(s.id);
    if (typeof s.title !== "string" || !s.title.trim() || /\n/.test(s.title)) errors.push(`${s.id}: title must be one line`);
    else if (!SAFE_TITLE.test(`${s.id}: ${s.title}`)) errors.push(`${s.id}: title has characters the runner cannot use`);
    if (typeof s.section !== "string" || !s.section.trim()) errors.push(`${s.id}: section missing`);
    if (typeof s.objective !== "string") errors.push(`${s.id}: objective missing`);
    if (!Array.isArray(s.steps)) errors.push(`${s.id}: steps must be a list`);
    if (!Array.isArray(s.expected)) errors.push(`${s.id}: expected must be a list`);
    // Round 24: optional; older lists have none.
    if (s.priority != null && !/^P[123]$/.test(String(s.priority))) errors.push(`${s.id}: priority must be "P1", "P2" or "P3"`);
  });
  return { ok: !errors.length, errors, scenarios: list };
}

function readList(abs) {
  try { const v = JSON.parse(fs.readFileSync(abs, "utf8")); return Array.isArray(v) ? v : []; } catch { return []; }
}

/** Short plain change note between two scenario lists (ids added/removed/changed). */
export function diffNote(beforeList, afterList) {
  const b = new Map(beforeList.map(s => [s.id, s]));
  const a = new Map(afterList.map(s => [s.id, s]));
  const added = [...a.keys()].filter(k => !b.has(k));
  const removed = [...b.keys()].filter(k => !a.has(k));
  const changed = [...a.keys()].filter(k => b.has(k) && JSON.stringify(a.get(k)) !== JSON.stringify(b.get(k)));
  const parts = [];
  if (added.length) parts.push(`added ${added.map(k => `${k} "${a.get(k).title}"`).join(", ")}`);
  if (removed.length) parts.push(`removed ${removed.join(", ")}`);
  if (changed.length) parts.push(`changed ${changed.map(k => b.get(k).title !== a.get(k).title ? `${k} (title now "${a.get(k).title}")` : k).join(", ")}`);
  return parts.length ? `${new Date().toLocaleString("en-MY")}: Elf ${parts.join("; ")}` : null;
}

/** Snapshot taken before Elf runs, so finish() can tell what this job changed. */
export function snapshot(ctx) {
  const abs = ctx.store.repoPath(scenariosJsonRel(ctx.ticket.key));
  ctx.state.beforeHash = ctx.store.hashFile(abs);
  ctx.state.beforeList = readList(abs);
}

/** Shared finish for elf:plan and elf:chat. */
export async function finishScenarios(ctx, { ok, text }, { askedForReview }) {
  const { store, job } = ctx;
  if (!ok) return;
  const key = job.key;
  const mdRel = scenariosMdRel(key), jsonRel = scenariosJsonRel(key);
  const jsonAbs = store.repoPath(jsonRel);
  if (!fs.existsSync(jsonAbs)) {
    // Elf may stop to ask another character first (```ask block); she drafts when the answer comes back.
    if (askedForReview && !/```ask/i.test(text ?? "")) throw new Error(`Elf finished but ${jsonRel} was not written`);
    return; // a chat reply that did not touch the scenarios
  }
  const v = validateScenarios(jsonAbs, key);
  if (!v.ok) {
    store.appendChat(key, "elf", { from: "system", text: `scenarios.json has problems:\n${v.errors.slice(0, 12).map((e, i) => `${i + 1}. ${e}`).join("\n")}\n\nAsk Elf to fix them.`, jobId: job.id });
    store.updateTicket(key, t => { t.characters.elf = { ...t.characters.elf, state: "waiting", note: "scenarios.json needs fixing" }; });
    return;
  }
  const newHash = store.hashFile(jsonAbs);
  const changedNow = newHash !== ctx.state.beforeHash;
  if (changedNow) lintAfterElf(ctx, v.scenarios, { askedForReview });
  const asked = /^#{1,4}\s*Questions for Faizuddin/im.test(text ?? "");
  let queueSync = false, queueDwarf = false, wbPending = 0;
  store.updateTicket(key, t => {
    t.files = { ...t.files, scenariosJson: jsonRel, ...(exists(mdRel) ? { scenariosMd: mdRel } : {}) };
    store.raiseStage(t, "scenarios");
    if (changedNow) t.events = [{ at: store.nowIso(), text: `Elf ${askedForReview ? "drafted" : "revised"} ${v.scenarios.length} scenario(s)` }, ...(t.events ?? [])].slice(0, 100);
    if (!t.approvedAt) {
      t.characters.elf = { ...t.characters.elf, state: "waiting", note: asked ? t.characters.elf.note : "Faizuddin to review the scenarios" };
    } else if (changedNow) {
      // The TS workbook waits for "Create new version now" (2026-10-30: "dont
      // create the new excel yet"): changes pile up here and one rebuild
      // carries them all, so a chat of small fixes does not leave a pile of workbooks.
      const note = diffNote(ctx.state.beforeList ?? [], v.scenarios) ?? `${new Date().toLocaleString("en-MY")}: Elf changed scenarios.json`;
      t.pendingWorkbookChanges = [...(t.pendingWorkbookChanges ?? []), note].slice(-50);
      wbPending = t.pendingWorkbookChanges.length;
    }
    if (t.approvedAt && changedNow && newHash !== (t.dwarfScenarioHash ?? t.approvedScenarioHash)) {
      // After the green light, Dwarf must mirror every scenario change — unless
      // automation is on hold with nothing built: "Start Dwarf" later reads the
      // latest scenarios anyway (2026-10-30).
      queueSync = true;
      if (!(t.automationOnHold && !t.files?.suiteDir)) {
        const note = diffNote(ctx.state.beforeList ?? [], v.scenarios) ?? `${new Date().toLocaleString("en-MY")}: Elf changed scenarios.json`;
        t.pendingDwarfChanges = [...(t.pendingDwarfChanges ?? []), note];
        queueDwarf = true;
      }
    }
  });
  if (queueSync) {
    const queued = store.listJobs({ key, active: true }).filter(j => j.state === "queued");
    if (queueDwarf && !queued.some(j => j.action === "dwarf:sync")) store.queueJob({ key, action: "dwarf:sync" });
    if (queueDwarf) store.addEvent(key, "Scenario change sent to Dwarf");
  }
  if (wbPending) {
    store.appendChat(key, "elf", {
      from: "system",
      text: `Change applied to the scenarios. The TS workbook is **not** rebuilt yet (${wbPending} change(s) waiting). Press **Create new version now** in the Elf panel when you are done: one new workbook carries all of them.`,
      jobId: job.id,
    });
  }
}

export const relFrom = (abs, root) => path.relative(root, abs).split(path.sep).join("/");

/**
 * Scenario lint (2026-10-27, night round 2; scripts/pipeline/lib/scenario-review.mjs).
 * Only TS this job added or changed are judged. Warnings → system note in
 * Elf's chat. Before the green light, fixable ones get ONE automatic elf:chat
 * (input.lintFix, loop guard input.lintFixFor = <jobId>; never from a lint-fix
 * job itself). "no-basis" counts as fixable only for a first draft (elf:plan),
 * so older lists are not rewritten just to add sources.
 */
export function lintAfterElf(ctx, list, { askedForReview }) {
  const { store, job } = ctx;
  const key = job.key;
  const ticket = store.readTicket(key);
  const before = new Map((ctx.state.beforeList ?? []).map(s => [s.id, JSON.stringify(s)]));
  const touched = new Set(list.filter(s => before.get(s.id) !== JSON.stringify(s)).map(s => s.id));
  const { warnings: all } = lintScenarios(list, { official: !!ticket?.files?.officialTs });
  const picked = all.filter(w => w.id === "*" || touched.has(w.id));
  // Round 24: many "no priority" notes read as one line.
  const noPri = picked.filter(w => w.kind === "no-priority").map(w => w.id);
  const warnings = [
    ...picked.filter(w => w.kind !== "no-priority"),
    ...(noPri.length ? [{ id: noPri.length > 1 ? `${noPri.length} TS` : noPri[0], kind: "no-priority", text: `no priority (P1 / P2 / P3)${noPri.length > 1 ? `: ${noPri.slice(0, 12).join(", ")}${noPri.length > 12 ? " …" : ""}` : ""}`, fixable: false }] : []),
  ];
  if (!warnings.length) return { warnings };
  const fixable = warnings.filter(w => w.fixable && (w.kind !== "no-basis" || askedForReview));
  const canFix = fixable.length && !ticket?.approvedAt && !ctx.input?.lintFix
    && !store.listJobs({ key }).some(j => j.action === "elf:chat" && j.input?.lintFixFor === job.id);
  store.appendChat(key, "elf", {
    from: "system",
    text: `Scenario check: ${warnings.length} point(s) to look at:\n${lintSummary(warnings, 20)}${canFix ? "\n\nAsked Elf to fix the fixable ones." : ""}`,
    jobId: job.id,
  });
  if (canFix) {
    store.queueJob({ key, action: "elf:chat", input: { lintFix: true, lintFixFor: job.id, warnings: fixable, text: `Scenario check: ${fixable.length} point(s) to fix` } });
    store.updateTicket(key, t => {
      t.characters.elf = { ...t.characters.elf, state: "working", note: "Fixing the scenario check" };
    });
  }
  return { warnings, queued: !!canFix };
}
