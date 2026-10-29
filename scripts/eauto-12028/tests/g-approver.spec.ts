import { test, expect } from '@playwright/test';
import { Session, remarksFor } from '../utils/session';
import { openAs, expectNewLogRow, expectNoNewLogRow, expectStatus, expectStatusesUnchanged, expectSummaryStatus } from '../utils/workflow';
import { Checks, eachMonth, rejectNeedsRemarks } from '../utils/combined';
import { tagOf } from '../data/priority';
import { CONFIG, monthInput } from '../data/config';
import { WAIT_NOTE } from '../data/expected';
import { expectButtons, expectNote, expectNoPad } from '../utils/checks';
import { addDays, ddmmyyyy, DATE_RE, today } from '../utils/format';
import { AplDetailsPage } from '../pages/AplDetailsPage';

// G. Approver actions and payment date — 12028_TS35 to TS41.
// [unconfirmed] Details page and the payment date popup not captured live.

test('12028_TS35: Approver buttons disabled with waiting note until the Reviewer approves', tagOf('12028_TS35'), async ({ page }) => {
  const ts = '12028_TS35';
  const s = new Session(page, ts);
  await s.as('approver');
  await eachMonth(s, ['Pending', 'KIV', 'DA', 'DRA', 'RRA'], async (d, state) => {
    await expectButtons(d, `${ts}-${state}`, { disabled: ['Approve', 'Reject'] });
    await expectNote(d, `${ts}-${state}`, WAIT_NOTE.forReviewer);
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
    const rows = d.logEntries(await d.readLog()).filter(e => AplDetailsPage.entryRe('Approver', 'Approved').test(e.entry));
    const newest = rows[rows.length - 1];
    await d.verify(`${ts}-log-date`, d.logRowAt(newest.row), `Row has no ${ddmmyyyy(tomorrow)}`, async () => expect(newest.row.text).toContain(ddmmyyyy(tomorrow)));
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
  for (const t of [{ what: 'blank', days: null as number | null }, { what: 'today', days: 0 }, { what: 'yesterday', days: -1 }]) {
    await test.step(`Payment date ${t.what}: try it and click [Confirm Approve]`, async () => {
      await freshPopup();
      d.takeDialogs();
      let notSelectable = false;
      if (t.days !== null) {
        try { await d.choosePayDate(addDays(today(), t.days)); }
        catch (e) { notSelectable = /not selectable/.test(String(e)); if (!notSelectable) throw e; }
      }
      if (!notSelectable) await d.confirmApprove();
      const msgs = d.takeDialogs();
      const inPopup = (await d.dateModal().isVisible()) ? (await d.dateModal().innerText()).match(/[^\n]*(must|required|please|invalid|future)[^\n]*/i)?.[0] : undefined;
      const message = msgs.join('; ') || inPopup || '';
      console.log(`DETAIL:${JSON.stringify({ label: `Payment date ${t.what}`, value: notSelectable ? 'day not selectable in the picker' : message || '(no message)' })}`);
      await d.captureEvidence(`${ts}-${t.what}`);
      // [unconfirmed] exact wording not in the SRD (REQ-013 Example 2 "Rejected with a validation message").
      await c.run(`${t.what} date`, d.dateModal(), () => expect(notSelectable || message.length > 0, 'validation message or day not selectable').toBe(true));
    });
  }
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

test('12028_TS39: Approver buttons disabled on a fully approved month', tagOf('12028_TS39'), async ({ page }) => {
  const ts = '12028_TS39';
  const month = monthInput('E12028_MONTH', 'Fully approved month');
  const s = new Session(page, ts);
  await s.as('approver');
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
  await expectButtons(d, ts, { disabledOrAbsent: ['Approve', 'Reject'] });
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
  const { d, month } = await openAs(page, ts, 'approver', 'RA', 'E12028_MONTH', 'Month re-approved in 12028_TS31');
  await test.step('Check this month went through an Approver Reject (the month from 12028_TS31)', async () => {
    if ((await d.logCount('Approver', 'Rejected')) < 1) throw new Error('Precondition not met: no "Approver — Rejected" row on this month — use the month the Reviewer re-approved in 12028_TS31.');
  });
  const tomorrow = addDays(today(), 1);
  await test.step(`Click [Approve], sign if asked, pick ${ddmmyyyy(tomorrow)}, [Confirm Approve]`, async () => { await d.approverApprove(tomorrow); });
  await expectStatus(d, ts, 'Approver', 'Approved');
  await expectButtons(d, ts, { visible: ['FMC Payment Request', 'MMSDA Payment Request'] });
  console.log(`DETAIL:${JSON.stringify({ label: 'Month for 12028_TS47', value: month })}`);
});
