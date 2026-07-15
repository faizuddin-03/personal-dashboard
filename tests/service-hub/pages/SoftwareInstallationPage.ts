import { type Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";
import { PATHS } from "../utils/config";

export class SoftwareInstallationPage extends BasePage {
  readonly qtyField = this.page.locator("#si-qty-view");
  readonly hiddenQtyField = this.page.locator("#siQty");
  readonly incrementBtn = this.page.locator(".si-step button", { hasText: "+" });
  readonly decrementBtn = this.page.locator(".si-step button", { hasText: "−" });
  readonly makePaymentBtn = this.page.locator("#si-pay-btn");
  readonly feeAmount = this.page.locator("#si-fee-amt");
  readonly taxAmount = this.page.locator("#si-tax-amt");
  readonly totalAmount = this.page.locator("#si-tot");

  constructor(page: Page) {
    super(page);
  }

  async navigate() {
    await this.goto(PATHS.softwareInstallation);
  }

  async getQuantity(): Promise<number> {
    const val = await this.qtyField.inputValue();
    return Number(val) || 1;
  }

  async setQuantity(qty: number) {
    const currentQty = await this.getQuantity();
    if (qty > currentQty) {
      for (let i = 0; i < qty - currentQty; i++) await this.incrementBtn.click();
    } else if (qty < currentQty) {
      for (let i = 0; i < currentQty - qty; i++) await this.decrementBtn.click();
    }
  }

  /**
   * Click Make Payment → wait for jQuery UI dialog → click Yes → wait for
   * redirect to slot.do. The redirect's id param used to be `txnId=<number>`;
   * a deployment changed it to `transactionId=<uuid>` (same destination page,
   * confirmed live) — match either so this keeps working under both schemes.
   */
  async makePayment(): Promise<string> {
    await this.makePaymentBtn.click();
    await this.waitForDialog();
    await this.acceptConfirmDialog();
    await this.page.waitForURL(/slot\.do\?(txnId|transactionId)=/, { timeout: 15000 });
    return this.getTxnIdFromUrl();
  }

  async purchaseInstallation(qty: number = 1): Promise<string> {
    await this.navigate();
    await this.setQuantity(qty);
    return await this.makePayment();
  }
}
