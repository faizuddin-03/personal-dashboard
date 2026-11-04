// A TOOL. READ ONLY. Lists BO menu links that look like reports.
import { test } from "@fixtures";
import { LoginPage } from "@auth/login";
test("BO report links", async ({ page }) => {
  await new LoginPage(page).as("bo");
  const links = await page.evaluate(() => Array.from(document.querySelectorAll("a")).map((a) => `${(a.textContent || "").trim().replace(/\s+/g, " ")} -> ${a.getAttribute("href")}`).filter((l) => /report|reconcil|summary|listing/i.test(l)));
  console.log(links.join("\n"));
});
