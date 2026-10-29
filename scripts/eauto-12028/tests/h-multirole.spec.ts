import { test, expect } from '@playwright/test';
import { remarksFor } from '../utils/session';
import { openAs, expectNewLogRow, expectStatus } from '../utils/workflow';
import { tagOf } from '../data/priority';
import { CONFIG, required } from '../data/config';
import { expectButtons } from '../utils/checks';
import { Checks } from '../utils/combined';
import { addDays, ddmmyyyy, phraseRe, today } from '../utils/format';
import { savePdf, highlightPdf } from '../utils/pdf';

// H. Multi-role user (one login holding Drafter, Reviewer and Approver —
// SRD v1.1 REQ-003 "A user may hold more than one role (e.g. mfizni)") —
// 12028_TS42 to TS45. [unconfirmed] how the Details page offers the next
// role's action to a multi-role user is not captured; these TS assume the
// same buttons, for the step the month is at.

test('12028_TS42: Multi-role user completes a month alone', tagOf('12028_TS42'), async ({ page }) => {
  const ts = '12028_TS42';
  // Open point 9 — typed on the row: "per role" (pad shown again at the Reviewer step) or "per person" (not shown).
  const rule = required('E12028_EXPECT_SIG', 'Final signature rule').toLowerCase();
  if (rule !== 'per role' && rule !== 'per person') throw new Error(`Final signature rule must be "per role" or "per person", got "${rule}".`);
  const { s, d, month } = await openAs(page, ts, 'multi', 'Pending', 'E12028_MONTH', 'Pending month');
  const name = s.names.multi!;
  await expectButtons(d, ts, { enabled: ['Approve', 'KIV'] });
  await test.step('Click [Approve] (Drafter step) and check the "Sign to Approve" pad is shown', async () => {
    await d.clickApprove();
    await d.verify(`${ts}-pad`, d.wfBar(), 'No signature pad on the first approval', async () => expect(d.sigTitle()).toBeVisible({ timeout: 10_000 }));
    await d.captureEvidence(`${ts}-pad`);
  });
  await test.step('Sign, [Save & Approve]', async () => {
    await d.signIfAsked();
    if (!(await d.waitForStatus('Drafter', 'Approved'))) throw new Error('Drafter Status did not change to Approved.');
  });
  await test.step(`Click [Approve] (Reviewer step) and check the pad is ${rule === 'per role' ? 'shown' : 'not shown'}`, async () => {
    await d.clickApprove();
    const shown = await d.shownWithin(d.sigModal());
    await d.captureEvidence(`${ts}-reviewer-step`);
    await d.verify(`${ts}-reviewer-pad`, shown ? d.sigModal() : d.wfBar(), `Pad ${shown ? 'shown' : 'not shown'}; rule is "${rule}"`, async () => expect(shown).toBe(rule === 'per role'));
    await d.signIfAsked();
    if (!(await d.waitForStatus('Reviewer', 'Approved'))) throw new Error('Reviewer Status did not change to Approved.');
  });
  const tomorrow = addDays(today(), 1);
  await test.step(`Click [Approve] (Approver step), check the payment date popup, pick ${ddmmyyyy(tomorrow)}, [Confirm Approve]`, async () => {
    await d.approverOpenDatePopup();
    await d.verify(`${ts}-date-popup`, d.wfBar(), 'No payment date popup', async () => expect(d.dateTitle()).toBeVisible());
    await d.choosePayDate(tomorrow);
    await d.confirmApprove();
    if (!(await d.waitForStatus('Approver', 'Approved'))) throw new Error('Approver Status did not change to Approved.');
  });
  await expectButtons(d, ts, { visible: ['FMC Payment Request', 'MMSDA Payment Request'] });
  await test.step('Check the Audit Log has Drafter, Reviewer and Approver "Approved" rows', async () => {
    const counts = { Drafter: await d.logCount('Drafter', 'Approved'), Reviewer: await d.logCount('Reviewer', 'Approved'), Approver: await d.logCount('Approver', 'Approved') };
    await d.showValue(d.logTable());
    await d.verify(`${ts}-log`, d.logTable(), `Approved rows: ${JSON.stringify(counts)}`, async () => {
      for (const n of Object.values(counts)) expect(n).toBeGreaterThan(0);
    });
  });
  const pdf = await test.step('Click [FMC Payment Request] and save the PDF', async () => savePdf(await d.download(d.fmcBtn(), 'FMC Payment Request'), `${ts}-FMC`));
  await highlightPdf(page, pdf, `${ts}-checked`, { expected: ['Prepared by', 'Checked by', 'Approved by', name] }, `${ts}: ${name} in Prepared / Checked / Approved by`);
  await test.step(`Check "${name}" follows Prepared by, Checked by and Approved by`, async () => {
    // [unconfirmed] PDF text order; signature images are not readable from text — see the boxed screenshot.
    const c = new Checks(d, ts);
    for (const label of ['Prepared by', 'Checked by', 'Approved by']) {
      await c.run(label, d.fmcBtn(), () => {
        const at = pdf.text.search(phraseRe(label, 'i'));
        expect(at, `"${label}" on the PDF`).toBeGreaterThanOrEqual(0);
        expect(pdf.text.slice(at).search(phraseRe(name, 'i')), `${name} after "${label}"`).toBeGreaterThanOrEqual(0);
      });
    }
    await c.run('name three times', d.fmcBtn(), () => expect(pdf.text.match(new RegExp(phraseRe(name).source, 'gi'))?.length ?? 0).toBeGreaterThanOrEqual(3));
    c.done();
  });
  const { data, status } = await s.summaryStatusOf(month);
  await test.step(`Check the Summary shows ${month} ${CONFIG.year} Approved ×3`, async () => {
    const row = s.summary.rowAt(s.summary.monthRow(data, month));
    await s.summary.showValue(row);
    await s.summary.verify(`${ts}-summary`, row, `${status.drafter}/${status.reviewer}/${status.approver}`, async () => {
      expect([status.drafter, status.reviewer, status.approver]).toEqual(['Approved', 'Approved', 'Approved']);
    });
  });
});

