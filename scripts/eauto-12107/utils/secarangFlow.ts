import { test, expect, Page } from '@playwright/test';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { CONFIG } from '../data/config';
import { OWNER, type ScenarioData } from '../data/users';
import { SiteGatePage } from '../pages/SiteGatePage';
import { HomePage } from '../pages/HomePage';
import { VehicleDetailsPage } from '../pages/VehicleDetailsPage';
import { QuotationPage } from '../pages/QuotationPage';
import { AddOnsPage } from '../pages/AddOnsPage';
import { ConfirmationPage } from '../pages/ConfirmationPage';
import { PaymentTypePage } from '../pages/PaymentTypePage';
import { PaymentSuccessPage } from '../pages/PaymentSuccessPage';
import { BasePage } from '../pages/BasePage';

// The Secarang purchase chain up to the Select Payment Method page — shared
// by every 12107 TS (same chain scripts/secarang-insurance's regression
// drives; only the payment leg differs per TS). One test.step() per
// user-visible action so the dashboard's step list reads like the TS.

/** Lets the flow use BasePage's demo helpers on page-level locators. */
class FlowDemo extends BasePage {
  async pause(ms?: number) { await this.demoPause(ms); }
}

const detail = (label: string, value: string) => console.log('DETAIL:' + JSON.stringify({ label, value }));

export async function driveToPaymentMethod(page: Page, data: ScenarioData, ts: string): Promise<{ confirmation: ConfirmationPage; paymentType: PaymentTypePage }> {
  const demo = new FlowDemo(page);
  const url = `${CONFIG.baseUrl}${CONFIG.carInsurancePath}`;

  await test.step(`Open the Secarang car insurance page (${url})`, async () => {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: CONFIG.navigationTimeout });
    await page.waitForTimeout(500);
    await new SiteGatePage(page).passSiteGate(CONFIG.sitePassword);
    await demo.pause();
  });

  const home = new HomePage(page);
  await test.step(`Select ${data.vehicleType === 'car' ? 'Car' : 'Motorcycle'} / ${data.ownerType === 'company' ? 'Company' : 'Private'}`, async () => {
    await page.waitForTimeout(1000);
    await home.selectVehicleAndOwner(data.vehicleType, data.ownerType);
  });

  await test.step(`Enter vehicle number ${data.vehicleNumber}, ${data.ownerType === 'company' ? 'SSM' : 'IC'} and postcode ${data.postcode}`, async () => {
    expect(data.vehicleNumber, 'vehicle number is required').toBeTruthy();
    expect(data.idNumber, `${data.ownerType === 'company' ? 'company SSM' : 'owner IC'} is required`).toBeTruthy();
    await demo.demoHighlight(page.locator('input[type="text"]:visible, input:not([type]):visible').first());
    await home.fillForm(data.vehicleNumber, data.idNumber, data.postcode);
  });

  await test.step('Submit the form to get quotations', async () => {
    await demo.demoHighlight(page.locator('button:has-text("Get Quotation"), button[type="submit"]').first());
    await home.submit();
    await page.waitForTimeout(1000);
  });

  const vehicleDetails = new VehicleDetailsPage(page);
  const quotation = new QuotationPage(page);
  let detailsShown = false;
  await test.step('Confirm the vehicle details and proceed (if the details page is shown)', async () => {
    await vehicleDetails.waitUntilDetailsOrCards(60_000);
    if (await vehicleDetails.isShown()) {
      detailsShown = true;
      await demo.pause();
      await vehicleDetails.proceed();
    }
  });
  if (!detailsShown) await quotation.clickGetQuotationIfShown();

  await test.step('Wait for the insurance quotation cards', async () => {
    await quotation.waitForCards();
    const count = await quotation.visibleCardCount();
    console.log(`   🗂️  ${count} quotation card(s)`);
    await demo.pause();
  });

  await test.step(`Choose ${data.insurer}`, async () => {
    await demo.demoHighlight(page.locator('.insurance-card').filter({ hasText: new RegExp(data.insurer, 'i') }).first());
    const { foundTarget, unavailable } = await quotation.selectInsurer(data.insurer, data.coverageType);
    expect(foundTarget, `${data.insurer} card not found on the quotation page`).toBe(true);
    expect(unavailable, `Quotation unavailable for ${data.insurer}`).toBe(false);
    await page.waitForTimeout(1000);
  });

  const addOns = new AddOnsPage(page);
  await test.step('Add-ons page: keep the defaults and continue', async () => {
    await demo.pause();
    await addOns.continueToConfirmation();
  });

  const confirmation = new ConfirmationPage(page);
  await test.step('Fill the owner and contact details on the confirmation page', async () => {
    await page.waitForTimeout(1000);
    await confirmation.waitForPage();
    await demo.demoHighlight(page.locator('input[formcontrolname="name"]'));
    await confirmation.fillOwnerDetails(OWNER.name, OWNER.email, OWNER.phone, OWNER.addressLine1, OWNER.addressLine2, OWNER.addressLine3);
    await confirmation.captureData(data.idNumber);
    const captured = confirmation.getCapturedData();
    if (captured['Total Premium']) detail(`${ts} Total Premium (confirmation page)`, captured['Total Premium']);
  });

  await test.step('Click "Confirm and Pay"', async () => {
    await demo.demoHighlight(page.locator('button:has-text("Confirm and Pay")').last());
    await confirmation.confirmAndPay();
    await page.waitForTimeout(1000);
  });

  const paymentType = new PaymentTypePage(page);
  await test.step('Select Payment Method page: read the payment options', async () => {
    await paymentType.waitForPage();
    await paymentType.captureEvidence(`${ts}-payment-method-options`);
    const options = await paymentType.logPaymentOptions();
    // SRD v1.1 REQ-001/002: ShopeePay and GrabPay tiles are listed with the
    // existing Credit/Debit Card and FPX. Checked as "present", not by
    // position — the exact labels are not yet captured from the live page.
    // Live /ia 2026-10-19: the tiles read "PayLater by Grab" and "SPayLater";
    // their logos carry alt "GrabPay" and "ShopeePay", so the channel is
    // checked on tile text OR logo alt. Soft, so card / FPX TS still run on.
    const alts = await page.locator('label .payment-type-card img').evaluateAll(els => els.map(e => e.getAttribute('alt') ?? ''));
    const joined = [...options, ...alts].join(' | ');
    expect.soft(joined, 'GrabPay option missing from the Select Payment Method page').toMatch(/grab\s*pay/i);
    expect.soft(joined, 'ShopeePay option missing from the Select Payment Method page').toMatch(/shopee\s*pay/i);
  });

  return { confirmation, paymentType };
}

