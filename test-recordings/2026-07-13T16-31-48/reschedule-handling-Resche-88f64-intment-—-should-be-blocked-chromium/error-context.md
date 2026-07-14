# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: reschedule-handling.spec.ts >> Reschedule & Handling >> UCD >> Reschedule cancelled appointment — should be blocked
- Location: tests\service-hub\specs\reschedule-handling.spec.ts:252:9

# Error details

```
Error: page.goto: net::ERR_ABORTED at https://staging.eauto.my/uat1/view/bo/service-hub/listing/main.do
Call log:
  - navigating to "https://staging.eauto.my/uat1/view/bo/service-hub/listing/main.do", waiting until "networkidle"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e6]: FAIZUDDIN AUTO TEST
      - generic [ref=e7]:
        - generic [ref=e8]:
          - img [ref=e9]
          - paragraph [ref=e10]: From RM30*
          - button "STMS" [ref=e11]
          - paragraph [ref=e12]: Sistem Tukar Milik Sementara
          - paragraph [ref=e13]: (View or Create Transaction)
        - generic [ref=e14]:
          - img [ref=e15]
          - paragraph [ref=e16]: RM30 only*
          - button "UCD TO UCD" [ref=e17]
          - paragraph [ref=e18]: Dealer to Dealer
        - generic [ref=e19]:
          - img [ref=e20]
          - paragraph [ref=e21]: RM115 only*
          - button "APT" [ref=e22]
          - paragraph [ref=e23]: Automatic Permanent Transfer
          - paragraph [ref=e24]: (View / Make Payment for vehicles in STMS which are 6 months or more)
        - generic [ref=e25]:
          - generic [ref=e26]:
            - img [ref=e27]
            - img [ref=e28]
          - paragraph [ref=e29]: From RM135*
          - button "eSERAHAN" [ref=e30]
          - paragraph [ref=e31]: Online Transfer
          - paragraph [ref=e32]: (Dealer to Customer)
        - generic [ref=e33]:
          - img [ref=e34]
          - paragraph [ref=e35]: RM30 only*
          - button "BMK" [ref=e37]
          - paragraph [ref=e38]: Butiran Maklumat Kenderaan
        - generic [ref=e39]:
          - img [ref=e40]
          - paragraph [ref=e41]: Instant Commission
          - button "INSURANCE" [ref=e42]
          - paragraph [ref=e43]: Motor Insurance
        - generic [ref=e44]:
          - img [ref=e45]
          - paragraph [ref=e46]: RM18 only*
          - button "JOMCHECK REPORT" [ref=e47]
          - paragraph [ref=e48]: Vehicle Check Report
        - generic [ref=e49]:
          - img [ref=e50]
          - paragraph [ref=e51]
          - button "SERVICE HUB" [ref=e52]
          - paragraph [ref=e53]: Request and manage your services or appointments.
        - generic [ref=e54]:
          - img [ref=e55]
          - paragraph [ref=e56]
          - button "eVOC" [ref=e57]
          - paragraph [ref=e58]: eVehicle Ownership Certificate
        - generic [ref=e59]:
          - img [ref=e60]
          - paragraph [ref=e61]
          - generic [ref=e62]:
            - button "LKM REFUND" [ref=e63]
            - img [ref=e65]
          - paragraph [ref=e66]: Lesen Kenderaan Motor Refund
        - generic [ref=e69]:
          - text: "* The price is exclusive of government service tax."
          - text: The product price consists of JPJ and eAuto Service Fee.
      - generic [ref=e70]:
        - generic [ref=e71]:
          - img [ref=e72]
          - button "COMPANY/ BUSINESS PROFILE" [ref=e73]:
            - text: COMPANY/
            - text: BUSINESS PROFILE
          - paragraph [ref=e74]:
            - text: Main user, update your
            - text: company/business profile
            - text: before 31 August 2025
        - generic [ref=e75]:
          - img [ref=e76]
          - button "SETTINGS" [ref=e77]
          - paragraph [ref=e78]:
            - text: Manage the branches,
            - text: registration or users
        - generic [ref=e79]:
          - img [ref=e80]
          - button "REPORTS" [ref=e81]
    - generic [ref=e83]:
      - heading "What's New" [level=6] [ref=e85]
      - generic [ref=e88]:
        - heading "Need Help?" [level=6] [ref=e89]
        - generic [ref=e90]:
          - img [ref=e92]
          - table [ref=e94]:
            - rowgroup [ref=e95]:
              - 'row "Support Hotline : 03-27798899" [ref=e96]':
                - cell "Support Hotline" [ref=e97]
                - 'cell ": 03-27798899" [ref=e98]'
              - 'row "Mon to Fri : 9am to 6pm" [ref=e99]':
                - cell "Mon to Fri" [ref=e100]
                - 'cell ": 9am to 6pm" [ref=e101]'
              - 'row "Sat, Sun & P.Holiday : 10am to 4pm" [ref=e102]':
                - cell "Sat, Sun & P.Holiday" [ref=e103]
                - 'cell ": 10am to 4pm" [ref=e104]'
        - generic [ref=e105]:
          - img [ref=e107]
          - table [ref=e109]:
            - rowgroup [ref=e110]:
              - 'row "Email : support@eauto.my" [ref=e111]':
                - cell "Email" [ref=e112]
                - 'cell ": support@eauto.my" [ref=e113]'
        - generic [ref=e114]:
          - img [ref=e116]
          - table [ref=e118]:
            - rowgroup [ref=e119]:
              - 'row "WhatsApp : 012-200 1324" [ref=e120]':
                - cell "WhatsApp" [ref=e121]
                - 'cell ": 012-200 1324" [ref=e122]'
      - generic [ref=e123]:
        - heading "Useful Link" [level=6] [ref=e124]
        - generic [ref=e125]:
          - button "JPJ Info" [ref=e126]
          - button "TeamViewer" [ref=e127]
  - generic [ref=e128]:
    - generic [ref=e129]:
      - button "HOME" [ref=e130] [cursor=pointer]
      - button "INSURANCE" [ref=e131] [cursor=pointer]
      - button "REPORTS" [ref=e132] [cursor=pointer]
      - button "SETTINGS" [ref=e133] [cursor=pointer]
      - button "USER GUIDE" [ref=e134] [cursor=pointer]
      - button "DOWNLOAD" [ref=e135] [cursor=pointer]
      - button "CONTACT US" [ref=e136] [cursor=pointer]
    - table [ref=e137]:
      - rowgroup [ref=e138]:
        - row "Welcome to eAuto MUHAMMAD FAIZUDDIN BIN BIDI (RHB:235498893030-Active) | Logout" [ref=e139]:
          - cell "Welcome to eAuto" [ref=e140]
          - cell "MUHAMMAD FAIZUDDIN BIN BIDI (RHB:235498893030-Active) | Logout" [ref=e141]:
            - list [ref=e142]:
              - listitem [ref=e143]:
                - img [ref=e144]
                - text: MUHAMMAD FAIZUDDIN BIN BIDI (RHB:235498893030-Active)
              - listitem [ref=e145]: "|"
              - listitem [ref=e146]:
                - link "Logout" [ref=e147] [cursor=pointer]:
                  - /url: "#"
  - img [ref=e149]
  - generic [ref=e150]:
    - generic [ref=e152]:
      - generic [ref=e153]:
        - link "Contact Us" [ref=e154] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e155]: "|"
        - link "Terms & Conditions" [ref=e156] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e157]: "|"
        - link "Privacy" [ref=e158] [cursor=pointer]:
          - /url: "#"
      - generic [ref=e159]: Best Compatible With Mozilla Firefox V36.0.4
      - generic [ref=e160]: Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved.
    - img [ref=e162]
```

