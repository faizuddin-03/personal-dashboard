# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: slot-capacity-boundary.spec.ts >> Slot Capacity Boundary >> UCD >> Biometric Purchase - Free Install Option (partial booking)
- Location: tests\service-hub\specs\slot-capacity-boundary.spec.ts:150:9

# Error details

```
TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
  navigated to "https://staging.eauto.my/uat1/view/ucd/service-hub/installation/slot.do?id=18ef0183-2ccc-4cc8-939e-252f3cf2f8b5"
  navigated to "https://staging.eauto.my/uat1/view/ucd/service-hub/installation/slot.do?id=18ef0183-2ccc-4cc8-939e-252f3cf2f8b5"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e4]: "Biometric Device Purchase:"
    - generic [ref=e5]:
      - generic [ref=e6]:
        - generic [ref=e7]: "1"
        - generic [ref=e8]: Selection
      - generic [ref=e9]: →
      - generic [ref=e10]:
        - generic [ref=e11]: "2"
        - generic [ref=e12]: Payment
      - generic [ref=e13]: →
      - generic [ref=e14]:
        - generic [ref=e15]: "3"
        - generic [ref=e16]: Appointment
      - generic [ref=e17]: →
      - generic [ref=e18]:
        - generic [ref=e19]: "4"
        - generic [ref=e20]: Submission
    - generic [ref=e23]:
      - generic [ref=e24]:
        - img "Biometric Device Purchase" [ref=e25]
        - generic [ref=e26]:
          - generic [ref=e27]: Schedule an Appointment
          - generic [ref=e28]: Please choose your preferred software installation date and time slot. (up to 3 per slot)
      - generic [ref=e29]:
        - generic [ref=e30]: Please select a date to schedule the software installation
        - generic [ref=e31]:
          - generic [ref=e32]: July 2026
          - generic [ref=e33] [cursor=pointer]: ›
      - table [ref=e34]:
        - rowgroup [ref=e35]:
          - row "MON TUE WED THUR FRI SAT SUN" [ref=e36]:
            - columnheader "MON" [ref=e37]
            - columnheader "TUE" [ref=e38]
            - columnheader "WED" [ref=e39]
            - columnheader "THUR" [ref=e40]
            - columnheader "FRI" [ref=e41]
            - columnheader "SAT" [ref=e42]
            - columnheader "SUN" [ref=e43]
        - rowgroup [ref=e44]:
          - row "29 30 1 2 3 4 5" [ref=e45]:
            - cell "29" [ref=e46]
            - cell "30" [ref=e47]
            - cell "1" [ref=e48]
            - cell "2" [ref=e49]
            - cell "3" [ref=e50]
            - cell "4" [ref=e51]
            - cell "5" [ref=e52]
          - row "6 7 8 9 10 11 12" [ref=e53]:
            - cell "6" [ref=e54]
            - cell "7" [ref=e55]
            - cell "8" [ref=e56]
            - cell "9" [ref=e57]
            - cell "10" [ref=e58]
            - cell "11" [ref=e59]
            - cell "12" [ref=e60]
          - row "13 14 15 16 17 18 19" [ref=e61]:
            - cell "13" [ref=e62]
            - cell "14" [ref=e63]
            - cell "15" [ref=e64]
            - cell "16" [ref=e65]
            - cell "17" [ref=e66]:
              - generic [ref=e67]: "17"
            - cell "18" [ref=e68]
            - cell "19" [ref=e69]
          - row "20 2 Available 21 Full 22 4 Available 23 5 Available 24 6 Available 25 26" [ref=e70]:
            - cell "20 2 Available" [ref=e71] [cursor=pointer]:
              - text: "20"
              - generic [ref=e73]: 2 Available
            - cell "21 Full" [ref=e74]:
              - text: "21"
              - generic [ref=e76]: Full
            - cell "22 4 Available" [ref=e77] [cursor=pointer]:
              - text: "22"
              - generic [ref=e79]: 4 Available
            - cell "23 5 Available" [ref=e80] [cursor=pointer]:
              - text: "23"
              - generic [ref=e82]: 5 Available
            - cell "24 6 Available" [ref=e83] [cursor=pointer]:
              - text: "24"
              - generic [ref=e85]: 6 Available
            - cell "25" [ref=e86]
            - cell "26" [ref=e87]
          - row "27 6 Available 28 6 Available 29 6 Available 30 6 Available 31 4 Available 1 2" [ref=e88]:
            - cell "27 6 Available" [ref=e89] [cursor=pointer]:
              - text: "27"
              - generic [ref=e91]: 6 Available
            - cell "28 6 Available" [ref=e92] [cursor=pointer]:
              - text: "28"
              - generic [ref=e94]: 6 Available
            - cell "29 6 Available" [ref=e95] [cursor=pointer]:
              - text: "29"
              - generic [ref=e97]: 6 Available
            - cell "30 6 Available" [ref=e98] [cursor=pointer]:
              - text: "30"
              - generic [ref=e100]: 6 Available
            - cell "31 4 Available" [ref=e101] [cursor=pointer]:
              - text: "31"
              - generic [ref=e103]: 4 Available
            - cell "1" [ref=e104]
            - cell "2" [ref=e105]
      - generic [ref=e106]:
        - generic [ref=e107]: Book all 2 installations now to confirm your appointment, or leave them all unbooked to book later — any time before 17-09-2026. Partial booking is not allowed.
        - generic [ref=e108]:
          - generic [ref=e109]: Booked 0 of 2 appointment(s).
          - button "Confirm Appointment" [ref=e111] [cursor=pointer]
  - generic [ref=e112]:
    - generic [ref=e113]:
      - button "HOME" [ref=e114] [cursor=pointer]
      - button "INSURANCE" [ref=e115] [cursor=pointer]
      - button "REPORTS" [ref=e116] [cursor=pointer]
      - button "SETTINGS" [ref=e117] [cursor=pointer]
      - button "USER GUIDE" [ref=e118] [cursor=pointer]
      - button "DOWNLOAD" [ref=e119] [cursor=pointer]
      - button "CONTACT US" [ref=e120] [cursor=pointer]
    - table [ref=e121]:
      - rowgroup [ref=e122]:
        - row "Online Services - Service Hub MUHAMMAD FAIZUDDIN BIN BIDI | Logout" [ref=e123]:
          - cell "Online Services - Service Hub" [ref=e124]
          - cell "MUHAMMAD FAIZUDDIN BIN BIDI | Logout" [ref=e125]:
            - list [ref=e126]:
              - listitem [ref=e127]:
                - img [ref=e128]
                - text: MUHAMMAD FAIZUDDIN BIN BIDI
              - listitem [ref=e129]: "|"
              - listitem [ref=e130]:
                - link "Logout" [ref=e131] [cursor=pointer]:
                  - /url: "#"
  - img [ref=e133]
  - generic [ref=e134]:
    - generic [ref=e136]:
      - generic [ref=e137]:
        - link "Contact Us" [ref=e138] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e139]: "|"
        - link "Terms & Conditions" [ref=e140] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e141]: "|"
        - link "Privacy" [ref=e142] [cursor=pointer]:
          - /url: "#"
      - generic [ref=e143]: Best Compatible With Mozilla Firefox V36.0.4
      - generic [ref=e144]: Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved.
    - img [ref=e146]
```

