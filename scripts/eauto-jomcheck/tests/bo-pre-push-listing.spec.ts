import { test, expect, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { BoJomCheckReportListingPage } from '../pages/BoJomCheckReportListingPage';
import { getUser } from '../data/users';
import { PRE_PUSH } from '../data/prePushTransaction';
import { readExport, exportRowByTransactionNo, claimLines } from '../utils/exportReader';

// EAINT-12339, section C ("BACKOFFICE — JOMCHECK REPORT LISTING (EXISTING /
// PRE-PUSH TRANSACTIONS)"), TS28 and TS29. BackOffice only — no purchase,
// no eSim, works in either staging mode.
//
// Both read the ONE pre-push transaction whose stored values were recorded
// before the push (`data/prePushTransaction.ts`: J690008380, HXJ0001,
// 2 claims). The row is found by its Transaction Number, not "row 0",
// since HXJ0001 can gain newer rows.
//
// Not built from this section: TS27 (needs a 1-claim pre-push transaction
// with recorded values — none recorded) and TS31 (needs a pre-push FAILED
// transaction — none known; OQ-03 also asks whether failed ones list at all).

async function openPrePushRow(page: Page): Promise<{ listing: BoJomCheckReportListingPage; rowIndex: number }> {
  const login = new LoginPage(page);
  const listing = new BoJomCheckReportListingPage(page);

  await test.step('Log in to BackOffice', async () => {
    await login.login(getUser('bo'));
  });

  await test.step('Open the JomCheck Report Listing', async () => {
    await listing.goto();
  });

  await test.step(`Search by vehicle number ${PRE_PUSH.vehicleNo}`, async () => {
    await listing.searchByVehicleNo(PRE_PUSH.vehicleNo);
  });

  const rowIndex = await test.step(`Find pre-push transaction ${PRE_PUSH.transactionNo}`, async () => {
    const i = await listing.findRowIndexByTransactionNo(PRE_PUSH.transactionNo);
    expect(i, `Transaction ${PRE_PUSH.transactionNo} is not in the listing for ${PRE_PUSH.vehicleNo}`).toBeGreaterThanOrEqual(0);
    return i;
  });

  return { listing, rowIndex };
}

test('12339_TS28: Verify an existing (pre-push) transaction with 2+ claims keeps the existing numbered multi-claim display', async ({ page }) => {
  const { listing, rowIndex } = await openPrePushRow(page);

  for (const [column, stored] of Object.entries(PRE_PUSH.claims) as [keyof typeof PRE_PUSH.claims, readonly string[]][]) {
    await test.step(`${column} = stored values (${stored.join(' | ')}), numbered 1 line per claim`, async () => {
      const raw = await listing.readRawCell(rowIndex, column);
      const lines = await listing.readMultiClaimColumn(rowIndex, column);
      console.log(`DETAIL:${JSON.stringify({ label: column, value: lines.join(' | '), stored: stored.join(' | ') })}`);
      expect(raw, `${column} is not numbered "1. ..."`).toMatch(/^1\./);
      expect(lines).toEqual([...stored]);
    });
  }
});

test('12339_TS29: Verify an existing (pre-push) transaction shows "N/A" for Possible Total Loss and Possible BER', async ({ page }) => {
  const { listing, rowIndex } = await openPrePushRow(page);

  await test.step('Possible Total Loss sits between Total Loss History (Actual) and Total Loss History (BER)', async () => {
    const headers = (await listing.getColumnHeaders()).map(h => h.trim());
    const at = headers.indexOf('Possible Total Loss');
    expect(at, 'No "Possible Total Loss" column').toBeGreaterThan(0);
    expect(headers[at - 1]).toBe('Total Loss History (Actual)');
    expect(headers[at + 1]).toBe('Total Loss History (BER)');
  });

  await test.step('Possible BER sits between Total Loss History (BER) and Make / Brand', async () => {
    const headers = (await listing.getColumnHeaders()).map(h => h.trim());
    const at = headers.indexOf('Possible BER');
    expect(at, 'No "Possible BER" column').toBeGreaterThan(0);
    expect(headers[at - 1]).toBe('Total Loss History (BER)');
    expect(headers[at + 1]).toBe('Make / Brand');
  });

  await test.step('Possible Total Loss = "N/A" and Possible BER = "N/A"', async () => {
    const possibleTotalLoss = await listing.readRawCell(rowIndex, 'Possible Total Loss');
    const possibleBer = await listing.readRawCell(rowIndex, 'Possible BER');
    console.log(`DETAIL:${JSON.stringify({ label: 'Possible Total Loss', value: possibleTotalLoss })}`);
    console.log(`DETAIL:${JSON.stringify({ label: 'Possible BER', value: possibleBer })}`);
    expect(possibleTotalLoss).toBe('N/A');
    expect(possibleBer).toBe('N/A');
  });
});

// EAINT-12339 — new row from the 01.10.2026 QA review (Azila). Same pre-push
// transaction as TS28/TS29. The export's real format has not been captured —
// utils/exportReader.ts fails with the file's first bytes if it isn't .xlsx.
test('12339_TS35: Verify BackOffice export for an existing (pre-push) transaction matches the listing', async ({ page }) => {
  const { listing, rowIndex } = await openPrePushRow(page);
  const row = await test.step('Read the pre-push transaction row', async () => listing.readRow(rowIndex));

  const sheet = await test.step('Export XLSX', async () => {
    const file = await listing.downloadExport(`12339_TS35-export-${PRE_PUSH.vehicleNo}`);
    return readExport(file);
  });
  const exported = exportRowByTransactionNo(sheet, PRE_PUSH.transactionNo);

  await test.step(`Transaction ${PRE_PUSH.transactionNo} is in the export`, async () => {
    expect(exported, `Transaction ${PRE_PUSH.transactionNo} is not in the export`).toBeTruthy();
  });

  for (const [column, stored] of Object.entries(PRE_PUSH.claims) as [keyof typeof PRE_PUSH.claims, readonly string[]][]) {
    await test.step(`${column} = stored values in the listing and the export, numbered in a single cell`, async () => {
      const exportText = exported![column]?.text ?? '';
      // `value` is what the dashboard shows; a DETAIL line without it is dropped.
      console.log(`DETAIL:${JSON.stringify({ label: column, value: `listing: ${row[column]} | export: ${exportText} | stored: ${stored.join(' | ')}`, listing: row[column], export: exportText, stored: stored.join(' | ') })}`);
      expect(claimLines(row[column])).toEqual([...stored]);
      expect(claimLines(exportText)).toEqual([...stored]);
      expect(exportText, `${column} export cell is not numbered "1. ..."`).toMatch(/^1\./);
    });
  }

  await test.step('Possible Total Loss = "N/A" and Possible BER = "N/A", same as the listing', async () => {
    for (const column of ['Possible Total Loss', 'Possible BER'] as const) {
      const exportText = exported![column]?.text ?? '';
      console.log(`DETAIL:${JSON.stringify({ label: column, value: `listing: ${row[column]} | export: ${exportText}`, listing: row[column], export: exportText })}`);
      expect(row[column]).toBe('N/A');
      expect(exportText).toBe('N/A');
    }
  });
});
