// Verbatim-quote check for findings (2026-10-27, night enhancement round 29).
//
// A finding quotes the TS cell and the SRD rule; Faizuddin's rule is "quote
// sources verbatim … never paraphrase" (STYLE_RULES 4), and Charmain's runner
// rule is "Quote an error message … verbatim. Never paraphrase or compose one"
// [charmain-repo: .claude/agents/qa-runner.md:58]. A paraphrased quote looks
// exactly like a real one on the findings page and in the QA-Issue, so the
// check is mechanical: every sentence of the quote (3+ words) must appear in
// the source text, ignoring case, spacing, punctuation and the in-cell marks
// (**, ++, !!). An ellipsis ("…" / "...") splits a quote into parts.

import fs from "node:fs";
import path from "node:path";

/** Lower case, marks and punctuation gone, single spaces. */
export function normQuote(s) {
  return String(s ?? "")
    .replace(/\*\*|\+\+|!!/g, "")
    .replace(/[“”"'‘’`]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9%]+/g, " ")
    .trim();
}

/** Sentences of a quote worth checking (3+ words). */
function partsOf(quote) {
  return String(quote ?? "")
    .split(/\.\.\.|…|\r?\n|(?<=[.;:!?])\s+/)
    .map(normQuote)
    .filter(p => p.split(" ").length >= 3);
}

/**
 * { ok, missing[] } — ok when every part of `quote` is found in `source`.
 * An empty quote, "Nothing on this", or no checkable part counts as ok.
 */
export function quoteIn(quote, source) {
  const q = String(quote ?? "").trim();
  if (!q || /^nothing on this/i.test(q)) return { ok: true, missing: [] };
  const hay = normQuote(source);
  const missing = partsOf(q).filter(p => !hay.includes(p));
  return { ok: !missing.length, missing };
}

/** The text copy of an SRD file (<name>-text.md beside it), or "". */
export function srdText(srdFile) {
  if (!srdFile) return "";
  const abs = path.isAbsolute(srdFile) ? srdFile : path.resolve(String(srdFile));
  const base = abs.replace(/\.(pdf|docx?)$/i, "");
  for (const cand of [`${base}-text.md`, `${base}.md`]) {
    try { return fs.readFileSync(cand, "utf8"); } catch { /* next */ }
  }
  return "";
}
