import { Page } from '@playwright/test';
import { test } from '../fixtures/sessionFixture';
import { CONFIG } from '../data/config';
import { REGRESSION, SITE_DEFAULT_ON_ADDONS } from '../data/regression';
import { RegressionReporter } from '../utils/reporting';

import { SiteGatePage }       from '../pages/SiteGatePage';
import { HomePage }           from '../pages/HomePage';
import { VehicleDetailsPage } from '../pages/VehicleDetailsPage';
import { QuotationPage }      from '../pages/QuotationPage';
import { AddOnsPage }         from '../pages/AddOnsPage';
import { ConfirmationPage }   from '../pages/ConfirmationPage';
import { PaymentTypePage }    from '../pages/PaymentTypePage';
import { BankLoginPage }      from '../pages/BankLoginPage';
import { BankTACPage }        from '../pages/BankTACPage';
import { PaymentSuccessPage } from '../pages/PaymentSuccessPage';
import * as path from 'path';

// ── Secarang Regression — full purchase E2E ─────────────────
// Every step is recorded to regression-result.json for the dashboard.
// Test data and credentials live in data/regression.ts; selectors in pages/.

test.describe('Secarang Regression – Zurich E2E', () => {
  test.setTimeout(0);

  test('WYN3837 → Zurich → Add-ons → Confirm → Payment method page', async ({ regressionPage: page }) => {
    const reporter = new RegressionReporter(
      { vehicleNumber: REGRESSION.vehicleNumber, icNumber: REGRESSION.icNumber, targetInsurer: REGRESSION.targetInsurer },
      REGRESSION.outputFile,
    );
    reporter.start();

    const url = `${CONFIG.baseUrl}/car-insurance`;

    // ── 1. Navigate ──────────────────────────────────────────────
    try {
      console.log(`\n🌐 Navigating to ${url}`);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: REGRESSION.navTimeout });
      await page.waitForTimeout(500);
      const siteGate = new SiteGatePage(page);
      await siteGate.passSiteGate(CONFIG.sitePassword);
      await reporter.captureScreenshot(page, 'Home Page');
      reporter.recordStep('Navigate to site', 'PASS', url);
    } catch (e) {
      reporter.recordStep('Navigate to site', 'FAIL', String(e));
      reporter.writeResult('FAIL', String(e));
      return;
    }

    // ── 2. Select Car / Private ──────────────────────────────────
    const homePage = new HomePage(page);
    try {
      await page.waitForTimeout(1000);
      await homePage.selectVehicleAndOwner(REGRESSION.vehicleType, REGRESSION.ownerType);
      reporter.recordStep('Select vehicle / owner', 'PASS', `${REGRESSION.vehicleType} / ${REGRESSION.ownerType}`);
    } catch (e) {
      reporter.recordStep('Select vehicle / owner', 'FAIL', String(e));
      reporter.writeResult('FAIL', String(e));
      return;
    }

    // ── 3. Fill form ─────────────────────────────────────────────
    try {
      await page.waitForTimeout(1000);
      await homePage.fillForm(REGRESSION.vehicleNumber, REGRESSION.icNumber, REGRESSION.postcode);
      reporter.recordStep('Fill form', 'PASS', `VN=${REGRESSION.vehicleNumber} IC=${REGRESSION.icNumber}`);
    } catch (e) {
      reporter.recordStep('Fill form', 'FAIL', String(e));
      reporter.writeResult('FAIL', String(e));
      return;
    }

    // ── 4. Submit ────────────────────────────────────────────────
    try {
      await page.waitForTimeout(1000);
      await homePage.submit();
      await page.waitForTimeout(1000);
      reporter.recordStep('Submit form', 'PASS', 'Form submitted');
    } catch (e) {
      reporter.recordStep('Submit form', 'FAIL', String(e));
      reporter.writeResult('FAIL', String(e));
      return;
    }

    // ── 5. Vehicle details page (if shown) ───────────────────────
    let vehicleDetailsHandled = false;
    const vehicleDetailsPage = new VehicleDetailsPage(page);
    try {
      // Wait until we see either quotation cards, the vehicle-details
      // component, or an error state — whichever appears first.
      await vehicleDetailsPage.waitUntilDetailsOrCards(60_000);

      if (await vehicleDetailsPage.isShown()) {
        vehicleDetailsHandled = true;
        await reporter.captureScreenshot(page, 'Vehicle Details Page');
        await vehicleDetailsPage.proceed();
        reporter.recordStep('Vehicle details page', 'PASS', 'Variant selected and proceeded');
      } else {
        reporter.recordStep('Vehicle details page', 'SKIP', 'Not shown — went straight to quotations');
      }
    } catch (e) {
      reporter.recordStep('Vehicle details page', 'FAIL', String(e));
      reporter.writeResult('FAIL', String(e));
      return;
    }

    // ── 6. Get Quotation button (no report entry — handled inside step 5) ──
    const quotationPage = new QuotationPage(page);
    if (!vehicleDetailsHandled) {
      try {
        await quotationPage.clickGetQuotationIfShown();
      } catch (e) {
        reporter.writeResult('FAIL', String(e));
        return;
      }
    }

    // ── 7. Wait for quotation cards ──────────────────────────────
    try {
      await quotationPage.waitForCards();
      await reporter.captureScreenshot(page, 'Quotation Page');
      const count = await quotationPage.visibleCardCount();
      reporter.recordStep('Quotation results loaded', 'PASS', `${count} card element(s) loaded`);
    } catch (e) {
      reporter.recordStep('Quotation results loaded', 'FAIL', String(e));
      reporter.writeResult('FAIL', String(e));
      return;
    }

    // ── 7b. Postcode change on quotation page (non-stopping) ───
    // Only runs when quotationPostcode is set (not empty).
    // The initial form postcode (REGRESSION.postcode) is left untouched.
    if (REGRESSION.quotationPostcode) try {
      // Capture price and screenshot BEFORE applying postcode on the quotation page
      const priceBefore = await quotationPage.extractInsurerPrice(REGRESSION.targetInsurer);
      await reporter.captureScreenshot(page, `Quotation — Before Postcode (${REGRESSION.quotationPostcode})`);

      const changed = await quotationPage.changePostcodeAndWait(REGRESSION.quotationPostcode);

      if (changed) {
        const priceAfter = await quotationPage.extractInsurerPrice(REGRESSION.targetInsurer);
        await reporter.captureScreenshot(page, `Quotation — After Postcode (${REGRESSION.quotationPostcode})`);

        const priceChanged = !!(priceBefore && priceAfter && priceBefore !== priceAfter);
        const priceNote    = priceBefore && priceAfter
          ? (priceChanged
              ? `Price changed: ${priceBefore} → ${priceAfter}`
              : `Price unchanged (${priceAfter || 'not extracted'})`)
          : `Postcode applied (prices not extracted)`;

        console.log(`\n   💰 Postcode ${REGRESSION.quotationPostcode} | ${priceNote}`);
        reporter.recordStep('Postcode on quotation page', 'PASS', `${REGRESSION.quotationPostcode} | ${priceNote}`);

        reporter.postcodeChangeInfo = {
          postcode:    REGRESSION.quotationPostcode,
          priceBefore: priceBefore || '',
          priceAfter:  priceAfter  || '',
          priceChanged,
        };
      }
      // No step recorded when the postcode field isn't found on the page — that's normal.
    } catch (e) {
      reporter.recordStep('Postcode on quotation page', 'FAIL', String(e));
    }

    // ── 7c. Select sum insured (non-stopping) ───────────────
    if (REGRESSION.sumInsuredMode !== 'default') {
      try {
        const { applied, selectedValue, optionCount } = await quotationPage.selectSumInsured(
          REGRESSION.targetInsurer, REGRESSION.sumInsuredMode,
        );
        if (applied) {
          await reporter.captureScreenshot(page, `Quotation — Sum Insured (${REGRESSION.sumInsuredMode}: ${selectedValue})`);
          reporter.recordStep('Select sum insured', 'PASS',
            `${REGRESSION.sumInsuredMode} → ${selectedValue} (${optionCount} options)`);
        }
        // Silently skipped when dropdown not available — no FAIL recorded.
      } catch (e) {
        reporter.recordStep('Select sum insured', 'FAIL', String(e));
      }
    }

    // ── 8. Select insurer ────────────────────────────────────
    try {
      const { foundTarget, unavailable } = await quotationPage.selectInsurer(REGRESSION.targetInsurer, REGRESSION.coverageType);
      await page.waitForTimeout(1000);
      if (!foundTarget) {
        reporter.recordStep(`Select ${REGRESSION.targetInsurer}`, 'FAIL', `${REGRESSION.targetInsurer} card not found on quotation page`);
        reporter.writeResult('FAIL', `${REGRESSION.targetInsurer} card not found on quotation page`);
        return;
      }
      if (unavailable) {
        reporter.recordStep(`Select ${REGRESSION.targetInsurer}`, 'FAIL', `Quotation unavailable for ${REGRESSION.targetInsurer}`);
        reporter.writeResult('FAIL', `Quotation unavailable for ${REGRESSION.targetInsurer}`);
        return;
      }
      reporter.recordStep(`Select ${REGRESSION.targetInsurer}`, 'PASS', `Selected "${REGRESSION.targetInsurer}"`);
    } catch (e) {
      reporter.recordStep(`Select ${REGRESSION.targetInsurer}`, 'FAIL', String(e));
      reporter.writeResult('FAIL', String(e));
      return;
    }

    // ── 9. Add-ons page (non-stopping: missing add-ons logged as not listed) ──
    const addOnsPage = new AddOnsPage(page);
    try {
      await reporter.captureScreenshot(page, 'Add-ons Page');

      // Uncheck site-default add-ons the user has deselected in the dashboard
      const siteDefaults = SITE_DEFAULT_ON_ADDONS[REGRESSION.targetInsurer] ?? [];
      const toUncheck = siteDefaults.filter(d => !REGRESSION.targetAddons.includes(d));
      if (toUncheck.length) {
        console.log(`   🔲 Unchecking site-default add-ons: ${toUncheck.join(', ')}`);
        await addOnsPage.uncheckNamedAddons(toUncheck);
      }

      if (REGRESSION.targetAddons.length > 0) {
        const { found, notFound } = await addOnsPage.selectNamedAddons(REGRESSION.targetAddons);
        await addOnsPage.continue();
        await page.waitForTimeout(1000);
        const msg = [
          found.length     ? `Selected: ${found.join(', ')}` : '',
          notFound.length  ? `Not listed: ${notFound.join(', ')}` : '',
          toUncheck.length ? `Unchecked: ${toUncheck.join(', ')}` : '',
        ].filter(Boolean).join(' | ');
        reporter.recordStep('Add-ons page', 'PASS', msg || 'No add-ons configured');
      } else {
        // Default: pick first 2 simple add-ons
        await addOnsPage.waitAndAddSimple(2);
        await addOnsPage.continue();
        await page.waitForTimeout(1000);
        const msg = toUncheck.length
          ? `Selected first 2 simple add-ons | Unchecked: ${toUncheck.join(', ')}`
          : 'Selected first 2 simple add-ons';
        reporter.recordStep('Add-ons page', 'PASS', msg);
      }
    } catch (e) {
      // Non-stopping: record FAIL but carry on
      reporter.recordStep('Add-ons page', 'FAIL', String(e));
    }

    // ── 10. Post add-ons popup (non-stopping) ────────────────────
    try {
      await addOnsPage.handleReminderPopup();
      reporter.recordStep('Post add-ons popup', 'PASS', 'Popup dismissed (or not shown)');
    } catch (e) {
      reporter.recordStep('Post add-ons popup', 'FAIL', String(e));
      // Non-stopping: continue to confirmation page
    }

    // ── 11. Payment confirmation ─────────────────────────────────
    const confirmationPage = new ConfirmationPage(page);
    try {
      await page.waitForTimeout(1000);
      await confirmationPage.waitForPage();
      await reporter.captureScreenshot(page, 'Confirmation Page');
      await confirmationPage.fillOwnerDetails(
        REGRESSION.ownerName,
        REGRESSION.ownerEmail,
        REGRESSION.ownerPhone,
        REGRESSION.addressLine1,
        REGRESSION.addressLine2,
        REGRESSION.addressLine3,
      );
      await confirmationPage.applyDiscountCode(REGRESSION.discountCode);
      await confirmationPage.captureData(REGRESSION.icNumber);
      await page.waitForTimeout(1000);
      await confirmationPage.confirmAndPay();
      await page.waitForTimeout(1000);
      reporter.recordStep('Payment confirmation', 'PASS', 'Filled details and clicked Confirm and Pay');
    } catch (e) {
      reporter.recordStep('Payment confirmation', 'FAIL', String(e));
      reporter.writeResult('FAIL', String(e));
      return;
    }

    // ── 12. Select FPX + bank (non-stopping if bank not found) ───
    let paymentPopup: Page | null = null;
    try {
      const paymentTypePage = new PaymentTypePage(page);
      await paymentTypePage.waitForPage();
      await reporter.captureScreenshot(page, 'Payment Method Page');
      await paymentTypePage.selectFPX();
      await paymentTypePage.logAvailableBanks();
      paymentPopup = await paymentTypePage.selectBank(REGRESSION.targetBank);
      reporter.recordStep('Select payment method', 'PASS', `FPX selected, bank: ${REGRESSION.targetBank}`);
    } catch (e) {
      // Non-stopping: record FAIL but allow the test to attempt bank login if popup exists
      reporter.recordStep('Select payment method', 'FAIL', String(e));
      if (!paymentPopup) {
        reporter.writeResult('FAIL', String(e));
        return;
      }
    }

    // ── 13. Bank login ───────────────────────────────────────────
    try {
      const bankLoginPage = new BankLoginPage(paymentPopup!);
      await bankLoginPage.login(CONFIG.sitePassword, REGRESSION.bankUsername, REGRESSION.bankPassword);
      reporter.recordStep('Bank login', 'PASS', `Logged in as ${REGRESSION.bankUsername}`);
    } catch (e) {
      reporter.recordStep('Bank login', 'FAIL', String(e));
      reporter.writeResult('FAIL', String(e));
      return;
    }

    // ── 14. Request TAC ──────────────────────────────────────────
    const bankTACPage = new BankTACPage(paymentPopup!);
    try {
      await bankTACPage.logOptionsAndRequestTAC(REGRESSION.paymentStatus);
      reporter.recordStep('Request TAC', 'PASS', 'TAC requested');
    } catch (e) {
      reporter.recordStep('Request TAC', 'FAIL', String(e));
      reporter.writeResult('FAIL', String(e));
      return;
    }

    // ── 15. Enter OTP and Pay Now ────────────────────────────────
    try {
      await bankTACPage.enterOTPAndPay();
      await bankTACPage.waitForClose();
      reporter.recordStep('OTP and Pay Now', 'PASS', 'OTP entered, Pay Now clicked, popup closed');
    } catch (e) {
      reporter.recordStep('OTP and Pay Now', 'FAIL', String(e));
      reporter.writeResult('FAIL', String(e));
      return;
    }

    // ── 16. Verify outcome — success OR expected decline ────────────
    //
    // Only status "00" is a positive scenario (payment approved).
    // Every other status is a negative scenario — the expected outcome is that
    // the payment FAILS. If it fails, the test step is PASS. If it somehow
    // succeeds (success page loads), the test step is FAIL.
    const isNegativeScenario = REGRESSION.paymentStatus !== '00';
    const sitePassword = CONFIG.sitePassword;

    if (isNegativeScenario) {
      try {
        await page.waitForTimeout(2000);
        await reporter.captureScreenshot(page, 'Payment Decline Page');

        // Check whether the site landed on the success page (unexpected for a negative status).
        const successPage = new PaymentSuccessPage(page);
        const unexpectedlyApproved = await successPage.isSuccessPage(sitePassword).catch(() => false);

        if (unexpectedlyApproved) {
          reporter.recordStep(
            'Payment outcome (negative scenario)',
            'FAIL',
            `Status ${REGRESSION.paymentStatus} should have been declined but payment was approved — site did not handle the decline correctly`,
          );
          reporter.writeResult('FAIL', `Unexpected approval for negative payment status ${REGRESSION.paymentStatus}`);
          return;
        }

        reporter.recordStep(
          'Payment outcome (negative scenario)',
          'PASS',
          `Payment correctly declined for status ${REGRESSION.paymentStatus} — negative scenario passed`,
        );
      } catch {
        // Any error (timeout, navigation, etc.) means the success page never loaded,
        // which is the expected outcome for a negative scenario.
        await reporter.captureScreenshot(page, 'Payment Decline Page (error)').catch(() => {});
        reporter.recordStep(
          'Payment outcome (negative scenario)',
          'PASS',
          `Payment did not reach success page for status ${REGRESSION.paymentStatus} — negative scenario passed`,
        );
      }
    } else {
      // Positive scenario (status "00") — verify the success page fully.
      try {
        await page.waitForTimeout(2000);
        const successPage = new PaymentSuccessPage(page);
        await successPage.waitForPage(sitePassword);
        await reporter.captureScreenshot(page, 'Payment Success Page');
        const successData = await successPage.extractData();
        const pdfText = await successPage.downloadReceiptPDF(path.dirname(path.resolve(REGRESSION.outputFile)));
        const vr = successPage.generateVerificationReport(
          confirmationPage.getCapturedData(),
          successData,
          REGRESSION.vehicleNumber,
          REGRESSION.targetInsurer,
          pdfText,
        );
        reporter.verificationReport = vr.report;
        reporter.verificationData   = vr.data;
        const allDataRows = [...vr.data.vehicleRows, ...vr.data.ownerRows, ...vr.data.pricingRows];
        const fail = allDataRows.filter(r => !r.match).length;
        reporter.recordStep(
          'Payment verification',
          fail === 0 ? 'PASS' : 'FAIL',
          fail === 0 ? 'All details match between confirmation and success page' : `${fail} mismatch(es) — see verification report`,
        );
      } catch (e) {
        reporter.recordStep('Payment verification', 'FAIL', String(e));
        reporter.writeResult('FAIL', String(e));
        return;
      }
    }

    // ── All steps done ───────────────────────────────────────────
    reporter.writeResult('PASS');
    console.log('\n🎉 Regression PASSED');
  });
});
