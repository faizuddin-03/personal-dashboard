import { test, expect } from '@playwright/test';
import { MonthState } from '../utils/session';
import { openAs, expectNewLogRow, expectNoNewLogRow, expectStatus, expectSummaryStatus } from '../utils/workflow';
import { tagOf } from '../data/priority';
import { required } from '../data/config';
import { RoleKey } from '../data/users';
import { WAIT_NOTE } from '../data/expected';
import { expectButtons, expectNote, expectNoPad } from '../utils/checks';

// E. Drafter actions — 12028_TS41 to TS55.
// Each workflow TS acts on the month typed on its row; the month must already
// be in the status the TS names (checked first, the TS stops with the reason
// if not). [unconfirmed] Details page not captured live.

const idOf = (t: string) => t.split(':')[0];

test('12028_TS41: Drafter sees Approve and KIV but no Reject on a Pending month', tagOf('12028_TS41'), async ({ page }) => {
  const { d } = await openAs(page, '12028_TS41', 'drafter', 'Pending');
  await expectButtons(d, '12028_TS41', { enabled: ['Approve', 'KIV'], absent: ['Reject'] });
});

test('12028_TS42: Drafter first Approve shows the signature pad', tagOf('12028_TS42'), async ({ page }) => {
  const ts = '12028_TS42';
  const { d } = await openAs(page, ts, 'drafter', 'Pending');
  await test.step('Click [Approve]', async () => { await d.clickApprove(); });
  await test.step('Check the "Sign to Approve" pad is shown', async () => {
    await d.verify(`${ts}-pad`, d.wfBar(), 'No signature pad on the first approval', async () => {
      await expect(d.sigTitle()).toBeVisible({ timeout: 10_000 });
      await expect(d.sigPad()).toBeVisible();
    });
    await d.showValue(d.sigModal());
    await d.captureEvidence(`${ts}-pad`);
  });
  await test.step('Click [Cancel] so the month stays Pending', async () => { await d.cancelSignature(); });
});

test('12028_TS43: Signature pad Clear empties the pad', tagOf('12028_TS43'), async ({ page }) => {
  const ts = '12028_TS43';
  const { d } = await openAs(page, ts, 'drafter', 'Pending');
  await test.step('Click [Approve]', async () => { await d.clickApprove(); });
  if (!(await d.shownWithin(d.sigModal(), 10_000))) throw new Error('The signature pad did not open — this Drafter has signed before; use a Drafter who has never signed.');
  const blank = await test.step('Look at the empty pad', async () => d.padPicture());
  await test.step('Draw a signature', async () => { await d.drawSignature(); });
  const drawn = await d.padPicture();
  await test.step('Click [Clear]', async () => { await d.demoHighlight(d.sigClear()); await d.sigClear().click(); });
  await test.step('Check the pad is empty again', async () => {
    const cleared = await d.padPicture();
    await d.verify(`${ts}-not-cleared`, d.sigPad(), 'Strokes still on the pad after Clear', async () => {
      expect(drawn.equals(blank), 'drawing changed the pad').toBe(false);
      expect(cleared.equals(blank), 'pad after Clear equals the empty pad').toBe(true);
    });
    await d.captureEvidence(`${ts}-cleared`, d.sigModal());
  });
  await test.step('Click [Cancel] so the month stays Pending', async () => { await d.cancelSignature(); });
});

test('12028_TS44: Signature pad Cancel leaves Drafter Status Pending', tagOf('12028_TS44'), async ({ page }) => {
  const ts = '12028_TS44';
  const { d } = await openAs(page, ts, 'drafter', 'Pending');
  const before = await d.logCount('Drafter', 'Approved');
  await test.step('Click [Approve]', async () => { await d.clickApprove(); });
  if (!(await d.shownWithin(d.sigModal(), 10_000))) throw new Error('The signature pad did not open — this Drafter has signed before; use a Drafter who has never signed.');
  await test.step('Click [Cancel] on the pad', async () => { await d.cancelSignature(); });
  await expectStatus(d, ts, 'Drafter', 'Pending');
  await expectNoNewLogRow(d, ts, 'Drafter', 'Approved', before);
});

const APPROVE = [
  { title: '12028_TS45: Drafter Save and Approve sets Drafter Status Approved', role: 'drafter' as RoleKey, from: 'Pending' as MonthState, summary: true },
  { title: '12028_TS47: Drafter Approve on a Review Again month sets Drafter Status Approved', role: 'drafter' as RoleKey, from: 'DRA' as MonthState, summary: false },
  { title: '12028_TS53: Second Drafter user can approve a Pending month', role: 'drafter2' as RoleKey, from: 'Pending' as MonthState, summary: false },
];
for (const c of APPROVE) {
  const ts = idOf(c.title);
  test(c.title, tagOf(ts), async ({ page }) => {
    const { s, d, month } = await openAs(page, ts, c.role, c.from);
    const before = await d.logCount('Drafter', 'Approved');
    const { padShown } = await test.step('Click [Approve], sign if the pad shows, [Save & Approve]', async () => d.approve('Drafter'));
    console.log(`DETAIL:${JSON.stringify({ label: 'Signature pad', value: padShown ? 'shown and signed' : 'not shown (stored signature reused)' })}`);
    await expectStatus(d, ts, 'Drafter', 'Approved');
    await expectNewLogRow(d, ts, 'Drafter', 'Approved', before);
    if (c.summary) {
      const { data, status } = await s.summaryStatusOf(month);
      await test.step('Check the Summary shows Drafter Status Approved', async () => {
        const cell = s.summary.cellAt(data, s.summary.monthRow(data, month), 'Drafter Status');
        await s.summary.showValue(cell);
        await s.summary.verify(`${ts}-summary`, cell, `Summary Drafter Status "${status.drafter}"`, async () => expect(status.drafter).toBe('Approved'));
      });
    }
  });
}

