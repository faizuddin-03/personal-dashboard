import { test, expect, type Page } from '@playwright/test';
import { CONFIG, SENDER, assertConfig } from '../data/config';
import { LoginPage } from '../pages/LoginPage';
import { QuoteFormPage } from '../pages/QuoteFormPage';
import { InsuranceStepsPage } from '../pages/InsuranceStepsPage';
import { InsuranceListingPage } from '../pages/InsuranceListingPage';
import { EstmBannerPage } from '../pages/EstmBannerPage';
import { PaymentPage } from '../pages/PaymentPage';
import { EstmHandoffPage } from '../pages/EstmHandoffPage';
import { holdForSchedule, holdUntil, nextCronRun, inDeadWindow, fmt } from '../utils/schedule';
import { readInbox, matching } from '../utils/mailtrap';
import { createEstm } from '../utils/estm';
import { setEsimResponseCode, vehiclePrefix, RESPONSE_CODE_OK, RESPONSE_CODE_FORCE_INSURANCE } from '../utils/esim';
import { PATHS } from '../utils/paths';

// ─────────────────────────────────────────────────────────────
// EAINT-11864 — reminder email for generated-but-unpurchased quotations.
//
// Titles MUST match app/eauto/quotation-reminder/page.tsx exactly: the runner
// selects tests with --grep on the title, so any drift matches nothing.
//
// SCOPE TODAY: every runnable case creates its own eSTM EXCEPT TS05, whose
// whole point is testing the no-eSTM path. `[from Faizuddin, 2026-08-18]`
// TS01, TS04, TS07 do it via `utils/estm.ts` (spawns scripts/eauto-estm as a
// child process to full completion, then quotes with vehicle number + IC —
// generateQuotation()'s `needsEstm` flag). TS02/TS03/TS06 do it in-process
// via EstmHandoffPage instead, because those three need the SAME session to
// carry through an eLKM-untick (or, for TS06, a 69E) auto-redirect straight
// into insurance, which a spawned child process can't hand back. TS06
// additionally drives scripts/eauto-esim (untouched, spawned as-is — see
// utils/esim.ts) to set the vehicle prefix's Response Code to VEL000069E
// before the eSTM flow, and always restores it to GLB000000I afterwards —
// eSIM is a shared instance.
// ─────────────────────────────────────────────────────────────

// No beforeEach: requesting the `page` fixture there would launch a browser for
// every test in the file, including the ones that only skip. Popup suppression
// lives in LoginPage.login(), which is the first navigation of every real case.
test.beforeAll(() => assertConfig());

/**
 * Log in and generate a quotation, stopping at `stopAt`. Returns the minute
 * the quotation was stamped — what the cron keys on.
 *
 * Defaults to Chubb, falling back to the first card offered if Chubb isn't
 * quoted for this vehicle — Tokio Marine is currently disabled, so a case
 * that landed on it by chance (DOM order, not a hardcoded choice) would never
 * proceed. `[from Faizuddin, 2026-08-18]`
 *
 * `needsEstm: true` creates a fresh eSTM for `CONFIG.vehicleNo` first (the
 * SAME `utils/estm.ts` driver TS04 uses — spawns `scripts/eauto-estm` to full
 * completion), and quotes with the buyer IC that eSTM reports rather than
 * `CONFIG.ic`, for the same reason TS04 does: the eSTM's identity comes from
 * the bypass slot, and the approved-eSTM precondition only holds for the
 * person actually quoted. Every case needs this **except TS05**, whose whole
 * point is testing the no-eSTM path — that one must stay `false`.
 * `[from Faizuddin, 2026-08-18 — every runnable case now creates its own
 * eSTM instead of relying on one created by hand]`
 */
