# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: reschedule-handling.spec.ts >> Reschedule & Handling >> UCD >> Reschedule on the day of the initial appointment to a future date
- Location: tests\service-hub\specs\reschedule-handling.spec.ts:18:9

# Error details

```
TimeoutError: locator.inputValue: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('input[type="number"], input[type="text"]').filter({ hasText: /\d/ }).first()

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e3]:
      - link "Home" [ref=e4] [cursor=pointer]:
        - /url: /uat1/view/ucd/
      - generic [ref=e5]: /
      - link "Service Hub" [ref=e6] [cursor=pointer]:
        - /url: /uat1/view/ucd/service-hub/view.do
      - generic [ref=e7]: /
      - generic [ref=e8]: Software Installation
    - generic [ref=e9]:
      - link "« Back" [ref=e10] [cursor=pointer]:
        - /url: /uat1/view/ucd/service-hub/view.do
      - generic: Software Installation
    - generic [ref=e13]:
      - generic [ref=e14]:
        - img "Software Installation" [ref=e15]
        - generic [ref=e16]:
          - generic [ref=e17]: Software Installation
          - generic [ref=e18]: Pay first, then pick your installation appointment
        - generic [ref=e19]: RM 54.00 / request
      - generic [ref=e20]:
        - generic [ref=e21]:
          - generic [ref=e22]: "Number of installations:"
          - generic [ref=e24]:
            - button "−" [ref=e25] [cursor=pointer]
            - textbox [ref=e26]: "1"
            - button "+" [ref=e27] [cursor=pointer]
        - generic [ref=e29]:
          - generic [ref=e30]: Payment Summary
          - table [ref=e31]:
            - rowgroup [ref=e32]:
              - row "Description RM" [ref=e33]:
                - columnheader "Description" [ref=e34]
                - columnheader "RM" [ref=e35]
            - rowgroup [ref=e36]:
              - 'row "Software Installation Fee: 50.00" [ref=e37]':
                - cell "Software Installation Fee:" [ref=e38]
                - cell "50.00" [ref=e39]
              - 'row "Service Tax 8%: 4.00" [ref=e40]':
                - cell "Service Tax 8%:" [ref=e41]
                - cell "4.00" [ref=e42]
              - 'row "Total Amount Payable (inclusive of Service Tax 8%) : 54.00" [ref=e43]':
                - cell "Total Amount Payable (inclusive of Service Tax 8%) :" [ref=e44]
                - cell "54.00" [ref=e45]
      - button "Make Payment" [ref=e47] [cursor=pointer]
  - generic [ref=e48]:
    - generic [ref=e49]:
      - button "HOME" [ref=e50] [cursor=pointer]
      - button "INSURANCE" [ref=e51] [cursor=pointer]
      - button "REPORTS" [ref=e52] [cursor=pointer]
      - button "SETTINGS" [ref=e53] [cursor=pointer]
      - button "USER GUIDE" [ref=e54] [cursor=pointer]
      - button "DOWNLOAD" [ref=e55] [cursor=pointer]
      - button "CONTACT US" [ref=e56] [cursor=pointer]
    - table [ref=e57]:
      - rowgroup [ref=e58]:
        - row "Online Services - Service Hub MUHAMMAD FAIZUDDIN BIN BIDI | Logout" [ref=e59]:
          - cell "Online Services - Service Hub" [ref=e60]
          - cell "MUHAMMAD FAIZUDDIN BIN BIDI | Logout" [ref=e61]:
            - list [ref=e62]:
              - listitem [ref=e63]:
                - img [ref=e64]
                - text: MUHAMMAD FAIZUDDIN BIN BIDI
              - listitem [ref=e65]: "|"
              - listitem [ref=e66]:
                - link "Logout" [ref=e67] [cursor=pointer]:
                  - /url: "#"
  - img [ref=e69]
  - generic [ref=e70]:
    - generic [ref=e72]:
      - generic [ref=e73]:
        - link "Contact Us" [ref=e74] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e75]: "|"
        - link "Terms & Conditions" [ref=e76] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e77]: "|"
        - link "Privacy" [ref=e78] [cursor=pointer]:
          - /url: "#"
      - generic [ref=e79]: Best Compatible With Mozilla Firefox V36.0.4
      - generic [ref=e80]: Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved.
    - img [ref=e82]
```

# Test source

```ts
  1  | import { type Page, expect } from "@playwright/test";
  2  | import { BasePage } from "./BasePage";
  3  | import { PATHS } from "../utils/config";
  4  | 
  5  | export class SoftwareInstallationPage extends BasePage {
  6  |   readonly qtyField = this.page.locator('input[type="number"], input[type="text"]').filter({ hasText: /\d/ }).first();
  7  |   readonly incrementBtn = this.page.locator("button:has-text('+')").first();
  8  |   readonly decrementBtn = this.page.locator("button:has-text('−'), button:has-text('-')").first();
  9  |   readonly makePaymentBtn = this.page.getByText("Make Payment", { exact: false });
  10 |   readonly paymentSummary = this.page.locator("[class*='summary'], [class*='payment']").first();
  11 | 
  12 |   constructor(page: Page) {
  13 |     super(page);
  14 |   }
  15 | 
  16 |   async navigate() {
  17 |     await this.goto(PATHS.softwareInstallation);
  18 |   }
  19 | 
  20 |   async setQuantity(qty: number) {
  21 |     // Reset to 1 first (default), then increment
> 22 |     const currentQty = Number(await this.qtyField.inputValue()) || 1;
     |                                                   ^ TimeoutError: locator.inputValue: Timeout 10000ms exceeded.
  23 |     if (qty > currentQty) {
  24 |       for (let i = 0; i < qty - currentQty; i++) await this.incrementBtn.click();
  25 |     } else if (qty < currentQty) {
  26 |       for (let i = 0; i < currentQty - qty; i++) await this.decrementBtn.click();
  27 |     }
  28 |   }
  29 | 
  30 |   /** Click Make Payment and accept the confirm dialog. Returns the new txnId. */
  31 |   async makePayment(): Promise<string> {
  32 |     await this.acceptConfirmDialog();
  33 |     await this.makePaymentBtn.click();
  34 |     await this.waitForNav();
  35 |     return this.getTxnIdFromUrl();
  36 |   }
  37 | 
  38 |   /** Full purchase flow: set qty → pay → return txnId for slot booking */
  39 |   async purchaseInstallation(qty: number = 1): Promise<string> {
  40 |     await this.navigate();
  41 |     await this.setQuantity(qty);
  42 |     return await this.makePayment();
  43 |   }
  44 | }
  45 | 
```