import { test, expect } from '@playwright/test';
import { CONFIG, assertConfig } from '../data/config';
import { LoginPage } from '../pages/LoginPage';
import { QuoteFormPage } from '../pages/QuoteFormPage';
import { InsuranceStepsPage } from '../pages/InsuranceStepsPage';
import { InsuranceListingPage } from '../pages/InsuranceListingPage';

// ─────────────────────────────────────────────────────────────
// EAINT-11864 — the OVERNIGHT half of the split.
//
// Runs on GitHub Actions at ~23:30 MYT, unattended, because the laptop is off
// from 18:00 and a browser needs a machine that is awake. Creates a quotation,
// stops at step 3, and stops there. Faizuddin checks Mailtrap by hand the next
// morning to confirm the email and its timing.
//
// Lives in tests-nightly/ with its own config (playwright.nightly.config.ts) so
// the dashboard cannot reach it: the quotation-reminder route spawns
// `playwright test --grep <titles>` against the DEFAULT config, whose testDir
// is ./tests. Different directory, different config, no overlap.
//
// It shares this suite's page objects rather than copying them — a copy would
// drift, and the drift would surface at 23:30 with nobody watching. It also has
// to share the ONE @playwright/test install: a standalone project with its own
// node_modules fails immediately with "Requiring @playwright/test second time".
// ─────────────────────────────────────────────────────────────

const INSURER = process.env.NQ_INSURER || 'Lonpac';

/**
 * WHY STEP 3, not step 1: a quotation is only generated at step 3. Stop earlier
 * and nothing is written to the insurance listing — the reminder email still
 * goes out (a backend detector spots the drop-off) but it leaves no trace on
 * screen. Stopping at step 3 produces a `Quotation` (DRAFT) row, which is the
 * morning proof that this ran while the laptop was off.
 * See knowledge/eauto-insurance.md.
 *
 * It stops AT the payment form and does not pay. An unpurchased quotation is
 * exactly what the reminder cron looks for.
 *
 * No email assertion by design: Mailtrap is read through an already-signed-in
 * Chrome profile, which a cloud runner does not have.
 */
test('nightly: create insurance quotation, stop at step 3', async ({ page }) => {
  assertConfig();

  const startedAt = new Date();
  console.log(`[nightly] started ${startedAt.toISOString()} — local ${startedAt.toString()}`);
  console.log(`[nightly] vehicle ${CONFIG.vehicleNo} on ${CONFIG.baseUrl}`);

  await new LoginPage(page).login(CONFIG.ucdUser, CONFIG.ucdPass);

  const form = new QuoteFormPage(page);
  await form.open();
  await form.fill();

  // The quotation is stamped by this click, not by when the job started. This
  // is the timestamp to compare the morning's email against.
  const stampedAt = new Date();
  await form.showMyResult();
  console.log(`[nightly] quotation stamped ${stampedAt.toISOString()} — local ${stampedAt.toString()}`);

  const steps = new InsuranceStepsPage(page);
  await steps.expectStep(1);

  const cards = await steps.cardCount();
  expect(cards, 'No insurer offered a quote for this vehicle — nothing to take to step 3.').toBeGreaterThan(0);

  const chosen = await steps.selectInsurer(INSURER);
  await steps.expectStep(2);

  await steps.toPayment();
  await steps.expectStep(3);

  const transactionId = await steps.transactionId();

  // The morning proof. Unlike the email, this is visible in the UI whenever you
  // get to it, so it answers "did the job actually run?" on its own.
  const listing = new InsuranceListingPage(page);
  const listed = await listing.hasQuotation(CONFIG.vehicleNo);
  expect(
    listed,
    `Reached step 3 but no Quotation row for ${CONFIG.vehicleNo} — without it there is no way to confirm this ran overnight.`,
  ).toBe(true);

  console.log('RESULT:' + JSON.stringify({
    status: 'SUCCESS',
    vehicleNo: CONFIG.vehicleNo,
    baseUrl: CONFIG.baseUrl,
    insurer: chosen,
    transactionId,
    stampedAtUtc: stampedAt.toISOString(),
    stampedAtLocal: stampedAt.toString(),
    listedAsQuotation: listed,
    // Spelled out so the morning check needs no reasoning of its own.
    expectEmailAt: 'the 07:00 cron run — a quotation after 23:00 falls past the last run of the day',
  }));
});
