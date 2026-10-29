import { test, expect } from '@playwright/test';
import { Session, remarksFor } from '../utils/session';
import { openAs, expectNewLogRow, expectStatus, expectSummaryStatus } from '../utils/workflow';
import { eachMonth, rejectNeedsRemarks } from '../utils/combined';
import { tagOf } from '../data/priority';
import { WAIT_NOTE } from '../data/expected';
import { expectButtons, expectNote, expectNoPad } from '../utils/checks';

// F. Reviewer actions — 12028_TS28 to TS34.
// [unconfirmed] Details page not captured live.

test('12028_TS28: Reviewer buttons disabled with waiting note until the Drafter approves', tagOf('12028_TS28'), async ({ page }) => {
  const ts = '12028_TS28';
  const s = new Session(page, ts);
  await s.as('reviewer');
  await eachMonth(s, ['Pending', 'KIV', 'DRA'], async (d, state) => {
    await expectButtons(d, `${ts}-${state}`, { disabled: ['Approve', 'Reject'] });
    await expectNote(d, `${ts}-${state}`, WAIT_NOTE.forDrafter);
  });
});

test('12028_TS29: Reviewer first Approve with the signature pad sets Reviewer Status Approved', tagOf('12028_TS29'), async ({ page }) => {
  const ts = '12028_TS29';
  const { s, d, month } = await openAs(page, ts, 'reviewer', 'DA', 'E12028_MONTH', 'Drafter Approved month');
  await expectButtons(d, ts, { enabled: ['Approve', 'Reject'], absent: ['KIV'] });
  const before = await d.logCount('Reviewer', 'Approved');
  await test.step('Click [Approve]', async () => { await d.clickApprove(); });
  await test.step('Check the "Sign to Approve" pad is shown', async () => {
    await d.verify(`${ts}-pad`, d.wfBar(), 'No signature pad on the first approval (has this Reviewer signed before?)', async () => {
      await expect(d.sigTitle()).toBeVisible({ timeout: 10_000 });
      await expect(d.sigPad()).toBeVisible();
    });
    await d.captureEvidence(`${ts}-pad`);
  });
  await test.step('Sign and click [Save & Approve]', async () => {
    await d.signIfAsked();
    if (!(await d.waitForStatus('Reviewer', 'Approved'))) throw new Error('Reviewer Status did not change to Approved after [Save & Approve].');
  });
  await expectStatus(d, ts, 'Reviewer', 'Approved');
  await expectNewLogRow(d, ts, 'Reviewer', 'Approved', before);
  await expectSummaryStatus(s, ts, month, 'Reviewer Status', 'Approved');
});

test('12028_TS30: Reviewer Reject needs remarks and returns the month to Drafter Review Again', tagOf('12028_TS30'), async ({ page }) => {
  const ts = '12028_TS30';
  const { s, d, month } = await openAs(page, ts, 'reviewer', 'DA', 'E12028_MONTH', 'Drafter Approved month');
  const remarks = remarksFor(ts);
  await rejectNeedsRemarks(d, ts, 'Reviewer', remarks);
  const before = await d.logCount('Reviewer', 'Rejected');
  await test.step(`Click [Reject], type "${remarks}", [Submit Reject]`, async () => { await d.reject('Reviewer', remarks); });
  await expectStatus(d, ts, 'Drafter', 'Review Again');
  await expectNewLogRow(d, ts, 'Reviewer', 'Rejected', before, remarks);
  await expectSummaryStatus(s, ts, month, 'Drafter Status', 'Review Again');
});

test('12028_TS31: Reviewer re-approves a Reviewer Review Again month', tagOf('12028_TS31'), async ({ page }) => {
  const ts = '12028_TS31';
  const { d, month } = await openAs(page, ts, 'reviewer', 'RRA', 'E12028_MONTH', 'Reviewer Review Again month');
  await expectButtons(d, ts, { enabled: ['Approve', 'Reject'] });
  const before = await d.logCount('Reviewer', 'Approved');
  await test.step('Click [Approve] (sign if the pad shows)', async () => { await d.approve('Reviewer'); });
  await expectStatus(d, ts, 'Reviewer', 'Approved');
  await expectNewLogRow(d, ts, 'Reviewer', 'Approved', before);
  console.log(`DETAIL:${JSON.stringify({ label: 'Month for 12028_TS41', value: month })}`);
});

test('12028_TS32: Reviewer Reject on a Review Again month sets Drafter Status Review Again', tagOf('12028_TS32'), async ({ page }) => {
  const ts = '12028_TS32';
  const { d } = await openAs(page, ts, 'reviewer', 'RRA', 'E12028_MONTH', 'Reviewer Review Again month');
  const before = await d.logCount('Reviewer', 'Rejected');
  const remarks = remarksFor(ts);
  await test.step(`Click [Reject], type "${remarks}", [Submit Reject]`, async () => { await d.reject('Reviewer', remarks); });
  await expectStatus(d, ts, 'Drafter', 'Review Again');
  await expectNewLogRow(d, ts, 'Reviewer', 'Rejected', before, remarks);
});

test('12028_TS33: Reviewer buttons disabled once the Reviewer step is done', tagOf('12028_TS33'), async ({ page }) => {
  const ts = '12028_TS33';
  const s = new Session(page, ts);
  await s.as('reviewer');
  let fullMonth = '';
  await eachMonth(s, ['RA', 'Full'], async (d, state, month) => {
    if (state === 'RA') {
      await expectButtons(d, `${ts}-RA`, { disabled: ['Approve', 'Reject'] });
      await expectNote(d, `${ts}-RA`, WAIT_NOTE.reviewerDone);
    } else {
      await expectButtons(d, `${ts}-Full`, { disabledOrAbsent: ['Approve', 'Reject'] });
      fullMonth = month;
    }
  });
  await expectSummaryStatus(s, ts, fullMonth, 'Reviewer Status', 'Approved');
});

test('12028_TS34: Reviewer second approval reuses the signature without the pad', tagOf('12028_TS34'), async ({ page }) => {
  const ts = '12028_TS34';
  // Precondition (not visible on screen): this Reviewer signed before (12028_TS29).
  const { d } = await openAs(page, ts, 'reviewer', 'DA', 'E12028_MONTH', 'Another Drafter Approved month');
  await test.step('Click [Approve]', async () => { await d.clickApprove(); });
  await test.step('Check the signature pad is not shown', async () => { await expectNoPad(d, ts); });
  await test.step('Check Reviewer Status changes to Approved', async () => {
    const ok = await d.waitForStatus('Reviewer', 'Approved');
    await d.verify(`${ts}-status`, d.wfBar(), 'Reviewer Status not Approved', async () => expect(ok).toBe(true));
  });
});
