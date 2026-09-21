import { test } from '../fixtures/authFixture';
import { SCENARIOS } from '../data/scenarios';

// 12153_TS8 — QR Code, Failed. BLOCKED: the sheet has NO steps at all for
// this TS (not even Initial Steps) as of 2026-09-01. Do not write real
// steps here until the sheet has them; this project exists only so the
// dashboard picker and Playwright project list have somewhere to point
// once it's unblocked.

test.describe(`${SCENARIOS.ts8.tsNo} — ${SCENARIOS.ts8.scenario}`, () => {
  test.skip('Pre-Application + Application, QR Code (BLOCKED — no steps drafted at all)', async () => {
    // Intentionally empty.
  });
});
