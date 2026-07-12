import { type Page, expect } from "@playwright/test";
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
    await this.waitForNav();
  }

  async loginAsUCD(username: string, password: string) {
    await this.login(username, password);
    await expect(this.page).toHaveURL(new RegExp(PATHS.ucdHome));
  }

  async loginAsBO(username: string, password: string) {
    await this.login(username, password);
    // BO may land on a different home — adjust regex once verified
    await this.waitForNav();
  }
}
