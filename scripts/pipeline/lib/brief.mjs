// Ticket brief (Faizuddin, 2026-10-27, verbatim): "update the flow for the
// pipeline, for every ticket, need to make sure to provide these 3 main items:
// high level scope, estimated tseting time (mandays) and the modules/pages
// affected/need to cover".
//
// Scribe writes data/pipeline/work/<KEY>/brief.json together with the related
// history (scribe:related). This module holds the schema text for prompts, the
// validator used by finish() and the API, and the prompt blocks for Elf and
// the chat continuations. Design: scripts/pipeline/README.md §1 item 2a.

import fs from "node:fs";
import { repoPath } from "../store.mjs";

export const briefRel = key => `data/pipeline/work/${key}/brief.json`;

/** The exact JSON shape, for prompts. */
export function briefSchemaText(key) {
  return `{
  "key": "${key}",
  "updatedAt": "<ISO date-time you wrote it>",
  "scope": ["<3-8 short lines: what will be tested, in plain words>"],
  "testingScope": {
    "mode": "Manual" | "Automation" | "Manual + Automation",
    "outline": [
      { "text": "**Changes**: <what the ticket changes, one line>" },
      { "text": "**User Type**: <e.g. Main & Sub UCD>" },
      { "text": "**Modules Affected**:", "numbered": true, "children": [
        { "text": "**<module>** - <page/step> <expected result>" }
      ] },
      { "text": "**<dimension, e.g. Business Type / Payment Type / Browser>**:", "children": [
        { "text": "**<value>**: <expected result>", "children": [ { "text": "<sub-value>" } ] }
      ] },
      { "text": "**Functional**:", "children": [ { "text": "[<button>] --> <what happens>" } ] },
      { "text": "**Test Scenarios**:", "children": [
        { "text": "<scenario>", "children": [ { "text": "<variant> = <result>" } ] }
      ] }
    ]
  },
  "estimate": {
    "mandays": <number > 0, your best single figure = base + buffer>,
    "base": <base testing time in days>,
    "buffer": <buffer days for requirement change + bug fix + retest bug>,
    "qaCount": <number of QA, normally 1>,
    "range": [<min>, <max>],
    "confidence": "high" | "medium" | "low",
    "basis": "<one or two lines: comparable tickets, TS count, why>",
    "official": { "miro": "<verbatim Miro Est. mandays + where>", "jira": "<verbatim [QA] Est Man-day (cf 10081) + where>" }
  },
  "modules": [
    { "module": "<module name>", "portal": "<UCD | BO | CIBO | Service Portal | ...>", "pages": ["<page or screen>"], "why": "<changed by the ticket, or needs regression because ...>" }
  ],
  "sources": ["<file path / Jira field / Miro frame you took this from>"]
}`;
}

/** Prompt block: how Scribe writes brief.json in scribe:related. */
export function briefTaskText(key) {
  return `Ticket brief (Faizuddin, 2026-10-27: every ticket must give "high level scope, estimated tseting time (mandays) and the modules/pages affected/need to cover"):
Write ${briefRel(key)} as JSON, exactly this shape (no comments, no extra wrapping):
${briefSchemaText(key)}
Rules:
1. **scope**: 3 to 8 short lines, plain words, what QA will test (not the developer's design).
2. **estimate**: the same figures as your "## Estimated testing effort" section (mandays inside range, range[0] <= range[1]). "official" holds ONLY figures quoted verbatim from the Scout study / Jira capture / Miro (with where); leave out a key that has no figure, and leave out "official" when there is none.
3. **modules**: every module and page the ticket changes AND every page that needs regression coverage, from the SRD, the Scout study and the related history. One object per module; "pages" lists each page/screen by the name the portal shows.
4. **sources**: the files and fields you used.
5. **testingScope** (Faizuddin, 2026-10-28: the testing scope must look like the team's Miro cards, _reference/pipeline/miro-testing-scope-format-2026-10-28.png): a nested outline, short phrases, no sentences. Label each line in bold, then a colon and the expected result ("**Firefox**: should show the popup"; "**STMS** - step 6 show popup"). Pick the dimensions that fit the ticket: Changes, User Type, Modules Affected (numbered, module - page/step - expected), the variations that matter (Browser, Business Type, Payment Type with banks/cards, ...), Functional (buttons and what they do), Test Scenarios (e.g. New Transaction > Payment = OK / Payment = Failed). Leave out a dimension that does not apply. "mode" says Manual, Automation or Manual + Automation.
6. **estimate.base / buffer / qaCount**: the Miro "Est. Testing Mandays: N days (1 QA)" split into "Base Testing Time" and "Buffer (Req Change + Bug Fix + Retest Bug)"; base + buffer = mandays.
7. All three items (scope, estimate, modules) must be filled. If something is not known, give your best figure from the evidence and say [unconfirmed] in "basis" or "why"; never leave an item empty.`;
}

