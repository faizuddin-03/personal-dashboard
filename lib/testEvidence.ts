// Evidence naming for automation runs.
//
// Every artefact a run produces is named from the test-script ID carried in the
// test title, so evidence can be traced back to the script that produced it and
// attached to a ticket without renaming anything by hand.
import fs from "fs";
import path from "path";

/** Turn a test title into a filesystem-safe name (letters/digits/spaces/dashes only). */
export function sanitizeForFilename(title: string): string {
  return title.replace(/[^a-z0-9 \-]+/gi, "").replace(/\s+/g, " ").trim().slice(0, 100);
}

/**
 * Pull the test-script ID off the front of a title. Two shapes in the wild:
 *  - "SC_SCB_TS11: Book for current day" → "SC_SCB_TS11" (colon-separated,
 *    submodule segment is 1–6 letters)
 *  - "12166_67_E2E_TS01" / "12166_67_E2E_TS03 — snapshot rule: ..." →
 *    "12166_67_E2E_TS01" / "12166_67_E2E_TS03" (this ticket's own scheme —
 *    segments can be digits too, e.g. the bare "_67", and the ID may be the
 *    WHOLE title with no trailing separator at all, or followed by an
 *    em-dash rather than a colon)
 *
 * The id always ends at the first `:`, `—`, or end of string — never
 * mid-description, so a colon appearing later in a description (e.g.
 * "...snapshot rule: editing...") doesn't get swallowed into the id.
 * Numbers come from the title, never a counter, so gaps are preserved when a
 * scenario is manual-only (…TS01, TS03). Returns null for a title that
 * carries no ID at all.
 */
export function testIdFromTitle(title: string): string | null {
  return title.match(/^\s*([A-Za-z0-9]{2,}(?:_[A-Za-z0-9]{1,6})*_TS\d{1,3})(?:\s*:|\s*—|\s*$)/)?.[1] ?? null;
}

/**
 * The human half of the title, if the id is colon-separated:
 * "SC_SCB_TS11: Book for current day" → "Book for current day".
 *
 * Returns "" (no description suffix at all) when the id is followed by
 * anything other than a colon — an em-dash, or nothing (the id IS the whole
 * title) — rather than guessing at a description from free-form text after
 * it. This is what keeps this ticket's own evidence naming to a clean bare
 * id (e.g. "12166_67_E2E_TS01"), per Faizuddin's 2026-09-24 request — any
 * collision between two sub-scenarios sharing one id (e.g. TS03's two
 * variants) is handled by uniquePath()'s own "(2)"/"(3)" numbering in
 * organizeTestEvidence(), not by a synthesized description.
 */
export function scenarioNameFromTitle(title: string): string {
  const id = testIdFromTitle(title);
  if (!id) return sanitizeForFilename(title);
  const rest = title.slice(title.indexOf(id) + id.length);
  const colonMatch = rest.match(/^\s*:\s*(.+)$/);
  return colonMatch ? sanitizeForFilename(colonMatch[1]) : "";
}

/** Append " (2)", " (3)" … until the path is free, so one run never clobbers its own evidence. */
export function uniquePath(target: string, ext = ""): string {
  let candidate = `${target}${ext}`;
  for (let n = 2; fs.existsSync(candidate); n++) candidate = `${target} (${n})${ext}`;
  return candidate;
}

/**
 * Give one test's evidence its final shape:
 *
 *   <run>/SC_SCB_TS11 - Book for current day/
 *      SC_SCB_TS11.webm            ← main context recording
 *      SC_SCB_TS11 - BO.webm       ← extra cross-portal contexts, label kept
 *      SC_SCB_TS11 - failure.png
 *      SC_SCB_TS11 - trace.zip
 *
 * Playwright names the per-test folder with a truncated hash of the spec + title
 * and the files generically (video.webm, test-failed-1.png), so both the folder
 * and the files are renamed here, after the run has finished and released them.
 * Best-effort throughout: evidence naming must never break a run's results.
 */
export function organizeTestEvidence(title: string, attachments: { name?: string; path?: string }[]): void {
  const id = testIdFromTitle(title);
  const base = id ?? sanitizeForFilename(title);
  if (!base) return;

  const located = attachments.find(a => a.path && fs.existsSync(a.path));
  if (!located?.path) return;
  const testDir = path.dirname(located.path);

  const extFor: Record<string, string> = { video: ".webm", screenshot: ".png", trace: ".zip" };
  const suffixFor: Record<string, string> = { video: "", screenshot: " - failure", trace: " - trace" };

  for (const a of attachments) {
    const ext = a.name ? extFor[a.name] : undefined;
    if (!ext || !a.path || !fs.existsSync(a.path)) continue;
    const dest = uniquePath(path.join(testDir, `${base}${suffixFor[a.name!]}`), ext);
    try {
      if (path.resolve(dest) !== path.resolve(a.path)) fs.renameSync(a.path, dest);
    } catch { /* best-effort */ }
  }

  // Videos from openTrackedContext() are written straight to disk rather than
  // attached, so they aren't in `attachments`. They arrive named for their portal
  // ("BO.webm"); prefix them with the ID and keep the label.
  try {
    for (const f of fs.readdirSync(testDir)) {
      if (!f.endsWith(".webm") || f.startsWith(base)) continue;
      const label = sanitizeForFilename(path.basename(f, ".webm"));
      const dest = uniquePath(path.join(testDir, `${base}${label ? ` - ${label}` : ""}`), ".webm");
      fs.renameSync(path.join(testDir, f), dest);
    }
  } catch { /* best-effort */ }

  // Finally the folder itself: "<hash>-chromium" → "SC_SCB_TS11 - Book for current day".
  try {
    const name = scenarioNameFromTitle(title);
    const dest = uniquePath(path.join(path.dirname(testDir), `${base}${name ? ` - ${name}` : ""}`));
    if (path.resolve(dest) !== path.resolve(testDir)) fs.renameSync(testDir, dest);
  } catch { /* best-effort */ }
}
