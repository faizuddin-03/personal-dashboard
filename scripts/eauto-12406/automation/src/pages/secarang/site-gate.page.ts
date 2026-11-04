/**
 * Secarang — the staging SITE password page ("Login Page": one Password field with an eye icon, Login disabled
 * until it is filled) [W 28.10.2026]. A route guard sends every /ia/ page to `/ia/auth/login?returnUrl=…` until
 * the password is given, and the password is kept PER TAB: a link that opens a new tab shows the page again [W].
 * It also comes back on the Fiuu popup's return and on the success page [doc §2, §13; F].
 *
 * Ported from Faizuddin's SiteGatePage (secarang-insurance, commit c9aab16), with his OK, 28.10.2026. Changed:
 * the password comes from SECARANG_SITE_PASSWORD only (his config held a fallback value; not carried over), and
 * it is typed only after `assertSafeSecarangGate` has checked the host and instance (the /preprod/ trap).
 * Selectors: password input + "Login" button [W: cr/EAINT-12406/03-spec/before-walk/cibo-lib.mjs `siteGate`].
 */

import type { Page } from "@playwright/test";
import { step } from "@fixtures/step";
import { assertSafeSecarangGate } from "@config/environments";
import { secarangSitePassword } from "@config/personas";
import { SecarangPage } from "./secarang.page";

export class SecarangSiteGatePage extends SecarangPage {
  constructor(page: Page) {
    super(page);
  }

  passwordInput() {
    return this.page.locator("input[type=password]").filter({ visible: true }).first();
  }

  /** True when this tab shows the site password page. */
  async isShown(): Promise<boolean> {
    return /\/auth\/login/.test(this.page.url()) && (await this.passwordInput().isVisible().catch(() => false));
  }

  /**
   * Give the site password if this tab is on the password page; true when it was given. Waits for the guard to
   * let the tab through (the address leaves `/auth/login`). The value is never logged.
   */
  @step("Pass the Secarang site password page")
  async passIfShown(): Promise<boolean> {
    await this.page.waitForLoadState("domcontentloaded").catch(() => undefined);
    // The guard redirects after the app boots; give it a moment before deciding there is no gate.
    await this.passwordInput().waitFor({ state: "visible", timeout: 5_000 }).catch(() => undefined);
    if (!(await this.isShown())) return false;
    assertSafeSecarangGate(this.page.url());
    await this.passwordInput().fill(secarangSitePassword());
    const login = this.page.getByRole("button", { name: /^\s*Login\s*$/i }).filter({ visible: true }).first();
    await login.click();
    await this.page.waitForURL((u) => !/\/auth\/login/.test(u.pathname), { timeout: 60_000 }).catch(() => undefined);
    if (await this.isShown()) {
      throw new Error(`The Secarang site password page is still showing after Login (${this.page.url()}): wrong SECARANG_SITE_PASSWORD?`);
    }
    await this.page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => undefined);
    return true;
  }
}
