import { Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { pending } from '../../utils/pendingHtml';

// ── Post-payment outcome & invoice checks ──────────────────
// Covers every "Expected Result" cell in the sheet across both legs
// (Pre-Application and Application), for both success and failure.
export class PaymentOutcomePage extends BasePage {
  constructor(page: Page) { super(page); }

  /** Pre-Application success: confirmation page "Pre-Application Submitted for Review". */
  async expectPreApplicationSubmittedForReview(): Promise<void> {
    pending('PaymentOutcomePage.expectPreApplicationSubmittedForReview — confirmation page text/selector unknown');
  }

  /** Application success: "Application Payment Success" page. */
  async expectApplicationPaymentSuccess(): Promise<void> {
    pending('PaymentOutcomePage.expectApplicationPaymentSuccess — success page text/selector unknown');
  }

  /**
   * Failure redirect — sheet's exact copy:
   *   "Unsuccessfull Payment
   *    Something went wrong and your payment didn't go through. Please
   *    choose a payment method and retry."
   * Redirects to Pre-Application page 2 (Business Info Review) on the
   * Pre-Application leg, or back to Application Page 5 on the Application
   * leg — `context` picks which redirect target to assert.
   */
  async expectUnsuccessfulPaymentRedirect(context: 'pre-application' | 'application'): Promise<void> {
    pending(`PaymentOutcomePage.expectUnsuccessfulPaymentRedirect("${context}") — redirect target + exact error copy unconfirmed (TS6 sheet remark: "To confirm the exact error message")`);
  }

  /** Both legs: "download invoice and e-invoice" at the payment details page. */
  async downloadInvoiceAndEInvoice(): Promise<{ invoicePath: string; eInvoicePath: string }> {
    pending('PaymentOutcomePage.downloadInvoiceAndEInvoice — download button selectors unknown');
  }

  /** "Ensure the details of the Invoice and e-Invoice is correct". */
  async verifyInvoiceEInvoiceDetails(invoicePath: string, eInvoicePath: string): Promise<void> {
    pending('PaymentOutcomePage.verifyInvoiceEInvoiceDetails — expected field set to compare against unknown');
  }

  /** Pre-Application leg: "Ensure in Pre-Application listing, it is Status = Approved". */
  async expectPreApplicationListingStatusApproved(): Promise<void> {
    pending('PaymentOutcomePage.expectPreApplicationListingStatusApproved — listing selector unknown (this is the BO-side listing, not this UCD page — TODO confirm whether this check happens here or needs a BO page object)');
  }

  /** Application leg: "Ensure in Pre-Application listing, it is Status = Approved and Registration Fee = OK". */
  async expectApplicationListingStatusApprovedAndFeeOk(): Promise<void> {
    pending('PaymentOutcomePage.expectApplicationListingStatusApprovedAndFeeOk — listing selector unknown');
  }
}
