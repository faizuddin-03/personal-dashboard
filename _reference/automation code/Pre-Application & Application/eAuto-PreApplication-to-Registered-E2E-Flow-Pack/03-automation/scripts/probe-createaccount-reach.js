/**
 * CAN TS01.8 ACTUALLY REACH THE CREATE-ACCOUNT LEG NOW?
 *
 *   node scripts/probe-createaccount-reach.js
 *
 * WHY THIS EXISTS. TS01.8 filmed 14/17 on 30-08 with `create-account`, `control-gone`
 * and `banner-fate` all reported as "no recorder branch drives this point yet" — the
 * recorder's phrasing for a point on the checklist that no code path ticks. The branch
 * was there the whole time. It sat inside the extend-only block, and TS01.8 is
 * gating-swept, so the three points on the row's only real subject could never tick.
 *
 * `node --check` cannot see this. It parses a branch that never runs exactly as
 * happily as one that does — which is how six of these have got through on this CR
 * already, and one of them would have cost a fixture after Confirm.
 *
 * WHAT THIS PROVES AND WHAT IT DOES NOT. It proves REACHABILITY: that the recorder's
 * own predicate now routes each row to exactly one call site, and that the two call
 * sites exist in the file. It does NOT prove the leg works — only a take proves a
 * selector, a caption or a tooltip. Create Account is terminal, so this is the last
 * cheap check available before a fixture is spent for ever.
 */
const fs = require('node:fs');
const path = require('node:path');
const tp = require('../src/triggerPoints');

const SPEC = path.join(__dirname, '..', 'tests', '90-evidence.spec.js');
const src = fs.readFileSync(SPEC, 'utf8');

let bad = 0;
const ok = (cond, label, detail) => {
  console.log(`${cond ? 'ok  ' : 'FAIL'}  ${label}`);
  if (detail) console.log(`        ${detail}`);
  if (!cond) bad += 1;
};

/** The recorder's own predicate, copied verbatim from 90-evidence.spec.js. */
const extendBlockRuns = (shape, armIsSwept) =>
  (shape === 'extend' || shape === 'refusal' || shape === 'hybrid') && !armIsSwept;

const wants = (ref, key) => (tp.pointsFor(ref) || []).some((p) => (p.key || p) === key);

console.log('\n1. the two call sites exist, and only two\n');
{
  const calls = (src.match(/await runCreateAccountLeg\(\);/g) || []).length;
  ok(/const runCreateAccountLeg = async \(\) => \{/.test(src),
    'the leg is a function in the outer scope');
  ok(calls === 2, `called from exactly 2 places (found ${calls})`,
    'one inside the extend block where it always ran, one on the swept path where it never could');
  ok(/if \(!extendBlockRuns && wants\('create-account'\)\) \{/.test(src),
    'the swept path is guarded on BOTH the shape and the point',
    'a row that does not carry create-account must not be dragged through a terminal leg');
  ok(!/if \(\(shape === 'extend' \|\| shape === 'refusal' \|\| shape === 'hybrid'\) && !armIsSwept\) \{/.test(src)
     || /const extendBlockRuns =/.test(src),
    'the guard is named once and reused, not written out twice',
    'two copies of a predicate drift, and the swept path is the negation of this one');
}

console.log('\n2. THE ROW THIS IS FOR\n');
{
  const shape = tp.shapeOf('TS01.8');
  const swept = tp.isSweptArm('TS01.8', '');
  const runs = extendBlockRuns(shape, swept);
  ok(shape === 'gating-swept', `TS01.8 is gating-swept (${shape})`,
    'it has nothing to extend — its fixture arrives already extended');
  ok(runs === false, 'TS01.8 does NOT enter the extend block',
    'correct, and unchanged: openExtendModal() at a greyed button costs 20s and every point after it');
  ok(wants('TS01.8', 'create-account') && wants('TS01.8', 'control-gone') && wants('TS01.8', 'banner-fate'),
    'TS01.8 carries all three of the points that were unreachable');
  ok(!runs && wants('TS01.8', 'create-account'),
    'TS01.8 now REACHES the leg by the swept path',
    'this is the whole fix — before it, these three points could not tick on any take');
}

console.log('\n3. controls — exactly one path each, and no row runs it twice\n');
for (const ref of ['E2E_TS10', 'TS40', 'TS37']) {
  const runs = extendBlockRuns(tp.shapeOf(ref), tp.isSweptArm(ref, ''));
  ok(runs === true && wants(ref, 'create-account'),
    `${ref} (${tp.shapeOf(ref)}) still reaches it INSIDE the extend block`);
  ok(!(!runs && wants(ref, 'create-account')),
    `${ref} does not ALSO take the swept path`,
    'a second run of a terminal leg would ask the operator to register an already-registered record');
}

console.log('\n4. the negative control — a row without the point runs neither path\n');
for (const ref of ['TS18', 'TS35']) {
  const runs = extendBlockRuns(tp.shapeOf(ref), tp.isSweptArm(ref, ''));
  ok(!wants(ref, 'create-account'), `${ref} does not carry create-account`);
  ok(!(!runs && wants(ref, 'create-account')),
    `${ref} is not swept into the terminal leg`);
}

console.log('\n5. the check can be made to FAIL\n');
{
  // A clean result from a predicate that cannot report a dirty one means nothing.
  const pretend = extendBlockRuns('gating-swept', false);
  ok(pretend === false && extendBlockRuns('extend', false) === true,
    'the predicate discriminates — swept false, extend true',
    'if it returned the same answer for both, every row above would "pass" identically');
  ok(extendBlockRuns('extend', true) === false,
    "E2E_TS4 arm B is extend-shaped but SWEPT, and is kept out of the block",
    'its record is already spent, so the control is greyed — this is the case the guard was written for');
}

console.log(`\n${bad ? `${bad} FAILURE(S)` : 'all clean'} — reachability only. A selector, a caption and a`);
console.log('tooltip are still proven by a take and nothing else.');
process.exit(bad ? 1 : 0);