async function generateQuotation(
  page: Page,
  opts: { stopAt: 1 | 2 | 3; user?: string; pass?: string; needsEstm: boolean },
): Promise<Date> {
  const steps = new InsuranceStepsPage(page);

  let ic = CONFIG.ic;
  if (opts.needsEstm) {
    if (CONFIG.createEstm) {
      const estm = await test.step(`Create an approved eSTM for ${CONFIG.vehicleNo}`, () => createEstm(CONFIG.vehicleNo));
      expect(estm.ok, estm.reason ?? 'The eSTM leg failed.').toBe(true);
      if (estm.ic && estm.ic !== ic) {
        console.log(`[estm] Using the eSTM's buyer IC ${estm.ic} for the quote (the run was given ${ic || '(none)'}).`);
        ic = estm.ic;
      }
    } else {
      console.log(`[estm] QR_CREATE_ESTM=0 — assuming ${CONFIG.vehicleNo} already has an approved eSTM whose buyer IC is ${ic}.`);
    }
  }

  await new LoginPage(page).login(opts.user ?? CONFIG.ucdUser, opts.pass ?? CONFIG.ucdPass);

  const form = new QuoteFormPage(page);
  await form.open();
  await form.fill(CONFIG.vehicleNo, ic);

  // Hold at the filled form and click at the scheduled minute — the quotation
  // is stamped by the click, not by when the browser opened.
  await holdForSchedule('quotation');
  const stampedAt = new Date();
  await form.showMyResult();

  await steps.expectStep(1);
  const cards = await steps.cardCount();
  expect(cards, 'No insurer offered a quote for this vehicle — try another vehicle number.').toBeGreaterThan(0);

  if (opts.stopAt >= 2) {
    await steps.selectInsurer('Chubb');
    await steps.expectStep(2);
  }
  if (opts.stopAt >= 3) {
    await steps.toPayment();
    await steps.expectStep(3);
  }

  console.log(`[quotation] stamped ${fmt(stampedAt)}, stopped at step ${opts.stopAt}`);
  return stampedAt;
}

/**
 * Check the listing — but ONLY for a run that reached step 3.
 *
 * **A quotation is generated at step 3, not before.** Stop at step 1 or 2 and
 * no row ever appears in the listing. The reminder email still arrives: a
 * backend process detects the drop-off and sends it, and that process has no UI
 * at all. So for a step-1 or step-2 stop, Mailtrap is the ONLY way to validate
 * the case — there is nothing on screen to look at.
 * `[from QA team, 2026-08-17]`
 *
 * Hence the `stoppedAt` argument: asserting a listing row after a step-1 stop
 * fails a working system for the wrong reason, which is exactly what TS01 did.
 *
 * Absence is deliberately NOT asserted for steps 1-2. The vehicle number is
 * reused across runs, so an earlier step-3 run legitimately leaves a row behind
 * and "no row" would be flaky rather than meaningful.
 */
async function expectQuotationPersisted(page: Page, stoppedAt: 1 | 2 | 3): Promise<void> {
  if (stoppedAt < 3) {
    console.log(
      `[listing] Stopped at step ${stoppedAt} — no quotation is generated before step 3, so the listing is expected to be empty for this run. Mailtrap is the only validation here.`,
    );
    return;
  }
  await test.step('Expected: the quotation is listed as "Quotation" (DRAFT)', async () => {
    const listing = new InsuranceListingPage(page);
    expect(
      await listing.hasQuotation(CONFIG.vehicleNo),
      `No Quotation-status row for ${CONFIG.vehicleNo} — the run reached step 3, so one should exist.`,
    ).toBe(true);
  });
}

/**
 * Assert the inbox. `expected: 'one'` also proves there is exactly ONE — the
 * reference tool takes matches[0] and would miss a duplicate, and TS03 exists
 * precisely to catch a second send.
 *
 * An unreachable inbox is `blocked`: reported loudly, never a silent pass.
 */
