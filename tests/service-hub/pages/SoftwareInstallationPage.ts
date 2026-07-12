import { type Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";
import { PATHS } from "../utils/config";

export class SoftwareInstallationPage extends BasePage {
  readonly qtyField = this.page.locator('input[type="number"], input[type="text"]').filter({ hasText: /\d/ }).first();
  readonly incrementBtn = this.page.locator("button:has-text('+')").first();
  readonly decrementBtn = this.page.locator("button:has-text('−'), button:has-text('-')").first();
  readonly makePaymentBtn = this.page.getByText("Make Payment", { exact: false });
  readonly paymentSummary = this.page.locator("[class*='summary'], [class*='payment']").first();

  constructor(page: Page) {
    super(page);
  }

  async navigate() {
    await this.goto(PATHS.softwareInstallation);
  }

  async setQuantity(qty: number) {
    // Reset to 1 first (default), then increment
    const currentQty = Number(await this.qtyField.inputValue()) || 1;
    if (qty > currentQty) {
      for (let i = 0; i < qty - currentQty; i++) await this.incrementBtn.click();
    } else if (qty < currentQty) {
      for (let i = 0; i < currentQty - qty; i++) await this.decrementBtn.click();
    }
  }

  /** Click Make Payment and accept the confirm dialog. Returns the new txnId. */
  async makePayment(): Promise<string> {
    await this.acceptConfirmDialog();
    await this.makePaymentBtn.click();
    await this.waitForNav();
    return this.getTxnIdFromUrl();
  }

  /** Full purchase flow: set qty → pay → return txnId for slot booking */
  async purchaseInstallation(qty: number = 1): Promise<string> {
    await this.navigate();
    await this.setQuantity(qty);
    return await this.makePayment();
  }
}