const KIV = [
  { title: '12028_TS46: Drafter KIV on a Pending month sets Drafter Status KIV', from: 'Pending' as MonthState },
  { title: '12028_TS48: Drafter KIV on a Review Again month sets Drafter Status KIV', from: 'DRA' as MonthState },
];
for (const c of KIV) {
  const ts = idOf(c.title);
  test(c.title, tagOf(ts), async ({ page }) => {
    const { s, d, month } = await openAs(page, ts, 'drafter', c.from);
    const before = await d.logCount('Drafter', 'KIV');
    await test.step('Click [KIV]', async () => { await d.kiv(); });
    await expectStatus(d, ts, 'Drafter', 'KIV');
    await expectNewLogRow(d, ts, 'Drafter', 'KIV', before);
    const { data, status } = await s.summaryStatusOf(month);
    await test.step('Check the Summary shows Drafter Status KIV', async () => {
      const cell = s.summary.cellAt(data, s.summary.monthRow(data, month), 'Drafter Status');
      await s.summary.verify(`${ts}-summary`, cell, `Summary Drafter Status "${status.drafter}"`, async () => expect(status.drafter).toBe('KIV'));
    });
  });
}

test('12028_TS49: Drafter action on a KIV month follows the final KIV rule', tagOf('12028_TS49'), async ({ page }) => {
  const ts = '12028_TS49';
  // Open point 1 — the rule is typed on the row: "can act" or "locked"; never assumed.
  const rule = required('E12028_EXPECT_KIV', 'Final KIV rule').toLowerCase();
  if (rule !== 'can act' && rule !== 'locked') throw new Error(`Final KIV rule must be "can act" or "locked", got "${rule}".`);
  const { d } = await openAs(page, ts, 'drafter', 'KIV');
  if (rule === 'can act') await expectButtons(d, ts, { enabled: ['Approve', 'KIV'] });
  else await expectButtons(d, ts, { disabledOrAbsent: ['Approve', 'KIV'] });
});

test('12028_TS50: Drafter buttons disabled after the Drafter approved', tagOf('12028_TS50'), async ({ page }) => {
  const { d } = await openAs(page, '12028_TS50', 'drafter', 'DA');
  await expectButtons(d, '12028_TS50', { disabled: ['Approve', 'KIV'] });
  await expectNote(d, '12028_TS50', WAIT_NOTE.drafterDone);
});

test('12028_TS51: Drafter buttons disabled on a Reviewer Review Again month', tagOf('12028_TS51'), async ({ page }) => {
  const { d } = await openAs(page, '12028_TS51', 'drafter', 'RRA');
  await expectButtons(d, '12028_TS51', { disabled: ['Approve', 'KIV'] });
});

test('12028_TS52: Drafter buttons disabled on a fully approved month', tagOf('12028_TS52'), async ({ page }) => {
  const { d } = await openAs(page, '12028_TS52', 'drafter', 'Full');
  await expectButtons(d, '12028_TS52', { disabledOrAbsent: ['Approve', 'KIV'] });
});

test('12028_TS54: Second Drafter user cannot approve a month the first Drafter approved', tagOf('12028_TS54'), async ({ page }) => {
  const { d } = await openAs(page, '12028_TS54', 'drafter2', 'DA');
  await expectButtons(d, '12028_TS54', { disabled: ['Approve', 'KIV'] });
});

test('12028_TS55: Drafter second approval reuses the signature without the pad', tagOf('12028_TS55'), async ({ page }) => {
  const ts = '12028_TS55';
  // Precondition (not visible on screen): this Drafter signed before (12028_TS45).
  const { d } = await openAs(page, ts, 'drafter', 'Pending');
  await test.step('Click [Approve]', async () => { await d.clickApprove(); });
  await test.step('Check the signature pad is not shown', async () => { await expectNoPad(d, ts); });
  await test.step('Check Drafter Status changes to Approved', async () => {
    const ok = await d.waitForStatus('Drafter', 'Approved');
    await d.verify(`${ts}-status`, d.wfBar(), 'Drafter Status not Approved', async () => expect(ok).toBe(true));
    await d.showValue(d.wfBar());
  });
});
