import { test, expect } from '@playwright/test';
import { Session } from '../utils/session';
import { openAs, expectNewLogRow, expectNoNewLogRow, expectStatus, expectSummaryStatus } from '../utils/workflow';
import { eachMonth } from '../utils/combined';
import { tagOf } from '../data/priority';
import { required } from '../data/config';
import { WAIT_NOTE } from '../data/expected';
import { expectButtons, expectNote, expectNoPad } from '../utils/checks';

// E. Drafter actions — 12028_TS20 to TS27.
// Each TS acts on the month(s) typed on its row; each month must already be in
// the status the TS names (checked first; the TS stops with the reason if not).
// [unconfirmed] Details page not captured live.

test('12028_TS20: Drafter first Approve with the signature pad sets Drafter Status Approved', tagOf('12028_TS20'), async ({ page }) => {
  const ts = '12028_TS20';
  const { s, d, month } = await openAs(page, ts, 'drafter', 'Pending', 'E12028_MONTH', 'Pending month');
  await expectButtons(d, ts, { enabled: ['Approve', 'KIV'], absent: ['Reject'] });
  const before = await d.logCount('Drafter', 'Approved');
  await test.step('Click [Approve]', async () => { await d.clickApprove(); });
  await test.step('Check the "Sign to Approve" pad is shown', async () => {
    await d.verify(`${ts}-pad`, d.wfBar(), 'No signature pad on the first approval (has this Drafter signed before?)', async () => {
      await expect(d.sigTitle()).toBeVisible({ timeout: 10_000 });
      await expect(d.sigPad()).toBeVisible();
    });
    await d.captureEvidence(`${ts}-pad`);
  });
  const blank = await test.step('Look at the empty pad', async () => d.padPicture());
  await test.step('Draw a signature, then click [Clear]', async () => {
    await d.drawSignature();
    const drawn = await d.padPicture();
    await d.demoHighlight(d.sigClear());
    await d.sigClear().click();
    const cleared = await d.padPicture();
    await d.verify(`${ts}-not-cleared`, d.sigPad(), 'Strokes still on the pad after Clear', async () => {
      expect(drawn.equals(blank), 'drawing changed the pad').toBe(false);
      expect(cleared.equals(blank), 'pad after Clear equals the empty pad').toBe(true);
    });
  });
  await test.step('Click [Cancel] on the pad', async () => { await d.cancelSignature(); });
  await expectStatus(d, ts, 'Drafter', 'Pending');
  await expectNoNewLogRow(d, ts, 'Drafter', 'Approved', before);
  await test.step('Click [Approve], sign, [Save & Approve]', async () => {
    const { padShown } = await d.approve('Drafter');
    if (!padShown) throw new Error('The signature pad did not show on the second [Approve] after Cancel.');
  });
  await expectStatus(d, ts, 'Drafter', 'Approved');
  await expectNewLogRow(d, ts, 'Drafter', 'Approved', before);
  await expectSummaryStatus(s, ts, month, 'Drafter Status', 'Approved');
});

test('12028_TS21: Drafter KIV on a Pending month sets Drafter Status KIV', tagOf('12028_TS21'), async ({ page }) => {
  const ts = '12028_TS21';
  const { s, d, month } = await openAs(page, ts, 'drafter', 'Pending', 'E12028_MONTH', 'Pending month');
  const before = await d.logCount('Drafter', 'KIV');
  await test.step('Click [KIV]', async () => { await d.kiv(); });
  await expectStatus(d, ts, 'Drafter', 'KIV');
  await expectNewLogRow(d, ts, 'Drafter', 'KIV', before);
  await expectSummaryStatus(s, ts, month, 'Drafter Status', 'KIV');
});

test('12028_TS22: Drafter Approve on a Review Again month sets Drafter Status Approved', tagOf('12028_TS22'), async ({ page }) => {
  const ts = '12028_TS22';
  const { d } = await openAs(page, ts, 'drafter', 'DRA', 'E12028_MONTH', 'Drafter Review Again month');
  const before = await d.logCount('Drafter', 'Approved');
  await test.step('Click [Approve] (sign if the pad shows)', async () => { await d.approve('Drafter'); });
  await expectStatus(d, ts, 'Drafter', 'Approved');
  await expectNewLogRow(d, ts, 'Drafter', 'Approved', before);
});

