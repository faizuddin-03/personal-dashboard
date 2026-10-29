import { test } from '../fixtures/authFixture';
import { SCENARIOS } from '../data/scenarios';

// 12153_TS7 — QR Code, Success. BLOCKED: the sheet has no Initial Steps,
// Payment Steps, or Expected Results for this TS at all — marked "TBC with
// BA" as of 2026-09-01. Do not write real steps here until the sheet has
// them; this project exists only so the dashboard picker and Playwright
// project list have somewhere to point once it's unblocked.

test.describe(`${SCENARIOS.ts7.tsNo} — ${SCENARIOS.ts7.scenario}`, () => {
  test.skip('Pre-Application + Application, QR Code (BLOCKED — TBC with BA, no steps drafted)', async () => {
    // Intentionally empty.
  });
});
