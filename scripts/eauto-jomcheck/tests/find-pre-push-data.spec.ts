import { test } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { getUser } from '../data/users';
import { findOneClaimPrePushVehicle, findFailedPrePushVehicle, detail, FoundData } from '../utils/prePushFinder';

// NOT a TS. Data finders behind the dashboard's "Find data" button on the
// TS27 and TS31-existing rows (app/eauto/jomcheck/page.tsx, app/api/eauto-jomcheck/
// find-data/route.ts). Each logs in to BackOffice, finds a usable pre-push
// transaction (utils/prePushFinder.ts) and prints it as one `FOUND:{json}`
// line, which the API route parses and the dashboard shows for copy-paste
// into the TS's vehicle no. field. Always run headless, no video, no demo
// pauses — Faizuddin, 2026-10-05: "check for available data headless and
// fast in the background".

const found = (d: FoundData) => {
  console.log(`FOUND:${JSON.stringify(d)}`);
  detail('Vehicle no. to paste', d.vehicleNo);
  detail('Transaction', `${d.transactionNo} | ${d.createdAt} | ${d.companyName}`);
  for (const [k, v] of Object.entries(d.extra)) detail(k, v);
};

test('12339_FIND_TS27: find a pre-push 1-claim transaction for TS27', async ({ page }) => {
  test.setTimeout(20 * 60_000);
  await new LoginPage(page).login(getUser('bo'));
  found(await findOneClaimPrePushVehicle(page));
});

test('12339_FIND_TS31: find a pre-push failed transaction (Payment OK, any company) for the TS31 existing-transaction variant', async ({ page }) => {
  test.setTimeout(20 * 60_000);
  await new LoginPage(page).login(getUser('bo'));
  found(await findFailedPrePushVehicle(page));
});
