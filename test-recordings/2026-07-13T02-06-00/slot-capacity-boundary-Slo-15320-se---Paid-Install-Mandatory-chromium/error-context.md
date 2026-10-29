# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: slot-capacity-boundary.spec.ts >> Slot Capacity Boundary >> UCD >> Biometric Purchase - Paid Install Mandatory
- Location: tests\service-hub\specs\slot-capacity-boundary.spec.ts:142:9

# Error details

```
TimeoutError: locator.click: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('button:has-text(\'+\')').nth(1)

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
          - generic [ref=e21]: "*You are entitled to 1 free software installation"
      - generic [ref=e22]:
        - generic [ref=e23]:
          - generic [ref=e24]: "Purchased Devices:"
          - generic [ref=e25]: 1 Unit
        - generic [ref=e26]:
          - generic [ref=e27]: "Software Installation:"
          - generic [ref=e28]:
            - generic [ref=e29]:
              - generic [ref=e30]: RM 0.00 / unit
              - generic [ref=e31]: You are entitled to 1 free software installation.
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
            - generic [ref=e42]: Extra installations beyond your 1 free, at RM 54.00 each (RM 50.00 + RM 4.00 SST).
        - generic [ref=e44]:
          - generic [ref=e45]: Payment Summary
          - table [ref=e46]:
            - rowgroup [ref=e47]:
              - row "Description RM" [ref=e48]:
                - columnheader "Description" [ref=e49]
                - columnheader "RM" [ref=e50]
            - rowgroup [ref=e51]:
              - 'row "Biometric Devices : 850.00" [ref=e52]':
                - cell "Biometric Devices :" [ref=e53]
                - cell "850.00" [ref=e54]
              - 'row "Software Installation Fee : 0.00" [ref=e55]':
                - cell "Software Installation Fee :" [ref=e56]
                - cell "0.00" [ref=e57]
              - 'row "Service Tax 8% : 0.00" [ref=e58]':
                - cell "Service Tax 8% :" [ref=e59]
                - cell "0.00" [ref=e60]
              - 'row "Total Amount Payable (inclusive of Service Tax 8%) : 850.00" [ref=e61]':
                - cell "Total Amount Payable (inclusive of Service Tax 8%) :" [ref=e62]
                - cell "850.00" [ref=e63]
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
  1  | import { type Page, expect } from "@playwright/test";
  2  | import { BasePage } from "./BasePage";
  3  | import { PATHS } from "../utils/config";
  4  | 
  5  | export class BiometricPurchasePage extends BasePage {
  6  |   // Step 1 — Device details
  7  |   readonly deviceQtyIncrement = this.page.locator("button:has-text('+')").first();
  8  |   readonly deviceQtyDecrement = this.page.locator("button:has-text('−'), button:has-text('-')").first();
  9  |   readonly recipientNameInput = this.page.locator('input[name="authorizedReceiver"], input[placeholder*="Recipient"]').first();
  10 |   readonly contactNoInput = this.page.locator('input[name="contactNo"], input[placeholder*="Contact"]').first();
  11 |   readonly shipToShowroomCheckbox = this.page.locator('input[name="shipToShowroom"], input[type="checkbox"]').first();
  12 |   readonly deliveryAddressTextarea = this.page.locator('textarea[name="deliveryAddress"], textarea').first();
  13 |   readonly nextBtn = this.page.getByText("Next", { exact: false });
  14 | 
  15 |   // Step 2 — Schedule & payment
  16 |   readonly skipInstallCheckbox = this.page.getByText("I don't need software Installation", { exact: false });
  17 |   readonly additionalInstallIncrement = this.page.locator("button:has-text('+')").nth(1);
  18 |   readonly makePaymentBtn = this.page.getByText("Make Payment", { exact: false });
  19 | 
  20 |   constructor(page: Page) {
  21 |     super(page);
  22 |   }
  23 | 
  24 |   async navigate() {
  25 |     await this.goto(PATHS.biometricPurchase);
  26 |   }
  27 | 
  28 |   async setDeviceQuantity(qty: number) {
  29 |     for (let i = 1; i < qty; i++) await this.deviceQtyIncrement.click();
  30 |   }
  31 | 
  32 |   async fillDeliveryDetails(opts: {
  33 |     recipientName: string;
  34 |     contactNo: string;
  35 |     shipToShowroom?: boolean;
  36 |     deliveryAddress?: string;
  37 |   }) {
  38 |     await this.recipientNameInput.fill(opts.recipientName);
  39 |     await this.contactNoInput.fill(opts.contactNo);
  40 |     if (opts.shipToShowroom) {
  41 |       await this.shipToShowroomCheckbox.check();
  42 |     } else if (opts.deliveryAddress) {
  43 |       await this.shipToShowroomCheckbox.uncheck();
  44 |       await this.deliveryAddressTextarea.fill(opts.deliveryAddress);
  45 |     }
  46 |   }
  47 | 
  48 |   async goToStep2() {
  49 |     await this.nextBtn.click();
  50 |     await this.waitForNav();
  51 |   }
  52 | 
  53 |   async skipInstallation() {
  54 |     await this.skipInstallCheckbox.check();
  55 |   }
  56 | 
  57 |   async setAdditionalInstallations(qty: number) {
> 58 |     for (let i = 0; i < qty; i++) await this.additionalInstallIncrement.click();
     |                                                                         ^ TimeoutError: locator.click: Timeout 10000ms exceeded.
  59 |   }
  60 | 
  61 |   async makePayment(): Promise<string> {
  62 |     await this.acceptConfirmDialog();
  63 |     await this.makePaymentBtn.click();
  64 |     await this.waitForNav();
  65 |     return this.getTxnIdFromUrl();
  66 |   }
  67 | 
  68 |   /** Full purchase: qty devices → fill delivery → step2 → pay → return txnId */
  69 |   async purchaseDevice(opts: {
  70 |     deviceQty?: number;
  71 |     recipientName: string;
  72 |     contactNo: string;
  73 |     shipToShowroom?: boolean;
  74 |     deliveryAddress?: string;
  75 |     skipInstall?: boolean;
  76 |     additionalInstalls?: number;
  77 |   }): Promise<string> {
  78 |     await this.navigate();
  79 |     if (opts.deviceQty && opts.deviceQty > 1) await this.setDeviceQuantity(opts.deviceQty);
  80 |     await this.fillDeliveryDetails(opts);
  81 |     await this.goToStep2();
  82 |     if (opts.skipInstall) await this.skipInstallation();
  83 |     if (opts.additionalInstalls) await this.setAdditionalInstallations(opts.additionalInstalls);
  84 |     return await this.makePayment();
  85 |   }
  86 | }
  87 | 
```