/**
 * Payment success page checks shared by every "Status = Success" TS: the
 * thank-you message, the premium matching the confirmation page, the
 * Payment Method text, and the receipt PDF saved as evidence.
 */
export async function verifyPaymentSuccess(page: Page, ts: string, confirmation: ConfirmationPage, data: ScenarioData, expectMethod: RegExp): Promise<void> {
  const success = new PaymentSuccessPage(page);
  let successData: Record<string, string> = {};

  await test.step('Payment Success page: confirm the "thank you" message is shown', async () => {
    await page.waitForTimeout(2000);
    try {
      await success.waitForPage(CONFIG.sitePassword);
    } catch (e) {
      await success.captureIssue(`${ts}-no-success-page`, page.getByText(/How would you like to pay\?/i).first(),
        'No Payment Success page — still on Select Payment Method');
      throw e;
    }
    await success.captureEvidence(`${ts}-payment-success-page`);
    await success.demoHighlight(page.locator('app-payment-success').first(), { color: 'green' });
  });

  await test.step('Read the receipt details on the success page', async () => {
    successData = await success.extractData();
    for (const k of ['Receipt No', 'Purchase Date', 'Payment Method', 'Total Premium']) {
      if (successData[k]) detail(`${ts} ${k}`, successData[k]);
    }
  });

  await test.step(`Confirm the Payment Method reads as ${expectMethod.source}`, async () => {
    expect(successData['Payment Method'] ?? '', 'Payment Method on the success page').toMatch(expectMethod);
  });

  await test.step('Confirm the premium on the success page matches the confirmation page', async () => {
    const before = confirmation.getCapturedData()['Total Premium'] ?? '';
    const after = successData['Total Premium'] ?? '';
    if (before && after) expect(after.replace(/\s/g, ''), 'Total Premium').toBe(before.replace(/\s/g, ''));
    else console.log(`   ⚠️  Total Premium not read on both pages (before="${before}" after="${after}") — not compared`);
  });

  await test.step('Download the receipt PDF and check the amount is on it', async () => {
    const dir = process.env.PW_EVIDENCE_DIR || fs.mkdtempSync(path.join(os.tmpdir(), 'secarang-12107-'));
    const text = await success.downloadReceiptPDF(dir);
    if (!text) { console.log('   ℹ️  No receipt PDF downloaded'); return; }
    // Keep the PDF under the TS's own name so the evidence zip shows it.
    for (const f of fs.readdirSync(dir)) {
      if (/^receipt-\d+\.pdf$/.test(f)) fs.renameSync(path.join(dir, f), path.join(dir, `${ts}-receipt.pdf`));
    }
    const total = (successData['Total Premium'] ?? '').replace(/\s/g, '').toUpperCase();
    if (total) expect(text.replace(/\s/g, '').toUpperCase(), 'Total Premium printed on the receipt').toContain(total);
    if (successData['Receipt No']) expect(text.toUpperCase(), 'Receipt No printed on the receipt').toContain(successData['Receipt No'].toUpperCase());
  });

  console.log(`\n✅ ${ts}: payment success verified for ${data.vehicleNumber} / ${data.insurer}`);
}
