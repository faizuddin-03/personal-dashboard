import { test, expect, Page } from '@playwright/test';
import { Session, MonthState } from '../utils/session';
import { openAs, expectStatus } from '../utils/workflow';
import { tagOf } from '../data/priority';
import { CONFIG, countInput } from '../data/config';
import { RoleKey } from '../data/users';
import { LoginPage } from '../pages/LoginPage';
import { BoHomePage } from '../pages/BoHomePage';
import { AplSummaryPage } from '../pages/AplSummaryPage';
import { AplDetailsPage, Role } from '../pages/AplDetailsPage';
import { addDays, ddmmyyyy, today } from '../utils/format';

// M. BO login, SSO, session and double submit — 12028_TS57, TS59, TS60,
// TS63 to TS65. Manual only (never automated): 12028_TS58 (replay a used
// hand-off address), TS61 / TS62 (outside redirect target), TS66 to TS68
// (forcing requests with dev tools).
// [unconfirmed] the module's own Logout link and the SSO hand-off are not captured.

const ERROR_PAGE = /HTTP Status \d{3}|Whitelabel Error|Exception|Internal Server Error|500 -|404 -|Error 500/i;

/** Is this page the BO login form on the configured host and instance? */
async function onBoLogin(page: Page): Promise<boolean> {
  const url = new URL(page.url());
  const want = new URL(CONFIG.host);
  return url.host === want.host && url.pathname.startsWith(`/${CONFIG.instance}/`) && (await new LoginPage(page).isLoginFormVisible());
}

test('12028_TS57: BO login hand-off opens Association Payment Listing and module logout needs a fresh login', tagOf('12028_TS57'), async ({ page }) => {
  const ts = '12028_TS57';
  const s = new Session(page, ts);
  await s.as('drafter');
  await test.step('Check BO Home shows the logged-in name', async () => {
    await s.home.goto();
    await s.home.verify(`${ts}-home`, page.locator('body'), 'BO login did not reach BO Home', async () => expect(s.home.userName()).toBeVisible());
  });
  const summary = await s.openListing();
  await test.step('Check the Summary opened with no second login page', async () => {
    await summary.verify(`${ts}-second-login`, s.apl.locator('body'), 'A login form showed instead of the Summary', async () => {
      await expect(summary.heading()).toBeVisible();
      await expect(new LoginPage(s.apl).usernameInput()).toHaveCount(0);
    });
    await summary.captureEvidence(`${ts}-summary`);
  });
  const apl = s.apl;
  await test.step('Click Logout on the Association Payment Listing page and confirm', async () => { await new LoginPage(apl).logoutByLink(); });
  await test.step('Check the BO login page is shown', async () => {
    await new LoginPage(apl).verify(`${ts}-not-login`, apl.locator('body'), `Not on BO login: ${apl.url()}`, async () => expect(await onBoLogin(apl)).toBe(true));
    await new LoginPage(apl).captureEvidence(`${ts}-after-logout`);
  });
  await test.step('Press the browser Back button', async () => {
    await apl.goBack({ waitUntil: 'load' }).catch(e => console.log(`   Back: ${e instanceof Error ? e.message.split('\n')[0] : e}`));
    await apl.waitForLoadState('load', { timeout: CONFIG.navigationTimeout });
  });
  await test.step('Check the Summary is not shown again and the BO login page is', async () => {
    const sm = new AplSummaryPage(apl);
    await sm.verify(`${ts}-back`, apl.locator('body'), 'Summary shown after Back', async () => {
      expect(await sm.isShown()).toBe(false);
      expect(await onBoLogin(apl)).toBe(true);
    });
    await sm.captureEvidence(`${ts}-after-back`);
  });
});

test('12028_TS59: Core logout logs out the open Association Payment Listing tab', tagOf('12028_TS59'), async ({ page }) => {
  const ts = '12028_TS59';
  const s = new Session(page, ts);
  await s.as('drafter');
  const tab2 = await test.step('Open BO Home in a new tab and open Association Payment Listing there', async () => {
    const p = await page.context().newPage();
    const home = new BoHomePage(p);
    await home.goto();
    const apl = await home.openListing();
    await new AplSummaryPage(apl).expectShown();
    return apl;
  });
  await test.step('Log out from BackOffice Home in the first tab (header Logout, confirm)', async () => {
    await page.bringToFront();
    await s.home.goto();
    await s.login.logoutByLink();
  });
  await test.step('Refresh the Association Payment Listing tab', async () => {
    await tab2.bringToFront();
    await tab2.reload({ waitUntil: 'load' });
  });
  await test.step('Check the tab shows the BO login, not the Summary', async () => {
    const sm = new AplSummaryPage(tab2);
    await sm.captureEvidence(`${ts}-tab-after-refresh`);
    await sm.verify(`${ts}-still-in`, tab2.locator('body'), 'Module tab still works after core logout', async () => {
      expect(await sm.isShown()).toBe(false);
      expect(await onBoLogin(tab2)).toBe(true);
    });
  });
});

