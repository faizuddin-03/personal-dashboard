import type { Page } from "@playwright/test";
import { assertSafeToAuthenticate, baseURL, loginPath } from "@config/environments";
import { credentials, persona, type PersonaKey } from "@config/personas";
import { step } from "@fixtures/step";
import { claimPersonaLane } from "@fixtures/lane-guard";

/**
 * The portal login screen.
 *
 * Selectors read off the live page on 2026-09-15, not guessed. The form posts
 * with method GET and mirrors the visible fields into hidden `loginUsername` /
 * `loginPassword` inputs, so the visible fields must be filled through the UI
 * rather than set directly.
 */
export class LoginPage {
  constructor(private readonly page: Page) {}

  /**
   * Sign in as a named persona.
   *
   * The environment guard runs BEFORE any password is typed. A redirect that
   * lands the run on another instance shows an identical login form, and that
   * is how a QA password reaches production (qa-principles #13).
   */
  @step("Sign in")
  async as(key: PersonaKey): Promise<void> {
    const who = persona(key);
    const { username, password } = credentials(key);
    // another lane's dealer (UCD to UCD buyer, ...) -> this run must hold that lane too (lane-guard.ts)
    claimPersonaLane(key);

    // Two attempts, and the second ONLY when staging answered the login with a blank page on the login URL: seen
    // when two lanes sign in at the same second (21.10.2026, lanes 5 / 6 / 10). A refused password shows the login
    // form with its message, is not blank, and still fails at once.
    for (let attempt = 1; attempt <= 2; attempt++) {
      await this.page.goto(loginPath(), { waitUntil: "domcontentloaded" });
      assertSafeToAuthenticate(this.page.url());

      await this.page.fill("#form-username", username);
      await this.page.fill("#form-password", password);
      await this.page.click("button.to-login");
      await this.page.waitForLoadState("networkidle").catch(() => undefined);
      if (await this.isSignedIn()) return;
      const blank = /\/public\/login\/?/.test(this.page.url())
        && !((await this.page.locator("body").innerText().catch(() => "")) || "").trim();
      if (!blank) break;
      await this.page.waitForTimeout(3_000);
    }

    if (!(await this.isSignedIn())) {
      throw new Error(
        `Signing in as "${key}" (${who.role}) did not reach a signed-in page. ` +
          `Landed on ${this.page.url()}. Check ${who.usernameEnv} / ${who.passwordEnv}.`,
      );
    }
  }

  /**
   * Sign in as a persona and say where it landed, without failing on a new user's first-login pages (22.10.2026,
   * EAINT-12253 AzfarCo6): "home" (signed in), "activation" (`/public/activation/`, Account Activation: MyKad +
   * thumbprint, lane probe s15 / p04), "password" (`/public/password/`, the first-login password change, s05 / p04),
   * or "other" (the address is in the error a caller writes). Same environment guard and lane rule as `as()`.
   */
  @step("Sign in (first login allowed)")
  async attempt(key: PersonaKey): Promise<"home" | "activation" | "password" | "other"> {
    const { username, password } = credentials(key);
    claimPersonaLane(key);
    await this.page.goto(loginPath(), { waitUntil: "domcontentloaded" });
    assertSafeToAuthenticate(this.page.url());
    await this.page.fill("#form-username", username);
    await this.page.fill("#form-password", password);
    await this.page.click("button.to-login");
    await this.page.waitForLoadState("networkidle").catch(() => undefined);
    for (let i = 0; i < 20; i++) {
      if (/\/public\/activation\//.test(this.page.url())) return "activation";
      if (/\/public\/password\//.test(this.page.url())) return "password";
      if (await this.isSignedIn()) return "home";
      await this.page.waitForTimeout(1_000);
    }
    return "other";
  }

  /**
   * On the first-login password page (`/public/password/`, "Please change your password": 12+ chars, upper, lower,
   * digit, special): both password boxes, then Save (lane probe s05 on Co1-Co5 21.10.2026, p04 STEP=login). True when
   * the page left `/public/password/` or said it succeeded. Run it inside `ts.allowConfirm()` when the TS harness is on.
   */
  async changeFirstLoginPassword(newPassword: string): Promise<boolean> {
    if (!/\/public\/password\//.test(this.page.url())) return false;
    const boxes = this.page.locator("input[type=password]");
    await boxes.nth(0).fill(newPassword);
    await boxes.nth(1).fill(newPassword);
    await this.page.getByRole("button", { name: /Save/ }).click();
    await this.page.waitForLoadState("networkidle").catch(() => undefined);
    await this.page.waitForTimeout(3_000);
    const body = await this.page.locator("body").innerText().catch(() => "");
    return !/\/public\/password\//.test(this.page.url()) || /success/i.test(body);
  }

  /** True once a signed-in page is showing. Logout is on every portal chrome. */
  async isSignedIn(): Promise<boolean> {
    return this.page
      .locator("text=Logout")
      .first()
      .isVisible()
      .catch(() => false);
  }

  /** Where a login attempt would go, for an error message that names it. */
  target(): string {
    return `${baseURL() ?? "(BASE_URL unset)"}${loginPath()}`;
  }
}
