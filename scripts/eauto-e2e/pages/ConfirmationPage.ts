import { BasePage } from './BasePage';
import { CONFIG } from '../data/config';
import { FIELD_RX } from '../data/types';

// ── Step 4: Confirmation — e-certificate issued ─────────────
export class ConfirmationPage extends BasePage {
  /** Capture the confirmation details (e-cert, amount, date). Returns step-4 snapshot. */
  async capture(): Promise<Record<string, string>> {
    this.reporter.progress('confirm', 'running', 'Step 4 · Confirm');
    const p4 = await this.extract(['Vehicle No', 'Confirmation of Payment', 'Payment Date', 'Payment Amount']);
    const step4: Record<string, string> = {
      eCert: await this.bodyMatch(FIELD_RX.eCert),
      vehicleRegNo: p4['Vehicle No'] || CONFIG.vehicleNo,
      confirmationOfPayment: p4['Confirmation of Payment'] || await this.bodyMatch(/Confirmation of Payment[:\s]*([A-Z0-9-]+)/i),
      paymentDate: p4['Payment Date'] || '',
      paymentAmount: p4['Payment Amount'] || await this.bodyMatch(/Payment Amount[:\s]*RM\s?([\d,]+\.\d{2})/i),
    };
    this.reporter.info(`   🎉 E-Cert ${step4.eCert} · Paid ${step4.paymentAmount} · ${step4.paymentDate}`);
    await this.shot('step4-confirm', 'Step 4 — payment successful; e-certificate issued', [
      { text: 'successfully made', label: 'Success' },
      { text: 'E-certificate No', label: 'E-Certificate' },
      { text: 'Payment Amount', label: 'Amount paid' },
    ]);
    return step4;
  }

  async clickDone(): Promise<void> {
    await this.clickWithSpotlight('button:has-text("Done"), a:has-text("Done")', 'Clicking Done');
    await this.page.waitForTimeout(1500);
    this.reporter.progress('confirm', 'done');
  }
}
