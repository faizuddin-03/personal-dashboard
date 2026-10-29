import { test, expect } from '@playwright/test';
import { openAs } from '../utils/workflow';
import { Session } from '../utils/session';
import { Checks } from '../utils/combined';
import { tagOf } from '../data/priority';
import { monthInput } from '../data/config';
import { NO_ACTIVITY } from '../data/expected';
import { AplDetailsPage } from '../pages/AplDetailsPage';
import { parseListingDate } from '../utils/datepicker';

// I. Audit log — 12028_TS46 to TS47. As the Drafter.
// [unconfirmed] the Audit Log table is not captured live (mock-up #tbl-log).

test('12028_TS46: New month Audit Log shows No activity yet', tagOf('12028_TS46'), async ({ page }) => {
  const ts = '12028_TS46';
  const { d } = await openAs(page, ts, 'drafter', 'Pending', 'E12028_MONTH', 'Pending month with no action yet');
  await test.step(`Check the Audit Log reads "${NO_ACTIVITY}"`, async () => {
    const log = await d.readLog();
    await d.showValue(d.logTable());
    await d.verify(`${ts}-log`, d.logTable(), `Expected only "${NO_ACTIVITY}"`, async () => expect(log.rows.map(r => r.text)).toEqual([NO_ACTIVITY]));
  });
});

test('12028_TS47: Audit Log shows its columns, keeps every row after a reject loop and shows no signature image', tagOf('12028_TS47'), async ({ page }) => {
  const ts = '12028_TS47';
  const month = monthInput('E12028_MONTH', 'Month approved in 12028_TS41');
  const s = new Session(page, ts);
  await s.as('drafter');
  const { details: d } = await s.openMonth(month);
  const log = await d.readLog();
  const entries = d.logEntries(log);
  console.log(`DETAIL:${JSON.stringify({ label: 'Audit Log', value: entries.map(e => `${e.time} ${e.entry}`).join(' | ') })}`);
  const c = new Checks(d, ts);
  await test.step('Check the Audit Log columns', async () => {
    const head = d.logTable().locator('tr').first();
    await d.showValue(head);
    await c.run('columns', head, () => {
      for (const h of ['Date/Time', 'Role', 'Action/Status', 'Remarks']) expect(log.headers).toContain(h);
    });
  });
  await test.step('Check the reject row shows its remarks', async () => {
    const rejects = entries.filter(e => AplDetailsPage.entryRe('Approver', 'Rejected').test(e.entry) || AplDetailsPage.entryRe('Reviewer', 'Rejected').test(e.entry));
    const r = rejects[rejects.length - 1];
    await c.run('reject remarks', r ? d.logRowAt(r.row) : d.logTable(), () => {
      if (!r) throw new Error('no Rejected row — use the month from 12028_TS41');
      expect(r.time).toMatch(/^\d{2}-\d{2}-\d{4} \d{2}:\d{2}/);
      expect(r.remarks.trim()).not.toBe('');
      expect(r.remarks.trim()).not.toBe('-');
    });
  });
  await test.step('Check the rows run Drafter Approved → Reviewer Approved → Approver Rejected → Reviewer Approved → Approver Approved, oldest first', async () => {
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
    await d.showValue(d.logTable());
    await c.run('rows in order', d.logTable(), () => {
      expect(missing, 'rows missing in order').toEqual([]);
      expect(backwards, 'rows out of time order').toEqual([]);
    });
  });
  await test.step('Check the "Drafter — Approved" row has no signature image', async () => {
    const rows = entries.filter(e => AplDetailsPage.entryRe('Drafter', 'Approved').test(e.entry));
    await c.run('drafter row', d.logTable(), () => { if (!rows.length) throw new Error('no "Drafter — Approved" row'); });
    for (const r of rows) {
      await c.run('signature image', d.logRowAt(r.row), async () => expect(d.logRowAt(r.row).locator('img, canvas, svg')).toHaveCount(0));
    }
  });
  c.done();
});
