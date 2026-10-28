import { test, expect } from '@playwright/test';
import { MonthState, Session, remarksFor } from '../utils/session';
import { openAs, expectNewLogRow, expectNoNewLogRow, expectStatus, expectStatusesUnchanged, expectSummaryStatus } from '../utils/workflow';
import { tagOf } from '../data/priority';
import { CONFIG, monthInput, required } from '../data/config';
import { WAIT_NOTE } from '../data/expected';
import { expectButtons, expectNote, expectNoPad } from '../utils/checks';
import { addDays, ddmmyyyy, DATE_RE, today } from '../utils/format';
import { AplDetailsPage } from '../pages/AplDetailsPage';

// G. Approver actions and payment date — 12028_TS72 to TS94.
// [unconfirmed] Details page and the payment date popup not captured live.

const idOf = (t: string) => t.split(':')[0];

for (const c of [
  { title: '12028_TS72: Approver buttons disabled with waiting note on a Pending month', from: 'Pending' as MonthState },
  { title: '12028_TS73: Approver buttons disabled with waiting note on a KIV month', from: 'KIV' as MonthState },
  { title: '12028_TS74: Approver buttons disabled with waiting note when only the Drafter approved', from: 'DA' as MonthState },
  { title: '12028_TS75: Approver buttons disabled with waiting note on a Drafter Review Again month', from: 'DRA' as MonthState },
  { title: '12028_TS76: Approver buttons disabled with waiting note on a Reviewer Review Again month', from: 'RRA' as MonthState },
]) {
  const ts = idOf(c.title);
  test(c.title, tagOf(ts), async ({ page }) => {
    const { d } = await openAs(page, ts, 'approver', c.from);
    await expectButtons(d, ts, { disabled: ['Approve', 'Reject'] });
    await expectNote(d, ts, WAIT_NOTE.forReviewer);
  });
}

test('12028_TS77: Approver sees Approve and Reject but no KIV after the Reviewer approved', tagOf('12028_TS77'), async ({ page }) => {
  const { d } = await openAs(page, '12028_TS77', 'approver', 'RA');
  await expectButtons(d, '12028_TS77', { enabled: ['Approve', 'Reject'], absent: ['KIV'] });
});

test('12028_TS78: Approver first Approve shows the signature pad then the payment date popup', tagOf('12028_TS78'), async ({ page }) => {
  const ts = '12028_TS78';
  const { d } = await openAs(page, ts, 'approver', 'RA');
  await test.step('Click [Approve]', async () => { await d.clickApprove(); });
  await test.step('Check the "Sign to Approve" pad is shown', async () => {
    await d.verify(`${ts}-pad`, d.wfBar(), 'No signature pad on the first approval', async () => {
      await expect(d.sigTitle()).toBeVisible({ timeout: 10_000 });
    });
    await d.captureEvidence(`${ts}-pad`);
  });
  await test.step('Sign and click [Save & Approve]', async () => { await d.signIfAsked(); });
  await test.step('Check the "Approve — Finance Payment Date" popup is shown', async () => {
    await d.verify(`${ts}-date-popup`, d.wfBar(), 'No payment date popup after signing', async () => {
      await expect(d.dateTitle()).toBeVisible({ timeout: 10_000 });
    });
    await d.showValue(d.dateModal());
    await d.captureEvidence(`${ts}-date-popup`);
  });
  await test.step('Click [Cancel] on the date popup so the month stays Reviewer Approved', async () => { await d.cancelDatePopup(); });
});

test("12028_TS79: Approver Approve with tomorrow's date sets Approver Status Approved", tagOf('12028_TS79'), async ({ page }) => {
  const ts = '12028_TS79';
  const { s, d, month } = await openAs(page, ts, 'approver', 'RA');
  const before = await d.logCount('Approver', 'Approved');
  const tomorrow = addDays(today(), 1);
  await test.step(`Click [Approve], sign if asked, pick ${ddmmyyyy(tomorrow)}, [Confirm Approve]`, async () => { await d.approverApprove(tomorrow); });
  console.log(`DETAIL:${JSON.stringify({ label: 'Payment date picked', value: ddmmyyyy(tomorrow) })}`);
  console.log(`DETAIL:${JSON.stringify({ label: 'Month', value: month })}`);
  await expectStatus(d, ts, 'Approver', 'Approved');
  await expectNewLogRow(d, ts, 'Approver', 'Approved', before);
  await test.step('Check the new "Approver — Approved" row carries the payment date', async () => {
    const log = await d.readLog();
    const rows = d.logEntries(log).filter(e => AplDetailsPage.entryRe('Approver', 'Approved').test(e.entry));
    const newest = rows[rows.length - 1];
    await d.verify(`${ts}-log-date`, d.logRowAt(newest.row), `Row has no ${ddmmyyyy(tomorrow)}`, async () => {
      expect(newest.row.text).toContain(ddmmyyyy(tomorrow));
    });
  });
  await expectSummaryStatus(s, ts, month, 'Approver Status', 'Approved');
});

