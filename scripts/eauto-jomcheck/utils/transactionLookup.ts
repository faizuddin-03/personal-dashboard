import { test, expect, Page } from '@playwright/test';
import { UcdJomCheckPurchasePage } from '../pages/UcdJomCheckPurchasePage';
import { UcdJomCheckTransactionListingPage } from '../pages/UcdJomCheckTransactionListingPage';

// Finds the Transaction No. ("J69…") of the purchase this run just paid for,
// so every later check reads THAT transaction's row, never "row 0".
// Faizuddin, 2026-10-01: "match it by transaction no."
//
// The purchase form only carries the internal UUID (hidden
// `transactionId`). The UCD Transaction Listing links each row to
// `view.do?id=<UUID>`, so searching it and matching the link gives the
// Transaction No. Call it while still logged in to UCD, after payment.

export async function lookUpTransactionNo(
  page: Page,
  purchase: UcdJomCheckPurchasePage,
  search: { vehicleNo: string } | { chassisNo: string },
): Promise<string> {
  const transactionId = await test.step('Read this purchase\'s transaction ID', async () => {
    const id = (await purchase.getTransactionId()).trim();
    expect(id, 'The purchase form has no transactionId').not.toBe('');
    return id;
  });

  const ucdListing = new UcdJomCheckTransactionListingPage(page);
  const by = 'vehicleNo' in search ? `vehicle number ${search.vehicleNo}` : `chassis number ${search.chassisNo}`;

  await test.step(`Open the UCD JomCheck Transaction Listing and search by ${by}`, async () => {
    await ucdListing.goto();
    if ('vehicleNo' in search) await ucdListing.searchByVehicleNo(search.vehicleNo);
    else await ucdListing.searchByChassisNo(search.chassisNo);
  });

  return test.step('Read the Transaction No. of this purchase', async () => {
    const txNo = await ucdListing.transactionNoForId(transactionId);
    expect(txNo, `Transaction No. for ${transactionId}`).toMatch(/^J\d+$/);
    console.log(`DETAIL:${JSON.stringify({ label: 'Transaction No.', value: txNo })}`);
    return txNo;
  });
}
