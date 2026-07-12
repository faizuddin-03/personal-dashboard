import { type Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";
import { PATHS } from "../utils/config";

export class BiometricPurchasePage extends BasePage {
  // Step 1 — Device details
  readonly deviceQtyIncrement = this.page.locator("button:has-text('+')").first();
  readonly deviceQtyDecrement = this.page.locator("button:has-text('−'), button:has-text('-')").first();
  readonly recipientNameInput = this.page.locator('input[name="authorizedReceiver"], input[placeholder*="Recipient"]').first();
  readonly contactNoInput = this.page.locator('input[name="contactNo"], input[placeholder*="Contact"]').first();
  readonly shipToShowroomCheckbox = this.page.locator('input[name="shipToShowroom"], input[type="checkbox"]').first();
  readonly deliveryAddressTextarea = this.page.locator('textarea[name="deliveryAddress"], textarea').first();
  readonly nextBtn = this.page.getByText("Next", { exact: false });

  // Step 2 — Schedule & payment
  readonly skipInstallCheckbox = this.page.getByText("I don't need software Installation", { exact: false });
  readonly additionalInstallIncrement = this.page.locator("button:has-text('+')").nth(1);
  readonly makePaymentBtn = this.page.getByText("Make Payment", { exact: false });

  constructor(page: Page) {
    super(page);
  }

  async navigate() {
    await this.goto(PATHS.biometricPurchase);
  }

  async setDeviceQuantity(qty: number) {
    for (let i = 1; i < qty; i++) await this.deviceQtyIncrement.click();
  }

  async fillDeliveryDetails(opts: {
    recipientName: string;
    contactNo: string;
    shipToShowroom?: boolean;
    deliveryAddress?: string;
  }) {
    await this.recipientNameInput.fill(opts.recipientName);
    await this.contactNoInput.fill(opts.contactNo);
    if (opts.shipToShowroom) {
      await this.shipToShowroomCheckbox.check();
    } else if (opts.deliveryAddress) {
      await this.shipToShowroomCheckbox.uncheck();
      await this.deliveryAddressTextarea.fill(opts.deliveryAddress);
    }
  }

  async goToStep2() {
    await this.nextBtn.click();
    await this.waitForNav();
  }

  async skipInstallation() {
    await this.skipInstallCheckbox.check();
  }

  async setAdditionalInstallations(qty: number) {
    for (let i = 0; i < qty; i++) await this.additionalInstallIncrement.click();
  }

  async makePayment(): Promise<string> {
    await this.acceptConfirmDialog();
    await this.makePaymentBtn.click();
    await this.waitForNav();
    return this.getTxnIdFromUrl();
  }

  /** Full purchase: qty devices → fill delivery → step2 → pay → return txnId */
  async purchaseDevice(opts: {
    deviceQty?: number;
    recipientName: string;
    contactNo: string;
    shipToShowroom?: boolean;
    deliveryAddress?: string;
    skipInstall?: boolean;
    additionalInstalls?: number;
  }): Promise<string> {
    await this.navigate();
    if (opts.deviceQty && opts.deviceQty > 1) await this.setDeviceQuantity(opts.deviceQty);
    await this.fillDeliveryDetails(opts);
    await this.goToStep2();
    if (opts.skipInstall) await this.skipInstallation();
    if (opts.additionalInstalls) await this.setAdditionalInstallations(opts.additionalInstalls);
    return await this.makePayment();
  }
}