/** Prompt note for chat continuations (Scout / Scribe): keep the brief in step. */
export function briefChatNote(key) {
  return `Ticket brief: ${briefRel(key)} (scope, estimate in man-days, modules/pages to cover). If this message changes the scope, the estimate or the modules/pages, update that JSON too (same shape, change only what is affected, set "updatedAt", add the new source to "sources"). Leave it alone otherwise.`;
}

const isText = v => typeof v === "string" && v.trim().length > 0;
const isNum = v => typeof v === "number" && Number.isFinite(v);

/**
 * Checks a parsed brief. Returns { ok, missing } where `missing` lists, in
 * plain words, every part that is absent or wrong.
 */
export function checkBrief(b, key) {
  const missing = [];
  if (!b || typeof b !== "object" || Array.isArray(b)) return { ok: false, missing: ["the file is not a JSON object"] };
  if (key && b.key !== key) missing.push(`"key" must be "${key}"`);

  const scope = Array.isArray(b.scope) ? b.scope.filter(isText) : [];
  if (!scope.length) missing.push("high-level scope (\"scope\": 3-8 short lines)");
  else if (Array.isArray(b.scope) && scope.length !== b.scope.length) missing.push("\"scope\" has empty or non-text lines");

  const e = b.estimate;
  if (!e || typeof e !== "object") missing.push("estimated testing time (\"estimate\" object)");
  else {
    if (!isNum(e.mandays) || e.mandays <= 0) missing.push("\"estimate.mandays\" (a number above 0)");
    if (!Array.isArray(e.range) || e.range.length !== 2 || !e.range.every(isNum) || e.range[0] <= 0 || e.range[0] > e.range[1]) {
      missing.push("\"estimate.range\" ([min, max], both above 0, min <= max)");
    }
    if (!["high", "medium", "low"].includes(e.confidence)) missing.push("\"estimate.confidence\" (high | medium | low)");
    if (!isText(e.basis)) missing.push("\"estimate.basis\" (why this figure)");
    if (e.official !== undefined && (typeof e.official !== "object" || e.official === null || Array.isArray(e.official))) missing.push("\"estimate.official\" must be an object { miro?, jira? }");
  }

  if (!Array.isArray(b.modules) || !b.modules.length) missing.push("modules/pages to cover (\"modules\": at least one)");
  else {
    b.modules.forEach((m, i) => {
      const n = `modules[${i}]${m && isText(m.module) ? ` (${m.module})` : ""}`;
      if (!m || typeof m !== "object") { missing.push(`${n} is not an object`); return; }
      if (!isText(m.module)) missing.push(`${n}: "module" name`);
      if (!isText(m.portal)) missing.push(`${n}: "portal"`);
      if (!Array.isArray(m.pages) || !m.pages.filter(isText).length) missing.push(`${n}: "pages" (at least one page)`);
      if (!isText(m.why)) missing.push(`${n}: "why"`);
    });
  }

  // Miro-style testing scope (2026-10-28). Briefs written before it have none and
  // still pass; the ticket page then builds the outline from scope + modules.
  if (b.testingScope !== undefined) {
    const ts = b.testingScope;
    const badNode = n => !n || typeof n !== "object" || !isText(n.text) || (n.children !== undefined && (!Array.isArray(n.children) || n.children.some(badNode)));
    if (!ts || typeof ts !== "object" || !Array.isArray(ts.outline) || !ts.outline.length) missing.push("\"testingScope.outline\" (at least one line)");
    else if (ts.outline.some(badNode)) missing.push("\"testingScope.outline\": every line needs \"text\", and \"children\" must be a list of lines");
  }
  if (b.estimate && typeof b.estimate === "object") {
    const { base, buffer, mandays } = b.estimate;
    if ((base !== undefined && !isNum(base)) || (buffer !== undefined && !isNum(buffer))) missing.push("\"estimate.base\" / \"estimate.buffer\" must be numbers");
    else if (isNum(base) && isNum(buffer) && isNum(mandays) && Math.abs(base + buffer - mandays) > 0.01) missing.push(`"estimate.base" + "estimate.buffer" (${base} + ${buffer}) must equal "estimate.mandays" (${mandays})`);
  }

  if (!Array.isArray(b.sources)) missing.push("\"sources\" (list of files/fields used)");
  return { ok: !missing.length, missing };
}

