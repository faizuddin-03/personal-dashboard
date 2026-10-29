import { type Page, expect, test } from "@playwright/test";
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

  /**
   * Type a value directly into the quantity box and blur it — this is the
   * "manual entry above 40" path (REQ-007), distinct from setDeviceQuantity()
   * which only ever clicks the +/- steppers (and so can never exceed 40,
   * since the "+" button self-disables there). Returns the corrected value
   * read back from the field after blur.
   */
  async typeQuantityAndBlur(rawValue: string): Promise<number> {
    await this.qtyInput.fill(rawValue);
    await this.demoHighlight(this.qtyInput, { color: "green" });
    await this.qtyInput.blur();
    return this.getDeviceQuantity();
  }

  /** Error/validation message shown next to the quantity stepper, if any. */
  async getQuantityErrorText(): Promise<string> {
    return (await this.page.locator("#bio-stock-err").textContent().catch(() => "")) ?? "";
  }

  async setDeviceQuantity(qty: number) {
    const current = await this.getDeviceQuantity();
    if (qty === current) return;
    await test.step(`Set device quantity: ${current} -> ${qty}`, async () => {
      // Highlight the stepper ONCE, then run the repeated clicks suppressed —
      // pausing/highlighting on every single click (up to 40 for TS02) would
      // flood the recording rather than help a reviewer follow it.
      await this.demoHighlight(qty > current ? this.qtyIncrementBtn : this.qtyDecrementBtn);
      await this.suppressDemo(async () => {
        if (qty > current) {
          for (let i = 0; i < qty - current; i++) await this.qtyIncrementBtn.click();
        } else {
          for (let i = 0; i < current - qty; i++) await this.qtyDecrementBtn.click();
        }
      });
      const after = await this.getDeviceQuantity();
      await test.step(`Device quantity now reads ${after}`, async () => {});
    });
  }

  async fillDeliveryDetails(opts: {
    recipientName: string;
    contactNo: string;
    shipToShowroom?: boolean;
    deliveryAddress?: string;
  }) {
    await test.step(`Fill delivery details: recipient="${opts.recipientName}", contact="${opts.contactNo}", shipToShowroom=${opts.shipToShowroom ?? true}`, async () => {
      await this.recipientNameInput.fill(opts.recipientName);
      await this.contactNoInput.fill(opts.contactNo);
      await this.demoHighlight(this.recipientNameInput);

      const isChecked = await this.shipToShowroomCheckbox.isChecked();
      if (opts.shipToShowroom) {
        if (!isChecked) {
          await this.demoHighlight(this.shipToShowroomCheckbox);
          await this.shipToShowroomCheckbox.check();
        }
      } else {
        if (isChecked) await this.shipToShowroomCheckbox.uncheck();
        if (opts.deliveryAddress) {
          await this.deliveryAddressTextarea.fill(opts.deliveryAddress);
          await this.demoHighlight(this.deliveryAddressTextarea);
        }
      }
    });
  }

  async goToStep2() {
    await this.demoHighlight(this.nextBtn);
    await this.nextBtn.click();
    await this.waitForNav();
    await this.demoPause();
  }

  async skipInstallation() {
    await this.demoHighlight(this.installOptOutCheckbox);
    await this.installOptOutCheckbox.check();
  }

  async getExtraInstalls(): Promise<number> {
    return Number(await this.extraInstallsInput.inputValue()) || 0;
  }

  async setAdditionalInstallations(qty: number) {
    const current = await this.getExtraInstalls();
    if (qty === current) return;
    await test.step(`Set additional installations: ${current} -> ${qty}`, async () => {
      await this.demoHighlight(qty > current ? this.extraInstallIncrementBtn : this.extraInstallDecrementBtn);
      await this.suppressDemo(async () => {
        if (qty > current) {
          for (let i = 0; i < qty - current; i++) await this.extraInstallIncrementBtn.click();
        } else {
          for (let i = 0; i < current - qty; i++) await this.extraInstallDecrementBtn.click();
        }
      });
    });
  }

  /**
   * Click Make Payment → wait for jQuery UI dialog → click Yes → wait for
   * redirect. Matches either the old `txnId=<number>` or the new
   * `transactionId=<uuid>` id scheme (see SoftwareInstallationPage.makePayment).
   * Redirects to slot.do normally, but goes straight to submitted.do when
   * the "I don't need software installation" opt-out was checked — there's
   * no slot to pick, so slot.do never renders (confirmed live, 2026-07-31;
   * the old slot.do-only pattern hung for the full 15s in that case).
   */
  async makePayment(): Promise<string> {
    return await test.step("Click Make Payment, confirm, wait for redirect", async () => {
      await this.demoHighlight(this.makePaymentBtn);
      await this.makePaymentBtn.click();
      await this.waitForDialog();
      await this.demoHighlight(".confirm-dialog-btn", { color: "green" });
      await this.acceptConfirmDialog();
      await this.page.waitForURL(/(slot|submitted)\.do\?(id|txnId|transactionId)=/, { timeout: 15000 });
      await this.demoPause();
      const txnId = this.getTxnIdFromUrl();
      await test.step(`Purchased — ${txnId}`, async () => {});
      return txnId;
    });
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
    return await test.step(
      `Purchase Biometric Device: qty=${opts.deviceQty ?? 1}, skipInstall=${!!opts.skipInstall}, additionalInstalls=${opts.additionalInstalls ?? 0}`,
      async () => {
        await this.navigate();
        if (opts.deviceQty && opts.deviceQty > 1) await this.setDeviceQuantity(opts.deviceQty);
        await this.fillDeliveryDetails(opts);
        await this.goToStep2();
        if (opts.skipInstall) await this.skipInstallation();
        if (opts.additionalInstalls) await this.setAdditionalInstallations(opts.additionalInstalls);
        return await this.makePayment();
      },
    );
  }
}
