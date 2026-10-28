// Assertion guard for Dwarf's edits (2026-10-27, night enhancement round 6).
//
// Charmain's QA principle 9: "Assertions encode intent, never lowered to pass
// ... Never weaken, delete, or loosen an assertion or a locator merely to turn
// a red run green. ... A green run bought by loosening the check hides the
// defect." [charmain-repo: docs/qa-principles.md:23-30]; and 11: harness changes
// are judged by "does the test now verify the intended real behaviour?", not
// "does the test pass?" [charmain-repo: docs/qa-principles.md:40-56].
//
// Before a Dwarf job edits a pipeline-built suite, snapshotAssertions() records
// every assertion line per test (spec files) or per file (helpers). After the
// job, compareAssertions() lists assertions that disappeared from a test that
// still exists, that moved to a looser matcher, or new softeners
// (expect.soft, .catch on an expect, test.skip/fixme). Purely mechanical; the
// result goes to Dwarf's chat, and an unasked loosening waits for Faizuddin.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const SKIP_DIRS = new Set(["node_modules", "test-results", "playwright-report", ".cache", "blob-report", "evidence", "runs"]);
const CODE_RE = /\.(ts|mts|mjs|js|cjs)$/;

function walk(absDir, out = []) {
  let entries;
  try { entries = fs.readdirSync(absDir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    if (e.name.startsWith(".")) continue;
    const p = path.join(absDir, e.name);
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) walk(p, out); }
    else if (CODE_RE.test(e.name) && !e.name.endsWith(".d.ts")) out.push(p);
  }
  return out;
}

const rel = abs => path.relative(ROOT, abs).split(path.sep).join("/");
const isComment = line => /^\s*(\/\/|\*|\/\*)/.test(line);
const norm = line => line.trim().replace(/\s+/g, " ").replace(/;$/, "");

const ASSERT_RE = /\bexpect(\.soft)?\s*\(|\btest\.(skip|fixme)\s*\(/;
const TEST_RE = /\btest(?:\.only)?\s*\(\s*(["'`])((?:\\.|(?!\1).)*)\1/;

/** Strictness of a matcher: 3 exact, 2 partial, 1 presence only, 0 unknown. */
const RANK = [
  [3, /\.(not\.)?(toHaveText|toBe|toEqual|toStrictEqual|toHaveValue|toHaveCount|toHaveURL|toHaveTitle|toBeChecked|toBeDisabled|toBeEnabled|toHaveLength)\s*\(/],
  [2, /\.(not\.)?(toContainText|toMatch|toContain|toHaveAttribute|toMatchObject|toBeGreaterThan|toBeLessThan|toHaveClass)\s*\(/],
  [1, /\.(not\.)?(toBeVisible|toBeTruthy|toBeDefined|toBeAttached|toBeFalsy|toBeNull|toBeUndefined|toBeHidden|toBeGreaterThanOrEqual)\s*\(/],
];
const rankOf = line => RANK.find(([, re]) => re.test(line))?.[0] ?? 0;
/** The thing asserted on: the text inside expect( ... ) up to the matcher. */
const subjectOf = line => line.match(/expect(?:\.soft)?\s*\((.*?)\)\s*\.(?:not\.)?to[A-Z]/)?.[1]?.replace(/\s+/g, "") ?? null;

/**
 * Assertion lines of the suite: { "<file>": { "<test title or (file)>": [lines] } }.
 * `dirs` are repo-relative (the ticket's own suite folder).
 */
export function snapshotAssertions(dirs) {
  const out = {};
  for (const d of dirs) {
    for (const abs of walk(path.join(ROOT, d))) {
      let text;
      try { text = fs.readFileSync(abs, "utf8"); } catch { continue; }
      let current = "(file)";
      const groups = {};
      for (const raw of text.split(/\r?\n/)) {
        if (isComment(raw)) continue;
        const t = raw.match(TEST_RE);
        if (t && !/\btest\.(skip|fixme|describe|step|beforeEach|afterEach|beforeAll|afterAll)\b/.test(raw)) current = t[2];
        if (ASSERT_RE.test(raw)) (groups[current] ??= []).push(norm(raw));
      }
      if (Object.keys(groups).length) out[rel(abs)] = groups;
    }
  }
  return out;
}

const countMap = list => list.reduce((m, l) => m.set(l, (m.get(l) ?? 0) + 1), new Map());

/**
 * Differences that loosen the suite. Returns [{ kind, file, test, line, now? }]:
 * kind "removed" (an assertion gone from a test/file that still exists, not
 * moved elsewhere), "weakened" (same subject, looser matcher), "softened"
 * (new expect.soft / .catch on an expect / test.skip / test.fixme).
 */
export function compareAssertions(before, after) {
  const issues = [];
  const allAfter = countMap(Object.values(after).flatMap(g => Object.values(g).flat()));
  const allBefore = countMap(Object.values(before).flatMap(g => Object.values(g).flat()));
  for (const [file, groups] of Object.entries(before)) {
    for (const [test, lines] of Object.entries(groups)) {
      const nowLines = after[file]?.[test];
      if (!nowLines) continue; // the test or file is gone: a TS change, judged by the suite check's title trace
      const now = countMap(nowLines);
      const added = nowLines.filter(l => !lines.includes(l));
      for (const l of lines) {
        if ((now.get(l) ?? 0) > 0) { now.set(l, now.get(l) - 1); continue; }
        if ((allAfter.get(l) ?? 0) > (allBefore.get(l) ?? 0) - 1) continue; // moved to another test/helper
        const subj = subjectOf(l);
        const twin = subj ? added.find(a => subjectOf(a) === subj) : null;
        if (twin) {
          if (rankOf(twin) < rankOf(l)) issues.push({ kind: "weakened", file, test, line: l, now: twin });
          continue; // same subject, same or stricter matcher: an updated expected value, not a loosening
        }
        issues.push({ kind: "removed", file, test, line: l });
      }
    }
  }
  for (const [file, groups] of Object.entries(after)) {
    for (const [test, lines] of Object.entries(groups)) {
      const was = new Set(before[file]?.[test] ?? []);
      for (const l of lines) {
        if (was.has(l) || (allBefore.get(l) ?? 0) > 0) continue;
        if (/\bexpect\.soft\s*\(/.test(l) || (/\bexpect\s*\(/.test(l) && /\.catch\s*\(/.test(l)) || /\btest\.(skip|fixme)\s*\(/.test(l)) {
          issues.push({ kind: "softened", file, test, line: l });
        }
      }
    }
  }
  return issues;
}

const WHAT = { removed: "assertion removed", weakened: "looser matcher", softened: "softened (soft / catch / skip)" };

/** Numbered lines for a chat note. */
export function guardSummary(issues, max = 15) {
  const lines = issues.slice(0, max).map((x, i) =>
    `${i + 1}. **${WHAT[x.kind]}** — ${x.file}${x.test !== "(file)" ? ` · "${x.test.slice(0, 80)}"` : ""}: \`${x.line.slice(0, 140)}\`${x.now ? ` → \`${x.now.slice(0, 140)}\`` : ""}`);
  if (issues.length > max) lines.push(`${max + 1}. … and ${issues.length - max} more`);
  return lines.join("\n");
}