async function assertInbox(expected: 'one' | 'none', why: string): Promise<void> {
  const label = expected === 'one' ? 'exactly one reminder email' : 'no reminder email';
  await test.step(`Expected: ${label} — ${why}`, async () => {
    const inbox = await readInbox();
    if (!inbox.ok) {
      console.log(`[BLOCKED] Email check could not run: ${inbox.reason}`);
      console.log(`[BLOCKED] Check by hand: ${CONFIG.mailtrapInbox} — expect ${label} for ${CONFIG.vehicleNo} from ${SENDER}.`);
      test.info().annotations.push({ type: 'blocked', description: `${inbox.reason} — verify by hand.` });
      return;
    }

    const hits = matching(inbox.messages, CONFIG.vehicleNo);
    console.log(`[mailtrap] ${inbox.messages.length} message(s) in the inbox, ${hits.length} mentioning ${CONFIG.vehicleNo}`);

    if (expected === 'none') {
      expect(hits, `Expected no reminder for ${CONFIG.vehicleNo}, found ${hits.length}.`).toHaveLength(0);
    } else {
      expect(hits, `Expected exactly one reminder for ${CONFIG.vehicleNo}, found ${hits.length}.`).toHaveLength(1);
    }
  });
}

// ── TS01 — quotation a minute before the hour, email on the next run ──
test('11864_TS01: Get Free Quote, stop at step 1, quotation 1 minute before the hour', async ({ page }) => {
  const stampedAt = await generateQuotation(page, { stopAt: 1, needsEstm: true });
  await expectQuotationPersisted(page, 1);

  const run = nextCronRun(stampedAt);
  await holdUntil(new Date(run.getTime() + 3 * 60_000), `cron run at ${fmt(run)} (+3m grace)`);
  await assertInbox('one', `quotation at ${fmt(stampedAt)} should be picked up by the ${fmt(run)} run`);
});

// ── TS02 — eSTM entry: untick eLKM, auto-redirect straight into insurance ──
//
// Create the eSTM ourselves (EstmHandoffPage), untick eLKM on its own Payment
// step, and let that auto-redirect carry the SAME session into insurance —
// no separate login, no Get Free Quote form. Stop at step 2 and quote with
// the buyer IC the eSTM reports (same reasoning as TS04's BUYER_IC).
test('11864_TS02: eSTM entry, stop at step 2, quotation exactly on the hour', async ({ page }) => {
  const handoff = new EstmHandoffPage(page);
  const { page: onInsurance, buyerIc } = await handoff.enterInsurance();
  if (buyerIc) console.log(`[TS02] Quoting with the eSTM's buyer IC: ${buyerIc}`);

  const steps = new InsuranceStepsPage(onInsurance);

  // The redirect lands mid-flow — hold for the scheduled minute here, right
  // before the step that actually stamps the quotation, same as
  // generateQuotation() does for the Get Free Quote entry.
  await holdForSchedule('quotation');
  const stampedAt = new Date();

  await steps.expectStep(1);
  expect(await steps.cardCount(), 'No insurer offered a quote from the eSTM entry.').toBeGreaterThan(0);
  await steps.selectInsurer('Chubb');
  await steps.expectStep(2);
  console.log(`[quotation] stamped ${fmt(stampedAt)}, stopped at step 2`);

  const run = nextCronRun(stampedAt);
  await holdUntil(new Date(run.getTime() + 3 * 60_000), `cron run at ${fmt(run)} (+3m grace)`);
  await assertInbox('one', `the eSTM-entry quotation at ${fmt(stampedAt)} should be picked up by the ${fmt(run)} run`);
});

