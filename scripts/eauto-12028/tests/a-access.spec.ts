import { test, expect } from '@playwright/test';
import { Session } from '../utils/session';
import { tagOf } from '../data/priority';
import { monthInput, required } from '../data/config';
import { RoleKey } from '../data/users';

// A. Reports menu and module access — 12028_TS01 to TS06.
// [unconfirmed] the module is not captured live; see pages/AplSummaryPage.ts.
const idOf = (title: string) => title.split(':')[0];

const MENU: { title: string; role: RoleKey }[] = [
  { title: '12028_TS01: Drafter sees Association Payment Listing under Reports and opens Summary', role: 'drafter' },
  { title: '12028_TS02: Reviewer sees Association Payment Listing under Reports and opens Summary', role: 'reviewer' },
  { title: '12028_TS03: Approver sees Association Payment Listing under Reports and opens Summary', role: 'approver' },
  { title: '12028_TS04: Multi-role user sees Association Payment Listing under Reports and opens Summary', role: 'multi' },
];

for (const c of MENU) {
  test(c.title, tagOf(idOf(c.title)), async ({ page }) => {
    const ts = idOf(c.title);
    const s = new Session(page, ts);
    await s.as(c.role);
    await test.step('Go to Reports on BackOffice Home', async () => {
      await s.home.goto();
      await s.home.demoHighlight(s.home.reportsBlock());
    });
    await test.step('Check "Association Payment Listing" is listed under Reports', async () => {
      const link = s.home.listingLink();
      await s.home.verify(`${ts}-menu`, s.home.reportsBlock(), 'No "Association Payment Listing" under Reports', async () => expect(link).toHaveCount(1));
      await s.home.showValue(link);
      await s.home.captureEvidence(`${ts}-reports-menu`);
    });
    const summary = await s.openListing();
    await test.step('Check the Summary page opened with the Year filter and [Search]', async () => {
      await summary.verify(`${ts}-summary`, s.apl.locator('body'), 'Summary page not shown', async () => {
        await expect(summary.heading()).toBeVisible();
        await expect(summary.yearSelect()).toBeVisible();
        await expect(summary.searchBtn()).toBeVisible();
      });
      await summary.showValue(summary.heading());
      await summary.captureEvidence(`${ts}-summary`);
    });
  });
}

test('12028_TS05: No-role BO user Reports menu item visible or hidden per BA answer', tagOf('12028_TS05'), async ({ page }) => {
  const ts = '12028_TS05';
  // Open point 2: the BA's answer is typed on the row ("shown" / "hidden"); never assumed.
  const answer = required('E12028_EXPECT_MENU', 'BA answer: menu item for a no-role user').toLowerCase();
  if (answer !== 'shown' && answer !== 'hidden') throw new Error(`BA answer must be "shown" or "hidden", got "${answer}".`);
  const s = new Session(page, ts);
  await s.as('norole');
  await test.step('Go to Reports on BackOffice Home', async () => { await s.home.goto(); });
  await test.step(`Check "Association Payment Listing" is ${answer} under Reports (BA answer)`, async () => {
    const link = s.home.listingLink();
    await s.home.captureEvidence(`${ts}-reports-menu`);
    await s.home.verify(`${ts}-menu`, (await link.count()) ? link : s.home.reportsBlock(), `Menu item should be ${answer}`, async () => {
      await expect(link).toHaveCount(answer === 'shown' ? 1 : 0);
    });
  });
});

test('12028_TS06: No-role BO user blocked on the Summary and Details page addresses', tagOf('12028_TS06'), async ({ page }) => {
  const ts = '12028_TS06';
  const month = monthInput('E12028_MONTH', 'Closed month');
  const s = new Session(page, ts);
  await s.as('drafter');
  await s.openListing();
  const summaryAddress = await test.step('Copy the Summary page address', async () => s.apl.url());
  await s.openMonth(month);
  const detailsAddress = await test.step(`Click [View] on ${month} and copy the Details page address`, async () => s.apl.url());
  console.log(`DETAIL:${JSON.stringify({ label: 'Summary address', value: summaryAddress })}`);
  console.log(`DETAIL:${JSON.stringify({ label: 'Details address', value: detailsAddress })}`);
  await s.as('norole');
  // Opening the copied address IS the TS step — the only typed-address visits in this suite.
  await test.step('Open the copied Summary address as the no-role user', async () => {
    await page.goto(summaryAddress, { waitUntil: 'load' });
    await s.login.settleAfterLoad();
  });
  await test.step('Check the Summary listing is not shown (no month table, no [Search])', async () => {
    const summary = s.summary;
    await summary.captureEvidence(`${ts}-summary-blocked`);
    await summary.verify(`${ts}-listing-shown`, summary.table(), 'No-role user can see the listing', async () => {
      await expect(summary.table()).toHaveCount(0);
      await expect(summary.searchBtn()).toHaveCount(0);
    });
  });
  await test.step('Open the copied Details address as the no-role user', async () => {
    await page.goto(detailsAddress, { waitUntil: 'load' });
    await s.login.settleAfterLoad();
  });
  await test.step('Check no [Approve], [KIV], [Reject] and no state table are shown', async () => {
    const d = s.details;
    await d.captureEvidence(`${ts}-details-blocked`);
    await d.verify(`${ts}-details-shown`, d.stateTable(), 'No-role user can see the Details page', async () => {
      await expect(d.approveBtn()).toHaveCount(0);
      await expect(d.kivBtn()).toHaveCount(0);
      await expect(d.rejectBtn()).toHaveCount(0);
      await expect(d.stateTable()).toHaveCount(0);
    });
  });
});
