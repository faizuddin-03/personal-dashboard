import { type Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";
import { PATHS } from "../utils/config";

/**
 * Biometric Device Purchase — two-step flow:
 *  Step 1 (purchase.do): device qty, recipient, contact, delivery address → Next
 *  Step 2 (make-payment.do): free/paid install options → Make Payment → jQuery UI
 *  confirm dialog → redirect to slot.do?txnId= (same slot picker as Software Installation)
 */
export class BiometricPurchasePage extends BasePage {
  // Step 1 — Device details
  readonly qtyInput = this.page.locator("#qty");
  readonly qtyIncrementBtn = this.page.locator('button[onclick="bioStep(1)"]');
  readonly qtyDecrementBtn = this.page.locator('button[onclick="bioStep(-1)"]');
  readonly recipientNameInput = this.page.locator("#authorizedReceiver");
  readonly contactNoInput = this.page.locator("#contactNo");
  readonly shipToShowroomCheckbox = this.page.locator("#shipToShowroom");
  readonly deliveryAddressTextarea = this.page.locator("#deliveryAddress");
  readonly nextBtn = this.page.locator("button.bio-btn.next");

  // Step 2 — Install options & payment
  readonly installOptOutCheckbox = this.page.locator("#installOptOut");
  readonly extraInstallsInput = this.page.locator("#extraInstalls");
  readonly extraInstallIncrementBtn = this.page.locator("#bio-extra-plus");
  readonly extraInstallDecrementBtn = this.page.locator("#bio-extra-minus");
  readonly makePaymentBtn = this.page.locator("#si-pay-btn");

  constructor(page: Page) {
    super(page);
  }

  async navigate() {
    await this.goto(PATHS.biometricPurchase);
  }

  async getDeviceQuantity(): Promise<number> {
    return Number(await this.qtyInput.inputValue()) || 1;
  }

  async setDeviceQuantity(qty: number) {
    const current = await this.getDeviceQuantity();
    if (qty > current) {
      for (let i = 0; i < qty - current; i++) await this.qtyIncrementBtn.click();
    } else if (qty < current) {
      for (let i = 0; i < current - qty; i++) await this.qtyDecrementBtn.click();
    }
  }

  async fillDeliveryDetails(opts: {
    recipientName: string;
    contactNo: string;
    shipToShowroom?: boolean;
    deliveryAddress?: string;
  }) {
    await this.recipientNameInput.fill(opts.recipientName);
    await this.contactNoInput.fill(opts.contactNo);

    const isChecked = await this.shipToShowroomCheckbox.isChecked();
    if (opts.shipToShowroom) {
      if (!isChecked) await this.shipToShowroomCheckbox.check();
    } else {
      if (isChecked) await this.shipToShowroomCheckbox.uncheck();
      if (opts.deliveryAddress) await this.deliveryAddressTextarea.fill(opts.deliveryAddress);
    }
  }

  async goToStep2() {
    await this.nextBtn.click();
    await this.waitForNav();
  }

  async skipInstallation() {
    await this.installOptOutCheckbox.check();
  }

  async getExtraInstalls(): Promise<number> {
    return Number(await this.extraInstallsInput.inputValue()) || 0;
  }

  async setAdditionalInstallations(qty: number) {
    const current = await this.getExtraInstalls();
    if (qty > current) {
      for (let i = 0; i < qty - current; i++) await this.extraInstallIncrementBtn.click();
    } else if (qty < current) {
      for (let i = 0; i < current - qty; i++) await this.extraInstallDecrementBtn.click();
    }
  }

  /**
   * Click Make Payment → wait for jQuery UI dialog → click Yes → wait for
   * redirect to slot.do. Matches either the old `txnId=<number>` or the new
   * `transactionId=<uuid>` id scheme (see SoftwareInstallationPage.makePayment).
   */
  async makePayment(): Promise<string> {
    await this.makePaymentBtn.click();
    await this.waitForDialog();
    await this.acceptConfirmDialog();
    await this.page.waitForURL(/slot\.do\?(id|txnId|transactionId)=/, { timeout: 15000 });
    return this.getTxnIdFromUrl();
  }

  /** Full purchase: qty devices → fill delivery → step2 → optional install opts → pay → return txnId */
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
