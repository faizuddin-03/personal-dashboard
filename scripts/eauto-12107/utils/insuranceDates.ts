import { test, type Page } from '@playwright/test';
import { CiboListingPage, CiboLoginPage } from '../pages/cibo/CiboPages';

// ── Insurance Created Date per transaction ref ──────────────
// Payment Report must be narrowed by "Insurance Created From / Till" to at
// most one week around the target transaction (Faizuddin, 2026-10-19: "make
// sure to set not more than a week of a target date") — an open search took
// about 2 minutes per ref on staging. The date is the "Insurance Created
// Date" column of the Transaction Management listing ("dd-mm-yyyy hh:mm", or
// "-" when the transaction never got insurance).

/** ref → Insurance Created Date as a local Date (null = none on CIBO). */
export const INSURANCE_DATES: Record<string, Date | null> = {};

const detail = (label: string, value: string) => console.log('DETAIL:' + JSON.stringify({ label, value }));

/** "19-10-2026 16:46" → Date (day only); anything else → null. */
export function parseCiboDate(text: string): Date | null {
  const m = /^(\d{2})-(\d{2})-(\d{4})/.exec((text ?? '').trim());
  return m ? new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])) : null;
}

/** Remembers a date read from a listing row (used by the ref finder). */
export function rememberInsuranceDate(ref: string, cell: string): void {
  if (ref) INSURANCE_DATES[ref] = parseCiboDate(cell);
}

/**
 * Looks up the Insurance Created Date of every ref not yet known, by
 * searching it on Transaction Management, then opens `backTo`.
 */
export async function resolveInsuranceDates(page: Page, login: CiboLoginPage, refs: string[], backTo: string): Promise<void> {
  const todo = [...new Set(refs.filter(r => r && !(r in INSURANCE_DATES)))];
  if (todo.length) {
    await test.step(`Read the Insurance Created Date of ${todo.join(', ')} on Transaction Management`, async () => {
      await login.openMenu('Transaction Management');
      const listing = new CiboListingPage(page);
      await listing.quietly(async () => {
        for (const ref of todo) {
          await listing.search(ref);
          const row = (await listing.rows()).find(r => (r['Transaction Ref. No.'] ?? '').startsWith(ref));
          INSURANCE_DATES[ref] = parseCiboDate(row?.['Insurance Created Date'] ?? '');
        }
      });
      for (const ref of todo) {
        const d = INSURANCE_DATES[ref];
        detail(`${ref} Insurance Created Date`, d ? d.toDateString() : 'none — not on Payment Report');
      }
    });
  }
  await test.step(`Open the ${backTo} page`, async () => { await login.openMenu(backTo); });
}

/** The one-week window for a ref: its Insurance Created Date and 6 days after. */
export function weekFrom(d: Date): { from: Date; till: Date } {
  const till = new Date(d);
  till.setDate(till.getDate() + 6);
  // Never past today — a future day may not be pickable.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return { from: d, till: till > today ? today : till };
}

/** The 7 days up to today, for a page-wide check with no single ref. */
export function lastWeek(): { from: Date; till: Date } {
  const till = new Date();
  till.setHours(0, 0, 0, 0);
  const from = new Date(till);
  from.setDate(from.getDate() - 6);
  return { from, till };
}
