import { test, expect } from '@playwright/test';
import { Session, remarksFor } from '../utils/session';
import { openAs, expectNewLogRow, expectStatus } from '../utils/workflow';
import { tagOf } from '../data/priority';
import { monthInput, required } from '../data/config';
import { expectButtons } from '../utils/checks';
import { addDays, ddmmyyyy, phraseRe, today } from '../utils/format';
import { savePdf, highlightPdf } from '../utils/pdf';

// H. Multi-role user (one login holding Drafter, Reviewer and Approver —
// SRD v1.1 REQ-003 "A user may hold more than one role (e.g. mfizni)") —
// 12028_TS95 to TS103. [unconfirmed] how the Details page offers the next
// role's action to a multi-role user is not captured; these TS assume the
// same buttons, for the step the month is at.

test('12028_TS95: Multi-role user sees Drafter Approve and KIV on a Pending month', tagOf('12028_TS95'), async ({ page }) => {
  const { d } = await openAs(page, '12028_TS95', 'multi', 'Pending');
  await expectButtons(d, '12028_TS95', { enabled: ['Approve', 'KIV'] });
});

test('12028_TS96: Multi-role user first Drafter Approve shows the signature pad', tagOf('12028_TS96'), async ({ page }) => {
  const ts = '12028_TS96';
  const { d } = await openAs(page, ts, 'multi', 'Pending');
  await test.step('Click [Approve]', async () => { await d.clickApprove(); });
  await test.step('Check the "Sign to Approve" pad is shown', async () => {
    await d.verify(`${ts}-pad`, d.wfBar(), 'No signature pad on the first approval', async () => expect(d.sigTitle()).toBeVisible({ timeout: 10_000 }));
    await d.captureEvidence(`${ts}-pad`);
  });
  await test.step('Click [Cancel] so the month stays Pending', async () => { await d.cancelSignature(); });
});

test('12028_TS97: Multi-role user Reviewer step signature pad follows the final signature rule', tagOf('12028_TS97'), async ({ page }) => {
  const ts = '12028_TS97';
  // Open point 9 — typed on the row: "per role" (pad shown again) or "per person" (not shown).
  const rule = required('E12028_EXPECT_SIG', 'Final signature rule').toLowerCase();
  if (rule !== 'per role' && rule !== 'per person') throw new Error(`Final signature rule must be "per role" or "per person", got "${rule}".`);
  const { d } = await openAs(page, ts, 'multi', 'DA');
  await test.step('Click [Approve] (Reviewer step)', async () => { await d.clickApprove(); });
  await test.step(`Check the signature pad is ${rule === 'per role' ? 'shown' : 'not shown'}`, async () => {
    const shown = await d.shownWithin(d.sigModal());
    await d.captureEvidence(`${ts}-after-approve`);
    await d.verify(`${ts}-pad`, shown ? d.sigModal() : d.wfBar(), `Pad ${shown ? 'shown' : 'not shown'}; rule is "${rule}"`, async () => expect(shown).toBe(rule === 'per role'));
  });
  await test.step('Sign if the pad shows and finish the approval', async () => { await d.signIfAsked(); });
  await test.step('Check Reviewer Status changes to Approved', async () => {
    const ok = await d.waitForStatus('Reviewer', 'Approved');
    await d.verify(`${ts}-status`, d.wfBar(), 'Reviewer Status not Approved', async () => expect(ok).toBe(true));
  });
});

test('12028_TS98: Multi-role user Approver step asks for the payment date', tagOf('12028_TS98'), async ({ page }) => {
  const ts = '12028_TS98';
  const { d } = await openAs(page, ts, 'multi', 'RA');
  const tomorrow = addDays(today(), 1);
  await test.step('Click [Approve] (Approver step), sign if asked', async () => { await d.approverOpenDatePopup(); });
  await test.step('Check the "Approve — Finance Payment Date" popup is shown', async () => {
    await d.verify(`${ts}-date-popup`, d.wfBar(), 'No payment date popup', async () => expect(d.dateTitle()).toBeVisible());
    await d.captureEvidence(`${ts}-date-popup`);
  });
  await test.step(`Pick ${ddmmyyyy(tomorrow)} and click [Confirm Approve]`, async () => {
    await d.choosePayDate(tomorrow);
    await d.confirmApprove();
    if (!(await d.waitForStatus('Approver', 'Approved'))) throw new Error('Approver Status did not change to Approved after [Confirm Approve].');
  });
  await expectStatus(d, ts, 'Approver', 'Approved');
});

