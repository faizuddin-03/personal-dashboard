import { test, expect } from '@playwright/test';
import { MonthState } from '../utils/session';
import { openAs } from '../utils/workflow';
import { tagOf } from '../data/priority';
import { CONFIG } from '../data/config';
import { RoleKey } from '../data/users';
import { expectButtons } from '../utils/checks';
import { savePdf } from '../utils/pdf';

// J. Payment Request download — 12028_TS108 to TS116, TS119.
// Manual only (never automated): 12028_TS117 (no-role user on the download
// address) and 12028_TS118 (download address of a not-fully-approved month).
// [unconfirmed] the download bar is not captured live (mock-up #inv-bar).

const idOf = (t: string) => t.split(':')[0];

for (const c of [
  { title: '12028_TS108: Download buttons hidden with pending note on a Pending month', from: 'Pending' as MonthState },
  { title: '12028_TS109: Download buttons hidden with pending note on a KIV month', from: 'KIV' as MonthState },
  { title: '12028_TS110: Download buttons hidden with pending note when only the Drafter approved', from: 'DA' as MonthState },
  { title: '12028_TS111: Download buttons hidden with pending note on a Drafter Review Again month', from: 'DRA' as MonthState },
  { title: '12028_TS112: Download buttons hidden with pending note when the Approver has not approved', from: 'RA' as MonthState },
  { title: '12028_TS113: Download buttons hidden with pending note on a Reviewer Review Again month', from: 'RRA' as MonthState },
]) {
  const ts = idOf(c.title);
  test(c.title, tagOf(ts), async ({ page }) => {
    const { d } = await openAs(page, ts, 'approver', c.from);
    await expectButtons(d, ts, { absent: ['FMC Payment Request', 'MMSDA Payment Request'] });
    await test.step('Check the pending note reads the SRD v1.1 REQ-016 Example 2 wording', async () => {
      const note = d.pendingNote();
      await d.verify(`${ts}-note`, d.invBar(), 'Pending note missing or worded differently', async () => expect(note).toBeVisible());
      await d.showValue(note);
    });
  });
}

test('12028_TS114: Approver sees both download buttons on a fully approved month', tagOf('12028_TS114'), async ({ page }) => {
  const ts = '12028_TS114';
  const { d } = await openAs(page, ts, 'approver', 'Full');
  await expectButtons(d, ts, { visible: ['FMC Payment Request', 'MMSDA Payment Request'] });
  await test.step('Check the pending note is not shown', async () => {
    const note = d.pendingNote();
    await d.verify(`${ts}-note`, note, 'Pending note still shown on a fully approved month', async () => expect(note).toHaveCount(0));
  });
});

for (const c of [
  { title: '12028_TS115: Drafter can download both PDFs on a fully approved month', role: 'drafter' as RoleKey },
  { title: '12028_TS116: Reviewer can download both PDFs on a fully approved month', role: 'reviewer' as RoleKey },
]) {
  const ts = idOf(c.title);
  test(c.title, tagOf(ts), async ({ page }) => {
    const { d, month } = await openAs(page, ts, c.role, 'Full');
    for (const assoc of ['FMC', 'MMSDA'] as const) {
      await test.step(`Click [${assoc} Payment Request] and check the file "Payment Requisition_${assoc}_${month} ${CONFIG.year}.pdf"`, async () => {
        const btn = assoc === 'FMC' ? d.fmcBtn() : d.mmsdaBtn();
        const pdf = await savePdf(await d.download(btn, `${assoc} Payment Request`), `${ts}-${assoc}`);
        await d.verify(`${ts}-${assoc}-name`, btn, `Downloaded "${pdf.suggested}"`, async () => {
          expect(pdf.suggested).toBe(`Payment Requisition_${assoc}_${month} ${CONFIG.year}.pdf`);
          expect(pdf.text.length).toBeGreaterThan(0);
        });
      });
    }
  });
}

test('12028_TS119: Second download gives the same file', tagOf('12028_TS119'), async ({ page }) => {
  const ts = '12028_TS119';
  const { d } = await openAs(page, ts, 'approver', 'Full');
  const first = await test.step('Click [FMC Payment Request] (first download)', async () => savePdf(await d.download(d.fmcBtn(), 'FMC Payment Request'), `${ts}-FMC-first`));
  const second = await test.step('Click [FMC Payment Request] again (second download)', async () => savePdf(await d.download(d.fmcBtn(), 'FMC Payment Request'), `${ts}-FMC-second`));
  await test.step('Check both files show the same content and dates', async () => {
    await d.verify(`${ts}-different`, d.fmcBtn(), 'The second download differs from the first', async () => {
      expect(second.suggested).toBe(first.suggested);
      expect(second.text).toBe(first.text);
    });
  });
});
