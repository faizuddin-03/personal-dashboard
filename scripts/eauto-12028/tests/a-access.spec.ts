import { test, expect } from '@playwright/test';
import { Session } from '../utils/session';
import { tagOf } from '../data/priority';
import { CONFIG } from '../data/config';
import { RoleKey } from '../data/users';
import { Checks } from '../utils/combined';

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

test('12028_TS05: No-role BO user does not see Association Payment Listing under Reports', tagOf('12028_TS05'), async ({ page }) => {
  const ts = '12028_TS05';
  // Open point 2 settled (Faizuddin, dashboard chat 2026-11-02): "confirmed, for the users that dont have
  // access, they will not see the button/link to go to the page" — the link is absent (count 0).
  const s = new Session(page, ts);
  await s.as('norole');
  await test.step('Go to Reports on BackOffice Home', async () => {
    await s.home.goto();
    await s.home.demoHighlight(s.home.reportsBlock());
  });
  await test.step('Check "Association Payment Listing" is not under Reports', async () => {
    const link = s.home.listingLink();
    await s.home.captureEvidence(`${ts}-reports-menu`);
    await s.home.verify(`${ts}-menu`, (await link.count()) ? link : s.home.reportsBlock(), 'No-role user can see "Association Payment Listing" under Reports', async () => {
      await expect(link).toHaveCount(0);
    });
  });
});

test('12028_TS06: No-role BO user blocked on the Summary and Details page addresses', tagOf('12028_TS06'), async ({ page }) => {
  const ts = '12028_TS06';
  // Simplified (Faizuddin, dashboard chat 2026-11-03): "no need to log in valid BO. just log in as invalid BO,
  // check the page acces is not there, and try to paste the link based on the previous run".
  // The addresses are the ones the Drafter run copied on 2026-11-03 (run log DETAIL lines):
  //   Summary  https://staging.eauto.my/backoffice/admin/association
  //   Details  https://staging.eauto.my/backoffice/admin/association/2026/9
  // built on the host chosen in Run configuration.
  const summaryAddress = `${CONFIG.host}/backoffice/admin/association`;
  const detailsAddress = `${CONFIG.host}/backoffice/admin/association/2026/9`;
  const s = new Session(page, ts);
  await s.as('norole');
  await test.step('Go to Reports on BackOffice Home', async () => {
    await s.home.goto();
    await s.home.demoHighlight(s.home.reportsBlock());
  });
  const c = new Checks(s.summary, ts);
  await test.step('Check "Association Payment Listing" is not under Reports', async () => {
    const link = s.home.listingLink();
    await s.home.captureEvidence(`${ts}-reports-menu`);
    await c.run('Reports menu link', (await link.count()) ? link : s.home.reportsBlock(), async () =>
      expect(link, 'The no-role user can see "Association Payment Listing" under Reports').toHaveCount(0));
  });
  const shownToUser = async (what: string) => {
    const text = (await page.locator('body').innerText()).replace(/\s+/g, ' ').trim().slice(0, 140);
    console.log(`DETAIL:${JSON.stringify({ label: `${what}: page the no-role user got`, value: `${page.url()} — "${text}"` })}`);
  };
  await test.step(`Paste the Summary address (${summaryAddress})`, async () => {
    await page.goto(summaryAddress, { waitUntil: 'load' });
    await s.login.settleAfterLoad();
  });
  await test.step('Check the no-role user cannot enter the Summary (no heading, no month table, no [Search])', async () => {
    const summary = s.summary;
    await summary.captureEvidence(`${ts}-summary-blocked`);
    await shownToUser('Summary address');
    const body = page.locator('body');
    await c.run('Summary heading', body, async () => expect(summary.heading(), 'The "Association Payment Listing" heading is shown to the no-role user').toHaveCount(0));
    await c.run('Summary month table', body, async () => expect(summary.table(), 'The month table (#tbl-summary) is shown to the no-role user').toHaveCount(0));
    await c.run('Summary [Search]', body, async () => expect(summary.searchBtn(), 'The [Search] button is shown to the no-role user').toHaveCount(0));
  });
  await test.step(`Paste the Details address (${detailsAddress})`, async () => {
    await page.goto(detailsAddress, { waitUntil: 'load' });
    await s.login.settleAfterLoad();
  });
  await test.step('Check the no-role user cannot enter the Details page (no state table, Audit Log, buttons or PDF bar)', async () => {
    const d = s.details;
    await d.captureEvidence(`${ts}-details-blocked`);
    await shownToUser('Details address');
    const body = page.locator('body');
    await c.run('Details state table', body, async () => expect(d.stateTable(), 'The state table (#tbl-veh) is shown to the no-role user').toHaveCount(0));
    await c.run('Details Audit Log', body, async () => expect(d.logTable(), 'The Audit Log (#tbl-log) is shown to the no-role user').toHaveCount(0));
    await c.run('Details action panel', body, async () => expect(d.wfBar(), 'The action panel (#action-panel) is shown to the no-role user').toHaveCount(0));
    await c.run('Details PDF bar', body, async () => expect(d.invBar(), 'The Payment Request Documents bar (#pdf-bar) is shown to the no-role user').toHaveCount(0));
    await c.run('Details [Approve] / [KIV] / [Reject]', body, async () => {
      await expect(d.approveBtn(), 'The [Approve] button is shown to the no-role user').toHaveCount(0);
      await expect(d.kivBtn(), 'The [KIV] button is shown to the no-role user').toHaveCount(0);
      await expect(d.rejectBtn(), 'The [Reject] button is shown to the no-role user').toHaveCount(0);
    });
  });
  c.done();
});
