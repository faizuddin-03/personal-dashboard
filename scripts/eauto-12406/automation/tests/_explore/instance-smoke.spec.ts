// A TOOL. Proves the configured instance (BASE_PATH) accepts our UCD and BO
// logins before anything is seeded there. Read-only.
//
//   TEST_ENV=preprod1 npm run probe -- --grep "instance smoke"

import { test } from "@fixtures";
import * as fs from "node:fs";
import * as path from "node:path";
import { LoginPage } from "@auth/login";
import { instance } from "@config/environments";
import type { PersonaKey } from "@config/personas";

const OUT = path.join(__dirname, "..", "..", "explore-output", "instance-smoke");

for (const who of ["ucdE2E", "ucdE2E2", "bo"] as PersonaKey[]) {
  test(`instance smoke — ${who}`, async ({ page }) => {
    fs.mkdirSync(OUT, { recursive: true });
    await new LoginPage(page).as(who);
    console.log(`  ${who} on /${instance()}: ${page.url()}`);
    const head = (await page.locator("body").innerText()).replace(/\s+/g, " ").slice(0, 300);
    console.log(`  ${head}`);
    await page.screenshot({ path: path.join(OUT, `${instance()}-${who}.png`) });
  });
}
