import { expect } from '@playwright/test';
import { BoJomCheckReportListingPage, RowRef } from '../pages/BoJomCheckReportListingPage';

// Shared PDF-vs-Listing crosscheck for TS02 and TS36. `pdfText` is the
// report's text as `downloadReportAsText()` returns it: whitespace collapsed
// to single spaces, uppercased.
//
// Two cases learned from a live zero-claim PDF, 2026-10-01
// (`_reference/tickets/EAINT-12339/EAINT-12339-TS27-report-VML4392-uat1-20261001.pdf` — saved under the old TS27 number,
// knowledge/flow-jomcheck.md §7j):
// 1. A vehicle with NO claims shows "-" in every claim column of the
//    Listing, while the PDF prints no claim rows — only the sentence below.
//    So "-" everywhere is checked against that sentence, never searched for
//    as text.
// 2. A short value like "No" matched anywhere on the page proves nothing
//    ("NO" is all over the PDF). Total Loss History is checked against its
//    own labelled PDF line ("ACTUAL:<value>", "BER:<value>") instead.
//    Possible Total Loss / Possible BER do not appear in the PDF at all, so
//    they are logged, not asserted.

const NO_CLAIM_HISTORY_TEXT = 'THERE ARE NO PREVIOUSLY APPROVED HISTORY RECORDED';

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isMeaningful = (v: string) => v !== '' && v.toUpperCase() !== 'N/A' && v.toUpperCase() !== 'NULL';
const detail = (label: string, value: string, inPdf: boolean | null) =>
  console.log(`DETAIL:${JSON.stringify({ label, value, inPdf })}`);

export async function crosscheckPdfWithListing(
  listing: BoJomCheckReportListingPage,
  pdfText: string,
  vehicleNo: string,
  /** The run's own row — pass its Transaction Number. */
  row: RowRef,
): Promise<void> {
  expect(pdfText).toContain(vehicleNo.toUpperCase());

  const claimColumns = {
    'Odometer Reading': await listing.readMultiClaimColumn(row, 'Odometer Reading'),
    'Type of Claim': await listing.readMultiClaimColumn(row, 'Type of Claim'),
    'Total No. of Parts Approved': await listing.readMultiClaimColumn(row, 'Total No. of Parts Approved for Change'),
  };
  const allClaimValues = Object.values(claimColumns).flat();
  const noClaims = allClaimValues.length > 0 && allClaimValues.every(v => v === '-');

  if (noClaims) {
    const inPdf = pdfText.includes(NO_CLAIM_HISTORY_TEXT);
    detail('Claim columns', '- (no claim history)', inPdf);
    expect(inPdf, 'Listing shows "-" in every claim column, but the PDF does not say "There are no previously approved history recorded"').toBe(true);
  } else {
    for (const [label, values] of Object.entries(claimColumns)) {
      for (const value of values) {
        const meaningful = isMeaningful(value);
        const inPdf = meaningful ? pdfText.includes(value.toUpperCase()) : null;
        detail(label, value, inPdf);
        if (meaningful) {
          expect(inPdf, `Listing's "${label}" = "${value}" was not found in the downloaded Report PDF`).toBe(true);
        }
      }
    }
  }

  const totalLossLines = [
    ['Total Loss History (Actual)', 'ACTUAL'],
    ['Total Loss History (BER)', 'BER'],
  ] as const;
  for (const [column, pdfLabel] of totalLossLines) {
    const value = await listing.readRawCell(row, column);
    if (!isMeaningful(value)) { detail(column, value, null); continue; }
    // Whole-word on both sides: without the left guard "BER: NO" matched
    // inside "CHASSIS NUMBER: NOT AVAILABLE", and without the right guard
    // "ACTUAL: NO" matched "ACTUAL: NO RECORD FOUND".
    const inPdf = new RegExp(`(?<![A-Z])${pdfLabel}:\\s*${escapeRegex(value.toUpperCase())}(?![A-Z0-9])`).test(pdfText);
    detail(column, value, inPdf);
    expect(inPdf, `Listing's "${column}" = "${value}" does not match the PDF's "${pdfLabel}:" line`).toBe(true);
  }

  for (const column of ['Possible Total Loss', 'Possible BER'] as const) {
    detail(`${column} (not printed in the PDF — not compared)`, await listing.readRawCell(row, column), null);
  }
}
