import { test, expect } from '@playwright/test';
import { MonthState, remarksFor } from '../utils/session';
import { openAs, expectNewLogRow, expectNoNewLogRow, expectStatus, expectStatusesUnchanged, expectSummaryStatus } from '../utils/workflow';
import { tagOf } from '../data/priority';
import { WAIT_NOTE } from '../data/expected';
import { expectButtons, expectNote, expectNoPad } from '../utils/checks';

// F. Reviewer actions — 12028_TS56 to TS71. The month typed on the row must
// be in the status the TS names. [unconfirmed] Details page not captured live.

const idOf = (t: string) => t.split(':')[0];

for (const c of [
  { title: '12028_TS56: Reviewer buttons disabled with waiting note on a Pending month', from: 'Pending' as MonthState },
  { title: '12028_TS57: Reviewer buttons disabled with waiting note on a KIV month', from: 'KIV' as MonthState },
  { title: '12028_TS58: Reviewer buttons disabled with waiting note on a Drafter Review Again month', from: 'DRA' as MonthState },
]) {
  const ts = idOf(c.title);
  test(c.title, tagOf(ts), async ({ page }) => {
    const { d } = await openAs(page, ts, 'reviewer', c.from);
    await expectButtons(d, ts, { disabled: ['Approve', 'Reject'] });
    await expectNote(d, ts, WAIT_NOTE.forDrafter);
  });
}

test('12028_TS59: Reviewer sees Approve and Reject but no KIV after the Drafter approved', tagOf('12028_TS59'), async ({ page }) => {
  const { d } = await openAs(page, '12028_TS59', 'reviewer', 'DA');
  await expectButtons(d, '12028_TS59', { enabled: ['Approve', 'Reject'], absent: ['KIV'] });
});

test('12028_TS60: Reviewer first Approve shows the signature pad', tagOf('12028_TS60'), async ({ page }) => {
  const ts = '12028_TS60';
  const { d } = await openAs(page, ts, 'reviewer', 'DA');
  await test.step('Click [Approve]', async () => { await d.clickApprove(); });
  await test.step('Check the "Sign to Approve" pad is shown', async () => {
    await d.verify(`${ts}-pad`, d.wfBar(), 'No signature pad on the first approval', async () => {
      await expect(d.sigTitle()).toBeVisible({ timeout: 10_000 });
      await expect(d.sigPad()).toBeVisible();
    });
    await d.captureEvidence(`${ts}-pad`);
  });
  await test.step('Click [Cancel] so the month stays as it was', async () => { await d.cancelSignature(); });
});

for (const c of [
  { title: '12028_TS61: Reviewer Approve sets Reviewer Status Approved', from: 'DA' as MonthState, summary: true },
  { title: '12028_TS67: Reviewer Approve on a Review Again month sets Reviewer Status Approved', from: 'RRA' as MonthState, summary: false },
]) {
  const ts = idOf(c.title);
  test(c.title, tagOf(ts), async ({ page }) => {
    const { s, d, month } = await openAs(page, ts, 'reviewer', c.from);
    const before = await d.logCount('Reviewer', 'Approved');
    const { padShown } = await test.step('Click [Approve], sign if the pad shows, [Save & Approve]', async () => d.approve('Reviewer'));
    console.log(`DETAIL:${JSON.stringify({ label: 'Signature pad', value: padShown ? 'shown and signed' : 'not shown (stored signature reused)' })}`);
    await expectStatus(d, ts, 'Reviewer', 'Approved');
    await expectNewLogRow(d, ts, 'Reviewer', 'Approved', before);
    if (c.summary) await expectSummaryStatus(s, ts, month, 'Reviewer Status', 'Approved');
  });
}

