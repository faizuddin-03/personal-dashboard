# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: slot-capacity-boundary.spec.ts >> Slot Capacity Boundary >> UCD >> Software Installation - Mandatory Booking
- Location: tests\service-hub\specs\slot-capacity-boundary.spec.ts:116:9

# Error details

```
TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
  navigated to "https://staging.eauto.my/uat1/view/ucd/service-hub/installation/slot.do?id=11c5c675-5c3d-4a1f-80cc-5ac8ad32525b"
  navigated to "https://staging.eauto.my/uat1/view/ucd/service-hub/installation/slot.do?id=11c5c675-5c3d-4a1f-80cc-5ac8ad32525b"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e4]: "Software Installation:"
    - generic [ref=e5]:
      - generic [ref=e6]:
        - generic [ref=e7]: "1"
        - generic [ref=e8]: Payment
      - generic [ref=e9]: →
      - generic [ref=e10]:
        - generic [ref=e11]: "2"
        - generic [ref=e12]: Appointment
      - generic [ref=e13]: →
      - generic [ref=e14]:
        - generic [ref=e15]: "3"
        - generic [ref=e16]: Submission
    - generic [ref=e19]:
      - generic [ref=e20]:
        - img "Software Installation" [ref=e21]
        - generic [ref=e22]:
          - generic [ref=e23]: Schedule an Appointment
          - generic [ref=e24]: Please choose your preferred software installation date and time slot. (up to 3 per slot)
      - generic [ref=e25]:
        - generic [ref=e26]: Please select a date to schedule the software installation
        - generic [ref=e27]:
          - generic [ref=e28]: July 2026
          - generic [ref=e29] [cursor=pointer]: ›
      - table [ref=e30]:
        - rowgroup [ref=e31]:
          - row "MON TUE WED THUR FRI SAT SUN" [ref=e32]:
            - columnheader "MON" [ref=e33]
            - columnheader "TUE" [ref=e34]
            - columnheader "WED" [ref=e35]
            - columnheader "THUR" [ref=e36]
            - columnheader "FRI" [ref=e37]
            - columnheader "SAT" [ref=e38]
            - columnheader "SUN" [ref=e39]
        - rowgroup [ref=e40]:
          - row "29 30 1 2 3 4 5" [ref=e41]:
            - cell "29" [ref=e42]
            - cell "30" [ref=e43]
            - cell "1" [ref=e44]
            - cell "2" [ref=e45]
            - cell "3" [ref=e46]
            - cell "4" [ref=e47]
            - cell "5" [ref=e48]
          - row "6 7 8 9 10 11 12" [ref=e49]:
            - cell "6" [ref=e50]
            - cell "7" [ref=e51]
            - cell "8" [ref=e52]
            - cell "9" [ref=e53]
            - cell "10" [ref=e54]
            - cell "11" [ref=e55]
            - cell "12" [ref=e56]
          - row "13 14 15 16 17 18 19" [ref=e57]:
            - cell "13" [ref=e58]
            - cell "14" [ref=e59]
            - cell "15" [ref=e60]
            - cell "16" [ref=e61]
            - cell "17" [ref=e62]:
              - generic [ref=e63]: "17"
            - cell "18" [ref=e64]
            - cell "19" [ref=e65]
          - row "20 2 Available 21 Full 22 4 Available 23 5 Available 24 6 Available 25 26" [ref=e66]:
            - cell "20 2 Available" [ref=e67] [cursor=pointer]:
              - text: "20"
              - generic [ref=e69]: 2 Available
            - cell "21 Full" [ref=e70]:
              - text: "21"
              - generic [ref=e72]: Full
            - cell "22 4 Available" [ref=e73] [cursor=pointer]:
              - text: "22"
              - generic [ref=e75]: 4 Available
            - cell "23 5 Available" [ref=e76] [cursor=pointer]:
              - text: "23"
              - generic [ref=e78]: 5 Available
            - cell "24 6 Available" [ref=e79] [cursor=pointer]:
              - text: "24"
              - generic [ref=e81]: 6 Available
            - cell "25" [ref=e82]
            - cell "26" [ref=e83]
          - row "27 6 Available 28 6 Available 29 6 Available 30 6 Available 31 4 Available 1 2" [ref=e84]:
            - cell "27 6 Available" [ref=e85] [cursor=pointer]:
              - text: "27"
              - generic [ref=e87]: 6 Available
            - cell "28 6 Available" [ref=e88] [cursor=pointer]:
              - text: "28"
              - generic [ref=e90]: 6 Available
            - cell "29 6 Available" [ref=e91] [cursor=pointer]:
              - text: "29"
              - generic [ref=e93]: 6 Available
            - cell "30 6 Available" [ref=e94] [cursor=pointer]:
              - text: "30"
              - generic [ref=e96]: 6 Available
            - cell "31 4 Available" [ref=e97] [cursor=pointer]:
              - text: "31"
              - generic [ref=e99]: 4 Available
            - cell "1" [ref=e100]
            - cell "2" [ref=e101]
      - generic [ref=e103]:
        - generic [ref=e104]: Booked 0 of 2 appointment(s).
        - button "Confirm Appointment" [ref=e106] [cursor=pointer]
  - generic [ref=e107]:
    - generic [ref=e108]:
      - button "HOME" [ref=e109] [cursor=pointer]
      - button "INSURANCE" [ref=e110] [cursor=pointer]
      - button "REPORTS" [ref=e111] [cursor=pointer]
      - button "SETTINGS" [ref=e112] [cursor=pointer]
      - button "USER GUIDE" [ref=e113] [cursor=pointer]
      - button "DOWNLOAD" [ref=e114] [cursor=pointer]
      - button "CONTACT US" [ref=e115] [cursor=pointer]
    - table [ref=e116]:
      - rowgroup [ref=e117]:
        - row "Online Services - Service Hub MUHAMMAD FAIZUDDIN BIN BIDI | Logout" [ref=e118]:
          - cell "Online Services - Service Hub" [ref=e119]
          - cell "MUHAMMAD FAIZUDDIN BIN BIDI | Logout" [ref=e120]:
            - list [ref=e121]:
              - listitem [ref=e122]:
                - img [ref=e123]
                - text: MUHAMMAD FAIZUDDIN BIN BIDI
              - listitem [ref=e124]: "|"
              - listitem [ref=e125]:
                - link "Logout" [ref=e126] [cursor=pointer]:
                  - /url: "#"
  - img [ref=e128]
  - generic [ref=e129]:
    - generic [ref=e131]:
      - generic [ref=e132]:
        - link "Contact Us" [ref=e133] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e134]: "|"
        - link "Terms & Conditions" [ref=e135] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e136]: "|"
        - link "Privacy" [ref=e137] [cursor=pointer]:
          - /url: "#"
      - generic [ref=e138]: Best Compatible With Mozilla Firefox V36.0.4
      - generic [ref=e139]: Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved.
    - img [ref=e141]
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
  37 |   /**
  38 |    * Click Make Payment → wait for jQuery UI dialog → click Yes → wait for
  39 |    * redirect to slot.do. The redirect's id param used to be `txnId=<number>`;
  40 |    * a deployment changed it to `transactionId=<uuid>` (same destination page,
  41 |    * confirmed live) — match either so this keeps working under both schemes.
  42 |    */
  43 |   async makePayment(): Promise<string> {
  44 |     await this.makePaymentBtn.click();
  45 |     await this.waitForDialog();
  46 |     await this.acceptConfirmDialog();
> 47 |     await this.page.waitForURL(/slot\.do\?(id|txnId|transactionId)=/, { timeout: 15000 });
     |                     ^ TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
  48 |     return this.getTxnIdFromUrl();
  49 |   }
  50 | 
  51 |   async purchaseInstallation(qty: number = 1): Promise<string> {
  52 |     await this.navigate();
  53 |     await this.setQuantity(qty);
  54 |     return await this.makePayment();
  55 |   }
  56 | }
  57 | 
```