test('12028_TS99: Multi-role user completes a month alone', tagOf('12028_TS99'), async ({ page }) => {
  const ts = '12028_TS99';
  const month = monthInput('E12028_MONTH', 'Month completed in 12028_TS98');
  const s = new Session(page, ts);
  await s.as('multi');
  await s.openListing();
  const data = await s.search();
  await test.step(`Check the Summary shows ${month} Approved ×3`, async () => {
    const st = s.summary.monthStatus(data, month);
    const row = s.summary.rowAt(s.summary.monthRow(data, month));
    await s.summary.showValue(row);
    await s.summary.verify(`${ts}-summary`, row, `${st.drafter}/${st.reviewer}/${st.approver}`, async () => {
      expect([st.drafter, st.reviewer, st.approver]).toEqual(['Approved', 'Approved', 'Approved']);
    });
  });
  const d = await test.step(`Click [View] on ${month}`, async () => {
    await s.summary.openMonth(data, month);
    return s.details;
  });
  await expectButtons(d, ts, { visible: ['FMC Payment Request', 'MMSDA Payment Request'] });
  await test.step('Check the Audit Log has Drafter, Reviewer and Approver "Approved" rows', async () => {
    const counts = { Drafter: await d.logCount('Drafter', 'Approved'), Reviewer: await d.logCount('Reviewer', 'Approved'), Approver: await d.logCount('Approver', 'Approved') };
    await d.showValue(d.logTable());
    await d.verify(`${ts}-log`, d.logTable(), `Approved rows: ${JSON.stringify(counts)}`, async () => {
      expect(counts.Drafter).toBeGreaterThan(0);
      expect(counts.Reviewer).toBeGreaterThan(0);
      expect(counts.Approver).toBeGreaterThan(0);
    });
  });
});

test('12028_TS100: Multi-role user KIV sets Drafter Status KIV', tagOf('12028_TS100'), async ({ page }) => {
  const ts = '12028_TS100';
  const { d } = await openAs(page, ts, 'multi', 'Pending');
  const before = await d.logCount('Drafter', 'KIV');
  await test.step('Click [KIV]', async () => { await d.kiv(); });
  await expectStatus(d, ts, 'Drafter', 'KIV');
  await expectNewLogRow(d, ts, 'Drafter', 'KIV', before);
});

test('12028_TS101: Multi-role user Reviewer Reject then re-approves as Drafter', tagOf('12028_TS101'), async ({ page }) => {
  const ts = '12028_TS101';
  const { d } = await openAs(page, ts, 'multi', 'DA');
  const remarks = remarksFor(ts);
  await test.step(`Click [Reject] (Reviewer step), type "${remarks}", [Submit Reject]`, async () => { await d.reject('Reviewer', remarks); });
  await expectStatus(d, ts, 'Drafter', 'Review Again');
  await test.step('Click [Approve] (Drafter step), sign if asked', async () => { await d.approve('Drafter'); });
  await expectStatus(d, ts, 'Drafter', 'Approved');
});

test('12028_TS102: Multi-role user Approver Reject sets Reviewer Status Review Again', tagOf('12028_TS102'), async ({ page }) => {
  const ts = '12028_TS102';
  const { d } = await openAs(page, ts, 'multi', 'RA');
  const before = await d.logCount('Approver', 'Rejected');
  const remarks = remarksFor(ts);
  await test.step(`Click [Reject] (Approver step), type "${remarks}", [Submit Reject]`, async () => { await d.reject('Approver', remarks); });
  await expectStatus(d, ts, 'Reviewer', 'Review Again');
  await expectNewLogRow(d, ts, 'Approver', 'Rejected', before, remarks);
});

test('12028_TS103: Multi-role user name shows in Prepared Checked and Approved by', tagOf('12028_TS103'), async ({ page }) => {
  const ts = '12028_TS103';
  const { s, d } = await openAs(page, ts, 'multi', 'Full');
  const name = s.names.multi!;
  const pdf = await test.step('Click [FMC Payment Request] and save the PDF', async () => savePdf(await d.download(d.fmcBtn(), 'FMC Payment Request'), `${ts}-FMC`));
  await highlightPdf(page, pdf, `${ts}-checked`, { expected: ['Prepared by', 'Checked by', 'Approved by', name] }, `${ts}: ${name} in Prepared / Checked / Approved by`);
  await test.step(`Check "${name}" follows Prepared by, Checked by and Approved by`, async () => {
    // [unconfirmed] PDF text order: each block's name is looked for after its own label.
    // Signature images cannot be read from text — see the highlighted screenshot.
    for (const label of ['Prepared by', 'Checked by', 'Approved by']) {
      const at = pdf.text.search(phraseRe(label, 'i'));
      expect(at, `"${label}" on the PDF`).toBeGreaterThanOrEqual(0);
      expect(pdf.text.slice(at).search(phraseRe(name, 'i')), `${name} after "${label}"`).toBeGreaterThanOrEqual(0);
    }
    expect(pdf.text.match(new RegExp(phraseRe(name).source, 'gi'))?.length ?? 0, `${name} appears in all three blocks`).toBeGreaterThanOrEqual(3);
  });
});
