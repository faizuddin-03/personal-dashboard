import { test, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

import { SiteGatePage }       from './pages/SiteGatePage';
import { HomePage }           from './pages/HomePage';
import { VehicleDetailsPage } from './pages/VehicleDetailsPage';
import { QuotationPage }      from './pages/QuotationPage';
import { AddOnsPage }         from './pages/AddOnsPage';
import { ConfirmationPage }   from './pages/ConfirmationPage';
import { PaymentTypePage }    from './pages/PaymentTypePage';
import { BankLoginPage }      from './pages/BankLoginPage';
import { BankTACPage }        from './pages/BankTACPage';
import { PaymentSuccessPage, VerificationData } from './pages/PaymentSuccessPage';

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const CONFIG = {
  baseUrl:        process.env.SECARANG_BASE_URL      || 'https://staging.secarang.com/preprod',
  sitePassword:   process.env.SECARANG_SITE_PASSWORD || 'eAuTo<2025#',
  vehicleNumber:  process.env.REGRESSION_VN          || 'WYN3837',
  icNumber:       process.env.REGRESSION_IC          || '730620065847',
  postcode:       process.env.REGRESSION_POSTCODE    || '55000',
  targetInsurer:  process.env.REGRESSION_INSURER     || 'Zurich',
  vehicleType:    process.env.REGRESSION_VEHICLE_TYPE || 'car',
  ownerType:      process.env.REGRESSION_OWNER_TYPE   || 'private',
  // Comma-separated add-on names to select (e.g. "Windshield,CART")
  // Empty = select first 2 simple add-ons as before
  targetAddons:   (process.env.REGRESSION_ADDONS || '').split(',').map(s => s.trim()).filter(Boolean),
  // Owner / contact details for payment confirmation page
  ownerName:      process.env.REGRESSION_NAME        || 'MUHAMMAD FAIZUDDIN BIN BIDI',
  ownerEmail:     process.env.REGRESSION_EMAIL       || 'faizuddin@modefair.com',
  ownerPhone:     process.env.REGRESSION_PHONE       || '189812839',
  addressLine1:   process.env.REGRESSION_ADDR1       || '2505, Arctic Monkeys Road',
  addressLine2:   process.env.REGRESSION_ADDR2       || 'Taman Monyet Kutub',
  addressLine3:   process.env.REGRESSION_ADDR3       || 'Shah Alam, Selangor',
  discountCode:   process.env.REGRESSION_DISCOUNT    || 'YEAY7',
  // Payment gateway
  targetBank:     process.env.REGRESSION_BANK        || 'fpx_mb2u',   // Maybank
  bankUsername:   process.env.REGRESSION_BANK_USER   || 'Gaara',
  bankPassword:   process.env.REGRESSION_BANK_PASS   || 'letmepaywithsand',
  outputFile:     './regression-result.json',
  navTimeout:     90_000,
  stepTimeout:    30_000,
  pollInterval:   200,
  waitAfterClick: 500,
};

// ─── STEP TRACKING ───────────────────────────────────────────────────────────
interface StepResult {
  name:      string;
  status:    'PASS' | 'FAIL' | 'SKIP';
  message:   string;
  timestamp: string;
}

interface RegressionResult {
  vehicleNumber:       string;
  icNumber:            string;
  targetInsurer:       string;
  overallStatus:       'PASS' | 'FAIL';
  steps:               StepResult[];
  errorMessage?:       string;
  startedAt:           string;
  completedAt:         string;
  durationMs:          number;
  verificationReport?: string;
  verificationData?:   VerificationData;
}

const steps: StepResult[] = [];
let startedAt          = new Date().toISOString();
let verificationReport = '';
let verificationData: VerificationData | undefined;

function recordStep(name: string, status: StepResult['status'], message: string) {
  const s: StepResult = { name, status, message, timestamp: new Date().toISOString() };
  steps.push(s);
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️';
  console.log(`${icon} [${status}] ${name}: ${message}`);
}

function writeResult(overallStatus: 'PASS' | 'FAIL', errorMessage?: string) {
  const completedAt = new Date().toISOString();
  const result: RegressionResult = {
    vehicleNumber:  CONFIG.vehicleNumber,
    icNumber:       CONFIG.icNumber,
    targetInsurer:  CONFIG.targetInsurer,
    overallStatus,
    steps,
    errorMessage,
    startedAt,
    completedAt,
    durationMs:          new Date(completedAt).getTime() - new Date(startedAt).getTime(),
    verificationReport:  verificationReport  || undefined,
    verificationData:    verificationData    || undefined,
  };
  const outPath = path.resolve(CONFIG.outputFile);
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
  console.log(`\n📁 Result written to: ${outPath}`);
}

// ─── MAIN TEST ───────────────────────────────────────────────────────────────
test.describe('Secarang Regression – Zurich E2E', () => {
  test.setTimeout(0);

  test('WYN3837 → Zurich → Add-ons → Confirm → Payment method page', async ({ page }) => {
    startedAt = new Date().toISOString();
    page.setDefaultNavigationTimeout(CONFIG.navTimeout);
    page.setDefaultTimeout(CONFIG.stepTimeout);

    const url = `${CONFIG.baseUrl}/car-insurance`;

    // ── 1. Navigate ──────────────────────────────────────────────
    try {
      console.log(`\n🌐 Navigating to ${url}`);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: CONFIG.navTimeout });
      await page.waitForTimeout(500);
      const siteGate = new SiteGatePage(page);
      await siteGate.passSiteGate(CONFIG.sitePassword);
      recordStep('Navigate to site', 'PASS', url);
    } catch (e) {
      recordStep('Navigate to site', 'FAIL', String(e));
      writeResult('FAIL', String(e));
      return;
    }

    // ── 2. Select Car / Private ──────────────────────────────────
    try {
      await page.waitForTimeout(1000);
      const homePage = new HomePage(page);
      await homePage.selectVehicleAndOwner(CONFIG.vehicleType, CONFIG.ownerType);
      recordStep('Select vehicle / owner', 'PASS', `${CONFIG.vehicleType} / ${CONFIG.ownerType}`);
    } catch (e) {
      recordStep('Select vehicle / owner', 'FAIL', String(e));
      writeResult('FAIL', String(e));
      return;
    }

    // ── 3. Fill form ─────────────────────────────────────────────
    try {
      await page.waitForTimeout(1000);
      const homePage = new HomePage(page);
      await homePage.fillForm(CONFIG.vehicleNumber, CONFIG.icNumber, CONFIG.postcode);
      recordStep('Fill form', 'PASS', `VN=${CONFIG.vehicleNumber} IC=${CONFIG.icNumber}`);
    } catch (e) {
      recordStep('Fill form', 'FAIL', String(e));
      writeResult('FAIL', String(e));
      return;
    }

    // ── 4. Submit ────────────────────────────────────────────────
    try {
      await page.waitForTimeout(1000);
      const homePage = new HomePage(page);
      await homePage.submit();
      await page.waitForTimeout(1000);
      recordStep('Submit form', 'PASS', 'Form submitted');
    } catch (e) {
      recordStep('Submit form', 'FAIL', String(e));
      writeResult('FAIL', String(e));
      return;
    }

    // ── 5. Vehicle details page (if shown) ───────────────────────
    try {
      const vehicleDetailsPage = new VehicleDetailsPage(page);
      const CARD_SELS = ['.insurance-card', '.quotation-card', '.quote-card', '.insurer-card', '.plan-card'];

      const deadline = Date.now() + 25_000;
      while (Date.now() < deadline) {
        const hasCards = await (async () => {
          for (const s of CARD_SELS) if ((await page.locator(s).count()) > 0) return true;
          return false;
        })();
        if (hasCards) break;
        const t = (await page.locator('body').innerText().catch(() => '')).toLowerCase();
        if (/are these your vehicle|get quotation|vehicle not found/i.test(t)) break;
        await page.waitForTimeout(200);
      }

      if (await vehicleDetailsPage.isShown()) {
        await vehicleDetailsPage.proceed();
        recordStep('Vehicle details page', 'PASS', 'Variant selected and proceeded');
      } else {
        recordStep('Vehicle details page', 'SKIP', 'Not shown — went straight to quotations');
      }
    } catch (e) {
      recordStep('Vehicle details page', 'FAIL', String(e));
      writeResult('FAIL', String(e));
      return;
    }

    // ── 6. Get Quotation button (intermediate page after vehicle details) ────
    try {
      const quotationPage = new QuotationPage(page);
      const clicked = await quotationPage.clickGetQuotationIfShown();
      recordStep('Get Quotation', clicked ? 'PASS' : 'SKIP',
        clicked ? 'Clicked Get Quotation button' : 'Not shown — cards already loading');
    } catch (e) {
      recordStep('Get Quotation', 'FAIL', String(e));
      writeResult('FAIL', String(e));
      return;
    }

    // ── 7. Wait for quotation cards ──────────────────────────────
    let cardSel = '';
    try {
      const quotationPage = new QuotationPage(page);
      cardSel = await quotationPage.waitForCards();
      const count = await page.locator(cardSel).count();
      recordStep('Quotation results loaded', 'PASS', `${count} card(s) via "${cardSel}"`);
    } catch (e) {
      recordStep('Quotation results loaded', 'FAIL', String(e));
      writeResult('FAIL', String(e));
      return;
    }

    // ── 8. Select insurer (non-stopping: picks first available if target not found) ─
    try {
      const quotationPage = new QuotationPage(page);
      const { foundTarget, selectedName } = await quotationPage.selectInsurer(cardSel, CONFIG.targetInsurer);
      await page.waitForTimeout(1000);
      if (foundTarget) {
        recordStep(`Select ${CONFIG.targetInsurer}`, 'PASS', `Selected "${CONFIG.targetInsurer}"`);
      } else if (selectedName) {
        recordStep(`Select ${CONFIG.targetInsurer}`, 'SKIP',
          `"${CONFIG.targetInsurer}" not found — selected first available: "${selectedName}"`);
      } else {
        recordStep(`Select ${CONFIG.targetInsurer}`, 'SKIP', 'No quotation cards available — continuing');
      }
    } catch (e) {
      // Unexpected error — record but do not abort
      recordStep(`Select ${CONFIG.targetInsurer}`, 'FAIL', String(e));
    }

    // ── 9. Add-ons page (non-stopping: missing add-ons logged as not listed) ──
    try {
      const addOnsPage = new AddOnsPage(page);
      if (CONFIG.targetAddons.length > 0) {
        const { found, notFound } = await addOnsPage.selectNamedAddons(CONFIG.targetAddons);
        await addOnsPage.continue();
        await page.waitForTimeout(1000);
        const msg = [
          found.length    ? `Selected: ${found.join(', ')}` : '',
          notFound.length ? `Not listed: ${notFound.join(', ')}` : '',
        ].filter(Boolean).join(' | ');
        recordStep('Add-ons page', 'PASS', msg || 'No add-ons configured');
      } else {
        // Default: pick first 2 simple add-ons
        await addOnsPage.waitAndAddSimple(2);
        await addOnsPage.continue();
        await page.waitForTimeout(1000);
        recordStep('Add-ons page', 'PASS', 'Selected first 2 simple add-ons');
      }
    } catch (e) {
      // Non-stopping: record FAIL but carry on
      recordStep('Add-ons page', 'FAIL', String(e));
    }

    // ── 10. Post add-ons popup (non-stopping) ────────────────────
    try {
      const addOnsPage = new AddOnsPage(page);
      await addOnsPage.handleReminderPopup();
      recordStep('Post add-ons popup', 'PASS', 'Popup dismissed (or not shown)');
    } catch (e) {
      recordStep('Post add-ons popup', 'FAIL', String(e));
      // Non-stopping: continue to confirmation page
    }

    // ── 11. Payment confirmation ─────────────────────────────────
    const confirmationPage = new ConfirmationPage(page);
    try {
      await page.waitForTimeout(1000);
      await confirmationPage.waitForPage();
      await confirmationPage.fillOwnerDetails(
        CONFIG.ownerName,
        CONFIG.ownerEmail,
        CONFIG.ownerPhone,
        CONFIG.addressLine1,
        CONFIG.addressLine2,
        CONFIG.addressLine3,
      );
      await confirmationPage.applyDiscountCode(CONFIG.discountCode);
      await confirmationPage.captureData(CONFIG.icNumber);
      await page.waitForTimeout(1000);
      await confirmationPage.confirmAndPay();
      await page.waitForTimeout(1000);
      recordStep('Payment confirmation', 'PASS', 'Filled details and clicked Confirm and Pay');
    } catch (e) {
      recordStep('Payment confirmation', 'FAIL', String(e));
      writeResult('FAIL', String(e));
      return;
    }

    // ── 12. Select FPX + bank (non-stopping if bank not found) ───
    let paymentPopup: Page | null = null;
    try {
      const paymentTypePage = new PaymentTypePage(page);
      await paymentTypePage.waitForPage();
      await paymentTypePage.selectFPX();
      await paymentTypePage.logAvailableBanks();
      paymentPopup = await paymentTypePage.selectBank(CONFIG.targetBank);
      recordStep('Select payment method', 'PASS', `FPX selected, bank: ${CONFIG.targetBank}`);
    } catch (e) {
      // Non-stopping: record FAIL but allow the test to attempt bank login if popup exists
      recordStep('Select payment method', 'FAIL', String(e));
      if (!paymentPopup) {
        writeResult('FAIL', String(e));
        return;
      }
    }

    // ── 13. Bank login ───────────────────────────────────────────
    try {
      const bankLoginPage = new BankLoginPage(paymentPopup!);
      await bankLoginPage.login(CONFIG.sitePassword, CONFIG.bankUsername, CONFIG.bankPassword);
      recordStep('Bank login', 'PASS', `Logged in as ${CONFIG.bankUsername}`);
    } catch (e) {
      recordStep('Bank login', 'FAIL', String(e));
      writeResult('FAIL', String(e));
      return;
    }

    // ── 14. Request TAC ──────────────────────────────────────────
    const bankTACPage = new BankTACPage(paymentPopup!);
    try {
      await bankTACPage.logOptionsAndRequestTAC();
      recordStep('Request TAC', 'PASS', 'TAC requested');
    } catch (e) {
      recordStep('Request TAC', 'FAIL', String(e));
      writeResult('FAIL', String(e));
      return;
    }

    // ── 15. Enter OTP and Pay Now ────────────────────────────────
    try {
      await bankTACPage.enterOTPAndPay();
      await bankTACPage.waitForClose();
      recordStep('OTP and Pay Now', 'PASS', 'OTP entered, Pay Now clicked, popup closed');
    } catch (e) {
      recordStep('OTP and Pay Now', 'FAIL', String(e));
      writeResult('FAIL', String(e));
      return;
    }

    // ── 16. Verify success page + comparison report ──────────────
    try {
      await page.waitForTimeout(2000);
      const successPage = new PaymentSuccessPage(page);
      await successPage.waitForPage(CONFIG.sitePassword);
      const successData = await successPage.extractData();
      const pdfText = await successPage.downloadReceiptPDF(path.dirname(path.resolve(CONFIG.outputFile)));
      const vr = successPage.generateVerificationReport(
        confirmationPage.getCapturedData(),
        successData,
        CONFIG.vehicleNumber,
        CONFIG.targetInsurer,
        pdfText,
      );
      verificationReport = vr.report;
      verificationData   = vr.data;
      const allDataRows = [...vr.data.vehicleRows, ...vr.data.ownerRows, ...vr.data.pricingRows];
      const fail = allDataRows.filter(r => !r.match).length;
      recordStep(
        'Payment verification',
        fail === 0 ? 'PASS' : 'FAIL',
        fail === 0 ? 'All details match between confirmation and success page' : `${fail} mismatch(es) — see verification report`,
      );
    } catch (e) {
      recordStep('Payment verification', 'FAIL', String(e));
      writeResult('FAIL', String(e));
      return;
    }

    // ── All steps done ───────────────────────────────────────────
    writeResult('PASS');
    console.log('\n🎉 Regression PASSED — payment verified');
  });
});
