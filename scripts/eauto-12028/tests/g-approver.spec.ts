import { test, expect } from '@playwright/test';
import { Session, remarksFor } from '../utils/session';
import { openAs, expectNewLogRow, expectNoNewLogRow, expectStatus, expectStatusesUnchanged, expectSummaryStatus } from '../utils/workflow';
import { Checks, eachMonth, rejectNeedsRemarks } from '../utils/combined';
import { tagOf } from '../data/priority';
import { CONFIG, monthInput } from '../data/config';
import { MSG, waitNoteFor } from '../data/expected';
import { expectButtons, expectNoPad, expectNote, expectNotYourTurn } from '../utils/checks';
import { addDays, ddmmyyyy, DATE_RE, today } from '../utils/format';
import { AplDetailsPage } from '../pages/AplDetailsPage';

// G. Approver actions and payment date — 12028_TS35 to TS42.
// [unconfirmed] Details page and the payment date popup not captured live.

test('12028_TS35: Approver buttons hidden with not-your-turn note until the Reviewer approves', tagOf('12028_TS35'), async ({ page }) => {
  const ts = '12028_TS35';
  const s = new Session(page, ts);
  await s.as('approver');
  await eachMonth(s, ['Pending', 'KIV', 'DA', 'DRA', 'RRA'], async (d, state) => {
    await expectNotYourTurn(d, `${ts}-${state}`, 'Approver', state);
  });
});

test("12028_TS36: Approver first Approve with signature and tomorrow's date completes the month", tagOf('12028_TS36'), async ({ page }) => {
  const ts = '12028_TS36';
  const { s, d, month } = await openAs(page, ts, 'approver', 'RA', 'E12028_MONTH', 'Reviewer Approved month');
  await expectButtons(d, ts, { enabled: ['Approve', 'Reject'], absent: ['KIV'] });
  const before = await d.logCount('Approver', 'Approved');
  const tomorrow = addDays(today(), 1);
  await test.step('Click [Approve]', async () => { await d.clickApprove(); });
  await test.step('Check the "Sign to Approve" pad is shown', async () => {
    await d.verify(`${ts}-pad`, d.wfBar(), 'No signature pad on the first approval (has this Approver signed before?)', async () => expect(d.sigTitle()).toBeVisible({ timeout: 10_000 }));
    await d.captureEvidence(`${ts}-pad`);
  });
  await test.step('Sign and click [Save & Approve]', async () => { await d.signIfAsked(); });
  await test.step('Check the "Approve — Finance Payment Date" popup is shown', async () => {
    await d.verify(`${ts}-date-popup`, d.wfBar(), 'No payment date popup after signing', async () => expect(d.dateTitle()).toBeVisible({ timeout: 10_000 }));
    await d.showValue(d.dateModal());
  });
  await test.step(`Pick ${ddmmyyyy(tomorrow)} and click [Confirm Approve]`, async () => {
    await d.choosePayDate(tomorrow);
    await d.confirmApprove();
    if (!(await d.waitForStatus('Approver', 'Approved'))) throw new Error(`Approver Status did not change to Approved after [Confirm Approve] (message: "${d.takeDialogs().join('; ')}").`);
  });
  console.log(`DETAIL:${JSON.stringify({ label: 'Payment date picked', value: ddmmyyyy(tomorrow) })}`);
  await expectStatus(d, ts, 'Approver', 'Approved');
  await expectNewLogRow(d, ts, 'Approver', 'Approved', before);
  await test.step('Check the new "Approver — Approved" row carries the payment date', async () => {
    const rows = AplDetailsPage.matching(d.logEntries(await d.readLog()), 'Approver', 'Approved');
    const newest = rows[rows.length - 1];
    await d.verify(`${ts}-log-date`, d.logRowAt(newest.row), `Payment Date shows "${newest.paymentDate}", expected ${ddmmyyyy(tomorrow)}`, async () => expect(newest.paymentDate, 'Payment Date of the new Approver row').toBe(ddmmyyyy(tomorrow)));
  });
  await expectSummaryStatus(s, ts, month, 'Approver Status', 'Approved');
  await test.step(`Check the Summary Payment Date is ${ddmmyyyy(tomorrow)}`, async () => {
    const data = await s.summary.read();
    const cell = s.summary.cellAt(data, s.summary.monthRow(data, month), 'Payment Date');
    const shown = s.summary.monthStatus(data, month).paymentDate;
    await s.summary.showValue(cell);
    await s.summary.verify(`${ts}-payment-date`, cell, `Shows "${shown}"`, async () => expect(shown).toBe(ddmmyyyy(tomorrow)));
  });
});

