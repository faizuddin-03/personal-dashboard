import { expect, test } from '@playwright/test';
import { Session, MonthState, MONTH_STATE } from './session';
import { monthInput } from '../data/config';
import { AplDetailsPage, Role } from '../pages/AplDetailsPage';
import { expectNoNewLogRow, expectStatusesUnchanged } from './workflow';

// Helpers for the merged TS (Elf's 2026-10-29 change: one TS now visits
// several months or runs several checks in a row).

/** Env key of the month typed for one status, e.g. E12028_M_PENDING. */
export const MONTH_KEY: Record<MonthState, string> = {
  Pending: 'E12028_M_PENDING', KIV: 'E12028_M_KIV', DRA: 'E12028_M_DRA', DA: 'E12028_M_DA', RRA: 'E12028_M_RRA', RA: 'E12028_M_RA', Full: 'E12028_M_FULL',
};

/** The month typed on the row for `state` (blank → the TS stops naming the field). */
export const monthFor = (state: MonthState) => monthInput(MONTH_KEY[state], `${MONTH_STATE[state].label} month`);

/**
 * Opens each listed month in turn (same login) and runs `check` on it after
 * confirming its status. One TS, several months, one recording.
 */
export async function eachMonth(s: Session, states: MonthState[], check: (d: AplDetailsPage, state: MonthState, month: string) => Promise<void>): Promise<void> {
  for (const state of states) {
    const month = monthFor(state);
    await test.step(`— ${MONTH_STATE[state].label}: ${month} —`, async () => {
      const { details } = await s.openMonth(month);
      await s.requireState(details, month, state);
      await check(details, state, month);
    });
  }
}

/**
 * The "remarks are mandatory" part of a Reject TS: blank → Submit, spaces
 * only → Submit, remarks → Cancel. Statuses and the "<by> — Rejected" log
 * count must not change. Returns the messages the page showed for blank.
 */
export async function rejectNeedsRemarks(d: AplDetailsPage, ts: string, by: Role, remarks: string): Promise<void> {
  const status = await d.statuses();
  const before = await d.logCount(by, 'Rejected');
  await test.step('Click [Reject], leave the remarks blank, click [Submit Reject]', async () => {
    d.takeDialogs();
    await d.openRejectAndType('');
    await d.submitReject();
  });
  await test.step('Check a remarks-required message is shown and the reject is not submitted', async () => {
    const msgs = d.takeDialogs();
    const inPopup = (await d.rmkModal().isVisible()) ? (await d.rmkModal().innerText()).match(/[^\n]*required[^\n]*/i)?.[0] : undefined;
    const message = msgs.join('; ') || inPopup || '';
    console.log(`DETAIL:${JSON.stringify({ label: 'Blank remarks message', value: message || '(none)' })}`);
    await d.captureEvidence(`${ts}-blank-remarks`);
    // [unconfirmed] wording not in the SRD; the mock-up alerts "Remarks are required to reject." (line 538).
    await d.verify(`${ts}-no-required-message`, d.rmkModal(), 'No remarks-required message', async () => expect(message).toMatch(/required/i));
  });
  await test.step('Type spaces only and click [Submit Reject]', async () => {
    if (!(await d.rmkModal().isVisible())) await d.openRejectAndType('     ');
    else await d.typeRemarks('     ');
    await d.submitReject();
    const msgs = d.takeDialogs();
    console.log(`DETAIL:${JSON.stringify({ label: 'Spaces-only message', value: msgs.join('; ') || '(no browser message)' })}`);
    await d.captureEvidence(`${ts}-spaces-remarks`);
  });
  await test.step(`Type "${remarks}" and click [Cancel]`, async () => {
    if (!(await d.rmkModal().isVisible())) await d.openRejectAndType(remarks);
    else await d.typeRemarks(remarks);
    await d.cancelReject();
  });
  await expectStatusesUnchanged(d, ts, status);
  await expectNoNewLogRow(d, ts, by, 'Rejected', before);
}

/** Collects several checks; each failure gets its red box; one assertion at the end lists them all. */
export class Checks {
  private failed: string[] = [];
  constructor(private readonly d: { captureIssue: AplDetailsPage['captureIssue'] }, private readonly ts: string) {}
  async run(name: string, target: Parameters<AplDetailsPage['captureIssue']>[1], fn: () => Promise<void> | void): Promise<void> {
    try { await fn(); }
    catch (e) {
      const msg = e instanceof Error ? e.message.split('\n')[0] : String(e);
      this.failed.push(`${name}: ${msg}`);
      await this.d.captureIssue(`${this.ts}-${name.replace(/\W+/g, '-').slice(0, 40)}`, target, `${name} — ${msg}`.slice(0, 200));
    }
  }
  done(): void { expect(this.failed, 'checks that failed').toEqual([]); }
}
