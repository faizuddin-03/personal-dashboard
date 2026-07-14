# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: slot-capacity-boundary.spec.ts >> Slot Capacity Boundary >> UCD >> Biometric Purchase - Free Install Option
- Location: tests\service-hub\specs\slot-capacity-boundary.spec.ts:124:9

# Error details

```
TimeoutError: locator.click: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('.confirm-dialog-btn')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - link "Home" [ref=e5] [cursor=pointer]:
        - /url: /uat1/view/ucd/
      - generic [ref=e6]: /
      - link "Service Hub" [ref=e7] [cursor=pointer]:
        - /url: /uat1/view/ucd/service-hub/view.do
      - generic [ref=e8]: /
      - generic [ref=e9]: Biometric Device Purchase
    - generic [ref=e10]:
      - link "« Back" [ref=e11] [cursor=pointer]:
        - /url: /uat1/view/ucd/service-hub/view.do
      - generic: Biometric Device Purchase
    - generic [ref=e13]:
      - generic [ref=e14]:
        - img "Software Installation" [ref=e15]
        - generic [ref=e16]:
          - generic [ref=e17]: Schedule an Appointment
          - generic [ref=e18]: Please choose your preferred software installation date and time slot. (up to 3 per slot)
        - generic [ref=e19]:
          - generic [ref=e20]: RM 0.00 / unit*
          - generic [ref=e21]: "*You are entitled to 2 free software installations"
      - generic [ref=e22]:
        - generic [ref=e23]:
          - generic [ref=e24]: "Purchased Devices:"
          - generic [ref=e25]: 2 Unit
        - generic [ref=e26]:
          - generic [ref=e27]: "Software Installation:"
          - generic [ref=e28]:
            - generic [ref=e29]:
              - generic [ref=e30]: RM 0.00 / unit
              - generic [ref=e31]: You are entitled to 2 free software installations.
            - generic [ref=e32]:
              - checkbox "I don't need software Installation" [ref=e33]
              - generic [ref=e34] [cursor=pointer]: I don't need software Installation
        - generic [ref=e35]:
          - generic [ref=e36]: "Additional installations:"
          - generic [ref=e37]:
            - generic [ref=e38]:
              - button "−" [ref=e39] [cursor=pointer]
              - textbox [ref=e40]: "0"
              - button "+" [ref=e41] [cursor=pointer]
            - generic [ref=e42]: Extra installations beyond your 2 free, at RM 54.00 each (RM 50.00 + RM 4.00 SST).
        - generic [ref=e44]:
          - generic [ref=e45]: Payment Summary
          - table [ref=e46]:
            - rowgroup [ref=e47]:
              - row "Description RM" [ref=e48]:
                - columnheader "Description" [ref=e49]
                - columnheader "RM" [ref=e50]
            - rowgroup [ref=e51]:
              - 'row "Biometric Devices : 1700.00" [ref=e52]':
                - cell "Biometric Devices :" [ref=e53]
                - cell "1700.00" [ref=e54]
              - 'row "Software Installation Fee : 0.00" [ref=e55]':
                - cell "Software Installation Fee :" [ref=e56]
                - cell "0.00" [ref=e57]
              - 'row "Service Tax 8% : 0.00" [ref=e58]':
                - cell "Service Tax 8% :" [ref=e59]
                - cell "0.00" [ref=e60]
              - 'row "Total Amount Payable (inclusive of Service Tax 8%) : 1700.00" [ref=e61]':
                - cell "Total Amount Payable (inclusive of Service Tax 8%) :" [ref=e62]
                - cell "1700.00" [ref=e63]
      - generic [ref=e64]:
        - link "Back" [ref=e65] [cursor=pointer]:
          - /url: /uat1/view/ucd/service-hub/purchase.do
        - button "Make Payment" [ref=e66] [cursor=pointer]
  - generic [ref=e67]:
    - generic [ref=e68]:
      - button "HOME" [ref=e69] [cursor=pointer]
      - button "INSURANCE" [ref=e70] [cursor=pointer]
      - button "REPORTS" [ref=e71] [cursor=pointer]
      - button "SETTINGS" [ref=e72] [cursor=pointer]
      - button "USER GUIDE" [ref=e73] [cursor=pointer]
      - button "DOWNLOAD" [ref=e74] [cursor=pointer]
      - button "CONTACT US" [ref=e75] [cursor=pointer]
    - table [ref=e76]:
      - rowgroup [ref=e77]:
        - row "Online Services - Service Hub MUHAMMAD FAIZUDDIN BIN BIDI | Logout" [ref=e78]:
          - cell "Online Services - Service Hub" [ref=e79]
          - cell "MUHAMMAD FAIZUDDIN BIN BIDI | Logout" [ref=e80]:
            - list [ref=e81]:
              - listitem [ref=e82]:
                - img [ref=e83]
                - text: MUHAMMAD FAIZUDDIN BIN BIDI
              - listitem [ref=e84]: "|"
              - listitem [ref=e85]:
                - link "Logout" [ref=e86] [cursor=pointer]:
                  - /url: "#"
  - img [ref=e88]
  - generic [ref=e89]:
    - generic [ref=e91]:
      - generic [ref=e92]:
        - link "Contact Us" [ref=e93] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e94]: "|"
        - link "Terms & Conditions" [ref=e95] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e96]: "|"
        - link "Privacy" [ref=e97] [cursor=pointer]:
          - /url: "#"
      - generic [ref=e98]: Best Compatible With Mozilla Firefox V36.0.4
      - generic [ref=e99]: Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved.
    - img [ref=e101]
```

