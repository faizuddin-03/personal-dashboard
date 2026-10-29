/**
 * BackOffice login for a specific eAuto instance.
 *
 * The gotcha this guards against: reaching the login page by REDIRECT lands on
 * the central login at www.eauto.my, and a successful submit there does not
 * produce an instance session — every later navigation quietly bounces back to
 * the form while the script still reports "logged in". So always go to the
 * instance login directly, and assert we are off the form afterwards. A silent
 * auth failure otherwise reads as "the screen doesn't exist".
 */
import { expect, type Page } from "@playwright/test";
import { loginUrl, type Actor } from "./env";

export async function login(page: Page, actor: Actor, who: string): Promise<void> {
  if (!actor.user || !actor.pass) {
    throw new Error(`No ${who} credentials were supplied — set them on the dashboard before running.`);
  }
  await page.goto(loginUrl(), { waitUntil: "domcontentloaded" });
  await page.getByRole("textbox", { name: /username/i }).fill(actor.user);
  await page.locator('input[type="password"]').first().fill(actor.pass);
  await page.getByRole("button", { name: /^login$/i }).click();

  await expect(
    page.locator('input[type="password"]'),
    `login as the ${who} (${actor.user}) left us on the form — wrong credentials, or the central-login redirect`,
  ).toHaveCount(0, { timeout: 20_000 });
  await expect(page).not.toHaveURL(/public\/login/);
  console.log(`[login] signed in as the ${who} (${actor.user})`);
}
