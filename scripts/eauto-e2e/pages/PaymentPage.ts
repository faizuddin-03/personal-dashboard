import { BasePage } from './BasePage';
import { CONFIG, CANDIDATE_BANKS } from '../data/config';
import { FIELD_RX } from '../data/types';
import { parseMoney, approxEq, pick } from '../utils/reporting';

// ── Step 3: Payment — set email + hire purchase, then PAY NOW ─
export class PaymentPage extends BasePage {
  private payNowBtn = () => this.page.locator('button:has-text("PAY NOW"), input[value*="PAY NOW" i]').first();
  private okBtn     = () => this.page.locator('button:has-text("OK")').first();

  /** Capture person/vehicle/pricing, set the notification email + hire-purchase
   *  bank, verify step-3 discount math. Returns the step-3 snapshot. */
  async fillPaymentDetails(): Promise<Record<string, string>> {
    this.reporter.progress('payment', 'running', 'Step 3 · Payment');
    const p3 = await this.extract([
      'Reference No', 'Full Name', 'IC No', 'Vehicle No', 'Engine No', 'Chassis No', 'Make', 'Model',
      'Period of Takaful', 'Period of Insurance', 'Vehicle Use', 'Capacity', 'Year of Manufacturer',
      'Sum Covered', 'Basic Contribution', 'Contribution After NCD', 'Gross Contribution',
      'Service Tax', 'Stamp Duty', 'Total Nett Contribution After Discount',
    ]);
    const step3: Record<string, string> = {
      referenceNo: await this.bodyMatch(FIELD_RX.refNo),
      insuredName: p3['Full Name'] || '',
      ownerIC: p3['IC No'] || '',
      vehicleRegNo: p3['Vehicle No'] || '',
      engineNo: p3['Engine No'] || '',
      chassisNo: p3['Chassis No'] || '',
      model: p3['Model'] || '',
      vehicleUse: p3['Vehicle Use'] || '',
      capacity: p3['Capacity'] || '',
      year: p3['Year of Manufacturer'] || '',
      period: p3['Period of Takaful'] || p3['Period of Insurance'] || '',
      coverType: this.normalizeCover(await this.readCoverType()),
      sumCovered: await this.bodyMatch(FIELD_RX.sum),
      gross: await this.bodyMatch(FIELD_RX.gross),
      serviceTax: await this.bodyMatch(FIELD_RX.tax),
      stampDuty: await this.bodyMatch(FIELD_RX.stamp),
      totalNett: (await this.bodyMatch(FIELD_RX.totalNett)) || (await this.bodyMatch(FIELD_RX.priceIncludeTax)),
    };
    this.reporter.info(`   🧾 Ref ${step3.referenceNo} · Insured ${step3.insuredName} · Use ${step3.vehicleUse} · Nett ${step3.totalNett}`);

    await this.shot('step3-person-vehicle', 'Step 3 — Person Covered + Vehicle details', [
      { text: 'Person Covered', label: 'Person Covered' },
      { text: 'Reference No', label: 'Reference No' },
    ]);

    // Set the notification email (the input whose value already contains "@")
    await this.announce(`Setting notification email → ${CONFIG.email}`);
    const emailSel = await this.page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input')) as HTMLInputElement[];
      const target = inputs.find((i) => /@/.test(i.value));
      if (target) { target.setAttribute('data-e2e-email', '1'); return true; }
      return false;
    });
    if (emailSel) {
      const ef = this.page.locator('input[data-e2e-email="1"]');
      await ef.click(); await ef.fill(''); await ef.fill(CONFIG.email);
    } else {
      this.reporter.warn('Could not locate the email field by value — leaving default.');
    }
    step3.email = CONFIG.email;

    // Select Hire Purchase Loan bank (required)
    const chosenBank = CONFIG.bank && CONFIG.bank.toLowerCase() !== 'random' ? CONFIG.bank : pick(CANDIDATE_BANKS);
    await this.announce(`Selecting Hire Purchase bank → ${chosenBank}`);
    const bankSelected = await this.page.evaluate((bank) => {
      const sels = Array.from(document.querySelectorAll('select')) as HTMLSelectElement[];
      const target = sels.find((s) => Array.from(s.options).some((o) => /select bank/i.test(o.textContent || '')));
      if (!target) return '';
      const opt = Array.from(target.options).find((o) => (o.textContent || '').trim().toLowerCase() === bank.toLowerCase())
        || Array.from(target.options).find((o) => (o.textContent || '').toLowerCase().includes(bank.toLowerCase()));
      if (opt) { target.value = opt.value; target.dispatchEvent(new Event('change', { bubbles: true })); return (opt.textContent || '').trim(); }
      return '';
    }, chosenBank);
    step3.hirePurchase = bankSelected || chosenBank;
    if (!bankSelected) this.reporter.warn(`Bank "${chosenBank}" not found in dropdown — verify list.`);

    await this.shot('step3-payment-form', `Step 3 — email + Hire Purchase (${step3.hirePurchase}) set`, [
      { sel: 'input[data-e2e-email="1"]', label: 'Email (typed)' },
      { text: 'Hire Purchase Loan', label: 'Hire Purchase' },
    ]);
    await this.shot('step3-pricing', 'Step 3 — pricing incl. 10% discount', [
      { text: 'Total Nett Contribution After Discount', label: 'Total Nett' },
      { text: '10% Gross Contribution Discount', label: '10% discount' },
    ]);

    // Step-3 pricing math: total nett = gross + tax + stamp − 10%*gross
    const g3 = parseMoney(step3.gross), t3 = parseMoney(step3.serviceTax),
          s3 = parseMoney(step3.stampDuty), nett3 = parseMoney(step3.totalNett);
    if (g3 != null && t3 != null && s3 != null && nett3 != null) {
      const expected = +(g3 + t3 + s3 - g3 * 0.10).toFixed(2);
      this.reporter.record('Step3 Total Nett = Gross + Tax + Stamp − 10% Gross', approxEq(nett3, expected, 0.1),
        `${g3}+${t3}+${s3}−${(g3 * 0.1).toFixed(2)} = ${expected} vs ${nett3}`);
    }
    return step3;
  }

  /** Dry-run marker — call when stopBeforePayment is on. */
  async markStoppedBeforePayment(): Promise<void> {
    this.reporter.warn('E2E_STOP_BEFORE_PAYMENT=1 — stopping before PAY NOW (no data created, VN not consumed).');
    await this.shot('step3-stopped', 'Stopped before payment (dry run)');
    this.reporter.progress('payment', 'done');
  }

  /** Click PAY NOW, confirm the popup(s), and wait for the confirmation page.
   *  Throws if the payment doesn't complete (e.g. NCD referral loop). */
  async payNow(): Promise<void> {
    await this.clickWithSpotlight('button:has-text("PAY NOW"), input[value*="PAY NOW" i]', 'Clicking PAY NOW');
    await this.page.waitForTimeout(1200);
    if (await this.okBtn().count() > 0 && await this.okBtn().isVisible().catch(() => false)) {
      await this.shot('step3-confirm-popup', 'Step 3 — payment confirmation popup', [{ text: 'sufficient fund', label: 'Confirm payment' }]);
      await this.announce('Confirming payment → OK');
      await this.okBtn().click();
    }
    this.reporter.info('   ⏳ Processing payment (real insurer API — can take up to ~40s)…');
    let completed = false;
    const start = Date.now();
    while (Date.now() - start < 75000) {
      if (/complete\.do/.test(this.page.url())) { completed = true; break; }
      const ok2 = this.okBtn();
      if (await ok2.count() > 0 && await ok2.isVisible().catch(() => false)) {
        const popTxt = await this.page.locator('body').innerText().catch(() => '');
        if (/referred|NCD Response|Motor UW/i.test(popTxt)) {
          this.reporter.warn('NCD/underwriting referral popup encountered.');
          await this.shot('step3-ncd-referral', 'Step 3 — NCD/underwriting referral popup');
        }
        await ok2.click().catch(() => {});
      }
      await this.page.waitForTimeout(1500);
    }
    if (!completed) {
      await this.shot('step3-not-completed', 'Step 3 — did not reach confirmation (possible referral loop)');
      throw new Error(`Payment did not complete for ${CONFIG.vehicleNo} — likely an NCD/underwriting referral loop (known behaviour for some VNs). Try another VN.`);
    }
    await this.page.waitForTimeout(1000);
    this.reporter.progress('payment', 'done');
  }
}
