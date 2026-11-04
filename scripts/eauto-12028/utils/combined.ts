import { expect, test } from '@playwright/test';
import { Session, MonthState, MONTH_STATE } from './session';
import { AplDetailsPage, Role } from '../pages/AplDetailsPage';
import { expectNoNewLogRow, expectStatusesUnchanged } from './workflow';
import { MSG } from '../data/expected';

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
 * The "remarks are mandatory" part of a Reject TS (12028_TS30 / TS38 expected 1-3).
 * Expected (mock-up line 538, wording rule 2026-11-04): blank or spaces-only remarks → [Submit Reject] →
 * "Remarks are required to reject." shown and nothing submitted.
 * Live build: no message — [Submit Reject] (#rmk-submit) stays DISABLED until non-blank remarks are typed
 * (script lines 386-387). So the message check fails on the live build (logged, not raised — Faizuddin,
 * 2026-11-04); "not submitted" passes. Message failures are soft: the TS carries on to the real Reject.
 */
export async function rejectNeedsRemarks(d: AplDetailsPage, ts: string, by: Role, remarks: string): Promise<void> {
  const status = await d.statuses();
  const before = await d.logCount(by, 'Rejected');
  const blankTry = async (what: string, text: string) => {
    await test.step(`Type ${what} in the Reject popup and click [Submit Reject]`, async () => {
      if (!(await d.rmkModal().isVisible())) await d.openRejectAndType(text);
      else await d.typeRemarks(text);
      const popupBefore = new Set((await d.rmkModal().innerText()).split('\n').map(l => l.trim()).filter(Boolean));
      d.takeDialogs();
      const enabled = await d.rmkSubmit().isEnabled();
      if (enabled) await d.submitReject();
      const msgs = d.takeDialogs().map(m => m.trim());
      const newLines = (await d.rmkModal().isVisible())
        ? (await d.rmkModal().innerText()).split('\n').map(l => l.trim()).filter(l => l && !popupBefore.has(l)) : [];
      const shown = [...msgs, ...newLines];
      console.log(`DETAIL:${JSON.stringify({ label: `Reject with ${what}`, value: `[Submit Reject] ${enabled ? 'clicked' : 'disabled (could not click)'}; message: ${shown.join('; ') || '(none)'}` })}`);
      await d.captureEvidence(`${ts}-${what.replace(/\W+/g, '-')}-remarks`);
      if (!shown.includes(MSG.remarks)) {
        const msg = `Reject with ${what}: expected "${MSG.remarks}", got ${shown.length ? `"${shown.join('; ')}"` : 'no message'}${enabled ? '' : ' ([Submit Reject] is disabled)'}`;
        console.log(`DETAIL:${JSON.stringify({ label: 'Does not follow the expected result', value: msg })}`);
        await d.captureIssue(`${ts}-${what.replace(/\W+/g, '-')}-no-message`, d.rmkModal(), msg.slice(0, 200));
        expect.soft(false, msg).toBe(true);
      }
    });
  };
  await blankTry('blank remarks', '');
  await blankTry('spaces only', '     ');
  await test.step(`Type "${remarks}" in the Reject popup`, async () => {
    if (!(await d.rmkModal().isVisible())) await d.openRejectAndType(remarks);
    else await d.typeRemarks(remarks);
  });
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