test('12028_TS60: Session expiry returns to BO login without an error page', tagOf('12028_TS60'), async ({ page }) => {
  const ts = '12028_TS60';
  // Open point 7 (for the developer): the session timeout is typed on the row.
  const minutes = countInput('E12028_TIMEOUT_MIN', 'Session timeout (minutes)');
  test.setTimeout((minutes + 15) * 60_000);
  const s = new Session(page, ts);
  await s.as('drafter');
  const summary = await s.openListing();
  await test.step(`Leave the page idle for ${minutes + 1} minutes`, async () => {
    // pipeline-check: allow sleep — the TS step is "idle past timeout"; nothing on the page may be touched
    await s.apl.waitForTimeout((minutes + 1) * 60_000);
  });
  await test.step('Click [Search]', async () => {
    await summary.searchBtn().click();
    await s.apl.waitForLoadState('load', { timeout: CONFIG.navigationTimeout });
  });
  await test.step('Check the BO login page is shown and no error page', async () => {
    const body = await s.apl.locator('body').innerText();
    await summary.captureEvidence(`${ts}-after-expiry`);
    await summary.verify(`${ts}-expiry`, s.apl.locator('body'), `After expiry: ${s.apl.url()}`, async () => {
      expect(body).not.toMatch(ERROR_PAGE);
      expect(await onBoLogin(s.apl)).toBe(true);
    });
  });
});

/** Opens the same month in a second tab of the same login (same context = same session). */
async function secondTab(page: Page, month: string): Promise<AplDetailsPage> {
  const p = await page.context().newPage();
  const home = new BoHomePage(p);
  await home.goto();
  const apl = await home.openListing();
  const sm = new AplSummaryPage(apl);
  const data = await sm.search();
  await sm.openMonth(data, month);
  const d = new AplDetailsPage(apl);
  await d.expectOpenFor(month, CONFIG.year);
  return d;
}

for (const c of [
  { title: '12028_TS63: Drafter Approve from two tabs makes one audit row', role: 'drafter' as RoleKey, who: 'Drafter' as Role, from: 'Pending' as MonthState },
  { title: '12028_TS64: Reviewer Approve from two tabs makes one audit row', role: 'reviewer' as RoleKey, who: 'Reviewer' as Role, from: 'DA' as MonthState },
  { title: '12028_TS65: Approver Approve from two tabs makes one audit row and one payment date', role: 'approver' as RoleKey, who: 'Approver' as Role, from: 'RA' as MonthState },
]) {
  const ts = c.title.split(':')[0];
  test(c.title, tagOf(ts), async ({ page }) => {
    const { s, d, month } = await openAs(page, ts, c.role, c.from);
    const before = await d.logCount(c.who, 'Approved');
    const d2 = await test.step(`Open ${month} in a second tab`, async () => secondTab(page, month));
    const date1 = addDays(today(), 1);
    const date2 = addDays(today(), 2);
    await test.step(`Tab 1: [Approve]${c.who === 'Approver' ? ` with ${ddmmyyyy(date1)}` : ''}`, async () => {
      await d.bringToFront();
      if (c.who === 'Approver') await d.approverApprove(date1);
      else await d.approve(c.who as 'Drafter' | 'Reviewer');
    });
    await test.step(`Tab 2 (not refreshed): [Approve]${c.who === 'Approver' ? ` with ${ddmmyyyy(date2)}` : ''}`, async () => {
      await d2.bringToFront();
      // The second submit must be refused; whatever tab 2 shows is saved as evidence.
      try {
        await d2.clickApprove();
        await d2.signIfAsked();
        if (c.who === 'Approver' && (await d2.shownWithin(d2.dateModal(), 5_000))) {
          await d2.choosePayDate(date2);
          await d2.confirmApprove();
        }
      } catch (e) {
        console.log(`   Tab 2 refused the action: ${e instanceof Error ? e.message.split('\n')[0] : e}`);
      }
      await d2.settleAfterLoad();
      console.log(`DETAIL:${JSON.stringify({ label: 'Tab 2 message', value: d2.takeDialogs().join('; ') || '(none)' })}`);
      await d2.captureEvidence(`${ts}-tab2`);
    });
    await test.step('Refresh tab 1', async () => {
      await d.bringToFront();
      await d.reloadPage();
    });
    await expectStatus(d, ts, c.who, 'Approved');
    await test.step(`Check exactly one new "${c.who} — Approved" row`, async () => {
      const after = await d.logCount(c.who, 'Approved');
      await d.showValue(d.logTable());
      await d.verify(`${ts}-log`, d.logTable(), `"${c.who} — Approved" rows went from ${before} to ${after}`, async () => expect(after).toBe(before + 1));
    });
    if (c.who === 'Approver') {
      const { data, status } = await s.summaryStatusOf(month);
      await test.step(`Check the Summary Payment Date is tab 1's ${ddmmyyyy(date1)}`, async () => {
        const cell = s.summary.cellAt(data, s.summary.monthRow(data, month), 'Payment Date');
        await s.summary.verify(`${ts}-payment-date`, cell, `Payment Date "${status.paymentDate}"`, async () => expect(status.paymentDate).toBe(ddmmyyyy(date1)));
      });
    }
  });
}
