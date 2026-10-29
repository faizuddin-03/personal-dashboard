# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: reschedule-handling.spec.ts >> Reschedule & Handling >> UCD >> Reschedule on the day of the initial appointment to a future date
- Location: tests\service-hub\specs\reschedule-handling.spec.ts:41:9

# Error details

```
TimeoutError: locator.waitFor: Timeout 5000ms exceeded.
Call log:
  - waiting for locator('.ui-dialog') to be visible

```

# Page snapshot

```yaml
- generic [ref=e1]:
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
      - generic [ref=e25]: Incomplete appointment allocation. Please select a date and time slot to each software installation.
      - generic [ref=e26]:
        - generic [ref=e27]: Please select a date to schedule the software installation
        - generic [ref=e28]:
          - generic [ref=e29]: July 2026
          - generic [ref=e30] [cursor=pointer]: ›
      - table [ref=e31]:
        - rowgroup [ref=e32]:
          - row "MON TUE WED THUR FRI SAT SUN" [ref=e33]:
            - columnheader "MON" [ref=e34]
            - columnheader "TUE" [ref=e35]
            - columnheader "WED" [ref=e36]
            - columnheader "THUR" [ref=e37]
            - columnheader "FRI" [ref=e38]
            - columnheader "SAT" [ref=e39]
            - columnheader "SUN" [ref=e40]
        - rowgroup [ref=e41]:
          - row "29 30 1 2 3 4 5" [ref=e42]:
            - cell "29" [ref=e43]
            - cell "30" [ref=e44]
            - cell "1" [ref=e45]
            - cell "2" [ref=e46]
            - cell "3" [ref=e47]
            - cell "4" [ref=e48]
            - cell "5" [ref=e49]
          - row "6 7 8 9 10 11 12" [ref=e50]:
            - cell "6" [ref=e51]
            - cell "7" [ref=e52]
            - cell "8" [ref=e53]
            - cell "9" [ref=e54]
            - cell "10" [ref=e55]
            - cell "11" [ref=e56]
            - cell "12" [ref=e57]
          - row "13 14 15 16 17 18 19" [ref=e58]:
            - cell "13" [ref=e59]
            - cell "14" [ref=e60]
            - cell "15" [ref=e61]
            - cell "16" [ref=e62]
            - cell "17" [ref=e63]:
              - generic [ref=e64]: "17"
            - cell "18" [ref=e65]
            - cell "19" [ref=e66]
          - row "20 21 Full 22 Full 23 2 Available 24 6 Available 25 26" [ref=e67]:
            - cell "20" [ref=e68]
            - cell "21 Full" [ref=e69]:
              - text: "21"
              - generic [ref=e71]: Full
            - cell "22 Full" [ref=e72]:
              - text: "22"
              - generic [ref=e74]: Full
            - cell "23 2 Available" [ref=e75] [cursor=pointer]:
              - text: "23"
              - generic [ref=e77]: 2 Available
            - cell "24 6 Available" [ref=e78] [cursor=pointer]:
              - text: "24"
              - generic [ref=e80]: 6 Available
            - cell "25" [ref=e81]
            - cell "26" [ref=e82]
          - row "27 6 Available 28 6 Available 29 6 Available 30 6 Available 31 Full 1 2" [ref=e83]:
            - cell "27 6 Available" [ref=e84] [cursor=pointer]:
              - text: "27"
              - generic [ref=e86]: 6 Available
            - cell "28 6 Available" [ref=e87] [cursor=pointer]:
              - text: "28"
              - generic [ref=e89]: 6 Available
            - cell "29 6 Available" [ref=e90] [cursor=pointer]:
              - text: "29"
              - generic [ref=e92]: 6 Available
            - cell "30 6 Available" [ref=e93] [cursor=pointer]:
              - text: "30"
              - generic [ref=e95]: 6 Available
            - cell "31 Full" [ref=e96]:
              - text: "31"
              - generic [ref=e98]: Full
            - cell "1" [ref=e99]
            - cell "2" [ref=e100]
      - generic [ref=e102]:
        - generic [ref=e103]: Booked 0 of 1 appointment(s).
        - button "Confirm Appointment" [active] [ref=e105]
  - generic [ref=e106]:
    - generic [ref=e107]:
      - button "HOME" [ref=e108] [cursor=pointer]
      - button "INSURANCE" [ref=e109] [cursor=pointer]
      - button "REPORTS" [ref=e110] [cursor=pointer]
      - button "SETTINGS" [ref=e111] [cursor=pointer]
      - button "USER GUIDE" [ref=e112] [cursor=pointer]
      - button "DOWNLOAD" [ref=e113] [cursor=pointer]
      - button "CONTACT US" [ref=e114] [cursor=pointer]
    - table [ref=e115]:
      - rowgroup [ref=e116]:
        - row "Online Services - Service Hub MUHAMMAD FAIZUDDIN BIN BIDI | Logout" [ref=e117]:
          - cell "Online Services - Service Hub" [ref=e118]
          - cell "MUHAMMAD FAIZUDDIN BIN BIDI | Logout" [ref=e119]:
            - list [ref=e120]:
              - listitem [ref=e121]:
                - img [ref=e122]
                - text: MUHAMMAD FAIZUDDIN BIN BIDI
              - listitem [ref=e123]: "|"
              - listitem [ref=e124]:
                - link "Logout" [ref=e125] [cursor=pointer]:
                  - /url: "#"
  - img [ref=e127]
  - generic [ref=e128]:
    - generic [ref=e130]:
      - generic [ref=e131]:
        - link "Contact Us" [ref=e132] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e133]: "|"
        - link "Terms & Conditions" [ref=e134] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e135]: "|"
        - link "Privacy" [ref=e136] [cursor=pointer]:
          - /url: "#"
      - generic [ref=e137]: Best Compatible With Mozilla Firefox V36.0.4
      - generic [ref=e138]: Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved.
    - img [ref=e140]
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
  14  |     const url = `${this.baseUrl}${path}`;
  15  |     try {
  16  |       await this.page.goto(url, { waitUntil: "networkidle" });
  17  |     } catch {
  18  |       // Legacy portals occasionally abort the initial request (a redirect
  19  |       // race right after login) or never reach networkidle. Retry once with
  20  |       // a load-based wait, then best-effort settle.
  21  |       await this.page.goto(url, { waitUntil: "domcontentloaded" });
  22  |       await this.page.waitForLoadState("networkidle").catch(() => {});
  23  |     }
  24  |   }
  25  | 
  26  |   async waitForNav() {
  27  |     await this.page.waitForLoadState("networkidle");
  28  |   }
  29  | 
  30  |   /**
  31  |    * The transaction identifier from the current URL's query string, as a
  32  |    * ready-to-reuse "key=value" pair (e.g. "txnId=232", "transactionId=a23be953-...",
  33  |    * or "id=4d7196b0-...").
  34  |    *
  35  |    * The app used to redirect with `?txnId=<number>`, then a deployment
  36  |    * changed it to `?transactionId=<uuid>`, and a later one changed it AGAIN
  37  |    * to plain `?id=<uuid>` (confirmed live on SIT2 — same destination page,
  38  |    * just a different id scheme each time). Rather than hardcode one param
  39  |    * name, this returns whichever is actually present, INCLUDING its key, so
  40  |    * callers can splice it straight into a follow-up URL (`?${txnId}`)
  41  |    * without needing to know or guess which scheme this particular record
  42  |    * uses. "id" is checked first since it's the current scheme.
  43  |    */
  44  |   getTxnIdFromUrl(): string {
  45  |     const url = new URL(this.page.url());
  46  |     for (const key of ["id", "txnId", "transactionId"]) {
  47  |       const value = url.searchParams.get(key);
  48  |       if (value) return `${key}=${value}`;
  49  |     }
  50  |     return "";
  51  |   }
  52  | 
  53  |   /** Accept the jQuery UI confirmation dialog (clicks the "Yes" button) */
  54  |   async acceptConfirmDialog() {
  55  |     await this.page.locator(".confirm-dialog-btn").click();
  56  |   }
  57  | 
  58  |   /** Dismiss the jQuery UI confirmation dialog (clicks the "No" button) */
  59  |   async dismissConfirmDialog() {
  60  |     await this.page.locator(".cancel-dialog-btn").click();
  61  |   }
  62  | 
  63  |   /** Wait for the jQuery UI dialog to appear */
  64  |   async waitForDialog() {
> 65  |     await this.page.locator(".ui-dialog").waitFor({ state: "visible", timeout: 5000 });
      |                                           ^ TimeoutError: locator.waitFor: Timeout 5000ms exceeded.
  66  |   }
  67  | 
  68  |   today(): string {
  69  |     return new Date().toISOString().split("T")[0];
  70  |   }
  71  | 
  72  |   daysFromToday(n: number): string {
  73  |     const d = new Date();
  74  |     d.setDate(d.getDate() + n);
  75  |     return d.toISOString().split("T")[0];
  76  |   }
  77  | 
  78  |   earliestRescheduleDate(): string {
  79  |     return this.daysFromToday(ENV.reschedule.blackoutDays);
  80  |   }
  81  | 
  82  |   /** Yesterday — a "previous" date, ISO yyyy-mm-dd. */
  83  |   yesterday(): string {
  84  |     return this.daysFromToday(-1);
  85  |   }
  86  | 
  87  |   /** The next Saturday strictly after today, ISO yyyy-mm-dd (a weekend date). */
  88  |   nextWeekend(): string {
  89  |     const d = new Date();
  90  |     do {
  91  |       d.setDate(d.getDate() + 1);
  92  |     } while (d.getDay() !== 6); // 0 = Sun, 6 = Sat
  93  |     return d.toISOString().split("T")[0];
  94  |   }
  95  | 
  96  |   /** A date `months` months ahead of today, ISO yyyy-mm-dd. */
  97  |   dateMonthsAhead(months: number): string {
  98  |     const d = new Date();
  99  |     d.setMonth(d.getMonth() + months);
  100 |     return d.toISOString().split("T")[0];
  101 |   }
  102 | 
  103 |   // ──────────────────────────────────────────────────────────────
  104 |   // Demo mode — slow, highlighted playback for human-reviewable
  105 |   // recordings. Enabled via PW_DEMO=1 (the runner UI's "Demo mode"
  106 |   // toggle, default on). When off, every helper below is a no-op so
  107 |   // normal/CI runs stay fast. Highlighting is best-effort and must
  108 |   // never fail a test.
  109 |   // ──────────────────────────────────────────────────────────────
  110 | 
  111 |   private _demoSuppressed = 0;
  112 | 
  113 |   protected get demoMode(): boolean {
  114 |     return process.env.PW_DETAILED === "1" && this._demoSuppressed === 0;
  115 |   }
  116 | 
  117 |   /**
  118 |    * Run `fn` with demo highlighting/pauses temporarily suppressed. Wrap
  119 |    * calendar scans (finders that open/close many modals just to inspect)
  120 |    * in this so they stay fast and don't flood the recording with pulses on
  121 |    * dates the test never actually acts on.
  122 |    */
  123 |   protected async suppressDemo<T>(fn: () => Promise<T>): Promise<T> {
  124 |     this._demoSuppressed++;
  125 |     try {
  126 |       return await fn();
  127 |     } finally {
  128 |       this._demoSuppressed--;
  129 |     }
  130 |   }
  131 | 
  132 |   /** Default pause between steps, in ms (PW_DETAILED_DELAY overrides). */
  133 |   protected get demoDelay(): number {
  134 |     return Number(process.env.PW_DETAILED_DELAY || 1400);
  135 |   }
  136 | 
  137 |   /** Pause (demo mode only) so a human watching the recording can keep up. */
  138 |   async demoPause(ms?: number): Promise<void> {
  139 |     if (!this.demoMode) return;
  140 |     await this.page.waitForTimeout(ms ?? this.demoDelay);
  141 |   }
  142 | 
  143 |   /**
  144 |    * Highlight an element in the recording (demo mode only): scroll it into
  145 |    * view, draw a temporary amber outline, hold for `hold` ms, then restore.
  146 |    * `color` lets callers distinguish intent — amber (default) for "about to
  147 |    * act on this", green for "here is the result to check". No-op when demo
  148 |    * mode is off. Never throws.
  149 |    */
  150 |   async demoHighlight(
  151 |     target: Locator | string,
  152 |     opts: { hold?: number; color?: "amber" | "green" | "red" } = {},
  153 |   ): Promise<void> {
  154 |     if (!this.demoMode) return;
  155 |     const locator = typeof target === "string" ? this.page.locator(target) : target;
  156 |     const palette = { amber: "#f59e0b", green: "#22c55e", red: "#ef4444" };
  157 |     const color = palette[opts.color ?? "amber"];
  158 |     try {
  159 |       const el = locator.first();
  160 |       await el.scrollIntoViewIfNeeded({ timeout: 2000 });
  161 |       const handle = await el.elementHandle({ timeout: 2000 });
  162 |       if (!handle) return;
  163 |       await this.page.evaluate(
  164 |         ({ node, c }) => {
  165 |           (node as any).__demoPrevOutline = node.style.outline;
```