# Test source

```ts
  1   | import { type Page, type Locator, expect } from "@playwright/test";
  2   | import { ENV } from "../utils/config";
  3   | 
  4   | export class BasePage {
  5   |   readonly page: Page;
  6   |   readonly baseUrl: string;
  7   | 
  8   |   constructor(page: Page) {
  9   |     this.page = page;
  10  |     this.baseUrl = ENV.baseUrl;
  11  |   }
  12  | 
  13  |   async goto(path: string) {
> 14  |     await this.page.goto(`${this.baseUrl}${path}`, { waitUntil: "networkidle" });
      |                     ^ Error: page.goto: net::ERR_ABORTED at https://staging.eauto.my/uat1/view/bo/service-hub/listing/main.do
  15  |   }
  16  | 
  17  |   async waitForNav() {
  18  |     await this.page.waitForLoadState("networkidle");
  19  |   }
  20  | 
  21  |   getTxnIdFromUrl(): string {
  22  |     const url = new URL(this.page.url());
  23  |     return url.searchParams.get("txnId") ?? "";
  24  |   }
  25  | 
  26  |   /** Accept the jQuery UI confirmation dialog (clicks the "Yes" button) */
  27  |   async acceptConfirmDialog() {
  28  |     await this.page.locator(".confirm-dialog-btn").click();
  29  |   }
  30  | 
  31  |   /** Dismiss the jQuery UI confirmation dialog (clicks the "No" button) */
  32  |   async dismissConfirmDialog() {
  33  |     await this.page.locator(".cancel-dialog-btn").click();
  34  |   }
  35  | 
  36  |   /** Wait for the jQuery UI dialog to appear */
  37  |   async waitForDialog() {
  38  |     await this.page.locator(".ui-dialog").waitFor({ state: "visible", timeout: 5000 });
  39  |   }
  40  | 
  41  |   today(): string {
  42  |     return new Date().toISOString().split("T")[0];
  43  |   }
  44  | 
  45  |   daysFromToday(n: number): string {
  46  |     const d = new Date();
  47  |     d.setDate(d.getDate() + n);
  48  |     return d.toISOString().split("T")[0];
  49  |   }
  50  | 
  51  |   earliestRescheduleDate(): string {
  52  |     return this.daysFromToday(ENV.reschedule.blackoutDays);
  53  |   }
  54  | 
  55  |   // ──────────────────────────────────────────────────────────────
  56  |   // Demo mode — slow, highlighted playback for human-reviewable
  57  |   // recordings. Enabled via PW_DEMO=1 (the runner UI's "Demo mode"
  58  |   // toggle, default on). When off, every helper below is a no-op so
  59  |   // normal/CI runs stay fast. Highlighting is best-effort and must
  60  |   // never fail a test.
  61  |   // ──────────────────────────────────────────────────────────────
  62  | 
  63  |   private _demoSuppressed = 0;
  64  | 
  65  |   protected get demoMode(): boolean {
  66  |     return process.env.PW_DEMO === "1" && this._demoSuppressed === 0;
  67  |   }
  68  | 
  69  |   /**
  70  |    * Run `fn` with demo highlighting/pauses temporarily suppressed. Wrap
  71  |    * calendar scans (finders that open/close many modals just to inspect)
  72  |    * in this so they stay fast and don't flood the recording with pulses on
  73  |    * dates the test never actually acts on.
  74  |    */
  75  |   protected async suppressDemo<T>(fn: () => Promise<T>): Promise<T> {
  76  |     this._demoSuppressed++;
  77  |     try {
  78  |       return await fn();
  79  |     } finally {
  80  |       this._demoSuppressed--;
  81  |     }
  82  |   }
  83  | 
  84  |   /** Default pause between demo steps, in ms (PW_DEMO_DELAY overrides). */
  85  |   protected get demoDelay(): number {
  86  |     return Number(process.env.PW_DEMO_DELAY || 1400);
  87  |   }
  88  | 
  89  |   /** Pause (demo mode only) so a human watching the recording can keep up. */
  90  |   async demoPause(ms?: number): Promise<void> {
  91  |     if (!this.demoMode) return;
  92  |     await this.page.waitForTimeout(ms ?? this.demoDelay);
  93  |   }
  94  | 
  95  |   /**
  96  |    * Highlight an element in the recording (demo mode only): scroll it into
  97  |    * view, draw a temporary amber outline, hold for `hold` ms, then restore.
  98  |    * `color` lets callers distinguish intent — amber (default) for "about to
  99  |    * act on this", green for "here is the result to check". No-op when demo
  100 |    * mode is off. Never throws.
  101 |    */
  102 |   async demoHighlight(
  103 |     target: Locator | string,
  104 |     opts: { hold?: number; color?: "amber" | "green" | "red" } = {},
  105 |   ): Promise<void> {
  106 |     if (!this.demoMode) return;
  107 |     const locator = typeof target === "string" ? this.page.locator(target) : target;
  108 |     const palette = { amber: "#f59e0b", green: "#22c55e", red: "#ef4444" };
  109 |     const color = palette[opts.color ?? "amber"];
  110 |     try {
  111 |       const el = locator.first();
  112 |       await el.scrollIntoViewIfNeeded({ timeout: 2000 });
  113 |       const handle = await el.elementHandle({ timeout: 2000 });
  114 |       if (!handle) return;
```