// ── TS03 — banner entry; a second cron run must NOT send again ──
//
// Shares TS02's first half (eSTM entry, eLKM untick, auto-redirect), but that
// first entry is ABANDONED here: go Home, then back to the eSTM's own
// listing, search by vehicle number, and click "View" on the matching row —
// that lands on the transaction details page, which is already Approved
// (Tx Status/Payment/eLKM all OK) by the time it's unticked and redirected
// once. Its "GET FREE QUOTE FOR <plate>" banner (`#to-buy-insurance`) is the
// real, second entry into insurance — no separate "resume/finish payment"
// step needed; that was an earlier, unconfirmed guess this replaces.
// `[verified: live HTML from uat1, 2026-08-19 —
// _reference/html/eauto/estm-listing-with-approved-row.html,
// estm-details-with-buy-insurance-banner.html]`
test('11864_TS03: Banner entry, stop at step 3, two cron runs send only one email', async ({ page }) => {
  const handoff = new EstmHandoffPage(page);
  const { page: onInsurance } = await handoff.enterInsurance();

  // Abandon the first entry rather than continuing in it.
  await onInsurance.goto(PATHS.home(), { waitUntil: 'domcontentloaded' }).catch(() => { /* best effort */ });

  const banner = new EstmBannerPage(onInsurance);
  await banner.openTransaction(CONFIG.vehicleNo);

  await holdForSchedule('quotation');
  const stampedAt = new Date();
  await banner.buyInsurance();

  const steps = new InsuranceStepsPage(onInsurance);
  // The banner lands on step 1 directly — no Get Free Quote form on this path.
  await steps.expectStep(1);
  expect(await steps.cardCount(), 'No insurer offered a quote from the banner entry.').toBeGreaterThan(0);
  await steps.selectInsurer('Takaful');
  await steps.expectStep(2);
  await steps.toPayment();
  await steps.expectStep(3);

  await expectQuotationPersisted(onInsurance, 3);

  const first = nextCronRun(stampedAt);
  await holdUntil(new Date(first.getTime() + 3 * 60_000), `1st cron run at ${fmt(first)}`);
  await assertInbox('one', `the ${fmt(first)} run should send the reminder`);

  const second = nextCronRun(new Date(first.getTime() + 60_000));
  await holdUntil(new Date(second.getTime() + 3 * 60_000), `2nd cron run at ${fmt(second)}`);
  await assertInbox('one', `the ${fmt(second)} run must NOT send a second email — still exactly one`);
});