# Test source

```ts
  1   | import { type Page, expect } from "@playwright/test";
  2   | import { BasePage } from "./BasePage";
  3   | import { PATHS } from "../utils/config";
  4   | 
  5   | /**
  6   |  * Biometric Device Purchase — two-step flow:
  7   |  *  Step 1 (purchase.do): device qty, recipient, contact, delivery address → Next
  8   |  *  Step 2 (make-payment.do): free/paid install options → Make Payment → jQuery UI
  9   |  *  confirm dialog → redirect to slot.do?txnId= (same slot picker as Software Installation)
  10  |  */
  11  | export class BiometricPurchasePage extends BasePage {
  12  |   // Step 1 — Device details
  13  |   readonly qtyInput = this.page.locator("#qty");
  14  |   readonly qtyIncrementBtn = this.page.locator('button[onclick="bioStep(1)"]');
  15  |   readonly qtyDecrementBtn = this.page.locator('button[onclick="bioStep(-1)"]');
  16  |   readonly recipientNameInput = this.page.locator("#authorizedReceiver");
  17  |   readonly contactNoInput = this.page.locator("#contactNo");
  18  |   readonly shipToShowroomCheckbox = this.page.locator("#shipToShowroom");
  19  |   readonly deliveryAddressTextarea = this.page.locator("#deliveryAddress");
  20  |   readonly nextBtn = this.page.locator("button.bio-btn.next");
  21  | 
  22  |   // Step 2 — Install options & payment
  23  |   readonly installOptOutCheckbox = this.page.locator("#installOptOut");
  24  |   readonly extraInstallsInput = this.page.locator("#extraInstalls");
  25  |   readonly extraInstallIncrementBtn = this.page.locator("#bio-extra-plus");
  26  |   readonly extraInstallDecrementBtn = this.page.locator("#bio-extra-minus");
  27  |   readonly makePaymentBtn = this.page.locator("#si-pay-btn");
  28  | 
  29  |   constructor(page: Page) {
  30  |     super(page);
  31  |   }
  32  | 
  33  |   async navigate() {
  34  |     await this.goto(PATHS.biometricPurchase);
  35  |   }
  36  | 
  37  |   async getDeviceQuantity(): Promise<number> {
  38  |     return Number(await this.qtyInput.inputValue()) || 1;
  39  |   }
  40  | 
  41  |   async setDeviceQuantity(qty: number) {
  42  |     const current = await this.getDeviceQuantity();
  43  |     if (qty > current) {
  44  |       for (let i = 0; i < qty - current; i++) await this.qtyIncrementBtn.click();
  45  |     } else if (qty < current) {
  46  |       for (let i = 0; i < current - qty; i++) await this.qtyDecrementBtn.click();
  47  |     }
  48  |   }
  49  | 
  50  |   async fillDeliveryDetails(opts: {
  51  |     recipientName: string;
  52  |     contactNo: string;
  53  |     shipToShowroom?: boolean;
  54  |     deliveryAddress?: string;
  55  |   }) {
  56  |     await this.recipientNameInput.fill(opts.recipientName);
  57  |     await this.contactNoInput.fill(opts.contactNo);
  58  | 
  59  |     const isChecked = await this.shipToShowroomCheckbox.isChecked();
  60  |     if (opts.shipToShowroom) {
  61  |       if (!isChecked) await this.shipToShowroomCheckbox.check();
  62  |     } else {
  63  |       if (isChecked) await this.shipToShowroomCheckbox.uncheck();
  64  |       if (opts.deliveryAddress) await this.deliveryAddressTextarea.fill(opts.deliveryAddress);
  65  |     }
  66  |   }
  67  | 
  68  |   async goToStep2() {
  69  |     await this.nextBtn.click();
  70  |     await this.waitForNav();
  71  |   }
  72  | 
  73  |   async skipInstallation() {
  74  |     await this.installOptOutCheckbox.check();
  75  |   }
  76  | 
  77  |   async getExtraInstalls(): Promise<number> {
  78  |     return Number(await this.extraInstallsInput.inputValue()) || 0;
  79  |   }
  80  | 
  81  |   async setAdditionalInstallations(qty: number) {
  82  |     const current = await this.getExtraInstalls();
  83  |     if (qty > current) {
  84  |       for (let i = 0; i < qty - current; i++) await this.extraInstallIncrementBtn.click();
  85  |     } else if (qty < current) {
  86  |       for (let i = 0; i < current - qty; i++) await this.extraInstallDecrementBtn.click();
  87  |     }
  88  |   }
  89  | 
  90  |   /**
  91  |    * Click Make Payment → wait for jQuery UI dialog → click Yes → wait for
  92  |    * redirect to slot.do. Matches either the old `txnId=<number>` or the new
  93  |    * `transactionId=<uuid>` id scheme (see SoftwareInstallationPage.makePayment).
  94  |    */
  95  |   async makePayment(): Promise<string> {
  96  |     await this.makePaymentBtn.click();
  97  |     await this.waitForDialog();
  98  |     await this.acceptConfirmDialog();
> 99  |     await this.page.waitForURL(/slot\.do\?(id|txnId|transactionId)=/, { timeout: 15000 });
      |                     ^ TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
  100 |     return this.getTxnIdFromUrl();
  101 |   }
  102 | 
  103 |   /** Full purchase: qty devices → fill delivery → step2 → optional install opts → pay → return txnId */
  104 |   async purchaseDevice(opts: {
  105 |     deviceQty?: number;
  106 |     recipientName: string;
  107 |     contactNo: string;
  108 |     shipToShowroom?: boolean;
  109 |     deliveryAddress?: string;
  110 |     skipInstall?: boolean;
  111 |     additionalInstalls?: number;
  112 |   }): Promise<string> {
  113 |     await this.navigate();
  114 |     if (opts.deviceQty && opts.deviceQty > 1) await this.setDeviceQuantity(opts.deviceQty);
  115 |     await this.fillDeliveryDetails(opts);
  116 |     await this.goToStep2();
  117 |     if (opts.skipInstall) await this.skipInstallation();
  118 |     if (opts.additionalInstalls) await this.setAdditionalInstallations(opts.additionalInstalls);
  119 |     return await this.makePayment();
  120 |   }
  121 | }
  122 | 
```