# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: reschedule-handling.spec.ts >> Reschedule & Handling >> UCD >> Reschedule on the day of the initial appointment to a future date
- Location: tests\service-hub\specs\reschedule-handling.spec.ts:20:9

# Error details

```
Error: locator.fill: Target page, context or browser has been closed
Call log:
  - waiting for locator('input[type="text"]').first()

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
> 20 |     await this.usernameInput.fill(username);
     |                              ^ Error: locator.fill: Target page, context or browser has been closed
  21 |     await this.passwordInput.fill(password);
  22 |     await this.loginButton.click();
  23 |     await this.waitForNav();
  24 |   }
  25 | 
  26 |   async loginAsUCD(username: string, password: string) {
  27 |     await this.login(username, password);
  28 |     await expect(this.page).toHaveURL(new RegExp(PATHS.ucdHome));
  29 |   }
  30 | 
  31 |   async loginAsBO(username: string, password: string) {
  32 |     await this.login(username, password);
  33 |     // BO may land on a different home — adjust regex once verified
  34 |     await this.waitForNav();
  35 |   }
  36 | }
  37 | 
```