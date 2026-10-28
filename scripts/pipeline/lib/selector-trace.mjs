// Selector trace for pipeline-built suites (2026-10-27, night enhancement round 19).
//
// Charmain's spec-reviewer rejects "A selector that cannot be traced to
// observed markup — no probe noted, no JSP file:line, not present on the live
// page" because "a class guessed from memory did not exist, and its loose
// fallback matched the whole page" [charmain-repo: .claude/agents/spec-reviewer.md:40];
// "A locator you did not observe may not be written" [charmain-repo: .claude/skills/spec-author/SKILL.md:87].
// Dwarf cannot probe a live page (only Faizuddin captures pages), so the
// observable proof here is: the id / name / visible text appears in a saved
// capture (_reference/html/**), in this ticket's HTML mock-ups or their text
// copies, or in an existing working suite. Anything else is listed (minor,
// never failing) so Dwarf marks it [unconfirmed] and asks for the capture.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const rel = abs => path.relative(ROOT, abs).split(path.sep).join("/");
const SKIP = new Set(["node_modules", "test-results", "playwright-report", ".cache", "blob-report", "evidence", "runs"]);

function walk(dir, re, out = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    if (e.name.startsWith(".")) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP.has(e.name)) walk(p, re, out); }
    else if (re.test(e.name)) out.push(p);
  }
  return out;
}

const squash = s => String(s).toLowerCase().replace(/&nbsp;|&#160;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ");

/** Everything a selector may be traced to, as one lower-case text. */
function corpus(key, suiteDir) {
  const parts = [];
  const add = f => { try { parts.push(fs.readFileSync(f, "utf8")); } catch { /* skip */ } };
  for (const f of walk(path.join(ROOT, "_reference", "html"), /\.html?$/i)) add(f);
  for (const d of [`_reference/tickets/Studying/${key}`, `_reference/tickets/${key}`]) {
    for (const f of walk(path.join(ROOT, d), /\.(html?|md)$/i)) add(f);
  }
  const own = path.join(ROOT, suiteDir);
  for (const d of fs.readdirSync(path.join(ROOT, "scripts"), { withFileTypes: true })) {
    if (!d.isDirectory() || !d.name.startsWith("eauto-")) continue;
    const abs = path.join(ROOT, "scripts", d.name);
    if (abs === own) continue;
    for (const f of walk(path.join(abs, "pages"), /\.(ts|js|mjs)$/)) add(f);
  }
  return squash(parts.join("\n"));
}

const STR = String.raw`(['"\x60])((?:\\.|(?!\1)[^\\$])*?)\1`; // a plain string literal, no ${}
const PATTERNS = [
  { kind: "css", re: new RegExp(String.raw`\.locator\(\s*` + STR, "g") },
  { kind: "text", re: new RegExp(String.raw`\.getBy(?:Text|Label|Placeholder|Title)\(\s*` + STR, "g") },
  { kind: "text", re: new RegExp(String.raw`\.getByRole\(\s*['"][a-z]+['"]\s*,\s*\{[^}]*?\bname\s*:\s*` + STR, "g") },
  { kind: "text", re: new RegExp(String.raw`\bhasText\s*:\s*` + STR, "g") },
];

/** The checkable pieces of one selector: [{ kind: "id"|"name"|"text", value }]. */
function piecesOf(kind, value) {
  if (kind === "text") return value.trim().length >= 3 ? [{ kind: "text", value: value.trim() }] : [];
  const out = [];
  for (const m of value.matchAll(/#([A-Za-z][\w-]*)/g)) out.push({ kind: "id", value: m[1] });
  for (const m of value.matchAll(/\[name\s*[*^$]?=\s*['"]?([\w.[\]-]+)['"]?\]/g)) out.push({ kind: "name", value: m[1] });
  for (const m of value.matchAll(/:(?:has-text|text-is)\(\s*['"]([^'"]{3,})['"]\s*\)/g)) out.push({ kind: "text", value: m[1] });
  const t = value.match(/^text\s*=\s*['"]?([^'"]{3,})['"]?$/);
  if (t) out.push({ kind: "text", value: t[1] });
  return out;
}

function traced(c, p) {
  const v = p.value.toLowerCase();
  if (p.kind === "id") return c.includes(`id="${v}"`) || c.includes(`id='${v}'`) || c.includes(`#${v}`) || c.includes(`id=${v}`);
  if (p.kind === "name") return c.includes(`name="${v}"`) || c.includes(`name='${v}'`) || c.includes(`name=${v}`);
  return c.includes(squash(p.value));
}

/**
 * { checked, untraced: [{ file, line, kind, value }] } for the suite's own
 * pages/ and tests/ files (files copied unchanged from another suite skipped).
 */
export function traceSelectors(key, suiteDir, { skipFiles = new Set() } = {}) {
  const files = [...walk(path.join(ROOT, suiteDir, "pages"), /\.(ts|js|mjs)$/), ...walk(path.join(ROOT, suiteDir, "tests"), /\.(ts|js|mjs)$/)]
    .filter(f => !skipFiles.has(f));
  if (!files.length) return { checked: 0, untraced: [] };
  const c = corpus(key, suiteDir);
  let checked = 0;
  const untraced = [];
  const seen = new Set();
  for (const f of files) {
    const lines = fs.readFileSync(f, "utf8").split(/\r?\n/);
    lines.forEach((line, i) => {
      if (/^\s*(\/\/|\*)/.test(line)) return;
      for (const { kind, re } of PATTERNS) {
        re.lastIndex = 0;
        for (const m of line.matchAll(re)) {
          for (const p of piecesOf(kind, m[2])) {
            const k = `${p.kind}:${p.value}`;
            if (seen.has(k)) continue;
            seen.add(k);
            checked++;
            if (!traced(c, p)) untraced.push({ file: rel(f), line: i + 1, kind: p.kind, value: p.value.slice(0, 120) });
          }
        }
      }
    });
  }
  return { checked, untraced: untraced.slice(0, 60) };
}
