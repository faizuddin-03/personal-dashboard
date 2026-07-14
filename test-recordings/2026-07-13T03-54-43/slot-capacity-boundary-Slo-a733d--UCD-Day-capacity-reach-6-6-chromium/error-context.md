# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: slot-capacity-boundary.spec.ts >> Slot Capacity Boundary >> UCD >> Day capacity reach 6/6
- Location: tests\service-hub\specs\slot-capacity-boundary.spec.ts:89:9

# Error details

```
Error: page.waitForURL: Target page, context or browser has been closed
=========================== logs ===========================
waiting for navigation until "load"
  navigated to "https://staging.eauto.my/uat1/common/exception.do?e=500&m=Internal%20Server%20Error"
  navigated to "https://staging.eauto.my/uat1/view/ucd/service-hub/installation.do"
============================================================
```

# Test source

```ts
  1  | import { type Page, expect } from "@playwright/test";
  2  | import { BasePage } from "./BasePage";
  3  | import { PATHS } from "../utils/config";
  4  | 
  5  | export class SoftwareInstallationPage extends BasePage {
  6  |   readonly qtyField = this.page.locator("#si-qty-view");
  7  |   readonly hiddenQtyField = this.page.locator("#siQty");
  8  |   readonly incrementBtn = this.page.locator(".si-step button", { hasText: "+" });
  9  |   readonly decrementBtn = this.page.locator(".si-step button", { hasText: "−" });
  10 |   readonly makePaymentBtn = this.page.locator("#si-pay-btn");
  11 |   readonly feeAmount = this.page.locator("#si-fee-amt");
  12 |   readonly taxAmount = this.page.locator("#si-tax-amt");
  13 |   readonly totalAmount = this.page.locator("#si-tot");
  14 | 
  15 |   constructor(page: Page) {
  16 |     super(page);
  17 |   }
  18 | 
  19 |   async navigate() {
  20 |     await this.goto(PATHS.softwareInstallation);
  21 |   }
  22 | 
  23 |   async getQuantity(): Promise<number> {
  24 |     const val = await this.qtyField.inputValue();
  25 |     return Number(val) || 1;
  26 |   }
  27 | 
  28 |   async setQuantity(qty: number) {
  29 |     const currentQty = await this.getQuantity();
  30 |     if (qty > currentQty) {
  31 |       for (let i = 0; i < qty - currentQty; i++) await this.incrementBtn.click();
  32 |     } else if (qty < currentQty) {
  33 |       for (let i = 0; i < currentQty - qty; i++) await this.decrementBtn.click();
  34 |     }
  35 |   }
  36 | 
  37 |   /** Click Make Payment → wait for jQuery UI dialog → click Yes → wait for redirect to slot.do */
  38 |   async makePayment(): Promise<string> {
  39 |     await this.makePaymentBtn.click();
  40 |     await this.waitForDialog();
  41 |     await this.acceptConfirmDialog();
> 42 |     await this.page.waitForURL(/slot\.do\?txnId=/, { timeout: 15000 });
     |                     ^ Error: page.waitForURL: Target page, context or browser has been closed
  43 |     return this.getTxnIdFromUrl();
  44 |   }
  45 | 
  46 |   async purchaseInstallation(qty: number = 1): Promise<string> {
  47 |     await this.navigate();
  48 |     await this.setQuantity(qty);
  49 |     return await this.makePayment();
  50 |   }
  51 | }
  52 | 
```