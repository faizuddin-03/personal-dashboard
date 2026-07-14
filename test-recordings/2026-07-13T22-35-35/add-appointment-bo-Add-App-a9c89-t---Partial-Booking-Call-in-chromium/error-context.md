# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: add-appointment-bo.spec.ts >> Add Appointment (BO) >> Add Appointment - Partial Booking Call-in
- Location: tests\service-hub\specs\add-appointment-bo.spec.ts:78:7

# Error details

```
Error: BO login did not leave the login page — check the BO credentials.

expect(page).not.toHaveURL(expected) failed

Expected pattern: not /\/public\/login/i
Received string: ""

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