# Test source

```ts
  1  | import { type Page, type Locator, expect } from "@playwright/test";
  2  | import { ENV } from "../utils/config";
  3  | 
  4  | export class BasePage {
  5  |   readonly page: Page;
  6  |   readonly baseUrl: string;
  7  | 
  8  |   constructor(page: Page) {
  9  |     this.page = page;
  10 |     this.baseUrl = ENV.baseUrl;
  11 |   }
  12 | 
  13 |   async goto(path: string) {
  14 |     await this.page.goto(`${this.baseUrl}${path}`, { waitUntil: "networkidle" });
  15 |   }
  16 | 
  17 |   async waitForNav() {
  18 |     await this.page.waitForLoadState("networkidle");
  19 |   }
  20 | 
  21 |   getTxnIdFromUrl(): string {
  22 |     const url = new URL(this.page.url());
  23 |     return url.searchParams.get("txnId") ?? "";
  24 |   }
  25 | 
  26 |   /** Accept the jQuery UI confirmation dialog (clicks the "Yes" button) */
  27 |   async acceptConfirmDialog() {
> 28 |     await this.page.locator(".confirm-dialog-btn").click();
     |                                                    ^ TimeoutError: locator.click: Timeout 10000ms exceeded.
  29 |   }
  30 | 
  31 |   /** Dismiss the jQuery UI confirmation dialog (clicks the "No" button) */
  32 |   async dismissConfirmDialog() {
  33 |     await this.page.locator(".cancel-dialog-btn").click();
  34 |   }
  35 | 
  36 |   /** Wait for the jQuery UI dialog to appear */
  37 |   async waitForDialog() {
  38 |     await this.page.locator(".ui-dialog").waitFor({ state: "visible", timeout: 5000 });
  39 |   }
  40 | 
  41 |   today(): string {
  42 |     return new Date().toISOString().split("T")[0];
  43 |   }
  44 | 
  45 |   daysFromToday(n: number): string {
  46 |     const d = new Date();
  47 |     d.setDate(d.getDate() + n);
  48 |     return d.toISOString().split("T")[0];
  49 |   }
  50 | 
  51 |   earliestRescheduleDate(): string {
  52 |     return this.daysFromToday(ENV.reschedule.blackoutDays);
  53 |   }
  54 | }
  55 | 
```