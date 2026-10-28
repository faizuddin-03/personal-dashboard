import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { UcdJomCheckPurchasePage } from '../pages/UcdJomCheckPurchasePage';
import { getUser } from '../data/users';

// EAINT-12339 — simple utility, not a numbered TS: create a JomCheck purchase
// for a vehicle no. the user types in, via UCD. No BO check, no assertions
// beyond "the purchase went through" — Faizuddin, 2026-10-01: "a simple
// automation that allows me to enter the vehicle number, and the automation
// will create the JomCheck Purchase for me."
//
// Every user-visible action gets its own test.step() with a plain-language
// title — Faizuddin, 2026-10-02: "i want the steps to be similar to 9306,
// where it lists out one by one... its literally the human language for
// what it did." No recording for this scenario (the dashboard runs it with
// `record: false`); instead it prints DETAIL: lines the run route surfaces
// as a details panel — vehicle no., transaction id, anything useful for
// re-finding this transaction later.
test('12339_PURCHASE: create JomCheck purchase for a given vehicle no.', async ({ page }) => {
  const vehicleNo = process.env.JOMCHECK_FRESH_VEHICLE_NO;
  if (!vehicleNo) throw new Error('JOMCHECK_FRESH_VEHICLE_NO is required for this scenario.');

  const login = new LoginPage(page);
  const purchase = new UcdJomCheckPurchasePage(page);

  await test.step('Log in to UCD', async () => {
    await login.login(getUser('ucd'));
  });

  await test.step('Open the JomCheck purchase page', async () => {
    await purchase.goto();
  });

  await test.step(`Enter vehicle number ${vehicleNo} and submit`, async () => {
    await purchase.submitVehicleNo(vehicleNo);
  });

  await test.step('Confirm the vehicle was found', async () => {
    const afterSubmit = await purchase.getResultText();
    expect(afterSubmit).toContain('Vehicle number found');
  });

  await test.step('Click Pay Now', async () => {
    await purchase.payNow();
  });

  await test.step('Confirm the payment completed', async () => {
    // payNow() waits for the "Download Report" button itself — the real
    // completion signal, not #result wording (unreliable for a real
    // API-connected payment). See UcdJomCheckPurchasePage.payNow().
    expect(await purchase.isReportReady()).toBe(true);
  });

  await test.step('Record the transaction details', async () => {
    const transactionId = await purchase.getTransactionId();
    console.log(`DETAIL:${JSON.stringify({ label: 'Vehicle No.', value: vehicleNo })}`);
    console.log(`DETAIL:${JSON.stringify({ label: 'Transaction ID', value: transactionId })}`);
  });
});