test('12028_TS80: Payment Date shows the picked date in DD-MM-YYYY', tagOf('12028_TS80'), async ({ page }) => {
  const ts = '12028_TS80';
  const month = monthInput('E12028_MONTH', 'Month approved in 12028_TS79');
  const picked = required('E12028_PAY_DATE', 'Payment date picked in 12028_TS79 (DD-MM-YYYY)');
  if (!DATE_RE.test(picked)) throw new Error(`"${picked}" is not DD-MM-YYYY.`);
  const s = new Session(page, ts);
  await s.as('drafter');
  await s.openListing();
  const data = await s.search();
  await test.step(`Check ${month}'s Payment Date is ${picked}`, async () => {
    const cell = s.summary.cellAt(data, s.summary.monthRow(data, month), 'Payment Date');
    const shown = s.summary.monthStatus(data, month).paymentDate;
    await s.summary.showValue(cell);
    await s.summary.verify(`${ts}-payment-date`, cell, `Shows "${shown}", expected "${picked}"`, async () => expect(shown).toBe(picked));
  });
});

test('12028_TS81: Payment date popup Cancel leaves Approver Status Pending', tagOf('12028_TS81'), async ({ page }) => {
  const ts = '12028_TS81';
  const { s, d, month } = await openAs(page, ts, 'approver', 'RA');
  const before = await d.logCount('Approver', 'Approved');
  await test.step('Click [Approve], sign if asked, up to the payment date popup', async () => { await d.approverOpenDatePopup(); });
  await test.step('Click [Cancel] on the date popup', async () => { await d.cancelDatePopup(); });
  await expectStatus(d, ts, 'Approver', 'Pending');
  await expectNoNewLogRow(d, ts, 'Approver', 'Approved', before);
  await expectSummaryStatus(s, ts, month, 'Payment Date', '-');
});

for (const c of [
  { title: '12028_TS82: Blank payment date is rejected', days: null as number | null },
  { title: "12028_TS83: Today's date is rejected as payment date", days: 0 },
  { title: "12028_TS84: Yesterday's date is rejected as payment date", days: -1 },
]) {
  const ts = idOf(c.title);
  test(c.title, tagOf(ts), async ({ page }) => {
    const { d } = await openAs(page, ts, 'approver', 'RA');
    const status = await d.statuses();
    await test.step('Click [Approve], sign if asked, up to the payment date popup', async () => { await d.approverOpenDatePopup(); });
    let notSelectable = false;
    if (c.days !== null) {
      const date = addDays(today(), c.days);
      await test.step(`Try to pick ${ddmmyyyy(date)}`, async () => {
        try { await d.choosePayDate(date); }
        catch (e) { notSelectable = /not selectable/.test(String(e)); if (!notSelectable) throw e; }
      });
    }
    d.takeDialogs();
    if (!notSelectable) await test.step('Click [Confirm Approve]', async () => { await d.confirmApprove(); });
    await test.step('Check a validation message is shown (or the day cannot be picked)', async () => {
      const msgs = d.takeDialogs();
      const inPopup = (await d.dateModal().isVisible()) ? (await d.dateModal().innerText()).match(/(must|required|please|invalid|future)[^\n]*/i)?.[0] : undefined;
      const message = msgs.join('; ') || inPopup || '';
      console.log(`DETAIL:${JSON.stringify({ label: 'Validation', value: notSelectable ? 'day not selectable in the picker' : message || '(none)' })}`);
      await d.captureEvidence(`${ts}-validation`);
      // [unconfirmed] exact wording not in the SRD (REQ-013 Example 2 "Rejected with a validation message").
      await d.verify(`${ts}-no-message`, d.dateModal(), 'No validation message', async () => expect(notSelectable || message.length > 0).toBe(true));
    });
    await test.step('Close the popup', async () => { if (await d.dateModal().isVisible()) await d.cancelDatePopup(); });
    await expectStatusesUnchanged(d, ts, status);
  });
}