for (const c of [
  { title: '12028_TS62: Reviewer Reject with blank remarks is not submitted', remarks: '', cancel: false },
  { title: '12028_TS63: Reviewer Reject with spaces only is not submitted', remarks: '     ', cancel: false },
  { title: '12028_TS64: Reviewer Reject Cancel leaves the month unchanged', remarks: 'REMARKS', cancel: true },
]) {
  const ts = idOf(c.title);
  test(c.title, tagOf(ts), async ({ page }) => {
    const { d } = await openAs(page, ts, 'reviewer', 'DA');
    const status = await d.statuses();
    const before = await d.logCount('Reviewer', 'Rejected');
    const remarks = c.remarks === 'REMARKS' ? remarksFor(ts) : c.remarks;
    await test.step(`Click [Reject] and type ${remarks.trim() ? `"${remarks}"` : remarks ? 'spaces only' : 'nothing'}`, async () => { await d.openRejectAndType(remarks); });
    if (c.cancel) {
      await test.step('Click [Cancel] on the Reject popup', async () => { await d.cancelReject(); });
    } else {
      await test.step('Click [Submit Reject]', async () => { await d.submitReject(); });
      await test.step('Note any message, then close the popup', async () => {
        const msgs = d.takeDialogs();
        console.log(`DETAIL:${JSON.stringify({ label: 'Message shown', value: msgs.join('; ') || '(no browser message)' })}`);
        await d.captureEvidence(`${ts}-after-submit`);
        if (await d.rmkModal().isVisible()) await d.cancelReject();
      });
    }
    await expectStatusesUnchanged(d, ts, status);
    await expectNoNewLogRow(d, ts, 'Reviewer', 'Rejected', before);
  });
}

for (const c of [
  { title: '12028_TS65: Reviewer Reject with remarks sets Drafter Status Review Again', from: 'DA' as MonthState, summary: true },
  { title: '12028_TS68: Reviewer Reject on a Review Again month sets Drafter Status Review Again', from: 'RRA' as MonthState, summary: false },
]) {
  const ts = idOf(c.title);
  test(c.title, tagOf(ts), async ({ page }) => {
    const { s, d, month } = await openAs(page, ts, 'reviewer', c.from);
    const before = await d.logCount('Reviewer', 'Rejected');
    const remarks = remarksFor(ts);
    await test.step(`Click [Reject], type "${remarks}", [Submit Reject]`, async () => { await d.reject('Reviewer', remarks); });
    await expectStatus(d, ts, 'Drafter', 'Review Again');
    await expectNewLogRow(d, ts, 'Reviewer', 'Rejected', before, remarks);
    if (c.summary) await expectSummaryStatus(s, ts, month, 'Drafter Status', 'Review Again');
  });
}

test('12028_TS66: Reviewer sees Approve and Reject on a Reviewer Review Again month', tagOf('12028_TS66'), async ({ page }) => {
  const { d } = await openAs(page, '12028_TS66', 'reviewer', 'RRA');
  await expectButtons(d, '12028_TS66', { enabled: ['Approve', 'Reject'] });
});

test('12028_TS69: Reviewer buttons disabled after the Reviewer approved', tagOf('12028_TS69'), async ({ page }) => {
  const { d } = await openAs(page, '12028_TS69', 'reviewer', 'RA');
  await expectButtons(d, '12028_TS69', { disabled: ['Approve', 'Reject'] });
  await expectNote(d, '12028_TS69', WAIT_NOTE.reviewerDone);
});

test('12028_TS70: Reviewer buttons disabled on a fully approved month', tagOf('12028_TS70'), async ({ page }) => {
  const { d } = await openAs(page, '12028_TS70', 'reviewer', 'Full');
  await expectButtons(d, '12028_TS70', { disabledOrAbsent: ['Approve', 'Reject'] });
});

test('12028_TS71: Reviewer second approval reuses the signature without the pad', tagOf('12028_TS71'), async ({ page }) => {
  const ts = '12028_TS71';
  // Precondition (not visible on screen): this Reviewer signed before (12028_TS61).
  const { d } = await openAs(page, ts, 'reviewer', 'DA');
  await test.step('Click [Approve]', async () => { await d.clickApprove(); });
  await test.step('Check the signature pad is not shown', async () => { await expectNoPad(d, ts); });
  await test.step('Check Reviewer Status changes to Approved', async () => {
    const ok = await d.waitForStatus('Reviewer', 'Approved');
    await d.verify(`${ts}-status`, d.wfBar(), 'Reviewer Status not Approved', async () => expect(ok).toBe(true));
  });
});
