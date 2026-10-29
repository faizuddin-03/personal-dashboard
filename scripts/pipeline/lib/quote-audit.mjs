// Quote audit for the characters' documents (2026-10-27, night enhancement round 30).
//
// Scout's study, Scribe's related history and Elf's scenarios.md quote their
// sources "verbatim in quotation marks with the exact location" (STYLE_RULES
// 4). A quote nobody can find in any source is either paraphrased or invented,
// and both read exactly like a real one. Charmain: "Quote an error message …
// verbatim. Never paraphrase or compose one" [charmain-repo: .claude/agents/qa-runner.md:58];
// "Every claim … is backed by a verifiable source" [charmain-repo: docs/qa-principles.md:7-9].
// This lists the quoted passages (4+ words) of a document that appear in none
// of the text sources the pipeline holds for the ticket. Advisory only.
//
// CLI: node scripts/pipeline/lib/quote-audit.mjs <KEY> <repo-relative .md file>

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normQuote } from "./quote-check.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", "..");
const TEXT_RE = /\.(md|txt|json|html?|ya?ml)$/i;

function walk(dir, out = [], depth = 3) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (depth > 0 && !e.name.startsWith(".") && e.name !== "node_modules") walk(p, out, depth - 1); }
    else if (TEXT_RE.test(e.name)) out.push(p);
  }
  return out;
}

/** Quoted passages of 4+ words: "…", “…” (never code spans). */
export function quotesOf(md) {
  const text = String(md ?? "").replace(/```[\s\S]*?```/g, " ").replace(/`[^`\n]*`/g, " ");
  const out = [];
  for (const m of text.matchAll(/"([^"\n]{12,600})"|“([^”\n]{12,600})”/g)) {
    const q = (m[1] ?? m[2]).trim();
    // Text BETWEEN two separate quotes ("a" (x) "b") starts or ends with punctuation / markup: not a quote.
    if (/^[.,;:)\]—–-]|[(\[—–]$|\*\*/.test(q) || /^[.,;:)]/.test((m[1] ?? m[2]))) continue;
    // Jira summaries ("EAINT-7066 [QA] …", "[eAuto - BO] …") come from live searches that are not saved: not checkable here.
    if (/^([A-Z][A-Z0-9]+-\d+\s|\[eAuto\b|\[QA\])/.test(q)) continue;
    if (normQuote(q).split(" ").length >= 4) out.push(q);
  }
  return [...new Set(out)];
}

/** One normalised text of every source the pipeline holds for a ticket (minus the audited file). */
export function sourceText(key, { exclude } = {}) {
  const files = [
    ...walk(path.join(ROOT, "_reference", "tickets", "Studying", key)),
    ...walk(path.join(ROOT, "_reference", "tickets", key)),
    ...walk(path.join(ROOT, "_reference", "sharepoint"), [], 3),
    ...walk(path.join(ROOT, "_reference", "teams"), [], 2),
    // Other QA repos kept for reference (e.g. Charmain's ledgers): their markdown only.
    ...walk(path.join(ROOT, "_reference", "codebases"), [], 4).filter(f => /\.(md|ya?ml)$/i.test(f)),
    ...walk(path.join(ROOT, "_reference", "miro"), [], 1),
    ...walk(path.join(ROOT, "knowledge"), [], 0),
    ...walk(path.join(ROOT, "data", "pipeline", "chats", key), [], 0),
    path.join(ROOT, "data", "pipeline", "answers.json"),
  ].filter(f => !exclude || path.resolve(f) !== path.resolve(exclude));
  const parts = [];
  for (const f of files) { try { parts.push(fs.readFileSync(f, "utf8")); } catch { /* skip */ } }
  // JSON-escaped text (chats, answers) reads like the original once unescaped.
  return normQuote(parts.join("\n").replace(/\\n/g, " ").replace(/\\"/g, "\""));
}

/**
 * { checked, unverified: [quote] } for a repo-relative markdown file of `key`.
 * A quote counts as found when each of its sentences (4+ words, "…" splits) is in a source.
 */
export function auditQuotes(key, relFile, { source } = {}) {
  const abs = path.join(ROOT, relFile);
  let md;
  try { md = fs.readFileSync(abs, "utf8"); } catch { return { checked: 0, unverified: [] }; }
  const quotes = quotesOf(md);
  if (!quotes.length) return { checked: 0, unverified: [] };
  const hay = source ?? sourceText(key, { exclude: abs });
  const unverified = quotes.filter(q => {
    const parts = q.split(/\.\.\.|…|(?<=[.;:!?])\s+/).map(normQuote).filter(p => p.split(" ").length >= 4);
    return parts.length && parts.some(p => !hay.includes(p));
  });
  return { checked: quotes.length, unverified };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [key, rel] = process.argv.slice(2);
  const r = auditQuotes(key, rel);
  console.log(`${rel}: ${r.checked} quote(s), ${r.unverified.length} not found in any source`);
  r.unverified.slice(0, 30).forEach((q, i) => console.log(`${i + 1}. "${q.slice(0, 160)}"`));
}
