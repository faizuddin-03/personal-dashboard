import { expect, test } from '@playwright/test';
import { Session, MonthState, MONTH_STATE } from './session';
import { AplDetailsPage, Role } from '../pages/AplDetailsPage';
import { expectNoNewLogRow, expectStatusesUnchanged } from './workflow';

// Helpers for the merged TS (Elf's 2026-10-29 change: one TS now visits
// several months or runs several checks in a row).

/** Env key of the month typed for one status, e.g. E12028_M_PENDING. */
export const MONTH_KEY: Record<MonthState, string> = {
  Pending: 'E12028_M_PENDING', KIV: 'E12028_M_KIV', DRA: 'E12028_M_DRA', DA: 'E12028_M_DA', RRA: 'E12028_M_RRA', RA: 'E12028_M_RA', Full: 'E12028_M_FULL',
};


/**
 * Opens each listed month in turn (same login) and runs `check` on it after
 * confirming its status. One TS, several months, one recording.
 */
export async function eachMonth(s: Session, states: MonthState[], check: (d: AplDetailsPage, state: MonthState, month: string) => Promise<void>): Promise<void> {
  for (const state of states) {
    // Typed on the row, or the first month in `state` on the Summary; none → the TS is skipped with a note.
    const picked = await s.monthFor(MONTH_KEY[state], state);
    const month = picked.month;
    await test.step(`— ${MONTH_STATE[state].label}: ${month} —`, async () => {
      const { details } = await s.openMonth(month, picked.data);
      await s.requireState(details, month, state);
      await check(details, state, month);
    });
  }
}

/**
 * The "remarks are mandatory" part of a Reject TS. On the live build there is NO remarks message:
 * [Submit Reject] (#rmk-submit) starts disabled and only enables once non-blank remarks are typed
 * (live Details capture line 328 `disabled=""`; script lines 386-387 `disabled = this.value.trim().length === 0`).
 * So: blank → Submit disabled; spaces only → Submit still disabled; remarks → Submit enabled → Cancel.
 * Statuses and the "<by> — Rejected" log count must not change.
 */
export async function rejectNeedsRemarks(d: AplDetailsPage, ts: string, by: Role, remarks: string): Promise<void> {
  const status = await d.statuses();
  const before = await d.logCount(by, 'Rejected');
  const expectSubmit = async (what: string, text: string, enabled: boolean) => {
    await test.step(`Type ${what} in the Reject popup`, async () => {
      if (!(await d.rmkModal().isVisible())) await d.openRejectAndType(text);
      else await d.typeRemarks(text);
    });
    await test.step(`Check [Submit Reject] is ${enabled ? 'enabled' : 'disabled'}`, async () => {
      await d.showValue(d.rmkSubmit());
      await d.captureEvidence(`${ts}-${what.replace(/\W+/g, '-')}-remarks`);
      await d.verify(`${ts}-${what.replace(/\W+/g, '-')}-submit`, d.rmkSubmit(), `[Submit Reject] should be ${enabled ? 'enabled' : 'disabled'} with ${what}`, async () => {
        if (enabled) await expect(d.rmkSubmit()).toBeEnabled();
        else await expect(d.rmkSubmit()).toBeDisabled();
      });
    });
  };
  await expectSubmit('blank remarks', '', false);
  await expectSubmit('spaces only', '     ', false);
  await expectSubmit(`"${remarks}"`, remarks, true);
  await test.step('Click [Cancel] on the Reject popup', async () => { await d.cancelReject(); });
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
