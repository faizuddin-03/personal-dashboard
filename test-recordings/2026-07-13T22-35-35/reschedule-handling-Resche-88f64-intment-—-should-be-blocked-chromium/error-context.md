# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: reschedule-handling.spec.ts >> Reschedule & Handling >> UCD >> Reschedule cancelled appointment — should be blocked
- Location: tests\service-hub\specs\reschedule-handling.spec.ts:252:9

# Error details

```
Error: BO login did not leave the login page — check the BO credentials.

expect(page).not.toHaveURL(expected) failed

Expected pattern: not /\/public\/login/i
Received string: ""

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
  1  | import { type Page, expect } from "@playwright/test";
  2  | import { BasePage } from "./BasePage";
  3  | import { PATHS } from "../utils/config";
  4  | 
  5  | export class LoginPage extends BasePage {
  6  |   readonly usernameInput = this.page.locator('input[type="text"]').first();
  7  |   readonly passwordInput = this.page.locator('input[type="password"]').first();
  8  |   readonly loginButton = this.page.locator('button[type="submit"], input[type="submit"]').first();
  9  | 
  10 |   constructor(page: Page) {
  11 |     super(page);
  12 |   }
  13 | 
  14 |   async navigate() {
  15 |     await this.goto(PATHS.login);
  16 |   }
  17 | 
  18 |   async login(username: string, password: string) {
  19 |     await this.navigate();
  20 |     await this.usernameInput.fill(username);
  21 |     await this.passwordInput.fill(password);
  22 |     await this.loginButton.click();
  23 |     // Submitting login kicks off a redirect chain to the portal home.
  24 |     // Returning before that fully settles lets a later goto() race the
  25 |     // in-flight redirect and land on the home page instead of the target
  26 |     // (which is exactly what made the BO listing/calendar navigations fail).
  27 |     // So wait until we've actually left the login page, then let it settle.
  28 |     await this.page
  29 |       .waitForURL((u) => !/\/public\/login/i.test(u.toString()), { timeout: 20000 })
  30 |       .catch(() => {});
  31 |     await this.page.waitForLoadState("networkidle").catch(() => {});
  32 |   }
  33 | 
  34 |   async loginAsUCD(username: string, password: string) {
  35 |     await this.login(username, password);
  36 |     await expect(this.page).toHaveURL(new RegExp(PATHS.ucdHome));
  37 |   }
  38 | 
  39 |   async loginAsBO(username: string, password: string) {
  40 |     await this.login(username, password);
  41 |     // Fail fast with a clear message if we're still on the login page
  42 |     // (e.g. wrong BO credentials) rather than timing out later on a
  43 |     // listing selector that isn't there.
  44 |     await expect(this.page, "BO login did not leave the login page — check the BO credentials.")
> 45 |       .not.toHaveURL(/\/public\/login/i);
     |            ^ Error: BO login did not leave the login page — check the BO credentials.
  46 |   }
  47 | }
  48 | 
```