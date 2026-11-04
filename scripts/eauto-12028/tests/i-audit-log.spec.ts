import { test, expect } from '@playwright/test';
import { openAs } from '../utils/workflow';
import { Session } from '../utils/session';
import { Checks } from '../utils/combined';
import { tagOf } from '../data/priority';
import { monthInput } from '../data/config';
import { NO_ACTIVITY } from '../data/expected';
import { AplDetailsPage } from '../pages/AplDetailsPage';
import { parseWhen } from '../utils/format';

// I. Audit log — 12028_TS47 to TS48. As the Drafter.
// Audit Log live on uat1 (Claude run 2026-11-04, 12028_TS48/02-audit-log.png): columns When | Actor | Role |
// Action | Payment Date | Remarks, NEWEST row first, Action words "Approved (signed)", "KIV", "Undo KIV",
// "Rejected (returned to Drafter|Reviewer)".

test('12028_TS47: New month Audit Log shows No workflow actions recorded yet', tagOf('12028_TS47'), async ({ page }) => {
  const ts = '12028_TS47';
  const { d } = await openAs(page, ts, 'drafter', 'Pending', 'E12028_MONTH', 'Pending month with no action yet', { typedOnly: true });
  await test.step(`Check the Audit Log reads "${NO_ACTIVITY}"`, async () => {
    const log = await d.readLog();
    await d.showValue(d.logTable());
    await d.verify(`${ts}-log`, d.logTable(), `Expected only "${NO_ACTIVITY}"`, async () => expect(log.rows.map(r => r.text)).toEqual([NO_ACTIVITY]));
  });
});

test('12028_TS48: Audit Log shows its columns, keeps every row after a reject loop and shows no signature image', tagOf('12028_TS48'), async ({ page }) => {
  const ts = '12028_TS48';
  const month = monthInput('E12028_MONTH', 'Month approved in 12028_TS41');
  const s = new Session(page, ts);
  await s.as('drafter');
  const { details: d } = await s.openMonth(month);
  const log = await d.readLog();
  const entries = d.logEntries(log);
  console.log(`DETAIL:${JSON.stringify({ label: 'Audit Log', value: entries.map(e => `${e.time} ${e.entry}`).join(' | ') })}`);
  const c = new Checks(d, ts);
  await test.step('Check the Audit Log columns', async () => {
    await d.showValue(d.logTable().locator('tr').first());
    // Expected: Date/Time, Role, Action/Status, Payment Date, Remarks (Actor left out). Live: When, Actor, Role, Action, Payment Date, Remarks.
    await d.checkLogColumns(log);
  });
  await test.step('Check the reject row shows its remarks', async () => {
    const rejects = AplDetailsPage.chronological(entries).filter(e => AplDetailsPage.entryRe('Approver', 'Rejected').test(e.entry) || AplDetailsPage.entryRe('Reviewer', 'Rejected').test(e.entry));
    const r = rejects[rejects.length - 1];
    await c.run('reject remarks', r ? d.logRowAt(r.row) : d.logTable(), () => {
      if (!r) throw new Error('no Rejected row — use the month from 12028_TS41');
      expect(r.remarks.trim(), 'Remarks of the reject row').not.toBe('');
      expect(r.remarks.trim(), 'Remarks of the reject row').not.toBe('-');
    });
    if (r) await d.checkLogRowFormat(log, r, /^approver/i.test(r.role) ? 'Approver' : 'Reviewer', 'Rejected', { remarksTyped: true });
  });
  await test.step('Check the rows run Drafter Approved → Reviewer Approved → Approver Rejected → Reviewer Approved → Approver Approved, oldest first', async () => {
    const want: [Parameters<typeof AplDetailsPage.entryRe>[0], Parameters<typeof AplDetailsPage.entryRe>[1]][] = [
      ['Drafter', 'Approved'], ['Reviewer', 'Approved'], ['Approver', 'Rejected'], ['Reviewer', 'Approved'], ['Approver', 'Approved'],
    ];
    const ordered = AplDetailsPage.chronological(entries);
    let from = 0;
    const missing: string[] = [];
    for (const [role, action] of want) {
      const i = ordered.findIndex((e, k) => k >= from && AplDetailsPage.entryRe(role, action).test(e.entry));
      if (i < 0) missing.push(`${role} — ${action}`); else from = i + 1;
    }
    const stamps = entries.map(e => parseWhen(e.time)).filter(t => !Number.isNaN(t));
    await d.showValue(d.logTable());
    // Expected "oldest first" (SA mock-up: new rows are added at the bottom). The live page lists the newest first.
    if (AplDetailsPage.listedNewestFirst(entries) && stamps.length > 1 && stamps[0] !== stamps[stamps.length - 1]) {
      await d.captureIssue(`${ts}-row-order`, d.logTable(), 'Rows listed newest first, expected oldest first');
      console.log(`DETAIL:${JSON.stringify({ label: 'Does not follow the expected result', value: 'Audit Log row order: lists the newest row first, expected oldest first (time order)' })}`);
      expect.soft(false, 'Audit Log row order: lists the newest row first, expected oldest first (time order)').toBe(true);
    }
    await c.run('rows in order', d.logTable(), () => {
      expect(missing, 'rows missing in order').toEqual([]);
    });
  });
  await test.step('Check the "Drafter — Approved" row has no signature image', async () => {
    const rows = AplDetailsPage.matching(entries, 'Drafter', 'Approved');
    await c.run('drafter row', d.logTable(), () => { if (!rows.length) throw new Error('no "Drafter — Approved" row'); });
    for (const r of rows) {
      await c.run('signature image', d.logRowAt(r.row), async () => expect(d.logRowAt(r.row).locator('img, canvas, svg')).toHaveCount(0));
    }
  });
  c.done();
});
