# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: reschedule-handling.spec.ts >> Reschedule & Handling >> BO >> BO reschedule Expired Installation
- Location: tests\service-hub\specs\reschedule-handling.spec.ts:674:9

# Error details

```
Error: BO login did not leave the login page — check the BO credentials.

expect(page).not.toHaveURL(expected) failed

Expected pattern: not /\/public\/login/i
Received string: "https://staging.eauto.my/uat1/public/login/"
Timeout: 5000ms

Call log:
  - BO login did not leave the login page — check the BO credentials. with timeout 5000ms
    14 × unexpected value "https://staging.eauto.my/uat1/public/login/"

```

```yaml
- button "Download"
- button "Apply eAuto"
- img "eAuto"
- heading "Welcome to eAuto" [level=1]
- img
- text: "Hotline: 03-27798899"
- heading "Login to eAuto" [level=3]
- form:
  - text: Username
  - textbox "Username"
  - text: Password
  - textbox "Password"
  - checkbox "Remember Password"
  - text: Remember Password
  - button "Login"
- link "Contact Us":
  - /url: "#"
- text: "|"
- link "Terms & Conditions":
  - /url: "#"
- text: "|"
- link "Privacy":
  - /url: "#"
- text: Best Compatible With Mozilla Firefox V36.0.4 Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved.
- img
- dialog "Alert":
  - text: Alert Please check your login name or password and try again...
  - button "OK"
```

# Test source

```ts
  1  | import { type Page, expect, test } from "@playwright/test";
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
  35 |     await test.step("Log in as UCD", async () => {
  36 |       await this.login(username, password);
  37 |       await expect(this.page).toHaveURL(new RegExp(PATHS.ucdHome));
  38 |     });
  39 |   }
  40 | 
  41 |   async loginAsBO(username: string, password: string) {
  42 |     await test.step("Log in as BO", async () => {
  43 |       await this.login(username, password);
  44 |       // Fail fast with a clear message if we're still on the login page
  45 |       // (e.g. wrong BO credentials) rather than timing out later on a
  46 |       // listing selector that isn't there.
  47 |       await expect(this.page, "BO login did not leave the login page — check the BO credentials.")
> 48 |         .not.toHaveURL(/\/public\/login/i);
     |              ^ Error: BO login did not leave the login page — check the BO credentials.
  49 |     });
  50 |   }
  51 | }
  52 | 
```