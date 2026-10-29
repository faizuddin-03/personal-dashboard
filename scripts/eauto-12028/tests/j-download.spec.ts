import { test, expect } from '@playwright/test';
import { Session } from '../utils/session';
import { openAs } from '../utils/workflow';
import { eachMonth } from '../utils/combined';
import { tagOf } from '../data/priority';
import { CONFIG } from '../data/config';
import { RoleKey } from '../data/users';
import { expectButtons } from '../utils/checks';
import { savePdf } from '../utils/pdf';

// J. Payment Request download — 12028_TS48 to TS51, TS54.
// Manual only (never automated): 12028_TS52 (no-role user on the download
// address) and 12028_TS53 (download address of a not-fully-approved month).
// [unconfirmed] the download bar is not captured live (mock-up #inv-bar).

test('12028_TS48: Download buttons hidden with pending note until the month is fully approved', tagOf('12028_TS48'), async ({ page }) => {
  const ts = '12028_TS48';
  const s = new Session(page, ts);
  await s.as('approver');
  await eachMonth(s, ['Pending', 'KIV', 'DA', 'DRA', 'RA', 'RRA'], async (d, state) => {
    await expectButtons(d, `${ts}-${state}`, { absent: ['FMC Payment Request', 'MMSDA Payment Request'] });
    await test.step('Check the pending note reads the SRD v1.1 REQ-016 Example 2 wording', async () => {
      await d.verify(`${ts}-${state}-note`, d.invBar(), 'Pending note missing or worded differently', async () => expect(d.pendingNote()).toBeVisible());
      await d.showValue(d.pendingNote());
    });
  });
});

test('12028_TS49: Approver sees both download buttons on a fully approved month', tagOf('12028_TS49'), async ({ page }) => {
  const ts = '12028_TS49';
  const { d } = await openAs(page, ts, 'approver', 'Full', 'E12028_MONTH', 'Fully approved month');
  await expectButtons(d, ts, { visible: ['FMC Payment Request', 'MMSDA Payment Request'] });
  await test.step('Check the pending note is not shown', async () => {
    await d.verify(`${ts}-note`, d.pendingNote(), 'Pending note still shown on a fully approved month', async () => expect(d.pendingNote()).toHaveCount(0));
  });
});

for (const c of [
  { title: '12028_TS50: Drafter can download both PDFs on a fully approved month', role: 'drafter' as RoleKey },
  { title: '12028_TS51: Reviewer can download both PDFs on a fully approved month', role: 'reviewer' as RoleKey },
]) {
  const ts = c.title.split(':')[0];
  test(c.title, tagOf(ts), async ({ page }) => {
    const { d, month } = await openAs(page, ts, c.role, 'Full', 'E12028_MONTH', 'Fully approved month');
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

test('12028_TS54: Second download gives the same file', tagOf('12028_TS54'), async ({ page }) => {
  const ts = '12028_TS54';
  const { d } = await openAs(page, ts, 'approver', 'Full', 'E12028_MONTH', 'Fully approved month');
  const first = await test.step('Click [FMC Payment Request] (first download)', async () => savePdf(await d.download(d.fmcBtn(), 'FMC Payment Request'), `${ts}-FMC-first`));
  const second = await test.step('Click [FMC Payment Request] again (second download)', async () => savePdf(await d.download(d.fmcBtn(), 'FMC Payment Request'), `${ts}-FMC-second`));
  await test.step('Check both files show the same content and dates', async () => {
    await d.verify(`${ts}-different`, d.fmcBtn(), 'The second download differs from the first', async () => {
      expect(second.suggested).toBe(first.suggested);
      expect(second.text).toBe(first.text);
    });
  });
});
