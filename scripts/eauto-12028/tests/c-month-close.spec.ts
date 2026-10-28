import { test, expect, Page } from '@playwright/test';
import { Session } from '../utils/session';
import { tagOf } from '../data/priority';
import { CONFIG, countInput, monthInput } from '../data/config';
import { COUNT_RE } from '../utils/format';

// C. Month-close — 12028_TS23 to TS25.
// Month-close cannot be run on demand: "like i said before, cronjob cannot run
// on demand, but can set the interval. for testing, we usually set to every 30
// mins with it starting on the hour" [answered by Faizuddin on 2026-10-27,
// data/pipeline/answers.json, scope global]. So these TS do not trigger it:
// they read the month, wait the "Month-close wait (minutes)" typed on the row
// (at least one cron interval), pressing [Search] once a minute, and read it
// again. They cannot SEE that the cron ran in between — the tester sets the
// wait to cover one run (noted in the assertion plan).

async function waitMinutes(page: Page, minutes: number, each: () => Promise<boolean | void>): Promise<boolean> {
  const end = Date.now() + minutes * 60_000;
  while (Date.now() < end) {
    if (await each()) return true;
    // pipeline-check: allow sleep — one Search a minute while the month-close cron (interval set by the team) runs
    await page.waitForTimeout(Math.min(60_000, Math.max(0, end - Date.now())));
  }
  return (await each()) === true;
}

test('12028_TS23: Month-close on a past month makes its figures appear', tagOf('12028_TS23'), async ({ page }) => {
  const ts = '12028_TS23';
  const month = monthInput('E12028_MONTH', 'Past month not yet closed');
  const wait = countInput('E12028_WAIT_MIN', 'Month-close wait (minutes)');
  test.setTimeout((wait + 15) * 60_000);
  const s = new Session(page, ts);
  await s.as('drafter');
  await s.openListing();
  let data = await s.search();
  await test.step(`Check ${month} shows "No data" before month-close`, async () => {
    const row = s.summary.monthRow(data, month);
    const cells = Object.values(row.byCol).map(c => c.text);
    await s.summary.showValue(s.summary.rowAt(row));
    if (!cells.includes('No data')) throw new Error(`Precondition not met: ${month} is already closed (no "No data"). Pick the month the next month-close will close.`);
    await s.summary.captureEvidence(`${ts}-before`);
  });
  const closed = await test.step(`Wait up to ${wait} minutes for month-close, pressing [Search] each minute`, async () =>
    waitMinutes(page, wait, async () => {
      data = await s.summary.search();
      return COUNT_RE.test(s.summary.cell(data, s.summary.monthRow(data, month), 'Car Transactions'));
    }));
  await test.step(`Check ${month} now shows its figures and View`, async () => {
    const row = s.summary.monthRow(data, month);
    const f = s.summary.monthFigures(data, month);
    await s.summary.showValue(s.summary.rowAt(row));
    await s.summary.verify(`${ts}-after`, s.summary.rowAt(row), closed ? 'Figures / View missing' : `Still "No data" after ${wait} minutes`, async () => {
      expect(f.cars).toMatch(COUNT_RE);
      expect(f.bikes).toMatch(COUNT_RE);
      await expect(s.summary.viewLink(row)).toBeVisible();
    });
    await s.summary.captureEvidence(`${ts}-after`);
  });
});

test('12028_TS24: Running month-close twice keeps the same figures', tagOf('12028_TS24'), async ({ page }) => {
  const ts = '12028_TS24';
  const month = monthInput('E12028_MONTH', 'Closed month');
  const wait = countInput('E12028_WAIT_MIN', 'Month-close wait (minutes)');
  test.setTimeout((wait + 15) * 60_000);
  const s = new Session(page, ts);
  await s.as('drafter');
  await s.openListing();
  let data = await s.search();
  const before = await test.step(`Note ${month}'s four figures`, async () => {
    const f = s.summary.monthFigures(data, month);
    if (!COUNT_RE.test(f.cars)) throw new Error(`Precondition not met: ${month} is not closed (Car Transactions "${f.cars}").`);
    await s.summary.showValue(s.summary.rowAt(s.summary.monthRow(data, month)));
    await s.summary.captureEvidence(`${ts}-before`);
    return f;
  });
  console.log(`DETAIL:${JSON.stringify({ label: 'Before', value: Object.values(before).join(' / ') })}`);
  await test.step(`Wait ${wait} minutes for another month-close run, pressing [Search] each minute`, async () => {
    await waitMinutes(page, wait, async () => { data = await s.summary.search(); return false; });
  });
  await test.step(`Check ${month}'s figures are unchanged`, async () => {
    data = await s.summary.search();
    const after = s.summary.monthFigures(data, month);
    const row = s.summary.monthRow(data, month);
    await s.summary.showValue(s.summary.rowAt(row));
    await s.summary.verify(`${ts}-changed`, s.summary.rowAt(row), `Was ${Object.values(before).join(' / ')}`, async () => {
      expect(after).toEqual(before);
    });
  });
});

test('12028_TS25: Running month-close on an approved month keeps statuses and Payment Date', tagOf('12028_TS25'), async ({ page }) => {
  const ts = '12028_TS25';
  const month = monthInput('E12028_MONTH', 'Fully approved month');
  const wait = countInput('E12028_WAIT_MIN', 'Month-close wait (minutes)');
  test.setTimeout((wait + 15) * 60_000);
  const s = new Session(page, ts);
  await s.as('drafter');
  await s.openListing();
  let data = await s.search();
  const before = await test.step(`Note ${month}'s statuses and Payment Date`, async () => {
    const st = s.summary.monthStatus(data, month);
    if ([st.drafter, st.reviewer, st.approver].some(x => x !== 'Approved')) {
      throw new Error(`Precondition not met: ${month} is ${st.drafter}/${st.reviewer}/${st.approver}, the TS needs a fully approved month.`);
    }
    await s.summary.showValue(s.summary.rowAt(s.summary.monthRow(data, month)));
    return st;
  });
  await test.step(`Wait ${wait} minutes for another month-close run, pressing [Search] each minute`, async () => {
    await waitMinutes(page, wait, async () => { data = await s.summary.search(); return false; });
  });
  await test.step(`Check ${month} is still fully approved with the same Payment Date`, async () => {
    data = await s.summary.search();
    const after = s.summary.monthStatus(data, month);
    const row = s.summary.monthRow(data, month);
    await s.summary.showValue(s.summary.rowAt(row));
    await s.summary.verify(`${ts}-reset`, s.summary.rowAt(row), `Was Approved ×3, Payment Date ${before.paymentDate}`, async () => {
      expect([after.drafter, after.reviewer, after.approver]).toEqual(['Approved', 'Approved', 'Approved']);
      expect(after.paymentDate).toBe(before.paymentDate);
    });
  });
});