// ── TS04 — the purchase case: buy before the cron runs, no reminder ──
//
// The only case in this suite that completes a purchase. Staging is allowed to
// buy — it runs against the sandbox payment, and payment in eAuto is a simple
// click, the same as the eSTM flow's. `[from Faizuddin, 2026-08-18]`
//
// Shape of the case:
//   1. create an eSTM for the vehicle          (the precondition)
//   2. Get Free Quote with that vehicle + IC, stop at step 3
//   3. idle — the user walking away, which is what the reminder backend is
//      watching for. TS04 says 5 minutes; QR_DROP_OFF_SECONDS (default 10)
//      shortens it while the script is being proved out
//   4. come back through the Insurance Transaction Listing and pay there
//   5. the cron runs and must NOT send a reminder: the quotation was bought
//
// The idle is the case, not a sleep: it puts a real gap between the drop-off
// and the purchase. It also has to fit before the cron hour, so the run reports
// honestly if the purchase lands after the pickup rather than quietly asserting
// a different scenario.
test('11864_TS04: Purchase completed before the cron runs, no reminder sent', async ({ page }) => {
  // eSTM creation (~4-8 min) + the drop-off idle + a real insurer payment call,
  // and then a hold to the next cron hour. The suite runs with no per-test
  // timeout; the dashboard route owns the 4h ceiling.

  // ── 1. The eSTM, on the SAME vehicle number ──
  // The IC matters as much as the vehicle: the eSTM's buyer identity comes from
  // the bypass slot, and the quote has to be keyed with that same IC or the
  // approved-eSTM precondition simply does not apply to what we quoted.
  let ic = CONFIG.ic;
  if (CONFIG.createEstm) {
    const estm = await test.step(`Create an approved eSTM for ${CONFIG.vehicleNo}`, () => createEstm(CONFIG.vehicleNo));
    expect(estm.ok, estm.reason ?? 'The eSTM leg failed.').toBe(true);
    if (estm.ic && estm.ic !== ic) {
      console.log(`[estm] Using the eSTM's buyer IC ${estm.ic} for the quote (the run was given ${ic || '(none)'}).`);
      ic = estm.ic;
    }
  } else {
    console.log(`[estm] QR_CREATE_ESTM=0 — assuming ${CONFIG.vehicleNo} already has an approved eSTM whose buyer IC is ${ic}.`);
  }

  // ── 2. Quotation, stopped at step 3 ──
  const steps = new InsuranceStepsPage(page);
  await new LoginPage(page).login(CONFIG.subUcdUser || CONFIG.ucdUser, CONFIG.subUcdPass || CONFIG.ucdPass);

  const form = new QuoteFormPage(page);
  await form.open();
  await form.fill(CONFIG.vehicleNo, ic);

  await holdForSchedule('quotation');
  const stampedAt = new Date();
  await form.showMyResult();

  await steps.expectStep(1);
  expect(await steps.cardCount(), 'No insurer offered a quote for this vehicle — try another vehicle number.').toBeGreaterThan(0);
  await steps.selectInsurer('TokioMarine');
  await steps.expectStep(2);
  await steps.toPayment();
  await steps.expectStep(3);
  console.log(`[quotation] stamped ${fmt(stampedAt)}, stopped at step 3`);

  await expectQuotationPersisted(page, 3);

  // ── 3. Walk away ──
  // 5 minutes in the case as written; QR_DROP_OFF_SECONDS shortens it so the
  // script can be proved without waiting the gap out on every run.
  const resumeAt = new Date(stampedAt.getTime() + CONFIG.dropOffSeconds * 1_000);
  await holdUntil(resumeAt, `${CONFIG.dropOffSeconds}-second drop-off before returning to the listing`);

  // ── 4. Back in through the listing, and pay there ──
  const listing = new InsuranceListingPage(page);
  const resumed = await test.step('Resume the quotation from the Insurance Transaction Listing', () => listing.resumeToPayment(CONFIG.vehicleNo));
  test.info().annotations.push({ type: 'resumed via', description: resumed.via });

  const payment = new PaymentPage(page);
  await payment.payNow();
  const paidAt = new Date();

  // payNow() already polls internally until the URL reaches complete.do —
  // insurance step 4 (Confirm), per knowledge/flow-insurance-purchase.md's
  // entry-points table — but that only happens inside its own retry loop.
  // Asserting it again here makes "TS04 actually reached step 4" a visible,
  // named step in the report rather than an implicit side effect of payNow()
  // returning at all. `[from Faizuddin, 2026-08-19]`
  await test.step('Expected: purchase reaches insurance step 4 (Confirm)', async () => {
    await expect(page, `Expected the URL to reach complete.do (step 4) after paying — got ${page.url()}`).toHaveURL(/complete\.do/);
    console.log(`[insurance] Reached step 4 (Confirm): ${page.url()}`);
  });

  await test.step('Expected: the listing shows the transaction as Insurance Created', async () => {
    await listing.open();
    const statuses = await listing.search(CONFIG.vehicleNo);
    expect(statuses, `No "Insurance Created" row for ${CONFIG.vehicleNo} after paying — the purchase did not land.`).toContain('Insurance Created');
  });

  // ── 5. The cron must stay quiet ──
  // Report, do not silently assert a different case: if the purchase landed
  // after the run that would have picked the quotation up, the reminder was
  // due before the purchase and "no email" is the wrong expectation.
  const pickup = nextCronRun(stampedAt);
  if (paidAt > pickup) {
    console.log(`[BLOCKED] The quotation was stamped ${fmt(stampedAt)}, its pickup run was ${fmt(pickup)}, and payment only completed at ${fmt(paidAt)}. TS04 needs the purchase to finish BEFORE the pickup run — schedule the quotation earlier in the hour and rerun.`);
    test.info().annotations.push({ type: 'blocked', description: 'Purchase completed after the cron pickup run — TS04 was not exercised as written.' });
    return;
  }

  await holdUntil(new Date(pickup.getTime() + 3 * 60_000), `cron run at ${fmt(pickup)} (+3m grace)`);
  await assertInbox('none', `the quotation was purchased at ${fmt(paidAt)}, before the ${fmt(pickup)} run — nothing is due`);
});

// ── TS05 — no approved eSTM, so no reminder at all ──
//
// The ONE case that must NOT create an eSTM — needsEstm: false is the whole
// point of this test, not an oversight. Every other case in this suite now
// creates its own.
test('11864_TS05: No approved eSTM, quotation stops at step 2, no reminder sent', async ({ page }) => {
  const stampedAt = await generateQuotation(page, {
    stopAt: 2,
    user: CONFIG.subUcdUser || CONFIG.ucdUser,
    pass: CONFIG.subUcdPass || CONFIG.ucdPass,
    needsEstm: false,
  });

  const run = nextCronRun(stampedAt);
  await holdUntil(new Date(run.getTime() + 3 * 60_000), `cron run at ${fmt(run)} (+3m grace)`);
  await assertInbox('none', 'the vehicle has no approved eSTM, so no reminder is due');
});

