import { COMPANY } from '../data/config';

// The TIN a fake LLP / Business Trading run types, plus spares from the
// dashboard (E…_TIN_POOL) to swap to when eAuto refuses it as already used
// (Faizuddin, 2026-10-26, 12257_TS08: "the details are duplicated, even after i
// shuffle couple of times ... if automation detect the details is used, it will
// try to find one value that can pass").
//
// Lines printed here are read by the run route (lib/server/companySpoiled.ts):
// TIN_SPOILED = refused, TIN_USED = got through. Both mark the TIN spent on the
// dashboard, so the next run is never offered it again.

const pool = [...new Set([COMPANY.appTin, ...COMPANY.tinPool].filter(Boolean))];
let at = 0;

/**
 * Stop after this many refusals in one run. A made-up licence with a real TIN may
 * be refused whatever the TIN (TS08 2026-10-26: the Pre-Application with no TIN
 * passed; with a TIN the same LHDN pop-up came "even after i shuffle couple of
 * times"), so swapping further would only burn good TINs.
 */
export const MAX_TIN_SWAPS = 3;
let reported = '';

export const tinPool = {
  current: (): string => pool[at] ?? '',
  /** Mark the current TIN refused and move to the next one. '' when none is left. */
  refuse(reason: string): string {
    const bad = pool[at];
    if (bad) console.log('TIN_SPOILED:' + JSON.stringify({ tin: bad, reason }));
    at++;
    return at >= MAX_TIN_SWAPS ? '' : pool[at] ?? '';
  },
  /** The current TIN got through the form — never offer it again. */
  used(): void {
    const tin = pool[at];
    if (!tin || tin === reported) return;
    reported = tin;
    console.log('TIN_USED:' + JSON.stringify({ tin }));
  },
};

/** eAuto's ways of saying a value is already taken. The LHDN dialog is the one seen for a used company (12153_TS03, 2026-10-23). */
export const REFUSED_TEXT = /LHDN e-Invoice validation service is temporarily unavailable|already (been )?(used|registered|exists?)|duplicate/i;
