import { type Page, expect, test } from "@playwright/test";
import { BasePage } from "./BasePage";
import { PATHS } from "../utils/config";

export class LoginPage extends BasePage {
  readonly usernameInput = this.page.locator('input[type="text"]').first();
  readonly passwordInput = this.page.locator('input[type="password"]').first();
  readonly loginButton = this.page.locator('button[type="submit"], input[type="submit"]').first();

  constructor(page: Page) {
    super(page);
  }

  async navigate() {
    await this.goto(PATHS.login);
  }

  async login(username: string, password: string) {
    await this.navigate();
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    // Submitting login kicks off a redirect chain to the portal home.
    // Returning before that fully settles lets a later goto() race the
    // in-flight redirect and land on the home page instead of the target
    // (which is exactly what made the BO listing/calendar navigations fail).
    // So wait until we've actually left the login page, then let it settle.
    await this.page
      .waitForURL((u) => !/\/public\/login/i.test(u.toString()), { timeout: 20000 })
      .catch(() => {});
    await this.page.waitForLoadState("networkidle").catch(() => {});
  }

  async loginAsUCD(username: string, password: string) {
    await test.step("Log in as UCD", async () => {
      await this.login(username, password);
      await expect(this.page).toHaveURL(new RegExp(PATHS.ucdHome));
    });
  }

  async loginAsBO(username: string, password: string) {
    await test.step("Log in as BO", async () => {
      await this.login(username, password);
      // Fail fast with a clear message if we're still on the login page
      // (e.g. wrong BO credentials) rather than timing out later on a
      // listing selector that isn't there.
      await expect(this.page, "BO login did not leave the login page — check the BO credentials.")
        .not.toHaveURL(/\/public\/login/i);
    });
  }
}
