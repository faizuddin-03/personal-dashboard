// Assertion plan with wrong outcomes (2026-10-27, night enhancement round 8).
//
// Charmain's assertion-plan skill: before any spec exists, each case names the
// screen, every element and text it will assert, and the WRONG outcomes it
// must reject — "each one a plausibly broken build — the pre-change behaviour,
// the neighbouring control, the other role's view. Must DIFFER from every
// expect row: identical → gate FAIL (too loose)"
// [charmain-repo: .claude/skills/assertion-plan/SKILL.md:8-11,95-113].
// Dwarf writes data/pipeline/work/<KEY>/assertion-plan.json while building or
// syncing; checkAssertionPlan() is the mechanical gate (advisory: problems go
// to Dwarf's chat, they never fail the build).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");

export const assertionPlanRel = key => `data/pipeline/work/${key}/assertion-plan.json`;

/** Prompt block for dwarf:build / dwarf:sync. */
export function assertionPlanRules(key) {
  return `Assertion plan (write it BEFORE the test code; keep it in step afterwards): ${assertionPlanRel(key)}, JSON only:
[
  { "ts": "<TS id>",
    "checks": [ { "screen": "<screen name the TS uses>", "element": "<control / column / message, in the TS's words>", "expect": "<exact text / state / count the test asserts>" } ],
    "wrongOutcomes": [ { "outcome": "<what a broken build would show>", "why": "<why it is wrong, from the TS / SRD>" } ] }
]
Rules:
1. One entry per automated TS (never for manual TS). Every assertion the test makes is a "checks" row.
2. "wrongOutcomes" (at least one per TS) are plausibly broken builds: the behaviour BEFORE this change, the neighbouring control or column, the other role's view, the old status/value. Each must differ from every "expect" in that TS.
3. Then make sure the assertions really reject each wrong outcome (exact text, not "contains"; the right row, not .first(); absent means count 0). If one cannot be rejected on screen, say so in that TS's code comment and in your final message.
4. Never assert a database row, an API body or a log: only what a user sees.`;
}

const s = v => String(v ?? "").trim();
const normText = v => s(v).toLowerCase().replace(/["'`*]/g, "").replace(/\s+/g, " ");

/**
 * Checks the plan against the automated TS ids. Returns { exists, ok, problems[], entries }.
 * `tsIds` = automated TS ids (manual ones excluded).
 */
export function checkAssertionPlan(key, tsIds) {
  const abs = path.join(ROOT, assertionPlanRel(key));
  let raw;
  try { raw = fs.readFileSync(abs, "utf8"); } catch { return { exists: false, ok: false, problems: ["assertion-plan.json was not written"], entries: 0 }; }
  let plan;
  try { plan = JSON.parse(raw.replace(/^﻿/, "")); } catch (e) { return { exists: true, ok: false, problems: [`assertion-plan.json does not parse (${String(e.message).slice(0, 100)})`], entries: 0 }; }
  if (!Array.isArray(plan)) return { exists: true, ok: false, problems: ["assertion-plan.json is not a list"], entries: 0 };
  const problems = [];
  const seen = new Set();
  for (const [i, e] of plan.entries()) {
    const ts = s(e?.ts);
    const where = ts || `entry ${i + 1}`;
    if (!ts) { problems.push(`${where}: no "ts"`); continue; }
    if (seen.has(ts)) problems.push(`${ts}: listed twice`);
    seen.add(ts);
    if (tsIds.length && !tsIds.includes(ts)) problems.push(`${ts}: not an automated TS in scenarios.json`);
    const checks = Array.isArray(e.checks) ? e.checks : [];
    const wrong = Array.isArray(e.wrongOutcomes) ? e.wrongOutcomes : [];
    if (!checks.length) problems.push(`${ts}: no checks`);
    if (checks.some(c => !s(c?.expect) || !s(c?.element))) problems.push(`${ts}: a check without "element" or "expect"`);
    if (!wrong.length) problems.push(`${ts}: no wrong outcomes (what would a broken build show?)`);
    const expects = new Set(checks.map(c => normText(c?.expect)).filter(Boolean));
    for (const w of wrong) {
      if (!s(w?.outcome)) { problems.push(`${ts}: a wrong outcome without "outcome"`); continue; }
      if (expects.has(normText(w.outcome))) problems.push(`${ts}: wrong outcome "${s(w.outcome).slice(0, 60)}" equals an expected result (too loose)`);
    }
  }
  for (const id of tsIds) if (!seen.has(id)) problems.push(`${id}: missing from the plan`);
  return { exists: true, ok: !problems.length, problems, entries: plan.length };
}