test('12028_TS23: Drafter KIV on a Review Again month sets Drafter Status KIV', tagOf('12028_TS23'), async ({ page }) => {
  const ts = '12028_TS23';
  const { d } = await openAs(page, ts, 'drafter', 'DRA', 'E12028_MONTH', 'Drafter Review Again month');
  const before = await d.logCount('Drafter', 'KIV');
  await test.step('Click [KIV]', async () => { await d.kiv(); });
  await expectStatus(d, ts, 'Drafter', 'KIV');
  await expectNewLogRow(d, ts, 'Drafter', 'KIV', before);
});

test('12028_TS24: Drafter action on a KIV month follows the final KIV rule', tagOf('12028_TS24'), async ({ page }) => {
  const ts = '12028_TS24';
  // Open point 1 — the rule is typed on the row: "can act" or "locked"; never assumed.
  const rule = required('E12028_EXPECT_KIV', 'Final KIV rule').toLowerCase();
  if (rule !== 'can act' && rule !== 'locked') throw new Error(`Final KIV rule must be "can act" or "locked", got "${rule}".`);
  const { d } = await openAs(page, ts, 'drafter', 'KIV', 'E12028_MONTH', 'KIV month');
  if (rule === 'can act') await expectButtons(d, ts, { enabled: ['Approve', 'KIV'] });
  else await expectButtons(d, ts, { disabledOrAbsent: ['Approve', 'KIV'] });
});

test('12028_TS25: Drafter buttons disabled once the Drafter step is done', tagOf('12028_TS25'), async ({ page }) => {
  const ts = '12028_TS25';
  const s = new Session(page, ts);
  await s.as('drafter');
  let fullMonth = '';
  await eachMonth(s, ['DA', 'RRA', 'Full'], async (d, state, month) => {
    if (state === 'DA') {
      await expectButtons(d, `${ts}-DA`, { disabled: ['Approve', 'KIV'] });
      await expectNote(d, `${ts}-DA`, WAIT_NOTE.drafterDone);
    } else if (state === 'RRA') {
      await expectButtons(d, `${ts}-RRA`, { disabled: ['Approve', 'KIV'] });
    } else {
      await expectButtons(d, `${ts}-Full`, { disabledOrAbsent: ['Approve', 'KIV'] });
      fullMonth = month;
    }
  });
  await expectSummaryStatus(s, ts, fullMonth, 'Drafter Status', 'Approved');
});

test('12028_TS26: Second Drafter user approves a Pending month and is blocked after another Drafter approved', tagOf('12028_TS26'), async ({ page }) => {
  const ts = '12028_TS26';
  const s = new Session(page, ts);
  await s.as('drafter2');
  await eachMonth(s, ['Pending', 'DA'], async (d, state) => {
    if (state === 'Pending') {
      const before = await d.logCount('Drafter', 'Approved');
      await test.step('Click [Approve], sign if asked, [Save & Approve]', async () => { await d.approve('Drafter'); });
      await expectStatus(d, ts, 'Drafter', 'Approved');
      await expectNewLogRow(d, ts, 'Drafter', 'Approved', before);
    } else {
      await expectButtons(d, `${ts}-DA`, { disabled: ['Approve', 'KIV'] });
    }
  });
});

test('12028_TS27: Drafter second approval reuses the signature without the pad', tagOf('12028_TS27'), async ({ page }) => {
  const ts = '12028_TS27';
  // Precondition (not visible on screen): this Drafter signed before (12028_TS20).
  const { d } = await openAs(page, ts, 'drafter', 'Pending', 'E12028_MONTH', 'Another Pending month');
  await test.step('Click [Approve]', async () => { await d.clickApprove(); });
  await test.step('Check the signature pad is not shown', async () => { await expectNoPad(d, ts); });
  await test.step('Check Drafter Status changes to Approved', async () => {
    const ok = await d.waitForStatus('Drafter', 'Approved');
    await d.verify(`${ts}-status`, d.wfBar(), 'Drafter Status not Approved', async () => expect(ok).toBe(true));
    await d.showValue(d.wfBar());
  });
});
