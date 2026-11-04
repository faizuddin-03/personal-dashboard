/**
 * CIBO — login (`<CIBO root>auth/login`; `/cibo/login` redirects there): Bintang Prospek logo, "Welcome!",
 * Login ID + Password (two inputs with no id / name: first = Login ID, second = Password), the Login button
 * disabled until both are filled; lands on `/cibo/dashboard`, "Welcome, Test Admin." [walk 28.10.2026;
 * cr/EAINT-12406/03-spec/before-walk/cibo-lib.mjs `ciboLogin`].
 *
 * Opening a deep link with a saved session bounced to the dashboard, so a run signs in each time and then
 * CLICKS the sidebar (`cibo-sidebar.page.ts`). A browser profile can autofill the password box: both boxes
 * are cleared before typing [walk 28.10.2026].
 */

import type { Page } from "@playwright/test";
import { step } from "@fixtures/step";
import { assertSafeCibo, ciboURL } from "@config/environments";
import { credentials, persona, type PersonaKey } from "@config/personas";
import { CiboPage } from "./cibo.page";

export const CIBO_LOGIN_PATH = "auth/login";

/** Which CIBO persona each tab last signed in as with the form (a page object is made afresh per call). */
const signedInAs = new WeakMap<Page, PersonaKey>();

export class CiboLoginPage extends CiboPage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Sign in as a CIBO persona (default `cibo`). The CIBO guard runs before the password is typed.
   *
   * A second sign-in in the same tab: the CIBO session outlives `context.clearCookies()` (it is not only a cookie),
   * so the login page draws its boxes for a moment and then bounces to the dashboard; filling the Login ID box then
   * waited 90 s on a box that kept detaching (run eaint-12406-retest-sretest-20261030-0040-C-c2, 12406_RG_TS1's second
   * look-up; failure screenshot = CIBO dashboard "Welcome, Test Admin.", triage 30.10.2026). So: wait until the page
   * either stays on the login form or lands on the dashboard. Landing on the dashboard is accepted ONLY when this same
   * tab signed in as this same persona before (`signedInAs`); any other session is refused, never used.
   * Returns "form" (signed in with the form) or "kept" (this tab's own earlier session was still on).
   */
  @step("Sign in to CIBO")
  async as(key: PersonaKey = "cibo"): Promise<"form" | "kept"> {
    const who = persona(key);
    if (who.portal !== "cibo") throw new Error(`Persona "${key}" is a ${who.portal} login, not a CIBO one.`);
    const { username, password } = credentials(key);
    await this.page.goto(ciboURL(CIBO_LOGIN_PATH), { waitUntil: "domcontentloaded" });
    await this.page.waitForURL(/\/(auth\/login|dashboard)/, { timeout: 60_000 });
    assertSafeCibo(this.page.url());
    const boxes = this.page.locator("input").filter({ visible: true });
    const onDashboard = () => /\/dashboard/.test(this.page.url());
    // The login form counts as ready once the Password box has stayed visible on /auth/login for 2 s.
    let form = false;
    for (const t0 = Date.now(); Date.now() - t0 < 60_000 && !onDashboard(); ) {
      if (await boxes.nth(1).isVisible().catch(() => false)) {
        await this.page.waitForTimeout(2000);
        if (!onDashboard() && /\/auth\/login/.test(this.page.url()) && (await boxes.nth(1).isVisible().catch(() => false))) {
          form = true;
          break;
        }
      } else await this.page.waitForTimeout(500);
    }
    if (!form) {
      if (await this.keptSession(key)) return "kept";
      await this.requireVisible(boxes.nth(1), "CIBO Password box", 1_000);
    }
    try {
      await boxes.nth(0).fill("", { timeout: 15_000 });
      await boxes.nth(0).fill(username, { timeout: 15_000 });
      await boxes.nth(1).fill("", { timeout: 15_000 });
      await boxes.nth(1).fill(password, { timeout: 15_000 });
    } catch (e) {
      // The bounce came after the 2 s: the boxes detached while typing.
      await this.page.waitForURL(/\/dashboard/, { timeout: 10_000 }).catch(() => undefined);
      if (await this.keptSession(key)) return "kept";
      throw e;
    }
    const login = this.page.getByRole("button", { name: /^\s*Login\s*$/ }).filter({ visible: true }).first();
    await login.click();
    await this.page.waitForURL(/\/dashboard/, { timeout: 60_000 }).catch(() => undefined);
    if (!(await this.isSignedIn())) {
      throw new Error(`Signing in to CIBO as "${key}" did not reach the dashboard (landed on ${this.page.url()}). Check ${who.usernameEnv} / ${who.passwordEnv}.`);
    }
    signedInAs.set(this.page, key);
    await this.settle(60_000);
    return "form";
  }

  /**
   * The login page bounced to a signed-in dashboard: true (and settled) when THIS tab signed in as `key` before;
   * throws when it is someone else's session; false when the page is not a signed-in dashboard.
   */
  private async keptSession(key: PersonaKey): Promise<boolean> {
    if (!/\/dashboard/.test(this.page.url()) || !(await this.isSignedIn())) return false;
    assertSafeCibo(this.page.url());
    const before = signedInAs.get(this.page);
    if (before !== key)
      throw new Error(`CIBO opened already signed in (landed on ${this.page.url()}), but this tab never signed in as "${key}" (${before ? `it signed in as "${before}"` : "no earlier sign-in"}): refusing to use a session of unknown origin.`);
    await this.settle(60_000);
    return true;
  }

  /** True on a signed-in CIBO page: the sidebar is drawn (its Dashboard link; the text may be collapsed to icons). */
  async isSignedIn(): Promise<boolean> {
    return this.page
      .locator(`a[href$="/dashboard"]`)
      .first()
      .waitFor({ state: "attached", timeout: 15_000 })
      .then(() => !/\/auth\/login/.test(this.page.url()))
      .catch(() => false);
  }

  /** The dashboard greeting, e.g. "Welcome, Test Admin." Reads only. */
  async welcome(): Promise<string> {
    return (/Welcome,[^\n.]*\.?/.exec(await this.page.locator("body").innerText()) || [""])[0];
  }
}
