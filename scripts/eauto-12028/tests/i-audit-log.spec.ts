import { test, expect } from '@playwright/test';
import { openAs } from '../utils/workflow';
import { Session } from '../utils/session';
import { tagOf } from '../data/priority';
import { monthInput } from '../data/config';
import { NO_ACTIVITY } from '../data/expected';
import { AplDetailsPage } from '../pages/AplDetailsPage';
import { parseListingDate } from '../utils/datepicker';

// I. Audit log — 12028_TS104 to TS107. As the Drafter.
// [unconfirmed] the Audit Log table is not captured live (mock-up #tbl-log).

async function openMonthAsDrafter(page: import('@playwright/test').Page, ts: string, field: string) {
  const month = monthInput('E12028_MONTH', field);
  const s = new Session(page, ts);
  await s.as('drafter');
  const { details } = await s.openMonth(month);
  return { s, d: details, month };
}

test('12028_TS104: New month Audit Log shows No activity yet', tagOf('12028_TS104'), async ({ page }) => {
  const ts = '12028_TS104';
  const { d } = await openAs(page, ts, 'drafter', 'Pending');
  await test.step(`Check the Audit Log reads "${NO_ACTIVITY}"`, async () => {
    const log = await d.readLog();
    await d.showValue(d.logTable());
    await d.verify(`${ts}-log`, d.logTable(), `Expected only "${NO_ACTIVITY}"`, async () => {
      expect(log.rows.map(r => r.text)).toEqual([NO_ACTIVITY]);
    });
  });
});

test('12028_TS105: Audit Log shows Date/Time, Role, Action/Status and Remarks', tagOf('12028_TS105'), async ({ page }) => {
  const ts = '12028_TS105';
  const { d } = await openMonthAsDrafter(page, ts, 'Month rejected in 12028_TS65');
  await test.step('Check the Audit Log columns and the reject row', async () => {
    const log = await d.readLog();
    const head = d.logTable().locator('tr').first();
    await d.showValue(head);
    await d.verify(`${ts}-headers`, head, `Headers: ${log.headers.join(' | ')}`, async () => {
      for (const h of ['Date/Time', 'Role', 'Action/Status', 'Remarks']) expect(log.headers).toContain(h);
    });
    const rejects = d.logEntries(log).filter(e => AplDetailsPage.entryRe('Reviewer', 'Rejected').test(e.entry));
    if (!rejects.length) throw new Error('Precondition not met: no "Reviewer — Rejected" row on this month — use the month from 12028_TS65.');
    const r = rejects[rejects.length - 1];
    await d.showValue(d.logRowAt(r.row));
    await d.verify(`${ts}-reject-row`, d.logRowAt(r.row), `Date/Time "${r.time}", Remarks "${r.remarks}"`, async () => {
      expect(r.time).toMatch(/^\d{2}-\d{2}-\d{4} \d{2}:\d{2}/);
      expect(r.remarks.trim()).not.toBe('');
      expect(r.remarks.trim()).not.toBe('-');
    });
  });
});

test('12028_TS106: Audit Log keeps every row after a reject loop', tagOf('12028_TS106'), async ({ page }) => {
  const ts = '12028_TS106';
  const { d } = await openMonthAsDrafter(page, ts, 'Month approved in 12028_TS94');
  await test.step('Check the rows run Drafter Approved → Reviewer Approved → Approver Rejected → Reviewer Approved → Approver Approved, oldest first', async () => {
    const log = await d.readLog();
    const entries = d.logEntries(log);
    const want: [Parameters<typeof AplDetailsPage.entryRe>[0], Parameters<typeof AplDetailsPage.entryRe>[1]][] = [
      ['Drafter', 'Approved'], ['Reviewer', 'Approved'], ['Approver', 'Rejected'], ['Reviewer', 'Approved'], ['Approver', 'Approved'],
    ];
    let from = 0;
    const missing: string[] = [];
    for (const [role, action] of want) {
      const i = entries.findIndex((e, k) => k >= from && AplDetailsPage.entryRe(role, action).test(e.entry));
      if (i < 0) missing.push(`${role} — ${action}`); else from = i + 1;
    }
    const times = entries.map(e => e.time).filter(t => /^\d{2}-\d{2}-\d{4}/.test(t));
    const stamp = (t: string) => parseListingDate(t).getTime() + (Number(t.slice(11, 13)) || 0) * 3_600_000 + (Number(t.slice(14, 16)) || 0) * 60_000;
    const backwards = times.slice(1).filter((t, k) => stamp(t) < stamp(times[k]));
    console.log(`DETAIL:${JSON.stringify({ label: 'Audit Log', value: entries.map(e => `${e.time} ${e.entry}`).join(' | ') })}`);
    await d.showValue(d.logTable());
    await d.verify(`${ts}-log`, d.logTable(), missing.length ? `Missing in order: ${missing.join(', ')}` : 'Rows out of time order', async () => {
      expect(missing).toEqual([]);
      expect(backwards).toEqual([]);
    });
  });
});

test('12028_TS107: Audit Log shows no signature image', tagOf('12028_TS107'), async ({ page }) => {
  const ts = '12028_TS107';
  const { d } = await openMonthAsDrafter(page, ts, 'Month approved in 12028_TS45');
  await test.step('Check the "Drafter — Approved" row has no image', async () => {
    const log = await d.readLog();
    const rows = d.logEntries(log).filter(e => AplDetailsPage.entryRe('Drafter', 'Approved').test(e.entry));
    if (!rows.length) throw new Error('Precondition not met: no "Drafter — Approved" row on this month — use the month from 12028_TS45.');
    for (const r of rows) {
      await d.showValue(d.logRowAt(r.row));
      await d.verify(`${ts}-image`, d.logRowAt(r.row), 'Signature image shown in the log', async () => {
        await expect(d.logRowAt(r.row).locator('img, canvas, svg')).toHaveCount(0);
      });
    }
  });
});