for (const c of [
  { title: '12028_TS85: Typed payment date is blocked', how: 'type' as const },
  { title: '12028_TS86: Pasted payment date is blocked', how: 'paste' as const },
]) {
  const ts = idOf(c.title);
  test(c.title, tagOf(ts), async ({ page }) => {
    const { d } = await openAs(page, ts, 'approver', 'RA');
    await test.step('Click [Approve], sign if asked, up to the payment date popup', async () => { await d.approverOpenDatePopup(); });
    const future = addDays(today(), 7);
    const iso = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, '0')}-${String(future.getDate()).padStart(2, '0')}`;
    if (c.how === 'type') {
      await test.step(`Type ${ddmmyyyy(future)} into the date field`, async () => {
        await d.payDate().click();
        await d.payDate().pressSequentially(ddmmyyyy(future).replace(/-/g, ''), { delay: 80 });
      });
    } else {
      await test.step(`Copy ${iso} and paste it into the date field (Ctrl+V)`, async () => {
        // Puts the text on the clipboard, as copying it elsewhere would; the paste itself is the key press.
        await page.evaluate(t => navigator.clipboard.writeText(t), iso);
        await d.payDate().click();
        await page.keyboard.press('Control+V');
      });
    }
    await test.step('Check the date field is still empty', async () => {
      await d.showValue(d.payDate());
      await d.verify(`${ts}-accepted`, d.payDate(), `The ${c.how}d date was accepted`, async () => expect(d.payDate()).toHaveValue(''));
    });
    await test.step('Close the popup', async () => { await d.cancelDatePopup(); });
  });
}

for (const c of [
  { title: '12028_TS87: Approver Reject with blank remarks is not submitted', remarks: '', cancel: false },
  { title: '12028_TS88: Approver Reject with spaces only is not submitted', remarks: '     ', cancel: false },
  { title: '12028_TS89: Approver Reject Cancel leaves the month unchanged', remarks: 'REMARKS', cancel: true },
]) {
  const ts = idOf(c.title);
  test(c.title, tagOf(ts), async ({ page }) => {
    const { d } = await openAs(page, ts, 'approver', 'RA');
    const status = await d.statuses();
    const before = await d.logCount('Approver', 'Rejected');
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
    await expectNoNewLogRow(d, ts, 'Approver', 'Rejected', before);
  });
}

test('12028_TS90: Approver Reject with remarks sets Reviewer Status Review Again', tagOf('12028_TS90'), async ({ page }) => {
  const ts = '12028_TS90';
  const { s, d, month } = await openAs(page, ts, 'approver', 'RA');
  const before = await d.logCount('Approver', 'Rejected');
  const remarks = remarksFor(ts);
  await test.step(`Click [Reject], type "${remarks}", [Submit Reject]`, async () => { await d.reject('Approver', remarks); });
  await expectStatus(d, ts, 'Reviewer', 'Review Again');
  await expectNewLogRow(d, ts, 'Approver', 'Rejected', before, remarks);
  await expectSummaryStatus(s, ts, month, 'Reviewer Status', 'Review Again');
});

test('12028_TS91: Approver Reject keeps Payment Date as -', tagOf('12028_TS91'), async ({ page }) => {
  const ts = '12028_TS91';
  const month = monthInput('E12028_MONTH', 'Month rejected in 12028_TS90');
  const s = new Session(page, ts);
  await s.as('drafter');
  await s.openListing();
  const data = await s.search();
  await test.step(`Check ${month} is Reviewer Review Again with Payment Date "-"`, async () => {
    const st = s.summary.monthStatus(data, month);
    if (st.reviewer !== 'Review Again') throw new Error(`Precondition not met: ${month} Reviewer Status is "${st.reviewer}", the TS needs the month the Approver rejected (Review Again).`);
    const cell = s.summary.cellAt(data, s.summary.monthRow(data, month), 'Payment Date');
    await s.summary.showValue(cell);
    await s.summary.verify(`${ts}-payment-date`, cell, `Shows "${st.paymentDate}", expected "-"`, async () => expect(st.paymentDate).toBe('-'));
  });
});

test('12028_TS92: Approver buttons disabled on a fully approved month', tagOf('12028_TS92'), async ({ page }) => {
  const ts = '12028_TS92';
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
  await expectSummaryStatus(s, ts, month, 'Payment Date', before);
  await test.step('Check the Payment Date is DD-MM-YYYY', async () => expect(before).toMatch(DATE_RE));
});

test('12028_TS93: Approver second approval reuses the signature and still asks payment date', tagOf('12028_TS93'), async ({ page }) => {
  const ts = '12028_TS93';
  // Precondition (not visible on screen): this Approver signed before (12028_TS79).
  const { d } = await openAs(page, ts, 'approver', 'RA');
  await test.step('Click [Approve]', async () => { await d.clickApprove(); });
  await test.step('Check the signature pad is not shown', async () => { await expectNoPad(d, ts); });
  await test.step('Check the "Approve — Finance Payment Date" popup is shown', async () => {
    await d.verify(`${ts}-date-popup`, d.wfBar(), 'No payment date popup', async () => expect(d.dateTitle()).toBeVisible({ timeout: 10_000 }));
    await d.captureEvidence(`${ts}-date-popup`);
  });
  await test.step('Click [Cancel] on the date popup so the month stays Reviewer Approved', async () => { await d.cancelDatePopup(); });
});

test('12028_TS94: Approver approves a month after the Reviewer re-approves it', tagOf('12028_TS94'), async ({ page }) => {
  const ts = '12028_TS94';
  const { d } = await openAs(page, ts, 'approver', 'RA');
  await test.step('Check this month went through an Approver Reject (the month from 12028_TS67)', async () => {
    const n = await d.logCount('Approver', 'Rejected');
    if (n < 1) throw new Error('Precondition not met: no "Approver — Rejected" row on this month — use the month the Reviewer re-approved in 12028_TS67.');
  });
  const tomorrow = addDays(today(), 1);
  await test.step(`Click [Approve], sign if asked, pick ${ddmmyyyy(tomorrow)}, [Confirm Approve]`, async () => { await d.approverApprove(tomorrow); });
  await expectStatus(d, ts, 'Approver', 'Approved');
  await expectButtons(d, ts, { visible: ['FMC Payment Request', 'MMSDA Payment Request'] });
});
