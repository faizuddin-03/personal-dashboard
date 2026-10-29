/**
 * WHICH TRIGGER POINTS THE RECORDER CAN ACTUALLY REACH.
 *
 * A ceiling counts every point a scenario DECLARES. Nothing counted whether a
 * branch exists to reach one — so a row could sit permanently at 15/16 with the
 * board reading SHORT, as though a re-record would fix it, when the missing point
 * had no code behind it at all. The coverage board learned to say so on 27-08-2026
 * (43 of 60 scenarios were in that state and it said nothing).
 *
 * Extracted into its own module 29-08-2026, when UNRECORDED was emptied. Eight rows
 * gained a checklist that day and 21 of their points had no branch yet, which made
 * the same fact URGENT rather than merely informative: without a guard, `TS=TS18 npm
 * run evidence` would have opened a browser, walked the whole CORE flow, and written
 * a sidecar reading 16/24 — an hour of the operator's screen spent proving something
 * the rig could have said before it started.
 *
 * READ FROM THE RECORDER, NEVER KEPT AS A LIST. A hand-kept copy of a derived fact
 * is the drift this rig keeps hitting; a hand-kept copy of THIS one would go stale in
 * the direction that hurts — claiming a branch exists — because nobody removes a name
 * from a list when they delete the code under it.
 */
const fs = require('node:fs');
const path = require('node:path');

const SPEC = path.resolve(__dirname, '..', 'tests', '90-evidence.spec.js');

/**
 * Every point key the recorder has a way of reaching.
 *
 * FOUR guard styles are matched, because all four are in use:
 *   tick(spot, 'k')     the point is ticked directly
 *   wants('k')          a leg gated on the scenario declaring the point
 *   p.key === 'k'       a leg that filters the checklist itself
 *   { key: 'k', ... }   a leg driven from a table of columns — the export leg's
 *                       `export-before` / `export-expiry` / `sweep-export`
 *
 * THE FOURTH ONE WAS MISSING FOR ABOUT TEN MINUTES ON 29-08-2026 AND IT MATTERED.
 * The board only ever asked this question of a scenario's EXTRA points, so three
 * CORE keys ticked from a column table had never been looked for. The moment the
 * recorder started asking about the WHOLE checklist, every scenario in the register
 * reported three undriven points — and the new pre-flight would have thrown on the
 * next take of a batch that was recording at the time.
 *
 * The lesson is the one this rig keeps paying for: a check that has only ever been
 * run over a subset is not a check that passes, and widening its scope is a change
 * to the check itself. Add a guard style here the same day one is invented.
 */
function drivenKeys(specFile = SPEC) {
  let src = '';
  try { src = fs.readFileSync(specFile, 'utf8'); } catch { return null; }
  const keys = new Set();
  for (const m of src.matchAll(/(?:tick|filmAuditRow)\s*\(\s*spot\s*,\s*'([^']+)'/g)) keys.add(m[1]);
  for (const m of src.matchAll(/wants\('([^']+)'\)/g)) keys.add(m[1]);
  for (const m of src.matchAll(/p\.key === '([^']+)'/g)) keys.add(m[1]);
  for (const m of src.matchAll(/\bkey:\s*'([^']+)'/g)) keys.add(m[1]);
  return keys;
}

/**
 * The points this scenario declares that the recorder cannot reach.
 *
 * Checks the WHOLE checklist, not just the scenario's EXTRA. The board asks only
 * about EXTRA because CORE is driven by definition — which is true today and is an
 * assumption, and this is the caller that pays for it being wrong.
 *
 * `already` is the escape hatch the board uses: a point some real take has already
 * captured is drivable whatever the grep says, because the evidence outranks it.
 */
function undrivenFor(ref, { tp = require('./triggerPoints'), already = new Set(), specFile = SPEC, arm } = {}) {
  const keys = drivenKeys(specFile);
  if (!keys) return [];
  // `arm` matters because one row's checklist DEPENDS on it (SWEPT_ARMS): asking
  // this question against the other arm's list would clear a take for points it is
  // not going to film, and refuse it for points it never declared.
  return tp.pointsFor(ref, { arm })
    .map((p) => p.key)
    .filter((k) => !keys.has(k) && !already.has(k));
}

module.exports = { drivenKeys, undrivenFor, SPEC };