// ── TS07 — the dead window: nothing until the 07:00 run ──
test('11864_TS07: Quotation after the last cron run, reminder arrives at 07:00', async ({ page }) => {
  const stampedAt = await generateQuotation(page, { stopAt: 3, needsEstm: true });
  await expectQuotationPersisted(page, 3);

  // 23:00 exactly races the final run of the day, so it is NOT the dead window.
  // Schedule for 23:30 to test this properly.
  expect(
    inDeadWindow(stampedAt),
    `Quotation was stamped at ${fmt(stampedAt)}, inside cron hours — schedule it for 23:30 to test the dead window.`,
  ).toBe(true);

  await assertInbox('none', 'no run happens between 23:00 and 07:00');

  const morning = nextCronRun(stampedAt);
  await holdUntil(new Date(morning.getTime() + 3 * 60_000), `07:00 run at ${fmt(morning)}`);
  await assertInbox('one', 'the 07:00 run should deliver the reminder held overnight');
});

// ── TS06 — 69E: reach insurance step 3, stop (email check is manual for now) ──
//
// The eSTM leg is the SAME Create eSTM flow used everywhere else — nothing
// about it differs. The one insertion point: right after the JPJ result
// lands, before clicking Make Payment, set the vehicle prefix's Response
// Code to VEL000069E. The eSTM then completes NORMALLY (Make Payment,
// untick eLKM, submit, Done) and auto-redirects into insurance — confirmed
// working end to end, 2026-08-18, see knowledge/flow-estm.md
// § CONFIRMED WORKING END TO END. That capture also settled that 69E is not
// a hard force — the insurance page carries an explicit "Skip, Return to
// eSerahan" escape — so this stops at step 3 and does not need to leave via
// Home or complete a purchase to prove anything.
//
// The reminder-email assertion is deliberately NOT run here: there's a
// dev-side bug affecting it right now, and Faizuddin is checking that leg by
// hand until it's resolved. `[from Faizuddin, 2026-08-18]` Re-add the
// cron-wait + assertInbox block (see TS02 for the pattern) once that's
// sorted.
//
// eSIM is a SHARED instance keyed by vehicle-number prefix, so the Response
// Code is ALWAYS restored to GLB000000I (OK) afterwards — in a `finally`, so
// a failure partway through this test never leaves the prefix poisoned for
// whoever tests it next.
test('11864_TS06: 69E redirect, stop at step 3, no reminder sent', async ({ page }) => {
  const prefix = vehiclePrefix(CONFIG.vehicleNo);

  try {
    const handoff = new EstmHandoffPage(page);
    const { page: onInsurance, buyerIc } = await handoff.completeEstmWithForcedInsurance(
      prefix, RESPONSE_CODE_FORCE_INSURANCE, setEsimResponseCode,
    );
    if (buyerIc) console.log(`[TS06] Buyer IC: ${buyerIc}`);

    const steps = new InsuranceStepsPage(onInsurance);
    const stampedAt = new Date();

    await steps.expectStep(1);
    expect(await steps.cardCount(), 'No insurer offered a quote from the 69E entry.').toBeGreaterThan(0);
    await steps.selectInsurer('Chubb');
    await steps.expectStep(2);
    await steps.toPayment();
    await steps.expectStep(3);
    console.log(`[TS06] Reached insurance step 3 at ${fmt(stampedAt)}. Stopping here — check the reminder email by hand for now.`);
  } finally {
    const restore = await setEsimResponseCode(prefix, RESPONSE_CODE_OK);
    if (!restore.ok) {
      console.log(`[TS06] WARNING: could not restore prefix "${prefix}" to ${RESPONSE_CODE_OK} — ${restore.reason}. Fix this by hand before anyone else tests that prefix.`);
    }
  }
});
