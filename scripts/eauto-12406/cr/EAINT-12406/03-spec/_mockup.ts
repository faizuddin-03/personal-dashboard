// EAINT-12406: the Secarang mockup (00-input/Mock Up_EAINT-12406_Secarang_20261015.html, SRD §1.5 #4) opened in
// the TS's own tab, so 12406_CP_TS6 can put each changed block beside the mockup's in one video.
// Selectors read from the mockup file itself (a static page with three sections #about-us, #faqs, #support switched
// by the header links a[data-page]; the changed blocks are drawn open). Not a spec: imported by
// 1-secarang-pages.func.cr.spec.ts only.
import * as path from "node:path";
import { pathToFileURL } from "node:url";
import type { Locator, Page } from "@playwright/test";

export const SECARANG_MOCKUP = path.resolve(__dirname, "..", "00-input", "Mock Up_EAINT-12406_Secarang_20261015.html");

export type MockupPage = "about-us" | "faqs" | "support";

/** Open the mockup on one of its three pages (in the current tab). */
export async function openMockup(page: Page, which: MockupPage): Promise<void> {
  if (!page.url().startsWith("file:")) {
    await page.goto(pathToFileURL(SECARANG_MOCKUP).toString());
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
  }
  await page.locator(`header nav a[data-page="${which}"]`).click();
  await page.locator(`section#${which}.show`).waitFor({ state: "visible", timeout: 10_000 });
}

/** About Us: the paragraph under "Our partnership". */
export const mockupPartnership = (page: Page): Locator =>
  page.locator("section#about-us h2", { hasText: "Our partnership" }).locator("xpath=following-sibling::p[1]");

/** FAQs: the "Which insurers can I get instant quotation from?" item (drawn open). */
export const mockupFaqWhichInsurers = (page: Page): Locator =>
  page.locator("section#faqs .item.faq", { hasText: "Which insurers can I get instant quotation from?" }).first();

/** Support: the Allianz item (drawn open). */
export const mockupSupportAllianz = (page: Page): Locator =>
  page.locator("section#support .acc .item", { hasText: "Allianz General Insurance Company (Malaysia) Berhad" }).first();
