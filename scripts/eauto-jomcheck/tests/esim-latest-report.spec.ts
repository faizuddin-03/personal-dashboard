import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { BoJomCheckReportListingPage } from '../pages/BoJomCheckReportListingPage';
import { registerEsimRestoreHook, setClaimsAndPurchase, vehicleNoFor } from '../utils/esimPurchase';
import { icapDescription } from '../data/icapCodes';

// EAINT-12339 — TS44 (section I, Regression). Precondition "Connect to eSim".
// Buys JomCheck twice for the SAME vehicle no., changing the eSim values of
// its prefix in between, then confirms the listing shows each purchase's own
// values — the second purchase must not reuse a cached copy of the first,
// and the first row must keep its own values.
//
// eSim is set and restored in the test's own page (utils/esimPurchase.ts);
// the prefix is restored to its state from BEFORE the first purchase.

registerEsimRestoreHook();

const COLUMNS = ['Odometer Reading', 'Type of Claim', 'Total No. of Parts Approved for Change', 'Possible Total Loss', 'Possible BER'] as const;

const FIRST = {
  claim: { 'Mileage Range': '10,001 to 20,000 km', 'Total Parts Changed': '1 to 10 parts', 'Claims Type (ICAP code)': '11' },
  flags: { 'Possible Total Loss': 'No', 'Possible BER': 'No' },
  expected: {
    'Odometer Reading': '10,001 to 20,000 km',
    'Type of Claim': icapDescription('11'),
    'Total No. of Parts Approved for Change': '1 to 10 parts',
    'Possible Total Loss': 'No',
    'Possible BER': 'No',
  },
};
const SECOND = {
  claim: { 'Mileage Range': '50,001 to 60,000 km', 'Total Parts Changed': '11 to 20 parts', 'Claims Type (ICAP code)': '16' },
  flags: { 'Possible Total Loss': 'Yes', 'Possible BER': 'Yes' },
  expected: {
    'Odometer Reading': '50,001 to 60,000 km',
    'Type of Claim': icapDescription('16'),
    'Total No. of Parts Approved for Change': '11 to 20 parts',
    'Possible Total Loss': 'Yes',
    'Possible BER': 'Yes',
  },
};

/** One claim reads "1. <value>" (OQ-13, numbered for now) — strip it. */
const bare = (v: string) => v.replace(/^1\.\s*/, '').trim();

async function readFive(listing: BoJomCheckReportListingPage, tx: string): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const c of COLUMNS) out[c] = bare(await listing.readRawCell(tx, c));
  return out;
}

test('12339_TS44: Verify downloaded JomCheck report always reflects the latest report across all portals', async ({ page }) => {
  test.setTimeout(20 * 60_000);
  const vehicleNo = process.env.JOMCHECK_TS44_VEHICLE_NO || vehicleNoFor('0047');

  const first = await setClaimsAndPurchase(page, vehicleNo, [FIRST.claim], FIRST.flags);

  await test.step(`Observe the listing for the first purchase ${first.tx}`, async () => {
    const values = await readFive(first.listing, first.tx);
    for (const c of COLUMNS) console.log(`DETAIL:${JSON.stringify({ label: `1st (${first.tx}) — ${c}`, value: values[c] })}`);
    expect(values).toEqual(FIRST.expected);
  });

  await test.step('Log out of BackOffice', async () => {
    await new LoginPage(page).logout();
  });

  // Same vehicle no., new eSim values for its prefix, second purchase.
  const second = await setClaimsAndPurchase(page, vehicleNo, [SECOND.claim], SECOND.flags);

  await test.step(`Confirm the second purchase ${second.tx} is a new transaction`, async () => {
    expect(second.tx).not.toBe(first.tx);
  });

  await test.step(`Confirm the second purchase ${second.tx} shows the NEW eSim values`, async () => {
    const values = await readFive(second.listing, second.tx);
    for (const c of COLUMNS) console.log(`DETAIL:${JSON.stringify({ label: `2nd (${second.tx}) — ${c}`, value: values[c] })}`);
    expect(values).toEqual(SECOND.expected);
  });

  await test.step(`Confirm the first purchase ${first.tx} still shows its own values`, async () => {
    expect(await readFive(second.listing, first.tx)).toEqual(FIRST.expected);
  });
});