test('12028_TS37: Payment date popup blocks cancel, blank, today, past, typed and pasted dates', tagOf('12028_TS37'), async ({ page }) => {
  const ts = '12028_TS37';
  const { s, d, month } = await openAs(page, ts, 'approver', 'RA', 'E12028_MONTH', 'Reviewer Approved month');
  const status = await d.statuses();
  const before = await d.logCount('Approver', 'Approved');
  const c = new Checks(d, ts);
  /** Closes the popup if open, then [Approve] again (sign if asked) to a fresh, empty popup. */
  const freshPopup = async () => {
    if (await d.dateModal().isVisible()) await d.cancelDatePopup();
    await d.approverOpenDatePopup();
  };
  await test.step('Click [Approve] (sign if asked), then [Cancel] on the payment date popup', async () => {
    await d.approverOpenDatePopup();
    await d.cancelDatePopup();
  });
  await expectStatus(d, ts, 'Approver', 'Pending');
  await expectNoNewLogRow(d, ts, 'Approver', 'Approved', before);
  await test.step(`Leave the date blank and click [Confirm Approve]: "${MSG.noDate}" is shown and the popup stays`, async () => {
    await freshPopup();
    d.takeDialogs();
    await d.confirmApprove();
    const msgs = d.takeDialogs().map(m => m.trim());
    console.log(`DETAIL:${JSON.stringify({ label: 'Payment date blank', value: msgs.join('; ') || '(no browser message)' })}`);
    await d.captureEvidence(`${ts}-blank`);
    // Mock-up line 541 `alert('Please select a payment date.')` (wording rule 2026-11-04). Live says "Please pick a future payment date.".
    await c.run('blank date', d.dateModal(), async () => {
      expect(msgs, `"${MSG.noDate}" shown`).toContain(MSG.noDate);
      await expect(d.dateModal(), 'popup still open').toBeVisible();
    });
  });
  // Today and yesterday cannot be picked: the field's earliest date is tomorrow (live Details capture
  // lines 395-399, `p.min = <local tomorrow>`). Checked from the field's min, so no date is entered here —
  // how a date is entered into the native field (fill() or not) is still Faizuddin's open question.
  await test.step('Check today and yesterday cannot be picked (earliest date is tomorrow)', async () => {
    await freshPopup();
    const t = addDays(today(), 1);
    const tomorrowIso = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
    const min = (await d.payDate().getAttribute('min')) ?? '';
    console.log(`DETAIL:${JSON.stringify({ label: 'Payment date earliest (min)', value: min || '(none)' })}`);
    await d.showValue(d.payDate());
    await c.run('today / yesterday not selectable', d.payDate(), () => expect(min, 'earliest pickable date').toBe(tomorrowIso));
  });
  const future = addDays(today(), 7);
  const iso = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, '0')}-${String(future.getDate()).padStart(2, '0')}`;
  await test.step(`Type ${ddmmyyyy(future)} into the date field`, async () => {
    await freshPopup();
    await d.payDate().click();
    await d.payDate().pressSequentially(ddmmyyyy(future).replace(/-/g, ''), { delay: 80 });
    await d.showValue(d.payDate());
    await c.run('typed date', d.payDate(), () => expect(d.payDate()).toHaveValue(''));
  });
  await test.step(`Copy ${iso} and paste it into the date field (Ctrl+V)`, async () => {
    await freshPopup();
    // Puts the text on the clipboard, as copying it elsewhere would; the paste itself is the key press.
    await page.evaluate(t => navigator.clipboard.writeText(t), iso);
    await d.payDate().click();
    await page.keyboard.press('Control+V');
    await d.showValue(d.payDate());
    await c.run('pasted date', d.payDate(), () => expect(d.payDate()).toHaveValue(''));
  });
  await test.step('Close the popup', async () => { if (await d.dateModal().isVisible()) await d.cancelDatePopup(); });
  await expectStatusesUnchanged(d, ts, status);
  await expectNoNewLogRow(d, ts, 'Approver', 'Approved', before);
  await expectSummaryStatus(s, ts, month, 'Payment Date', '-');
  c.done();
});

test('12028_TS38: Approver Reject needs remarks and returns the month to Reviewer Review Again', tagOf('12028_TS38'), async ({ page }) => {
  const ts = '12028_TS38';
  const { s, d, month } = await openAs(page, ts, 'approver', 'RA', 'E12028_MONTH', 'Reviewer Approved month');
  const remarks = remarksFor(ts);
  await rejectNeedsRemarks(d, ts, 'Approver', remarks);
  const before = await d.logCount('Approver', 'Rejected');
  await test.step(`Click [Reject], type "${remarks}", [Submit Reject]`, async () => { await d.reject('Approver', remarks); });
  await expectStatus(d, ts, 'Reviewer', 'Review Again');
  await expectNewLogRow(d, ts, 'Approver', 'Rejected', before, remarks);
  await expectSummaryStatus(s, ts, month, 'Reviewer Status', 'Review Again');
  await test.step('Check the Summary Payment Date is "-"', async () => {
    const data = await s.summary.read();
    const shown = s.summary.monthStatus(data, month).paymentDate;
    const cell = s.summary.cellAt(data, s.summary.monthRow(data, month), 'Payment Date');
    await s.summary.verify(`${ts}-payment-date`, cell, `Shows "${shown}"`, async () => expect(shown).toBe('-'));
  });
});

test('12028_TS39: Approver buttons hidden on a fully approved month', tagOf('12028_TS39'), async ({ page }) => {
  const ts = '12028_TS39';
  const s = new Session(page, ts);
  await s.as('approver');
  // Typed on the row, or the first matching month on the Summary; none → TS skipped with a note (Faizuddin, 2026-11-03).
  const { month } = await s.monthFor('E12028_MONTH', 'Full');
  await s.openListing();
  const data = await s.search();
  const before = s.summary.monthStatus(data, month).paymentDate;
  console.log(`DETAIL:${JSON.stringify({ label: 'Payment Date before', value: before })}`);
  const d = await test.step(`Click [View] on ${month}`, async () => {
    await s.summary.openMonth(data, month);
    const det = s.details;
    await det.expectOpenFor(month, CONFIG.year);
    return det;
  });
  await s.requireState(d, month, 'Full');
  await expectButtons(d, ts, { absent: ['Approve', 'Reject'] });
  await expectNote(d, ts, waitNoteFor('Approver', 'Full')!);
  await test.step('Check the Payment Date is a DD-MM-YYYY date', async () => expect(before).toMatch(DATE_RE));
  await expectSummaryStatus(s, ts, month, 'Payment Date', before);
});

test('12028_TS40: Approver second approval reuses the signature and still asks payment date', tagOf('12028_TS40'), async ({ page }) => {
  const ts = '12028_TS40';
  // Precondition (not visible on screen): this Approver signed before (12028_TS36).
  const { d } = await openAs(page, ts, 'approver', 'RA', 'E12028_MONTH', 'Another Reviewer Approved month');
  await test.step('Click [Approve]', async () => { await d.clickApprove(); });
  await test.step('Check the signature pad is not shown', async () => { await expectNoPad(d, ts); });
  await test.step('Check the "Approve — Finance Payment Date" popup is shown', async () => {
    await d.verify(`${ts}-date-popup`, d.wfBar(), 'No payment date popup', async () => expect(d.dateTitle()).toBeVisible({ timeout: 10_000 }));
    await d.captureEvidence(`${ts}-date-popup`);
  });
  await test.step('Click [Cancel] on the date popup so the month stays Reviewer Approved', async () => { await d.cancelDatePopup(); });
});

test('12028_TS41: Approver approves a month after the Reviewer re-approves it', tagOf('12028_TS41'), async ({ page }) => {
  const ts = '12028_TS41';
  const { d, month } = await openAs(page, ts, 'approver', 'RA', 'E12028_MONTH', 'Month re-approved in 12028_TS31', { typedOnly: true });
  await test.step('Check this month went through an Approver Reject (the month from 12028_TS31)', async () => {
    if ((await d.logCount('Approver', 'Rejected')) < 1) throw new Error('Precondition not met: no "Approver — Rejected" row on this month — use the month the Reviewer re-approved in 12028_TS31.');
  });
  const tomorrow = addDays(today(), 1);
  await test.step(`Click [Approve], sign if asked, pick ${ddmmyyyy(tomorrow)}, [Confirm Approve]`, async () => { await d.approverApprove(tomorrow); });
  await expectStatus(d, ts, 'Approver', 'Approved');
  await expectButtons(d, ts, { visible: ['FMC Payment Request', 'MMSDA Payment Request'] });
  console.log(`DETAIL:${JSON.stringify({ label: 'Month for 12028_TS48', value: month })}`);
});

test('12028_TS42: Approver signature kept after the payment date popup is cancelled', tagOf('12028_TS42'), async ({ page }) => {
  const ts = '12028_TS42';
  // [unconfirmed] mock-up behaviour (scenarios.json note); the Approver must never have signed before.
  const { d } = await openAs(page, ts, 'approver', 'RA', 'E12028_MONTH', 'Reviewer Approved month (Approver never signed)');
  const rowsBefore = d.logEntries(await d.readLog()).length;
  await test.step('Click [Approve] and check the "Sign to Approve" pad is shown', async () => {
    await d.clickApprove();
    await d.verify(`${ts}-pad`, d.wfBar(), 'No signature pad on the first approval (has this Approver signed before?)', async () => expect(d.sigTitle()).toBeVisible({ timeout: 10_000 }));
  });
  await test.step('Sign and click [Save & Approve]', async () => { await d.signIfAsked(); });
  await test.step('Check the "Approve — Finance Payment Date" popup is shown, then click [Cancel]', async () => {
    await d.verify(`${ts}-date-popup`, d.wfBar(), 'No payment date popup after signing', async () => expect(d.dateTitle()).toBeVisible({ timeout: 10_000 }));
    await d.cancelDatePopup();
  });
  await test.step('Check Drafter Approved, Reviewer Approved, Approver still Pending', async () => {
    const s = await d.statuses();
    await d.showValue(d.wfBar());
    await d.verify(`${ts}-statuses`, d.wfBar(), `Shows ${s.drafter}/${s.reviewer}/${s.approver}`, async () => {
      expect([s.drafter, s.reviewer, s.approver]).toEqual(['Approved', 'Approved', 'Pending']);
    });
  });
  await test.step('Check no new Audit Log row was added', async () => {
    const rowsAfter = d.logEntries(await d.readLog()).length;
    await d.showValue(d.logTable());
    await d.verify(`${ts}-log`, d.logTable(), `Audit Log rows went from ${rowsBefore} to ${rowsAfter}`, async () => expect(rowsAfter).toBe(rowsBefore));
  });
  await test.step('Click [Approve] again', async () => { await d.clickApprove(); });
  await test.step('Check the signature pad is not shown', async () => { await expectNoPad(d, ts); });
  await test.step('Check the "Approve — Finance Payment Date" popup opens directly', async () => {
    await d.verify(`${ts}-direct-popup`, d.wfBar(), 'Payment date popup did not open after the second [Approve]', async () => expect(d.dateTitle()).toBeVisible({ timeout: 10_000 }));
    await d.captureEvidence(`${ts}-date-popup-direct`);
  });
  await test.step('Click [Cancel] on the date popup so the month stays Reviewer Approved', async () => { await d.cancelDatePopup(); });
});
