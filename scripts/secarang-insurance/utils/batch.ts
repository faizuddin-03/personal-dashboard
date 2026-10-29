import { Page } from '@playwright/test';
import { CONFIG } from '../data/config';
import { VehicleInput, VehicleResult, emptyResult } from '../data/types';
import { SiteGatePage } from '../pages/SiteGatePage';
import { HomePage } from '../pages/HomePage';
import { VehicleDetailsPage } from '../pages/VehicleDetailsPage';
import { QuotationPage } from '../pages/QuotationPage';
import { flushOutput } from './excel';

// ── Checker flow + batch helpers ────────────────────────────
// Composes page objects into the per-vehicle quotation check.
// No selectors live here — those all belong to pages/.

export function chunkArray<T>(arr: T[], n: number): T[][] {
  const size = Math.ceil(arr.length / n);
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

/** Run the full quotation check for one vehicle and return the extracted data. */
export async function checkVehicle(page: Page, v: VehicleInput, defaultIc: string): Promise<VehicleResult> {
  const vn          = v.vehicleNumber.toUpperCase();
  const vehicleType = v.vehicleType ?? 'car';
  const ownerType   = v.ownerType   ?? 'private';

  const siteGate       = new SiteGatePage(page);
  const homePage       = new HomePage(page);
  const detailsPage    = new VehicleDetailsPage(page);
  const quotationPage  = new QuotationPage(page);

  // Navigate to the right page
  const urlPath = vehicleType === 'motorcycle' ? 'motorcycle-insurance' : 'car-insurance';
  const url = `${CONFIG.baseUrl}/${urlPath}`;
  console.log(`   🌐 Navigating to ${url}`);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: CONFIG.navigationTimeout });
  await page.waitForTimeout(CONFIG.waitAfterPageLoad);

  // Handle site password gate (checks on first vehicle, no-op if already passed)
  await siteGate.passSiteGate(CONFIG.sitePassword);

  // If redirected away (e.g. back to root) try again
  if (!page.url().includes(urlPath) && !page.url().includes(CONFIG.baseUrl)) {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: CONFIG.navigationTimeout });
    await page.waitForTimeout(CONFIG.waitAfterPageLoad);
  }

  // Select vehicle type + owner type
  await homePage.selectVehicleAndOwner(vehicleType, ownerType);

  // Fill quotation form (fast cadence for the batch checker)
  const ic = (v.icNumber || defaultIc).replace(/[-\s]/g, '');
  const postcode = v.postcode || CONFIG.postcode;
  const { plateFilled, icFilled, postcodeFilled } =
    await homePage.fillForm(vn, ic, postcode, { perFieldWaitMs: 0 });

  // Guard: never submit an empty form. If the plate didn't get filled, the
  // selectors don't match this DOM — abort with the dump above for diagnosis.
  if (!plateFilled) {
    return emptyResult(vn,
      `Could not fill vehicle plate field — form selectors did not match. ` +
      `(ic=${icFilled} postcode=${postcodeFilled}). See DOM DUMP in log to map the real field names/placeholders.`
    );
  }
  if (!icFilled || !postcodeFilled) {
    console.log(`   ⚠️  Partial fill — plate ok, but ic=${icFilled} postcode=${postcodeFilled}. Submitting anyway.`);
  }

  // Submit (homepage → vehicle details OR straight to quotations)
  try {
    await homePage.submit();
  } catch (err) {
    return emptyResult(vn, `Form submit failed: ${err}`);
  }

  // Wait until the page actually settles into one of: quotation cards, the
  // vehicle-details confirmation step, an error modal, or a text error.
  console.log('   ⏳ Waiting for next page…');
  await detailsPage.waitUntilDetailsOrCards(CONFIG.quotationTimeout);
  console.log(`   📍 After submit: ${page.url()}`);

  // Check for error modal first (dismiss and record as error)
  const modalErr = await quotationPage.checkAndDismissErrorModal();
  if (modalErr) return emptyResult(vn, modalErr);

  const bodyText = await page.locator('body').innerText().catch(() => '');
  if (/vehicle not found|no record|invalid plate|error occurred|something went wrong/i.test(bodyText)) {
    const errLine = bodyText.match(/[^\n]*(?:vehicle not found|no record|invalid plate|error occurred|something went wrong)[^\n]*/i)?.[0] || '';
    return emptyResult(vn, `Error after submit: ${errLine.slice(0, 200)}`);
  }

  // ── Vehicle details confirmation step → choose variant + proceed ──
  let variant = '';
  if (!(await quotationPage.findCardSelector())) {
    console.log('   📋 Vehicle details step — selecting variant (if any) and proceeding');
    try {
      variant = await detailsPage.selectVariantAndProceed();
    } catch (err) {
      return emptyResult(vn, `Vehicle details page error: ${err}`);
    }
    // Check for an error modal that appeared right after clicking proceed
    const detailsModalErr = await quotationPage.checkAndDismissErrorModal();
    if (detailsModalErr) return emptyResult(vn, detailsModalErr);

    // Quotation API can be slow — wait but exit the instant cards show.
    // Re-click proceed up to 3 times if we're still on the details step.
    console.log('   ⏳ Waiting for quotations…');
    let got = await quotationPage.waitForCardsOrNoQuote(15000, CONFIG.pollingInterval);
    for (let attempt = 0; !got && attempt < 3 && await detailsPage.isDetailsStep(); attempt++) {
      console.log(`   🔁 Still on details — retrying proceed (${attempt + 1}/3)`);
      await detailsPage.selectVariantAndProceed().catch(() => {});
      const retryModalErr = await quotationPage.checkAndDismissErrorModal();
      if (retryModalErr) return emptyResult(vn, retryModalErr);
      got = await quotationPage.waitForCardsOrNoQuote(15000, CONFIG.pollingInterval);
    }
  } else {
    console.log('   ⚡ Quotation cards already present — skipping details step');
  }

  // ── Quotation results page ────────────────────────────────────
  console.log('   📊 Extracting quotation results…');
  const { insurers, totalDisplayed, totalAvailable } =
    await quotationPage.extractAvailability(CONFIG.quotationTimeout, CONFIG.pollingInterval);

  // Extract vehicle info from the page (skipped when the toggle is off)
  let make = '', model = '', year = '';
  if (CONFIG.checkVehicleDetails) {
    ({ make, model, year } = await quotationPage.extractVehicleTextInfo());
  }

  console.log(`   📋 ${totalDisplayed} displayed, ${totalAvailable} available`);

  return {
    vehicleNumber: vn,
    make, model, year,
    variant,
    totalDisplayed,
    totalAvailable,
    insurers,
    status: 'SUCCESS',
  };
}

/** Process one worker's slice of vehicles, flushing partial output after each. */
export async function runWorker(
  workerIdx: number,
  vehicles: VehicleInput[],
  page: Page,
  defaultIc: string,
  shared: VehicleResult[],
  outputPath: string,
): Promise<VehicleResult[]> {
  const results: VehicleResult[] = [];
  for (let i = 0; i < vehicles.length; i++) {
    const v = vehicles[i];
    console.log(`[Worker ${workerIdx + 1}] ━━━ ${i + 1}/${vehicles.length}: ${v.vehicleNumber}`);
    let res: VehicleResult;
    try {
      res = await checkVehicle(page, v, defaultIc);
    } catch (err) {
      console.error(`[Worker ${workerIdx + 1}] ❌ ${v.vehicleNumber}:`, err);
      res = emptyResult(v.vehicleNumber, String(err));
    }
    results.push(res);
    shared.push(res);
    await flushOutput(shared, outputPath);
  }
  return results;
}
