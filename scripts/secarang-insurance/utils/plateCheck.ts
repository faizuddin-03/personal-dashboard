import * as fs from 'fs';
import * as path from 'path';
import { Page } from '@playwright/test';
import { CONFIG } from '../data/config';
import { SiteGatePage } from '../pages/SiteGatePage';
import { HomePage } from '../pages/HomePage';
import { VehicleDetailsPage } from '../pages/VehicleDetailsPage';
import { QuotationPage } from '../pages/QuotationPage';

// ── Plate / SSM checker ─────────────────────────────────────
// Faizuddin, 2026-10-20: real vehicle numbers and company SSMs from an Excel
// sheet are pasted on /eauto/secarang-plate-checker; for each one, does
// Secarang return an error message, or can it proceed? "Proceed" = the
// quotation cards (or a "no quotation" message) appear; nothing is bought.
// Same steps as utils/batch.ts checkVehicle, stopped before reading cards.

export interface PlateInput { vehicleNo: string; idNo: string; ownerType: 'private' | 'company'; postcode?: string }
export interface PlateResult extends PlateInput {
  result: 'PROCEED' | 'ERROR';
  /** Where it stopped: Home form, Vehicle details, Quotation, Checker. */
  stage: string;
  message: string;
}

const ERROR_TEXT = /vehicle not found|no record|invalid plate|error occurred|something went wrong|unable to retrieve/i;
const NO_QUOTE_TEXT = /no quotation|quotation unavailable|not available|unable to provide/i;

/** The first body line matching `re`, trimmed; '' when none. */
async function lineMatching(page: Page, re: RegExp): Promise<string> {
  const body = await page.locator('body').innerText().catch(() => '');
  return (body.split('\n').find(l => re.test(l)) ?? '').trim();
}

/** Saves the "Kindly confirm your navigation" popup once, so its buttons can
 *  be read and handled properly later (never captured before 2026-10-20). */
let navModalSaved = false;
async function saveNavModal(page: Page): Promise<void> {
  if (navModalSaved) return;
  const html = await page.locator('app-info-modal').first().evaluate(el => el.outerHTML).catch(() => '');
  if (!html) return;
  navModalSaved = true;
  fs.mkdirSync('test-results', { recursive: true });
  fs.writeFileSync(path.join('test-results', 'navigation-modal.html'), `<!-- ${page.url()} — ${new Date().toISOString()} -->\n${html}\n`);
}

export async function checkPlate(page: Page, row: PlateInput): Promise<PlateResult> {
  const vn = row.vehicleNo.toUpperCase().replace(/\s+/g, '');
  const done = (result: PlateResult['result'], stage: string, message: string): PlateResult =>
    ({ ...row, vehicleNo: vn, result, stage, message });

  const siteGate = new SiteGatePage(page);
  const home = new HomePage(page);
  const details = new VehicleDetailsPage(page);
  const quotation = new QuotationPage(page);
  /** The popup's message (and closes it), or null. The navigation popup is saved first. */
  const modalError = async () => {
    const modal = page.locator('app-info-modal').first();
    if (/confirm your navigation/i.test(await modal.innerText({ timeout: 500 }).catch(() => ''))) await saveNavModal(page);
    return quotation.checkAndDismissErrorModal();
  };

  const url = `${CONFIG.baseUrl}/car-insurance`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: CONFIG.navigationTimeout });
  await page.waitForTimeout(CONFIG.waitAfterPageLoad);
  await siteGate.passSiteGate(CONFIG.sitePassword);
  if (!page.url().includes('car-insurance')) {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: CONFIG.navigationTimeout });
    await page.waitForTimeout(CONFIG.waitAfterPageLoad);
  }

  await home.selectVehicleAndOwner('car', row.ownerType);
  // IC is typed as digits only; an SSM keeps its dash ("1234567-X").
  const id = row.ownerType === 'private' ? row.idNo.replace(/[-\s]/g, '') : row.idNo.trim();
  const { plateFilled, icFilled, postcodeFilled } =
    await home.fillForm(vn, id, row.postcode || CONFIG.postcode, { perFieldWaitMs: 0 });
  if (!plateFilled || !icFilled || !postcodeFilled) {
    return done('ERROR', 'Checker', `Could not fill the form (plate=${plateFilled} id=${icFilled} postcode=${postcodeFilled}) — checker fault, not a Secarang answer`);
  }
  await home.submit();

  await details.waitUntilDetailsOrCards(CONFIG.quotationTimeout * 2);
  const modalErr = await modalError();
  if (modalErr) return done('ERROR', 'Home form', modalErr);
  const homeErr = await lineMatching(page, ERROR_TEXT);
  if (homeErr) return done('ERROR', 'Home form', homeErr.slice(0, 200));

  if (!(await quotation.findCardSelector())) {
    if (!(await details.isDetailsStep()) && !(await details.isShown())) {
      return done('ERROR', 'Home form', 'No vehicle details, quotation or error message within 30 s');
    }
    await details.selectVariantAndProceed().catch(() => '');
    const detailsErr = await modalError();
    if (detailsErr) return done('ERROR', 'Vehicle details', detailsErr);
    // Re-click proceed up to 3 times while still on the details step (as batch.ts).
    let got = await quotation.waitForCardsOrNoQuote(15000, CONFIG.pollingInterval);
    for (let attempt = 0; !got && attempt < 3 && await details.isDetailsStep(); attempt++) {
      await details.selectVariantAndProceed().catch(() => '');
      const retryErr = await modalError();
      if (retryErr) return done('ERROR', 'Vehicle details', retryErr);
      got = await quotation.waitForCardsOrNoQuote(15000, CONFIG.pollingInterval);
    }
    const lateErr = await modalError();
    if (lateErr) return done('ERROR', 'Vehicle details', lateErr);
    if (!got) {
      const e = await lineMatching(page, ERROR_TEXT);
      return done('ERROR', 'Vehicle details', e ? e.slice(0, 200) : 'Stuck on vehicle details — no quotation within 60 s');
    }
  }
  if (await quotation.findCardSelector()) return done('PROCEED', 'Quotation', 'Quotation page shown');
  const noQuote = await lineMatching(page, NO_QUOTE_TEXT);
  return done('PROCEED', 'Quotation', `Reached the quotation step, no insurer quoted: ${noQuote.slice(0, 150)}`);
}