/**
 * Reads and checks data/pipeline/work/<KEY>/brief.json.
 * Returns { rel, exists, brief (parsed or null), ok, missing }.
 */
export function readBrief(key) {
  const rel = briefRel(key);
  let raw;
  try { raw = fs.readFileSync(repoPath(rel), "utf8"); } catch { return { rel, exists: false, brief: null, ok: false, missing: ["brief.json was not written"] }; }
  let brief;
  try { brief = JSON.parse(raw.replace(/^﻿/, "")); } catch (e) { return { rel, exists: true, brief: null, ok: false, missing: [`brief.json does not parse (${String(e.message ?? e).slice(0, 120)})`] }; }
  const c = checkBrief(brief, key);
  return { rel, exists: true, brief, ...c };
}

/** Sets ticket.files.brief when the brief is complete. Returns the readBrief() result. */
export function linkBrief(store, key) {
  const r = readBrief(key);
  if (r.ok) {
    const t = store.readTicket(key);
    if (t && t.files?.brief !== r.rel) store.updateTicket(key, x => { x.files = { ...x.files, brief: r.rel }; });
  }
  return r;
}

/** Prompt block for Elf (elf:plan / elf:chat): cover every module/page of the brief. */
export function briefCoverageBlock(key) {
  const r = readBrief(key);
  if (!r.brief) {
    return `Ticket brief: ${briefRel(key)} is not written yet (${r.missing.join("; ")}). Use the Scout study and the related history for the modules/pages, and say in your final message that the brief was missing.`;
  }
  const mods = Array.isArray(r.brief.modules) ? r.brief.modules : [];
  const lines = mods.flatMap((m, i) => {
    const pages = Array.isArray(m?.pages) ? m.pages.filter(isText) : [];
    return [`${i + 1}. ${m?.module ?? "?"} (${m?.portal ?? "?"}): ${pages.join("; ") || "(no pages listed)"}${m?.why ? ` — ${m.why}` : ""}`];
  });
  const flat = (nodes, depth) => (Array.isArray(nodes) ? nodes : []).flatMap(n => [`${"  ".repeat(depth)}- ${n?.text ?? ""}`, ...flat(n?.children, depth + 1)]);
  const outline = flat(r.brief.testingScope?.outline, 0);
  return `Ticket brief (Scribe, ${briefRel(key)}${r.ok ? "" : `, incomplete: ${r.missing.join("; ")}`}) — read it. Modules / pages the scenarios MUST cover:
${lines.join("\n") || "1. (none listed)"}${outline.length ? `\nTesting scope (${r.brief.testingScope?.mode ?? "mode not given"}) — every variation and scenario below needs a TS, or a "no TS: <why>" line in the coverage section:\n${outline.join("\n")}` : ""}
Coverage rule: every page above is covered by at least one TS, or explained. In scenarios.md add a section "## Coverage of the ticket brief" (before "## Open points") with one numbered line per page: "<module> / <page> -> <TS ids>", or "<module> / <page> -> no TS: <why>" (e.g. passed through only, manual only, out of scope per the SRD). Say the same in one line in your final message.`;
}
