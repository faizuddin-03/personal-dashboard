import { expect, Page, test } from '@playwright/test';
import { Session, MonthState, sameStatus, showStatus } from './session';
import { monthInput } from '../data/config';
import { RoleKey } from '../data/users';
import { AplDetailsPage, Role, Status } from '../pages/AplDetailsPage';
import { ddmmyyyy, today } from './format';

// Steps the workflow TS (sections E to J, M) share.

/** Opens the month typed on the row as `role` and checks it is in status `want`. */
export async function openAs(page: Page, ts: string, role: RoleKey, want: MonthState, monthKey = 'E12028_MONTH', field = 'Month') {
  const month = monthInput(monthKey, field);
  const s = new Session(page, ts);
  await s.as(role);
  const { details } = await s.openMonth(month);
  await s.requireState(details, month, want);
  return { s, d: details, month };
}

/** One more "<role> — <action>" Audit Log row than before; the newest is dated today. */
export async function expectNewLogRow(d: AplDetailsPage, ts: string, role: Role, action: 'Approved' | 'KIV' | 'Rejected', before: number, remarks?: string): Promise<void> {
  await test.step(`Check the Audit Log has one new "${role} — ${action}" row dated today${remarks ? ' with the remarks typed' : ''}`, async () => {
    const log = await d.readLog();
    const re = AplDetailsPage.entryRe(role, action);
    const rows = d.logEntries(log).filter(e => re.test(e.entry));
    const newest = rows[rows.length - 1];
    await d.verify(`${ts}-log`, newest ? d.logRowAt(newest.row) : d.logTable(), `Expected ${before + 1} "${role} — ${action}" rows, found ${rows.length}`, async () => {
      expect(rows.length).toBe(before + 1);
      expect(newest.time.slice(0, 10)).toBe(ddmmyyyy(today()));
      if (remarks !== undefined) expect(newest.remarks).toBe(remarks);
    });
    await d.showValue(d.logRowAt(newest.row));
  });
}

/** The Audit Log count of an entry did not change. */
export async function expectNoNewLogRow(d: AplDetailsPage, ts: string, role: Role, action: 'Approved' | 'KIV' | 'Rejected', before: number): Promise<void> {
  await test.step(`Check no new "${role} — ${action}" row was added`, async () => {
    const after = await d.logCount(role, action);
    await d.verify(`${ts}-log`, d.logTable(), `"${role} — ${action}" rows went from ${before} to ${after}`, async () => expect(after).toBe(before));
  });
}

export async function expectStatus(d: AplDetailsPage, ts: string, role: Role, value: string): Promise<void> {
  await test.step(`Check ${role} Status is ${value}`, async () => {
    const s = await d.statuses();
    const key = role.toLowerCase() as keyof Status;
    await d.showValue(d.wfBar());
    await d.verify(`${ts}-status`, d.wfBar(), `${role} Status "${s[key]}", expected "${value}"`, async () => expect(s[key]).toBe(value));
  });
}

export async function expectStatusesUnchanged(d: AplDetailsPage, ts: string, before: Status): Promise<void> {
  await test.step(`Check the statuses are unchanged (${showStatus(before)})`, async () => {
    const now = await d.statuses();
    await d.showValue(d.wfBar());
    await d.verify(`${ts}-changed`, d.wfBar(), `Now ${showStatus(now)}`, async () => expect(sameStatus(now, before)).toBe(true));
  });
}

/** Back to the Summary and check one status cell of the month. */
export async function expectSummaryStatus(s: Session, ts: string, month: string, column: 'Drafter Status' | 'Reviewer Status' | 'Approver Status' | 'Payment Date', value: string): Promise<void> {
  const { data, status } = await s.summaryStatusOf(month);
  await test.step(`Check the Summary shows ${column} ${value} for ${month}`, async () => {
    const key = { 'Drafter Status': 'drafter', 'Reviewer Status': 'reviewer', 'Approver Status': 'approver', 'Payment Date': 'paymentDate' }[column] as keyof typeof status;
    const cell = s.summary.cellAt(data, s.summary.monthRow(data, month), column);
    await s.summary.showValue(cell);
    await s.summary.verify(`${ts}-summary`, cell, `Summary ${column} "${status[key]}", expected "${value}"`, async () => expect(status[key]).toBe(value));
  });
}