test('12028_TS43: Multi-role user KIV sets Drafter Status KIV', tagOf('12028_TS43'), async ({ page }) => {
  const ts = '12028_TS43';
  const { d } = await openAs(page, ts, 'multi', 'Pending', 'E12028_MONTH', 'Pending month');
  const before = await d.logCount('Drafter', 'KIV');
  await test.step('Click [KIV]', async () => { await d.kiv(); });
  await expectStatus(d, ts, 'Drafter', 'KIV');
  await expectNewLogRow(d, ts, 'Drafter', 'KIV', before);
});

test('12028_TS44: Multi-role user Reviewer Reject then re-approves as Drafter', tagOf('12028_TS44'), async ({ page }) => {
  const ts = '12028_TS44';
  const { d } = await openAs(page, ts, 'multi', 'DA', 'E12028_MONTH', 'Drafter Approved month');
  const remarks = remarksFor(ts);
  await test.step(`Click [Reject] (Reviewer step), type "${remarks}", [Submit Reject]`, async () => { await d.reject('Reviewer', remarks); });
  await expectStatus(d, ts, 'Drafter', 'Review Again');
  await test.step('Click [Approve] (Drafter step), sign if asked', async () => { await d.approve('Drafter'); });
  await expectStatus(d, ts, 'Drafter', 'Approved');
});

test('12028_TS45: Multi-role user Approver Reject sets Reviewer Status Review Again', tagOf('12028_TS45'), async ({ page }) => {
  const ts = '12028_TS45';
  const { d } = await openAs(page, ts, 'multi', 'RA', 'E12028_MONTH', 'Reviewer Approved month');
  const before = await d.logCount('Approver', 'Rejected');
  const remarks = remarksFor(ts);
  await test.step(`Click [Reject] (Approver step), type "${remarks}", [Submit Reject]`, async () => { await d.reject('Approver', remarks); });
  await expectStatus(d, ts, 'Reviewer', 'Review Again');
  await expectNewLogRow(d, ts, 'Approver', 'Rejected', before, remarks);
});
